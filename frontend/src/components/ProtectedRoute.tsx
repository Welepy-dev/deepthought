import { Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { refreshToken } from '../api/refresh'

interface TokenPayload {
  exp: number
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canAccess, setCanAccess] = useState<boolean | null>(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setCanAccess(false)
        return
      }

      try {
        const decoded = jwtDecode<TokenPayload>(token)

        if (decoded.exp * 1000 >= Date.now()) {
          setCanAccess(true)
          return
        }

        setIsRefreshing(true)
        const refreshed = await refreshToken()
        setCanAccess(refreshed)
      } catch {
        localStorage.removeItem('token')
        setCanAccess(false)
      } finally {
        setIsRefreshing(false)
      }
    }

    validateToken()
  }, [token])

  if (canAccess === null || isRefreshing) {
    return null
  }

  if (!canAccess) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
