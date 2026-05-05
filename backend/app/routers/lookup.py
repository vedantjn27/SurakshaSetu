from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List
from rapidfuzz import fuzz
from app.models.ubid import UBIDDocument
from app.models.master_record import MasterRecord
from app.models.event import EventDocument
from app.core.auth import get_current_user

router = APIRouter()


@router.get("")
async def universal_lookup(
    pan: Optional[str] = Query(None, description="PAN number"),
    gstin: Optional[str] = Query(None, description="GSTIN number"),
    department: Optional[str] = Query(None, description="Department ID"),
    source_id: Optional[str] = Query(None, description="Source record ID from department"),
    name: Optional[str] = Query(None, description="Business name (fuzzy match)"),
    pin_code: Optional[str] = Query(None, description="PIN code (required with name)"),
    _=Depends(get_current_user),
):
    """
    Universal UBID lookup by any identifier.
    Returns the UBID with full linkage evidence.
    """
    ubid_doc = None

    # Priority 1: PAN lookup
    if pan:
        pan_clean = pan.strip().upper()
        ubid_doc = await UBIDDocument.find_one(
            UBIDDocument.pan_anchor == pan_clean,
            UBIDDocument.status == "active_ubid",
        )

    # Priority 2: GSTIN lookup
    if not ubid_doc and gstin:
        gstin_clean = gstin.strip().upper()
        ubid_doc = await UBIDDocument.find_one(
            UBIDDocument.gstin_anchor == gstin_clean,
            UBIDDocument.status == "active_ubid",
        )

    # Priority 3: Source ID + department
    if not ubid_doc and department and source_id:
        record = await MasterRecord.find_one(
            MasterRecord.department == department,
            MasterRecord.source_id == source_id.strip(),
        )
        if record and record.ubid:
            ubid_doc = await UBIDDocument.find_one(UBIDDocument.ubid == record.ubid)

    # Priority 4: Name + pin code fuzzy lookup
    if not ubid_doc and name and pin_code:
        candidates = await MasterRecord.find(
            MasterRecord.norm_pin_code == pin_code.strip()
        ).to_list()
        best_score = 0
        best_record = None
        for c in candidates:
            score = fuzz.token_sort_ratio(name.lower(), c.norm_business_name or "")
            if score > best_score and score >= 70:
                best_score = score
                best_record = c
        if best_record and best_record.ubid:
            ubid_doc = await UBIDDocument.find_one(UBIDDocument.ubid == best_record.ubid)

    if not ubid_doc:
        raise HTTPException(status_code=404, detail="No UBID found for the given identifiers.")

    # Fetch recent events
    events = await EventDocument.find(
        EventDocument.ubid == ubid_doc.ubid
    ).sort(-EventDocument.event_date).limit(10).to_list()

    event_summary = [
        {
            "department": e.department,
            "event_type": e.event_type,
            "event_date": e.event_date.isoformat(),
            "metadata": e.metadata,
        }
        for e in events
    ]

    return {
        "ubid": ubid_doc.ubid,
        "status": ubid_doc.status,
        "pan_anchor": ubid_doc.pan_anchor,
        "gstin_anchor": ubid_doc.gstin_anchor,
        "activity_status": ubid_doc.activity_status,
        "activity_score": ubid_doc.activity_score,
        "activity_evidence": ubid_doc.activity_evidence,
        "linked_records": ubid_doc.linked_records,
        "recent_events": event_summary,
    }
