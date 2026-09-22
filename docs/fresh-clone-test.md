# Fresh-clone test checklist

Use this checklist from a clean clone. Record the date, operating system, Python version, Node/npm versions, and the result of each step.

- Date: ____________________
- Tester: ____________________
- Operating system: ____________________
- Python version: ____________________
- Node version: ____________________
- npm version: ____________________
- Commit tested: ____________________

## Setup

- [ ] Clone the repository.
  - Command/result: ______________________________________________
- [ ] Create a Python virtual environment.
  - Command/result: ______________________________________________
- [ ] Activate the virtual environment.
  - Command/result: ______________________________________________
- [ ] Run `pip install -r requirements.txt`.
  - Result: ______________________________________________________
- [ ] Run `cd frontend && npm install`.
  - Result: ______________________________________________________

## Data and artifacts

- [ ] Confirm `data/raw/bank_marketing.csv` exists, or confirm the first data load can fetch it.
  - Result: ______________________________________________________
- [ ] Confirm `models/final_model.joblib` exists.
  - Result: ______________________________________________________
- [ ] Confirm `models/meta.json` exists.
  - Result: ______________________________________________________
- [ ] Confirm `models/insights.json` exists, or run notebook 04 first.
  - Result: ______________________________________________________

## Validation

- [ ] Run `pytest`.
  - Result: ______________________________________________________
- [ ] Run `cd frontend && npm run build`.
  - Result: ______________________________________________________
- [ ] Confirm `frontend/dist/index.html` exists after the build.
  - Result: ______________________________________________________
- [ ] Start `python -m uvicorn backend.main:app --port 8000` from the repository root.
  - Result: ______________________________________________________
- [ ] Open http://localhost:8000.
  - Result: ______________________________________________________
- [ ] Confirm the score form loads its categories and limits.
  - Result: ______________________________________________________
- [ ] Submit one valid client and confirm a score, band, and observed-rate message appear.
  - Result: ______________________________________________________
- [ ] Enter an invalid number and confirm a clear field error appears.
  - Result: ______________________________________________________
- [ ] Open **What drives subscriptions** and confirm rules and tree text load.
  - Result: ______________________________________________________
- [ ] Open **Rank a call list**, upload a valid CSV, and confirm ranked rows appear.
  - Result: ______________________________________________________
- [ ] Upload an invalid CSV and confirm the file error is clear.
  - Result: ______________________________________________________

## Final notes

- Overall result: PASS / FAIL
- Failed step(s): ________________________________________________
- Error details: _________________________________________________
- Follow-up action: ______________________________________________
