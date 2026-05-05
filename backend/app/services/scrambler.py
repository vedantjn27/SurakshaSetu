"""
services/scrambler.py
Deterministic PII scrambling using HMAC-SHA256.
Same real value always maps to same synthetic value (seed is fixed).
Linkage relationships are preserved across scrambled datasets.
Format-preserving for PAN and GSTIN.
"""
import hashlib
import hmac
import string
from typing import Optional
from faker import Faker
from app.config import get_settings

fake = Faker("en_IN")

# Character pools for format-preserving scrambling
ALPHA = string.ascii_uppercase
DIGITS = string.digits


def _hmac_bytes(value) -> bytes:
    """HMAC-SHA256 of value (coerced to str for safety with pandas int/float)."""
    seed = get_settings().scrambler_secret_seed.encode()
    return hmac.new(seed, str(value).encode("utf-8"), hashlib.sha256).digest()


def _deterministic_int(value: str, max_val: int) -> int:
    """Deterministic integer in [0, max_val) derived from value."""
    digest = _hmac_bytes(value)
    return int.from_bytes(digest[:4], "big") % max_val


def scramble_text(raw) -> Optional[str]:
    """Scramble a free-text field deterministically using Faker seeded by HMAC."""
    if raw is None:
        return None
    raw = str(raw).strip()
    if not raw:
        return None
    seed_int = int.from_bytes(_hmac_bytes(raw)[:4], "big")
    Faker.seed(seed_int)
    return fake.company()


def scramble_name(raw) -> Optional[str]:
    if raw is None:
        return None
    raw = str(raw).strip()
    if not raw:
        return None
    seed_int = int.from_bytes(_hmac_bytes(raw)[:4], "big")
    Faker.seed(seed_int)
    return fake.name()


def scramble_address(raw) -> Optional[str]:
    if raw is None:
        return None
    raw = str(raw).strip()
    if not raw:
        return None
    seed_int = int.from_bytes(_hmac_bytes(raw)[:4], "big")
    Faker.seed(seed_int)
    return fake.address().replace("\n", ", ")


def scramble_phone(raw) -> Optional[str]:
    if raw is None:
        return None
    raw = str(raw).strip()
    if not raw:
        return None
    seed_int = int.from_bytes(_hmac_bytes(raw)[:4], "big")
    Faker.seed(seed_int)
    return fake.phone_number()


def scramble_email(raw) -> Optional[str]:
    if raw is None:
        return None
    raw = str(raw).strip()
    if not raw:
        return None
    seed_int = int.from_bytes(_hmac_bytes(raw)[:4], "big")
    Faker.seed(seed_int)
    return fake.email()


def scramble_pan(raw: Optional[str]) -> Optional[str]:
    """Format-preserving PAN scramble: [A-Z]{5}[0-9]{4}[A-Z]"""
    if not raw or len(raw) != 10:
        return raw
    h = _hmac_bytes(raw)
    chars = [ALPHA[h[i] % 26] for i in range(5)]
    digits = [DIGITS[h[i + 5] % 10] for i in range(4)]
    last = ALPHA[h[9] % 26]
    return "".join(chars) + "".join(digits) + last


def scramble_gstin(raw: Optional[str]) -> Optional[str]:
    """Format-preserving GSTIN scramble — preserves state code prefix."""
    if not raw or len(raw) != 15:
        return raw
    state_code = raw[:2]  # Keep state code (non-identifying)
    pan_part = scramble_pan(raw[2:12])
    h = _hmac_bytes(raw)
    entity = DIGITS[h[12] % 10]
    checksum = ALPHA[h[13] % 26]
    return f"{state_code}{pan_part}{entity}Z{checksum}"


def scramble_source_id(raw: Optional[str]) -> Optional[str]:
    """Scramble a department source ID while preserving prefix pattern."""
    if not raw:
        return None
    h = _hmac_bytes(raw)
    suffix = "".join([DIGITS[h[i] % 10] for i in range(6)])
    parts = raw.split("-")
    if len(parts) > 1:
        return f"{parts[0]}-SCR-{suffix}"
    return f"SCR-{suffix}"
