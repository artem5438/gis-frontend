import type { ReportDocument, ReportLine, ReportSlice } from '../auth/api'

export type ChartKind = 'bar' | 'horizontal' | 'pie' | 'donut'

function field(line: ReportLine) {
  return (
    <div className="report-field" key={line.label}>
      <span>{line.label}</span>
      <strong>{line.value}</strong>
      {line.hint ? <small>{line.hint}</small> : null}
    </div>
  )
}

function pieStyle(slices: ReportSlice[]): string {
  const total = slices.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0) || 1
  let angle = 0
  const stops = slices.map((slice) => {
    const start = angle
    angle += (Math.max(slice.value, 0) / total) * 360
    return `${slice.color} ${start}deg ${angle}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

function ChartView({ title, kind, slices }: { title: string; kind: ChartKind; slices: ReportSlice[] }) {
  const max = Math.max(...slices.map((slice) => slice.value), 1)
  return (
    <figure className="report-chart">
      <figcaption>{title}</figcaption>
      {kind === 'pie' || kind === 'donut' ? (
        <div className="report-pie-row">
          <div className={kind === 'donut' ? 'report-pie report-pie--donut' : 'report-pie'} style={{ background: pieStyle(slices) }} />
          <ul>
            {slices.map((slice) => (
              <li key={slice.name}>
                <i style={{ background: slice.color }} />
                <span>{slice.name}</span>
                <b>{slice.value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</b>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {kind === 'bar' ? (
        <div className="report-columns">
          {slices.map((slice) => (
            <div key={slice.name}>
              <b>{slice.value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</b>
              <i style={{ height: `${Math.max(8, (slice.value / max) * 120)}px`, background: slice.color }} />
              <span>{slice.name}</span>
            </div>
          ))}
        </div>
      ) : null}
      {kind === 'horizontal' ? (
        <div className="report-rows">
          {slices.map((slice) => (
            <div key={slice.name}>
              <span>{slice.name}</span>
              <div>
                <i style={{ width: `${Math.max(2, (slice.value / max) * 100)}%`, background: slice.color }} />
              </div>
              <b>{slice.value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</b>
            </div>
          ))}
        </div>
      ) : null}
    </figure>
  )
}

export default function ReportSheet({
  doc,
  score,
  quarter,
  charts,
  kinds,
}: {
  doc: ReportDocument
  score: boolean
  quarter: boolean
  charts: boolean
  kinds: Record<string, ChartKind>
}) {
  return (
    <article className="report-sheet">
      <header className="report-sheet-head">
        <h2>{doc.title}</h2>
        <p className="report-sheet-number">{doc.number}</p>
        <p>Дата: {doc.formed_on}</p>
        <p>Сформировал: {doc.author.trim() || 'не указан'}</p>
      </header>
      <section>
        <h3>Паспорт</h3>
        {doc.passport.map(field)}
      </section>
      {score && doc.score ? (
        <section>
          <h3>{doc.score.title}</h3>
          {doc.score.note ? <p className="report-sheet-note">{doc.score.note}</p> : null}
          {(doc.score.lines ?? []).map(field)}
        </section>
      ) : null}
      {quarter && doc.quarter ? (
        <section>
          <h3>{doc.quarter.title}</h3>
          {doc.quarter.note ? <p className="report-sheet-note">{doc.quarter.note}</p> : null}
          {(doc.quarter.lines ?? []).map(field)}
          {charts
            ? (doc.charts ?? [])
                .filter((chart) => chart.slices.length > 0)
                .map((chart) => (
                  <ChartView key={chart.title} title={chart.title} kind={kinds[chart.title] ?? (chart.kind as ChartKind) ?? 'bar'} slices={chart.slices} />
                ))
            : null}
        </section>
      ) : null}
    </article>
  )
}
