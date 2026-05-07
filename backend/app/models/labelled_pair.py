from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class LabelledPair(Document):
    """
    Reviewer decisions stored as labelled training examples.
    Used to retrain the logistic regression matcher.
    """
    record_a_id: str
    record_b_id: str
    feature_vector: dict        # Same features computed during matching
    label: int                  # 1 = match, 0 = not a match
    labelled_by: str            # reviewer username
    confidence_score: float     # Score at time of review
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "labelled_pairs"
        indexes = ["label", "labelled_by", "created_at"]
