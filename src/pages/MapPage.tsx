import { useEffect, useState } from 'react'
import { AttributionControl, CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import { parcelLayer, type ParcelLayer } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import { districts, type District } from '../data/districts'
import 'leaflet/dist/leaflet.css'

const bounds = districts.map((district) => [district.lat, district.lon]) as LatLngBoundsExpression

function FitDistricts() {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
  }, [map])

  return null
}

function ResizeMap({ full }: { full: boolean }) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
  }, [map, full])

  return null
}

function FlyTo({ district }: { district: District | null }) {
  const map = useMap()

  useEffect(() => {
    if (!district) return
    map.flyTo([district.lat, district.lon], 13)
  }, [map, district])

  return null
}

export default function MapPage() {
  const auth = useAuth()
  const verified = auth.account?.verification_status === 'verified'
  const [full, setFull] = useState(false)
  const [focus, setFocus] = useState<District | null>(null)
  const [layer, setLayer] = useState<ParcelLayer | null>(null)
  const [layerError, setLayerError] = useState('')

  useEffect(() => {
    if (!auth.ready || !verified) {
      setLayer(null)
      setLayerError('')
      return
    }
    let alive = true
    parcelLayer()
      .then((next) => {
        if (!alive) return
        setLayer(next)
        setLayerError('')
      })
      .catch((err: unknown) => {
        if (!alive) return
        setLayer(null)
        setLayerError(err instanceof Error ? err.message : 'Не удалось открыть слой участков')
      })
    return () => {
      alive = false
    }
  }, [auth.ready, verified])

  const caption = !auth.ready
    ? 'Открываем карту.'
    : verified
      ? layerError || (layer && layer.features.length > 0 ? 'Кадастровая карта.' : 'Кадастровая карта. Участков пока нет.')
      : 'Обычная карта. Четыре района Норильска.'

  return (
    <main className={full ? 'map-page map-page--full' : 'map-page'}>
      <header className="map-heading">
        <div>
          <h1>Карта Норильска</h1>
          <p>{caption}</p>
        </div>
        <button type="button" className="map-expand" onClick={() => setFull((current) => !current)}>
          {full ? 'Свернуть' : 'На весь экран'}
        </button>
      </header>
      <div className="map-layout">
        <div className="map-frame">
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
            <ResizeMap full={full} />
            <FlyTo district={focus} />
            {layer && layer.features.length > 0 ? (
              <GeoJSON
                data={layer}
                style={{ color: '#14315c', weight: 2, fillColor: '#1f8a62', fillOpacity: 0.35 }}
              />
            ) : null}
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
        </div>
        {full ? null : (
          <aside className="map-districts">
            <h2>Районы</h2>
            {districts.map((district) => (
              <button
                key={district.id}
                type="button"
                className={focus?.id === district.id ? 'active' : undefined}
                onClick={() => setFocus(district)}
              >
                {district.name}
              </button>
            ))}
          </aside>
        )}
      </div>
    </main>
  )
}
