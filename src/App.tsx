import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AssistantProvider } from './assistant/AssistantChat'
import AppNavbar from './components/AppNavbar'
import AccountPage from './pages/AccountPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AssistantPage from './pages/AssistantPage'
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
  const shown = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register'
  if (!shown) return null
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-title">ГИС оценки инвестиционного потенциала Норильска</p>
        <dl className="site-footer-contacts">
          <div>
            <dt>Телефон</dt>
            <dd>+7 (3919) 00-00-00</dd>
          </div>
          <div>
            <dt>Почта</dt>
            <dd>info@example.ru</dd>
          </div>
          <div>
            <dt>Город</dt>
            <dd>Норильск</dd>
          </div>
        </dl>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <AppNavbar />
      <PendingNotice />
      <AssistantProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AssistantProvider>
      <SiteFooter />
    </div>
  )
}
