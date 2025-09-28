from fastapi import APIRouter
from models.schemas import RouteRequest
from services import route_service
from fastapi import Request

router = APIRouter()

@router.post("/route")
def get_route(req: RouteRequest):
    return route_service.get_route(req)
