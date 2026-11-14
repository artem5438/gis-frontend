import type { Map as LeafletMap } from 'leaflet'
import type { ParcelQuery } from '../auth/api'

export type DrawReach = 'near' | 'screen' | 'city'

const storageKey = 'norilsk-draw-reach'
const nearMeters = 400

export const reachLabels: Record<DrawReach, string> = {
  near: 'Близко',
  screen: 'Экран',
  city: 'Город',
}

export function readDrawReach(): DrawReach {
  try {
    const value = localStorage.getItem(storageKey)
    if (value === 'near' || value === 'screen' || value === 'city') return value
  } catch {
    // Браузер не отдал запись. Остаётся обычное окно карты.
  }
  return 'screen'
}

export function writeDrawReach(value: DrawReach) {
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // Выбор действует до обновления страницы.
  }
}

export function reachQuery(map: LeafletMap, reach: DrawReach): ParcelQuery | null {
  if (reach === 'city') return null
  if (reach === 'near') {
    const center = map.getCenter()
    const lat = nearMeters / 111320
    const lng = nearMeters / (111320 * Math.cos((center.lat * Math.PI) / 180))
    return {
      south: center.lat - lat,
      west: center.lng - lng,
      north: center.lat + lat,
      east: center.lng + lng,
      simplify: 0,
    }
  }
  const bounds = map.getBounds()
  const south = bounds.getSouth()
  const west = bounds.getWest()
  const north = bounds.getNorth()
  const east = bounds.getEast()
  const span = Math.max(north - south, east - west)
  const simplify = span < 0.02 ? 0 : Math.min(span / 300, 0.005)
  return { south, west, north, east, simplify }
}
