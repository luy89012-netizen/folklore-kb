import { useEffect, useMemo, useState } from 'react'
import { Input, Card, Tag, Typography, Spin, Empty, Space, Segmented } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchAllPapers, CATEGORY_META, Paper } from '../../api'
import { fetchWeeklyFeed, WeeklyFeedItem } from '../../api/notes'

const { Text, Paragraph } = Typography

/** 简易高亮组件 */
function Hl({ text, kw }: { text: string; kw: string }) {
  if (!kw || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(kw.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#ffe58f', padding: 0 }}>{text.slice(idx, idx + kw.length)}</mark>
      {text.slice(idx + kw.length)}
    </>
  )
}

export default function SearchPage() {
  const [sp, setSp] = useSearchParams()
  const [kw, setKw] = useState(sp.get('q') || '')
  const [scope, setScope] = useState<string>('all')
  const [papers, setPapers] = useState<Paper[]>([])
  const [feed, setFeed] = useState<WeeklyFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllPapers(), fetchWeeklyFeed(500)])
      .then(([p, f]) => { setPapers(p); setFeed(f) })
      .finally(() => setLoading(false))
  }, [])

  const q = kw.trim().toLowerCase()

  const paperHits = useMemo(() => {
    if (!q) return []
    return papers.filter((p) => {
      const hay = [p.title, p.title_en, p.author, p.abstract, p.key_concepts, p.publication]
        .filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    }).slice(0, 50)
  }, [papers, q])

  const feedHits = useMemo(() => {
    if (!q) return []
    return feed.filter((f) => {
      const hay = [f.title, f.authors, f.abstract, f.summary_zh, f.keywords_zh, f.source]
        .filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    }).slice(0, 50)
  }, [feed, q])

  const showPapers = scope === 'all' || scope === 'papers'
  const showFeed = scope === 'all' || scope === 'weekly'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Input
        size="large"
        prefix={<SearchOutlined />}
        placeholder="搜索标题 / 作者 / 摘要 / 关键概念……"
        value={kw}
        onChange={(e) => { setKw(e.target.value); setSp(e.target.value ? { q: e.target.value } : {}, { replace: true }) }}
        allowClear
        autoFocus
        style={{ marginBottom: 16 }}
      />
      <Segmented
        value={scope}
        onChange={(v) => setScope(v as string)}
        options={[
          { label: `全部（${paperHits.length + feedHits.length}）`, value: 'all' },
          { label: `文献库（${paperHits.length}）`, value: 'papers' },
          { label: `新作速览（${feedHits.length}）`, value: 'weekly' },
        ]}
        style={{ marginBottom: 20 }}
      />

      {loading && <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />}
      {!loading && !q && (
        <Empty description="输入关键词开始搜索（支持中英文）" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
      )}
      {!loading && q && paperHits.length + feedHits.length === 0 && (
        <Empty description={`没有找到与「${kw}」相关的内容`} style={{ marginTop: 60 }} />
      )}

      {showPapers && paperHits.map((p) => (
        <Link key={p.paper_id} to={`/paper/${p.paper_id}`}>
          <Card size="small" hoverable style={{ marginBottom: 10 }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <div>
                <Tag color={CATEGORY_META[p.category || '']?.color}>{CATEGORY_META[p.category || '']?.label || p.category}</Tag>
                <Text strong><Hl text={p.title} kw={q} /></Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <Hl text={`${p.author || ''} · ${p.year || ''} · ${p.publication || ''}`} kw={q} />
              </Text>
              {p.abstract && (
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 0 }}>
                  <Hl text={p.abstract.slice(0, 200)} kw={q} />
                </Paragraph>
              )}
            </Space>
          </Card>
        </Link>
      ))}

      {showFeed && feedHits.map((f) => (
        <Card key={f.feed_id} size="small" style={{ marginBottom: 10 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div>
              <Tag color="#8c8c8c">新作</Tag>
              {f.link ? (
                <a href={f.link} target="_blank" rel="noreferrer"><Text strong><Hl text={f.title} kw={q} /></Text></a>
              ) : (
                <Text strong><Hl text={f.title} kw={q} /></Text>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{f.source} · {f.year}</Text>
            {f.summary_zh && (
              <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 0 }}>
                <Hl text={f.summary_zh} kw={q} />
              </Paragraph>
            )}
          </Space>
        </Card>
      ))}
    </div>
  )
}
