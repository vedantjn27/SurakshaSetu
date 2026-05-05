"""
services/normaliser.py
Business name normalisation — lowercase, abbreviation expansion,
legal suffix extraction, and Metaphone phonetic encoding.
All rules loaded from config/rules.yaml.
"""
import re
import jellyfish
from unidecode import unidecode
from app.config import get_settings


def _load_abbrev() -> dict:
    return get_settings().rules.get("abbreviations", {})


def _load_locality_synonyms() -> dict:
    return get_settings().rules.get("locality_synonyms", {})


# Legal suffixes to strip for matching (preserve original)
LEGAL_SUFFIXES = [
    "private limited", "pvt ltd", "pvt. ltd.", "pvt. ltd",
    "limited liability partnership", "llp",
    "limited", "ltd", "ltd.",
    "proprietorship", "proprietor", "propr",
    "partnership firm", "partnership",
    "public limited",
]


def normalise_name(raw_name: str) -> dict:
    """
    Returns dict with:
      - norm: normalised comparable string
      - legal_suffix: extracted suffix (e.g. 'private limited')
      - phonetic_key: Metaphone encoding for blocking
    """
    if not raw_name:
        return {"norm": "", "legal_suffix": "", "phonetic_key": ""}

    # Step 1: ASCII-fold (handles Unicode/Kannada transliterations)
    text = unidecode(raw_name).lower().strip()

    # Step 2: Remove punctuation except spaces
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    # Step 3: Extract legal suffix before expanding abbreviations
    legal_suffix = ""
    for suffix in LEGAL_SUFFIXES:
        if text.endswith(suffix):
            legal_suffix = suffix
            text = text[: -len(suffix)].strip()
            break

    # Step 4: Expand abbreviations (word-boundary safe)
    abbrev = _load_abbrev()
    tokens = text.split()
    expanded = []
    for token in tokens:
        expanded.append(abbrev.get(token, token))
    text = " ".join(expanded).strip()

    # Step 5: Phonetic key — Metaphone on each token, join
    phonetic_tokens = []
    for token in text.split():
        try:
            ph = jellyfish.metaphone(token)
            if ph:
                phonetic_tokens.append(ph)
        except Exception:
            phonetic_tokens.append(token.upper())
    phonetic_key = " ".join(phonetic_tokens)

    return {
        "norm": text,
        "legal_suffix": legal_suffix,
        "phonetic_key": phonetic_key,
    }
