import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRoads } from '../services/overpass'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function AdminPage() {
  const [roads, setRoads] = useState([])
  const [blocked, setBlocked] = useState({})
  const [selectedRoad, setSelectedRoad] = useState(null)
  const [hovered, setHovered] = useState(null)

  // Fetch roads and blocked status on mount
  useEffect(() => {
    const mockRoads = [
    {
      id: 'mock1',
      name: 'Mock Street A',
      coords: [
        [36.9078, 37.0785],
        [36.9085, 37.0790]
      ]
    },
    {
      id: 'mock2',
      name: 'Mock Avenue B',
      coords: [
        [36.9090, 37.0795],
        [36.9100, 37.0800]
      ]
    }
  ]

  setRoads(mockRoads)

  // Optionally block one by default
  setBlocked({ mock2: true })
    /* fetchRoads().then(setRoads).catch(console.error)

    fetch('/api/blocked-roads')
      .then(res => res.json())
      .then(data => {
        const map = {}
        data.forEach(id => { map[id] = true })
        setBlocked(map)
      })
      .catch(console.error) */
  }, [])

  // Block/unblock a road
  async function toggleRoad(id) {
    const isBlocked = blocked[id]
    const newStatus = !isBlocked

    if (!isBlocked || window.confirm("Unblock this road?")) {
      setBlocked(b => ({ ...b, [id]: newStatus }))

      try {
        const res = await fetch('/api/blocked-roads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, blocked: newStatus }),
        })

        const data = await res.json()
        toast.success(`Road ${newStatus ? 'blocked' : 'unblocked'} successfully!`)
        console.log('Updated Blocked Roads:', data.blocked)
      } catch (err) {
        console.error('Failed to update blocked road:', err)
        toast.error('Failed to update road status.')
      }
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ToastContainer />

      {/* Sidebar */}
      <aside style={{ width: 300, padding: 16, background: '#f4f4f4', overflowY: 'auto' }}>
        <h3>🛑 Block Roads</h3>

        {/* Grouped lists */}
        <details open>
          <summary style={{ fontWeight: 'bold' }}>🚫 Blocked Roads</summary>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {roads.filter(r => blocked[r.id]).map(r => (
              <li
                key={r.id}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ padding: '4px 0', color: 'red', cursor: 'pointer' }}
                onClick={() => setSelectedRoad(r)}
              >
                {r.name || r.id}
              </li>
            ))}
          </ul>
        </details>

        <details open>
          <summary style={{ fontWeight: 'bold', marginTop: 10 }}>✅ Unblocked Roads</summary>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {roads.filter(r => !blocked[r.id]).map(r => (
              <li
                key={r.id}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ padding: '4px 0', cursor: 'pointer' }}
                onClick={() => setSelectedRoad(r)}
              >
                {r.name || r.id}
              </li>
            ))}
          </ul>
        </details>

        {/* Road Details Panel */}
        {selectedRoad && (
          <div style={{ marginTop: 16, padding: 8, background: '#fff', border: '1px solid #ccc' }}>
            <h4>{selectedRoad.name || `Road ${selectedRoad.id}`}</h4>
            <p><b>ID:</b> {selectedRoad.id}</p>
            <button onClick={() => toggleRoad(selectedRoad.id)}>
              {blocked[selectedRoad.id] ? 'Unblock' : 'Block'} this road
            </button>
          </div>
        )}
      </aside>

      {/* Map */}
      <main style={{ flex: 1 }}>
        <MapContainer
          center={roads[0]?.coords[0] || [36.9078, 37.0785]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {roads.map(r => (
            <Polyline
              key={r.id}
              positions={r.coords}
              pathOptions={{
                color: hovered === r.id ? 'orange' : (blocked[r.id] ? 'red' : 'green'),
                weight: blocked[r.id] ? 6 : 4,
                dashArray: blocked[r.id] ? '10,6' : ''
              }}
              eventHandlers={{
                click: () => setSelectedRoad(r),
                mouseover: () => setHovered(r.id),
                mouseout: () => setHovered(null)
              }}
            >
              <Tooltip sticky>{r.name || `Road ${r.id}`}</Tooltip>
            </Polyline>
          ))}
        </MapContainer>
      </main>
    </div>
  )
}
