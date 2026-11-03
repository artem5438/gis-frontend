export type Account = {
  id: number
  login: string
  full_name: string
  verification_status: string
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
    properties: { cadastral_number: string }
  }>
}

export async function parcelLayer(): Promise<ParcelLayer> {
  const response = await send('/api/parcels')
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as ParcelLayer
}

export async function decideApplication(id: number, decision: 'approved' | 'rejected', role?: string): Promise<void> {
  const response = await send(`/api/applications/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify({ decision, role: role ?? '' }),
  })
  if (!response.ok) throw new Error(await readError(response))
}

export function statusLabel(status: string): string {
  if (status === 'visitor') return 'Посетитель'
  if (status === 'verified') return 'Проверен'
  return status
}
