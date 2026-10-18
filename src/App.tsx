import { Navigate, Route, Routes } from 'react-router-dom'
import AppNavbar from './components/AppNavbar'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'

export default function App() {
  return (
    <div className="app-shell">
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
