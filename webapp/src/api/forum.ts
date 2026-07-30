// 阅读讨论区 API：帖子 / 投票 / 回复
import { sbSelect, sbInsert, sbUpsert, sbDelete, getAnonUserId, getAnonUserName } from './client'

export interface ForumPost {
  id?: number
  post_id: string
  user_id: string
  user_name?: string
  title: string
  content: string
  topic_tag?: string | null // 专题名（来自 DAILY_TOPICS 或 THEME）
  paper_id?: string | null  // 关联文献
  created_at?: string
}

export type VoteType = 'agree' | 'useful' | 'disagree'

export interface ForumVote {
  id?: number
  post_id: string
  user_id: string
  vote: VoteType
}

export interface ForumReply {
  id?: number
  reply_id: string
  post_id: string
  user_id: string
  user_name?: string
  content: string
  created_at?: string
}

function genId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

// ============ 帖子 ============

export async function fetchPosts(): Promise<ForumPost[]> {
  return sbSelect<ForumPost>('forum_posts', { order: 'created_at.desc', limit: 200 })
}

export async function createPost(title: string, content: string, topicTag?: string, paperId?: string): Promise<ForumPost> {
  const rows = await sbInsert<ForumPost>('forum_posts', [{
    post_id: genId('p'),
    user_id: getAnonUserId(),
    user_name: getAnonUserName(),
    title,
    content,
    topic_tag: topicTag || null,
    paper_id: paperId || null,
  }])
  return rows[0]
}

export async function deletePost(postId: string): Promise<void> {
  await sbDelete('forum_posts', `post_id=eq.${postId}&user_id=eq.${getAnonUserId()}`)
}

// ============ 投票 ============

export async function fetchVotes(): Promise<ForumVote[]> {
  return sbSelect<ForumVote>('forum_votes', { limit: 2000 })
}

/** 投票（同一用户对同一帖子只保留一票；点相同的 vote 视为取消） */
export async function castVote(postId: string, vote: VoteType, currentMyVote?: VoteType | null): Promise<void> {
  const uid = getAnonUserId()
  if (currentMyVote === vote) {
    // 取消投票
    await sbDelete('forum_votes', `post_id=eq.${postId}&user_id=eq.${uid}`)
    return
  }
  await sbUpsert<ForumVote>('forum_votes', [{ post_id: postId, user_id: uid, vote }], 'post_id,user_id')
}

// ============ 回复 ============

export async function fetchReplies(): Promise<ForumReply[]> {
  return sbSelect<ForumReply>('forum_replies', { order: 'created_at.asc', limit: 1000 })
}

export async function addReply(postId: string, content: string): Promise<ForumReply> {
  const rows = await sbInsert<ForumReply>('forum_replies', [{
    reply_id: genId('r'),
    post_id: postId,
    user_id: getAnonUserId(),
    user_name: getAnonUserName(),
    content,
  }])
  return rows[0]
}

export async function deleteReply(replyId: string): Promise<void> {
  await sbDelete('forum_replies', `reply_id=eq.${replyId}&user_id=eq.${getAnonUserId()}`)
}

export const VOTE_META: Record<VoteType, { label: string; icon: string; color: string }> = {
  agree: { label: '赞同', icon: '👍', color: '#52c41a' },
  useful: { label: '有用', icon: '💡', color: '#b08d57' },
  disagree: { label: '不赞同', icon: '🤔', color: '#8c8c8c' },
}
