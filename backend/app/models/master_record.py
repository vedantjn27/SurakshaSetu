from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class MasterRecord(Document):
    """Raw + normalised business record from any department system."""

    # Source identifiers
    department: str                        # e.g. "factories", "kspcb"
    source_id: str                         # Original ID from dept (reg_number, consent_number)
    ingestion_job_id: str                  # Links to the upload batch

    # Raw fields (exactly as received)
    raw_business_name: str
    raw_address: str
    raw_pan: Optional[str] = None
    raw_gstin: Optional[str] = None
    raw_owner_name: Optional[str] = None
    raw_phone: Optional[str] = None
    raw_email: Optional[str] = None
    raw_pin_code: Optional[str] = None
    raw_reg_date: Optional[str] = None
    extra_fields: dict = Field(default_factory=dict)  # Any dept-specific extra columns

    # Normalised fields (computed, non-destructive)
    norm_business_name: Optional[str] = None
    norm_legal_suffix: Optional[str] = None
    norm_phonetic_key: Optional[str] = None
    norm_address_plot: Optional[str] = None
    norm_address_locality: Optional[str] = None
    norm_address_city: Optional[str] = None
    norm_pin_code: Optional[str] = None

    # PAN/GSTIN validation
    pan_status: str = "not_provided"        # valid | invalid_format | not_provided
    gstin_status: str = "not_provided"
    pan_clean: Optional[str] = None         # Cleaned valid PAN
    gstin_clean: Optional[str] = None
    pan_gstin_cross_check: str = "na"       # pass | fail | na

    # UBID linkage
    ubid: Optional[str] = None             # Populated after resolution
    link_confidence: Optional[float] = None
    link_type: Optional[str] = None        # auto | human | pan_anchor

    # Metadata
    content_hash: str = ""                 # SHA-256 of normalised content (idempotency)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "master_records"
        indexes = [
            "department",
            "source_id",
            "ubid",
            "pan_clean",
            "gstin_clean",
            "norm_pin_code",
            "ingestion_job_id",
        ]
