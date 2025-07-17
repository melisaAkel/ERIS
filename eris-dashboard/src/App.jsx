import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Login     from './pages/Login'
import MapPage   from './pages/MapPage'
import AdminPage from './pages/AdminPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MapPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
