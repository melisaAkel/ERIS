from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import requests
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

blocked_roads = set()
roads_data = []

CACHE_FILE = "roads_cache.json"
OVERPASS_URL = "http://overpass-api.de/api/interpreter"

def fetch_and_cache_roads(bbox):
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            roads = json.load(f)
            print(f"Loaded {len(roads)} roads from cache.")
            return roads

    query = f"""
    [out:json][timeout:25];
    (
      way["highway"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
    );
    out body;
    >;
    out skel qt;
    """

    response = requests.post(OVERPASS_URL, data={'data': query})
    response.raise_for_status()
    data = response.json()

    ways = [el for el in data['elements'] if el['type'] == 'way']
    nodes = {el['id']: el for el in data['elements'] if el['type'] == 'node'}

    roads = []
    for way in ways:
        coords = []
        for node_id in way['nodes']:
            node = nodes.get(node_id)
            if node:
                coords.append((node['lat'], node['lon']))
        roads.append({
            "id": str(way['id']),
            "coords": coords
        })

    with open(CACHE_FILE, "w") as f:
        json.dump(roads, f)
    print(f"Fetched and cached {len(roads)} roads.")
    return roads

def make_square_around(lat, lon, size_meters=50):
    meters_per_degree = 111_320
    delta = size_meters / meters_per_degree / 2
    return [
        [lon - delta, lat - delta],
        [lon + delta, lat - delta],
        [lon + delta, lat + delta],
        [lon - delta, lat + delta],
        [lon - delta, lat - delta]
    ]

def build_custom_model(blocked_set, roads):
    if not blocked_set:
        return {}
    
    # Try a simpler approach using road_class or highway type
    priority = []
    
    # Block all roads in the blocked areas by using a very restrictive condition
    # This is a more general approach that should work
    priority.append({
        "if": "true",  # Apply to all roads, but we'll use areas to be more specific
        "multiply_by": 1.0
    })
    
    areas = {}
    for i, road_id in enumerate(blocked_set):
        road = next((r for r in roads if r['id'] == road_id), None)
        if not road or not road['coords']:
            print(f"Skipping road {road_id}: no data or coordinates")
            continue
            
        area_id = f"blocked_area_{i}"
        
        # Create a buffer around the entire road
        if len(road['coords']) >= 2:
            # Create a simple rectangular area covering the road
            lats = [coord[0] for coord in road['coords']]
            lons = [coord[1] for coord in road['coords']]
            
            min_lat, max_lat = min(lats), max(lats)
            min_lon, max_lon = min(lons), max(lons)
            
            # Add small buffer
            buffer = 0.001  # About 100 meters
            coords = [
                [min_lon - buffer, min_lat - buffer],
                [max_lon + buffer, min_lat - buffer],
                [max_lon + buffer, max_lat + buffer],
                [min_lon - buffer, max_lat + buffer],
                [min_lon - buffer, min_lat - buffer]
            ]
            
            areas[area_id] = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            }
    
    # Add priority rule to block roads in these areas
    if areas:
        for area_id in areas.keys():
            priority.append({
                "if": f"in_{area_id}",
                "multiply_by": 0.01  # Nearly block but not completely (0.0 might cause issues)
            })

    custom_model = {
        "priority": priority,
        "areas": areas
    }
    
    print("Custom model built:")
    print(json.dumps(custom_model, indent=2))

    with open("blocked_area.geojson", "w") as f:
        json.dump({
            "type": "FeatureCollection",
            "features": list(areas.values())
        }, f, indent=2)

    return custom_model


class BlockRoadRequest(BaseModel):
    id: str
    blocked: bool

class RouteRequest(BaseModel):
    from_: Dict[str, float] = Field(alias="from")
    to: Dict[str, float]

@app.on_event("startup")
def startup_event():
    global roads_data
    bbox = (40.9, 28.7, 41.2, 29.1)
    roads_data = fetch_and_cache_roads(bbox)

@app.get("/api/blocked-roads")
def get_blocked_roads():
    return list(blocked_roads)

@app.post("/api/blocked-roads")
def post_blocked_road(req: BlockRoadRequest):
    if req.blocked:
        blocked_roads.add(req.id)
    else:
        blocked_roads.discard(req.id)
    return {"success": True, "blocked": list(blocked_roads)}

@app.post("/api/route")
def get_route(req: RouteRequest):
    custom_model = build_custom_model(blocked_roads, roads_data)
    
    payload = {
        "points": [
            [req.from_["lng"], req.from_["lat"]],
            [req.to["lng"], req.to["lat"]]
        ],
        "profile": "car",
        "instructions": True,
        "points_encoded": False,
        "ch.disable": True,
        "custom_model": custom_model
    }
    
    print(f"Blocked roads: {list(blocked_roads)}")
    print(f"Route request from {req.from_} to {req.to}")
    print(f"Sending payload to GraphHopper: {json.dumps(payload, indent=2)}")

    try:
        gh_res = requests.post("http://localhost:8989/route", json=payload)
        print(f"GraphHopper response status: {gh_res.status_code}")
        gh_res.raise_for_status()
        result = gh_res.json()
        
        # Log some route info
        if "paths" in result and len(result["paths"]) > 0:
            path = result["paths"][0]
            print(f"Route found - Distance: {path['distance']}m, Time: {path['time']}ms")
            
        return result
    except Exception as e:
        print(f"GraphHopper error: {str(e)}")
        return {"error": str(e)}