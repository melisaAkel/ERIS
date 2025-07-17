// src/pages/Login.jsx
import { useState } from 'react'
import { useAuth } from '../auth'
import './Login.css'   // ← import the new styles

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    login({ username, password })
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Sign In</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button type="submit">Log in</button>
        </form>
      </div>
    </div>
  )
}
