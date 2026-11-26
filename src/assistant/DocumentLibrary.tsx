import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import {
  assistantDocuments,
  deleteAssistantDocument,
  renameAssistantDocument,
  uploadAssistantDocument,
  type AssistantDocument,
  type AssistantSource,
} from '../auth/api'
import DocumentPreview from './DocumentPreview'

const accept = '.txt,.md,.docx,.pdf,.xlsx,.csv'
const maxBytes = 50 * 1024 * 1024
const closeMs = 360

function when(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ru-RU')
}

export default function DocumentLibrary() {
  const [open, setOpen] = useState(false)
  const [out, setOut] = useState(false)
  const [documents, setDocuments] = useState<AssistantDocument[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'upload' | 'edit' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [confirming, setConfirming] = useState<number | null>(null)
  const [preview, setPreview] = useState<AssistantSource | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const timer = useRef(0)

  const load = async () => {
    const next = await assistantDocuments()
    setDocuments(next)
  }

  const requestClose = useCallback(() => {
    if (closing.current || busy !== null) return
    closing.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setOpen(false)
      closing.current = false
      return
    }
    setOut(true)
    timer.current = window.setTimeout(() => {
      setOpen(false)
      setOut(false)
      closing.current = false
    }, closeMs)
  }, [busy])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return
    let alive = true
    assistantDocuments()
      .then((next) => {
        if (alive) setDocuments(next)
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Список документов не открылся')
      })
    return () => {
      alive = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, requestClose])

  const upload = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!file) {
      setError('Выберите файл')
      return
    }
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!accept.split(',').includes(extension)) {
      setError('Нужен файл txt, md, docx, pdf, xlsx или csv')
      return
    }
    if (file.size > maxBytes) {
      setError('Файл больше 50 МБ')
      return
    }
    setBusy('upload')
    try {
      await uploadAssistantDocument(file)
      setFile(null)
      setInputKey((value) => value + 1)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Файл не загрузился')
    } finally {
      setBusy(null)
    }
  }

  const rename = async (id: number) => {
    setError('')
    setBusy('edit')
    try {
      await renameAssistantDocument(id, draft)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Название не сохранилось')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: number) => {
    setError('')
    setBusy('edit')
    try {
      await deleteAssistantDocument(id)
      setConfirming(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Документ не удалился')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="profile-row">
      <div>
        <div className="profile-label">Документы ассистента</div>
        <p>Общий список файлов для ответов.</p>
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
            aria-labelledby="assistant-files-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="files-dialog-head">
              <div>
                <h2 id="assistant-files-title">Документы ассистента</h2>
                <p>txt, md, docx, pdf, xlsx и csv, до 50 МБ. Большой файл может читаться несколько минут.</p>
              </div>
              <button ref={closeRef} type="button" className="files-dialog-close" onClick={requestClose} disabled={busy !== null}>
                Закрыть
              </button>
            </header>
            <Form onSubmit={(event) => void upload(event)} className="profile-doc-upload">
              {error ? <Alert variant="danger">{error}</Alert> : null}
              <Form.Control
                key={inputKey}
                type="file"
                accept={accept}
                disabled={busy !== null}
                onChange={(event) => {
                  const target = event.target as HTMLInputElement
                  setFile(target.files?.[0] ?? null)
                  setError('')
                }}
              />
              <Button type="submit" className="auth-submit" disabled={busy !== null || !file}>
                {busy === 'upload' ? 'Читаю файл' : 'Загрузить'}
              </Button>
            </Form>
            <div className="files-dialog-list">
              {documents === null ? null : documents.length === 0 ? (
                <p className="profile-doc-empty">Документов пока нет.</p>
              ) : (
                documents.map((document) => (
                  <article className="profile-doc" key={document.id}>
                    <div>
                      {editing === document.id ? (
                        <input
                          className="profile-doc-title"
                          value={draft}
                          maxLength={200}
                          onChange={(event) => setDraft(event.target.value)}
                        />
                      ) : (
                        <div className="profile-value">{document.title}</div>
                      )}
                      <p>
                        {document.author?.trim() ? document.author : 'не указан'}
                        {when(document.created_at) ? ` · ${when(document.created_at)}` : ''}
                      </p>
                    </div>
                    <div className="profile-doc-actions">
                      <button
                        type="button"
                        onClick={() => setPreview({ id: document.id, title: document.title, kind: document.kind })}
                      >
                        Просмотр
                      </button>
                      {document.can_edit ? (
                        <>
                        {editing === document.id ? (
                          <>
                            <button type="button" disabled={busy !== null} onClick={() => void rename(document.id)}>
                              Сохранить
                            </button>
                            <button type="button" disabled={busy !== null} onClick={() => setEditing(null)}>
                              Отмена
                            </button>
                          </>
                        ) : confirming === document.id ? (
                          <>
                            <button type="button" disabled={busy !== null} onClick={() => void remove(document.id)}>
                              Подтвердить
                            </button>
                            <button type="button" disabled={busy !== null} onClick={() => setConfirming(null)}>
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => {
                                setConfirming(null)
                                setEditing(document.id)
                                setDraft(document.title)
                              }}
                            >
                              Переименовать
                            </button>
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => {
                                setEditing(null)
                                setConfirming(document.id)
                              }}
                            >
                              Удалить
                            </button>
                          </>
                        )}
                        </>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
      {preview ? <DocumentPreview target={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  )
}
