from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.models.ubid import UBIDDocument
from app.models.event import EventDocument
from app.core.auth import get_current_user

router = APIRouter()


@router.get("")
async def cross_system_query(
    sector: Optional[str] = Query(None, description="Department/sector e.g. factories"),
    pin_code: Optional[str] = Query(None, description="PIN code filter"),
    status: Optional[str] = Query(None, description="Activity status: Active | Dormant | Closed"),
    no_event_type: Optional[str] = Query(None, description="Event type that must be ABSENT"),
    no_event_since_days: Optional[int] = Query(None, description="Days threshold for absence check"),
    has_event_type: Optional[str] = Query(None, description="Event type that must be PRESENT"),
    has_event_since_days: Optional[int] = Query(None, description="Days threshold for presence check"),
    pan_anchored: Optional[bool] = Query(None, description="Filter to only PAN-anchored UBIDs"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    _=Depends(get_current_user),
):
    """
    Cross-system analytics query.

    Example — active factories in 560058 with no inspection in 18 months:
      ?sector=factories&pin_code=560058&status=Active&no_event_type=inspection_pass&no_event_since_days=540
    """
    # Build base UBID filter
    filters = {"status": "active_ubid"}
    if status:
        filters["activity_status"] = status
    if pan_anchored is True:
        filters["pan_anchor"] = {"$ne": None}

    all_ubids = await UBIDDocument.find(filters).to_list()

    results = []
    now = datetime.now(timezone.utc)

    for ubid_doc in all_ubids:
        # Sector filter — check if any linked record is from the target department
        if sector:
            depts = [lr.get("department", "") for lr in ubid_doc.linked_records]
            if sector.lower() not in [d.lower() for d in depts]:
                continue

        # PIN code filter — check linked records
        if pin_code:
            from app.models.master_record import MasterRecord
            from beanie import PydanticObjectId
            # Normalize the pin_code input (remove spaces/dashes)
            pin_normalized = pin_code.replace(" ", "").replace("-", "").strip()
            master_ids = [lr.get("master_record_id") for lr in ubid_doc.linked_records]
            pin_match = False
            for mid in master_ids:
                if not mid:
                    continue
                try:
                    mr = await MasterRecord.find_one({"_id": PydanticObjectId(mid)})
                    if mr:
                        mr_pin = (mr.norm_pin_code or mr.raw_pin_code or "").strip()
                        if mr_pin == pin_normalized or mr_pin.replace(" ", "") == pin_normalized:
                            pin_match = True
                            break
                except Exception:
                    continue
            if not pin_match:
                continue

        # Event absence filter
        if no_event_type and no_event_since_days:
            cutoff = now - timedelta(days=no_event_since_days)
            recent_event = await EventDocument.find_one(
                EventDocument.ubid == ubid_doc.ubid,
                EventDocument.event_type == no_event_type,
                EventDocument.event_date >= cutoff,
            )
            if recent_event:
                continue  # Has recent event — exclude

        # Event presence filter
        if has_event_type and has_event_since_days:
            cutoff = now - timedelta(days=has_event_since_days)
            recent_event = await EventDocument.find_one(
                EventDocument.ubid == ubid_doc.ubid,
                EventDocument.event_type == has_event_type,
                EventDocument.event_date >= cutoff,
            )
            if not recent_event:
                continue  # Missing required event — exclude

        results.append({
            "ubid": ubid_doc.ubid,
            "activity_status": ubid_doc.activity_status,
            "activity_score": ubid_doc.activity_score,
            "pan_anchor": ubid_doc.pan_anchor,
            "gstin_anchor": ubid_doc.gstin_anchor,
            "linked_departments": list({lr.get("department") for lr in ubid_doc.linked_records}),
            "evidence_summary": ubid_doc.activity_evidence[:3] if ubid_doc.activity_evidence else [],
        })

    total = len(results)
    paginated = results[offset: offset + limit]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "query": {
            "sector": sector, "pin_code": pin_code, "status": status,
            "no_event_type": no_event_type, "no_event_since_days": no_event_since_days,
        },
        "results": paginated,
    }

from pydantic import BaseModel
import httpx
import json
from app.config import get_settings

class AskRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask_analytics_question(
    req: AskRequest,
    current_user=Depends(get_current_user)
):
    """
    LLM-powered NL2API endpoint.
    Translates a natural language question into the structured parameters
    for the cross_system_query endpoint.
    """
    settings = get_settings()
    
    system_prompt = """
You are an AI assistant for the SurakshaSetu platform.
Your job is to translate natural language questions into a JSON object representing query parameters.
The available query parameters are:
- sector (string): e.g. "factories", "shop_establishment", "labour", "kspcb"
- pin_code (string): 6-digit pin code
- status (string): "Active", "Dormant", or "Closed"
- pan_anchored (boolean): true if the user wants only PAN-anchored UBIDs
- no_event_type (string): e.g. "inspection_pass", "compliance_filing"
- no_event_since_days (integer): days threshold
- has_event_type (string): e.g. "inspection_pass", "renewal"
- has_event_since_days (integer): days threshold

IMPORTANT: You must also provide a friendly explanation of the query parameters in the EXACT SAME LANGUAGE (English, Hindi, or Kannada) that the user used in their question.

Return ONLY a valid JSON object with the following structure:
{
  "parameters": {
    "sector": "...",
    ...
  },
  "explanation": "friendly explanation in the user's language"
}
Do not include markdown code blocks, just the JSON string.
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
                        {"role": "user", "content": req.question}
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
                
            parsed = json.loads(content)
            query_params = parsed.get("parameters", {})
            explanation = parsed.get("explanation", f"Translated into: {query_params}")
            
            # Execute actual query
            result = await cross_system_query(
                sector=query_params.get("sector"),
                pin_code=query_params.get("pin_code"),
                status=query_params.get("status"),
                no_event_type=query_params.get("no_event_type"),
                no_event_since_days=query_params.get("no_event_since_days"),
                has_event_type=query_params.get("has_event_type"),
                has_event_since_days=query_params.get("has_event_since_days"),
                pan_anchored=query_params.get("pan_anchored"),
                limit=50,
                offset=0,
                _=current_user
            )
            
            return {
                "question": req.question,
                "parsed_params": query_params,
                "explanation": explanation,
                "row_count": result["total"],
                "results": result["results"]
            }
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Failed to parse LLM response into query parameters")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/network/fraud-risks")
async def fraud_detection_network(
    risk_type: str = Query("shared_pan", description="shared_pan | shared_gstin"),
    _=Depends(get_current_user)
):
    """
    Fraud-Detection Network Analysis.
    Detects potential fraud rings by finding multiple distinct UBIDs that share 
    the same PAN or GSTIN, which indicates identity splitting or evasion.
    """
    field = "pan_anchor" if risk_type == "shared_pan" else "gstin_anchor"

    # Aggregation pipeline to find multiple UBIDs with the same anchor
    pipeline = [
        {"$match": {"status": "active_ubid", field: {"$ne": None, "$exists": True}}},
        {"$group": {
            "_id": f"${field}",
            "count": {"$sum": 1},
            "ubids": {"$push": "$ubid"},
            "statuses": {"$push": "$activity_status"}
        }},
        {"$match": {"count": {"$gt": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 50}
    ]

    from app.models.ubid import UBIDDocument
    cursor = UBIDDocument.get_motor_collection().aggregate(pipeline)
    
    results = []
    async for doc in cursor:
        results.append({
            "anchor_value": doc["_id"],
            "ubid_count": doc["count"],
            "involved_ubids": doc["ubids"],
            "activity_statuses": doc["statuses"],
            "risk_score": min(1.0, doc["count"] * 0.2)  # Simple risk scoring
        })

    return {
        "risk_type": risk_type,
        "total_clusters_found": len(results),
        "clusters": results
    }

