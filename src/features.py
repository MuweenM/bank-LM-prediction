"""Feature engineering and column definitions."""

import numpy as np
import pandas as pd


TARGET_COLUMN = "y"

RAW_NUMERIC = ["age", "balance", "day", "campaign", "pdays", "previous"]
RAW_CATEGORICAL = [
    "job",
    "marital",
    "education",
    "default",
    "housing",
    "loan",
    "contact",
    "month",
    "poutcome",
]

NUMERIC = RAW_NUMERIC + ["prev_contacted", "has_debt", "balance_log"]
CATEGORICAL = RAW_CATEGORICAL + ["age_group"]


def add_features(data: pd.DataFrame) -> pd.DataFrame:
    """Return deterministic pre-call features without learning from the data."""
    features = data.copy()
    features["prev_contacted"] = (features["pdays"] != -1).astype(int)
    features["has_debt"] = (
        features["housing"].eq("yes") | features["loan"].eq("yes")
    ).astype(int)
    features["balance_log"] = np.sign(features["balance"]) * np.log1p(
        features["balance"].abs()
    )
    features["age_group"] = pd.cut(
        features["age"],
        bins=[0, 25, 35, 45, 55, 65, np.inf],
        labels=["0-25", "26-35", "36-45", "46-55", "56-65", "65+"],
    ).astype("string")
    return features
