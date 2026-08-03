import { useEffect, useMemo, useState } from 'react'
import {
  Card, Typography, Spin, Space, Button, Input, Modal, Select, Tag,
  App as AntApp, Popconfirm, Divider, Alert,
} from 'antd'
import { PlusOutlined, DeleteOutlined, CommentOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import {
  fetchPosts, createPost, deletePost, fetchVotes, castVote, fetchReplies, addReply, deleteReply,
  ForumPost, ForumVote, ForumReply, VoteType, VOTE_META,
} from '../../api/forum'
import { fetchAllPapers, Paper } from '../../api'
import { getAnonUserId, getAnonUserName, setAnonUserName } from '../../api/client'
import { DAILY_TOPICS } from '../../data/dailyTopics'
import { FORUM_STARTERS, ForumStarter } from '../../data/forumStarters'
import './index.css'

const { Text, Paragraph, Title } = Typography

export default function ForumPage() {
  const { message } = AntApp.useApp()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [votes, setVotes] = useState<ForumVote[]>([])
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)

  // 发帖 Modal
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [contentDraft, setContentDraft] = useState('')
  const [topicDraft, setTopicDraft] = useState<string | undefined>()
  const [paperDraft, setPaperDraft] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  // 回复
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  // 昵称
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [myName, setMyName] = useState(getAnonUserName())
  const myUid = getAnonUserId()

  const reload = async () => {
    setLoading(true)
    try {
      const [p, v, r] = await Promise.all([fetchPosts(), fetchVotes(), fetchReplies()])
      setPosts(p)
      setVotes(v)
      setReplies(r)
      setTableMissing(false)
    } catch (e) {
      const msg = (e as Error).message || ''
      if (msg.includes('PGRST205') || msg.includes('Could not find')) {
        setTableMissing(true)
      } else {
        message.error(`加载失败：${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    fetchAllPapers().then(setPapers).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 投票统计 + 我的投票
  const voteStats = useMemo(() => {
    const stats: Record<string, { agree: number; useful: number; disagree: number; mine: VoteType | null }> = {}
    votes.forEach((v) => {
      if (!stats[v.post_id]) stats[v.post_id] = { agree: 0, useful: 0, disagree: 0, mine: null }
      stats[v.post_id][v.vote as VoteType]++
      if (v.user_id === myUid) stats[v.post_id].mine = v.vote as VoteType
    })
    return stats
  }, [votes, myUid])

  const repliesByPost = useMemo(() => {
    const map: Record<string, ForumReply[]> = {}
    replies.forEach((r) => {
      if (!map[r.post_id]) map[r.post_id] = []
      map[r.post_id].push(r)
    })
    return map
  }, [replies])

  const paperOptions = useMemo(
    () => papers.map((p) => ({ value: p.paper_id, label: `${p.title.slice(0, 40)}（${p.year}）` })),
    [papers],
  )

  const topicOptions = useMemo(
    () => DAILY_TOPICS.map((t) => ({ value: t.topic, label: t.topic })),
    [],
  )

  const submitPost = async () => {
    if (!titleDraft.trim() || !contentDraft.trim()) {
      message.warning('标题和内容都要写哦')
      return
    }
    setSubmitting(true)
    try {
      await createPost(titleDraft.trim(), contentDraft.trim(), topicDraft, paperDraft)
      message.success('发布成功')
      setPostModalOpen(false)
      setTitleDraft(''); setContentDraft(''); setTopicDraft(undefined); setPaperDraft(undefined)
      reload()
    } catch (e) {
      message.error(`发布失败：${(e as Error).message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const onVote = async (postId: string, vote: VoteType) => {
    try {
      await castVote(postId, vote, voteStats[postId]?.mine || null)
      const v = await fetchVotes()
      setVotes(v)
    } catch (e) {
      message.error(`投票失败：${(e as Error).message}`)
    }
  }

  const onReply = async (postId: string) => {
    const draft = (replyDrafts[postId] || '').trim()
    if (!draft) return
    try {
      await addReply(postId, draft)
      setReplyDrafts((d) => ({ ...d, [postId]: '' }))
      const r = await fetchReplies()
      setReplies(r)
    } catch (e) {
      message.error(`回复失败：${(e as Error).message}`)
    }
  }

  const onDeletePost = async (postId: string) => {
    try {
      await deletePost(postId)
      message.success('已删除')
      reload()
    } catch (e) {
      message.error(`删除失败：${(e as Error).message}`)
    }
  }

  const onDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId)
      const r = await fetchReplies()
      setReplies(r)
    } catch (e) {
      message.error(`删除失败：${(e as Error).message}`)
    }
  }

  const saveName = () => {
    setAnonUserName(nameDraft.trim() || '匿名读者')
    setMyName(nameDraft.trim() || '匿名读者')
    setNameModalOpen(false)
    message.success('昵称已更新')
  }

  /** 点话题引导卡：预填标题+脚手架正文，打开发帖 Modal */
  const openStarter = (s: ForumStarter) => {
    setTitleDraft(s.prefillTitle)
    setContentDraft(s.prefillContent)
    setTopicDraft(s.topicTag)
    setPaperDraft(s.paperId)
    setPostModalOpen(true)
  }

  const paperById = (id?: string | null) => papers.find((p) => p.paper_id === id)

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  if (tableMissing) {
    return (
      <Alert
        type="warning"
        showIcon
        message="讨论区尚未初始化"
        description="数据库中还没有讨论区的表。请联系管理员在 Supabase 中执行建表 SQL 后刷新本页。"
        style={{ maxWidth: 600, margin: '60px auto' }}
      />
    )
  }

  return (
    <div className="forum-page">
      <div className="forum-header">
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>🗣️ 阅读讨论区</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            读到什么想说的，发出来——可以挂上专题或文献标签
          </Text>
        </Space>
        <Space>
          <Button type="text" size="small" icon={<UserOutlined />} onClick={() => { setNameDraft(myName === '匿名读者' ? '' : myName); setNameModalOpen(true) }}>
            {myName}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPostModalOpen(true)}>
            发帖
          </Button>
        </Space>
      </div>

      {posts.length < 5 && (
        <div className="forum-starters">
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
            {posts.length === 0 ? '🌱 还没有帖子——不知道从哪开口？点一个话题，我们已经帮你起好头了：' : '🌱 不知道发什么？从这些话题开始：'}
          </Text>
          <div className="forum-starter-grid">
            {FORUM_STARTERS.map((s) => (
              <div key={s.id} className="forum-starter-card" onClick={() => openStarter(s)}>
                <div className="forum-starter-title">
                  <span style={{ marginRight: 6 }}>{s.emoji}</span>
                  <Text strong style={{ fontSize: 13.5 }}>{s.title}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{s.hint}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 ? null : (
        posts.map((post) => {
          const stats = voteStats[post.post_id] || { agree: 0, useful: 0, disagree: 0, mine: null }
          const postReplies = repliesByPost[post.post_id] || []
          const isMine = post.user_id === myUid
          const linkedPaper = paperById(post.paper_id)
          const expanded = expandedReplies.has(post.post_id)
          return (
            <Card key={post.post_id} className="forum-post-card" size="small">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Text strong style={{ fontSize: 15.5 }}>{post.title}</Text>
                  {isMine && (
                    <Popconfirm title="删除这个帖子？" onConfirm={() => onDeletePost(post.post_id)} okText="删除" cancelText="取消">
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </div>
                <Space wrap size={4}>
                  {post.topic_tag && <Tag color="#2c3e50" style={{ fontSize: 11 }}>🧭 {post.topic_tag}</Tag>}
                  {linkedPaper && (
                    <Link to={`/paper/${linkedPaper.paper_id}`}>
                      <Tag color="#b08d57" style={{ fontSize: 11, cursor: 'pointer' }}>📖 {linkedPaper.title.slice(0, 24)}</Tag>
                    </Link>
                  )}
                </Space>
                <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, marginBottom: 4 }}>{post.content}</Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {post.user_name || '匿名读者'} · {post.created_at ? new Date(post.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>

                <Divider style={{ margin: '4px 0' }} />
                <Space wrap>
                  {(Object.keys(VOTE_META) as VoteType[]).map((vt) => {
                    const meta = VOTE_META[vt]
                    const active = stats.mine === vt
                    return (
                      <Button
                        key={vt}
                        size="small"
                        type={active ? 'primary' : 'default'}
                        style={active ? { background: meta.color, borderColor: meta.color } : {}}
                        onClick={() => onVote(post.post_id, vt)}
                      >
                        {meta.icon} {meta.label} {stats[vt] > 0 ? stats[vt] : ''}
                      </Button>
                    )
                  })}
                  <Button
                    size="small"
                    type="text"
                    icon={<CommentOutlined />}
                    onClick={() => {
                      setExpandedReplies((s) => {
                        const n = new Set(s)
                        if (n.has(post.post_id)) n.delete(post.post_id)
                        else n.add(post.post_id)
                        return n
                      })
                    }}
                  >
                    回复 {postReplies.length > 0 ? postReplies.length : ''}
                  </Button>
                </Space>

                {expanded && (
                  <div className="forum-replies">
                    {postReplies.map((r) => (
                      <div key={r.reply_id} className="forum-reply-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{r.content}</Text>
                          {r.user_id === myUid && (
                            <Popconfirm title="删除回复？" onConfirm={() => onDeleteReply(r.reply_id)} okText="删" cancelText="不">
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ flexShrink: 0 }} />
                            </Popconfirm>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11.5 }}>
                          {r.user_name || '匿名读者'} · {r.created_at ? new Date(r.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <Input
                        size="small"
                        placeholder="写下你的回复…"
                        value={replyDrafts[post.post_id] || ''}
                        onChange={(e) => setReplyDrafts((d) => ({ ...d, [post.post_id]: e.target.value }))}
                        onPressEnter={() => onReply(post.post_id)}
                      />
                      <Button size="small" type="primary" onClick={() => onReply(post.post_id)}>发送</Button>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          )
        })
      )}

      <Modal
        title="发布新帖"
        open={postModalOpen}
        onOk={submitPost}
        onCancel={() => setPostModalOpen(false)}
        okText="发布"
        cancelText="取消"
        confirmLoading={submitting}
        width={640}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            placeholder="标题：一句话说清你想讨论什么"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            maxLength={80}
            showCount
          />
          <Input.TextArea
            rows={6}
            placeholder="正文：你的想法、疑问、读书心得、对某个概念的理解…"
            value={contentDraft}
            onChange={(e) => setContentDraft(e.target.value)}
          />
          <Select
            allowClear
            showSearch
            placeholder="（可选）挂一个专题标签"
            value={topicDraft}
            onChange={setTopicDraft}
            options={topicOptions}
            style={{ width: '100%' }}
          />
          <Select
            allowClear
            showSearch
            placeholder="（可选）关联一篇文献"
            value={paperDraft}
            onChange={setPaperDraft}
            options={paperOptions}
            optionFilterProp="label"
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>

      <Modal
        title="设置昵称"
        open={nameModalOpen}
        onOk={saveName}
        onCancel={() => setNameModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="留个笔名吧，你的帖子和回复会显示这个名字"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          maxLength={20}
          onPressEnter={saveName}
        />
      </Modal>
    </div>
  )
}
