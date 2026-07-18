import { API_BASE_URL } from '../config/api'

export async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) return false

  
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  const data = await response.json()

  if (response.ok) {
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return true
  }

  return false
}
