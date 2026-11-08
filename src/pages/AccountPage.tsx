import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'
import { statusLabel } from '../auth/api'
import { useAuth } from '../auth/AuthContext'

export default function AccountPage() {
  const auth = useAuth()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [source, setSource] = useState<boolean | null>(null)
  const [sourceError, setSourceError] = useState('')
  const [sourcePending, setSourcePending] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!auth.ready) return <main className="auth-page" />
  if (!auth.account) return <Navigate to="/login" replace />

  const account = auth.account
  const fromDatabase = source ?? account.from_database !== false
  const waiting = auth.request?.decision === 'pending'
  const rejected = auth.request?.decision === 'rejected'
  const canApply = !account.role && !waiting
  const sourceChanged = fromDatabase !== (account.from_database !== false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await auth.apply(text)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку')
    } finally {
      setPending(false)
    }
  }

  const saveSource = async () => {
    setSourceError('')
    setSaved(false)
    setSourcePending(true)
    try {
      await auth.saveSource(fromDatabase)
      setSource(null)
      setSaved(true)
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : 'Не удалось сохранить переключатель')
    } finally {
      setSourcePending(false)
    }
  }

  const facts = [
    ['ФИО', account.full_name, 'Имя указано при регистрации.'],
    ['Логин', account.login, 'По нему выполняется вход.'],
    ['Статус проверки', statusLabel(account.verification_status), 'Проверенный человек видит кадастровую карту.'],
    ['Роль', account.role ? account.role.name : 'не назначена', 'Роль назначает модератор.'],
  ]

  return (
    <main className="auth-page">
      <section className="auth-card profile-card">
        <h1>Настройки профиля</h1>
        <p className="auth-note">Данные учётной записи</p>
        <div className="profile-rows">
          {facts.map(([label, value, note]) => (
            <div className="profile-row" key={label}>
              <div>
                <div className="profile-label">{label}</div>
                <div className="profile-value">{value}</div>
                <p>{note}</p>
              </div>
            </div>
          ))}
          <div className="profile-row">
            <div>
              <div className="profile-label">Хотите получать информацию из нашей базы данных?</div>
              <p>Включённый переключатель открывает карточку сохранённого участка. Выключенный спрашивает официальную карту.</p>
            </div>
            <button
              type="button"
              className={fromDatabase ? 'source-switch on' : 'source-switch'}
              role="switch"
              aria-checked={fromDatabase}
              aria-label="Получать информацию из нашей базы данных"
              onClick={() => {
                setSaved(false)
                setSource(!fromDatabase)
              }}
            >
              <span />
            </button>
          </div>
        </div>
        {sourceError ? <Alert variant="danger">{sourceError}</Alert> : null}
        {saved ? <p className="auth-note">Сохранено.</p> : null}
        <div className="profile-save">
          <Button type="button" className="auth-submit" disabled={!sourceChanged || sourcePending} onClick={saveSource}>
            Сохранить изменения
          </Button>
        </div>
        {waiting ? (
          <p className="auth-note">Заявка отправлена. Сайт можно смотреть дальше, решение появится после проверки.</p>
        ) : null}
        {canApply ? (
          <Form onSubmit={submit} className="role-request">
            {rejected ? <p className="auth-note">Прошлая заявка отклонена. Можно отправить новую.</p> : null}
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <Form.Group className="mb-3" controlId="role-request">
              <Form.Label>Зачем нужна роль</Form.Label>
              <Form.Control as="textarea" rows={4} value={text} onChange={(event) => setText(event.target.value)} required />
            </Form.Group>
            <Button type="submit" className="auth-submit" disabled={pending}>
              Отправить заявку
            </Button>
          </Form>
        ) : null}
      </section>
    </main>
  )
}
