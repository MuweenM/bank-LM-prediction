"""Dataset loading helpers."""

from pathlib import Path

import pandas as pd


DATA_PATH = Path(__file__).parents[1] / "data" / "raw" / "bank_marketing.csv"


def load_bank(path: str | Path = DATA_PATH) -> pd.DataFrame:
    """Load the cached bank-marketing dataset."""
    return pd.read_csv(path)
