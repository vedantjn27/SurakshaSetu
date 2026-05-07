"""
services/classifier.py
YAML-defined time-decay activity classifier.
Produces Active / Dormant / Closed with a full evidence breakdown.
No ML model — every signal is named, weighted, and traceable.
"""
import math
from datetime import datetime, timezone
from typing import List
from app.models.event import EventDocument
from app.models.ubid import UBIDDocument
from app.models.audit_log import AuditLog
from app.config import get_settings
from app.core.logger import logger


def _decay_weight(base_weight: float, half_life_days: int, days_since: float) -> float:
    """Exponential decay: weight × 0.5^(days / half_life)"""
    if days_since < 0:
        days_since = 0
    return base_weight * math.pow(0.5, days_since / half_life_days)


async def classify_ubid(ubid_doc: UBIDDocument) -> dict:
    """
    Run the YAML activity classifier for a UBID.
    Returns classification dict and persists result to the UBID document.
    """
    rules = get_settings().rules
    event_weights = rules["activity_classification"]["event_weights"]
    active_min = rules["activity_classification"]["active_min_score"]
    closed_max = rules["activity_classification"]["closed_max_score"]

    # Fetch all events for this UBID
    events: List[EventDocument] = await EventDocument.find(
        EventDocument.ubid == ubid_doc.ubid
    ).to_list()

    now = datetime.now(timezone.utc)
    total_score = 0.0
    evidence_lines = []

    for event in events:
        event_type = event.event_type
        if event_type not in event_weights:
            continue

        cfg = event_weights[event_type]
        base = cfg["base_weight"]
        half_life = cfg["half_life_days"]
        description = cfg.get("description", event_type)

        event_date = event.event_date
        if event_date.tzinfo is None:
            event_date = event_date.replace(tzinfo=timezone.utc)
        days_since = (now - event_date).days

        current_weight = _decay_weight(base, half_life, days_since)
        total_score += current_weight

        direction = "+" if current_weight >= 0 else ""
        evidence_lines.append(
            f"{event.department.upper()} — {description} "
            f"({days_since}d ago): {direction}{current_weight:.3f}"
        )

    # Check for reviewer override
    if ubid_doc.activity_override:
        override = ubid_doc.activity_override
        expires = override.get("expires_at")
        if expires is None or datetime.fromisoformat(expires) > now:
            status = override["status"]
            evidence_lines.insert(0, f"REVIEWER OVERRIDE: {override.get('reason', '')}")
            return _build_result(ubid_doc, status, total_score, evidence_lines)

    # Classify
    # If no events have been joined yet, treat as Active (newly registered business
    # is presumed active until we get evidence it's dormant/closed)
    if not events:
        status = "Active"
        evidence_lines = ["No activity events yet — newly registered, presumed Active"]
    elif total_score >= active_min:
        status = "Active"
    elif total_score <= closed_max:
        status = "Closed"
    else:
        status = "Dormant"

    return await _build_result(ubid_doc, status, total_score, evidence_lines)


async def _build_result(
    ubid_doc: UBIDDocument,
    status: str,
    score: float,
    evidence_lines: list,
) -> dict:
    ubid_doc.activity_status = status
    ubid_doc.activity_score = round(score, 4)
    ubid_doc.activity_evidence = evidence_lines
    ubid_doc.activity_last_computed = datetime.now(timezone.utc)
    ubid_doc.updated_at = datetime.now(timezone.utc)
    await ubid_doc.save()

    # Audit log
    await AuditLog(
        decision_type="activity_classification",
        entity_ids=[ubid_doc.ubid],
        ubid=ubid_doc.ubid,
        outcome=status,
        activity_score=score,
        activity_evidence=evidence_lines,
        performed_by="system",
    ).insert()

    logger.debug(f"Classified {ubid_doc.ubid} → {status} (score={score:.3f})")
    return {
        "ubid": ubid_doc.ubid,
        "activity_status": status,
        "activity_score": round(score, 4),
        "evidence": evidence_lines,
    }
