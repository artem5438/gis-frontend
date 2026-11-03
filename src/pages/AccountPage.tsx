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

  if (!auth.ready) return <main className="auth-page" />
  if (!auth.account) return <Navigate to="/login" replace />

  const account = auth.account
  const waiting = auth.request?.decision === 'pending'
  const rejected = auth.request?.decision === 'rejected'
  const canApply = !account.role && !waiting

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

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Кто вошёл</h1>
        <dl className="account-facts">
          <div>
            <dt>ФИО</dt>
            <dd>{account.full_name}</dd>
          </div>
          <div>
            <dt>Логин</dt>
            <dd>{account.login}</dd>
          </div>
          <div>
            <dt>Статус проверки</dt>
            <dd>{statusLabel(account.verification_status)}</dd>
          </div>
          <div>
            <dt>Роль</dt>
            <dd>{account.role ? account.role.name : 'не назначена'}</dd>
          </div>
        </dl>
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
