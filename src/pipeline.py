"""Model pipeline construction."""

from sklearn.pipeline import Pipeline


def build(model) -> Pipeline:
    """Build the production pipeline around a supplied estimator."""
    return Pipeline([( "model", model)])
