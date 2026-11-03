import { Navigate, Route, Routes } from 'react-router-dom'
import AppNavbar from './components/AppNavbar'
import AccountPage from './pages/AccountPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <div className="app-shell">
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
