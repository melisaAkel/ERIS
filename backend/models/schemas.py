
from typing import Dict
from pydantic import BaseModel, Field

class BlockRoadRequest(BaseModel):
    id: str
    blocked: bool

class RouteRequest(BaseModel):
    from_: Dict[str, float] = Field(alias="from")
    to: Dict[str, float]