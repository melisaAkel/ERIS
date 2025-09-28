import json

def meters_to_degrees(meters):
    return meters / 111_000

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

    priority = [{"if": "true", "multiply_by": 1.0}]
    areas = {}

    for i, road_id in enumerate(blocked_set):
        road = next((r for r in roads if r['id'] == road_id), None)
        if not road or len(road['coords']) < 2:
            continue

        coords_list = road["coords"]
        for j in range(len(coords_list) - 1):
            lat1, lon1 = coords_list[j]
            lat2, lon2 = coords_list[j + 1]
            center_lat = (lat1 + lat2) / 2
            center_lon = (lon1 + lon2) / 2

            area_id = f"blocked_area_{i}_{j}"
            polygon = make_square_around(center_lat, center_lon, size_meters=1)

            areas[area_id] = {
                "type": "Feature",
                "properties": {},
                "geometry": {"type": "Polygon", "coordinates": [polygon]}
            }
            priority.append({"if": f"in_{area_id}", "multiply_by": 0.01})

    return {"priority": priority, "areas": areas}
