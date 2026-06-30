import { apiFetch } from './apiClient'
import { API_BASE_URL } from '../config/api'

export interface ProjectCatalogItem {
  id: string
  name: string
  slug: string
}

export async function fetchProjectCatalog(): Promise<ProjectCatalogItem[]> {
  const response = await apiFetch(`${API_BASE_URL}/projects/catalog`)
  if (!response.ok) throw new Error('Failed to fetch project catalog')
  return response.json()
}
