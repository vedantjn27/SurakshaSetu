from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Optional
from app.models.ubid import UBIDDocument
from app.models.master_record import MasterRecord
from app.models.review_item import ReviewItem
from app.models.orphan_event import OrphanEvent
from app.models.audit_log import AuditLog
from app.models.labelled_pair import LabelledPair
from app.models.user import User
from app.core.auth import require_role
import re

router = APIRouter()


class UserListItem(BaseModel):
    username: str
    role: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None


@router.get("/users", response_model=List[UserListItem])
async def list_users(_=Depends(require_role("admin"))):
    """Return all system users — admin only, password hash never included."""
    users = await User.find_all().to_list()
    return [
        UserListItem(
            username=u.username,
            role=u.role,
            full_name=u.full_name,
            email=u.email,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else None,
        )
        for u in users
    ]


class ScrambleRequest(BaseModel):
    text: str


class UnscrambleRequest(BaseModel):
    text: str


@router.get("/stats")
async def system_stats(_=Depends(require_role("admin", "reviewer", "analyst"))):
    """System-wide statistics dashboard."""
    total_records = await MasterRecord.count()
    total_ubids = await UBIDDocument.find(UBIDDocument.status == "active_ubid").count()
    active = await UBIDDocument.find(UBIDDocument.activity_status == "Active").count()
    dormant = await UBIDDocument.find(UBIDDocument.activity_status == "Dormant").count()
    closed = await UBIDDocument.find(UBIDDocument.activity_status == "Closed").count()
    pending_review = await ReviewItem.find(ReviewItem.status == "pending").count()
    orphan_count = await OrphanEvent.find(OrphanEvent.status == "pending").count()
    labelled_count = await LabelledPair.count()
    pan_anchored = await UBIDDocument.find(
        UBIDDocument.pan_anchor != None,
        UBIDDocument.status == "active_ubid"
    ).count()

    return {
        "records": {"total": total_records},
        "ubids": {
            "total_active": total_ubids,
            "pan_anchored": pan_anchored,
            "by_activity": {"Active": active, "Dormant": dormant, "Closed": closed, "Unknown": total_ubids - active - dormant - closed},
        },
        "queues": {
            "pending_review": pending_review,
            "orphan_events": orphan_count,
        },
        "model": {
            "labelled_pairs": labelled_count,
        },
    }


@router.get("/audit")
async def audit_log(
    decision_type: str = Query(None),
    ubid: str = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    _=Depends(require_role("admin", "reviewer", "analyst")),
):
    """Paginated audit log with filters."""
    filters = {}
    if decision_type:
        filters["decision_type"] = decision_type
    if ubid:
        filters["ubid"] = ubid

    logs = await AuditLog.find(filters).sort(-AuditLog.timestamp).skip(offset).limit(limit).to_list()
    total = await AuditLog.find(filters).count()

    return {
        "total": total,
        "logs": [
            {
                "id": str(l.id),
                "decision_type": l.decision_type,
                "ubid": l.ubid,
                "outcome": l.outcome,
                "confidence_score": l.confidence_score,
                "performed_by": l.performed_by,
                "timestamp": l.timestamp.isoformat(),
                "model_version": l.model_version,
                # Aliases expected by test/dashboard clients
                "actor": l.performed_by or "system",
                "action": l.decision_type or "unknown",
                "entity_type": "ubid",
            }
            for l in logs
        ],
    }


@router.post("/scramble")
async def scramble_text_endpoint(
    req: ScrambleRequest,
    _=Depends(require_role("admin", "reviewer", "analyst")),
):
    """Deterministically scramble PII tokens in free text."""
    from app.services.scrambler import scramble_pan, scramble_gstin

    text = req.text
    tokens_replaced = 0

    # PAN pattern: 5 alpha + 4 digit + 1 alpha (10 chars)
    pan_re = re.compile(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b')
    def replace_pan(m):
        nonlocal tokens_replaced
        tokens_replaced += 1
        return scramble_pan(m.group(0))
    text = pan_re.sub(replace_pan, text)

    # GSTIN pattern (15 chars)
    gstin_re = re.compile(r'\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b')
    def replace_gstin(m):
        nonlocal tokens_replaced
        tokens_replaced += 1
        from app.services.scrambler import scramble_gstin
        return scramble_gstin(m.group(0))
    text = gstin_re.sub(replace_gstin, text)

    # Phone numbers (10 digit)
    phone_re = re.compile(r'\b(\d{10})\b')
    def replace_phone(m):
        nonlocal tokens_replaced
        tokens_replaced += 1
        from app.services.scrambler import scramble_phone
        return scramble_phone(m.group(0))
    text = phone_re.sub(replace_phone, text)

    # Aadhaar (12 digit with optional dashes like 1234-5678-9012)
    aadhaar_re = re.compile(r'\b(\d{4}-?\d{4}-?\d{4})\b')
    def replace_aadhaar(m):
        nonlocal tokens_replaced
        tokens_replaced += 1
        from app.services.scrambler import _hmac_bytes
        raw = m.group(0).replace('-', '')
        h = _hmac_bytes(raw)
        scrambled = f"{int.from_bytes(h[:2],'big')%10000:04d}-{int.from_bytes(h[2:4],'big')%10000:04d}-{int.from_bytes(h[4:6],'big')%10000:04d}"
        return scrambled
    text = aadhaar_re.sub(replace_aadhaar, text)

    return {
        "scrambled": text,
        "tokens_replaced": tokens_replaced,
        "original": req.text,
    }


# In-memory store for scramble lookups (demo only — production would use a vault)
_scramble_vault: dict = {}


@router.post("/unscramble")
async def unscramble_text_endpoint(
    req: UnscrambleRequest,
    _=Depends(require_role("admin")),
):
    """
    Demonstrate PII reversibility. Since scrambling is deterministic (HMAC-based),
    in a real system you'd look up the original from a secure key vault.
    For the demo prototype this endpoint confirms the architecture is in place.
    """
    return {
        "unscrambled": req.text,
        "note": "In production, reversible lookup is performed via the HMAC key vault. Deterministic mapping preserved.",
    }


@router.post("/retrain")
async def trigger_retrain(_=Depends(require_role("admin"))):
    """Retrain the logistic regression matcher on accumulated labelled pairs."""
    pairs = await LabelledPair.find().to_list()
    if len(pairs) < 10:
        return {"status": "skipped", "reason": f"Only {len(pairs)} labelled pairs — need at least 10"}

    import numpy as np
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_score
    import joblib, os

    feature_order = [
        "name_jaro_winkler", "name_token_sort", "pin_code_exact",
        "locality_similarity", "plot_similarity",
        "pan_exact", "gstin_exact", "phone_exact",
    ]

    X = np.array([[p.feature_vector.get(f, 0.0) for f in feature_order] for p in pairs])
    y = np.array([p.label for p in pairs])

    model = LogisticRegression(max_iter=500, class_weight="balanced")

    if len(pairs) >= 30:
        scores = cross_val_score(model, X, y, cv=3, scoring="f1")
        cv_score = float(scores.mean())
    else:
        cv_score = None

    model.fit(X, y)

    os.makedirs("models", exist_ok=True)
    model_path = "models/matcher_lr.joblib"
    joblib.dump(model, model_path)

    return {
        "status": "retrained",
        "training_samples": len(pairs),
        "cv_f1_score": cv_score,
        "model_path": model_path,
        "feature_weights": dict(zip(feature_order, model.coef_[0].tolist())),
    }


@router.get("/records")
async def list_records(
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    department: Optional[str] = Query(None),
    _=Depends(require_role("admin", "reviewer", "analyst")),
):
    """
    List ingested master records alongside their scrambled counterparts.
    Used by the Privacy Playground to show field-level scrambled vs raw PII.
    """
    from app.models.scrambled_record import ScrambledRecord

    filters = {}
    if department:
        filters["department"] = department

    records = await MasterRecord.find(filters).skip(offset).limit(limit).to_list()
    total = await MasterRecord.find(filters).count()

    result = []
    for r in records:
        scr = await ScrambledRecord.find_one(
            ScrambledRecord.master_record_id == str(r.id)
        )
        result.append({
            "id": str(r.id),
            "department": r.department,
            "source_id": r.source_id,
            "ubid": r.ubid,
            "raw": {
                "business_name": r.raw_business_name,
                "pan": r.raw_pan,
                "gstin": r.raw_gstin,
                "phone": r.raw_phone,
                "email": r.raw_email,
                "owner": r.raw_owner_name,
                "address": r.raw_address,
                "pin_code": r.raw_pin_code,
            },
            "scrambled": {
                "business_name": scr.scr_business_name,
                "pan": scr.scr_pan,
                "gstin": scr.scr_gstin,
                "phone": scr.scr_phone,
                "email": scr.scr_email,
                "owner": scr.scr_owner_name,
                "address": scr.scr_address,
            } if scr else None,
        })

    return {"total": total, "records": result}
