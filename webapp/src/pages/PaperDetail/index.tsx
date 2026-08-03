import { useEffect, useState, useCallback } from 'react'
import {
  Card, Space, Tag, Typography, Spin, Divider, Button, Input, List, Popconfirm,
  App as AntApp, Modal, Empty,
} from 'antd'
import { EditOutlined, DeleteOutlined, LinkOutlined, ArrowLeftOutlined, UserOutlined, CopyOutlined, ExportOutlined } from '@ant-design/icons'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchPaperById, CATEGORY_META, THEME_META, Paper,
  fetchNotesByPaperId, upsertNote, deleteMyNote, PaperNote,
  fetchCommentsByPaperId, addComment, deleteComment, PaperComment,
  fetchMyNote, getAnonUserId, getAnonUserName, setAnonUserName,
  fetchPaperBriefs, PaperBrief,
} from '../../api'
import { findThemesForPaper } from '../../data/themes'
import { findRelated, RELATION_TYPE_META, RelationType } from '../../data/relations'
import { CITE_FORMATS } from '../../utils/cite'
import { getReadState, cycleReadState, READ_STATE_META, ReadState } from '../../utils/readState'
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

  // 就地快速笔记
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [quickNoteDraft, setQuickNoteDraft] = useState('')
  const [quickNoteSaving, setQuickNoteSaving] = useState(false)
  // 引用导出
  const [citeModalOpen, setCiteModalOpen] = useState(false)
  // 阅读状态
  const [readState, setReadStateUI] = useState<ReadState>('unread')
  // 关联文献（对话关系）
  const [relatedBriefs, setRelatedBriefs] = useState<Record<string, PaperBrief>>({})

  useEffect(() => {
    if (paperId) setReadStateUI(getReadState(paperId))
  }, [paperId])

  // 加载对话关系文献的简要信息
  useEffect(() => {
    if (!paperId) return
    const related = findRelated(paperId)
    if (!related.length) { setRelatedBriefs({}); return }
    fetchPaperBriefs(related.map((r) => r.paperId))
      .then((briefs) => {
        const map: Record<string, PaperBrief> = {}
        briefs.forEach((b) => { map[b.paper_id] = b })
        setRelatedBriefs(map)
      })
      .catch(() => {})
  }, [paperId])

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

  /** 就地速记：追加到我的笔记末尾（带时间戳行），不覆盖已有内容 */
  const saveQuickNote = async () => {
    if (!paperId || !quickNoteDraft.trim()) return
    setQuickNoteSaving(true)
    try {
      const my = await fetchMyNote(paperId)
      const stamp = new Date().toLocaleDateString('zh-CN')
      const newBlock = `[${stamp}] ${quickNoteDraft.trim()}`
      const merged = my?.content ? `${my.content}\n\n${newBlock}` : newBlock
      await upsertNote(paperId, merged, my?.tags || '')
      message.success('已记一笔')
      setQuickNoteDraft('')
      setQuickNoteOpen(false)
      reload()
    } catch (e) {
      message.error(`保存失败：${(e as Error).message}`)
    } finally {
      setQuickNoteSaving(false)
    }
  }

  const copyCitation = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => message.success('已复制到剪贴板'),
      () => message.error('复制失败，请手动选择文本'),
    )
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
        <Divider style={{ margin: '12px 0' }} />
        <Space wrap>
          <Button
            size="small"
            style={{ color: READ_STATE_META[readState].color, borderColor: READ_STATE_META[readState].color }}
            onClick={() => {
              if (!paperId) return
              const next = cycleReadState(paperId)
              setReadStateUI(next)
            }}
          >
            {READ_STATE_META[readState].icon} {READ_STATE_META[readState].label}
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => setQuickNoteOpen(!quickNoteOpen)}>
            记一笔
          </Button>
          <Button size="small" icon={<ExportOutlined />} onClick={() => setCiteModalOpen(true)}>
            引用
          </Button>
        </Space>
        {quickNoteOpen && (
          <div style={{ marginTop: 12 }}>
            <Input.TextArea
              rows={3}
              placeholder="随手记：想法、疑问、和其他文献的联系……（保存后追加到你的笔记，不覆盖）"
              value={quickNoteDraft}
              onChange={(e) => setQuickNoteDraft(e.target.value)}
              autoFocus
            />
            <Space style={{ marginTop: 8 }}>
              <Button type="primary" size="small" loading={quickNoteSaving} onClick={saveQuickNote}>
                保存
              </Button>
              <Button size="small" onClick={() => setQuickNoteOpen(false)}>取消</Button>
            </Space>
          </div>
        )}
      </Card>

      <Card title="摘要" size="small" className="section-card">
        <Paragraph style={{ lineHeight: 1.9, marginBottom: 0, whiteSpace: 'pre-wrap' }}>{paper.abstract}</Paragraph>
      </Card>

      {(paper.extra as any)?.case_analysis && (
        <Card
          title={<span>🔍 核心案例详解</span>}
          size="small"
          className="section-card"
          style={{ borderLeft: '3px solid #e74c3c' }}
        >
          {(() => {
            const c: any = (paper.extra as any).case_analysis
            return (
              <div style={{ lineHeight: 1.9 }}>
                <Paragraph style={{ marginBottom: 12 }}>
                  <Text strong>【核心案例】</Text>
                  {c.case_name}
                </Paragraph>
                <Paragraph style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                  <Text strong>【案例细节】</Text>
                  {c.case_detail}
                </Paragraph>
                <Paragraph style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                  <Text strong>【作者如何用它论证】</Text>
                  {c.how_used}
                </Paragraph>
                <Paragraph style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                  <Text strong>【延伸解读】</Text>
                  {c.extended_reading}
                </Paragraph>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0, fontStyle: 'italic' }}>
                  {c.source_note}
                </Paragraph>
              </div>
            )
          })()}
        </Card>
      )}

      {paper.key_arguments && (
        <Card title="核心论点" size="small" className="section-card">
          <Paragraph style={{ lineHeight: 1.9, marginBottom: 0, whiteSpace: 'pre-wrap' }}>
            {paper.key_arguments}
          </Paragraph>
        </Card>
      )}

      {paper.key_concepts && (
        <Card title="关键概念" size="small" className="section-card">
          <Space wrap>
            {(paper.key_concepts || '').split(/[;；,，]/).filter(Boolean).map((c, i) => (
              <Tag key={i} color="processing" style={{ fontSize: 13, padding: '4px 10px' }}>
                {c.trim()}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {paper.dialogues && (
        <Card title="理论对话" size="small" className="section-card">
          <Paragraph style={{ lineHeight: 1.9, marginBottom: 12 }}>{paper.dialogues}</Paragraph>
          {(() => {
            const related = findRelated(paper.paper_id).filter((r) => relatedBriefs[r.paperId])
            if (!related.length) return null
            return (
              <div className="dialogue-links">
                <Divider style={{ margin: '4px 0 12px' }} />
                <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 8 }}>
                  🕸️ 库内可跳转的对话文献（{related.length}）
                </Text>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {related.map((r) => {
                    const b = relatedBriefs[r.paperId]
                    const meta = RELATION_TYPE_META[r.type as RelationType]
                    return (
                      <Link key={r.paperId} to={`/paper/${r.paperId}`} className="dialogue-link-item">
                        <Tag color={meta.color} style={{ fontSize: 11, marginRight: 8, flexShrink: 0 }}>
                          {r.direction === 'out' ? '引→' : '←被引'} {meta.label}
                        </Tag>
                        <span className="dialogue-link-title">
                          {b.title}
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                            {b.author}{b.year ? ` · ${b.year}` : ''}
                          </Text>
                        </span>
                      </Link>
                    )
                  })}
                </Space>
              </div>
            )
          })()}
        </Card>
      )}

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

      <Modal
        title="导出引用"
        open={citeModalOpen}
        onCancel={() => setCiteModalOpen(false)}
        footer={null}
        width={680}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {CITE_FORMATS.map(({ key, label, fn }) => {
            const text = fn(paper)
            return (
              <div key={key}>
                <Space style={{ marginBottom: 6 }}>
                  <Text strong>{label}</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copyCitation(text)}>
                    复制
                  </Button>
                </Space>
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.28)', padding: 12, borderRadius: 4, fontSize: 12.5,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, lineHeight: 1.7,
                  }}
                >
                  {text}
                </pre>
              </div>
            )
          })}
        </Space>
      </Modal>
    </div>
  )
}
