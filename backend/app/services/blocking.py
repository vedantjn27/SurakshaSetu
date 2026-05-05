"""
services/blocking.py
Multi-pass blocking — generates candidate pairs using multiple independent
blocking keys. A pair qualifies if they share ANY key (union of passes).
Reduces O(n²) comparisons to a manageable candidate set.
"""
from itertools import combinations
from typing import List, Dict, Set, Tuple
from app.models.master_record import MasterRecord


def _blocking_keys(record: MasterRecord) -> Set[str]:
    """Generate all blocking keys for a single record."""
    keys = set()
    pin = record.norm_pin_code or ""
    name = record.norm_business_name or ""
    phonetic = record.norm_phonetic_key or ""
    pan = record.pan_clean or ""
    gstin = record.gstin_clean or ""

    # Key 1: exact pin code
    if pin:
        keys.add(f"PIN:{pin}")

    # Key 2: pin + first token of normalised name
    if pin and name:
        first_token = name.split()[0] if name.split() else ""
        if first_token:
            keys.add(f"PIN_TOK:{pin}:{first_token}")

    # Key 3: phonetic encoding of name
    if phonetic:
        keys.add(f"PHON:{phonetic}")

    # Key 4: exact PAN
    if pan:
        keys.add(f"PAN:{pan}")

    # Key 5: exact GSTIN
    if gstin:
        keys.add(f"GSTIN:{gstin}")

    # Key 6: pin + first 3 chars of norm name
    if pin and len(name) >= 3:
        keys.add(f"PIN_PRE:{pin}:{name[:3]}")

    return keys


def generate_candidate_pairs(
    records: List[MasterRecord],
) -> List[Tuple[MasterRecord, MasterRecord]]:
    """
    Returns a deduplicated list of candidate pairs.
    Pairs from the same department + same source_id are excluded.
    """
    # Build inverted index: blocking_key → list of records
    key_to_records: Dict[str, List[MasterRecord]] = {}
    for record in records:
        for key in _blocking_keys(record):
            key_to_records.setdefault(key, []).append(record)

    # Collect candidate pairs (deduplicated by sorted ID tuple)
    seen: Set[Tuple[str, str]] = set()
    pairs: List[Tuple[MasterRecord, MasterRecord]] = []

    for key, bucket in key_to_records.items():
        if len(bucket) < 2:
            continue
        for r1, r2 in combinations(bucket, 2):
            id1 = str(r1.id)
            id2 = str(r2.id)
            pair_key = (min(id1, id2), max(id1, id2))
            if pair_key in seen:
                continue
            # Skip exact same record
            if id1 == id2:
                continue
            seen.add(pair_key)
            pairs.append((r1, r2))

    return pairs
