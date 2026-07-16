/**
 * Supabase 客户端封装 — 匿名读写
 * 直调 PostgREST，不引入 supabase-js SDK（保持包体积小）
 *
 * 环境变量（通过 Vite 注入）：
 *   VITE_SUPABASE_URL      — https://xxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY — anon public key
 */

// 匿名用户 ID（存 localStorage，每个浏览器一个）
const USER_ID_KEY = 'folklore_kb_uid'
export function getAnonUserId(): string {
  let uid = localStorage.getItem(USER_ID_KEY)
  if (!uid) {
    uid = 'u_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
    localStorage.setItem(USER_ID_KEY, uid)
  }
  return uid
}
const USER_NAME_KEY = 'folklore_kb_name'
export function getAnonUserName(): string {
  return localStorage.getItem(USER_NAME_KEY) || '匿名读者'
}
export function setAnonUserName(name: string) {
  localStorage.setItem(USER_NAME_KEY, name.trim() || '匿名读者')
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || ''

if (!SUPABASE_URL || !SUPABASE_ANON) {
  // eslint-disable-next-line no-console
  console.warn('[folklore_kb] Supabase env not set. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

interface FetchOpts {
  method?: string
  body?: unknown
  prefer?: string
  headers?: Record<string, string>
}

async function sbFetch(path: string, opts: FetchOpts = {}): Promise<Response> {
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  if (opts.prefer) headers['Prefer'] = opts.prefer
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  return res
}

async function sbJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await sbFetch(path, opts)
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`)
  }
  if (!text) return [] as unknown as T
  return JSON.parse(text) as T
}

/** SELECT */
export async function sbSelect<T>(
  table: string,
  params: { filter?: string; order?: string; limit?: number; select?: string } = {},
): Promise<T[]> {
  const qs = new URLSearchParams()
  qs.set('select', params.select || '*')
  if (params.filter) {
    // filter format: "field=eq.value" or "field=in.(a,b,c)"
    params.filter.split('&').forEach((f) => {
      const [k, v] = f.split('=')
      if (k && v !== undefined) qs.set(k, v)
    })
  }
  if (params.order) qs.set('order', params.order)
  if (params.limit) qs.set('limit', String(params.limit))
  return sbJson<T[]>(`${table}?${qs.toString()}`)
}

/** INSERT (single or bulk) */
export async function sbInsert<T>(table: string, rows: object | object[]): Promise<T[]> {
  return sbJson<T[]>(table, {
    method: 'POST',
    body: rows,
    prefer: 'return=representation',
  })
}

/** UPSERT by unique column */
export async function sbUpsert<T>(table: string, rows: object | object[], onConflict: string): Promise<T[]> {
  return sbJson<T[]>(`${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    body: rows,
    prefer: 'resolution=merge-duplicates,return=representation',
  })
}

/** UPDATE by filter */
export async function sbUpdate<T>(table: string, filter: string, patch: object): Promise<T[]> {
  return sbJson<T[]>(`${table}?${filter}`, {
    method: 'PATCH',
    body: patch,
    prefer: 'return=representation',
  })
}

/** DELETE by filter */
export async function sbDelete(table: string, filter: string): Promise<void> {
  const res = await sbFetch(`${table}?${filter}`, { method: 'DELETE' })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Supabase DELETE ${res.status}: ${t.slice(0, 200)}`)
  }
}
