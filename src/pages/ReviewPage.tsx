import { useEffect, useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Navigate } from 'react-router-dom'
import { decideApplication, reviewQueue, type ReviewQueue } from '../auth/api'
import { useAuth } from '../auth/AuthContext'

export default function ReviewPage() {
  const auth = useAuth()
  const [queue, setQueue] = useState<ReviewQueue | null>(null)
  const [rolesById, setRolesById] = useState<Record<number, string>>({})
  const [error, setError] = useState('')

  const load = () => {
    reviewQueue()
      .then((next) => {
        setQueue(next)
        setError('')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Не удалось открыть очередь')
      })
  }

  useEffect(() => {
    if (auth.account?.role?.code === 'moderator') load()
  }, [auth.account])

  if (!auth.ready) return <main className="auth-page" />
  if (!auth.account) return <Navigate to="/login" replace />
  if (auth.account.role?.code !== 'moderator') return <Navigate to="/" replace />

  const decide = async (id: number, decision: 'approved' | 'rejected') => {
    setError('')
    try {
      await decideApplication(id, decision, rolesById[id] ?? queue?.roles[0]?.code)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить решение')
    }
  }

  return (
    <main className="review-page">
      <h1>Заявки</h1>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {queue && queue.applications.length === 0 ? <p>Новых заявок нет.</p> : null}
      {queue?.applications.map((application) => (
        <article key={application.id} className="review-card">
          <p className="review-person">
            {application.full_name} · {application.login}
          </p>
          <p>{application.body}</p>
          <Form.Select
            aria-label="Роль"
            value={rolesById[application.id] ?? queue.roles[0]?.code ?? ''}
            onChange={(event) => setRolesById((current) => ({ ...current, [application.id]: event.target.value }))}
          >
            {queue.roles.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name}
              </option>
            ))}
          </Form.Select>
          <div className="review-actions">
            <Button className="auth-submit" onClick={() => void decide(application.id, 'approved')}>
              Назначить роль
            </Button>
            <Button variant="outline-secondary" onClick={() => void decide(application.id, 'rejected')}>
              Отклонить
            </Button>
          </div>
        </article>
      ))}
    </main>
  )
}