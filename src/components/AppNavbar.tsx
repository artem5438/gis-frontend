import { useState } from 'react'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AppNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [expanded, setExpanded] = useState(false)

  const leave = async () => {
    setExpanded(false)
    await auth.logout()
    navigate('/')
  }

  const go = (path: string) => {
    setExpanded(false)
    navigate(path)
  }

  return (
    <Navbar
      expand="lg"
      sticky="top"
      expanded={expanded}
      onToggle={setExpanded}
      className="gis-navbar"
    >
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand onClick={() => go('/')} style={{ cursor: 'pointer' }}>
          Норильск
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" aria-label="Открыть меню" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-lg-center gis-navbar-links">
            <button
              type="button"
              className={`gis-nav-btn${location.pathname === '/' ? ' active' : ''}`}
              onClick={() => go('/')}
            >
              Главная
            </button>
            <button
              type="button"
              className={`gis-nav-btn${location.pathname === '/map' ? ' active' : ''}`}
              onClick={() => go('/map')}
            >
              Карта
            </button>
            {auth.account ? (
              <>
                <button
                  type="button"
                  className={`gis-nav-btn${location.pathname === '/account' ? ' active' : ''}`}
                  onClick={() => go('/account')}
                >
                  {auth.account.full_name}
                </button>
                <button type="button" className="gis-nav-btn" onClick={() => void leave()}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`gis-nav-btn${location.pathname === '/login' ? ' active' : ''}`}
                  onClick={() => go('/login')}
                >
                  Войти
                </button>
                <button
                  type="button"
                  className={`gis-nav-btn${location.pathname === '/register' ? ' active' : ''}`}
                  onClick={() => go('/register')}
                >
                  Регистрация
                </button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
