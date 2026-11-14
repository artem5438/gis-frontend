import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { AttributionControl, Circle, CircleMarker, GeoJSON, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import type { LatLngBoundsExpression, PathOptions } from 'leaflet'
import { catalogWalk, parcelAtPoint, parcelLayer, parcelStoredAtPoint, startCatalogWalk, type ParcelCard, type ParcelLayer, type WalkStatus } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import { districts, type District } from '../data/districts'
import { categoryPaint, categoryTitle, landLegend } from '../map/categories'
import { formatArea, formatDegrees, formatMeters, metersBetween, pathLength, ringArea, type LatLng } from '../map/measure'
import { reachQuery, readDrawReach, type DrawReach } from '../map/reach'
import 'leaflet/dist/leaflet.css'

const bounds = districts.map((district) => [district.lat, district.lon]) as LatLngBoundsExpression
const viewStorageKey = 'norilsk-map-view'

type MapView = { lat: number; lng: number; zoom: number }

function readMapView(): MapView | null {
  try {
    const raw = sessionStorage.getItem(viewStorageKey)
    if (!raw) return null
    const view = JSON.parse(raw) as Partial<MapView>
    if (typeof view.lat !== 'number' || typeof view.lng !== 'number' || typeof view.zoom !== 'number') return null
    if (!Number.isFinite(view.lat) || !Number.isFinite(view.lng) || !Number.isFinite(view.zoom)) return null
    if (view.lat < -90 || view.lat > 90 || view.lng < -180 || view.lng > 180) return null
    if (view.zoom < 0 || view.zoom > 22) return null
    return { lat: view.lat, lng: view.lng, zoom: view.zoom }
  } catch {
    return null
  }
}

function writeMapView(map: LeafletMap) {
  try {
    const center = map.getCenter()
    const view: MapView = { lat: center.lat, lng: center.lng, zoom: map.getZoom() }
    sessionStorage.setItem(viewStorageKey, JSON.stringify(view))
  } catch {
    // Вкладка не приняла запись. Карта всё равно остаётся на месте.
  }
}

const bases = {
  streets: {
    label: 'Улицы',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Спутник',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
} as const

type BaseName = keyof typeof bases
type Tool = 'none' | 'parcel' | 'coords' | 'line' | 'circle' | 'polygon'

const toolHint: Record<Tool, string> = {
  none: 'Инструмент выключен. Щелчок по карте ничего не измеряет.',
  parcel: 'Щелчок ищет участок на публичной карте.',
  coords: 'Щелчок показывает координаты точки. Повторное нажатие кнопки выключает режим.',
  line: 'Щелчки ставят точки. Двойной щелчок заканчивает линию.',
  circle: 'Первый щелчок — центр, второй заканчивает круг.',
  polygon: 'Щелчки ставят углы. «Замкнуть» заканчивает полигон.',
}

function restingTool(verified: boolean): Tool {
  return verified ? 'parcel' : 'none'
}

function readDegrees(value: string): number {
  return Number(value.trim().replace(',', '.'))
}

function placePoint(first: number, second: number): { lat: number; lng: number; swapped: boolean } | null {
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null
  const nearLat = (value: number) => value >= 68 && value <= 70.5
  const nearLng = (value: number) => value >= 86 && value <= 90
  let lat = first
  let lng = second
  let swapped = false
  if (nearLng(first) && nearLat(second)) {
    lat = second
    lng = first
    swapped = true
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng, swapped }
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {children}
    </svg>
  )
}

const iconProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function FitDistricts() {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 })
    writeMapView(map)
  }, [map])

  return null
}

function RememberView() {
  const map = useMap()

  useEffect(() => {
    const save = () => writeMapView(map)
    map.on('moveend', save)
    return () => {
      save()
      map.off('moveend', save)
    }
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

function FlyTo({
  district,
  focusToken,
  jump,
}: {
  district: District | null
  focusToken: number
  jump: { lat: number; lng: number; token: number } | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!district) return
    map.flyTo([district.lat, district.lon], 13)
  }, [map, district, focusToken])

  useEffect(() => {
    if (!jump) return
    map.flyTo([jump.lat, jump.lng], 16)
  }, [map, jump])

  return null
}

function BindMap({ mapRef }: { mapRef: { current: LeafletMap | null } }) {
  const map = useMap()
  mapRef.current = map
  return null
}

function MapClicks({
  onClick,
  onMove,
  onDouble,
}: {
  onClick: (lat: number, lng: number) => void
  onMove: (lat: number, lng: number) => void
  onDouble: () => void
}) {
  useMapEvents({
    click(event) {
      onClick(event.latlng.lat, event.latlng.lng)
    },
    dblclick() {
      onDouble()
    },
    mousemove(event) {
      onMove(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function MeasureZoom({ active }: { active: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (active) map.doubleClickZoom.disable()
    else map.doubleClickZoom.enable()
    return () => {
      map.doubleClickZoom.enable()
    }
  }, [map, active])

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

function positions(points: LatLng[]): [number, number][] {
  return points.map((point) => [point.lat, point.lng])
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

function ParcelWindow({
  reach,
  enabled,
  reloadToken,
  onLayer,
  onError,
}: {
  reach: DrawReach
  enabled: boolean
  reloadToken: number
  onLayer: (layer: ParcelLayer) => void
  onError: (message: string) => void
}) {
  const map = useMap()
  const onLayerRef = useRef(onLayer)
  const onErrorRef = useRef(onError)
  onLayerRef.current = onLayer
  onErrorRef.current = onError

  useEffect(() => {
    if (!enabled) return
    let alive = true
    let request = 0
    let timer = 0
    const load = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const id = ++request
        parcelLayer(reachQuery(map, reach))
          .then((next) => {
            if (!alive || id !== request) return
            onLayerRef.current(next)
          })
          .catch((err: unknown) => {
            if (!alive || id !== request) return
            onErrorRef.current(err instanceof Error ? err.message : 'Не удалось открыть слой участков')
          })
      }, reach === 'city' ? 0 : 250)
    }
    load()
    if (reach !== 'city') map.on('moveend', load)
    return () => {
      alive = false
      window.clearTimeout(timer)
      map.off('moveend', load)
    }
  }, [map, reach, enabled, reloadToken])

  return null
}

function parcelStyle(feature?: GeoJSON.Feature): PathOptions {
  const category = typeof feature?.properties?.land_category === 'string' ? feature.properties.land_category : ''
  const paint = categoryPaint(category)
  return { color: paint.stroke, weight: 2, fillColor: paint.fill, fillOpacity: 0.55 }
}

export default function MapPage() {
  const auth = useAuth()
  const [savedView] = useState(readMapView)
  const verified = auth.account?.verification_status === 'verified'
  const fromDatabase = auth.account?.from_database !== false
  const moderator = auth.account?.role?.code === 'moderator' && !fromDatabase
  const [full, setFull] = useState(false)
  const mapRef = useRef<LeafletMap | null>(null)
  const [focus, setFocus] = useState<District | null>(null)
  const [focusToken, setFocusToken] = useState(0)
  const [jump, setJump] = useState<{ lat: number; lng: number; token: number } | null>(null)
  const [layer, setLayer] = useState<ParcelLayer | null>(null)
  const [layerKey, setLayerKey] = useState(0)
  const [layerError, setLayerError] = useState('')
  const [card, setCard] = useState<CardState>({ kind: 'idle' })
  const [base, setBase] = useState<BaseName>('streets')
  const [tool, setTool] = useState<Tool>(restingTool(verified))
  const [lineDone, setLineDone] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState<'base' | 'search' | 'districts' | 'measure' | 'filter' | 'catalog' | null>(null)
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([])
  const [walk, setWalk] = useState<WalkStatus | null>(null)
  const [walkError, setWalkError] = useState('')
  const [cardOpen, setCardOpen] = useState(false)
  const [latText, setLatText] = useState('')
  const [lngText, setLngText] = useState('')
  const [searchError, setSearchError] = useState('')
  const [mark, setMark] = useState<LatLng | null>(null)
  const [line, setLine] = useState<LatLng[]>([])
  const [cursor, setCursor] = useState<LatLng | null>(null)
  const [circleCenter, setCircleCenter] = useState<LatLng | null>(null)
  const [circleEdge, setCircleEdge] = useState<LatLng | null>(null)
  const [circleFixed, setCircleFixed] = useState(false)
  const [poly, setPoly] = useState<LatLng[]>([])
  const [polyFixed, setPolyFixed] = useState(false)
  const [reach] = useState<DrawReach>(readDrawReach)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!verified) {
      setCard({ kind: 'idle' })
      setTool((current) => (current === 'parcel' ? 'none' : current))
      return
    }
    setTool((current) => (current === 'none' ? 'parcel' : current))
  }, [verified])

  useEffect(() => {
    if (card.kind !== 'idle') setCardOpen(true)
  }, [card])

  useEffect(() => {
    if (!auth.ready || !verified) {
      setLayer(null)
      setLayerError('')
    }
  }, [auth.ready, verified])

  useEffect(() => {
    if (!auth.ready || !moderator) return
    let alive = true
    catalogWalk()
      .then((next) => {
        if (alive) setWalk(next)
      })
      .catch((err: unknown) => {
        if (alive) setWalkError(err instanceof Error ? err.message : 'Не удалось прочитать обход')
      })
    return () => {
      alive = false
    }
  }, [auth.ready, moderator])

  useEffect(() => {
    if (!moderator || walk?.state !== 'running') return
    let alive = true
    const timer = window.setInterval(() => {
      catalogWalk()
        .then(async (next) => {
          if (!alive) return
          setReloadToken((current) => current + 1)
          setWalk(next)
          setWalkError('')
        })
        .catch((err: unknown) => {
          if (!alive) return
          setWalkError(err instanceof Error ? err.message : 'Не удалось прочитать обход')
        })
    }, 3000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [moderator, walk?.state])

  function pickParcel(lat: number, lng: number) {
    if (card.kind === 'loading') return
    setCard({ kind: 'loading' })
    const lookup = fromDatabase ? parcelStoredAtPoint : parcelAtPoint
    lookup(lat, lng)
      .then(async (parcel) => {
        if (!parcel) {
          setCard({ kind: 'empty' })
          return
        }
        setCard({ kind: 'parcel', parcel })
        if (fromDatabase) return
        setReloadToken((current) => current + 1)
      })
      .catch((err: unknown) => {
        setCard({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Свежие данные не пришли',
        })
      })
  }

  function freezeMeasure() {
    setLineDone(true)
    setCircleFixed(true)
    setCursor(null)
    if (poly.length >= 3) setPolyFixed(true)
  }

  function clearFigures() {
    setLine([])
    setLineDone(false)
    setCursor(null)
    setCircleCenter(null)
    setCircleEdge(null)
    setCircleFixed(false)
    setPoly([])
    setPolyFixed(false)
    setMark(null)
  }

  function chooseTool(next: Tool) {
    if (next !== 'line' && next !== 'circle' && next !== 'polygon') setOpenPanel(null)
    if (tool === next) {
      freezeMeasure()
      setTool(restingTool(verified))
      return
    }
    clearFigures()
    setTool(next)
  }

  function togglePanel(name: 'base' | 'search' | 'districts' | 'measure' | 'filter' | 'catalog') {
    setOpenPanel((current) => (current === name ? null : name))
  }

  function toggleCategory(title: string) {
    setHiddenCategories((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]))
  }

  function beginWalk() {
    setWalkError('')
    startCatalogWalk()
      .then((next) => setWalk({ ...next, state: 'running' }))
      .catch((err: unknown) => {
        setWalkError(err instanceof Error ? err.message : 'Не удалось запустить обход')
      })
  }

  function finishMeasure() {
    freezeMeasure()
    setTool(restingTool(verified))
  }

  function onMapClick(lat: number, lng: number) {
    const point = { lat, lng }
    if (tool === 'parcel') {
      if (verified) pickParcel(lat, lng)
      return
    }
    if (tool === 'coords') {
      setMark(point)
      return
    }
    if (tool === 'line') {
      if (lineDone) return
      setLine((current) => [...current, point])
      return
    }
    if (tool === 'circle') {
      if (!circleCenter) {
        setCircleCenter(point)
        setCircleEdge(point)
        setCircleFixed(false)
        return
      }
      setCircleEdge(point)
      setCircleFixed(true)
      setCursor(null)
      setTool(restingTool(verified))
      return
    }
    if (tool !== 'polygon' || polyFixed) return
    setPoly((current) => [...current, point])
  }

  function onMapDouble() {
    if (tool === 'line') {
      setLine((current) => {
        if (current.length >= 2 && metersBetween(current[current.length - 1], current[current.length - 2]) < 3) {
          const next = current.slice(0, -1)
          return next.length >= 2 ? next : []
        }
        return current.length >= 2 ? current : []
      })
      setLineDone(true)
      setCursor(null)
      setTool(restingTool(verified))
      return
    }
    if (tool !== 'polygon') return
    const duplicate = poly.length >= 2 && metersBetween(poly[poly.length - 1], poly[poly.length - 2]) < 3
    const count = poly.length - (duplicate ? 1 : 0)
    if (count < 3) return
    if (duplicate) setPoly((current) => current.slice(0, -1))
    setPolyFixed(true)
    setCursor(null)
    setTool(restingTool(verified))
  }

  function onMapMove(lat: number, lng: number) {
    if (tool === 'line' && lineDone) return
    if (tool === 'circle' && (circleFixed || !circleCenter)) return
    if (tool === 'polygon' && polyFixed) return
    if (tool !== 'line' && tool !== 'circle' && tool !== 'polygon') return
    const point = { lat, lng }
    setCursor(point)
    if (tool === 'circle') setCircleEdge(point)
  }

  function clearMeasure() {
    clearFigures()
    setTool(restingTool(verified))
  }

  function findPoint() {
    const point = placePoint(readDegrees(latText), readDegrees(lngText))
    if (!point) {
      setSearchError('Нужны широта от −90 до 90 и долгота от −180 до 180.')
      return
    }
    if (point.swapped) {
      setLatText(String(point.lat))
      setLngText(String(point.lng))
    }
    setSearchError('')
    setMark({ lat: point.lat, lng: point.lng })
    setJump({ lat: point.lat, lng: point.lng, token: Date.now() })
  }

  const drawingLine = tool === 'line' && !lineDone
  const linePoints = drawingLine && cursor && !line.some((point) => point.lat === cursor.lat && point.lng === cursor.lng)
    ? [...line, cursor]
    : line
  const lineTotal = pathLength(line, false)
  const lineCurrent = drawingLine && line.length > 0 && cursor ? metersBetween(line[line.length - 1], cursor) : 0
  const radius = circleCenter && circleEdge ? metersBetween(circleCenter, circleEdge) : 0
  const polyPoints = tool === 'polygon' && cursor && !polyFixed ? [...poly, cursor] : poly
  const polyArea = ringArea(polyFixed ? poly : polyPoints)
  const polyPerimeter = pathLength(polyFixed ? poly : polyPoints, polyFixed || polyPoints.length > 2)

  let measureText = ''
  if (mark && (tool === 'coords' || tool === 'parcel')) measureText = formatDegrees(mark.lat, mark.lng)
  if (line.length > 1) {
    measureText = `Общая дистанция: ${formatMeters(lineTotal)}.`
    if (drawingLine && cursor) measureText += ` Текущая: ${formatMeters(lineCurrent)}.`
  }
  if (circleCenter && radius > 0) {
    measureText = `Площадь: ${formatArea(Math.PI * radius * radius)}. Длина окружности: ${formatMeters(2 * Math.PI * radius)}. Радиус: ${formatMeters(radius)}.`
  }
  if (poly.length > 0) {
    measureText = `Площадь: ${formatArea(polyArea)}. Периметр: ${formatMeters(polyPerimeter)}.`
  }

  const visibleLayer =
    layer == null
      ? null
      : {
          ...layer,
          features: layer.features.filter((feature) => !hiddenCategories.includes(categoryTitle(feature.properties.land_category))),
        }
  const walkText = walkError || (walk?.state === 'running'
    ? `Идёт обход. Записано ${walk.saved}. Осталось прямоугольников ${walk.left}.`
    : walk?.state === 'done'
      ? walk.message || `Обход закончен. Записано ${walk.saved}.`
      : 'Обход ещё не запускали.')

  const caption = !auth.ready
    ? 'Открываем карту.'
    : verified
      ? layerError || (layer && layer.features.length > 0 ? 'Кадастровая карта.' : 'Кадастровая карта. Участков пока нет.')
      : 'Обычная карта. Четыре района Норильска.'
  const baseLayer = bases[base]

  return (
    <main className={full ? 'map-page map-page--full' : 'map-page'}>
      {full ? null : (
        <header className="map-heading">
          <div>
            <h1>Карта Норильска</h1>
            <p>{caption}</p>
          </div>
        </header>
      )}
      <div className="map-layout">
        <div className="map-frame">
          <MapContainer
            center={savedView ? [savedView.lat, savedView.lng] : [69.38, 88.07]}
            zoom={savedView ? savedView.zoom : 11}
            zoomControl={false}
            scrollWheelZoom
            attributionControl={false}
            className={tool === 'parcel' ? 'map-canvas map-canvas--pick' : tool === 'none' ? 'map-canvas' : 'map-canvas map-canvas--measure'}
          >
            <AttributionControl prefix='<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>' />
            <TileLayer key={base} attribution={baseLayer.attribution} url={baseLayer.url} />
            <BindMap mapRef={mapRef} />
            {savedView ? null : <FitDistricts />}
            <RememberView />
            <ResizeMap full={full} />
            <FlyTo district={focus} focusToken={focusToken} jump={jump} />
            <MeasureZoom active={tool === 'line' || tool === 'polygon'} />
            <MapClicks onClick={onMapClick} onMove={onMapMove} onDouble={onMapDouble} />
            <ParcelWindow
              reach={reach}
              enabled={auth.ready && verified}
              reloadToken={reloadToken}
              onLayer={(next) => {
                setLayer(next)
                setLayerKey((current) => current + 1)
                setLayerError('')
              }}
              onError={(message) => {
                setLayer(null)
                setLayerError(message)
              }}
            />
            {visibleLayer && visibleLayer.features.length > 0 ? (
              <GeoJSON key={`${layerKey}:${hiddenCategories.join('|')}`} data={visibleLayer} style={parcelStyle} />
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
            {mark ? (
              <CircleMarker center={[mark.lat, mark.lng]} radius={7} pathOptions={{ color: '#14315c', fillColor: '#f4c542', fillOpacity: 1, weight: 2 }} />
            ) : null}
            {linePoints.length > 1 ? (
              <Polyline positions={positions(linePoints)} pathOptions={{ color: '#14315c', weight: 3, dashArray: drawingLine ? '6 6' : undefined }} />
            ) : null}
            {circleCenter && radius > 0 ? (
              <Circle center={[circleCenter.lat, circleCenter.lng]} radius={radius} pathOptions={{ color: '#14315c', weight: 2, fillColor: '#8eb4e8', fillOpacity: 0.35 }} />
            ) : null}
            {polyPoints.length > 2 ? (
              <Polygon positions={positions(polyPoints)} pathOptions={{ color: '#5b2d86', weight: 2, fillColor: '#c9a6e0', fillOpacity: 0.35 }} />
            ) : null}
            {polyPoints.length > 1 && polyPoints.length < 3 ? (
              <Polyline positions={positions(polyPoints)} pathOptions={{ color: '#5b2d86', weight: 2, dashArray: '6 6' }} />
            ) : null}
          </MapContainer>
          <div className="map-dock">
            <button
              type="button"
              className="map-icon"
              data-label={full ? 'Свернуть' : 'На весь экран'}
              aria-label={full ? 'Свернуть' : 'На весь экран'}
              onClick={() => setFull((current) => !current)}
            >
              <Icon>
                {full ? (
                  <path {...iconProps} d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                ) : (
                  <path {...iconProps} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                )}
              </Icon>
            </button>
            <div className="map-dock-item">
              <button type="button" className={openPanel === 'base' ? 'map-icon active' : 'map-icon'} data-label="Подложка" aria-label="Подложка" onClick={() => togglePanel('base')}>
                <Icon>
                  <path {...iconProps} d="M12 3 3 8l9 5 9-5-9-5Z" />
                  <path {...iconProps} d="m3 12 9 5 9-5" />
                  <path {...iconProps} d="m3 16 9 5 9-5" />
                </Icon>
              </button>
              {openPanel === 'base' ? (
                <div className="map-pop">
                  {(Object.keys(bases) as BaseName[]).map((name) => (
                    <button key={name} type="button" className={base === name ? 'active' : undefined} onClick={() => setBase(name)}>
                      {bases[name].label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="map-dock-item">
              <button type="button" className={openPanel === 'search' ? 'map-icon active' : 'map-icon'} data-label="Поиск точки по координатам" aria-label="Поиск точки по координатам" onClick={() => togglePanel('search')}>
                <Icon>
                  <circle {...iconProps} cx="11" cy="11" r="6" />
                  <path {...iconProps} d="m20 20-3.5-3.5" />
                </Icon>
              </button>
              {openPanel === 'search' ? (
                <form
                  className="map-pop map-search"
                  onSubmit={(event) => {
                    event.preventDefault()
                    findPoint()
                  }}
                >
                  <label>
                    Широта
                    <input value={latText} onChange={(event) => setLatText(event.target.value)} inputMode="decimal" placeholder="69.49" />
                  </label>
                  <label>
                    Долгота
                    <input value={lngText} onChange={(event) => setLngText(event.target.value)} inputMode="decimal" placeholder="88.40" />
                  </label>
                  <p className="map-search-hint">Для Норильска широта около 69, долгота около 88.</p>
                  <button type="submit">Найти</button>
                </form>
              ) : null}
            </div>
            <div className="map-dock-item">
              <button type="button" className={openPanel === 'districts' ? 'map-icon active' : 'map-icon'} data-label="Районы" aria-label="Районы" onClick={() => togglePanel('districts')}>
                <Icon>
                  <path {...iconProps} d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
                  <circle {...iconProps} cx="12" cy="10" r="2.2" />
                </Icon>
              </button>
              {openPanel === 'districts' ? (
                <div className="map-pop">
                  {districts.map((district) => (
                    <button
                      key={district.id}
                      type="button"
                      className={focus?.id === district.id ? 'active' : undefined}
                      onClick={() => {
                        setFocus(district)
                        setFocusToken((current) => current + 1)
                      }}
                    >
                      {district.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {verified ? (
              <div className="map-dock-item">
                <button type="button" className={openPanel === 'filter' ? 'map-icon active' : 'map-icon'} data-label="Фильтр категорий" aria-label="Фильтр категорий" onClick={() => togglePanel('filter')}>
                  <Icon>
                    <path {...iconProps} d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
                  </Icon>
                </button>
                {openPanel === 'filter' ? (
                  <div className="map-pop map-filter">
                    {landLegend.map((item) => (
                      <label key={item.title}>
                        <input type="checkbox" checked={!hiddenCategories.includes(item.title)} onChange={() => toggleCategory(item.title)} />
                        <i style={{ background: item.fill, borderColor: item.stroke }} />
                        {item.title}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {moderator ? (
              <div className="map-dock-item">
                <button type="button" className={openPanel === 'catalog' || walk?.state === 'running' ? 'map-icon active' : 'map-icon'} data-label="Собрать каталог" aria-label="Собрать каталог" onClick={() => togglePanel('catalog')}>
                  <Icon>
                    <path {...iconProps} d="M12 4v10M8 10l4 4 4-4M5 19h14" />
                  </Icon>
                </button>
                {openPanel === 'catalog' ? (
                  <div className="map-pop map-catalog">
                    <button type="button" onClick={beginWalk} disabled={walk?.state === 'running'}>
                      {walk?.state === 'running' ? 'Обход идёт' : 'Собрать каталог'}
                    </button>
                    <p>{walkText}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="map-dock-item">
              <button
                type="button"
                className={openPanel === 'measure' || tool === 'line' || tool === 'circle' || tool === 'polygon' ? 'map-icon active' : 'map-icon'}
                data-label="Инструменты измерения"
                aria-label="Инструменты измерения"
                onClick={() => togglePanel('measure')}
              >
                <Icon>
                  <path {...iconProps} d="M4 20 20 4" />
                  <path {...iconProps} d="m7 17 2 2M11 13l2 2M15 9l2 2" />
                </Icon>
              </button>
              {openPanel === 'measure' ? (
                <div className="map-pop map-pop--icons">
                  <button type="button" className={tool === 'line' ? 'map-icon active' : 'map-icon'} data-label="Расстояние" aria-label="Расстояние" onClick={() => chooseTool('line')}>
                    <Icon>
                      <path {...iconProps} d="M4 18 18 4" />
                      <path {...iconProps} d="M7 15l2 2M12 10l2 2" />
                    </Icon>
                  </button>
                  <button type="button" className={tool === 'circle' ? 'map-icon active' : 'map-icon'} data-label="Радиус" aria-label="Радиус" onClick={() => chooseTool('circle')}>
                    <Icon>
                      <circle {...iconProps} cx="12" cy="12" r="7" />
                      <path {...iconProps} d="M12 12h7" />
                    </Icon>
                  </button>
                  <button type="button" className={tool === 'polygon' ? 'map-icon active' : 'map-icon'} data-label="Полигон" aria-label="Полигон" onClick={() => chooseTool('polygon')}>
                    <Icon>
                      <path {...iconProps} d="m12 4 7 5-3 8H8L5 9l7-5Z" />
                    </Icon>
                  </button>
                  {tool === 'polygon' && poly.length >= 3 && !polyFixed ? (
                    <button type="button" onClick={finishMeasure}>
                      Замкнуть
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <button type="button" className={tool === 'coords' ? 'map-icon active' : 'map-icon'} data-label="Координаты точки" aria-label="Координаты точки" onClick={() => chooseTool('coords')}>
              <Icon>
                <circle {...iconProps} cx="12" cy="12" r="3" />
                <path {...iconProps} d="M12 3v4M12 17v4M3 12h4M17 12h4" />
              </Icon>
            </button>
            <button type="button" className="map-icon" data-label="Приблизить" aria-label="Приблизить" onClick={() => mapRef.current?.zoomIn()}>
              <Icon>
                <path {...iconProps} d="M12 6v12M6 12h12" />
              </Icon>
            </button>
            <button type="button" className="map-icon" data-label="Отдалить" aria-label="Отдалить" onClick={() => mapRef.current?.zoomOut()}>
              <Icon>
                <path {...iconProps} d="M6 12h12" />
              </Icon>
            </button>
            <button type="button" className="map-icon" data-label="Сбросить" aria-label="Сбросить" onClick={clearMeasure}>
              <Icon>
                <path {...iconProps} d="M5 7h14M9 7V5h6v2M8 7l1 13h6l1-13" />
              </Icon>
            </button>
            {verified && card.kind !== 'idle' && !cardOpen ? (
              <button type="button" className="map-icon" data-label="Карточка участка" aria-label="Карточка участка" onClick={() => setCardOpen(true)}>
                <Icon>
                  <rect {...iconProps} x="5" y="4" width="14" height="16" rx="2" />
                  <path {...iconProps} d="M8 8h8M8 12h8M8 16h5" />
                </Icon>
              </button>
            ) : null}
            {searchError || measureText || (tool !== 'parcel' && tool !== 'none') ? (
              <p className="map-tool-note">{searchError || measureText || toolHint[tool]}</p>
            ) : null}
          </div>
          {verified ? (
            <aside className={legendOpen ? 'map-legend map-legend--open' : 'map-legend'}>
              <button type="button" className="map-legend-bar" onClick={() => setLegendOpen((current) => !current)}>
                Легенда
                <span>{legendOpen ? '▴' : '▾'}</span>
              </button>
              {legendOpen ? (
                <ul>
                  {landLegend.map((item) => (
                    <li key={item.title}>
                      <span style={{ background: item.fill, borderColor: item.stroke }} />
                      {item.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </aside>
          ) : null}
          {verified && cardOpen ? (
            <aside className="map-card map-card--float">
              <div className="map-card-head">
                <h2>Участок</h2>
                <button type="button" onClick={() => setCardOpen(false)}>
                  Свернуть
                </button>
              </div>
              <ParcelCardView card={card} />
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  )
}
