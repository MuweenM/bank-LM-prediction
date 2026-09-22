"""Dataset loading helpers."""

from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split


DATA_PATH = Path(__file__).parents[1] / "data" / "raw" / "bank_marketing.csv"


def load_bank(path: str | Path = DATA_PATH) -> pd.DataFrame:
    """Load the cached bank-marketing dataset."""
    return pd.read_csv(path, sep=";")


def get_split(
    data: pd.DataFrame | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Return the required stratified train/test split."""
    bank = load_bank() if data is None else data.copy()
    X = bank.drop(columns="y")
    y = bank["y"]
    return train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=42,
    )
