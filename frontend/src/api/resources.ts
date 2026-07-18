import { apiFetch } from './apiClient'
import { API_BASE_URL } from '../config/api'
import { refreshToken } from './refresh'

export type ResourceType = 'LINK' | 'PDF' | 'VIDEO' | 'ARTICLE' | 'GITHUB' | 'OTHER' | 'FILE'

export interface Resource {
  id: string
  title: string
  description: string | null
  url: string
  type: ResourceType
  originalName: string | null
  fileSize: number | null
  createdAt: string
  user: { id: string; login: string; displayName: string }
  project: { id: string; name: string; slug: string }
}

export interface CreateResourcePayload {
  title: string
  description?: string
  url: string
  type: ResourceType
  projectId: string
}

export type ResourceSortBy = 'createdAt' | 'title' | 'fileSize'
export type SortOrder = 'asc' | 'desc'

export async function fetchResources(
  projectId: string,
  sortBy?: ResourceSortBy,
  order?: SortOrder,
): Promise<Resource[]> {
  const params = new URLSearchParams({ projectId, limit: '50' })
  if (sortBy) params.set('sortBy', sortBy)
  if (order) params.set('order', order)
  const response = await apiFetch(`${API_BASE_URL}/resources?${params}`)
  if (!response.ok) throw new Error('Failed to fetch resources')
  const body = await response.json()
  return body.data ?? []
}

export async function createResource(payload: CreateResourcePayload): Promise<Resource> {
  const response = await apiFetch(`${API_BASE_URL}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).message ?? 'Failed to create resource')
  }
  return response.json()
}


function sendUpload(formData: FormData, token: string | null, onProgress?: (pct: number) => void) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/resources/upload`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      let body: any = {}
      try { body = JSON.parse(xhr.responseText) } catch {}
      resolve({ status: xhr.status, body })
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))

    xhr.send(formData)
  })
}

export async function uploadResourceWithProgress(
  formData: FormData,
  onProgress?: (pct: number) => void,
): Promise<Resource> {
  const token = localStorage.getItem('token')
  let { status, body } = await sendUpload(formData, token, onProgress)

  if (status === 401) {
    const ok = await refreshToken()
    if (!ok) throw new Error('Session expired, please log in again')
    ;({ status, body } = await sendUpload(formData, localStorage.getItem('token'), onProgress))
  }

  if (status < 200 || status >= 300) {
    throw new Error(body.message ?? 'Failed to upload resource')
  }
  return body
}

export async function deleteResource(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/resources/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).message ?? 'Failed to delete resource')
  }
}
