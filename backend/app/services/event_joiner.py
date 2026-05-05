"""
services/event_joiner.py
Joins incoming activity events to UBIDs.
Three outcomes: confident join | staging (pending review) | orphan queue.
"""
from datetime import datetime, timezone
from typing import Optional
from app.models.event import EventDocument
from app.models.ubid import UBIDDocument
from app.models.master_record import MasterRecord
from app.models.orphan_event import OrphanEvent
from app.models.review_item import ReviewItem
from app.core.logger import logger


async def join_event(
    department: str,
    source_id: str,
    event_type: str,
    event_date: datetime,
    metadata: dict,
) -> dict:
    """
    Attempt to join an event to a UBID.
    Returns: {outcome: 'joined'|'orphan', ubid: str|None, event_id: str|None}
    """
    # Step 1: Look up source_id in master_records
    record = await MasterRecord.find_one(
        MasterRecord.department == department,
        MasterRecord.source_id == source_id,
    )

    if not record:
        # Unknown source ID — orphan
        orphan = await OrphanEvent(
            department=department,
            raw_source_id=source_id,
            event_type=event_type,
            event_date=event_date,
            metadata=metadata,
        ).insert()
        logger.warning(f"Orphan event: {department}:{source_id} type={event_type}")
        return {"outcome": "orphan", "ubid": None, "orphan_id": str(orphan.id)}

    if not record.ubid:
        # Record exists but not yet linked to a UBID (still pending matching)
        orphan = await OrphanEvent(
            department=department,
            raw_source_id=source_id,
            event_type=event_type,
            event_date=event_date,
            metadata={**metadata, "reason": "record_not_yet_linked"},
        ).insert()
        logger.info(f"Event staged — record {source_id} not yet linked to UBID")
        return {"outcome": "orphan", "ubid": None, "orphan_id": str(orphan.id)}

    # Step 2: Verify UBID still active
    ubid_doc = await UBIDDocument.find_one(UBIDDocument.ubid == record.ubid)
    if not ubid_doc or ubid_doc.status != "active_ubid":
        orphan = await OrphanEvent(
            department=department,
            raw_source_id=source_id,
            event_type=event_type,
            event_date=event_date,
            metadata={**metadata, "reason": "ubid_not_active"},
        ).insert()
        return {"outcome": "orphan", "ubid": None, "orphan_id": str(orphan.id)}

    # Step 3: Confident join
    event = await EventDocument(
        ubid=record.ubid,
        department=department,
        source_id=source_id,
        event_type=event_type,
        event_date=event_date,
        metadata=metadata,
        join_confidence=record.link_confidence or 1.0,
        join_type="auto",
    ).insert()

    logger.info(f"Event joined: {department}:{source_id} → {record.ubid} ({event_type})")

    # Re-classify the UBID after new event
    from app.services.classifier import classify_ubid
    await classify_ubid(ubid_doc)

    return {"outcome": "joined", "ubid": record.ubid, "event_id": str(event.id)}
