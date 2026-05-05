"""
services/address_parser.py
Parses free-text Indian industrial addresses into structured components.
Applies Karnataka-specific locality synonym normalisation.
"""
import re
from unidecode import unidecode
from app.config import get_settings


def _synonyms() -> dict:
    return get_settings().rules.get("locality_synonyms", {})


def _valid_pins() -> set:
    return set(str(p) for p in get_settings().rules.get("valid_pin_codes", []))


# Regex to extract 6-digit Indian pin codes
PIN_RE = re.compile(r"\b(\d{6})\b")

# Common plot/door number patterns
PLOT_RE = re.compile(
    r"(?:plot\s*no\.?\s*|door\s*no\.?\s*|sy\.?\s*no\.?\s*|survey\s*no\.?\s*|#\s*)"
    r"([\w\-/]+)",
    re.IGNORECASE,
)


def parse_address(raw_address: str) -> dict:
    """
    Returns:
      plot, locality, city, pin_code, pin_valid, raw_remaining
    """
    if not raw_address:
        return {
            "plot": None, "locality": None,
            "city": None, "pin_code": None,
            "pin_valid": False, "raw_remaining": "",
        }

    text = unidecode(raw_address).strip()

    # Extract PIN
    pin_match = PIN_RE.search(text)
    pin_code = pin_match.group(1) if pin_match else None
    pin_valid = pin_code in _valid_pins() if pin_code else False
    if pin_match:
        text = text[: pin_match.start()] + text[pin_match.end():]

    # Extract plot number
    plot = None
    plot_match = PLOT_RE.search(text)
    if plot_match:
        plot = plot_match.group(1).strip()
        text = text[: plot_match.start()] + text[plot_match.end():]

    # Remove city indicators
    city = None
    city_patterns = [
        r"\bbengaluru\b", r"\bbangalore\b", r"\bblr\b", r"\bb'lore\b",
    ]
    for cp in city_patterns:
        if re.search(cp, text, re.IGNORECASE):
            city = "Bengaluru"
            text = re.sub(cp, "", text, flags=re.IGNORECASE)
            break

    # Normalise locality synonyms
    text_lower = text.lower().strip(" ,.-")
    locality = text_lower
    for synonym, canonical in _synonyms().items():
        if synonym in text_lower:
            locality = canonical
            break
    else:
        # Clean up remaining text as locality
        locality = re.sub(r"\s+", " ", text_lower).strip(" ,.-") or None

    return {
        "plot": plot,
        "locality": locality,
        "city": city or "Bengaluru",
        "pin_code": pin_code,
        "pin_valid": pin_valid,
        "raw_remaining": text.strip(),
    }
