"""
services/pan_gstin.py
Validates PAN and GSTIN format, cross-checks embedded PAN in GSTIN,
and extracts structured fields from GSTIN.
No external API calls — format-only validation.
"""
import re
from typing import Optional

# PAN: 5 alpha + 4 digit + 1 alpha
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")

# GSTIN: 2-digit state + 10-char PAN + 1 entity + 1 checksum + 1 (Z by default)
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$")

# Karnataka state code
KA_STATE_CODE = "29"


def validate_pan(raw: Optional[str]) -> dict:
    if not raw:
        return {"status": "not_provided", "clean": None}
    clean = raw.strip().upper().replace(" ", "").replace("-", "")
    if PAN_RE.match(clean):
        return {"status": "valid", "clean": clean}
    return {"status": "invalid_format", "clean": None}


def validate_gstin(raw: Optional[str]) -> dict:
    if not raw:
        return {
            "status": "not_provided", "clean": None,
            "embedded_pan": None, "state_code": None,
        }
    clean = raw.strip().upper().replace(" ", "")
    if not GSTIN_RE.match(clean):
        return {
            "status": "invalid_format", "clean": None,
            "embedded_pan": None, "state_code": None,
        }
    embedded_pan = clean[2:12]
    state_code = clean[:2]
    return {
        "status": "valid",
        "clean": clean,
        "embedded_pan": embedded_pan,
        "state_code": state_code,
    }


def cross_check(pan_result: dict, gstin_result: dict) -> str:
    """
    Returns: 'pass' | 'fail' | 'na'
    'pass' = both valid AND embedded PAN matches PAN field
    'fail' = both valid but PAN mismatch (serious data quality issue)
    'na'   = one or both not available/valid
    """
    if pan_result["status"] != "valid" or gstin_result["status"] != "valid":
        return "na"
    if pan_result["clean"] == gstin_result["embedded_pan"]:
        return "pass"
    return "fail"


def process_identifiers(raw_pan: Optional[str], raw_gstin: Optional[str]) -> dict:
    """Full PAN + GSTIN pipeline — returns everything needed for matching."""
    pan_r = validate_pan(raw_pan)
    gstin_r = validate_gstin(raw_gstin)
    cross = cross_check(pan_r, gstin_r)

    # If GSTIN cross-check passes but PAN field was missing, use embedded PAN
    effective_pan = pan_r["clean"]
    if effective_pan is None and gstin_r.get("embedded_pan") and gstin_r["status"] == "valid":
        effective_pan = gstin_r["embedded_pan"]

    return {
        "pan_status": pan_r["status"],
        "pan_clean": effective_pan,
        "gstin_status": gstin_r["status"],
        "gstin_clean": gstin_r["clean"],
        "pan_gstin_cross_check": cross,
    }
