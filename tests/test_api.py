import joblib
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from src.data import get_split


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def valid_payload():
    return {
        "age": 42,
        "job": "management",
        "marital": "married",
        "education": "tertiary",
        "default": "no",
        "balance": 1500,
        "housing": "yes",
        "loan": "no",
        "contact": "cellular",
        "day": 15,
        "month": "may",
        "campaign": 1,
        "pdays": -1,
        "previous": 0,
        "poutcome": "unknown",
    }


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "sklearn" in response.json()


def test_schema_contains_categories_and_limits(client):
    response = client.get("/schema")
    assert response.status_code == 200
    assert "categories" in response.json()
    assert response.json()["limits"]["age"] == [18, 100]


def test_valid_prediction_and_pipeline_score(client):
    payload = valid_payload()
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert 0 <= result["score"] <= 1
    assert result["band"] in {"High", "Medium", "Low"}
    model = joblib.load("models/final_model.joblib")
    expected = model.predict_proba(__import__("pandas").DataFrame([payload]))[0, 1]
    assert abs(result["score"] - expected) <= 1e-3


@pytest.mark.parametrize("change", [{"job": "not-a-job"}, {"age": 5}, {}])
def test_invalid_prediction_returns_field_error(client, change):
    payload = valid_payload()
    if change:
        payload.update(change)
    else:
        payload.pop("age")
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    field = next(iter(change), "age")
    assert field in response.json()["errors"]


def test_duration_is_not_a_model_column():
    X_train, _, _, _ = get_split()
    assert "duration" not in X_train.columns
