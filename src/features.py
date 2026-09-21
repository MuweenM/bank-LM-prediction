"""Feature engineering definitions."""

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
NUMERIC = RAW_NUMERIC
CATEGORICAL = RAW_CATEGORICAL


def add_features(X):
    """Return an unchanged copy until feature engineering is implemented."""
    return X.copy()
