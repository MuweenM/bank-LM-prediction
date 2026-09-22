"""Fake API used while the trained term-deposit model is unavailable."""

from typing import Annotated

from fastapi import FastAPI, File, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="Bank Marketing API (stub)")

CATEGORIES = {
    "job": [
        "admin.",
        "blue-collar",
        "entrepreneur",
        "housemaid",
        "management",
        "retired",
        "self-employed",
        "services",
        "student",
        "technician",
        "unemployed",
        "unknown",
    ],
    "marital": ["divorced", "married", "single"],
    "education": ["primary", "secondary", "tertiary", "unknown"],
    "default": ["no", "yes"],
    "housing": ["no", "yes"],
    "loan": ["no", "yes"],
    "contact": ["cellular", "telephone", "unknown"],
    "month": [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
    ],
    "poutcome": ["failure", "other", "success", "unknown"],
}

LIMITS = {
    "age": [18, 100],
    "balance": [-20000, 1000000],
    "day": [1, 31],
    "campaign": [1, 60],
    "pdays": [-1, 900],
    "previous": [0, 100],
}

BAND_RATES = {"High": 0.31, "Medium": 0.14, "Low": 0.04}


class PredictionRequest(BaseModel):
    age: Annotated[int, Field(ge=18, le=100)]
    job: str
    marital: str
    education: str
    default: str
    balance: Annotated[int, Field(ge=-20000, le=1000000)]
    housing: str
    loan: str
    contact: str
    day: Annotated[int, Field(ge=1, le=31)]
    month: str
    campaign: Annotated[int, Field(ge=1, le=60)]
    pdays: Annotated[int, Field(ge=-1, le=900)]
    previous: Annotated[int, Field(ge=0, le=100)]
    poutcome: str

    @field_validator(*CATEGORIES.keys())
    @classmethod
    def validate_category(cls, value: str, info: object) -> str:
        field_name = getattr(info, "field_name", "field")
        if value not in CATEGORIES[field_name]:
            raise ValueError(f"unknown category: {value}")
        return value


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    del request
    errors: dict[str, str] = {}
    for error in exc.errors():
        location = error.get("loc", [])
        field_name = str(location[-1]) if location else "body"
        if error["type"] == "missing":
            message = "field required"
        elif error["type"] == "value_error":
            message = str(error["msg"]).removeprefix("Value error, ")
        elif error["type"] in {"greater_than_equal", "less_than_equal"}:
            message = "value is outside the allowed range"
        else:
            message = str(error["msg"])
        errors[field_name] = message
    return JSONResponse(status_code=422, content={"errors": errors})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "sklearn": "stub"}


@app.get("/schema")
def schema() -> dict[str, object]:
    return {
        "categories": CATEGORIES,
        "limits": LIMITS,
        "band_rates": BAND_RATES,
        "base_rate": 0.117,
        "test": {"pr_auc": 0.0, "roc_auc": 0.0},
    }


@app.post("/predict")
def predict(payload: PredictionRequest) -> dict[str, object]:
    if payload.poutcome == "success":
        score, band = 0.8, "High"
    elif payload.contact == "cellular":
        score, band = 0.4, "Medium"
    else:
        score, band = 0.1, "Low"

    return {
        "score": score,
        "band": band,
        "expected_rate": BAND_RATES[band],
        "base_rate": 0.117,
        "advice": f"Prioritize this {band.lower()}-priority call.",
    }


@app.post("/predict/batch")
async def predict_batch(file: UploadFile | None = File(default=None)) -> dict[str, object]:
    if file is not None:
        await file.read()
    return {
        "rows": [
            {"score": 0.8, "band": "High"},
            {"score": 0.4, "band": "Medium"},
            {"score": 0.1, "band": "Low"},
        ]
    }


@app.get("/insights")
def insights() -> dict[str, object]:
    return {
        "rules": [
            {
                "if": ["poutcome = success"],
                "support": 0.08,
                "confidence": 0.42,
                "lift": 3.6,
                "text": "Previous success is a strong positive signal.",
            },
            {
                "if": ["contact = cellular", "housing = no"],
                "support": 0.12,
                "confidence": 0.19,
                "lift": 1.6,
                "text": "Cellular contact with no housing loan performs above baseline.",
            },
            {
                "if": ["job = student"],
                "support": 0.03,
                "confidence": 0.22,
                "lift": 1.9,
                "text": "Students show a modestly higher subscription rate.",
            },
        ],
        "tree_text": "poutcome success -> High; otherwise cellular contact -> Medium; otherwise Low.",
    }