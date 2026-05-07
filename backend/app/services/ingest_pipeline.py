"""
services/ingest_pipeline.py
Orchestrates the full ingestion flow:
  parse CSV → normalise → validate identifiers → store master records
  → generate scrambled records → block → match → resolve → assign UBIDs
"""
import hashlib
import uuid
from io import StringIO
from datetime import datetime, timezone
from typing import List

import pandas as pd

from app.config import get_settings
from app.models.master_record import MasterRecord
from app.models.scrambled_record import ScrambledRecord
from app.services.normaliser import normalise_name
from app.services.address_parser import parse_address
from app.services.pan_gstin import process_identifiers
from app.services import scrambler as scr
from app.services.blocking import generate_candidate_pairs
from app.services.matcher import compute_features, has_identifier_match
from app.services.scorer import compute_score, build_explanation
from app.services.resolver import resolve_pair
from app.services.ubid_manager import get_or_create_ubid_for_records, create_ubid_for_record
from app.services.classifier import classify_ubid
from app.core.logger import logger


def _content_hash(row: dict) -> str:
    content = "|".join(f"{k}:{str(v)}" for k, v in sorted(row.items()))
    return hashlib.sha256(content.encode()).hexdigest()[:16]


async def run_ingestion_pipeline(
    department: str,
    csv_content: bytes,
    job_id: str,
) -> dict:
    """
    Full pipeline for one department CSV upload.
    Returns summary stats and details.
    """
    rules = get_settings().rules
    dept_cfg = rules["departments"].get(department)
    if not dept_cfg:
        return {"error": f"Unknown department: {department}"}

    id_field = dept_cfg["id_field"]
    df = pd.read_csv(StringIO(csv_content.decode("utf-8", errors="replace")))
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    ingested = 0
    skipped = 0
    records: List[MasterRecord] = []
    details = []

    for _, row in df.iterrows():
        row_dict = row.where(pd.notna(row), None).to_dict()
        source_id = str(row_dict.get(id_field, "")).strip()
        raw_name = str(row_dict.get("business_name", "") or "")
        
        if not source_id:
            skipped += 1
            details.append({
                "source_id": "N/A",
                "business_name": raw_name,
                "decision": "skipped",
                "reason": "Missing source_id",
                "ubid": None,
                "confidence": None
            })
            continue

        raw_address = str(row_dict.get("address", "") or "")
        raw_pin = str(row_dict.get("pin_code", "") or "")
        raw_pan = row_dict.get("pan")
        raw_gstin = row_dict.get("gstin")

        # Idempotency check
        c_hash = _content_hash({**row_dict, "dept": department})
        existing = await MasterRecord.find_one(
            MasterRecord.department == department,
            MasterRecord.source_id == source_id,
            MasterRecord.content_hash == c_hash,
        )
        if existing:
            skipped += 1
            details.append({
                "source_id": source_id,
                "business_name": raw_name,
                "decision": "skipped",
                "reason": "Exact duplicate already exists in department data",
                "ubid": existing.ubid,
                "confidence": 1.0
            })
            continue

        # Normalise name
        name_result = normalise_name(raw_name)

        # Parse address
        addr_result = parse_address(f"{raw_address} {raw_pin}")

        # Validate PAN/GSTIN
        id_result = process_identifiers(raw_pan, raw_gstin)

        # Extra fields (anything not in standard columns)
        standard_cols = {"business_name", "address", "pin_code", "pan", "gstin",
                         "owner_name", "phone", "email", "reg_date", id_field}
        extra = {k: v for k, v in row_dict.items() if k not in standard_cols and v is not None}

        record = MasterRecord(
            department=department,
            source_id=source_id,
            ingestion_job_id=job_id,
            raw_business_name=raw_name,
            raw_address=raw_address,
            raw_pan=str(raw_pan) if raw_pan else None,
            raw_gstin=str(raw_gstin) if raw_gstin else None,
            raw_owner_name=str(row_dict.get("owner_name", "") or "") or None,
            raw_phone=str(row_dict.get("phone", "") or "") or None,
            raw_email=str(row_dict.get("email", "") or "") or None,
            raw_pin_code=raw_pin or None,
            raw_reg_date=str(row_dict.get("reg_date", "") or "") or None,
            extra_fields=extra,
            norm_business_name=name_result["norm"],
            norm_legal_suffix=name_result["legal_suffix"],
            norm_phonetic_key=name_result["phonetic_key"],
            norm_address_plot=addr_result["plot"],
            norm_address_locality=addr_result["locality"],
            norm_address_city=addr_result["city"],
            norm_pin_code=addr_result["pin_code"] or raw_pin or None,
            **id_result,
            content_hash=c_hash,
        )
        await record.insert()

        # Create scrambled copy
        await ScrambledRecord(
            master_record_id=str(record.id),
            department=department,
            source_id=scr.scramble_source_id(source_id),
            scr_business_name=scr.scramble_text(raw_name) or raw_name,
            scr_owner_name=scr.scramble_name(row_dict.get("owner_name")),
            scr_address=scr.scramble_address(raw_address),
            scr_phone=scr.scramble_phone(row_dict.get("phone")),
            scr_email=scr.scramble_email(row_dict.get("email")),
            scr_pan=scr.scramble_pan(id_result.get("pan_clean")),
            scr_gstin=scr.scramble_gstin(id_result.get("gstin_clean")),
            pin_code=addr_result["pin_code"] or raw_pin or None,
            norm_phonetic_key=name_result["phonetic_key"],
            norm_locality=addr_result["locality"],
        ).insert()

        records.append(record)
        ingested += 1

    logger.info(f"Ingested {ingested} records for {department} (job={job_id})")

    # Run matching pipeline
    match_stats = await _run_matching(records)
    
    # Extend details with match details
    if "record_details" in match_stats:
        details.extend(match_stats.pop("record_details"))

    return {
        "job_id": job_id,
        "department": department,
        "ingested": ingested,
        "skipped_duplicates": skipped,
        "details": details,
        **match_stats,
    }


async def _run_matching(new_records: List[MasterRecord]) -> dict:
    """Match newly ingested records against all existing records."""
    if not new_records:
        return {"auto_linked": 0, "sent_to_review": 0, "kept_separate": 0, "record_details": []}

    # Load all records for blocking (pin-code filtered for efficiency)
    pin_codes = list({r.norm_pin_code for r in new_records if r.norm_pin_code})
    all_records = await MasterRecord.find(
        {"norm_pin_code": {"$in": pin_codes}}
    ).to_list() if pin_codes else new_records

    pairs = generate_candidate_pairs(all_records)
    logger.info(f"Generated {len(pairs)} candidate pairs from {len(all_records)} records")

    auto_linked = sent_to_review = kept_separate = 0
    new_ubids = 0
    
    # Map to track state of each new record
    record_state = {}

    for r1, r2 in pairs:
        # Skip if already in same UBID
        if r1.ubid and r2.ubid and r1.ubid == r2.ubid:
            continue

        features = compute_features(r1, r2)
        score, method = compute_score(features)
        explanation = build_explanation(features, score, method)

        result = await resolve_pair(r1, r2, features, score, explanation, method)

        is_r1_new = any(r.id == r1.id for r in new_records)
        is_r2_new = any(r.id == r2.id for r in new_records)

        if result["decision"] == "auto_link":
            link_type = "pan_anchor" if has_identifier_match(features) else "auto"
            ubid_doc = await get_or_create_ubid_for_records(r1, r2, score, link_type, None, explanation)
            # Immediately classify so activity_status is set
            await classify_ubid(ubid_doc)
            auto_linked += 1
            
            if is_r1_new:
                record_state[str(r1.id)] = {"decision": "merged", "reason": explanation, "ubid": ubid_doc.ubid, "confidence": score}
            if is_r2_new:
                record_state[str(r2.id)] = {"decision": "merged", "reason": explanation, "ubid": ubid_doc.ubid, "confidence": score}
        elif result["decision"] == "review":
            sent_to_review += 1
            if is_r1_new and str(r1.id) not in record_state:
                record_state[str(r1.id)] = {"decision": "review", "reason": explanation, "ubid": None, "confidence": score}
            if is_r2_new and str(r2.id) not in record_state:
                record_state[str(r2.id)] = {"decision": "review", "reason": explanation, "ubid": None, "confidence": score}
        else:
            kept_separate += 1

    # Assign singleton UBIDs to unlinked records and classify them
    record_details = []
    for record in new_records:
        await record.sync()
        rec_id = str(record.id)
        
        if not record.ubid:
            singleton = await create_ubid_for_record(record)
            await classify_ubid(singleton)
            new_ubids += 1
            
            if rec_id in record_state and record_state[rec_id]["decision"] == "review":
                # It was sent to review, so it gets a temporary singleton UBID
                record_state[rec_id]["ubid"] = singleton.ubid
            else:
                # It was not matched to anything above threshold
                record_state[rec_id] = {
                    "decision": "new", 
                    "reason": "No matching records found above threshold", 
                    "ubid": singleton.ubid, 
                    "confidence": 1.0
                }
        
        # Populate details for this record
        state = record_state.get(rec_id, {
            "decision": "new",
            "reason": "Assigned to new UBID",
            "ubid": record.ubid,
            "confidence": 1.0
        })
        
        record_details.append({
            "source_id": record.source_id,
            "business_name": record.raw_business_name,
            "decision": state["decision"],
            "reason": state["reason"],
            "ubid": state["ubid"],
            "confidence": state["confidence"]
        })

    return {
        "auto_linked": auto_linked,
        "sent_to_review": sent_to_review,
        "kept_separate": kept_separate,
        "new_ubids": new_ubids,
        "record_details": record_details
    }
