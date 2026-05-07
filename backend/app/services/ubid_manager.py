"""
services/ubid_manager.py
Creates, merges, splits and anchors UBIDs.
All operations are reversible — merge history is append-only.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.models.ubid import UBIDDocument
from app.models.master_record import MasterRecord
from app.models.audit_log import AuditLog
from app.core.logger import logger


def _generate_ubid(pin_code: Optional[str]) -> str:
    pin = pin_code or "000000"
    short = str(uuid.uuid4()).split("-")[0].upper()
    return f"UBID-KA-{pin}-{short}"


async def create_ubid_for_record(record: MasterRecord, explanation: Optional[str] = "Singleton creation") -> UBIDDocument:
    """Create a new singleton UBID for a single record."""
    ubid_id = _generate_ubid(record.norm_pin_code)
    linked = [{
        "department": record.department,
        "source_id": record.source_id,
        "master_record_id": str(record.id),
        "confidence": 1.0,
        "link_type": "singleton",
        "explanation": explanation,
        "linked_at": datetime.now(timezone.utc).isoformat(),
    }]
    doc = UBIDDocument(
        ubid=ubid_id,
        pan_anchor=record.pan_clean,
        gstin_anchor=record.gstin_clean,
        linked_records=linked,
        merge_history=[{
            "action": "created",
            "record_ids": [str(record.id)],
            "performed_by": "system",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }],
    )
    await doc.insert()
    # Update master record
    record.ubid = ubid_id
    record.link_confidence = 1.0
    record.link_type = "singleton"
    record.updated_at = datetime.now(timezone.utc)
    await record.save()
    return doc


async def merge_into_ubid(
    ubid: UBIDDocument,
    record: MasterRecord,
    confidence: float,
    link_type: str,
    reviewer_id: Optional[str] = None,
    explanation: Optional[str] = None,
) -> UBIDDocument:
    """Add a record to an existing UBID cluster."""
    ubid.linked_records.append({
        "department": record.department,
        "source_id": record.source_id,
        "master_record_id": str(record.id),
        "confidence": confidence,
        "link_type": link_type,
        "explanation": explanation,
        "reviewer_id": reviewer_id,
        "linked_at": datetime.now(timezone.utc).isoformat(),
    })
    # Update anchors if new record has identifiers
    if record.pan_clean and not ubid.pan_anchor:
        ubid.pan_anchor = record.pan_clean
    if record.gstin_clean and not ubid.gstin_anchor:
        ubid.gstin_anchor = record.gstin_clean

    ubid.merge_history.append({
        "action": "merge",
        "record_ids": [str(record.id)],
        "confidence": confidence,
        "link_type": link_type,
        "explanation": explanation,
        "performed_by": reviewer_id or "system",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    ubid.updated_at = datetime.now(timezone.utc)
    await ubid.save()

    # Update master record
    record.ubid = ubid.ubid
    record.link_confidence = confidence
    record.link_type = link_type
    record.updated_at = datetime.now(timezone.utc)
    await record.save()
    return ubid


async def split_ubid(
    ubid: UBIDDocument,
    master_record_id: str,
    reviewer_id: str,
    reason: str,
) -> Optional[UBIDDocument]:
    """
    Remove a record from a UBID cluster and give it its own UBID.
    The original UBID is NOT deleted — merge_history records the split.
    Returns the new UBID for the removed record, or None if record not found.
    """
    # Find the linked record entry
    removed = None
    remaining = []
    for lr in ubid.linked_records:
        if lr.get("master_record_id") == master_record_id:
            removed = lr
        else:
            remaining.append(lr)

    if not removed:
        logger.warning(f"Record {master_record_id} not found in UBID {ubid.ubid}")
        return None

    ubid.linked_records = remaining
    ubid.merge_history.append({
        "action": "split",
        "record_ids": [master_record_id],
        "performed_by": reviewer_id,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    ubid.updated_at = datetime.now(timezone.utc)
    await ubid.save()

    # Create new UBID for the removed record
    master = await MasterRecord.get(master_record_id)
    if master:
        new_ubid = await create_ubid_for_record(master)
        new_ubid.merge_history.append({
            "action": "split_from",
            "original_ubid": ubid.ubid,
            "performed_by": reviewer_id,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        await new_ubid.save()
        return new_ubid
    return None


async def get_or_create_ubid_for_records(
    record_a: MasterRecord,
    record_b: MasterRecord,
    confidence: float,
    link_type: str = "auto",
    reviewer_id: Optional[str] = None,
    explanation: Optional[str] = None,
) -> UBIDDocument:
    """
    Merge two records into a shared UBID.
    If either already has a UBID, merge into the existing one.
    If both have UBIDs, merge the smaller into the larger cluster.
    """
    ubid_a = await UBIDDocument.find_one(UBIDDocument.ubid == record_a.ubid) if record_a.ubid else None
    ubid_b = await UBIDDocument.find_one(UBIDDocument.ubid == record_b.ubid) if record_b.ubid else None

    if ubid_a and ubid_b and ubid_a.ubid != ubid_b.ubid:
        # Merge smaller into larger
        target = ubid_a if len(ubid_a.linked_records) >= len(ubid_b.linked_records) else ubid_b
        source = ubid_b if target == ubid_a else ubid_a
        for lr in source.linked_records:
            mr = await MasterRecord.get(lr["master_record_id"])
            if mr:
                await merge_into_ubid(target, mr, confidence, link_type, reviewer_id, explanation)
        source.status = "merged_into"
        source.merge_history.append({
            "action": "merged_into",
            "target_ubid": target.ubid,
            "performed_by": reviewer_id or "system",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        await source.save()
        return target

    if ubid_a:
        return await merge_into_ubid(ubid_a, record_b, confidence, link_type, reviewer_id, explanation)
    if ubid_b:
        return await merge_into_ubid(ubid_b, record_a, confidence, link_type, reviewer_id, explanation)

    # Neither has a UBID — create new
    new_ubid = await create_ubid_for_record(record_a, explanation)
    return await merge_into_ubid(new_ubid, record_b, confidence, link_type, reviewer_id, explanation)
