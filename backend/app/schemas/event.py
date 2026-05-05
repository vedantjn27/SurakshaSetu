from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventIngest(BaseModel):
    department: str
    source_id: str
    event_type: str
    event_date: datetime
    metadata: dict = {}
