import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Space, Tag, Typography, Spin, Radio, Divider, Select } from 'antd'
import { Link } from 'react-router-dom'
import { fetchAllPapers, CATEGORY_META, THEME_META, Paper } from '../../api'
import { RELATIONS, EDGE_TYPE_META, EdgeType, findRelatedPapers } from '../../data/relations'
import './index.css'

const { Text, Title } = Typography

interface NodePos {
  paperId: string
  x: number
  y: number
  vx: number
  vy: number
  paper: Paper
}

/**
 * 极简力导向布局（tick 100 次得到稳定布局）
 * 不依赖 d3/g6，用几十行代码实现
 */
function layout(papers: Paper[], width: number, height: number): NodePos[] {
  const nodes: NodePos[] = papers.map((p, i) => {
    const angle = (i / papers.length) * 2 * Math.PI
    const r = Math.min(width, height) * 0.3
    return {
      paperId: p.paper_id,
      x: width / 2 + Math.cos(angle) * r,
      y: height / 2 + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      paper: p,
    }
  })
  const idx = new Map(nodes.map((n) => [n.paperId, n]))
  const edges = RELATIONS.filter((e) => idx.has(e.source) && idx.has(e.target))

  for (let iter = 0; iter < 250; iter++) {
    // 节点间斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const f = 2000 / (d * d)
        nodes[i].vx += (dx / d) * f
        nodes[i].vy += (dy / d) * f
        nodes[j].vx -= (dx / d) * f
        nodes[j].vy -= (dy / d) * f
      }
    }
    // 边引力
    for (const e of edges) {
      const s = idx.get(e.source)!
      const t = idx.get(e.target)!
      const dx = t.x - s.x
      const dy = t.y - s.y
      const d = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const target = 140
      const f = (d - target) * 0.03
      s.vx += (dx / d) * f
      s.vy += (dy / d) * f
      t.vx -= (dx / d) * f
      t.vy -= (dy / d) * f
    }
    // 中心引力
    for (const n of nodes) {
      n.vx += (width / 2 - n.x) * 0.005
      n.vy += (height / 2 - n.y) * 0.005
    }
    // 阻尼 + 位置更新
    for (const n of nodes) {
      n.vx *= 0.85
      n.vy *= 0.85
      n.x += n.vx
      n.y += n.vy
      // 边界
      n.x = Math.max(60, Math.min(width - 60, n.x))
      n.y = Math.max(60, Math.min(height - 60, n.y))
    }
  }
  return nodes
}

export default function GraphPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [colorBy, setColorBy] = useState<'category' | 'theme'>('category')
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dim, setDim] = useState({ w: 900, h: 620 })

  useEffect(() => {
    fetchAllPapers()
      .then(setPapers)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDim({ w: Math.max(600, rect.width), h: 620 })
  }, [loading])

  const nodes = useMemo(() => (papers.length ? layout(papers, dim.w, dim.h) : []), [papers, dim])
  const nodeIdx = useMemo(() => new Map(nodes.map((n) => [n.paperId, n])), [nodes])

  const visibleEdges = useMemo(() => {
    let edges = RELATIONS
    if (selectedTheme) {
      edges = edges.filter((e) => {
        const s = papers.find((p) => p.paper_id === e.source)
        const t = papers.find((p) => p.paper_id === e.target)
        return (s?.themes || '').includes(selectedTheme) || (t?.themes || '').includes(selectedTheme)
      })
    }
    if (selectedPaper) {
      edges = edges.filter((e) => e.source === selectedPaper || e.target === selectedPaper)
    }
    return edges.filter((e) => nodeIdx.has(e.source) && nodeIdx.has(e.target))
  }, [selectedTheme, selectedPaper, papers, nodeIdx])

  const relatedIds = useMemo(() => {
    if (!selectedPaper) return new Set<string>()
    const s = new Set<string>()
    visibleEdges.forEach((e) => {
      s.add(e.source)
      s.add(e.target)
    })
    return s
  }, [visibleEdges, selectedPaper])

  function nodeColor(p: Paper): string {
    if (colorBy === 'category') {
      const cat = p.category || ''
      const m: Record<string, string> = {
        classic: '#F6BD16',
        frontier: '#5B8FF9',
        textbook: '#5AD8A6',
        related: '#945FB9',
        reference: '#999',
      }
      return m[cat] || '#999'
    } else {
      const firstTheme = (p.themes || '').split(',')[0]?.trim()
      return THEME_META[firstTheme]?.color || '#999'
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const selectedPaperObj = selectedPaper ? papers.find((p) => p.paper_id === selectedPaper) : null
  const selectedRelations = selectedPaper ? findRelatedPapers(selectedPaper) : []

  return (
    <div className="graph-page">
      <div className="graph-controls">
        <Space wrap>
          <Text strong>着色：</Text>
          <Radio.Group value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
            <Radio.Button value="category">按分类</Radio.Button>
            <Radio.Button value="theme">按主题</Radio.Button>
          </Radio.Group>
          <Divider type="vertical" />
          <Text strong>主题筛选：</Text>
          <Select
            placeholder="全部主题"
            value={selectedTheme || undefined}
            onChange={(v) => setSelectedTheme(v || '')}
            allowClear
            style={{ width: 200 }}
            options={Object.entries(THEME_META).map(([k, m]) => ({
              value: k,
              label: `${k.toUpperCase()} · ${m.label}`,
            }))}
          />
          {selectedPaper && (
            <Tag color="blue" closable onClose={() => setSelectedPaper(null)}>
              聚焦：{papers.find((p) => p.paper_id === selectedPaper)?.title?.slice(0, 12)}...
            </Tag>
          )}
          <Text type="secondary">显示 {visibleEdges.length} / {RELATIONS.length} 条关系</Text>
        </Space>
      </div>

      <div className="graph-legend">
        <Space wrap size={4}>
          <Text strong style={{ fontSize: 12 }}>关系类型：</Text>
          {Object.entries(EDGE_TYPE_META).map(([k, m]) => (
            <Tag key={k} color={m.color} style={{ fontSize: 11 }}>
              — {m.label}
            </Tag>
          ))}
        </Space>
      </div>

      <div className="graph-canvas-wrap" ref={containerRef}>
        <svg width={dim.w} height={dim.h}>
          {/* edges */}
          <g>
            {visibleEdges.map((e, i) => {
              const s = nodeIdx.get(e.source)
              const t = nodeIdx.get(e.target)
              if (!s || !t) return null
              return (
                <line
                  key={i}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={EDGE_TYPE_META[e.type as EdgeType]?.color || '#ccc'}
                  strokeWidth={selectedPaper && (e.source === selectedPaper || e.target === selectedPaper) ? 2.5 : 1.2}
                  strokeOpacity={selectedPaper && !(e.source === selectedPaper || e.target === selectedPaper) ? 0.15 : 0.7}
                />
              )
            })}
          </g>
          {/* nodes */}
          <g>
            {nodes.map((n) => {
              const isSelected = n.paperId === selectedPaper
              const isRelated = relatedIds.has(n.paperId)
              const dimmed = selectedPaper && !isSelected && !isRelated
              return (
                <g
                  key={n.paperId}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: 'pointer', opacity: dimmed ? 0.3 : 1 }}
                  onClick={() => setSelectedPaper(isSelected ? null : n.paperId)}
                >
                  <circle
                    r={isSelected ? 14 : isRelated ? 11 : 8}
                    fill={nodeColor(n.paper)}
                    stroke={isSelected ? '#333' : '#fff'}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <text
                    y={-16}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#333"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {n.paper.title?.slice(0, 8) || n.paperId}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {selectedPaperObj && (
        <Card size="small" className="graph-detail-card">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <div>
              {selectedPaperObj.category && (
                <Tag color={CATEGORY_META[selectedPaperObj.category]?.color}>
                  {CATEGORY_META[selectedPaperObj.category]?.label}
                </Tag>
              )}
              <Title level={5} style={{ display: 'inline-block', margin: 0 }}>
                {selectedPaperObj.title}
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedPaperObj.author} · {selectedPaperObj.year} · {selectedPaperObj.publication}
            </Text>
            <Divider style={{ margin: '4px 0' }} />
            <Text strong style={{ fontSize: 13 }}>与其他文献的理论对话：</Text>
            {selectedRelations.map((r, i) => {
              const otherId = r.source === selectedPaper ? r.target : r.source
              const other = papers.find((p) => p.paper_id === otherId)
              return (
                <div key={i} className="graph-rel-item">
                  <Tag color={EDGE_TYPE_META[r.type].color}>{EDGE_TYPE_META[r.type].label}</Tag>
                  <Link to={`/paper/${otherId}`}>
                    <Text underline>{other?.title || otherId}</Text>
                  </Link>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    {r.label}
                  </Text>
                </div>
              )
            })}
            <Link to={`/paper/${selectedPaperObj.paper_id}`}>→ 查看完整文献详情</Link>
          </Space>
        </Card>
      )}
    </div>
  )
}
