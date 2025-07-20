import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const nav = useNavigate()

  function login({ username, password }) {
    if (username === 'admin' && password === 'adminpass') {
      setUser({ username, role: 'admin' })
      nav('/admin')
    } else if (username === 'user' && password === 'pass') {
      setUser({ username, role: 'user' })
      nav('/')
    } else {
      alert('Invalid credentials')
    }
  }

  function logout() {
    setUser(null)
    nav('/login')
  }

  // ✅ Add this block to auto-login as admin for now
  useEffect(() => {
    const mockUser = { username: 'melisa-dev', role: 'admin' }
    setUser(mockUser)
    nav('/admin')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
