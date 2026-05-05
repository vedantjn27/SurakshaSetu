import uuid
from fastapi import APIRouter, UploadFile, File, Query, BackgroundTasks, Depends, HTTPException
from datetime import datetime, timezone
from typing import Optional
from app.services.ingest_pipeline import run_ingestion_pipeline
from app.services.event_joiner import join_event
from app.core.auth import require_role
from app.config import get_settings

router = APIRouter()

# Track background job statuses in memory (simple for prototype)
_job_status: dict = {}


async def _pipeline_task(department: str, content: bytes, job_id: str):
    _job_status[job_id] = {"status": "running", "started_at": datetime.now(timezone.utc).isoformat()}
    try:
        result = await run_ingestion_pipeline(department, content, job_id)
        _job_status[job_id] = {
            "status": "completed",
            "result": result,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        _job_status[job_id] = {"status": "failed", "error": str(e)}


@router.post("/csv")
async def ingest_csv(
    background_tasks: BackgroundTasks,
    department: str = Query(..., description="Department ID e.g. factories, kspcb, labour, shop_establishment"),
    file: UploadFile = File(..., description="CSV file with department master data"),
    _=Depends(require_role("admin", "reviewer")),
):
    """Upload a department CSV. Processing runs in background."""
    rules = get_settings().rules
    if department not in rules.get("departments", {}):
        raise HTTPException(status_code=400, detail=f"Unknown department: {department}. "
                            f"Valid: {list(rules['departments'].keys())}")

    content = await file.read()
    job_id = str(uuid.uuid4())[:8]
    _job_status[job_id] = {"status": "queued"}
    background_tasks.add_task(_pipeline_task, department, content, job_id)

    return {
        "job_id": job_id,
        "department": department,
        "filename": file.filename,
        "status": "queued",
        "track_at": f"/api/v1/ingest/status/{job_id}",
    }


@router.get("/status/{job_id}")
async def ingest_status(job_id: str):
    """Check background ingestion job status."""
    status = _job_status.get(job_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return {"job_id": job_id, **status}


@router.post("/events")
async def ingest_events(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Events CSV: department,source_id,event_type,event_date,metadata_json"),
    _=Depends(require_role("admin", "reviewer")),
):
    """
    Upload activity events CSV.
    Required columns: department, source_id, event_type, event_date
    Optional: any additional metadata columns
    """
    import pandas as pd
    from io import StringIO
    import json

    content = await file.read()
    df = pd.read_csv(StringIO(content.decode("utf-8", errors="replace")))
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    results = {"joined": 0, "orphaned": 0, "errors": 0}

    for _, row in df.iterrows():
        try:
            dept = str(row.get("department", "")).strip()
            src_id = str(row.get("source_id", "")).strip()
            evt_type = str(row.get("event_type", "")).strip()
            evt_date_raw = str(row.get("event_date", "")).strip()

            if not all([dept, src_id, evt_type, evt_date_raw]):
                results["errors"] += 1
                continue

            evt_date = datetime.fromisoformat(evt_date_raw.replace("Z", "+00:00"))

            standard_cols = {"department", "source_id", "event_type", "event_date"}
            metadata = {k: v for k, v in row.to_dict().items()
                        if k not in standard_cols and pd.notna(v)}

            result = await join_event(dept, src_id, evt_type, evt_date, metadata)
            if result["outcome"] == "joined":
                results["joined"] += 1
            else:
                results["orphaned"] += 1
        except Exception as e:
            results["errors"] += 1

    return {"status": "completed", **results}
