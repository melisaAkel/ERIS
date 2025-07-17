export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const BBOX = [36.704993, 36.446370, 37.524432, 38.080985]  // Gaziantep

export async function fetchRoads(bbox = BBOX) {
  const [s,w,n,e] = bbox
  const query = `
    [out:json];
    way["highway"~"primary|secondary|tertiary|residential"](${s},${w},${n},${e});
    out geom;
  `.trim()

  const res  = await fetch(OVERPASS_URL, { method: 'POST', body: query })
  const json = await res.json()

  return json.elements.map(el => ({
    id:     el.id,
    name:   el.tags?.name || `road-${el.id}`,
    coords: el.geometry.map(p => [p.lat, p.lon])
  }))
}
