"""
ARKA CDS Hooks — ML prediction service.
FastAPI server: XGBoost imaging appropriateness prediction with SHAP.
Loads model from ./model/trained_model.json or uses rule-based fallback.
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import FastAPI, Query
from pydantic import BaseModel, Field

# Structured JSON logging
import logging
try:
    from pythonjsonlogger.json import JsonFormatter
except ImportError:
    from pythonjsonlogger import jsonlogger
    JsonFormatter = jsonlogger.JsonFormatter

# Model and features
from model.features import (
    FEATURE_NAMES,
    decode_prediction,
    encode_features,
)
from model.fallback import rule_based_predict, rule_based_score

# XGBoost and SHAP (optional until model file exists; xgb may fail if libomp missing)
xgb = None
shap_explainer = None
try:
    import xgboost as xgb_module
    xgb = xgb_module
except (ImportError, Exception):
    pass
try:
    import shap
except ImportError:
    shap = None

ML_SERVICE_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_SERVICE_DIR / "model" / "trained_model.json"
FEATURE_CATALOG_JSON = ML_SERVICE_DIR / "feature-catalog.json"
if not FEATURE_CATALOG_JSON.exists():
    FEATURE_CATALOG_JSON = (
        ML_SERVICE_DIR.parent
        / "lib"
        / "cds-platform"
        / "ml"
        / "feature-catalog.json"
    )
MODEL_CARD_PATH = ML_SERVICE_DIR / "MODEL_CARD.md"
MODEL_VERSION = "1.0.0"
FALLBACK_VERSION = "1.0.0-rulebased"

_feature_catalog: dict[str, Any] = {}
_feature_rationales: dict[str, str] = {}

# Logging setup
log_handler = logging.StreamHandler()
log_handler.setFormatter(JsonFormatter("%(timestamp)s %(level)s %(message)s"))
logger = logging.getLogger("arka_ml")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)


def _load_feature_catalog() -> None:
    global _feature_catalog, _feature_rationales
    if not FEATURE_CATALOG_JSON.exists():
        logger.warning(
            "feature_catalog_missing",
            extra={"path": str(FEATURE_CATALOG_JSON)},
        )
        _feature_catalog = {}
        _feature_rationales = {}
        return
    try:
        _feature_catalog = json.loads(FEATURE_CATALOG_JSON.read_text(encoding="utf-8"))
        _feature_rationales = {
            name: str(entry.get("rationale", ""))
            for name, entry in _feature_catalog.items()
            if isinstance(entry, dict)
        }
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning(
            "feature_catalog_load_failed",
            extra={"path": str(FEATURE_CATALOG_JSON), "error": str(exc)},
        )
        _feature_catalog = {}
        _feature_rationales = {}


def _file_sha256(path: Path) -> Optional[str]:
    if not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


# --- Pydantic models ---

class ShapFeatureContribution(BaseModel):
    feature: str
    shap_value: float
    feature_value: float


class ShapValues(BaseModel):
    base_value: float
    feature_contributions: List[ShapFeatureContribution]


class PredictRequest(BaseModel):
    features: Dict[str, Any] = Field(..., description="Feature set for prediction (missing keys filled with -1/0)")


class PredictResponse(BaseModel):
    appropriateness_score: float = Field(..., description="1-9 scale")
    appropriateness_category: str = Field(...)
    confidence: float = Field(..., ge=0, le=1)
    shap_values: ShapValues = Field(...)
    model_version: str = Field(...)
    prediction_id: str = Field(...)
    feature_metadata: Optional[Dict[str, str]] = Field(
        default=None,
        description="Feature name → clinical rationale (when include_metadata=true)",
    )


class BatchPredictRequest(BaseModel):
    features_list: List[Dict[str, Any]] = Field(..., description="Array of feature sets")


class BatchPredictResponse(BaseModel):
    predictions: List[PredictResponse]
    model_version: str


# --- Model state ---
model_loaded = False
model_object = None
training_metrics: dict[str, Any] = {}
feature_importance: dict[str, float] = {}


def _load_model() -> None:
    global model_loaded, model_object, shap_explainer, feature_importance, training_metrics
    if not xgb or not MODEL_PATH.exists():
        logger.info("model_file_missing", extra={"path": str(MODEL_PATH), "fallback": "rule_based"})
        model_loaded = False
        model_object = None
        shap_explainer = None
        feature_importance = {}
        training_metrics = {"fallback": True}
        return
    try:
        model_object = xgb.XGBRegressor()
        model_object.load_model(str(MODEL_PATH))
        model_loaded = True
        if shap and hasattr(model_object, "get_booster"):
            try:
                shap_explainer = shap.TreeExplainer(model_object.get_booster())
            except Exception as e:
                logger.warning("shap_explainer_init_failed", extra={"error": str(e)})
                shap_explainer = None
        try:
            imp = model_object.get_booster().get_score(importance_type="gain")
            feature_importance = dict(imp) if imp else {}
        except Exception:
            feature_importance = {}
        training_metrics = {"loaded_from": str(MODEL_PATH)}
        logger.info("model_loaded", extra={"path": str(MODEL_PATH), "feature_count": len(FEATURE_NAMES)})
    except Exception as e:
        logger.exception("model_load_failed", extra={"path": str(MODEL_PATH), "error": str(e)})
        model_loaded = False
        model_object = None
        shap_explainer = None
        feature_importance = {}
        training_metrics = {"error": str(e)}


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_feature_catalog()
    _load_model()
    yield
    # shutdown if needed
    pass


app = FastAPI(title="ARKA CDS ML Service", version=MODEL_VERSION, lifespan=lifespan)


def _compute_shap(features_array: np.ndarray, score: float) -> ShapValues:
    """Compute SHAP contributions; if no explainer, return placeholder from rule-based heuristics."""
    base_value = 5.0
    contributions: list[ShapFeatureContribution] = []
    if shap_explainer is not None and features_array.size > 0:
        try:
            shap_vals = shap_explainer.shap_values(features_array)
            if shap_vals is not None:
                vals = np.atleast_2d(shap_vals)
                row = vals[0]
                for i, name in enumerate(FEATURE_NAMES):
                    if i < len(row):
                        contributions.append(ShapFeatureContribution(
                            feature=name,
                            shap_value=round(float(row[i]), 4),
                            feature_value=round(float(features_array.flat[i]), 4),
                        ))
                if contributions:
                    base_value = float(shap_explainer.expected_value) if hasattr(shap_explainer, "expected_value") and shap_explainer.expected_value is not None else 5.0
        except Exception as e:
            logger.warning("shap_compute_failed", extra={"error": str(e)})
    if not contributions:
        # Placeholder: spread (score - base) across a few key features
        row = features_array.flat
        for i, name in enumerate(FEATURE_NAMES):
            fv = float(row[i]) if i < len(row) else 0.0
            contributions.append(ShapFeatureContribution(feature=name, shap_value=0.0, feature_value=fv))
    return ShapValues(base_value=base_value, feature_contributions=contributions)


def _run_single_prediction(
    features_dict: dict[str, Any],
    *,
    include_metadata: bool = False,
) -> PredictResponse:
    start = time.perf_counter()
    raw = {k: v for k, v in features_dict.items() if k in FEATURE_NAMES}
    # Fill missing with sentinels
    for name in FEATURE_NAMES:
        if name not in raw:
            raw[name] = -1 if name in ("egfr_value", "days_since_last_imaging", "symptom_duration_days") else 0
    X = encode_features(raw)
    prediction_id = str(uuid.uuid4())

    if model_loaded and model_object is not None:
        score = float(np.atleast_1d(model_object.predict(X))[0])
        score = max(1.0, min(9.0, score))
        decoded = decode_prediction(score)
        confidence = 0.85
        version = MODEL_VERSION
    else:
        score, decoded = rule_based_predict(X)
        confidence = 0.70
        version = FALLBACK_VERSION

    shap_values = _compute_shap(X, score)
    latency_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "prediction",
        extra={
            "prediction_id": prediction_id,
            "appropriateness_score": score,
            "model_version": version,
            "latency_ms": round(latency_ms, 2),
        },
    )
    metadata: Optional[Dict[str, str]] = None
    if include_metadata and _feature_rationales:
        metadata = {
            name: _feature_rationales[name]
            for name in FEATURE_NAMES
            if name in _feature_rationales
        }

    return PredictResponse(
        appropriateness_score=round(score, 2),
        appropriateness_category=decoded["category"],
        confidence=confidence,
        shap_values=shap_values,
        model_version=version,
        prediction_id=prediction_id,
        feature_metadata=metadata,
    )


@app.post("/predict", response_model=PredictResponse, response_model_exclude_none=True)
def predict(
    request: PredictRequest,
    include_metadata: bool = Query(
        default=False,
        description="When true, include feature_metadata rationales from the catalogue",
    ),
) -> PredictResponse:
    """Single prediction with SHAP contributions."""
    return _run_single_prediction(request.features, include_metadata=include_metadata)


@app.post(
    "/predict/batch",
    response_model=BatchPredictResponse,
    response_model_exclude_none=True,
)
def predict_batch(
    request: BatchPredictRequest,
    include_metadata: bool = Query(default=False),
) -> BatchPredictResponse:
    """Batch prediction; same contract per item."""
    predictions = []
    for feat in request.features_list:
        predictions.append(
            _run_single_prediction(feat, include_metadata=include_metadata)
        )
    version = predictions[0].model_version if predictions else FALLBACK_VERSION
    return BatchPredictResponse(predictions=predictions, model_version=version)


@app.get("/health")
def health() -> dict[str, Any]:
    """Returns service status and SHA-256 of bundled model documentation."""
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_card_sha256": _file_sha256(MODEL_CARD_PATH),
        "feature_catalog_sha256": _file_sha256(FEATURE_CATALOG_JSON),
    }


@app.get("/model/info")
def model_info() -> dict[str, Any]:
    """Returns model metadata, feature importance, training metrics."""
    return {
        "model_loaded": model_loaded,
        "model_version": MODEL_VERSION if model_loaded else FALLBACK_VERSION,
        "model_path": str(MODEL_PATH),
        "feature_names": FEATURE_NAMES,
        "feature_count": len(FEATURE_NAMES),
        "feature_importance": feature_importance,
        "training_metrics": training_metrics,
    }
