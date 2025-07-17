import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

function Routing({ from, to }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const ctl = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      routeWhileDragging: true
    }).addTo(map)
    return () => map.removeControl(ctl)
  }, [map, from, to])
  return null
}

export default function MapPage() {
  const A = { lat: 36.9078, lng: 37.0785 }  // Gaziantep
  const B = { lat: 36.3409, lng: 37.8826 }  // some other point

  return (
    <MapContainer center={[A.lat, A.lng]} zoom={12} style={{ height:'100vh', width:'100%' }}>
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Routing from={A} to={B} />
    </MapContainer>
  )
}
