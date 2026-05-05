"""
services/matcher.py
Computes the feature vector for a candidate pair.
All signal weights come from rules.yaml — nothing hardcoded.
"""
from typing import Optional
from rapidfuzz import fuzz
from app.models.master_record import MasterRecord
from app.config import get_settings


def _norm_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    import re
    digits = re.sub(r"\D", "", phone)
    return digits[-10:] if len(digits) >= 10 else digits


def compute_features(r1: MasterRecord, r2: MasterRecord) -> dict:
    """
    Returns a feature dict with values in [0, 1] for each signal.
    PAN/GSTIN exact matches return 1.0 — they are near-deterministic.
    """
    features = {}

    # ── Name signals ───────────────────────────────────────────
    n1 = r1.norm_business_name or ""
    n2 = r2.norm_business_name or ""

    features["name_jaro_winkler"] = fuzz.WRatio(n1, n2) / 100.0 if n1 and n2 else 0.0
    features["name_token_sort"] = fuzz.token_sort_ratio(n1, n2) / 100.0 if n1 and n2 else 0.0

    # ── Address signals ─────────────────────────────────────────
    pin1, pin2 = r1.norm_pin_code or "", r2.norm_pin_code or ""
    features["pin_code_exact"] = 1.0 if pin1 and pin2 and pin1 == pin2 else 0.0

    loc1 = r1.norm_address_locality or ""
    loc2 = r2.norm_address_locality or ""
    features["locality_similarity"] = fuzz.partial_ratio(loc1, loc2) / 100.0 if loc1 and loc2 else 0.0

    plot1 = r1.norm_address_plot or ""
    plot2 = r2.norm_address_plot or ""
    features["plot_similarity"] = fuzz.ratio(plot1, plot2) / 100.0 if plot1 and plot2 else 0.0

    # ── Identifier signals (near-deterministic) ─────────────────
    p1, p2 = r1.pan_clean, r2.pan_clean
    features["pan_exact"] = 1.0 if p1 and p2 and p1 == p2 else 0.0

    g1, g2 = r1.gstin_clean, r2.gstin_clean
    features["gstin_exact"] = 1.0 if g1 and g2 and g1 == g2 else 0.0

    # ── Supplementary signals ────────────────────────────────────
    ph1 = _norm_phone(r1.raw_phone)
    ph2 = _norm_phone(r2.raw_phone)
    features["phone_exact"] = 1.0 if ph1 and ph2 and ph1 == ph2 else 0.0

    return features


def has_identifier_match(features: dict) -> bool:
    return features.get("pan_exact", 0.0) == 1.0 or features.get("gstin_exact", 0.0) == 1.0
