import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

interface TokenPayload {
  exp: number
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/" replace />
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token)

    // exp vem em segundos
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return <Navigate to="/" replace />
    }
  } catch {
    localStorage.removeItem('token')
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}