from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone


class LinkedRecord(Document):
    department: str
    source_id: str
    confidence: float
    explanation: Optional[str] = None
    link_type: str          # auto | human | pan_anchor | gstin_anchor
    reviewer_id: Optional[str] = None
    linked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        arbitrary_types_allowed = True


class MergeEvent(Document):
    action: str             # merge | split | revert
    record_ids: List[str]
    confidence: Optional[float] = None
    performed_by: str       # system | reviewer username
    reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        arbitrary_types_allowed = True


class UBIDDocument(Document):
    """Core UBID registry entry — one document per unique business identity."""

    ubid: str                              # e.g. UBID-KA-560058-00142
    status: str = "active_ubid"           # active_ubid | split | merged_into

    # Central identifier anchors
    pan_anchor: Optional[str] = None
    gstin_anchor: Optional[str] = None

    # Linked source records (one per dept record in this cluster)
    linked_records: List[dict] = Field(default_factory=list)

    # Activity classification
    activity_status: str = "Unknown"       # Active | Dormant | Closed | Unknown
    activity_score: float = 0.0
    activity_evidence: List[str] = Field(default_factory=list)
    activity_last_computed: Optional[datetime] = None

    # Merge/split audit trail (append-only)
    merge_history: List[dict] = Field(default_factory=list)

    # Reviewer overrides on activity status
    activity_override: Optional[dict] = None  # {status, reason, reviewer, expires_at}

    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "ubid_registry"
        indexes = [
            "ubid",
            "pan_anchor",
            "gstin_anchor",
            "activity_status",
            [("linked_records.department", 1), ("linked_records.source_id", 1)],
        ]
