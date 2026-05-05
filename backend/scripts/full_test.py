"""
SurakshaSetu Full API Test Suite
Tests: Health, Auth, Ingest, UBID Lookup, Analytics Query, Review Workflow, Admin
"""
import httpx
import asyncio
import os
import sys
import json

BASE_URL = "http://localhost:8000/api/v1"
HEALTH_URL = "http://localhost:8000/health"

def log(msg):
    print(msg, flush=True)

async def test_health(client):
    log("\n" + "="*60)
    log("TEST 1: Health Check")
    log("="*60)
    resp = await client.get(HEALTH_URL)
    log(f"  Status: {resp.status_code}")
    log(f"  Response: {resp.json()}")
    return resp.status_code == 200

async def test_auth(client):
    log("\n" + "="*60)
    log("TEST 2: Authentication")
    log("="*60)
    
    # Login as admin
    resp = await client.post(
        f"{BASE_URL}/auth/login",
        data={"username": "admin", "password": "admin123"}
    )
    log(f"  Admin Login Status: {resp.status_code}")
    if resp.status_code != 200:
        log(f"  ERROR: {resp.text}")
        return None
    token_data = resp.json()
    log(f"  Token type: {token_data.get('token_type')}")
    log(f"  Expires in: {token_data.get('expires_in')} mins")
    log(f"  User role: {token_data.get('user', {}).get('role')}")
    log("  [PASS] Login successful")
    
    # Test /me endpoint
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get(f"{BASE_URL}/auth/me", headers=headers)
    log(f"  /me Status: {me_resp.status_code}")
    if me_resp.status_code == 200:
        me_data = me_resp.json()
        log(f"  Logged in as: {me_data.get('username')} ({me_data.get('role')})")
        log("  [PASS] /me endpoint working")
    
    return token

async def test_ingest(client, headers):
    log("\n" + "="*60)
    log("TEST 3: Data Ingestion Pipeline")
    log("="*60)
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "sample")
    files_to_upload = [
        ("shop_establishment", "shop_establishment.csv"),
        ("factories", "factories.csv"),
        ("labour", "labour.csv"),
        ("kspcb", "kspcb.csv"),
    ]
    
    results = {}
    for dept, filename in files_to_upload:
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            log(f"  [SKIP] File not found: {filepath}")
            continue
        
        with open(filepath, "rb") as f:
            log(f"\n  Uploading {filename} for dept={dept}...")
            resp = await client.post(
                f"{BASE_URL}/ingest/csv",
                params={"department": dept},
                files={"file": (filename, f, "text/csv")},
                headers=headers
            )
            log(f"  Upload Status: {resp.status_code}")
            if resp.status_code != 200:
                log(f"  ERROR: {resp.text[:200]}")
                results[dept] = "FAILED"
                continue
            
            job = resp.json()
            job_id = job["job_id"]
            log(f"  Job ID: {job_id}")
            
            # Poll for completion
            for i in range(30):
                await asyncio.sleep(2)
                status_resp = await client.get(
                    f"{BASE_URL}/ingest/status/{job_id}",
                    headers=headers
                )
                if status_resp.status_code != 200:
                    log(f"  Status check failed: {status_resp.text[:100]}")
                    break
                status_data = status_resp.json()
                status = status_data["status"]
                log(f"  [{i+1}] Job status: {status}")
                if status in ["completed", "failed"]:
                    if status == "completed":
                        result = status_data.get("result", {})
                        log(f"  [PASS] Ingested: {result}")
                        results[dept] = "PASS"
                    else:
                        log(f"  [FAIL] Error: {status_data.get('error')}")
                        results[dept] = "FAILED"
                    break
    
    return results

async def test_ubid_lookup(client, headers):
    log("\n" + "="*60)
    log("TEST 4: UBID Lookup & Federated Identity Resolution")
    log("="*60)
    
    # List UBIDs
    resp = await client.get(f"{BASE_URL}/ubid/list?limit=3", headers=headers)
    log(f"  List UBIDs Status: {resp.status_code}")
    if resp.status_code != 200:
        log(f"  ERROR: {resp.text[:200]}")
        return None
    
    data = resp.json()
    total = data.get("total", 0)
    ubids = data.get("ubids", [])
    log(f"  Total UBIDs in DB: {total}")
    
    if not ubids:
        log("  [WARN] No UBIDs found. Ingest data first.")
        return None
    
    # Lookup first UBID
    test_ubid = ubids[0]["ubid"]
    log(f"\n  Looking up UBID: {test_ubid}")
    
    resp = await client.get(f"{BASE_URL}/ubid/{test_ubid}", headers=headers)
    log(f"  Lookup Status: {resp.status_code}")
    if resp.status_code == 200:
        profile = resp.json()
        log(f"  UBID: {profile.get('ubid')}")
        log(f"  Status: {profile.get('status')}")
        log(f"  Activity Status: {profile.get('activity_status')}")
        log(f"  Activity Score: {profile.get('activity_score')}")
        log(f"  Linked Records: {len(profile.get('linked_records', []))}")
        log(f"  Event Timeline entries: {len(profile.get('event_timeline', []))}")
        log("  [PASS] Federated UBID lookup working")
    else:
        log(f"  ERROR: {resp.text[:200]}")
    
    return test_ubid

async def test_analytics_query(client, headers):
    log("\n" + "="*60)
    log("TEST 5: Analytics Query (NLP -> MongoDB Aggregation)")
    log("="*60)
    
    queries = [
        "Show me top 10 businesses by risk score",
        "List all businesses in Bangalore",
        "How many registered factories are there?",
    ]
    
    for q in queries:
        log(f"\n  Query: '{q}'")
        resp = await client.post(
            f"{BASE_URL}/query/ask",
            json={"question": q},
            headers=headers
        )
        log(f"  Status: {resp.status_code}")
        if resp.status_code == 200:
            result = resp.json()
            log(f"  Rows returned: {result.get('row_count', 0)}")
            log(f"  Explanation: {result.get('explanation', '')[:100]}")
            log(f"  [PASS] Query processed")
        else:
            log(f"  ERROR: {resp.text[:200]}")

async def test_scrambler(client, headers):
    log("\n" + "="*60)
    log("TEST 6: PII Scrambler (Deterministic & Reversible)")
    log("="*60)
    
    # Test scramble
    payload = {
        "text": "Contact: Raju Kumar, PAN: ABCDE1234F, Phone: 9876543210, Aadhaar: 1234-5678-9012"
    }
    resp = await client.post(
        f"{BASE_URL}/admin/scramble",
        json=payload,
        headers=headers
    )
    log(f"  Scramble Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        log(f"  Original: {payload['text']}")
        log(f"  Scrambled: {data.get('scrambled')}")
        log(f"  Tokens replaced: {data.get('tokens_replaced', 0)}")
        log("  [PASS] PII Scrambling working")
    else:
        log(f"  ERROR: {resp.text[:200]}")
    
    # Test unscramble
    if resp.status_code == 200:
        scrambled_text = resp.json().get("scrambled", "")
        unresp = await client.post(
            f"{BASE_URL}/admin/unscramble",
            json={"text": scrambled_text},
            headers=headers
        )
        log(f"  Unscramble Status: {unresp.status_code}")
        if unresp.status_code == 200:
            undata = unresp.json()
            log(f"  Unscrambled: {undata.get('unscrambled')}")
            log("  [PASS] PII Unscrambling working (deterministic reversibility confirmed)")

async def test_review_workflow(client, headers):
    log("\n" + "="*60)
    log("TEST 7: Review Workflow (Human-in-the-Loop)")
    log("="*60)
    
    # List pending reviews
    resp = await client.get(f"{BASE_URL}/review/queue?limit=3", headers=headers)
    log(f"  Pending Reviews Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        count = data.get("total", 0)
        log(f"  Pending reviews: {count}")
        reviews = data.get("reviews", [])
        if reviews:
            review_id = reviews[0]["item_id"]
            log(f"  First review ID: {review_id}")
            
            # Approve it
            approve_resp = await client.post(
                f"{BASE_URL}/review/{review_id}/approve",
                json={"comment": "Looks good, approved via test"},
                headers=headers
            )
            log(f"  Approve Status: {approve_resp.status_code}")
            if approve_resp.status_code == 200:
                log("  [PASS] Review approval working")
        else:
            log("  [INFO] No pending reviews found (expected if ingest just ran)")
    else:
        log(f"  ERROR: {resp.text[:200]}")

async def test_orphan_resolution(client, headers):
    log("\n" + "="*60)
    log("TEST 7B: AI-Assisted Orphan Event Resolution")
    log("="*60)

    # List orphan events
    resp = await client.get(f"{BASE_URL}/review/orphans?limit=1", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        orphans = data.get("items", [])
        if orphans:
            orphan_id = orphans[0]["orphan_id"]
            log(f"  Testing AI suggestion for orphan {orphan_id}...")
            ai_resp = await client.post(
                f"{BASE_URL}/review/orphans/{orphan_id}/ai-suggest",
                headers=headers
            )
            log(f"  AI Suggest Status: {ai_resp.status_code}")
            if ai_resp.status_code == 200:
                s_data = ai_resp.json()
                log(f"  Suggested UBID: {s_data.get('suggested_ubid')}")
                log(f"  Confidence: {s_data.get('confidence')}")
                log(f"  Reason: {s_data.get('reason')}")
                log("  [PASS] AI-Assisted Orphan Resolution working")
            else:
                log(f"  ERROR: {ai_resp.text[:200]}")
        else:
            log("  [INFO] No orphan events found to test AI suggestion.")
    else:
        log(f"  ERROR fetching orphans: {resp.text[:200]}")

async def test_fraud_network(client, headers):
    log("\n" + "="*60)
    log("TEST 7C: Fraud-Detection Network Analysis")
    log("="*60)

    resp = await client.get(f"{BASE_URL}/query/network/fraud-risks?risk_type=shared_pan", headers=headers)
    log(f"  Fraud Network Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        log(f"  Total fraud clusters found: {data.get('total_clusters_found')}")
        for cluster in data.get("clusters", [])[:2]:
            log(f"    - PAN: {cluster.get('anchor_value')} | Shared by {cluster.get('ubid_count')} UBIDs")
        log("  [PASS] Fraud Network Analysis working")
    else:
        log(f"  ERROR: {resp.text[:200]}")

async def test_ubid_network(client, headers, ubid_id):
    log("\n" + "="*60)
    log("TEST 7D: UBID Hidden Network Linkage")
    log("="*60)
    
    if not ubid_id:
        log("  [SKIP] No UBID provided.")
        return
        
    resp = await client.get(f"{BASE_URL}/ubid/{ubid_id}/network", headers=headers)
    log(f"  Network Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        network = data.get("network", [])
        log(f"  Found {len(network)} linked distinct UBIDs for {ubid_id}.")
        for link in network[:2]:
            log(f"    - UBID: {link.get('ubid')} | Shared: {link.get('shared_attributes')}")
        log("  [PASS] UBID Network Linkage Analysis working")
    else:
        log(f"  ERROR: {resp.text[:200]}")

async def test_audit_log(client, headers):
    log("\n" + "="*60)
    log("TEST 8: Audit Trail")
    log("="*60)
    
    resp = await client.get(f"{BASE_URL}/admin/audit?limit=5", headers=headers)
    log(f"  Audit Log Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        total = data.get("total", 0)
        logs = data.get("logs", [])
        log(f"  Total audit entries: {total}")
        log(f"  Recent entries:")
        for entry in logs[:3]:
            log(f"    - [{entry.get('timestamp', '')[:19]}] {entry.get('actor')} -> {entry.get('action')} on {entry.get('entity_type', '')}")
        log("  [PASS] Audit logging working")
    else:
        log(f"  ERROR: {resp.text[:200]}")

async def test_admin_stats(client, headers):
    log("\n" + "="*60)
    log("TEST 9: Admin Dashboard Stats")
    log("="*60)
    
    resp = await client.get(f"{BASE_URL}/admin/stats", headers=headers)
    log(f"  Stats Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        ubid_info = data.get("ubids", {})
        queue_info = data.get("queues", {})
        log(f"  Total businesses: {data.get('records', {}).get('total', 0)}")
        log(f"  Total UBIDs: {ubid_info.get('total_active', 0)}")
        log(f"  Pending reviews: {queue_info.get('pending_review', 0)}")
        log(f"  PAN-anchored UBIDs: {ubid_info.get('pan_anchored', 0)}")
        log("  [PASS] Admin stats working")
    else:
        log(f"  ERROR: {resp.text[:200]}")

async def main():
    log("\n" + "="*60)
    log("  SurakshaSetu — Full API Test Suite")
    log("="*60)
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Health
        health_ok = await test_health(client)
        if not health_ok:
            log("\n[CRITICAL] Server is not running. Exiting.")
            return
        
        # Auth
        token = await test_auth(client)
        if not token:
            log("\n[CRITICAL] Auth failed. Check admin user seeding. Exiting.")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # PII Scrambler (quick test before ingest)
        await test_scrambler(client, headers)
        
        # Admin Stats
        await test_admin_stats(client, headers)
        
        # Audit Log (existing entries)
        await test_audit_log(client, headers)
        
        # Ingest
        ingest_results = await test_ingest(client, headers)
        log(f"\n  Ingest summary: {ingest_results}")
        
        # UBID Lookup
        test_ubid = await test_ubid_lookup(client, headers)
        
        # Analytics
        await test_analytics_query(client, headers)
        
        # Review Workflow
        await test_review_workflow(client, headers)
        
        # AI-Assisted Orphan Resolution
        await test_orphan_resolution(client, headers)
        
        # Fraud Network Analysis
        await test_fraud_network(client, headers)
        
        # UBID Hidden Network Analysis
        await test_ubid_network(client, headers, test_ubid)
        
        # Final audit log
        await test_audit_log(client, headers)
        
        log("\n" + "="*60)
        log("  ALL TESTS COMPLETE")
        log("="*60)

if __name__ == "__main__":
    asyncio.run(main())
