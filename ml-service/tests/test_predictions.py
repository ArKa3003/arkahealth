"""
Prediction tests: call /predict with sample feature vectors and assert response shape and score range.
"""

import pytest
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

SAMPLE_FEATURES = {
    "patient_age": 45,
    "patient_sex": 1,
    "modality_code": 3,
    "body_site_code": 5,
    "indication_category": 2,
    "symptom_duration_days": 3,
    "has_red_flags": 0,
    "cancer_history": 0,
    "neurological_deficit": 0,
    "fever_present": 0,
    "is_pregnant": 0,
    "has_contrast_allergy": 0,
    "egfr_value": 90.0,
    "on_anticoagulation": 0,
    "on_metformin": 0,
    "prior_imaging_count_90d": 0,
    "days_since_last_imaging": -1,
    "same_modality_prior_30d": 0,
    "same_body_site_prior_30d": 0,
    "urgency_level": 0,
    "comorbidity_count": 2,
    "conservative_tx_tried": 0,
    "imaging_in_problem_list": 0,
}


def test_predict_returns_score():
    """POST /predict with valid features returns result with score in [1, 9]."""
    response = client.post("/predict", json={"features": SAMPLE_FEATURES})
    assert response.status_code == 200
    data = response.json()
    assert "appropriateness_score" in data
    assert 1 <= data["appropriateness_score"] <= 9
    assert "appropriateness_category" in data
    assert "confidence" in data
    assert "shap_values" in data
    assert "model_version" in data
    assert "prediction_id" in data
    assert "feature_contributions" in data["shap_values"]


def test_health_returns_ok():
    """GET /health returns status ok and feature count."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data
    assert "feature_count" in data
    assert data["feature_count"] == 23


def test_model_info():
    """GET /model/info returns metadata and feature names."""
    response = client.get("/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "feature_names" in data
    assert len(data["feature_names"]) == 23


def test_predict_batch():
    """POST /predict/batch accepts array of feature sets."""
    response = client.post(
        "/predict/batch",
        json={"features_list": [SAMPLE_FEATURES, {**SAMPLE_FEATURES, "patient_age": 60}]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 2
    for p in data["predictions"]:
        assert 1 <= p["appropriateness_score"] <= 9
        assert "prediction_id" in p
