import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadReport, myReports, openReport, type SavedReport } from '../auth/api'
import ReportSheet from './ReportSheet'

const closeMs = 360

function when(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ru-RU')
}

export default function MyReports() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [out, setOut] = useState(false)
  const [rows, setRows] = useState<SavedReport[] | null>(null)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState<SavedReport | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const timer = useRef(0)

  const load = useCallback(() => {
    myReports()
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Список отчётов не открылся'))
  }, [])

  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setOpen(false)
      setOpened(null)
      closing.current = false
      return
    }
    setOut(true)
    timer.current = window.setTimeout(() => {
      setOpen(false)
      setOut(false)
      setOpened(null)
      closing.current = false
    }, closeMs)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return
    load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (opened) {
        setOpened(null)
        return
      }
      requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, opened, requestClose])

  const show = async (id: number) => {
    setError('')
    try {
      setOpened(await openReport(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Отчёт не открылся')
    }
  }

  const download = async (row: SavedReport) => {
    setError('')
    try {
      await downloadReport(row.id, `otchet-${row.number.replaceAll(':', '-')}.${row.format}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Файл не скачался')
    }
  }

  return (
    <div className="profile-row">
      <div>
        <div className="profile-label">Мои отчёты</div>
        <p>Сохранённые отчёты по участкам.</p>
      </div>
      <button type="button" className="profile-docs-open" onClick={() => setOpen(true)}>
        Открыть
      </button>
      {open ? (
        <div className={out ? 'place-overlay place-overlay--out' : 'place-overlay'} onClick={requestClose}>
          <section
            className={out ? 'files-dialog place-dialog--out' : 'files-dialog'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-reports-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="files-dialog-head">
              <div>
                <h2 id="my-reports-title">Мои отчёты</h2>
                <p>Можно открыть, скачать или снова изменить состав.</p>
              </div>
              <button ref={closeRef} type="button" className="files-dialog-close" onClick={requestClose}>
                Закрыть
              </button>
            </header>
            {error ? <p className="report-error">{error}</p> : null}
            {opened?.body ? (
              <div className="my-reports-view">
                <button type="button" className="files-dialog-close" onClick={() => setOpened(null)}>
                  К списку
                </button>
                <ReportSheet
                  doc={opened.body}
                  score={opened.score}
                  quarter={opened.quarter}
                  charts={opened.charts}
                  kinds={Object.fromEntries((opened.body.charts ?? []).map((chart) => [chart.title, chart.kind === 'horizontal' || chart.kind === 'pie' || chart.kind === 'donut' || chart.kind === 'bar' ? chart.kind : 'bar']))}
                />
              </div>
            ) : (
              <div className="files-dialog-list">
                {rows === null ? null : rows.length === 0 ? (
                  <p className="profile-doc-empty">Сохранённых отчётов пока нет.</p>
                ) : (
                  rows.map((row) => (
                    <article className="profile-doc" key={row.id}>
                      <div>
                        <div className="profile-value">{row.number}</div>
                        <p>{row.format.toUpperCase()} · {when(row.created_at)}</p>
                      </div>
                      <div className="profile-doc-actions">
                        <button type="button" onClick={() => void show(row.id)}>Просмотр</button>
                        <button type="button" onClick={() => navigate(`/report?report=${row.id}`)}>Редактировать</button>
                        <button type="button" onClick={() => void download(row)}>Скачать</button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
