from fastapi import APIRouter
from models.schemas import BlockRoadRequest
from services import road_service


router = APIRouter()

@router.get("/blocked-roads")
def get_blocked_roads():
    return road_service.get_blocked_roads()

@router.post("/blocked-roads")
def post_blocked_road(req: BlockRoadRequest):
    return road_service.update_blocked_road(req)

@router.get("/roads")
def get_roads():
    return road_service.get_roads()