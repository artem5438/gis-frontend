import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import AnalyticsChart, { type AnalyticsSlice } from '../components/AnalyticsChart'
import { analytics, type AnalyticsCell } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import { districts } from '../data/districts'
import { landLegend } from '../map/categories'

const districtColors = ['#141414', '#7a5a3a', '#4d78b0', '#5d8a48']

function amount(value: number): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: value >= 100 ? 0 : 2 })
}

function hectares(value: number): string {
  return `${amount(value)} га`
}

function useRise(target: number): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700)
      const eased = 1 - (1 - progress) ** 3
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return value
}

function Rising({ value, format }: { value: number; format: (value: number) => string }) {
  return <>{format(useRise(value))}</>
}

export default function AnalyticsPage() {
  const auth = useAuth()
  const [cells, setCells] = useState<AnalyticsCell[] | null>(null)
  const [error, setError] = useState('')
  const [district, setDistrict] = useState('all')

  useEffect(() => {
    if (!auth.account?.role) return
    let alive = true
    analytics()
      .then((next) => {
        if (alive) setCells(next)
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Не удалось собрать аналитику')
      })
    return () => {
      alive = false
    }
  }, [auth.account?.role])

  const filtered = useMemo(
    () => (cells ?? []).filter((cell) => district === 'all' || cell.district === district),
    [cells, district],
  )

  if (!auth.ready) return <main className="analytics-page" />
  if (!auth.account) return <Navigate to="/login" replace />
  if (!auth.account.role) {
    return (
      <main className="analytics-page">
        <p className="analytics-note">Аналитика откроется после назначения роли.</p>
      </main>
    )
  }

  const count = filtered.reduce((sum, cell) => sum + cell.count, 0)
  const area = filtered.reduce((sum, cell) => sum + cell.area_ha, 0)
  const districtsWithPlots = new Set(filtered.filter((cell) => cell.count > 0).map((cell) => cell.district)).size
  const categoriesWithPlots = new Set(filtered.filter((cell) => cell.count > 0).map((cell) => cell.category)).size

  const byDistrict = (pick: (cell: AnalyticsCell) => number): AnalyticsSlice[] =>
    districts.map((item, index) => ({
      name: item.name,
      color: districtColors[index] ?? '#141414',
      value: (cells ?? []).filter((cell) => cell.district === item.name).reduce((sum, cell) => sum + pick(cell), 0),
    }))

  const byCategory = (pick: (cell: AnalyticsCell) => number): AnalyticsSlice[] =>
    landLegend.map((item) => ({
      name: item.title,
      color: item.stroke,
      value: filtered.filter((cell) => cell.category === item.title).reduce((sum, cell) => sum + pick(cell), 0),
    }))

  return (
    <main className="analytics-page">
      <header className="analytics-head">
        <h1>Аналитика</h1>
        <label>
          Район
          <select value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="all">Все районы</option>
            {districts.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </header>
      {error ? <p className="analytics-note">{error}</p> : null}
      {cells ? (
        <>
          <div className="analytics-kpis">
            <article>
              <p>
                <Rising value={count} format={(value) => Math.round(value).toLocaleString('ru-RU')} />
              </p>
              <span>Участков в каталоге</span>
            </article>
            <article>
              <p>
                <Rising value={area} format={hectares} />
              </p>
              <span>Суммарная площадь</span>
            </article>
            <article>
              <p>
                <Rising value={districtsWithPlots} format={(value) => `${Math.round(value)} из 4`} />
              </p>
              <span>Районов с участками</span>
            </article>
            <article>
              <p>
                <Rising value={categoriesWithPlots} format={(value) => `${Math.round(value)} из 8`} />
              </p>
              <span>Категорий в каталоге</span>
            </article>
          </div>
          <p className="analytics-note">Графики районов показывают все четыре района. Фильтр меняет числа и графики категорий.</p>
          <div className="analytics-grid">
            <AnalyticsChart title="Участки по районам" slices={byDistrict((cell) => cell.count)} format={(value) => Math.round(value).toLocaleString('ru-RU')} />
            <AnalyticsChart title="Участки по категориям" slices={byCategory((cell) => cell.count)} format={(value) => Math.round(value).toLocaleString('ru-RU')} initial="horizontal" />
            <AnalyticsChart title="Площадь по районам" slices={byDistrict((cell) => cell.area_ha)} format={hectares} />
            <AnalyticsChart title="Площадь по категориям" slices={byCategory((cell) => cell.area_ha)} format={hectares} initial="horizontal" />
          </div>
        </>
      ) : error ? null : (
        <p className="analytics-note">Собираем каталог…</p>
      )}
    </main>
  )
}
