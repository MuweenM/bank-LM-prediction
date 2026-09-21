"""FastAPI application for term-deposit lead scoring."""

import json
from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from fastapi import FastAPI, File, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator


ROOT = Path(__file__).parents[1]
MODEL_PATH = ROOT / "models" / "final_model.joblib"
META_PATH = ROOT / "models" / "meta.json"
LIMITS = {
    "age": [18, 100],
    "balance": [-20000, 1000000],
    "day": [1, 31],
    "campaign": [1, 60],
    "pdays": [-1, 900],
    "previous": [0, 100],
}
META = {}


class Client(BaseModel):
    age: int = Field(ge=18, le=100)
    job: str
    marital: str
    education: str
    default: str
    balance: float = Field(ge=-20000, le=1000000)
    housing: str
    loan: str
    contact: str
    day: int = Field(ge=1, le=31)
    month: str
    campaign: int = Field(ge=1, le=60)
    pdays: int = Field(ge=-1, le=900)
    previous: int = Field(ge=0, le=100)
    poutcome: str

    @field_validator("job", "marital", "education", "default", "housing", "loan", "contact", "month", "poutcome")
    @classmethod
    def valid_category(cls, value: str, info):
        allowed = META.get("categories", {}).get(info.field_name, [])
        if value not in allowed:
            raise ValueError(f"choose one of: {', '.join(allowed)}")
        return value


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = joblib.load(MODEL_PATH)
    app.state.meta = json.loads(META_PATH.read_text())
    META.clear()
    META.update(app.state.meta)
    yield


app = FastAPI(title="Bank Marketing API", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    errors = {}
    for error in exc.errors():
        location = error.get("loc", ())
        field = next((part for part in reversed(location) if isinstance(part, str) and part != "body"), "body")
        message = error["msg"].removeprefix("Value error, ")
        errors[field] = message
    return JSONResponse(status_code=422, content={"errors": errors})


@app.get("/health")
def health():
    return {"status": "ok", "sklearn": sklearn.__version__}


@app.get("/schema")
def schema(request: Request):
    meta = request.app.state.meta
    return {
        "categories": meta["categories"],
        "limits": LIMITS,
        "band_rates": meta["band_rates"],
        "base_rate": meta["base_rate"],
        "test": meta["test"],
    }


def _score_band(score: float, meta: dict):
    if score >= meta["band_cutoffs"]["high"]:
        return "High"
    if score >= meta["band_cutoffs"]["medium"]:
        return "Medium"
    return "Low"


@app.post("/predict")
def predict(client: Client, request: Request):
    meta = request.app.state.meta
    score = float(request.app.state.model.predict_proba(pd.DataFrame([client.model_dump()]))[0, 1])
    band = _score_band(score, meta)
    advice = {"High": "Prioritize this client for an early call.", "Medium": "Contact this client after high-priority leads.", "Low": "Contact this client when higher-priority leads are covered."}
    return {"score": score, "band": band, "expected_rate": meta["band_rates"][band], "base_rate": meta["base_rate"], "advice": advice[band]}


@app.get("/insights")
def insights():
    path = ROOT / "models" / "insights.json"
    return json.loads(path.read_text()) if path.exists() else {"rules": [], "tree_text": ""}


@app.post("/predict/batch")
def predict_batch(request: Request, file: UploadFile = File(...)):
    data = pd.read_csv(file.file)
    model_columns = request.app.state.meta["raw_numeric"] + request.app.state.meta["raw_categorical"]
    missing = [column for column in model_columns if column not in data.columns]
    if missing:
        return JSONResponse(status_code=422, content={"errors": {"file": f"missing columns: {', '.join(missing)}"}})
    scores = request.app.state.model.predict_proba(data[model_columns])[:, 1]
    result = data.assign(score=scores, band=[_score_band(score, request.app.state.meta) for score in scores])
    return result.sort_values("score", ascending=False).head(500).to_dict(orient="records")


if (ROOT / "frontend" / "dist").exists():
    app.mount("/", StaticFiles(directory=ROOT / "frontend" / "dist", html=True), name="frontend")
