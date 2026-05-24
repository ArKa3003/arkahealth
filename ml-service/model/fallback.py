"""
Rule-based AIIE-style appropriateness scoring when no XGBoost model is loaded.
Produces a 1-9 scale score consistent with decode_prediction() categories.
"""

from __future__ import annotations

import numpy as np

from .features import FEATURE_NAMES, decode_prediction


def rule_based_score(features_array: np.ndarray) -> float:
    """
    Compute appropriateness score (1-9) from feature vector using rule-based logic.
    features_array: shape (1, n_features) in FEATURE_NAMES order.
    """
    if features_array.size == 0:
        return 5.0
    row = features_array.flat
    n = len(FEATURE_NAMES)
    if len(row) < n:
        return 5.0

    def get(name: str) -> float:
        try:
            i = FEATURE_NAMES.index(name)
            return float(row[i])
        except (ValueError, IndexError):
            return 0.0

    # Base score 5 (middle of 1-9)
    score = 5.0

    # Red flags and high-risk reduce appropriateness
    if get("has_red_flags") == 1:
        score -= 1.5
    if get("neurological_deficit") == 1:
        score -= 0.8
    if get("fever_present") == 1:
        score -= 0.3
    if get("cancer_history") == 1:
        score += 0.2  # may justify imaging

    # Short symptom duration without red flags supports appropriateness
    symptom_days = get("symptom_duration_days")
    if symptom_days >= 0 and symptom_days < 7 and get("has_red_flags") == 0:
        score += 0.4
    elif symptom_days >= 0 and symptom_days < 90:
        score += 0.2

    # Prior imaging: repeat same modality/site in 30d can reduce
    if get("same_modality_prior_30d") == 1:
        score -= 0.5
    if get("same_body_site_prior_30d") == 1:
        score -= 0.3
    prior_90 = get("prior_imaging_count_90d")
    if prior_90 > 2:
        score -= 0.4

    # Urgency: higher urgency can support appropriateness
    urgency = get("urgency_level")
    if urgency >= 2:  # asap or stat
        score += 0.5
    elif urgency == 1:
        score += 0.2

    # Conservative treatment tried supports appropriateness
    if get("conservative_tx_tried") == 1:
        score += 0.3
    if get("imaging_in_problem_list") == 1:
        score += 0.2

    # Safety: pregnancy, contrast allergy (context-dependent; here slight reduction)
    if get("is_pregnant") == 1:
        score -= 0.2
    if get("has_contrast_allergy") == 1:
        score -= 0.2

    score = max(1.0, min(9.0, score))
    return round(score, 2)


def rule_based_predict(features_array: np.ndarray) -> tuple[float, dict]:
    """
    Returns (score, decoded_dict) for the rule-based model.
    """
    score = rule_based_score(features_array)
    decoded = decode_prediction(score)
    return score, decoded
