// Use same-origin base by default in production; Vite dev proxy handles /api in dev.
const BASE = import.meta.env.VITE_API_URL || ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error?.message || `HTTP ${res.status}`) as any
    err.error = body.error
    throw err
  }
  return res.status === 204 ? undefined as T : res.json()
}

export const api = {
  get:    <T>(path: string)                => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
  upload: async <T>(path: string, file: File, fieldName = 'file') => {
    const fd = new FormData()
    fd.append(fieldName, file)
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const err = new Error(body.error?.message || `HTTP ${res.status}`) as any
      err.error = body.error
      throw err
    }
    return res.json() as Promise<T>
  },
}
