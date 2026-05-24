"""
Model evaluation script: load trained model and test set, compute metrics
(RMSE, MAE, R², 3-category accuracy, confusion matrix, AUC for binary appropriate vs not),
and save a detailed evaluation report.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    roc_auc_score,
)

from model.features import FEATURE_NAMES

SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / "trained_model.json"
EVAL_DIR = SCRIPT_DIR / "evaluation"
REPORT_PATH = EVAL_DIR / "evaluation_report.json"


def _bin_category(score: float) -> int:
    """Bin score into 0 (1-3), 1 (4-6), 2 (7-9)."""
    if score < 4:
        return 0
    if score < 7:
        return 1
    return 2


def main() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}. Run train.py first.")

    test_path = EVAL_DIR / "test_set.npz"
    if not test_path.exists():
        raise FileNotFoundError(
            f"Test set not found: {test_path}. Run train.py first to generate and save the test set."
        )

    print("Loading model and test set...")
    model = xgb.Booster()
    model.load_model(str(MODEL_PATH))

    data = np.load(test_path, allow_pickle=True)
    X_test = data["X_test"]
    y_test = data["y_test"]
    if X_test.shape[1] != len(FEATURE_NAMES):
        raise ValueError(
            f"Test set has {X_test.shape[1]} features, expected {len(FEATURE_NAMES)}."
        )

    dtest = xgb.DMatrix(X_test)
    y_pred = model.predict(dtest)
    y_pred = np.clip(y_pred, 1.0, 9.0)

    # Regression metrics
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # 3-category classification
    y_cat_true = np.array([_bin_category(s) for s in y_test])
    y_cat_pred = np.array([_bin_category(s) for s in y_pred])
    acc_3 = accuracy_score(y_cat_true, y_cat_pred)
    cm = confusion_matrix(y_cat_true, y_cat_pred)

    # Binary: appropriate (>=7) vs not (<7); use predicted score as decision function for AUC
    y_bin_true = (y_test >= 7).astype(int)
    try:
        auc = roc_auc_score(y_bin_true, y_pred)
    except ValueError:
        auc = 0.0  # e.g. only one class present

    report = {
        "regression": {
            "rmse": float(rmse),
            "mae": float(mae),
            "r2": float(r2),
        },
        "three_category": {
            "accuracy": float(acc_3),
            "confusion_matrix": cm.tolist(),
            "labels": ["1-3 (not appropriate)", "4-6 (may be appropriate)", "7-9 (appropriate)"],
        },
        "binary_appropriate": {
            "threshold": 7,
            "auc": float(auc),
        },
        "targets": {
            "rmse_below": 1.0,
            "three_category_accuracy_above": 0.85,
            "auc_above": 0.85,
        },
        "targets_met": {
            "rmse": rmse < 1.0,
            "three_category_accuracy": acc_3 > 0.85,
            "auc": auc > 0.85,
        },
    }

    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Report saved to {REPORT_PATH}")

    print("\n========== Evaluation Report ==========")
    print("\nRegression (test set):")
    print(f"  RMSE: {rmse:.4f}  (target < 1.0: {'✓' if rmse < 1.0 else '✗'})")
    print(f"  MAE:  {mae:.4f}")
    print(f"  R²:   {r2:.4f}")
    print("\n3-category classification (1-3, 4-6, 7-9):")
    print(f"  Accuracy: {acc_3:.4f}  (target > 0.85: {'✓' if acc_3 > 0.85 else '✗'})")
    print("  Confusion matrix (rows=true, cols=pred):")
    for row in cm:
        print("   ", row)
    print("\nBinary (appropriate >= 7 vs not):")
    print(f"  AUC: {auc:.4f}  (target > 0.85: {'✓' if auc > 0.85 else '✗'})")
    print("=======================================\n")


if __name__ == "__main__":
    main()
