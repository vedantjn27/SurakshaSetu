from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class ScrambledRecord(Document):
    """
    PII-scrambled copy of MasterRecord.
    This is the ONLY collection accessible to the LLM (Mistral) layer.
    Real PII never crosses the LLM boundary.
    """
    master_record_id: str          # Reference to MasterRecord._id (as string)
    department: str
    source_id: str                 # Scrambled source ID

    # Scrambled PII fields
    scr_business_name: str
    scr_owner_name: Optional[str] = None
    scr_address: Optional[str] = None
    scr_phone: Optional[str] = None
    scr_email: Optional[str] = None
    scr_pan: Optional[str] = None         # Format-preserving scramble
    scr_gstin: Optional[str] = None       # Format-preserving scramble

    # Non-PII fields (unchanged — needed for analytics)
    pin_code: Optional[str] = None
    district: Optional[str] = None
    sector: Optional[str] = None
    reg_date: Optional[str] = None
    norm_phonetic_key: Optional[str] = None
    norm_locality: Optional[str] = None

    ubid: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "scrambled_records"
        indexes = ["master_record_id", "ubid", "department"]
