import { useEffect, useState, useCallback } from 'react'
import {
  Card, Space, Tag, Typography, Spin, Divider, Button, Input, List, Popconfirm,
  App as AntApp, Modal, Empty,
} from 'antd'
import { EditOutlined, DeleteOutlined, LinkOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchPaperById, CATEGORY_META, THEME_META, Paper,
  fetchNotesByPaperId, upsertNote, deleteMyNote, PaperNote,
  fetchCommentsByPaperId, addComment, deleteComment, PaperComment,
  fetchMyNote, getAnonUserId, getAnonUserName, setAnonUserName,
} from '../../api'
import { findRelatedPapers, EDGE_TYPE_META } from '../../data/relations'
import { findThemesForPaper } from '../../data/themes'
import './index.css'

const { Title, Paragraph, Text } = Typography

export default function PaperDetailPage() {
  const { paperId } = useParams<{ paperId: string }>()
  const navigate = useNavigate()
  const { message } = AntApp.useApp()

  const [paper, setPaper] = useState<Paper | null>(null)
  const [notes, setNotes] = useState<PaperNote[]>([])
  const [comments, setComments] = useState<PaperComment[]>([])
  const [loading, setLoading] = useState(true)

  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteTagsDraft, setNoteTagsDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [myName, setMyName] = useState(getAnonUserName())
  const myUid = getAnonUserId()

  const reload = useCallback(async () => {
    if (!paperId) return
    setLoading(true)
    try {
      const [p, n, c] = await Promise.all([
        fetchPaperById(paperId),
        fetchNotesByPaperId(paperId),
        fetchCommentsByPaperId(paperId),
      ])
      setPaper(p)
      setNotes(n)
      setComments(c)
    } catch (e) {
      message.error(`加载失败：${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [paperId, message])

  useEffect(() => {
    reload()
  }, [reload])

  const openNoteEditor = async () => {
    if (!paperId) return
    const my = await fetchMyNote(paperId)
    setNoteDraft(my?.content || '')
    setNoteTagsDraft(my?.tags || '')
    setNoteModalOpen(true)
  }

  const saveName = () => {
    setAnonUserName(nameDraft.trim() || '匿名读者')
    setMyName(nameDraft.trim() || '匿名读者')
    setNameModalOpen(false)
    message.success('昵称已更新')
  }

  const saveNote = async () => {
    if (!paperId || !noteDraft.trim()) return
    try {
      await upsertNote(paperId, noteDraft.trim(), noteTagsDraft.trim())
      message.success('笔记已保存')
      setNoteModalOpen(false)
      reload()
    } catch (e) {
      message.error(`保存失败：${(e as Error).message}`)
    }
  }

  const removeNote = async () => {
    if (!paperId) return
    try {
      await deleteMyNote(paperId)
      message.success('笔记已删除')
      reload()
    } catch (e) {
      message.error(`删除失败：${(e as Error).message}`)
    }
  }

  const submitComment = async () => {
    if (!paperId || !commentDraft.trim()) return
    try {
      await addComment(paperId, commentDraft.trim())
      message.success('评论已发布')
      setCommentDraft('')
      reload()
    } catch (e) {
      message.error(`发布失败：${(e as Error).message}`)
    }
  }

  const removeComment = async (id: string) => {
    try {
      await deleteComment(id)
      message.success('评论已删除')
      reload()
    } catch (e) {
      message.error(`删除失败：${(e as Error).message}`)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (!paper) return <Empty description="未找到该文献" />

  const relations = findRelatedPapers(paper.paper_id)
  const themes = findThemesForPaper(paper.paper_id)

  return (
    <div className="paper-detail-page">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} type="text">返回</Button>

      <Card className="paper-hero">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            {paper.category && (
              <Tag color={CATEGORY_META[paper.category]?.color}>
                {CATEGORY_META[paper.category]?.label || paper.category}
              </Tag>
            )}
            {(paper.themes || '').split(',').filter(Boolean).map((t) => (
              <Tag key={t.trim()} color="default" style={{ borderColor: THEME_META[t.trim()]?.color }}>
                {THEME_META[t.trim()]?.label || t.trim()}
              </Tag>
            ))}
          </div>
          <Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>{paper.title}</Title>
          {paper.title_en && paper.title_en !== paper.title && (
            <Text italic type="secondary" style={{ fontSize: 15 }}>{paper.title_en}</Text>
          )}
          <Text type="secondary">
            {paper.author} · {paper.year} · {paper.publication} · {paper.pages} 页 · {paper.lang === 'zh' ? '中文' : '英文'}
          </Text>
          {paper.pdf_url && (
            <a href={paper.pdf_url} target="_blank" rel="noreferrer">
              <Button type="link" icon={<LinkOutlined />} size="small" style={{ padding: 0 }}>
                打开 PDF
              </Button>
            </a>
          )}
        </Space>
      </Card>

      <Card title="摘要" size="small" className="section-card">
        <Paragraph style={{ lineHeight: 1.9, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{paper.abstract}</Paragraph>
      </Card>

      <Card title="核心论点" size="small" className="section-card">
        <Paragraph style={{ lineHeight: 1.9, marginBottom: 0, whiteSpace: 'pre-wrap' }}>
          {paper.key_arguments}
        </Paragraph>
      </Card>

      <Card title="关键概念" size="small" className="section-card">
        <Space wrap>
          {(paper.key_concepts || '').split(/[;；]/).filter(Boolean).map((c, i) => (
            <Tag key={i} color="processing" style={{ fontSize: 13, padding: '4px 10px' }}>
              {c.trim()}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card title="理论对话" size="small" className="section-card">
        <Paragraph style={{ lineHeight: 1.9, marginBottom: 12 }}>{paper.dialogues}</Paragraph>
        {relations.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Text strong style={{ fontSize: 13 }}>直接关联的文献：</Text>
            <List
              size="small"
              dataSource={relations}
              renderItem={(r) => {
                const otherId = r.source === paper.paper_id ? r.target : r.source
                return (
                  <List.Item>
                    <Tag color={EDGE_TYPE_META[r.type].color}>{EDGE_TYPE_META[r.type].label}</Tag>
                    <Link to={`/paper/${otherId}`}>{otherId}</Link>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{r.label}</Text>
                  </List.Item>
                )
              }}
            />
          </>
        )}
      </Card>

      {themes.length > 0 && (
        <Card title="属于以下主题综述" size="small" className="section-card">
          <Space wrap>
            {themes.map((t) => (
              <Link key={t.id} to={`/themes/${t.id}`}>
                <Tag color="blue" style={{ padding: '4px 10px', cursor: 'pointer' }}>
                  {t.id.toUpperCase()} · {t.label} →
                </Tag>
              </Link>
            ))}
          </Space>
        </Card>
      )}

      <Divider titlePlacement="left">📝 读书笔记</Divider>

      <div className="notes-header">
        <Space>
          <UserOutlined />
          <Text type="secondary" style={{ fontSize: 13 }}>你是</Text>
          <Text strong>{myName}</Text>
          <Button size="small" type="link" onClick={() => { setNameDraft(myName === '匿名读者' ? '' : myName); setNameModalOpen(true) }}>
            改昵称
          </Button>
          <Divider type="vertical" />
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={openNoteEditor}>
            写 / 编辑我的笔记
          </Button>
        </Space>
      </div>

      {notes.length === 0 ? (
        <Card size="small" className="empty-notes">
          <Empty description="还没有人写笔记，做第一个吧" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <>
          {notes.map((n) => {
            const isMine = n.user_id === myUid
            return (
              <Card
                key={n.id}
                size="small"
                className="note-card"
                style={isMine ? { borderLeft: '3px solid #5B8FF9' } : undefined}
                extra={
                  isMine && (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={openNoteEditor}>编辑</Button>
                      <Popconfirm title="确认删除笔记？" onConfirm={removeNote}>
                        <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  )
                }
                title={
                  <Space>
                    <Text strong style={{ fontSize: 13 }}>{n.user_name || '匿名读者'}</Text>
                    {isMine && <Tag color="blue">我</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {n.updated_at ? new Date(n.updated_at).toLocaleString('zh-CN') : ''}
                    </Text>
                    {n.tags && n.tags.split(',').filter(Boolean).map((t) => (
                      <Tag key={t.trim()}>{t.trim()}</Tag>
                    ))}
                  </Space>
                }
              >
                <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0, lineHeight: 1.9 }}>
                  {n.content}
                </Paragraph>
              </Card>
            )
          })}
        </>
      )}

      <Divider titlePlacement="left">💬 讨论区 ({comments.length})</Divider>

      <Card size="small" className="comment-editor">
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Input.TextArea
            rows={3}
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="写下你的观点或问题…"
          />
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={submitComment} disabled={!commentDraft.trim()}>
              发布评论
            </Button>
          </div>
        </Space>
      </Card>

      {comments.length === 0 ? (
        <Empty description="还没有评论" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          className="comment-list"
          dataSource={comments}
          renderItem={(c) => (
            <List.Item
              actions={[
                <Popconfirm
                  key="del"
                  title="确认删除？"
                  onConfirm={() => removeComment(c.comment_id)}
                >
                  <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong style={{ fontSize: 13 }}>{c.user_name || '匿名读者'}</Text>
                    {c.user_id === myUid && <Tag color="blue">我</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString('zh-CN') : ''}
                    </Text>
                  </Space>
                }
                description={
                  <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {c.content}
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title="设置昵称"
        open={nameModalOpen}
        onOk={saveName}
        onCancel={() => setNameModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="留个笔名吧，你的笔记和评论会显示这个名字"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          maxLength={20}
          onPressEnter={saveName}
        />
      </Modal>

      <Modal
        title="编辑读书笔记"
        open={noteModalOpen}
        onOk={saveNote}
        onCancel={() => setNoteModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={720}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            placeholder="标签（用逗号分隔，如：核心 / 反复读 / 引文用）"
            value={noteTagsDraft}
            onChange={(e) => setNoteTagsDraft(e.target.value)}
          />
          <Input.TextArea
            rows={16}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="写下你对这篇文献的读书笔记：核心论点、方法论要点、可引用的段落、你的疑问、跟其他文献的对话…"
          />
        </Space>
      </Modal>
    </div>
  )
}
