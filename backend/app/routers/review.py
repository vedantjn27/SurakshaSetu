from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional
from app.models.review_item import ReviewItem
from app.models.orphan_event import OrphanEvent
from app.models.master_record import MasterRecord
from app.models.labelled_pair import LabelledPair
from app.services.ubid_manager import get_or_create_ubid_for_records
from app.services.event_joiner import join_event
from app.core.auth import get_current_user, require_role

router = APIRouter()


# ─── Match Review Queue ───────────────────────────────────────

@router.get("/queue")
async def list_review_queue(
    status: str = Query("pending", description="pending | merged | rejected | escalated"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    _=Depends(get_current_user),
):
    """List items in the ambiguous match review queue."""
    items = await ReviewItem.find(ReviewItem.status == status).skip(offset).limit(limit).to_list()
    total = await ReviewItem.find(ReviewItem.status == status).count()
    return {
        "total": total,
        "items": [
            {
                "item_id": str(i.id),
                "record_a": {"dept": i.record_a_dept, "source_id": i.record_a_source_id},
                "record_b": {"dept": i.record_b_dept, "source_id": i.record_b_source_id},
                "confidence_score": i.confidence_score,
                "feature_breakdown": i.feature_breakdown,
                "explanation": i.explanation,
                "created_at": i.created_at.isoformat(),
            }
            for i in items
        ],
    }


@router.post("/queue/{item_id}/merge")
async def reviewer_merge(
    item_id: str,
    reason: Optional[str] = Query(None),
    current_user=Depends(require_role("admin", "reviewer")),
):
    """Reviewer approves merge — records get shared UBID, decision stored as labelled example."""
    item = await ReviewItem.get(item_id)
    if not item or item.status != "pending":
        raise HTTPException(status_code=404, detail="Review item not found or already resolved")

    r_a = await MasterRecord.get(item.record_a_id)
    r_b = await MasterRecord.get(item.record_b_id)
    if not r_a or not r_b:
        raise HTTPException(status_code=404, detail="Source records not found")

    ubid_doc = await get_or_create_ubid_for_records(
        r_a, r_b, item.confidence_score, "human", current_user.username
    )

    # Store labelled example
    await LabelledPair(
        record_a_id=item.record_a_id,
        record_b_id=item.record_b_id,
        feature_vector=item.feature_breakdown,
        label=1,
        labelled_by=current_user.username,
        confidence_score=item.confidence_score,
    ).insert()

    item.status = "merged"
    item.reviewer_id = current_user.username
    item.reviewer_decision = "merge"
    item.reviewer_reason = reason
    item.reviewed_at = datetime.now(timezone.utc)
    item.resulting_ubid = ubid_doc.ubid
    await item.save()

    return {"outcome": "merged", "ubid": ubid_doc.ubid}


@router.post("/queue/{item_id}/reject")
async def reviewer_reject(
    item_id: str,
    reason: Optional[str] = Query(None),
    current_user=Depends(require_role("admin", "reviewer")),
):
    """Reviewer rejects merge — records remain separate, decision stored as labelled example."""
    item = await ReviewItem.get(item_id)
    if not item or item.status != "pending":
        raise HTTPException(status_code=404, detail="Review item not found or already resolved")

    # Store negative label
    await LabelledPair(
        record_a_id=item.record_a_id,
        record_b_id=item.record_b_id,
        feature_vector=item.feature_breakdown,
        label=0,
        labelled_by=current_user.username,
        confidence_score=item.confidence_score,
    ).insert()

    item.status = "rejected"
    item.reviewer_id = current_user.username
    item.reviewer_decision = "reject"
    item.reviewer_reason = reason
    item.reviewed_at = datetime.now(timezone.utc)
    await item.save()

    return {"outcome": "rejected"}


@router.post("/queue/{item_id}/escalate")
async def reviewer_escalate(
    item_id: str,
    reason: Optional[str] = Query(None),
    current_user=Depends(require_role("admin", "reviewer")),
):
    item = await ReviewItem.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.status = "escalated"
    item.reviewer_id = current_user.username
    item.reviewer_reason = reason
    item.reviewed_at = datetime.now(timezone.utc)
    await item.save()
    return {"outcome": "escalated"}


# ─── Orphan Event Queue ───────────────────────────────────────

@router.get("/orphans")
async def list_orphans(
    status: str = Query("pending"),
    limit: int = Query(20, le=100),
    _=Depends(get_current_user),
):
    items = await OrphanEvent.find(OrphanEvent.status == status).limit(limit).to_list()
    total = await OrphanEvent.find(OrphanEvent.status == status).count()
    return {
        "total": total,
        "items": [
            {
                "orphan_id": str(i.id),
                "department": i.department,
                "raw_source_id": i.raw_source_id,
                "event_type": i.event_type,
                "event_date": i.event_date.isoformat(),
                "metadata": i.metadata,
                "created_at": i.created_at.isoformat(),
            }
            for i in items
        ],
    }


@router.post("/orphans/{orphan_id}/assign")
async def assign_orphan(
    orphan_id: str,
    ubid: str = Query(..., description="UBID to assign this event to"),
    current_user=Depends(require_role("admin", "reviewer")),
):
    """Manually assign an orphan event to a UBID."""
    orphan = await OrphanEvent.get(orphan_id)
    if not orphan:
        raise HTTPException(status_code=404, detail="Orphan event not found")

    from app.models.event import EventDocument
    from app.models.ubid import UBIDDocument
    from app.services.classifier import classify_ubid

    ubid_doc = await UBIDDocument.find_one(UBIDDocument.ubid == ubid)
    if not ubid_doc:
        raise HTTPException(status_code=404, detail=f"UBID {ubid} not found")

    await EventDocument(
        ubid=ubid,
        department=orphan.department,
        source_id=orphan.raw_source_id,
        event_type=orphan.event_type,
        event_date=orphan.event_date,
        metadata=orphan.metadata,
        join_confidence=1.0,
        join_type="manual",
        reviewer_id=current_user.username,
    ).insert()

    await classify_ubid(ubid_doc)

    orphan.status = "assigned"
    orphan.assigned_ubid = ubid
    orphan.reviewer_id = current_user.username
    orphan.reviewed_at = datetime.now(timezone.utc)
    await orphan.save()

    return {"outcome": "assigned", "ubid": ubid}


@router.post("/orphans/{orphan_id}/ai-suggest")
async def ai_suggest_orphan(
    orphan_id: str,
    current_user=Depends(require_role("admin", "reviewer")),
):
    """AI-assisted orphan event resolution.
    Finds candidate UBIDs and uses LLM to score the best match.
    """
    import httpx
    import json
    from app.config import get_settings
    from app.models.ubid import UBIDDocument

    orphan = await OrphanEvent.get(orphan_id)
    if not orphan:
        raise HTTPException(status_code=404, detail="Orphan event not found")

    # Fetch some candidates based on department or simply recent active UBIDs
    # In a real system, we would use vector search on embeddings of metadata
    candidates = await UBIDDocument.find(
        {"status": "active_ubid"}
    ).limit(5).to_list()

    if not candidates:
        return {"suggestion": None, "reason": "No active UBIDs available for matching"}

    candidate_data = []
    for c in candidates:
        candidate_data.append({
            "ubid": c.ubid,
            "pan": c.pan_anchor,
            "gstin": c.gstin_anchor,
            "activity_status": c.activity_status,
            "records_count": len(c.linked_records)
        })

    settings = get_settings()
    system_prompt = """
You are an AI assistant for the SurakshaSetu platform.
Your job is to suggest the best matching UBID for an orphan event.
You will be provided with the orphan event's details and a list of candidate UBIDs.
Return ONLY a valid JSON object with:
- "suggested_ubid": the UBID string of the best match, or null if none match
- "confidence": a float between 0 and 1
- "reason": a short explanation
"""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.mistral_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.mistral_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Orphan Event: {orphan.json()}\n\nCandidates: {json.dumps(candidate_data)}"}
                    ],
                    "temperature": 0.1
                },
                timeout=15.0
            )

            if resp.status_code != 200:
                raise HTTPException(status_code=500, detail="LLM API error")

            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()

            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()

            result = json.loads(content)
            return {
                "orphan_id": orphan_id,
                "suggested_ubid": result.get("suggested_ubid"),
                "confidence": result.get("confidence"),
                "reason": result.get("reason"),
                "candidates_evaluated": len(candidate_data)
            }

    except Exception as e:
        # Fallback if LLM fails or not configured
        return {
            "orphan_id": orphan_id,
            "suggested_ubid": candidate_data[0]["ubid"] if candidate_data else None,
            "confidence": 0.5,
            "reason": f"Fallback suggestion due to error: {str(e)}",
            "candidates_evaluated": len(candidate_data)
        }

