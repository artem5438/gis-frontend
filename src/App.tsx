import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppNavbar from './components/AppNavbar'
import AccountPage from './pages/AccountPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import RegisterPage from './pages/RegisterPage'
import ReviewPage from './pages/ReviewPage'
import { useAuth } from './auth/AuthContext'

function PendingNotice() {
  const auth = useAuth()
  if (auth.request?.decision !== 'pending') return null
  return (
    <div className="pending-notice" role="status">
      Заявка на рассмотрении. Дождитесь решения модератора. Сайт по-прежнему доступен.
    </div>
  )
}

function SiteFooter() {
  const location = useLocation()
  if (location.pathname === '/map') return null
  return (
    <footer className="site-footer">
      <p>ГИС инвестиционного потенциала Норильска</p>
      <p>Центральный район, Талнах, Кайеркан и Оганер.</p>
    </footer>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <AppNavbar />
      <PendingNotice />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SiteFooter />
    </div>
  )
}
