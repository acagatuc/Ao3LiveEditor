const API_URL = import.meta.env.VITE_API_URL

export interface CreatePreviewParams {
  html: string
  css: string
  title?: string
  author?: string
}

export interface PreviewResponse {
  id: string
  expiresAt: string
}

export interface GetPreviewResponse {
  html: string
  css: string
  title: string
  author: string
  createdAt: string
  expiresAt: string
}

export async function createPreview(params: CreatePreviewParams): Promise<PreviewResponse> {
  const response = await fetch(`${API_URL}/previews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error(`Failed to create preview: ${response.status}`)
  return response.json() as Promise<PreviewResponse>
}

export async function getPreview(id: string): Promise<GetPreviewResponse> {
  const response = await fetch(`${API_URL}/previews/${id}`)
  if (!response.ok) throw new Error(`Failed to get preview: ${response.status}`)
  return response.json() as Promise<GetPreviewResponse>
}
