"""
services/scorer.py
Confidence scoring for candidate pairs.
Uses weighted sum from rules.yaml feature_weights.
PAN/GSTIN hard floor applied when an identifier matches.
Falls back to weighted sum if no trained model is available.
"""
import os
import joblib
import numpy as np
from typing import Optional
from app.config import get_settings
from app.core.logger import logger

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "matcher_lr.joblib")
_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    if os.path.exists(MODEL_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
            logger.info("Loaded trained logistic regression matcher model.")
            return _model
        except Exception as e:
            logger.warning(f"Could not load matcher model: {e}. Using rule-based scoring.")
    return None


def _feature_order() -> list:
    """Return feature names in consistent order for model inference."""
    return [
        "name_jaro_winkler",
        "name_token_sort",
        "pin_code_exact",
        "locality_similarity",
        "plot_similarity",
        "pan_exact",
        "gstin_exact",
        "phone_exact",
    ]


def compute_score(features: dict) -> tuple[float, str]:
    """
    Returns (score: float, method: str)
    method = 'model' | 'weighted_sum'
    """
    rules = get_settings().rules
    hard_floor = rules["matching"].get("pan_gstin_hard_floor", 0.88)

    # Hard floor: PAN or GSTIN exact match
    if features.get("pan_exact", 0) == 1.0 or features.get("gstin_exact", 0) == 1.0:
        raw_score = _weighted_sum(features, rules)
        score = max(raw_score, hard_floor)
        return round(score, 4), "weighted_sum_with_floor"

    # Try trained model first
    model = _load_model()
    if model is not None:
        try:
            feature_vec = np.array([[features.get(f, 0.0) for f in _feature_order()]])
            prob = model.predict_proba(feature_vec)[0][1]
            return round(float(prob), 4), "model"
        except Exception as e:
            logger.warning(f"Model inference failed: {e}. Falling back to weighted sum.")

    return round(_weighted_sum(features, rules), 4), "weighted_sum"


def _weighted_sum(features: dict, rules: dict) -> float:
    weights = rules["matching"]["feature_weights"]
    total_weight = sum(weights.values())
    score = sum(features.get(k, 0.0) * w for k, w in weights.items())
    return min(score / total_weight, 1.0) if total_weight > 0 else 0.0


def build_explanation(features: dict, score: float, method: str) -> str:
    """Generate plain-English explanation of the confidence score."""
    rules = get_settings().rules
    weights = rules["matching"]["feature_weights"]

    parts = []
    for feat, weight in sorted(weights.items(), key=lambda x: -x[1]):
        val = features.get(feat, 0.0)
        contribution = val * weight
        label = feat.replace("_", " ").title()
        if val > 0.8:
            parts.append(f"{label}: strong match (contributing {contribution:.2f})")
        elif val > 0.4:
            parts.append(f"{label}: partial match (contributing {contribution:.2f})")
        elif val == 1.0 and "exact" in feat:
            parts.append(f"{label}: exact match — hard floor applied")

    missing = [f for f in ["pan_exact", "gstin_exact"] if features.get(f, 0) == 0.0]
    if missing:
        parts.append("No PAN/GSTIN available to confirm identity (0.00 from identifiers)")

    explanation = f"Score: {score:.2f} [{method}]. " + " | ".join(parts[:4])
    return explanation
