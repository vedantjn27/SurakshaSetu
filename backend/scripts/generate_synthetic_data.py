"""
scripts/generate_synthetic_data.py
Generates realistic synthetic CSV files for demo.
Covers 4 departments, 2 pin codes (560058, 560100), ~330 records.
Also generates 12 months of activity events.
Some businesses appear in multiple departments (for matching to work).
Some have PAN/GSTIN to demonstrate anchoring.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import csv
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker("en_IN")
random.seed(42)
Faker.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "sample")
os.makedirs(OUTPUT_DIR, exist_ok=True)

PIN_CODES = ["560058", "560100"]
LOCALITIES = {
    "560058": ["Peenya Industrial Area Phase 1", "Peenya Industrial Area Phase 2", "Peenya Phase 3"],
    "560100": ["Bommasandra Industrial Area", "Electronic City Phase 1", "Electronic City Phase 2"],
}

# Generate 80 "real" businesses that will appear across departments
BUSINESSES = []
for i in range(80):
    pin = random.choice(PIN_CODES)
    locality = random.choice(LOCALITIES[pin])
    plot = f"Plot {random.randint(1, 300)}-{random.choice('ABCDE')}"
    name_base = fake.company().replace(",", "")
    pan = None
    gstin = None
    # 60% chance of having PAN
    if random.random() < 0.6:
        letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
        digits = "".join(random.choices("0123456789", k=4))
        last = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        pan = f"{letters}{digits}{last}"
        # 70% of PAN holders also have GSTIN
        if random.random() < 0.7:
            gstin = f"29{pan}1ZM"

    BUSINESSES.append({
        "name": name_base,
        "pin": pin,
        "locality": locality,
        "plot": plot,
        "pan": pan,
        "gstin": gstin,
        "owner": fake.name(),
        "phone": fake.phone_number()[:15],
        "email": fake.email(),
        "reg_date": fake.date_between(start_date="-10y", end_date="-1y").isoformat(),
    })


def _name_variant(name: str) -> str:
    """Introduce realistic name variations between departments."""
    variants = [
        lambda n: n,
        lambda n: n.replace("Private Limited", "Pvt Ltd"),
        lambda n: n.replace("Industries", "Ind"),
        lambda n: n.replace("Engineering", "Engg"),
        lambda n: " ".join(n.split()[:3]),  # truncate
        lambda n: n.upper(),
        lambda n: n.replace(" ", "").title()[:20] + " " + "Pvt Ltd",
    ]
    return random.choice(variants)(name)


def _address_variant(b: dict) -> str:
    templates = [
        f"{b['plot']}, {b['locality']}, Bengaluru - {b['pin']}",
        f"{b['plot']}, {b['locality']}, BLR {b['pin']}",
        f"{b['plot'].replace('Plot', 'Plt')}, {b['locality'].replace('Phase', 'Ph')}, {b['pin']}",
        f"{b['locality']}, {b['plot']}, Bengaluru",
    ]
    return random.choice(templates)


# ── Shop Establishment ─────────────────────────────────────────
def write_shop_establishment():
    path = os.path.join(OUTPUT_DIR, "shop_establishment.csv")
    subset = BUSINESSES[:70]  # 70 of 80
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["reg_number", "business_name", "address", "pin_code", "pan", "gstin",
                    "owner_name", "phone", "email", "reg_date"])
        for i, b in enumerate(subset):
            w.writerow([
                f"SHE-BE-{10000 + i}",
                _name_variant(b["name"]),
                _address_variant(b),
                b["pin"],
                b["pan"] if random.random() < 0.7 else "",  # sometimes missing
                b["gstin"] if random.random() < 0.5 else "",
                b["owner"],
                b["phone"],
                b["email"],
                b["reg_date"],
            ])
    print(f"[OK] {path} ({len(subset)} rows)")


# ── Factories ─────────────────────────────────────────────────
def write_factories():
    path = os.path.join(OUTPUT_DIR, "factories.csv")
    subset = BUSINESSES[10:70]  # overlaps with shop_establishment
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["reg_number", "business_name", "address", "pin_code", "pan", "gstin",
                    "owner_name", "phone", "email", "reg_date"])
        for i, b in enumerate(subset):
            w.writerow([
                f"FAC-{2018 + (i % 8)}-{4500 + i}",
                _name_variant(b["name"]),
                _address_variant(b),
                b["pin"],
                b["pan"] or "",
                b["gstin"] or "",
                b["owner"],
                b["phone"] if random.random() < 0.8 else "",
                "",
                b["reg_date"],
            ])
    print(f"[OK] {path} ({len(subset)} rows)")


# ── Labour ────────────────────────────────────────────────────
def write_labour():
    path = os.path.join(OUTPUT_DIR, "labour.csv")
    subset = BUSINESSES[5:75]  # overlaps with others
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["reg_number", "business_name", "address", "pin_code", "pan", "gstin",
                    "owner_name", "phone", "email", "reg_date"])
        for i, b in enumerate(subset):
            w.writerow([
                f"LBR-REG-{5000 + i}",
                _name_variant(b["name"]),
                _address_variant(b),
                b["pin"],
                b["pan"] if random.random() < 0.5 else "",
                "",  # Labour rarely captures GSTIN
                b["owner"],
                b["phone"],
                b["email"] if random.random() < 0.6 else "",
                b["reg_date"],
            ])
    print(f"[OK] {path} ({len(subset)} rows)")


# ── KSPCB ─────────────────────────────────────────────────────
def write_kspcb():
    path = os.path.join(OUTPUT_DIR, "kspcb.csv")
    subset = BUSINESSES[15:65]  # subset — not all businesses need KSPCB consent
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["consent_number", "business_name", "address", "pin_code", "pan", "gstin",
                    "owner_name", "phone", "email", "consent_date"])
        for i, b in enumerate(subset):
            w.writerow([
                f"KSPCB-C-{8000 + i}",
                _name_variant(b["name"]),
                _address_variant(b),
                b["pin"],
                b["pan"] or "",
                b["gstin"] or "",
                b["owner"],
                b["phone"] if random.random() < 0.9 else "",
                b["email"] if random.random() < 0.4 else "",
                b["reg_date"],
            ])
    print(f"[OK] {path} ({len(subset)} rows)")


# ── Events Stream ─────────────────────────────────────────────
def write_events():
    path = os.path.join(OUTPUT_DIR, "events_stream.csv")
    event_types = [
        ("utility_reading",  "SHE-BE", 10000, 70),
        ("licence_renewal",  "LBR-REG", 5000, 70),
        ("inspection_pass",  "FAC", 4500, 60),
        ("compliance_filing","KSPCB-C", 8000, 50),
        ("licence_lapsed",   "LBR-REG", 5000, 10),
    ]

    rows = []
    start = datetime(2024, 1, 1)
    end   = datetime(2025, 1, 1)

    for evt_type, prefix, id_start, count in event_types:
        dept_map = {
            "SHE-BE": "shop_establishment",
            "LBR-REG": "labour",
            "FAC": "factories",
            "KSPCB-C": "kspcb",
        }
        dept = dept_map.get(prefix, "factories")

        for i in range(count):
            src_id_num = id_start + (i % count)
            if prefix == "FAC":
                year = 2018 + (i % 8)
                src_id = f"FAC-{year}-{src_id_num}"
            else:
                src_id = f"{prefix}-{src_id_num}"

            # Multiple events per record over the year
            num_events = random.randint(1, 6)
            for _ in range(num_events):
                evt_date = start + timedelta(days=random.randint(0, 365))
                meta = {}
                if evt_type == "utility_reading":
                    meta["units_consumed"] = random.randint(500, 8000)
                elif evt_type == "inspection_pass":
                    meta["outcome"] = random.choice(["SATISFACTORY", "SATISFACTORY", "MINOR_ISSUES"])
                elif evt_type == "licence_renewal":
                    meta["valid_until"] = (evt_date + timedelta(days=365)).date().isoformat()
                rows.append({
                    "department": dept,
                    "source_id": src_id,
                    "event_type": evt_type,
                    "event_date": evt_date.isoformat(),
                    **{f"meta_{k}": v for k, v in meta.items()},
                })

    random.shuffle(rows)

    with open(path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["department", "source_id", "event_type", "event_date",
                      "meta_units_consumed", "meta_outcome", "meta_valid_until"]
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    print(f"[OK] {path} ({len(rows)} event rows)")


if __name__ == "__main__":
    print("Generating synthetic sample data...\n")
    write_shop_establishment()
    write_factories()
    write_labour()
    write_kspcb()
    write_events()
    print(f"\nAll files written to: {os.path.abspath(OUTPUT_DIR)}")
    print("Upload order: shop_establishment -> factories -> labour -> kspcb -> events_stream")
