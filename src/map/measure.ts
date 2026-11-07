export type LatLng = { lat: number; lng: number }

const earth = 6378137

export function metersBetween(a: LatLng, b: LatLng): number {
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const dφ = ((b.lat - a.lat) * Math.PI) / 180
  const dλ = ((b.lng - a.lng) * Math.PI) / 180
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function pathLength(points: LatLng[], close: boolean): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += metersBetween(points[i - 1], points[i])
  if (close && points.length > 2) total += metersBetween(points[points.length - 1], points[0])
  return total
}

export function ringArea(points: LatLng[]): number {
  if (points.length < 3) return 0
  const lat0 = points.reduce((sum, point) => sum + point.lat, 0) / points.length
  const mLat = 111320
  const mLng = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const xy = points.map((point) => ({ x: point.lng * mLng, y: point.lat * mLat }))
  let sum = 0
  for (let i = 0; i < xy.length; i += 1) {
    const next = xy[(i + 1) % xy.length]
    sum += xy[i].x * next.y - next.x * xy[i].y
  }
  return Math.abs(sum) / 2
}

export function formatMeters(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} км`
  return `${meters.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} м`
}

export function formatArea(squareMeters: number): string {
  return `${squareMeters.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} м²`
}

export function formatDegrees(lat: number, lng: number): string {
  const digits = { minimumFractionDigits: 6, maximumFractionDigits: 6 }
  return `Широта: ${lat.toLocaleString('ru-RU', digits)}° Долгота: ${lng.toLocaleString('ru-RU', digits)}°`
}
