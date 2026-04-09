import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BoardPage from './pages/BoardPage'
import SharedPlayRoute from './pages/SharedPlayRoute'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/share" element={<SharedPlayRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
