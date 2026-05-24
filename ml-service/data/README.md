# Data directory

Place training and evaluation data here. Format should align with:

- **Input**: FHIR-derived or synthetic clinical scenarios (e.g. CSV/Parquet with columns matching `model/features.py` and `src/server/ml/feature-engineer.ts`).
- **Splits**: Optional `train.csv` / `val.csv` / `test.csv` for reproducible splits.

Do not commit PHI or production datasets. Use synthetic or de-identified data only.
