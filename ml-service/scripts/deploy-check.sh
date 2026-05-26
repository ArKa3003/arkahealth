#!/usr/bin/env bash
# Pre-deploy check: confirms ml-service can train + serve in a clean Linux-like environment.
set -e
echo "Python version:"
python --version
echo "Installing requirements..."
pip install -r requirements.txt --quiet
echo "Training model..."
python model/train.py
echo "Verifying trained_model.json exists..."
test -f model/trained_model.json && echo "✓ trained_model.json present"
echo "Importing app..."
python -c "from app import app; print('✓ FastAPI app imports cleanly')"
echo "All deploy checks passed."
