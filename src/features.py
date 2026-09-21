"""Feature engineering and column definitions."""

import pandas as pd


TARGET_COLUMN = "y"


def add_features(data: pd.DataFrame) -> pd.DataFrame:
    """Return a feature-engineered copy of the input data."""
    return data.copy()
