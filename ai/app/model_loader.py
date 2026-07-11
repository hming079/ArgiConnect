from __future__ import annotations

from functools import lru_cache

from predict import MODEL_PATH, load_model, selected_model_name


@lru_cache(maxsize=1)
def cached_model():
    return load_model()


def model_is_available() -> bool:
    return MODEL_PATH.exists()


def current_model_name() -> str:
    return selected_model_name()
