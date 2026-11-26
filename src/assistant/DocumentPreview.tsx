import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { assistantDocumentFile, type AssistantSource } from '../auth/api'

const closeMs = 360

type View =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'pdf'; url: string }
  | { kind: 'text'; text: string }
  | { kind: 'table'; rows: string[][] }

function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  return new TextDecoder('utf-8').decode(bytes.subarray(start))
}

function parseCSV(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0] ?? ''
  const comma = (first.match(/;/g) ?? []).length > (first.match(/,/g) ?? []).length ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === comma) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((item) => item.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  row.push(field)
  if (row.some((item) => item.trim() !== '')) rows.push(row)
  return rows
}

export default function DocumentPreview({ target, onClose }: { target: AssistantSource; onClose: () => void }) {
  const [out, setOut] = useState(false)
  const [view, setView] = useState<View>({ kind: 'loading' })
  const closing = useRef(false)
  const timer = useRef(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onCloseRef.current()
      return
    }
    setOut(true)
    timer.current = window.setTimeout(() => onCloseRef.current(), closeMs)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      requestClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey, true)
    }
  }, [requestClose])

  useEffect(() => {
    let alive = true
    let url = ''
    const plain = target.kind === 'docx' || target.kind === 'xlsx'
    assistantDocumentFile(target.id, plain)
      .then(({ extension, buffer }) => {
        if (!alive) return
        const kind = extension || target.kind
        if (kind === 'pdf') {
          url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
          setView({ kind: 'pdf', url })
          return
        }
        const text = decodeText(buffer)
        if (kind === 'csv') {
          const rows = parseCSV(text)
          setView(rows.length > 0 ? { kind: 'table', rows } : { kind: 'text', text })
          return
        }
        setView({ kind: 'text', text })
      })
      .catch((err: unknown) => {
        if (!alive) return
        setView({ kind: 'error', message: err instanceof Error ? err.message : 'Документ не открылся' })
      })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [target])

  return createPortal(
    <div className={out ? 'place-overlay doc-preview-overlay place-overlay--out' : 'place-overlay doc-preview-overlay'} onClick={requestClose}>
      <section
        className={out ? 'doc-preview place-dialog--out' : 'doc-preview'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="doc-preview-head">
          <h2 id="doc-preview-title">{target.title}</h2>
          <button ref={closeRef} type="button" className="files-dialog-close" onClick={requestClose}>
            Закрыть
          </button>
        </header>
        <div className="doc-preview-body">
          {view.kind === 'loading' ? <p className="doc-preview-note">Открываю документ…</p> : null}
          {view.kind === 'error' ? <p className="doc-preview-note">{view.message}</p> : null}
          {view.kind === 'pdf' ? <iframe className="doc-preview-frame" title={target.title} src={view.url} /> : null}
          {view.kind === 'text' ? <pre className="doc-preview-sheet">{view.text}</pre> : null}
          {view.kind === 'table' ? (
            <table className="doc-preview-table">
              <tbody>
                {view.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) =>
                      rowIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  )
}
