import { sbSelect, sbUpsert, sbInsert, sbDelete, getAnonUserId, getAnonUserName } from './client'

export interface PaperNote {
  id?: number
  paper_id: string
  user_id: string
  user_name?: string
  content: string
  tags?: string
  created_at?: string
  updated_at?: string
}

export interface PaperComment {
  id?: number
  comment_id: string
  paper_id: string
  user_id: string
  user_name?: string
  content: string
  created_at?: string
}

export interface WeeklyFeedItem {
  id?: number
  feed_id: string
  title: string
  authors?: string
  year?: number
  source?: string
  link?: string
  abstract?: string
  keyword?: string
  week_of?: string
  // 中文速读（DeepSeek 生成，可能为 null）
  summary_zh?: string | null
  theory?: string | null
  innovation?: string | null
  keywords_zh?: string | null
}

// ============ Notes ============

/** 查某篇文献的所有笔记（所有人可见，无隐私） */
export async function fetchNotesByPaperId(paperId: string): Promise<PaperNote[]> {
  return sbSelect<PaperNote>('paper_notes', {
    filter: `paper_id=eq.${paperId}`,
    order: 'updated_at.desc',
    limit: 100,
  })
}

/** 查"我"（当前浏览器）在某篇的笔记 */
export async function fetchMyNote(paperId: string): Promise<PaperNote | null> {
  const uid = getAnonUserId()
  const rows = await sbSelect<PaperNote>('paper_notes', {
    filter: `paper_id=eq.${paperId}&user_id=eq.${uid}`,
    limit: 1,
  })
  return rows[0] || null
}

/** upsert 我的笔记（一人一篇一条） */
export async function upsertNote(paperId: string, content: string, tags: string = ''): Promise<PaperNote> {
  const uid = getAnonUserId()
  const rows = await sbUpsert<PaperNote>(
    'paper_notes',
    [{
      paper_id: paperId,
      user_id: uid,
      user_name: getAnonUserName(),
      content,
      tags,
      updated_at: new Date().toISOString(),
    }],
    'paper_id,user_id',
  )
  return rows[0]
}

/** 删除我的笔记 */
export async function deleteMyNote(paperId: string): Promise<void> {
  const uid = getAnonUserId()
  await sbDelete('paper_notes', `paper_id=eq.${paperId}&user_id=eq.${uid}`)
}

// ============ Comments ============

export async function fetchCommentsByPaperId(paperId: string): Promise<PaperComment[]> {
  return sbSelect<PaperComment>('paper_comments', {
    filter: `paper_id=eq.${paperId}`,
    order: 'created_at.desc',
    limit: 200,
  })
}

export async function addComment(paperId: string, content: string): Promise<PaperComment> {
  const uid = getAnonUserId()
  const cid = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
  const rows = await sbInsert<PaperComment>('paper_comments', [{
    comment_id: cid,
    paper_id: paperId,
    user_id: uid,
    user_name: getAnonUserName(),
    content,
  }])
  return rows[0]
}

export async function deleteComment(commentId: string): Promise<void> {
  await sbDelete('paper_comments', `comment_id=eq.${commentId}`)
}

// ============ Weekly Feed ============

export async function fetchWeeklyFeed(limit: number = 200): Promise<WeeklyFeedItem[]> {
  return sbSelect<WeeklyFeedItem>('weekly_feed', {
    order: 'week_of.desc,created_at.desc',
    limit,
  })
}
