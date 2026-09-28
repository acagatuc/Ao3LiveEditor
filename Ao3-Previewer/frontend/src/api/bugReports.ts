const API_URL = import.meta.env.VITE_API_URL

export interface BugReportPayload {
  html: string
  css: string
  description: string
  intent: string
  siteSkin?: string
  contactEmail?: string
  userAgent?: string
  viewport?: string
  appVersion?: string
}

export interface BugReportResponse {
  id: string
}

export async function createBugReport(params: BugReportPayload): Promise<BugReportResponse> {
  const response = await fetch(`${API_URL}/bug-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error(`Failed to send bug report: ${response.status}`)
  return response.json() as Promise<BugReportResponse>
}
