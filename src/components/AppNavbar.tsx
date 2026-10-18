import { useState } from 'react'
import { Container, Nav, Navbar } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'

export default function AppNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
