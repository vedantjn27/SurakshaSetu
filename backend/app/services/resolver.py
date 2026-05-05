"""
services/resolver.py
Three-way decision router.
Given a confidence score, routes to: auto_link | review | keep_separate.
Logs every decision to audit_log.
"""
from datetime import datetime, timezone
from app.config import get_settings
from app.models.audit_log import AuditLog
from app.models.review_item import ReviewItem
from app.core.logger import logger


async def resolve_pair(
    record_a,
    record_b,
    features: dict,
    score: float,
    explanation: str,
    score_method: str,
) -> dict:
    """
    Returns dict with:
      decision: 'auto_link' | 'review' | 'keep_separate'
      score: float
      explanation: str
    Also persists to audit_log and (if review) to review_queue.
    """
    rules = get_settings().rules["matching"]
    auto_thresh = rules["auto_link_threshold"]
    review_thresh = rules["review_threshold"]

    id_a = str(record_a.id)
    id_b = str(record_b.id)

    if score >= auto_thresh:
        decision = "auto_link"
    elif score >= review_thresh:
        decision = "review"
    else:
        decision = "keep_separate"

    logger.info(
        f"Pair ({record_a.department}:{record_a.source_id}, "
        f"{record_b.department}:{record_b.source_id}) → "
        f"{decision} [score={score:.3f}]"
    )

    # Audit log — every decision stored
    await AuditLog(
        decision_type=decision,
        entity_ids=[id_a, id_b],
        confidence_score=score,
        feature_breakdown=features,
        threshold_at_decision={"auto_link": auto_thresh, "review": review_thresh},
        outcome=decision,
        performed_by="system",
    ).insert()

    # If review → add to review queue
    if decision == "review":
        await ReviewItem(
            record_a_id=id_a,
            record_b_id=id_b,
            record_a_dept=record_a.department,
            record_b_dept=record_b.department,
            record_a_source_id=record_a.source_id,
            record_b_source_id=record_b.source_id,
            confidence_score=score,
            feature_breakdown=features,
            explanation=explanation,
        ).insert()

    return {
        "decision": decision,
        "score": score,
        "explanation": explanation,
        "record_a_id": id_a,
        "record_b_id": id_b,
    }
