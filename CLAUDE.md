# Term deposit lead scoring (IT3051 Fundamentals of Data Mining, mini project 2026)

## What we are building
Bank campaign agents enter what the bank knows about a client before a call. The system returns
a call priority (High, Medium or Low) and the subscription rate observed for that priority in
held-out data.
Dataset: UCI Bank Marketing, id 222, fetched with ucimlrepo. Target y = client subscribed to a
term deposit (yes/no). About 45,000 rows, about 11.7% yes.
Two students build it. Both are assessed individually in a viva, so code must be simple and
readable, and every choice needs a short reason in a comment or markdown cell.

## Hard rules
1. Never use `duration` as a feature. It is only known after the call (leakage).
2. All feature engineering lives in src/features.py. One scikit-learn Pipeline (src/pipeline.py)
   is used for training AND serving.
3. Split first: stratified 80/20 hold-out, random_state=42, through get_split() in src/data.py.
   Never fit anything on the test set. The test set is used once, at the end, in src/train.py.
4. Compare models with stratified 5-fold cross-validation on the training set (src/evaluate.py).
   Primary metric: PR-AUC (average_precision). Also ROC-AUC, F1, precision, recall. Never report
   accuracy alone.
5. Model results go to reports/model_comparison.csv (one row per model).
6. Python 3.10 or newer. Do not add libraries without asking. Approved ones go in requirements.txt.
7. Comments explain why, not what. Do not change the API contract without telling me.

## Stack
Data and models: pandas, numpy, scikit-learn, mlxtend (FP-Growth, Apriori), matplotlib, seaborn,
joblib, ucimlrepo, Jupyter.
Backend: FastAPI, Pydantic v2, uvicorn. Tests: pytest, httpx.
Frontend: React, Vite, TypeScript, Tailwind CSS v4, shadcn/ui. In the Vite TypeScript template,
use `import type` for types and do not use constructor parameter properties.

## Layout
data/raw/       cached dataset (committed)
notebooks/      01a_eda_quality, 01b_eda_relationships, 02a_preprocessing, 02b_features,
                03a_trees, 03b_boosting_knn, 03c_tuning_trees, 04_association_rules,
                05_model_selection
src/            __init__.py data.py features.py pipeline.py evaluate.py train.py
reports/        model_comparison.csv, best_params.json
models/         final_model.joblib, meta.json, insights.json
backend/        __init__.py main.py (real API, Dev A), stub.py (fake API, Dev B)
tests/          test_api.py
frontend/       Vite React app (dist/ is committed)
docs/           notes-a.md, notes-b.md, demo-script.md, fresh-clone-test.md

## Ownership
Dev A: src/data.py pipeline.py evaluate.py train.py, backend/main.py, tests/, models/,
       notebooks 01a 02a 03a 03c
Dev B: src/features.py, frontend/, backend/stub.py, docs/, README.md, notebooks 01b 02b 03b 04 05
Shared (ask first): CLAUDE.md, requirements.txt

## API contract
GET  /health   -> {"status":"ok","sklearn":"<version>"}
GET  /schema   -> {"categories":{col:[values]}, "limits":{col:[min,max]},
                   "band_rates":{"High":x,"Medium":x,"Low":x}, "base_rate":x,
                   "test":{"pr_auc":x,"roc_auc":x}}
POST /predict  body (15 fields): age, job, marital, education, default, balance, housing, loan,
                   contact, day (day of month), month, campaign, pdays, previous, poutcome
               200 -> {"score":x, "band":"High|Medium|Low", "expected_rate":x,
                       "base_rate":x, "advice":"..."}
               422 -> {"errors":{"<field>":"<message>"}}
POST /predict/batch  (optional) CSV upload -> top 500 rows with score and band
GET  /insights       (optional) -> {"rules":[{"if":[...],"support":x,"confidence":x,"lift":x,
                       "text":"..."}], "tree_text":"..."}
Limits: age 18-100, balance -20000..1000000, day 1-31, campaign 1-60, pdays -1..900, previous 0..100.
Category lists always come from models/meta.json, never typed by hand in the backend.

## Artifacts written by src/train.py
models/final_model.joblib: the fitted Pipeline.
models/meta.json: sklearn (version), raw_numeric, raw_categorical, categories (dict of sorted
lists), band_cutoffs {high, medium} (scores at the 90th and 70th percentile of test predictions),
band_rates {High, Medium, Low} (observed yes-rate per band on the test set), base_rate,
test {pr_auc, roc_auc}.
models/insights.json: written by notebook 04 (rules and tree text).