import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { downloadReport, openReport, reportDraft, saveReport, type ReportDocument } from '../auth/api'
import { useAuth } from '../auth/AuthContext'
import ReportSheet, { type ChartKind } from '../reports/ReportSheet'

const chartKinds: { id: ChartKind; label: string }[] = [
  { id: 'bar', label: 'Столбцы' },
  { id: 'horizontal', label: 'Горизонтальные столбцы' },
  { id: 'pie', label: 'Круг' },
  { id: 'donut', label: 'Кольцо' },
]

function kindsOf(doc: ReportDocument): Record<string, ChartKind> {
  const kinds: Record<string, ChartKind> = {}
  for (const chart of doc.charts ?? []) {
    const kind = chart.kind
    kinds[chart.title] = kind === 'bar' || kind === 'horizontal' || kind === 'pie' || kind === 'donut' ? kind : 'bar'
  }
  return kinds
}

export default function ReportPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const parcel = params.get('parcel') ?? ''
  const number = params.get('number') ?? ''
  const report = params.get('report') ?? ''
  const [parcelId, setParcelId] = useState(0)
  const [reportId, setReportId] = useState(0)
  const [doc, setDoc] = useState<ReportDocument | null>(null)
  const [error, setError] = useState('')
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf')
  const [score, setScore] = useState(true)
  const [quarter, setQuarter] = useState(true)
  const [charts, setCharts] = useState(false)
  const [kinds, setKinds] = useState<Record<string, ChartKind>>({})
  const [savedId, setSavedId] = useState<number | null>(null)
  const [pending, setPending] = useState(false)
  const [leaveAsk, setLeaveAsk] = useState(false)

  useEffect(() => {
    if (!auth.account) return
    let alive = true
    const load = report
      ? openReport(Number(report)).then((saved) => {
          if (!alive || !saved.body) return
          setReportId(saved.id)
          setDoc(saved.body)
          setFormat(saved.format)
          setScore(saved.score)
          setQuarter(saved.quarter)
          setCharts(saved.charts)
          setKinds(kindsOf(saved.body))
          setSavedId(saved.id)
        })
      : reportDraft(parcel ? { parcel } : { number }).then((draft) => {
          if (!alive) return
          setParcelId(draft.parcel_id)
          setDoc(draft.body)
          setKinds(kindsOf(draft.body))
        })
    load.catch((err: unknown) => {
      if (alive) setError(err instanceof Error ? err.message : 'Отчёт не собрался')
    })
    return () => {
      alive = false
    }
  }, [auth.account, parcel, number, report])

  if (!auth.ready) return <main className="report-page" />
  if (!auth.account) return <Navigate to="/login" replace />

  const dirty = () => setSavedId(null)

  const save = async () => {
    if (!doc) return
    setError('')
    setPending(true)
    try {
      const saved = await saveReport({
        id: reportId || undefined,
        parcel_id: parcelId,
        format,
        score,
        quarter,
        charts: quarter && charts,
        chart_kinds: kinds,
      })
      setReportId(saved.id)
      setSavedId(saved.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Отчёт не сохранился')
    } finally {
      setPending(false)
    }
  }

  const download = async () => {
    if (savedId === null || !doc) return
    setError('')
    try {
      await downloadReport(savedId, `otchet-${doc.number.replaceAll(':', '-')}.${format}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Файл не скачался')
    }
  }

  const leave = () => {
    if (savedId === null) {
      setLeaveAsk(true)
      return
    }
    navigate(-1)
  }

  const chartList = (doc?.charts ?? []).filter((chart) => chart.slices.length > 0)

  return (
    <main className="report-page">
      <header className="report-page-head">
        <div>
          <h1>Редактор отчёта</h1>
          <p>{doc ? doc.number : 'Собираем отчёт…'}</p>
        </div>
        <button type="button" className="report-leave" onClick={leave}>Выйти</button>
      </header>
      {error ? <p className="report-error">{error}</p> : null}
      {doc ? (
        <div className="report-editor">
          <aside className="report-menu-side">
            <p>Формат</p>
            <div className="report-format" role="group" aria-label="Формат отчёта">
              <button type="button" className={format === 'pdf' ? 'active' : ''} onClick={() => { dirty(); setFormat('pdf') }}>PDF</button>
              <button type="button" className={format === 'docx' ? 'active' : ''} onClick={() => { dirty(); setFormat('docx') }}>DOCX</button>
            </div>
            <p>В отчёте</p>
            <label><input type="checkbox" checked disabled /> Шапка</label>
            <label><input type="checkbox" checked disabled /> Паспорт</label>
            <label>
              <input type="checkbox" checked={score} onChange={(event) => { dirty(); setScore(event.target.checked) }} />
              Балл
            </label>
            <label>
              <input type="checkbox" checked={quarter} onChange={(event) => { dirty(); setQuarter(event.target.checked); if (!event.target.checked) setCharts(false) }} />
              Квартал
            </label>
            {quarter ? (
              <label className="report-menu-charts">
                <input type="checkbox" checked={charts} onChange={(event) => { dirty(); setCharts(event.target.checked) }} />
                Графики квартала
              </label>
            ) : null}
            {quarter && charts
              ? chartList.map((chart) => (
                  <label className="report-kind" key={chart.title}>
                    {chart.title}
                    <select
                      value={kinds[chart.title] ?? 'bar'}
                      onChange={(event) => {
                        dirty()
                        setKinds((current) => ({ ...current, [chart.title]: event.target.value as ChartKind }))
                      }}
                    >
                      {chartKinds.map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                ))
              : null}
          </aside>
          <div className="report-preview">
            <ReportSheet doc={doc} score={score} quarter={quarter} charts={quarter && charts} kinds={kinds} />
          </div>
        </div>
      ) : null}
      <footer className="report-actions">
        <button type="button" disabled={!doc || pending || (reportId === 0 && parcelId === 0)} onClick={() => void save()}>
          Сохранить
        </button>
        <button type="button" disabled={savedId === null} onClick={() => void download()}>
          Скачать
        </button>
      </footer>
      {leaveAsk ? (
        <div className="place-overlay">
          <section className="report-leave-card" role="dialog" aria-modal="true" aria-labelledby="report-leave-title">
            <h2 id="report-leave-title">Отчёт не сохранён</h2>
            <p>Если выйти сейчас, выбранные разделы и формат не запишутся.</p>
            <div>
              <button type="button" onClick={() => setLeaveAsk(false)}>Остаться</button>
              <button type="button" onClick={() => navigate(-1)}>Выйти</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
