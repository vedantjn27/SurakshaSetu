from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.config import get_settings
from app.core.logger import logger

_client: AsyncIOMotorClient | None = None


async def connect_db():
    global _client
    settings = get_settings()
    logger.info("Connecting to MongoDB Atlas...")
    _client = AsyncIOMotorClient(settings.mongodb_url)

    # Import all document models for Beanie
    from app.models.master_record import MasterRecord
    from app.models.scrambled_record import ScrambledRecord
    from app.models.ubid import UBIDDocument
    from app.models.event import EventDocument
    from app.models.review_item import ReviewItem
    from app.models.orphan_event import OrphanEvent
    from app.models.audit_log import AuditLog
    from app.models.user import User
    from app.models.labelled_pair import LabelledPair

    await init_beanie(
        database=_client[settings.mongodb_db_name],
        document_models=[
            MasterRecord,
            ScrambledRecord,
            UBIDDocument,
            EventDocument,
            ReviewItem,
            OrphanEvent,
            AuditLog,
            User,
            LabelledPair,
        ],
    )
    logger.info(f"Connected to MongoDB Atlas — db: {settings.mongodb_db_name}")


async def disconnect_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")
