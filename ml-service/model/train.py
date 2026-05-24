"""
FDA Non-Device CDS Criterion 4: this trainer refuses to use any feature not present
in the Feature Rationale Catalogue. Every model feature must have a published
clinical rationale and citation so downstream cards can satisfy independent review.

Training script for the imaging appropriateness XGBoost model.
Generates synthetic training data from ARKA AIIE Clinical Evidence Base,
trains XGBoost, evaluates, and saves model and metrics.
"""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split

from model.features import (
    BODY_SITE_ENCODING,
    FEATURE_NAMES,
    INDICATION_ENCODING,
    MODALITY_ENCODING,
)

CATALOG_JSON = (
    Path(__file__).resolve().parents[2]
    / "lib"
    / "cds-platform"
    / "ml"
    / "feature-catalog.json"
)
if not CATALOG_JSON.exists():
    sys.exit(
        "Feature catalog JSON not found. Run `npm run export:feature-catalog` first."
    )
ALLOWED_FEATURES = set(json.loads(CATALOG_JSON.read_text()).keys())

# Paths (relative to this file's directory)
SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / "trained_model.json"
EVAL_DIR = SCRIPT_DIR / "evaluation"

# Scenario weights (clinical frequency)
SCENARIO_WEIGHTS = {
    "low_back_pain": 0.25,
    "headache": 0.20,
    "abdominal_pain": 0.20,
    "chest": 0.15,
    "musculoskeletal": 0.10,
    "other": 0.10,
}

# Extended indication codes for synthetic data (within 0-50)
INDICATION_ABDOMINAL = 8
INDICATION_CHEST = 9
INDICATION_MUSCULOSKELETAL = 10


def _clamp_score(s: float) -> float:
    return max(1.0, min(9.0, float(s)))


def generate_training_data(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic training data based on ARKA AIIE Clinical Evidence Base.
    Returns DataFrame with columns = FEATURE_NAMES + ['appropriateness_score'].
    """
    np.random.seed(seed)
    random.seed(seed)

    n_per_scenario = {}
    remaining = n_samples
    for scenario, w in list(SCENARIO_WEIGHTS.items())[:-1]:
        n_per_scenario[scenario] = int(n_samples * w)
        remaining -= n_per_scenario[scenario]
    n_per_scenario["other"] = remaining

    rows: list[dict[str, Any]] = []

    # --- Low back pain (25%) ---
    for _ in range(n_per_scenario["low_back_pain"]):
        modality = random.choice([1, 2, 3])  # CT, MRI, XR
        duration = random.choice([*range(1, 43), *range(43, 365)])  # <6w or >=6w
        red_flags = random.choice([0, 0, 0, 1])  # 25% red flags
        cancer = 1 if red_flags and random.random() < 0.3 else 0
        neuro_def = 1 if red_flags and random.random() < 0.4 else 0
        cauda = 1 if red_flags and random.random() < 0.1 else 0  # rare
        conservative = 1 if duration > 42 and random.random() < 0.7 else random.choice([0, 1])
        age = random.randint(18, 90)
        osteoporosis = 1 if age > 70 and random.random() < 0.4 else 0  # proxy via comorbidity

        score = 5.0  # default
        if cauda:
            score = 9.0
        elif cancer or neuro_def:
            score = 8.0 + random.random()
        elif duration < 42 and not red_flags:
            if modality in (1, 2):  # MRI/CT
                score = 1.0 + 2.0 * random.random()
            else:  # XR
                score = 3.0 + random.random()
        elif duration >= 42 and conservative and modality == 2:  # MRI after conservative
            score = 7.0 + 2.0 * random.random()
        elif modality == 1 and age > 70 and osteoporosis:  # CT age>70 osteoporosis
            score = 6.0 + random.random()
        else:
            score = 4.0 + 3.0 * random.random()

        rows.append(_row(
            patient_age=float(age),
            modality_code=float(modality),
            body_site_code=float(BODY_SITE_ENCODING["spine"]),
            indication_category=float(INDICATION_ENCODING["back_pain"]),
            symptom_duration_days=float(duration),
            has_red_flags=float(red_flags),
            cancer_history=float(cancer),
            neurological_deficit=float(neuro_def),
            conservative_tx_tried=float(conservative),
            comorbidity_count=float(osteoporosis + random.randint(0, 3)),
            score=score,
        ))
    # --- Headache (20%) ---
    for _ in range(n_per_scenario["headache"]):
        modality = random.choice([1, 2])  # CT, MRI
        chronic_stable = random.random() < 0.6
        normal_neuro = random.random() < 0.7
        thunderclap = random.random() < 0.08
        worst_of_life = thunderclap or random.random() < 0.05
        new_neuro = random.random() < 0.1
        progressive = random.random() < 0.15
        age = random.randint(18, 75)
        new_onset_50 = age > 50 and random.random() < 0.3

        score = 5.0
        if thunderclap or worst_of_life:
            score = 9.0
        elif new_neuro:
            score = 8.0 + random.random()
        elif chronic_stable and normal_neuro:
            score = 1.0 + 2.0 * random.random()
        elif progressive:
            score = 6.0 + 2.0 * random.random()
        elif new_onset_50:
            score = 6.0 + 2.0 * random.random()
        else:
            score = 4.0 + 3.0 * random.random()

        rows.append(_row(
            patient_age=float(age),
            modality_code=float(modality),
            body_site_code=float(BODY_SITE_ENCODING.get("brain", 2)),
            indication_category=float(INDICATION_ENCODING["headache"]),
            symptom_duration_days=float(random.randint(1, 365)),
            has_red_flags=float(1 if (thunderclap or new_neuro or worst_of_life) else 0),
            neurological_deficit=float(1 if new_neuro else 0),
            score=score,
        ))
    # --- Abdominal pain (20%) ---
    for _ in range(n_per_scenario["abdominal_pain"]):
        modality = random.choice([1, 4])  # CT, US
        rlq = random.random() < 0.5
        fever = random.random() < 0.4
        pediatric = random.random() < 0.2
        age = random.randint(5, 85) if not pediatric else random.randint(2, 17)
        pregnant = random.random() < 0.15
        immunocompromised = random.random() < 0.1

        score = 5.0
        if pregnant:
            if modality == 4:  # US
                score = 7.0 + 2.0 * random.random()
            else:  # CT
                score = 2.0 + 2.0 * random.random()
        elif pediatric and modality == 4 and (rlq or fever):
            score = 8.0 + random.random()
        elif rlq and fever and modality == 1:
            score = 7.0 + 2.0 * random.random()
        elif immunocompromised and fever and modality == 1:
            score = 8.0 + random.random()
        else:
            score = 4.0 + 3.0 * random.random()

        rows.append(_row(
            patient_age=float(age),
            modality_code=float(modality),
            body_site_code=float(BODY_SITE_ENCODING["abdomen"]),
            indication_category=float(INDICATION_ABDOMINAL),
            fever_present=float(1 if fever else 0),
            is_pregnant=float(1 if pregnant else 0),
            score=score,
        ))
    # --- Chest (15%) ---
    for _ in range(n_per_scenario["chest"]):
        modality = random.choice([1, 3, 4])  # CT, XR, US
        score = 4.0 + 4.0 * random.random()
        rows.append(_row(
            patient_age=float(random.randint(25, 85)),
            modality_code=float(modality),
            body_site_code=float(BODY_SITE_ENCODING["chest"]),
            indication_category=float(INDICATION_CHEST),
            symptom_duration_days=float(random.randint(1, 90)),
            score=score,
        ))
    # --- Musculoskeletal (10%) ---
    for _ in range(n_per_scenario["musculoskeletal"]):
        modality = random.choice([2, 3])  # MRI, XR
        body_site = BODY_SITE_ENCODING["extremity"]
        score = 4.0 + 4.0 * random.random()
        rows.append(_row(
            patient_age=float(random.randint(18, 80)),
            modality_code=float(modality),
            body_site_code=float(body_site),
            indication_category=float(INDICATION_MUSCULOSKELETAL),
            symptom_duration_days=float(random.randint(1, 180)),
            score=score,
        ))
    # --- Other (10%) ---
    for _ in range(n_per_scenario["other"]):
        modality = random.randint(1, 4)
        body = random.choice(list(BODY_SITE_ENCODING.values()))
        if body == 0:
            body = 1
        score = 2.0 + 6.0 * random.random()
        rows.append(_row(
            patient_age=float(random.randint(18, 85)),
            modality_code=float(modality),
            body_site_code=float(body),
            indication_category=float(INDICATION_ENCODING.get("default", 0)),
            symptom_duration_days=float(random.randint(-1, 365)),
            score=score,
        ))

    df = pd.DataFrame(rows)

    # Fill missing feature columns with defaults
    for name in FEATURE_NAMES:
        if name not in df.columns:
            if name in ("egfr_value", "days_since_last_imaging", "symptom_duration_days"):
                df[name] = -1.0
            else:
                df[name] = 0.0

    # Assign egfr_value for a subset (so contrast rules apply)
    idx_egfr = np.random.choice(df.index, size=int(len(df) * 0.35), replace=False)
    for i in idx_egfr:
        df.at[i, "egfr_value"] = float(random.choice([22, 28, 45, 55, 75, 90, 100]))
    idx_allergy = np.random.choice(df.index, size=int(len(df) * 0.03), replace=False)
    for i in idx_allergy:
        df.at[i, "has_contrast_allergy"] = 1.0
    # Duplicate imaging flags for a subset
    idx_dup_both = np.random.choice(df.index, size=int(len(df) * 0.12), replace=False)
    for i in idx_dup_both:
        df.at[i, "same_modality_prior_30d"] = 1.0
        df.at[i, "same_body_site_prior_30d"] = 1.0
    idx_dup_site = np.random.choice(df.index, size=int(len(df) * 0.08), replace=False)
    for i in idx_dup_site:
        if df.at[i, "same_body_site_prior_30d"] == 0:
            df.at[i, "same_body_site_prior_30d"] = 1.0

    # Contrast considerations (cross-cutting)
    for i in range(len(df)):
        r = df.iloc[i]
        s = r["appropriateness_score"]
        if r["modality_code"] == 1:  # CT
            egfr = r.get("egfr_value", -1)
            if egfr >= 0 and egfr < 30:
                s -= 3
            elif 30 <= egfr < 60:
                s -= 1
            if r.get("has_contrast_allergy", 0) == 1:
                s -= 4
        if r.get("modality_code") == 2 and r.get("is_pregnant", 0) == 1:  # MRI + pregnancy
            s -= 3
        s = _clamp_score(s)
        df.at[i, "appropriateness_score"] = s

    # Duplicate imaging
    for i in range(len(df)):
        s = df.at[i, "appropriateness_score"]
        if (
            df.at[i, "same_modality_prior_30d"] == 1
            and df.at[i, "same_body_site_prior_30d"] == 1
        ):
            s -= 3
        elif df.at[i, "same_body_site_prior_30d"] == 1:
            s -= 1
        df.at[i, "appropriateness_score"] = _clamp_score(s)

    # Gaussian noise (sigma=0.3) and clamp
    df["appropriateness_score"] = df["appropriateness_score"].astype(float) + np.random.normal(0, 0.3, size=len(df))
    df["appropriateness_score"] = df["appropriateness_score"].clip(1.0, 9.0)

    # Ensure column order
    cols = [c for c in FEATURE_NAMES if c in df.columns]
    for c in FEATURE_NAMES:
        if c not in cols:
            cols.append(c)
    for c in FEATURE_NAMES:
        if c not in df.columns:
            df[c] = -1.0 if c in ("egfr_value", "days_since_last_imaging", "symptom_duration_days") else 0.0
    df = df[FEATURE_NAMES + ["appropriateness_score"]]
    return df


def _row(**kwargs: Any) -> dict[str, Any]:
    """Build one row with defaults for all FEATURE_NAMES."""
    d: dict[str, Any] = {
        "patient_age": 45.0,
        "patient_sex": 0.0,
        "modality_code": 1.0,
        "body_site_code": 1.0,
        "indication_category": 0.0,
        "symptom_duration_days": -1.0,
        "has_red_flags": 0.0,
        "cancer_history": 0.0,
        "neurological_deficit": 0.0,
        "fever_present": 0.0,
        "is_pregnant": 0.0,
        "has_contrast_allergy": 0.0,
        "egfr_value": -1.0,
        "on_anticoagulation": 0.0,
        "on_metformin": 0.0,
        "prior_imaging_count_90d": 0.0,
        "days_since_last_imaging": -1.0,
        "same_modality_prior_30d": 0.0,
        "same_body_site_prior_30d": 0.0,
        "urgency_level": 0.0,
        "comorbidity_count": 0.0,
        "conservative_tx_tried": 0.0,
        "imaging_in_problem_list": 0.0,
        "appropriateness_score": 5.0,
    }
    for k, v in kwargs.items():
        if k == "score":
            d["appropriateness_score"] = float(v)
        else:
            d[k] = float(v) if v is not None else d.get(k, 0.0)
    return d


def _bin_category(score: float) -> int:
    """Bin score into 0 (1-3), 1 (4-6), 2 (7-9)."""
    if score < 4:
        return 0
    if score < 7:
        return 1
    return 2


def main() -> None:
    print("Generating synthetic training data (5000 samples)...")
    df = generate_training_data(n_samples=5000)

    X = df[FEATURE_NAMES].astype(np.float32)
    y = df["appropriateness_score"].astype(np.float32)

    X_train, X_rest, y_train, y_rest = train_test_split(X, y, test_size=0.30, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_rest, y_rest, test_size=0.5, random_state=42)

    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(
        EVAL_DIR / "test_set.npz",
        X_test=X_test.values,
        y_test=y_test.values,
        feature_names=np.array(FEATURE_NAMES),
    )

    unknown = [c for c in X.columns if c not in ALLOWED_FEATURES]
    if unknown:
        sys.exit(
            f"Refusing to train: features not in catalogue: {unknown}. "
            "Add to lib/cds-platform/ml/feature-catalog.ts with rationale + citation, "
            "regenerate JSON, re-run."
        )

    print("Training XGBoost (with early stopping)...")
    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURE_NAMES)
    dval = xgb.DMatrix(X_val, label=y_val, feature_names=FEATURE_NAMES)
    params = {
        "objective": "reg:squarederror",
        "max_depth": 6,
        "eta": 0.1,
        "min_child_weight": 3,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "eval_metric": ["rmse", "mae"],
        "seed": 42,
    }
    evals_result: dict[str, list] = {}
    model_xgb = xgb.train(
        params,
        dtrain,
        num_boost_round=200,
        evals=[(dtrain, "train"), (dval, "val")],
        early_stopping_rounds=20,
        evals_result=evals_result,
        verbose_eval=20,
    )
    model_xgb.save_model(str(MODEL_PATH))

    # Use booster for sklearn-compatible predictor for evaluation (same model)
    y_pred = model_xgb.predict(xgb.DMatrix(X_test))
    y_pred = np.clip(y_pred, 1.0, 9.0)

    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n--- Test set regression metrics ---")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE:  {mae:.4f}")
    print(f"R²:   {r2:.4f}")

    y_cat_true = np.array([_bin_category(s) for s in y_test])
    y_cat_pred = np.array([_bin_category(s) for s in y_pred])
    acc = accuracy_score(y_cat_true, y_cat_pred)
    print(f"\n3-category accuracy (1-3, 4-6, 7-9): {acc:.4f}")
    print("Confusion matrix (rows=true, cols=pred; 0=1-3, 1=4-6, 2=7-9):")
    cm = confusion_matrix(y_cat_true, y_cat_pred)
    print(cm)

    importance = model_xgb.get_score(importance_type="gain")
    sorted_imp = sorted(importance.items(), key=lambda x: -x[1])[:10]
    print("\nTop 10 feature importances (gain):")
    for feat, gain in sorted_imp:
        print(f"  {feat}: {gain:.4f}")

    metrics = {
        "rmse": float(rmse),
        "mae": float(mae),
        "r2": float(r2),
        "three_category_accuracy": float(acc),
        "confusion_matrix": cm.tolist(),
        "feature_importance_gain": {k: float(v) for k, v in importance.items()},
    }
    with open(EVAL_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nMetrics saved to {EVAL_DIR / 'metrics.json'}")

    # SHAP summary plot
    try:
        import shap
        explainer = shap.TreeExplainer(model_xgb)
        shap_vals = explainer.shap_values(X_test)
        shap.summary_plot(shap_vals, X_test, feature_names=FEATURE_NAMES, show=False)
        import matplotlib.pyplot as plt
        plt.savefig(EVAL_DIR / "shap_summary.png", bbox_inches="tight", dpi=150)
        plt.close()
        print(f"SHAP summary saved to {EVAL_DIR / 'shap_summary.png'}")
    except Exception as e:
        print(f"SHAP plot skipped: {e}")

    print("\nDone. Model saved to", MODEL_PATH)


if __name__ == "__main__":
    main()
