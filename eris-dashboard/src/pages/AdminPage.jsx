import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import { fetchRoads } from '../services/overpass'

export default function AdminPage() {
  const [roads, setRoads] = useState([])
  const [blocked, setBlocked] = useState({})

  useEffect(() => {
    fetchRoads().then(setRoads).catch(console.error)
  }, [])

  function toggleRoad(id) {
    setBlocked(b => ({ ...b, [id]: !b[id] }))
    // → TODO: persist to your backend
  }

  return (
    <div style={{ display:'flex', height:'100vh' }}>
      <aside style={{ width:240, padding:16, background:'#f4f4f4' }}>
        <h3>Block Roads</h3>
        <ul style={{ listStyle:'none', padding:0 }}>
          {roads.map(r => (
            <li key={r.id}>
              <label>
                <input
                  type="checkbox"
                  checked={!!blocked[r.id]}
                  onChange={() => toggleRoad(r.id)}
                />{' '}
                {r.name}
              </label>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ flex:1 }}>
        <MapContainer
          center={roads[0]?.coords[0] || [36.9078,37.0785]}
          zoom={12}
          style={{ height:'100%', width:'100%' }}
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
                color:    blocked[r.id] ? 'red' : 'green',
                weight:   blocked[r.id] ? 6       : 4,
                dashArray: blocked[r.id] ? '10,6' : ''
              }}
              eventHandlers={{ click: () => toggleRoad(r.id) }}
            />
          ))}
        </MapContainer>
      </main>
    </div>
  )
}
