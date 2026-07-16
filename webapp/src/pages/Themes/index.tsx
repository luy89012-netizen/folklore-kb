import React, { useEffect, useState } from 'react'
import { Tabs, Card, Typography, Tag, Space, Divider, Spin } from 'antd'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { fetchAllPapers, THEME_META, Paper } from '../../api'
import { THEME_REVIEWS } from '../../data/themes'
import './index.css'

const { Title, Paragraph, Text } = Typography

/** 极简 markdown 渲染：只处理 ## 标题、**粗体**、段落分隔 */
function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n')
  const blocks: React.ReactNode[] = []
  let currentPara: string[] = []
  const flushPara = () => {
    if (currentPara.length > 0) {
      const text = currentPara.join(' ')
      blocks.push(
        <Paragraph key={blocks.length} style={{ lineHeight: 1.9, fontSize: 14 }}>
          {renderInline(text)}
        </Paragraph>,
      )
      currentPara = []
    }
  }
  lines.forEach((line, i) => {
    if (/^##\s+/.test(line)) {
      flushPara()
      blocks.push(
        <Title key={`h-${i}`} level={4} style={{ marginTop: 24, marginBottom: 12 }}>
          {line.replace(/^##\s+/, '')}
        </Title>,
      )
    } else if (line.trim() === '') {
      flushPara()
    } else {
      currentPara.push(line)
    }
  })
  flushPara()
  return blocks
}

function renderInline(text: string): React.ReactNode {
  // 处理 **粗体** 和 [文本](url)
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index))
    if (m[1]) parts.push(<b key={key++}>{m[1]}</b>)
    else if (m[2] && m[3]) parts.push(<a key={key++} href={m[3]} target="_blank" rel="noreferrer">{m[2]}</a>)
    lastIdx = regex.lastIndex
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}

export default function ThemesPage() {
  const { themeId } = useParams<{ themeId?: string }>()
  const navigate = useNavigate()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const activeKey = themeId || THEME_REVIEWS[0].id

  useEffect(() => {
    fetchAllPapers()
      .then(setPapers)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  const paperMap = new Map(papers.map((p) => [p.paper_id, p]))
  const active = THEME_REVIEWS.find((t) => t.id === activeKey) || THEME_REVIEWS[0]

  return (
    <div className="themes-page">
      <Tabs
        activeKey={activeKey}
        onChange={(k) => navigate(`/themes/${k}`)}
        type="card"
        items={THEME_REVIEWS.map((t) => ({
          key: t.id,
          label: (
            <span>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: t.color,
                borderRadius: '50%',
                marginRight: 8,
              }} />
              {t.label}
            </span>
          ),
        }))}
      />
      <div className="theme-content">
        <div className="theme-header" style={{ borderLeft: `4px solid ${active.color}` }}>
          <Space direction="vertical" size={8}>
            <div>
              <Tag color={THEME_META[active.id]?.color}>{active.id.toUpperCase()}</Tag>
              <Title level={3} style={{ display: 'inline-block', margin: 0 }}>
                {active.label}
              </Title>
            </div>
            <Text type="secondary" italic>{active.short}</Text>
          </Space>
        </div>

        <Divider />

        <div className="theme-review-body">{renderMarkdown(active.review)}</div>

        <Divider titlePlacement="left">相关文献（{active.paperIds.length} 篇）</Divider>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {active.paperIds.map((pid) => {
            const p = paperMap.get(pid)
            if (!p) return null
            return (
              <Link key={pid} to={`/paper/${pid}`}>
                <Card size="small" hoverable className="theme-related-card">
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <div>
                      <Text strong>{p.title}</Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        {p.author} · {p.year}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{p.publication}</Text>
                  </Space>
                </Card>
              </Link>
            )
          })}
        </Space>
      </div>
    </div>
  )
}
