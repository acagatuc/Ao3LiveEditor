const API_URL = import.meta.env.VITE_API_URL

export type DraftPayloadType = 'html-css' | 'richtext'

export interface DraftPayload {
  payloadType: DraftPayloadType
  html: string
  css?: string
  title?: string
}

export interface DraftResponse {
  id: string
  updatedAt: string
}

export interface GetDraftResponse {
  id: string
  payloadType: DraftPayloadType
  title: string
  html: string
  css?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export async function createDraft(params: DraftPayload): Promise<DraftResponse> {
  const response = await fetch(`${API_URL}/drafts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error(`Failed to create draft: ${response.status}`)
  return response.json() as Promise<DraftResponse>
}

export async function updateDraft(id: string, params: DraftPayload): Promise<DraftResponse> {
  const response = await fetch(`${API_URL}/drafts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error(`Failed to update draft: ${response.status}`)
  return response.json() as Promise<DraftResponse>
}

export async function getDraft(id: string): Promise<GetDraftResponse> {
  const response = await fetch(`${API_URL}/drafts/${id}`)
  if (!response.ok) throw new Error(`Failed to get draft: ${response.status}`)
  return response.json() as Promise<GetDraftResponse>
}

export async function deleteDraft(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/drafts/${id}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete draft: ${response.status}`)
  }
}
