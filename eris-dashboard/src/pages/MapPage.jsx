import { MapContainer, TileLayer, Polyline, Marker, useMapEvents  } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import axios from 'axios'


export default function MapPage() {

  //const A = { lat: 36.709927, lng: 37.0570414 } 
  //const B = { lat: 36.7133642, lng: 37.0675055 } 
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [routeCoords, setRouteCoords] = useState([])
  const [routeReady, setRouteReady] = useState(false)

 async function calculateRoute() {
    if (!from || !to) return
    try {
      const res = await axios.post("http://localhost:8000/api/route", {
        from,
        to
      })
      const coords = res.data.paths[0].points.coordinates.map(
        ([lng, lat]) => [lat, lng]
      )
      setRouteCoords(coords)
    } catch (err) {
      console.error('Failed to fetch route:', err)
    }
  }


  function LocationSelector() {
    useMapEvents({
      click(e){
        const clickedPoint = {lat: e.latlng.lat, lng: e.latlng.lng}

        if (!from) {
          setFrom(clickedPoint)
          setTo(null)
          setRouteCoords([])
          setRouteReady(false)
        } else if (!to) {
          setTo(clickedPoint)
          setRouteCoords([])
          setRouteReady(true)
        }
      }
    })
    return null
  }

  return (
    <>
      <MapContainer center={[37.5832862, 36.9300109]} zoom={12} style={{ height: '90vh', width: '100%' }}>
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationSelector />
        {from && <Marker position={[from.lat, from.lng]} />}
        {to && <Marker position={[to.lat, to.lng]} />}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="blue" />
        )}
      </MapContainer>

      <div style={{ textAlign: 'center', margin: '10px' }}>
        <button
          disabled={!routeReady}
          onClick={calculateRoute}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: routeReady ? 'pointer' : 'not-allowed',
            backgroundColor: routeReady ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          Calculate Route
        </button>
      </div>
    </>
  )
}
