import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await auth.login(login, password)
      navigate('/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Вход</h1>
        <p className="auth-note">Вход выполняется по логину и паролю. Одинаковое ФИО у разных людей входу не мешает.</p>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="login-name">
            <Form.Label>Логин</Form.Label>
            <Form.Control value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="login-password">
            <Form.Label>Пароль</Form.Label>
            <Form.Control type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </Form.Group>
          <Button type="submit" className="auth-submit" disabled={pending}>
            Войти
          </Button>
        </Form>
        <p className="auth-switch">
          Нет учётной записи? <Link to="/register">Регистрация</Link>
        </p>
      </section>
    </main>
  )
}
