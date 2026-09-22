"""The shared preprocessing and modelling pipeline."""

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline

from src.features import CATEGORICAL, NUMERIC, add_features


def build(model):
    """Build the same feature, preprocessing, and model steps for train and serving."""
    preprocessor = ColumnTransformer(
        [
            ("num", StandardScaler(), NUMERIC),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL,
            ),
        ]
    )
    return Pipeline(
        [
            ("features", FunctionTransformer(add_features)),
            ("prep", preprocessor),
            ("model", model),
        ]
    )
