import { useState, type FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RegisterPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await auth.register(fullName, login, password)
      navigate('/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Регистрация</h1>
        <p className="auth-note">После регистрации роль не назначается. Вы остаётесь посетителем, пока модератор не проверит заявку.</p>
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Form onSubmit={submit}>
          <Form.Group className="mb-3" controlId="register-name">
            <Form.Label>ФИО</Form.Label>
            <Form.Control value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="register-login">
            <Form.Label>Логин</Form.Label>
            <Form.Control value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="register-password">
            <Form.Label>Пароль</Form.Label>
            <Form.Control type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
          </Form.Group>
          <Button type="submit" className="auth-submit" disabled={pending}>
            Создать учётную запись
          </Button>
        </Form>
        <p className="auth-switch">
          Уже есть логин? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  )
}
