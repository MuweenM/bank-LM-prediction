"""Dataset loading and splitting helpers."""

from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from src.features import RAW_CATEGORICAL, RAW_NUMERIC


DATA_PATH = Path(__file__).parents[1] / "data" / "raw" / "bank_marketing.csv"
RAW_COLUMNS = RAW_NUMERIC + RAW_CATEGORICAL


def _clean_columns(data: pd.DataFrame) -> pd.DataFrame:
    """Use the names expected by the project and fill categorical gaps."""
    data = data.rename(columns={"day_of_week": "day"})
    for column in RAW_CATEGORICAL:
        if column in data:
            data[column] = data[column].fillna("unknown")
    return data


def load_bank(path: str | Path = DATA_PATH) -> pd.DataFrame:
    """Load Bank Marketing data, using the local CSV cache after first fetch."""
    path = Path(path)
    if path.exists():
        return _clean_columns(pd.read_csv(path, sep=None, engine="python"))

    from ucimlrepo import fetch_ucirepo

    bank_marketing = fetch_ucirepo(id=222)
    features = bank_marketing.data.features.copy()
    target = bank_marketing.data.targets.iloc[:, 0].rename("y")
    data = _clean_columns(pd.concat([features, target], axis=1))
    path.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(path, index=False)
    return data


def get_split():
    """Return a stratified 80/20 split using only the 15 pre-call features."""
    data = load_bank()
    y = data["y"].map({"yes": 1, "no": 0})
    X = data[RAW_COLUMNS]
    return train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )


if __name__ == "__main__":
    X_train, X_test, y_train, y_test = get_split()
    print(f"X_train: {X_train.shape}")
    print(f"X_test: {X_test.shape}")
    print(f"y_train: {y_train.shape}")
    print(f"y_test: {y_test.shape}")
    print(f"Overall yes-rate: {pd.concat([y_train, y_test]).mean():.3f}")
