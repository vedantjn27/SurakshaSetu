from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class ReviewItem(Document):
    """Ambiguous candidate pair waiting for human reviewer decision."""

    queue_type: str = "match_review"    # match_review | always match_review for this model

    # The two records being compared
    record_a_id: str                    # MasterRecord._id
    record_b_id: str
    record_a_dept: str
    record_b_dept: str
    record_a_source_id: str
    record_b_source_id: str

    # Matching evidence
    confidence_score: float
    feature_breakdown: dict             # {feature_name: value, ...}
    explanation: Optional[str] = None   # Plain-English from Mistral or template

    # Status
    status: str = "pending"            # pending | merged | rejected | escalated
    reviewer_id: Optional[str] = None
    reviewer_decision: Optional[str] = None
    reviewer_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    # Result UBID if merged
    resulting_ubid: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "review_queue"
        indexes = ["status", "created_at", "record_a_dept", "record_b_dept"]


class OrphanEvent(Document):
    """Event that could not be joined to any UBID — never silently dropped."""

    department: str
    raw_source_id: str                  # The ID from the event that couldn't be resolved
    event_type: str
    event_date: datetime
    metadata: dict = Field(default_factory=dict)

    status: str = "pending"            # pending | assigned | dismissed
    assigned_ubid: Optional[str] = None
    reviewer_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "orphan_events"
        indexes = ["status", "department", "created_at"]
