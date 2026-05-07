"""
services/scrambler.py
Deterministic PII scrambling using HMAC-SHA256.
Same real value always maps to same synthetic value (seed is fixed).
Returns data in unreadable hash-type format as requested by the user.
"""
import hashlib
import hmac
from typing import Optional
from app.config import get_settings


def _hmac_bytes(value) -> bytes:
    """HMAC-SHA256 of value (coerced to str for safety with pandas int/float)."""
    seed = get_settings().scrambler_secret_seed.encode()
    return hmac.new(seed, str(value).encode("utf-8"), hashlib.sha256).digest()


def _hash_hex(value) -> Optional[str]:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    return f"hash:{_hmac_bytes(raw).hex()}"


def scramble_text(raw) -> Optional[str]:
    return _hash_hex(raw)


def scramble_name(raw) -> Optional[str]:
    return _hash_hex(raw)


def scramble_address(raw) -> Optional[str]:
    return _hash_hex(raw)


def scramble_phone(raw) -> Optional[str]:
    return _hash_hex(raw)


def scramble_email(raw) -> Optional[str]:
    return _hash_hex(raw)


def scramble_pan(raw: Optional[str]) -> Optional[str]:
    return _hash_hex(raw)


def scramble_gstin(raw: Optional[str]) -> Optional[str]:
    return _hash_hex(raw)


def scramble_source_id(raw: Optional[str]) -> Optional[str]:
    return _hash_hex(raw)
