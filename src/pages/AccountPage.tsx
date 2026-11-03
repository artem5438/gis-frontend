import { Navigate } from 'react-router-dom'
import { statusLabel } from '../auth/api'
import { useAuth } from '../auth/AuthContext'

export default function AccountPage() {
  const auth = useAuth()
  if (!auth.ready) return <main className="auth-page" />
  if (!auth.account) return <Navigate to="/login" replace />

  const account = auth.account
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
      </section>
    </main>
  )
}
