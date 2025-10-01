import requests, json
from services import road_service
from utils.geo_utils import build_custom_model


def get_route(req):
    roads_data = road_service.get_roads()
    custom_model = build_custom_model(road_service.blocked_roads, roads_data)

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

    try:
        gh_res = requests.post("http://localhost:8989/route", json=payload)
        gh_res.raise_for_status()
        return gh_res.json()
    except Exception as e:
        return {"error": str(e)}
