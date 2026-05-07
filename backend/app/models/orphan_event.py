from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class OrphanEvent(Document):
    """Event that could not be joined to any UBID — never silently dropped."""

    department: str
    raw_source_id: str
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
