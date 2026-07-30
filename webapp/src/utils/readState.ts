// 本地阅读状态管理（localStorage，无需后端）
// 三态：unread(默认) → interested(感兴趣) → done(已读/归档)

export type ReadState = 'unread' | 'interested' | 'done'

const KEY = 'folklore_kb_read_states'

function loadAll(): Record<string, ReadState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

let cache: Record<string, ReadState> | null = null

function getAll(): Record<string, ReadState> {
  if (!cache) cache = loadAll()
  return cache
}

export function getReadState(id: string): ReadState {
  return getAll()[id] || 'unread'
}

export function setReadState(id: string, state: ReadState) {
  const all = getAll()
  if (state === 'unread') {
    delete all[id]
  } else {
    all[id] = state
  }
  cache = all
  localStorage.setItem(KEY, JSON.stringify(all))
}

/** 循环切换：unread → interested → done → unread */
export function cycleReadState(id: string): ReadState {
  const cur = getReadState(id)
  const next: ReadState = cur === 'unread' ? 'interested' : cur === 'interested' ? 'done' : 'unread'
  setReadState(id, next)
  return next
}

export const READ_STATE_META: Record<ReadState, { label: string; icon: string; color: string }> = {
  unread: { label: '未读', icon: '○', color: '#bbb' },
  interested: { label: '感兴趣', icon: '★', color: '#b08d57' },
  done: { label: '已读', icon: '✓', color: '#52c41a' },
}
