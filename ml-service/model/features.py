"""
Feature definitions for the imaging appropriateness XGBoost model.
Must match src/server/ml/feature-engineer.ts (TypeScript) so that feature names
and order are identical between Next.js and this service.
"""

from __future__ import annotations

from typing import Any

import numpy as np

# Ordered list of all 23 features (must match model training order)
FEATURE_NAMES: list[str] = [
    "patient_age",
    "patient_sex",
    "modality_code",
    "body_site_code",
    "indication_category",
    "symptom_duration_days",
    "has_red_flags",
    "cancer_history",
    "neurological_deficit",
    "fever_present",
    "is_pregnant",
    "has_contrast_allergy",
    "egfr_value",
    "on_anticoagulation",
    "on_metformin",
    "prior_imaging_count_90d",
    "days_since_last_imaging",
    "same_modality_prior_30d",
    "same_body_site_prior_30d",
    "urgency_level",
    "comorbidity_count",
    "conservative_tx_tried",
    "imaging_in_problem_list",
]

FEATURE_TYPES: dict[str, str] = {
    "patient_age": "continuous",
    "patient_sex": "binary",
    "modality_code": "ordinal",
    "body_site_code": "ordinal",
    "indication_category": "ordinal",
    "symptom_duration_days": "continuous",
    "has_red_flags": "binary",
    "cancer_history": "binary",
    "neurological_deficit": "binary",
    "fever_present": "binary",
    "is_pregnant": "binary",
    "has_contrast_allergy": "binary",
    "egfr_value": "continuous",
    "on_anticoagulation": "binary",
    "on_metformin": "binary",
    "prior_imaging_count_90d": "continuous",
    "days_since_last_imaging": "continuous",
    "same_modality_prior_30d": "binary",
    "same_body_site_prior_30d": "binary",
    "urgency_level": "ordinal",
    "comorbidity_count": "continuous",
    "conservative_tx_tried": "binary",
    "imaging_in_problem_list": "binary",
}

# Valid ranges: (min, max). -1 or sentinel allowed where noted.
FEATURE_RANGES: dict[str, tuple[float, float]] = {
    "patient_age": (0, 120),
    "patient_sex": (0, 1),
    "modality_code": (0, 50),
    "body_site_code": (0, 50),
    "indication_category": (0, 50),
    "symptom_duration_days": (-1, 365 * 2),  # -1 = unknown
    "has_red_flags": (0, 1),
    "cancer_history": (0, 1),
    "neurological_deficit": (0, 1),
    "fever_present": (0, 1),
    "is_pregnant": (0, 1),
    "has_contrast_allergy": (0, 1),
    "egfr_value": (-1, 200),  # -1 = unknown
    "on_anticoagulation": (0, 1),
    "on_metformin": (0, 1),
    "prior_imaging_count_90d": (0, 50),
    "days_since_last_imaging": (-1, 365),  # -1 = no prior
    "same_modality_prior_30d": (0, 1),
    "same_body_site_prior_30d": (0, 1),
    "urgency_level": (0, 3),  # 0=routine, 1=urgent, 2=asap, 3=stat
    "comorbidity_count": (0, 50),
    "conservative_tx_tried": (0, 1),
    "imaging_in_problem_list": (0, 1),
}

# Modality string -> ordinal code (subset; extend as needed)
MODALITY_ENCODING: dict[str, int] = {
    "CT": 1,
    "MRI": 2,
    "XR": 3,
    "US": 4,
    "NM": 5,
    "PET": 6,
    "MG": 7,
    "RF": 8,
    "DX": 9,
    "CR": 10,
    "default": 0,
}

# Body site string -> ordinal code
BODY_SITE_ENCODING: dict[str, int] = {
    "head": 1,
    "brain": 2,
    "spine": 3,
    "chest": 4,
    "abdomen": 5,
    "pelvis": 6,
    "extremity": 7,
    "neck": 8,
    "cardiac": 9,
    "default": 0,
}

# Chief complaint / indication category -> ordinal code
INDICATION_ENCODING: dict[str, int] = {
    "headache": 1,
    "back_pain": 2,
    "trauma": 3,
    "stroke": 4,
    "infection": 5,
    "cancer_surveillance": 6,
    "screening": 7,
    "default": 0,
}

# Appropriateness categories (1-9 scale)
SCORE_CATEGORIES: list[tuple[float, float, str]] = [
    (1.0, 1.9, "usually_not_appropriate"),
    (2.0, 2.9, "may_be_appropriate"),
    (3.0, 3.9, "usually_not_appropriate"),
    (4.0, 4.9, "may_be_appropriate"),
    (5.0, 5.9, "usually_appropriate"),
    (6.0, 6.9, "usually_appropriate"),
    (7.0, 7.9, "usually_appropriate"),
    (8.0, 8.9, "usually_appropriate"),
    (9.0, 9.0, "usually_appropriate"),
]


def _clamp(value: float, low: float, high: float) -> float:
    if value < low:
        return low
    if value > high:
        return high
    return value


def encode_features(raw_features: dict[str, Any]) -> np.ndarray:
    """
    Converts a flat feature dict from the API into a numpy array with columns
    in FEATURE_NAMES order. Missing keys use -1 for continuous/ordinal sentinels
    and 0 for binary where appropriate.
    """
    out: list[float] = []
    for name in FEATURE_NAMES:
        val = raw_features.get(name)
        if val is None:
            # Defaults: binary/ordinal -> 0, continuous with sentinel -> -1
            if FEATURE_TYPES.get(name) == "binary":
                val = 0
            elif name in ("egfr_value", "days_since_last_imaging", "symptom_duration_days"):
                val = -1
            else:
                val = 0
        try:
            num = float(val)
        except (TypeError, ValueError):
            num = 0.0 if FEATURE_TYPES.get(name) == "binary" else -1.0
        if name in FEATURE_RANGES:
            lo, hi = FEATURE_RANGES[name]
            num = _clamp(num, lo, hi)
        out.append(num)
    return np.array(out, dtype=np.float32).reshape(1, -1)


def decode_prediction(score: float) -> dict[str, Any]:
    """
    Maps a raw appropriateness score (1-9) to category and human-readable label.
    """
    score = max(1.0, min(9.0, float(score)))
    category = "usually_not_appropriate"
    label = "Usually Not Appropriate"
    for low, high, cat in SCORE_CATEGORIES:
        if low <= score <= high:
            category = cat
            label = cat.replace("_", " ").title()
            break
    return {
        "score": round(score, 2),
        "category": category,
        "label": label,
    }
