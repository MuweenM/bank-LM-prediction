"""Fit the final model and write the serving artifacts."""

import json
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, roc_auc_score

from src.data import get_split
from src.features import CATEGORICAL, RAW_CATEGORICAL, RAW_NUMERIC, add_features
from src.pipeline import build


# Replace this estimator after model selection is complete.
FINAL_MODEL = HistGradientBoostingClassifier(learning_rate=0.1, max_depth=None, max_leaf_nodes=31, min_samples_leaf=50, l2_regularization=10.0, class_weight="balanced", random_state=42)


def main() -> None:
    X_train, X_test, y_train, y_test = get_split()
    pipeline = build(FINAL_MODEL)
    pipeline.fit(X_train, y_train)
    feature_data = add_features(X_train)
    scores = pipeline.predict_proba(X_test)[:, 1]
    high, medium = pd.Series(scores).quantile([0.90, 0.70])
    bands = pd.Series("Low", index=range(len(scores)))
    bands[scores >= medium] = "Medium"
    bands[scores >= high] = "High"
    band_rates = pd.Series(y_test.to_numpy()).groupby(bands).mean().reindex(["High", "Medium", "Low"]).fillna(0)
    meta = {
        "sklearn": sklearn.__version__,
        "raw_numeric": RAW_NUMERIC,
        "raw_categorical": RAW_CATEGORICAL,
        "categories": {column: sorted(feature_data[column].unique().tolist()) for column in CATEGORICAL},
        "band_cutoffs": {"high": float(high), "medium": float(medium)},
        "band_rates": {key: float(value) for key, value in band_rates.items()},
        "base_rate": float(y_train.mean()),
        "test": {"pr_auc": float(average_precision_score(y_test, scores)), "roc_auc": float(roc_auc_score(y_test, scores))},
    }
    models = Path("models")
    models.mkdir(exist_ok=True)
    joblib.dump(pipeline, models / "final_model.joblib")
    (models / "meta.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(f"Test PR-AUC: {meta['test']['pr_auc']:.4f}")
    print(f"Test ROC-AUC: {meta['test']['roc_auc']:.4f}")
    print(f"Band rates: {meta['band_rates']}")


if __name__ == "__main__":
    main()
