import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type AnalyticsSlice = { name: string; value: number; color: string }

type ChartKind = 'bar' | 'horizontal' | 'pie' | 'donut' | 'line' | 'area'

const kinds: { id: ChartKind; label: string }[] = [
  { id: 'bar', label: 'Столбцы' },
  { id: 'horizontal', label: 'Горизонтальные столбцы' },
  { id: 'pie', label: 'Круг' },
  { id: 'donut', label: 'Кольцо' },
  { id: 'line', label: 'Линия' },
  { id: 'area', label: 'Область' },
]

const tick = { fill: '#5c5c5c', fontSize: 12 }
const duration = 700

function share(value: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((value / total) * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`
}

function ChartTip({
  active,
  payload,
  format,
  total,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: AnalyticsSlice; value?: number }>
  format: (value: number) => string
  total: number
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  if (!row) return null
  return (
    <div className="analytics-tip">
      <p>{row.name}</p>
      <span>
        {format(Number(payload[0].value ?? row.value))} · {share(row.value, total)}
      </span>
    </div>
  )
}

export default function AnalyticsChart({
  title,
  slices,
  format,
  initial = 'bar',
}: {
  title: string
  slices: AnalyticsSlice[]
  format: (value: number) => string
  initial?: ChartKind
}) {
  const [kind, setKind] = useState<ChartKind>(initial)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const positive = slices.filter((slice) => slice.value > 0)
  const height = kind === 'horizontal' ? Math.max(240, slices.length * 36) : 260
  const names = (
    <ul className="analytics-names">
      {slices.map((slice) => (
        <li key={slice.name}>
          <i style={{ background: slice.color }} />
          <span>{slice.name}</span>
          <b>{format(slice.value)}</b>
        </li>
      ))}
    </ul>
  )

  let picture = <p className="analytics-empty">Нет участков</p>
  if (total > 0 && (kind === 'pie' || kind === 'donut')) {
    picture = (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={positive}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={kind === 'donut' ? 58 : 0}
            outerRadius={96}
            paddingAngle={positive.length > 1 ? 1.5 : 0}
            isAnimationActive
            animationDuration={duration}
            animationEasing="ease-out"
          >
            {positive.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip format={format} total={total} />} />
        </PieChart>
      </ResponsiveContainer>
    )
    picture = (
      <>
        {picture}
        {names}
      </>
    )
  } else if (total > 0 && kind === 'horizontal') {
    picture = (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={slices} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#eeeeee" horizontal={false} />
          <XAxis type="number" tick={tick} />
          <YAxis type="category" dataKey="name" width={210} tick={{ fill: '#141414', fontSize: 11 }} />
          <Tooltip content={<ChartTip format={format} total={total} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={duration} animationEasing="ease-out">
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  } else if (total > 0 && kind === 'line') {
    picture = (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={slices} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eeeeee" vertical={false} />
          <XAxis dataKey="name" tick={false} height={8} />
          <YAxis tick={tick} width={48} />
          <Tooltip content={<ChartTip format={format} total={total} />} />
          <Line type="monotone" dataKey="value" stroke="#141414" strokeWidth={2} dot={{ r: 4, fill: '#141414' }} isAnimationActive animationDuration={duration} animationEasing="ease-out" />
        </LineChart>
      </ResponsiveContainer>
    )
  } else if (total > 0 && kind === 'area') {
    picture = (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={slices} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eeeeee" vertical={false} />
          <XAxis dataKey="name" tick={false} height={8} />
          <YAxis tick={tick} width={48} />
          <Tooltip content={<ChartTip format={format} total={total} />} />
          <Area type="monotone" dataKey="value" stroke="#141414" fill="#141414" fillOpacity={0.12} strokeWidth={2} isAnimationActive animationDuration={duration} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    )
  } else if (total > 0) {
    picture = (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={slices} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#eeeeee" vertical={false} />
          <XAxis dataKey="name" tick={false} height={8} />
          <YAxis tick={tick} width={48} />
          <Tooltip content={<ChartTip format={format} total={total} />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={duration} animationEasing="ease-out">
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <section className="analytics-card">
      <div className="analytics-card-head">
        <h2>{title}</h2>
        <label>
          Вид
          <select value={kind} onChange={(event) => setKind(event.target.value as ChartKind)} aria-label={`Вид графика «${title}»`}>
            {kinds.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div key={kind} className="analytics-chart-body">
        {picture}
        {total > 0 && kind !== 'pie' && kind !== 'donut' ? names : null}
      </div>
    </section>
  )
}
