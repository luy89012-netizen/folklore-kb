import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Tag, Typography, Spin, Divider, Space } from 'antd'
import { Link } from 'react-router-dom'
import { fetchAllPapers, CATEGORY_META, THEME_META, Paper } from '../../api'
import { THEME_REVIEWS } from '../../data/themes'
import { RELATIONS } from '../../data/relations'
import './index.css'

const { Title, Paragraph, Text } = Typography

export default function HomePage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllPapers()
      .then(setPapers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (error) return <div style={{ color: 'red', padding: 24 }}>加载失败：{error}</div>

  // 分类统计
  const catCounts: Record<string, number> = {}
  const themeCounts: Record<string, number> = {}
  papers.forEach((p) => {
    if (p.category) catCounts[p.category] = (catCounts[p.category] || 0) + 1
    ;(p.themes || '').split(',').filter(Boolean).forEach((t) => {
      const k = t.trim()
      themeCounts[k] = (themeCounts[k] || 0) + 1
    })
  })

  return (
    <div className="home-page">
      <div className="home-hero">
        <Title level={2} style={{ marginBottom: 8 }}>民俗学知识库</Title>
        <Paragraph type="secondary" style={{ fontSize: 15, marginBottom: 0 }}>
          Folklore Studies · Anthropology · Heritage · A Personal Reading Corpus
        </Paragraph>
        <Paragraph style={{ marginTop: 16, marginBottom: 0, fontSize: 14, lineHeight: 1.8 }}>
          这是一个按主题组织、可持续扩展的个人研究库。收录 <b>{papers.length}</b> 篇文献，
          横跨 <b>{Object.keys(catCounts).length}</b> 个分类维度、
          <b> {THEME_REVIEWS.length}</b> 大理论主题、
          <b> {RELATIONS.length}</b> 条文献间理论对话关系。
        </Paragraph>
      </div>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="文献总数" value={papers.length} suffix="篇" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="经典文献" value={catCounts.classic || 0} suffix="篇" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="前沿论文" value={catCounts.frontier || 0} suffix="篇" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="理论对话" value={RELATIONS.length} suffix="条" />
          </Card>
        </Col>
      </Row>

      <Divider titlePlacement="left">分类分布</Divider>
      <Row gutter={[16, 16]}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <Col xs={24} sm={12} md={8} lg={6} key={key}>
            <Link to={`/papers?category=${key}`} style={{ display: 'block' }}>
              <Card hoverable>
                <Space direction="vertical" size={4}>
                  <Tag color={meta.color}>{meta.label}</Tag>
                  <Text style={{ fontSize: 24, fontWeight: 600 }}>{catCounts[key] || 0}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{meta.desc}</Text>
                </Space>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Divider titlePlacement="left">主题综述入口</Divider>
      <Row gutter={[16, 16]}>
        {THEME_REVIEWS.map((theme) => (
          <Col xs={24} sm={12} md={8} key={theme.id}>
            <Link to={`/themes/${theme.id}`} style={{ display: 'block' }}>
              <Card hoverable className="theme-entry-card" style={{ borderLeft: `4px solid ${theme.color}` }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>
                    <Tag color={THEME_META[theme.id]?.color}>{theme.id.toUpperCase()}</Tag>
                    <Text strong style={{ fontSize: 16 }}>{theme.label}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>{theme.short}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    收录 {theme.paperIds.length} 篇 · {themeCounts[theme.id] || 0} 篇文献标签命中
                  </Text>
                </Space>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  )
}
