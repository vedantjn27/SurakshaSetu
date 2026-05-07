import asyncio
import sys
import os

# Add backend to sys.path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
from app.models.master_record import MasterRecord
from app.models.scrambled_record import ScrambledRecord
from app.services import scrambler as scr

async def update_all_scrambled_records():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[MasterRecord, ScrambledRecord]
    )

    masters = await MasterRecord.find_all().to_list()
    count = 0
    for record in masters:
        scrambled = await ScrambledRecord.find_one(ScrambledRecord.master_record_id == str(record.id))
        if scrambled:
            scrambled.source_id = scr.scramble_source_id(record.source_id)
            scrambled.scr_business_name = scr.scramble_text(record.raw_business_name) or record.raw_business_name
            scrambled.scr_owner_name = scr.scramble_name(record.raw_owner_name)
            scrambled.scr_address = scr.scramble_address(record.raw_address)
            scrambled.scr_phone = scr.scramble_phone(record.raw_phone)
            scrambled.scr_email = scr.scramble_email(record.raw_email)
            scrambled.scr_pan = scr.scramble_pan(record.pan_clean)
            scrambled.scr_gstin = scr.scramble_gstin(record.gstin_clean)
            await scrambled.save()
            count += 1
    print(f"Done updating {count} scrambled records with new hashes.")

if __name__ == "__main__":
    asyncio.run(update_all_scrambled_records())
