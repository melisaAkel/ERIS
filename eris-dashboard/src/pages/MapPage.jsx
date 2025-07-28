import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import axios from 'axios'


export default function MapPage() {

  const A = { lat: 36.709927, lng: 37.0570414 } 
  const B = { lat: 36.7133642, lng: 37.0675055 } 
  const [routeCoords, setRouteCoords] = useState([])

  useEffect(() => {
    async function fetchRoute() {
      try {
        const res = await axios.post("http://localhost:8000/api/route", {
          from: A,
          to: B
        })
        const coords = res.data.paths[0].points.coordinates.map(([lng, lat]) => [lat, lng])
        setRouteCoords(coords)
      } catch (err) {
        console.error('Failed to fetch route:', err)
      }
    }

    fetchRoute()
  }, [])

  return (
    <MapContainer center={[A.lat, A.lng]} zoom={12} style={{ height:'100vh', width:'100%' }}>
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[A.lat, A.lng]} />
      <Marker position={[B.lat, B.lng]} />
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} color="blue" />
      )}
    </MapContainer>
  )
}
