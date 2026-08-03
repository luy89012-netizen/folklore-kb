import { useEffect, useMemo, useState } from 'react'
import { Card, Typography, Select, Space, Tag, Spin, Empty } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchAllPapers, Paper } from '../../api'
import { RELATIONS, RELATION_TYPE_META, RelationType, findRelated } from '../../data/relations'
import './index.css'

const { Title, Text, Paragraph } = Typography

export default function RelationsPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useSearchParams()
  const selected = params.get('p') || undefined

  useEffect(() => {
    fetchAllPapers()
      .then(setPapers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const paperMap = useMemo(() => {
    const m: Record<string, Paper> = {}
    papers.forEach((p) => { m[p.paper_id] = p })
    return m
  }, [papers])

  // 只在关系图里出现过的文献才可选（有边的）
  const nodesInGraph = useMemo(() => {
    const s = new Set<string>()
    RELATIONS.forEach((r) => { s.add(r.source); s.add(r.target) })
    return s
  }, [])

  const options = useMemo(
    () =>
      papers
        .filter((p) => nodesInGraph.has(p.paper_id))
        .map((p) => ({ value: p.paper_id, label: `${p.title.slice(0, 42)}${p.year ? `（${p.year}）` : ''}` })),
    [papers, nodesInGraph],
  )

  // 被引用最多的文献 top（作为探索起点推荐）
  const mostCited = useMemo(() => {
    const inDeg: Record<string, number> = {}
    RELATIONS.forEach((r) => { inDeg[r.target] = (inDeg[r.target] || 0) + 1 })
    return Object.entries(inDeg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([pid, count]) => ({ pid, count }))
  }, [])

  const related = selected ? findRelated(selected).filter((r) => paperMap[r.paperId]) : []
  const outRels = related.filter((r) => r.direction === 'out')
  const inRels = related.filter((r) => r.direction === 'in')

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const renderRelItem = (r: { paperId: string; type: RelationType }) => {
    const p = paperMap[r.paperId]
    const meta = RELATION_TYPE_META[r.type]
    return (
      <Link key={r.paperId} to={`/relations?p=${r.paperId}`} className="rel-item">
        <Tag color={meta.color} style={{ fontSize: 11, marginRight: 8, flexShrink: 0 }}>{meta.label}</Tag>
        <span className="rel-item-title">
          {p.title}
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
            {p.author}{p.year ? ` · ${p.year}` : ''}
          </Text>
        </span>
      </Link>
    )
  }

  return (
    <div className="relations-page">
      <div style={{ marginBottom: 18 }}>
        <Title level={4} style={{ margin: 0 }}>🕸️ 文献对话网</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          顺着学术谱系走——选一篇文献，看它和库里哪些文献互相援引、对读、批判
        </Text>
      </div>

      <Select
        showSearch
        allowClear
        placeholder="选一篇文献，看它的对话关系"
        value={selected}
        onChange={(v) => setParams(v ? { p: v } : {})}
        options={options}
        optionFilterProp="label"
        style={{ width: '100%', maxWidth: 560, marginBottom: 20 }}
        size="large"
      />

      {!selected && (
        <Card title="🔥 库里被援引最多的文献（从这些开始探索）" size="small" className="rel-card">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {mostCited.map(({ pid, count }) => {
              const p = paperMap[pid]
              if (!p) return null
              return (
                <Link key={pid} to={`/relations?p=${pid}`} className="rel-item">
                  <Tag color="#d4b483" style={{ fontSize: 11, marginRight: 8, flexShrink: 0 }}>被引 {count}</Tag>
                  <span className="rel-item-title">
                    {p.title}
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>{p.author}</Text>
                  </span>
                </Link>
              )
            })}
          </Space>
        </Card>
      )}

      {selected && paperMap[selected] && (
        <>
          <Card className="rel-center-card" size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>当前文献</Text>
            <Title level={5} style={{ margin: '4px 0 2px' }}>
              <Link to={`/paper/${selected}`}>{paperMap[selected].title}</Link>
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {paperMap[selected].author}{paperMap[selected].year ? ` · ${paperMap[selected].year}` : ''}
            </Text>
            {paperMap[selected].dialogues && (
              <Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: 8, marginBottom: 0, lineHeight: 1.8 }}>
                {paperMap[selected].dialogues!.slice(0, 120)}…
              </Paragraph>
            )}
          </Card>

          {related.length === 0 ? (
            <Empty description="这篇文献暂无库内可跳转的对话关系" style={{ marginTop: 40 }} />
          ) : (
            <div className="rel-two-col">
              <Card title={`它援引/对读的文献（${outRels.length}）`} size="small" className="rel-card">
                {outRels.length ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {outRels.map(renderRelItem)}
                  </Space>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>无</Text>
                )}
              </Card>
              <Card title={`援引/对读它的文献（${inRels.length}）`} size="small" className="rel-card">
                {inRels.length ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {inRels.map(renderRelItem)}
                  </Space>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>无</Text>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
