from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class EventDocument(Document):
    """Activity event joined to a UBID — the evidence timeline."""

    ubid: str
    department: str
    source_id: str                    # Dept record ID that generated this event
    event_type: str                   # utility_reading | licence_renewal | inspection_pass | etc.
    event_date: datetime
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Event-specific metadata
    metadata: dict = Field(default_factory=dict)
    # Examples:
    #   utility_reading: {units_consumed: 4820}
    #   inspection_pass: {inspector_name: "...", outcome: "SATISFACTORY"}
    #   licence_renewal: {valid_until: "2026-01-14", licence_type: "KSPCB Consent"}

    # Join tracking
    join_confidence: float = 1.0      # How confident was the source_id → UBID mapping
    join_type: str = "auto"           # auto | manual (reviewer assigned)
    reviewer_id: Optional[str] = None

    class Settings:
        name = "event_timeline"
        indexes = [
            "ubid",
            "department",
            "event_type",
            "event_date",
            [("ubid", 1), ("event_date", -1)],
        ]
