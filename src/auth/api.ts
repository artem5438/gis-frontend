export type Account = {
  id: number
  login: string
  full_name: string
  verification_status: string
  from_database: boolean
  role: { code: string; name: string } | null
}

export type RoleRequest = {
  id: number
  body: string
  decision: string
  created_at: string
  full_name?: string
  login?: string
  assigned_role: { code: string; name: string } | null
}

export type ReviewQueue = {
  applications: RoleRequest[]
  roles: { code: string; name: string }[]
}

type ErrorBody = { error?: string }

async function send(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorBody
    if (body.error) return body.error
  } catch {
    // The server sometimes answers without JSON.
  }
  return 'Не удалось выполнить запрос'
}

export async function registerAccount(fullName: string, login: string, password: string): Promise<Account> {
  const response = await send('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, login, password }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as Account
}

export async function loginAccount(login: string, password: string): Promise<Account> {
  const response = await send('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as Account
}

export async function logoutAccount(): Promise<void> {
  await send('/api/auth/logout', { method: 'POST' })
}

export async function saveParcelSource(fromDatabase: boolean): Promise<Account> {
  const response = await send('/api/auth/source', {
    method: 'POST',
    body: JSON.stringify({ from_database: fromDatabase }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as Account
}

export async function currentAccount(): Promise<Account | null> {
  const response = await send('/api/auth/me')
  if (response.status === 401) return null
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as Account
}

export async function myApplication(): Promise<RoleRequest | null> {
  const response = await send('/api/applications/mine')
  if (response.status === 401) return null
  if (!response.ok) throw new Error(await readError(response))
  const body = (await response.json()) as { application: RoleRequest | null }
  return body.application
}

export async function sendApplication(text: string): Promise<RoleRequest> {
  const response = await send('/api/applications', {
    method: 'POST',
    body: JSON.stringify({ body: text }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as RoleRequest
}

export async function reviewQueue(): Promise<ReviewQueue> {
  const response = await send('/api/applications')
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as ReviewQueue
}

export type ParcelLayer = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id: number
    geometry: GeoJSON.Geometry
    properties: { cadastral_number: string; land_category: string }
  }>
}

export type ParcelQuery = {
  south: number
  west: number
  north: number
  east: number
  simplify: number
  squares: boolean
  whole?: boolean
}

export async function parcelLayer(query?: ParcelQuery | null): Promise<ParcelLayer> {
  const params = new URLSearchParams()
  if (query?.whole && query.squares) {
    params.set('squares', '1')
  } else if (query) {
    params.set('south', query.south.toFixed(6))
    params.set('west', query.west.toFixed(6))
    params.set('north', query.north.toFixed(6))
    params.set('east', query.east.toFixed(6))
    params.set('simplify', query.simplify.toFixed(6))
    if (query.squares) params.set('squares', '1')
  }
  const path = params.size > 0 ? `/api/parcels?${params.toString()}` : '/api/parcels'
  const response = await send(path)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as ParcelLayer
}

export type ParcelCard = {
  id: number
  cadastral_number: string
  object_kind: string
  parcel_kind: string
  assigned_on: string
  cadastral_quarter: string
  address: string
  area_ha: number | null
  area_m2: number | null
  area_name: string
  status: string
  land_category: string
  permitted_use: string
  ownership_form: string
  cadastral_cost: number | null
  cost_index: number | null
  score?: ParcelScore
}

export type ParcelScore = {
  ready: boolean
  reason?: string
  category?: string
  district?: string
  total: number
  location_points: number
  location_max: number
  area_points: number
  area_max: number
  distance_m: number
  area_ha: number
  median_ha: number
}

export type QuarterSlice = { name: string; count: number }

export type ParcelQuarter = {
  ready: boolean
  reason?: string
  basis?: string
  note?: string
  quarter?: string
  neighbor_count: number
  neighbor_numbers: string[]
  area_ha: number | null
  area_median_ha: number | null
  cost_index: number | null
  cost_median: number | null
  same_category: number
  same_use: number
  score: number | null
  score_median: number | null
  categories: QuarterSlice[] | null
  uses: QuarterSlice[] | null
}

export async function parcelQuarter(id: number): Promise<ParcelQuarter> {
  const response = await send(`/api/parcels/${id}/quarter`)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as ParcelQuarter
}

export type AnalyticsCell = {
  district: string
  category: string
  count: number
  area_ha: number
}

export async function analytics(): Promise<AnalyticsCell[]> {
  const response = await send('/api/analytics')
  if (!response.ok) throw new Error(await readError(response))
  const body = (await response.json()) as { cells: AnalyticsCell[] }
  return body.cells ?? []
}

export type WalkStatus = {
  state: 'idle' | 'running' | 'done'
  saved: number
  left: number
  message: string
}

export async function catalogWalk(): Promise<WalkStatus> {
  const response = await send('/api/catalog/walk')
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as WalkStatus
}

export async function startCatalogWalk(): Promise<WalkStatus> {
  const response = await send('/api/catalog/walk', { method: 'POST' })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as WalkStatus
}

export async function parcelStoredAtPoint(lat: number, lng: number): Promise<ParcelCard | null> {
  const response = await send('/api/parcels/stored', {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  })
  if (!response.ok) throw new Error(await readError(response))
  const body = (await response.json()) as { found: boolean; parcel?: ParcelCard }
  return body.found ? (body.parcel ?? null) : null
}

export async function parcelAtPoint(lat: number, lng: number): Promise<ParcelCard | null> {
  const response = await send('/api/parcels/at-point', {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  })
  if (!response.ok) throw new Error(await readError(response))
  const body = (await response.json()) as { found: boolean; parcel?: ParcelCard }
  return body.found ? (body.parcel ?? null) : null
}

export async function decideApplication(id: number, decision: 'approved' | 'rejected', role?: string): Promise<void> {
  const response = await send(`/api/applications/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, role: role ?? '' }),
  })
  if (!response.ok) throw new Error(await readError(response))
}

export type AssistantDocument = {
  id: number
  title: string
  kind: string
  created_at: string
  author: string | null
  can_edit: boolean
}

export type AssistantSource = {
  id: number
  title: string
  kind: string
}

export async function assistantDocuments(): Promise<AssistantDocument[]> {
  const response = await send('/api/assistant/documents')
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as AssistantDocument[]
}

export async function uploadAssistantDocument(file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)
  const response = await fetch('/api/assistant/documents', {
    method: 'POST',
    credentials: 'include',
    body,
  })
  if (!response.ok) throw new Error(await readError(response))
}

export async function renameAssistantDocument(id: number, title: string): Promise<void> {
  const response = await send(`/api/assistant/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
  if (!response.ok) throw new Error(await readError(response))
}

export async function deleteAssistantDocument(id: number): Promise<void> {
  const response = await send(`/api/assistant/documents/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await readError(response))
}

export async function assistantDocumentFile(id: number, plain: boolean): Promise<{ extension: string; buffer: ArrayBuffer }> {
  const response = await fetch(`/api/assistant/documents/${id}/file${plain ? '?plain=1' : ''}`, { credentials: 'include' })
  if (!response.ok) throw new Error(await readError(response))
  const extension = (response.headers.get('X-Document-Extension') || '').toLowerCase()
  return { extension, buffer: await response.arrayBuffer() }
}

function readSources(value: unknown): AssistantSource[] {
  if (!Array.isArray(value)) return []
  const sources: AssistantSource[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as { id?: unknown; title?: unknown; kind?: unknown }
    const id = typeof row.id === 'number' ? row.id : 0
    const title = typeof row.title === 'string' ? row.title.trim() : ''
    const kind = typeof row.kind === 'string' ? row.kind : ''
    if (id === 0 || title === '') continue
    sources.push({ id, title, kind })
  }
  return sources
}

export async function askAssistant(message: string): Promise<{ answer: string; sources: AssistantSource[]; plot: { number: string; lat: number; lng: number } | null }> {
  const response = await send('/api/assistant/ask', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
  if (!response.ok) throw new Error(await readError(response))
  const body = (await response.json()) as { answer?: string; sources?: unknown; map?: { number?: string; lat?: number; lng?: number } }
  const answer = body.answer?.trim() || 'Извините, у меня нет этой информации.'
  const sources = answer === 'Извините, у меня нет этой информации.' ? [] : readSources(body.sources)
  const plot = body.map?.number && typeof body.map.lat === 'number' && typeof body.map.lng === 'number'
    ? { number: body.map.number, lat: body.map.lat, lng: body.map.lng }
    : null
  return { answer, sources, plot }
}

export type ReportLine = { label: string; value: string; hint?: string }
export type ReportSlice = { name: string; value: number; color: string }
export type ReportChart = { title: string; kind?: string; slices: ReportSlice[] }
export type ReportSection = { title: string; note?: string; lines?: ReportLine[] | null }
export type ReportDocument = {
  title: string
  formed_on: string
  author: string
  number: string
  passport: ReportLine[]
  score?: ReportSection | null
  quarter?: ReportSection | null
  charts?: ReportChart[] | null
}
export type SavedReport = {
  id: number
  format: 'pdf' | 'docx'
  number: string
  score: boolean
  quarter: boolean
  charts: boolean
  created_at: string
  body?: ReportDocument
}

export async function reportDraft(target: { parcel?: string; number?: string }): Promise<{ parcel_id: number; body: ReportDocument }> {
  const params = new URLSearchParams()
  if (target.parcel) params.set('parcel', target.parcel)
  if (target.number) params.set('number', target.number)
  const response = await send(`/api/reports/draft?${params}`)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as { parcel_id: number; body: ReportDocument }
}

export async function saveReport(body: { id?: number; parcel_id: number; format: 'pdf' | 'docx'; score: boolean; quarter: boolean; charts: boolean; chart_kinds: Record<string, string> }): Promise<SavedReport> {
  const response = await send('/api/reports', { method: 'POST', body: JSON.stringify(body) })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as SavedReport
}

export async function myReports(): Promise<SavedReport[]> {
  const response = await send('/api/reports')
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as SavedReport[]
}

export async function openReport(id: number): Promise<SavedReport> {
  const response = await send(`/api/reports/${id}`)
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as SavedReport
}

export async function downloadReport(id: number, filename: string): Promise<void> {
  const response = await fetch(`/api/reports/${id}/file`, { credentials: 'include' })
  if (!response.ok) throw new Error(await readError(response))
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function statusLabel(status: string): string {
  if (status === 'visitor') return 'Посетитель'
  if (status === 'verified') return 'Проверен'
  return status
}
