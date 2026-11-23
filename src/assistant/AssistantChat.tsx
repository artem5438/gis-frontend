import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { askAssistant } from '../auth/api'
import { useAuth } from '../auth/AuthContext'

type ChatLine = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type ChatValue = {
  lines: ChatLine[]
  pending: boolean
  send: (text: string) => Promise<void>
}

const ChatContext = createContext<ChatValue | null>(null)

function useChat(): ChatValue {
  const value = useContext(ChatContext)
  if (!value) throw new Error('диалог ассистента не подключён')
  return value
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<ChatLine[]>([])
  const [pending, setPending] = useState(false)

  const send = async (text: string) => {
    const message = text.trim()
    if (!message || pending) return
    setLines((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: message }])
    setPending(true)
    try {
      const answer = await askAssistant(message)
      setLines((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: answer }])
    } catch (error) {
      const note = error instanceof Error ? error.message : 'Модель не ответила'
      setLines((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: note }])
    } finally {
      setPending(false)
    }
  }

  return <ChatContext.Provider value={{ lines, pending, send }}>{children}</ChatContext.Provider>
}

function greeting(fullName: string | undefined): string {
  const name = fullName?.trim()
  if (name) {
    return `Здравствуйте, ${name}. Спросите про балл участка или про правила в документах. Если в текстах ответа нет, я так и скажу.`
  }
  return 'Здравствуйте. Спросите про балл участка или про правила в документах. Если в текстах ответа нет, я так и скажу.'
}

export function AssistantDialog({ tall, onDragStart, onClose }: { tall?: boolean; onDragStart?: (event: ReactPointerEvent) => void; onClose?: () => void }) {
  const auth = useAuth()
  const chat = useChat()
  const [draft, setDraft] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  const welcome = greeting(auth.account?.full_name)
  const thread = [{ id: 'welcome', role: 'assistant' as const, text: welcome }, ...chat.lines]

  useEffect(() => {
    const node = threadRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [thread.length, chat.pending])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = draft
    setDraft('')
    void chat.send(message)
  }

  return (
    <section className={tall ? 'assistant-dialog assistant-dialog--tall' : 'assistant-dialog'} aria-label="Диалог с ассистентом">
      <header
        className={onDragStart ? 'assistant-dialog-head assistant-dialog-head--drag' : 'assistant-dialog-head'}
        onPointerDown={onDragStart}
      >
        <span className="assistant-presence" aria-hidden="true" />
        <strong>Ассистент</strong>
        <span className="assistant-online">в сети</span>
        {onClose ? (
          <button type="button" className="assistant-close" aria-label="Закрыть" onPointerDown={(event) => event.stopPropagation()} onClick={onClose}>
            ×
          </button>
        ) : null}
      </header>
      <div className="assistant-thread" ref={threadRef}>
        {thread.map((line) => (
          <p key={line.id} className={line.role === 'user' ? 'assistant-bubble assistant-bubble--user' : 'assistant-bubble'}>
            {line.text}
          </p>
        ))}
        {chat.pending ? <p className="assistant-bubble assistant-bubble--wait">Смотрю документы.</p> : null}
      </div>
      <form className="assistant-compose" onSubmit={submit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Введите сообщение"
          aria-label="Сообщение ассистенту"
          disabled={chat.pending}
        />
        <button type="submit" disabled={chat.pending || draft.trim() === ''} aria-label="Отправить">
          ↑
        </button>
      </form>
    </section>
  )
}

type FloatBox = { x: number; y: number; w: number; h: number }

function cornerBox(): FloatBox {
  const w = 360
  const h = 460
  return {
    x: Math.max(12, window.innerWidth - w - 28),
    y: Math.max(76, window.innerHeight - h - 28),
    w,
    h,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function AssistantDock() {
  const [open, setOpen] = useState(false)
  const [box, setBox] = useState<FloatBox>(cornerBox)
  const drag = useRef<{ kind: 'move' | 'resize'; x: number; y: number; box: FloatBox } | null>(null)

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const active = drag.current
      if (!active) return
      const dx = event.clientX - active.x
      const dy = event.clientY - active.y
      if (active.kind === 'move') {
        setBox({
          ...active.box,
          x: clamp(active.box.x + dx, 8, window.innerWidth - 120),
          y: clamp(active.box.y + dy, 8, window.innerHeight - 64),
        })
        return
      }
      setBox({
        ...active.box,
        w: clamp(active.box.w + dx, 280, window.innerWidth - active.box.x - 8),
        h: clamp(active.box.h + dy, 320, window.innerHeight - active.box.y - 8),
      })
    }
    const stop = () => {
      drag.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
  }, [])

  const startDrag = (kind: 'move' | 'resize') => (event: ReactPointerEvent) => {
    if (event.button !== 0) return
    event.preventDefault()
    drag.current = { kind, x: event.clientX, y: event.clientY, box }
  }

  return (
    <>
      {open ? (
        <div className="assistant-float" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
          <AssistantDialog onDragStart={startDrag('move')} onClose={() => setOpen(false)} />
          <button type="button" className="assistant-resize" aria-label="Изменить размер" onPointerDown={startDrag('resize')} />
        </div>
      ) : null}
      <div className="assistant-dock">
        <button type="button" className="assistant-dock-toggle" onClick={() => setOpen((current) => !current)}>
          {open ? 'Закрыть' : 'Ассистент'}
        </button>
      </div>
    </>
  )
}
