import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import get_settings

from app.models.audit_log import AuditLog
from app.models.event import EventDocument
from app.models.labelled_pair import LabelledPair
from app.models.master_record import MasterRecord
from app.models.orphan_event import OrphanEvent
from app.models.review_item import ReviewItem
from app.models.scrambled_record import ScrambledRecord
from app.models.ubid import UBIDDocument


async def clear_db():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    
    models = [
        AuditLog,
        EventDocument,
        LabelledPair,
        MasterRecord,
        OrphanEvent,
        ReviewItem,
        ScrambledRecord,
        UBIDDocument
    ]
    
    await init_beanie(database=client[settings.mongodb_db_name], document_models=models)

    print("Clearing database...")
    for model in models:
        deleted = await model.find_all().delete()
        print(f"Deleted {deleted.deleted_count if deleted else 0} from {model.__name__}")

    client.close()
    print("Done clearing database.")

if __name__ == "__main__":
    asyncio.run(clear_db())
