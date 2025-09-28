import { MapContainer, TileLayer, Marker, Polyline, Tooltip, Popup, useMapEvents, CircleMarker } from 'react-leaflet'
import { useState } from 'react'
import axios from 'axios'


function findNearestRoad(point, roads) {
  let nearestRoad = null
  let nearestDist = Infinity
  for (const road of roads) {
    for (let i = 0; i < road.coords.length - 1; i++) {
      const [lat1, lng1] = road.coords[i]
      const [lat2, lng2] = road.coords[i + 1]
      const dist = pointToSegmentDistance(point.lat, point.lng, lat1, lng1, lat2, lng2)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestRoad = road
      }
    }
  }
  return nearestRoad
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1
  const dot = A * C + B * D
  const len_sq = C * C + D * D
  let param = -1
  if (len_sq !== 0) param = dot / len_sq

  let xx, yy
  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy
  return Math.sqrt(dx * dx + dy * dy)
}

export default function MapPage() {
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [routeCoords, setRouteCoords] = useState([])
  const [damagePoint, setDamagePoint] = useState(null)
  const [selecting, setSelecting] = useState(null) // "from" | "to" | "damage" | null
  

  async function calculateRoute() {
    if (!from || !to) return
    console.log("[DEBUG] Calculating route:", { from, to })
    try {
      const res = await axios.post("http://localhost:8000/api/route", { from, to })
      const coords = res.data.paths[0].points.coordinates.map(([lng, lat]) => [lat, lng])
      console.log("[DEBUG] Route received:", coords.length, "points")
      setRouteCoords(coords)
    } catch (err) {
      console.error('Failed to fetch route:', err)
    }
  }

  
  async function handleUpload() {
    if (!damagePoint) return alert("Set a damage point first");
    console.log("[DEBUG] Uploading photo for damagePoint:", damagePoint)
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      if (e.target.files.length === 0) return;
      const formData = new FormData();
      formData.append("file", e.target.files[0]);

      try {
        const uploadRes = await axios.post(
          "http://localhost:8000/upload-image",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const photoUrl = uploadRes.data.url; // returned by your backend
        // Update damagePoint to include the photo URL
        console.log("Photo uploaded")
        setDamagePoint((prev) => ({ ...prev, photoUrl }));
        const { job_id } = uploadRes.data 
        let status = "processing" 
        while (status === "processing") { 
          await new Promise(r => setTimeout(r, 1000)) 
          const statusRes = await 
          axios.get("http://localhost:8000/status/${job_id}") 
            status = statusRes.data.status 
          } 
          const res = await 
          axios.get("http://localhost:8000/api/roads") 
          const nearestRoad = findNearestRoad(damagePoint, res.data) 
          console.log("[DEBUG] Nearest road:", nearestRoad) 
          if (!nearestRoad) return alert("No road found near the damage point!") 
          await axios.post("http://localhost:8000/api/blocked-roads", 
        { id: nearestRoad.id, blocked: true }) 
        console.log("[DEBUG] Block request sent:", nearestRoad.id) 
        const blockedRes = await axios.get("http://localhost:8000/api/blocked-roads") 
        console.log("[DEBUG] Currently blocked roads:", blockedRes.data) 
        alert("Road ${nearestRoad.id} blocked successfully!") 
        calculateRoute()
      } catch (err) {
        console.error(err);
        alert("Failed to upload photo");
      }
    }
    input.click();
  }
 

  function LocationSelector() {
    useMapEvents({
      click(e) {
        const point = { lat: e.latlng.lat, lng: e.latlng.lng }
        console.log(`[DEBUG] Clicked at ${point.lat}, ${point.lng}, selecting=${selecting}`)
        if (selecting === "from") {
          setFrom(point)
          setTo(null)
          setDamagePoint(null)
          setRouteCoords([])
        } else if (selecting === "to") {
          setTo(point)
          setDamagePoint(null)
          setRouteCoords([])
        } else if (selecting === "damage") {
          setDamagePoint(point)
        }
        setSelecting(null)
      }
    })
    return null
  }

  function toggleSelection(type) {
    if (selecting === type) setSelecting(null)
    else setSelecting(type)
  }

  function unset(type) {
    if (type === "from") {
      setFrom(null)
      setTo(null)
      setDamagePoint(null)
      setRouteCoords([])
    } else if (type === "to") {
      setTo(null)
      setDamagePoint(null)
      setRouteCoords([])
    } else if (type === "damage") {
      setDamagePoint(null)
    }
    setSelecting(null)
  }

return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* Map Section */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[37.5832862, 36.9300109]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationSelector />
          {from && (
    <CircleMarker
      center={[from.lat, from.lng]}
      radius={10}
      color="green"
      fillColor="green"
      fillOpacity={0.8}
      stroke={true}
      weight={2}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
        Start Point
      </Tooltip>
    </CircleMarker>
  )}

  {/* End Point */}
  {to && (
    <CircleMarker
      center={[to.lat, to.lng]}
      radius={10}
      color="blue"
      fillColor="blue"
      fillOpacity={0.8}
      stroke={true}
      weight={2}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
        End Point
      </Tooltip>
    </CircleMarker>
  )}

  {/* Damage Point */}
  {damagePoint && (
    <CircleMarker
      center={[damagePoint.lat, damagePoint.lng]}
      radius={10}
      color="red"
      fillColor="red"
      fillOpacity={0.8}
      stroke={true}
      weight={2}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
        Damage Point
      </Tooltip>
      {damagePoint.photoUrl && (
        <Popup>
          <div style={{ textAlign: 'center' }}>
            <strong>Damage Photo:</strong>
            <br />
            <img src={damagePoint.photoUrl} alt="damage" style={{ maxWidth: '200px', borderRadius: '8px' }} />
          </div>
        </Popup>
      )}
    </CircleMarker>
  )}

          {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />}
        </MapContainer>
      </div>

      {/* Control Panel */}
      <div
        style={{
          width: "320px",
          background: "#fff",
          borderLeft: "1px solid #ddd",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          overflowY: "auto",
        }}
      >
        <div>
          <h3 style={{ marginTop: 0, textAlign: "center" }}>Route Dashboard</h3>
          <div style={{ marginBottom: "12px", fontSize: "0.9rem" }}>
            <strong>Start:</strong>{" "}
            {from ? `${from.lat.toFixed(4)}, ${from.lng.toFixed(4)}` : "—"}
            <br />
            <strong>End:</strong>{" "}
            {to ? `${to.lat.toFixed(4)}, ${to.lng.toFixed(4)}` : "—"}
            <br />
            <strong>Damage:</strong>{" "}
            {damagePoint
              ? `${damagePoint.lat.toFixed(4)}, ${damagePoint.lng.toFixed(4)}`
              : "—"}
          </div>

          <button style={btnStyle(selecting === "from")} onClick={() =>(from ? unset("from") : toggleSelection("from"))}>
            {from ? "Reset Start" : "Set Start"}
          </button>
          <button
            style={btnStyle(selecting === "to", !from)}
            onClick={() => from && (to ? unset("to") : toggleSelection("to"))}
            disabled={!from}
          >
            {to ? "Reset End" : "Set End"}
          </button>
          <button
            style={btnStyle(selecting === "damage", !from || !to)}
            onClick={() => from && to && (damagePoint ? unset("damage") : toggleSelection("damage"))}
            disabled={!from || !to}
          >
            {damagePoint ? "Reset Damage" : "Set Damage"}
          </button>

          <hr style={{ margin: "12px 0" }} />

          <button
            style={btnStyle(false, !from || !to)}
            onClick={calculateRoute}
            disabled={!from || !to}
          >
            Calculate Route
          </button>
          <button
            style={btnStyle(false, !damagePoint)}
            onClick={handleUpload}
            disabled={!damagePoint}
          >
            Upload Photo
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(active, disabled) {
  return {
    display: "block",
    width: "100%",
    marginBottom: "8px",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: disabled ? "#ccc" : active ? "#007bff" : "#f0f0f0",
    color: disabled ? "#666" : active ? "#fff" : "#333",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  };


}
