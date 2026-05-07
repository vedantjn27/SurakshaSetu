from beanie import Document
from pydantic import Field
from typing import Optional, Any
from datetime import datetime, timezone


class AuditLog(Document):
    """Immutable log of every automated decision — linkage or classification."""

    decision_type: str          # auto_link | keep_separate | activity_classification | merge_reverted
    entity_ids: list            # record IDs or UBID IDs involved
    ubid: Optional[str] = None

    # Decision details
    confidence_score: Optional[float] = None
    feature_breakdown: Optional[dict] = None
    threshold_at_decision: Optional[dict] = None   # Thresholds in rules.yaml at time of decision
    model_version: str = "v1.0.0"
    outcome: str                                    # e.g. "auto_link", "review", "Active"

    # For classification decisions
    activity_score: Optional[float] = None
    activity_evidence: Optional[list] = None

    # Who / when
    performed_by: str = "system"        # system | reviewer username
    reviewer_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_log"
        indexes = ["decision_type", "ubid", "timestamp", "performed_by"]
