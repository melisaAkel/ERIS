from typing import Dict
from data import road_repository

blocked_roads = set()
roads_data = []

def get_blocked_roads():
    return list(blocked_roads)

def update_blocked_road(req):
    if req.blocked:
        blocked_roads.add(req.id)
    else:
        blocked_roads.discard(req.id)
    return {"success": True, "blocked": list(blocked_roads)}

def get_roads():
    global roads_data
    if not roads_data:
        bbox = [37.575275, 36.922821, 37.60, 36.95]
        roads_data = road_repository.fetch_and_cache_roads(bbox)
    print(f"Fetched {len(roads_data)} roads from Overpass")
    return roads_data
