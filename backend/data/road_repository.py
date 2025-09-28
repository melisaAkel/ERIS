import os, json, requests

CACHE_FILE = "roads_cache.json"
OVERPASS_URL = "http://overpass-api.de/api/interpreter"

def fetch_and_cache_roads(bbox):
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)

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
        coords = [(nodes[nid]['lat'], nodes[nid]['lon']) for nid in way['nodes'] if nid in nodes]
        roads.append({"id": str(way['id']), "coords": coords})

    with open(CACHE_FILE, "w") as f:
        json.dump(roads, f)
    return roads
