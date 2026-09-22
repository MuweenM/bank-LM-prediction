"""Cross-validation reporting helpers."""

from pathlib import Path

import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate


def cv_report(name, estimator, X, y):
    """Evaluate an estimator with stratified five-fold cross-validation."""
    scoring = {
        "pr_auc": "average_precision",
        "roc_auc": "roc_auc",
        "f1": "f1",
        "precision": "precision",
        "recall": "recall",
    }
    folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_validate(
        estimator,
        X,
        y,
        cv=folds,
        scoring=scoring,
        return_train_score=True,
    )

    row = {"name": name}
    for metric in scoring:
        row[f"{metric}_mean"] = scores[f"test_{metric}"].mean()
        row[f"{metric}_std"] = scores[f"test_{metric}"].std()
    row["train_pr_auc_mean"] = scores["train_pr_auc"].mean()
    row["train_pr_auc_std"] = scores["train_pr_auc"].std()
    row["fit_time_mean"] = scores["fit_time"].mean()
    return row


def save_result(row, path="reports/model_comparison.csv"):
    """Replace a result with the same model name, then save the updated report."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    new_row = pd.DataFrame([row])

    if path.exists() and path.stat().st_size > 0:
        results = pd.read_csv(path)
        results = results[results["name"] != row["name"]]
        results = pd.concat([results, new_row], ignore_index=True)
    else:
        results = new_row

    results.to_csv(path, index=False)