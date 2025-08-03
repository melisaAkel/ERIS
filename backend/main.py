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

def meters_to_degrees(meters):
    return meters / 111_000  # approx conversion at equator

def make_square_around(lat, lon, size_meters=1):
    delta = meters_to_degrees(size_meters) / 2
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

    priority = []
    
    priority.append({
        "if": "true",  
        "multiply_by": 1.0
    })
    
    areas = {}
    for i, road_id in enumerate(blocked_set):
        road = next((r for r in roads if r['id'] == road_id), None)
        if not road or len(road['coords']) < 2:
            continue

        coords_list = road["coords"]
  
        for j in range(len(road["coords"])-1):

            lat1, lon1 = coords_list[j]
            lat2, lon2 = coords_list[j + 1]

            center_lat = (lat1 + lat2) / 2
            center_lon = (lon1 + lon2) / 2
            
            area_id = f"blocked_area_{i}_{j}"
            polygon = make_square_around(center_lat, center_lon, size_meters=1)
            
            areas[area_id] = {
                "type": "Feature",
                "properties" : {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [polygon]
                }
            }

            priority.append({
                "if": f"in_{area_id}",
                "multiply_by": 0.01
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
    #bbox = (36.704993, 36.446370, 37.524432, 38.080985) #updated to Gaziantep/ southeast Turkey
    bbox = [37.575275, 36.922821, 37.60, 36.95]
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


@app.get("/api/roads")
def get_roads():
    """Return all cached roads data"""
    global roads_data
    if not roads_data:
        # If no data cached, try to fetch it
        #bbox = (36.704993, 36.446370, 37.524432, 38.080985)
        bbox = [36.70, 37.05, 36.71, 37.06]
        roads_data = fetch_and_cache_roads(bbox)
    
    return roads_data


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

        if "paths" in result and len(result["paths"]) > 0:
            path = result["paths"][0]
            print(f"Route found - Distance: {path['distance']}m, Time: {path['time']}ms")
            
        return result
    except Exception as e:
        print(f"GraphHopper error: {str(e)}")
        return {"error": str(e)}