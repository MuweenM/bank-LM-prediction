# Bank Marketing

A bank marketing prediction project with a Python training API and a Vite/React frontend.

## Repository layout

```text
bank-marketing/
├── data/raw/                 # Cached dataset files
├── notebooks/                # EDA, preprocessing, modeling, tuning, and rules
├── src/                      # Data loading, features, pipeline, and training
├── models/                   # Trained model and metadata artifacts
├── backend/                  # FastAPI application
├── tests/                    # API and integration tests
├── frontend/                 # Vite + React + Tailwind + shadcn/ui app
├── conftest.py               # Shared pytest configuration
└── requirements.txt          # Python dependencies
```

## Data and model artifacts

Place the cached dataset at `data/raw/bank_marketing.csv`. Run the training workflow in `src/train.py` to write the final model and metadata into `models/`.

Binary datasets and generated model artifacts are intentionally not included in this scaffold. Add Git LFS or an artifact store before committing large files to GitHub.

## Python setup

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
pytest
uvicorn backend.main:app --reload
```

The frontend can be initialized independently inside `frontend/` with Vite, React, Tailwind, and shadcn/ui.
