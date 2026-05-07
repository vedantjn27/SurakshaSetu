from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional
from app.models.ubid import UBIDDocument
from app.models.event import EventDocument
from app.models.audit_log import AuditLog
from app.services.classifier import classify_ubid
from app.services.ubid_manager import split_ubid
from app.core.auth import get_current_user, require_role

router = APIRouter()


@router.get("/list")
async def list_ubids(
    limit: int = Query(20, le=200),
    offset: int = Query(0),
    status: str = Query(None, description="Filter by status, e.g. active_ubid"),
    _=Depends(get_current_user),
):
    """List all UBIDs with pagination."""
    filters = {}
    if status:
        filters["status"] = status
    else:
        filters["status"] = "active_ubid"

    docs = await UBIDDocument.find(filters).skip(offset).limit(limit).to_list()
    total = await UBIDDocument.find(filters).count()

    return {
        "total": total,
        "ubids": [
            {
                "ubid": d.ubid,
                "status": d.status,
                "pan_anchor": d.pan_anchor,
                "activity_status": d.activity_status,
                "activity_score": d.activity_score,
                "linked_records_count": len(d.linked_records),
                "created_at": d.created_at.isoformat(),
            }
            for d in docs
        ],
    }


@router.get("/{ubid_id}")
async def get_ubid(ubid_id: str, _=Depends(get_current_user)):
    """Full UBID detail — linked records, event timeline, activity classification."""
    doc = await UBIDDocument.find_one(UBIDDocument.ubid == ubid_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"UBID {ubid_id} not found")

    events = await EventDocument.find(
        EventDocument.ubid == ubid_id
    ).sort(-EventDocument.event_date).to_list()

    return {
        "ubid": doc.ubid,
        "status": doc.status,
        "pan_anchor": doc.pan_anchor,
        "gstin_anchor": doc.gstin_anchor,
        "activity_status": doc.activity_status,
        "activity_score": doc.activity_score,
        "activity_evidence": doc.activity_evidence,
        "activity_last_computed": doc.activity_last_computed.isoformat() if doc.activity_last_computed else None,
        "activity_override": doc.activity_override,
        "linked_records": doc.linked_records,
        "merge_history": doc.merge_history,
        "event_timeline": [
            {
                "department": e.department,
                "event_type": e.event_type,
                "event_date": e.event_date.isoformat(),
                "join_type": e.join_type,
                "metadata": e.metadata,
            }
            for e in events
        ],
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
    }


@router.post("/{ubid_id}/reclassify")
async def reclassify(ubid_id: str, _=Depends(require_role("admin", "reviewer"))):
    """Trigger manual re-classification of a UBID's activity status."""
    doc = await UBIDDocument.find_one(UBIDDocument.ubid == ubid_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"UBID {ubid_id} not found")
    result = await classify_ubid(doc)
    return result


@router.post("/{ubid_id}/override")
async def override_classification(
    ubid_id: str,
    new_status: str = Query(..., description="Active | Dormant | Closed"),
    reason: str = Query(...),
    expires_days: Optional[int] = Query(None, description="Override expires after N days (None = permanent)"),
    current_user=Depends(require_role("admin", "reviewer")),
):
    """Reviewer override of activity classification."""
    if new_status not in ("Active", "Dormant", "Closed"):
        raise HTTPException(status_code=400, detail="status must be Active, Dormant or Closed")

    doc = await UBIDDocument.find_one(UBIDDocument.ubid == ubid_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"UBID {ubid_id} not found")

    expires_at = None
    if expires_days:
        from datetime import timedelta
        expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_days)).isoformat()

    doc.activity_override = {
        "status": new_status,
        "reason": reason,
        "reviewer": current_user.username,
        "overridden_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
    }
    doc.activity_status = new_status
    doc.updated_at = datetime.now(timezone.utc)
    await doc.save()

    await AuditLog(
        decision_type="activity_override",
        entity_ids=[ubid_id],
        ubid=ubid_id,
        outcome=new_status,
        performed_by=current_user.username,
        reviewer_reason=reason,
    ).insert()

    return {"ubid": ubid_id, "new_status": new_status, "expires_at": expires_at}


@router.post("/{ubid_id}/split")
async def split_record_from_ubid(
    ubid_id: str,
    master_record_id: str = Query(..., description="MasterRecord._id to remove from this UBID"),
    reason: str = Query(...),
    current_user=Depends(require_role("admin", "reviewer")),
):
    """Reverse a merge — remove a record from a UBID and give it its own UBID."""
    doc = await UBIDDocument.find_one(UBIDDocument.ubid == ubid_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"UBID {ubid_id} not found")

    new_ubid = await split_ubid(doc, master_record_id, current_user.username, reason)
    if not new_ubid:
        raise HTTPException(status_code=404, detail="Record not found in this UBID")

    await AuditLog(
        decision_type="merge_reverted",
        entity_ids=[ubid_id, master_record_id],
        ubid=ubid_id,
        outcome=f"split → {new_ubid.ubid}",
        performed_by=current_user.username,
        reviewer_reason=reason,
    ).insert()

    return {
        "outcome": "split",
        "original_ubid": ubid_id,
        "new_ubid": new_ubid.ubid,
        "reason": reason,
    }


@router.get("/{ubid_id}/network")
async def get_ubid_network(ubid_id: str, _=Depends(get_current_user)):
    """
    Network & Fraud Linkage Discovery.
    Finds different UBIDs that share the same Phone Number, Email, or Owner Name,
    even if their PANs or business names differ.
    """
    from app.models.master_record import MasterRecord
    
    doc = await UBIDDocument.find_one(UBIDDocument.ubid == ubid_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"UBID {ubid_id} not found")

    depts_source_ids = [{"department": lr["department"], "source_id": lr["source_id"]} for lr in doc.linked_records]
    if not depts_source_ids:
        return {"ubid": ubid_id, "network": []}

    master_records = await MasterRecord.find({"$or": depts_source_ids}).to_list()

    phones = set()
    emails = set()
    owners = set()
    
    for mr in master_records:
        if mr.raw_phone and mr.raw_phone.strip():
            phones.add(mr.raw_phone.strip())
        if mr.raw_email and mr.raw_email.strip():
            emails.add(mr.raw_email.strip())
        if mr.raw_owner_name and mr.raw_owner_name.strip():
            owners.add(mr.raw_owner_name.strip())
            
    if not (phones or emails or owners):
        return {"ubid": ubid_id, "network": []}

    query_or = []
    if phones:
        query_or.append({"raw_phone": {"$in": list(phones)}})
    if emails:
        query_or.append({"raw_email": {"$in": list(emails)}})
    if owners:
        query_or.append({"raw_owner_name": {"$in": list(owners)}})

    linked_others = await MasterRecord.find(
        {"$and": [
            {"ubid": {"$ne": ubid_id}},
            {"ubid": {"$ne": None}},
            {"$or": query_or}
        ]}
    ).to_list()

    network_ubids = {}
    for other in linked_others:
        oubid = other.ubid
        if oubid not in network_ubids:
            network_ubids[oubid] = {
                "shared_phones": set(),
                "shared_emails": set(),
                "shared_owners": set()
            }
        
        if other.raw_phone and other.raw_phone.strip() in phones:
            network_ubids[oubid]["shared_phones"].add(other.raw_phone.strip())
        if other.raw_email and other.raw_email.strip() in emails:
            network_ubids[oubid]["shared_emails"].add(other.raw_email.strip())
        if other.raw_owner_name and other.raw_owner_name.strip() in owners:
            network_ubids[oubid]["shared_owners"].add(other.raw_owner_name.strip())

    results = []
    for oubid, shared in network_ubids.items():
        results.append({
            "ubid": oubid,
            "shared_attributes": {
                "phone": list(shared["shared_phones"]),
                "email": list(shared["shared_emails"]),
                "owner": list(shared["shared_owners"])
            }
        })

    return {
        "ubid": ubid_id,
        "network": results
    }

