import { useEffect, useState } from 'react'
import { AttributionControl, CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import { parcelAtPoint, parcelLayer, type ParcelCard, type ParcelLayer } from '../auth/api'
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

function PickParcel({ enabled, onPick }: { enabled: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      if (!enabled) return
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

type CardState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'parcel'; parcel: ParcelCard }

function field(value: string): string {
  return value.trim() ? value : 'не указано'
}

function squareMeters(value: number | null): string {
  if (value == null) return 'не указано'
  const whole = Math.abs(value - Math.round(value)) < 0.05
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: whole ? 0 : 2 })} кв. м`
}

function money(value: number | null, unit: string): string {
  if (value == null) return 'не указано'
  return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`
}

function ParcelCardView({ card }: { card: CardState }) {
  if (card.kind === 'idle') {
    return <p className="map-card-note">Щёлкните по участку на карте.</p>
  }
  if (card.kind === 'loading') {
    return <p className="map-card-note">Ищем участок…</p>
  }
  if (card.kind === 'empty') {
    return <p className="map-card-note">В этой точке участка нет.</p>
  }
  if (card.kind === 'error') {
    return <p className="map-card-note">{card.message}</p>
  }
  const parcel = card.parcel
  const rows = [
    ['Вид объекта недвижимости', field(parcel.object_kind)],
    ['Вид земельного участка', field(parcel.parcel_kind)],
    ['Дата присвоения', field(parcel.assigned_on)],
    ['Кадастровый номер', parcel.cadastral_number],
    ['Кадастровый квартал', field(parcel.cadastral_quarter)],
    ['Адрес', field(parcel.address)],
    [parcel.area_name ? `Площадь ${parcel.area_name}` : 'Площадь', squareMeters(parcel.area_m2)],
    ['Статус', field(parcel.status)],
    ['Категория земель', field(parcel.land_category)],
    ['Вид разрешённого использования', field(parcel.permitted_use)],
    ['Форма собственности', field(parcel.ownership_form)],
    ['Кадастровая стоимость', money(parcel.cadastral_cost, 'руб.')],
    ['Удельный показатель кадастровой стоимости', money(parcel.cost_index, 'руб./кв. м')],
  ]
  return (
    <dl className="map-card-fields">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function MapPage() {
  const auth = useAuth()
  const verified = auth.account?.verification_status === 'verified'
  const [full, setFull] = useState(false)
  const [focus, setFocus] = useState<District | null>(null)
  const [layer, setLayer] = useState<ParcelLayer | null>(null)
  const [layerKey, setLayerKey] = useState(0)
  const [layerError, setLayerError] = useState('')
  const [card, setCard] = useState<CardState>({ kind: 'idle' })

  useEffect(() => {
    if (!verified) setCard({ kind: 'idle' })
  }, [verified])

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

  function pickParcel(lat: number, lng: number) {
    if (card.kind === 'loading') return
    setCard({ kind: 'loading' })
    parcelAtPoint(lat, lng)
      .then(async (parcel) => {
        if (!parcel) {
          setCard({ kind: 'empty' })
          return
        }
        setCard({ kind: 'parcel', parcel })
        try {
          const next = await parcelLayer()
          setLayer(next)
          setLayerKey((current) => current + 1)
          setLayerError('')
        } catch (err: unknown) {
          setLayerError(err instanceof Error ? err.message : 'Не удалось открыть слой участков')
        }
      })
      .catch((err: unknown) => {
        setCard({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Свежие данные не пришли',
        })
      })
  }

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
            className={verified ? 'map-canvas map-canvas--pick' : 'map-canvas'}
          >
            <AttributionControl prefix='<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>' />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitDistricts />
            <ResizeMap full={full} />
            <FlyTo district={focus} />
            <PickParcel enabled={verified} onPick={pickParcel} />
            {layer && layer.features.length > 0 ? (
              <GeoJSON
                key={layerKey}
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
          {full && verified ? (
            <aside className="map-card map-card--float">
              <h2>Участок</h2>
              <ParcelCardView card={card} />
            </aside>
          ) : null}
        </div>
        {full ? null : (
          <aside className="map-districts">
            {verified ? (
              <section className="map-card">
                <h2>Участок</h2>
                <ParcelCardView card={card} />
              </section>
            ) : null}
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
