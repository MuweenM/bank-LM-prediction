# Term deposit lead scoring

A small bank-campaign decision tool for the UCI Bank Marketing dataset. An agent enters information known before a call, and the system returns a High, Medium, or Low call priority, a model score, and the observed subscription rate for that priority in held-out data.

The model deliberately excludes `duration`: it is only known after the call and would leak the outcome into the prediction.

## Requirements

- Python 3.10 or newer
- Node.js and npm
- Git
- Internet access on the first data load if `data/raw/bank_marketing.csv` is not present

The Python dependencies are listed in `requirements.txt`. The frontend dependencies are listed in `frontend/package.json`.

## Fresh-clone setup

### Windows PowerShell

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
python -m uvicorn backend.main:app --port 8000
```

Open http://localhost:8000 in a browser.

If PowerShell blocks activation, run this once in an elevated PowerShell window or use Command Prompt instead:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
python -m uvicorn backend.main:app --port 8000
```

Open http://localhost:8000 in a browser.

The backend serves `frontend/dist` directly. During frontend development, use `npm run dev` in `frontend/`; its Vite proxy forwards API calls to port 8000.

## Retrain the model

Activate the virtual environment, then run from the repository root:

```bash
python -m src.train
```

The training script writes the fitted pipeline and serving metadata to `models/`. The training split and preprocessing pipeline are shared with the API, and the held-out test set is used once at the end.

## Run tests

From the repository root with the virtual environment active:

```bash
pytest
```

To check the frontend build separately:

```bash
cd frontend
npm run build
```

## Useful commands

Start the fake API while the real model is unavailable:

```bash
uvicorn backend.stub:app --port 8000
```

Start the real API and serve the built demo:

```bash
uvicorn backend.main:app --port 8000
```

## Project layout

```text
data/raw/       Cached UCI Bank Marketing CSV
docs/           Demo script, fresh-clone checklist, and student notes
frontend/       Vite React TypeScript app and committed production dist/
models/         Fitted pipeline, metadata, and association-rule insights
notebooks/      EDA, preprocessing, feature, model, and association-rule work
reports/        Cross-validation results and tuned parameters
src/data.py     Data loading and the stratified train/test split
src/features.py Deterministic pre-call feature engineering
src/pipeline.py Shared preprocessing and model pipeline
src/evaluate.py Cross-validation reporting and result persistence
src/train.py   Final model training and serving artifact creation
backend/main.py Real FastAPI API and static frontend server
backend/stub.py Fake API for frontend development
tests/          API tests
```

## Current reference results

The generated metadata currently records a base subscription rate of 11.7%, with observed held-out band rates of approximately 50.4% for High, 15.2% for Medium, and 5.2% for Low. The current held-out PR-AUC is approximately 0.4444. Retraining may change these values.
