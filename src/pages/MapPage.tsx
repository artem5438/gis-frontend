import { useEffect } from 'react'
import { AttributionControl, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import { districts } from '../data/districts'
import 'leaflet/dist/leaflet.css'

const bounds = districts.map((district) => [district.lat, district.lon]) as LatLngBoundsExpression

function FitDistricts() {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }, [map])

  return null
}

export default function MapPage() {
  return (
    <main className="map-page">
      <MapContainer
        center={[69.38, 88.07]}
        zoom={11}
        scrollWheelZoom
        attributionControl={false}
        className="map-canvas"
      >
        <AttributionControl prefix='<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>' />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitDistricts />
        {districts.map((district) => (
          <CircleMarker
            key={district.id}
            center={[district.lat, district.lon]}
            radius={10}
            pathOptions={{ color: '#14315c', fillColor: '#1f8a62', fillOpacity: 0.95, weight: 2 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {district.name}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <aside className="map-note">
        <p>Четыре района Норильска. Инвестиционных площадок на карте пока нет.</p>
      </aside>
    </main>
  )
}
