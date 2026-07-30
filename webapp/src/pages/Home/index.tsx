import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Tag, Typography, Spin, Divider, Space, Button } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { fetchAllPapers, CATEGORY_META, THEME_META, Paper } from '../../api'
import { THEME_REVIEWS } from '../../data/themes'
import { DAILY_TOPICS } from '../../data/dailyTopics'
import './index.css'

const { Title, Paragraph, Text } = Typography

/** 以"天"为种子的稳定伪随机选择：同一天每次打开都一样 */
function pickByDay<T>(arr: T[], salt: number = 0): T | null {
  if (!arr.length) return null
  const day = Math.floor(Date.now() / 86400000)
  return arr[(day + salt) % arr.length]
}

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
  const countries = new Set<string>()
  const years: number[] = []
  papers.forEach((p) => {
    if (p.category) catCounts[p.category] = (catCounts[p.category] || 0) + 1
    ;(p.themes || '').split(',').filter(Boolean).forEach((t) => {
      const k = t.trim()
      themeCounts[k] = (themeCounts[k] || 0) + 1
    })
    const country = (p as any).extra?.country
    if (country) countries.add(country)
    if (p.year && p.year > 1000) years.push(p.year)
  })
  const yearMin = years.length ? Math.min(...years) : 0
  const yearMax = years.length ? Math.max(...years) : 0

  // ===== 每日三卡 =====
  const casePapers = papers.filter((p) => (p.extra as any)?.case_analysis)
  const dailyCase = pickByDay(casePapers, 1)
  const dailyCaseData: any = dailyCase ? (dailyCase.extra as any).case_analysis : null
  // 推荐文献：优先经典库（有深度精读），以天轮换
  const classicPapers = papers.filter((p) => p.category === 'classic')
  const dailyPaper = pickByDay(classicPapers.length ? classicPapers : papers, 2)
  const dailyTopic = pickByDay(DAILY_TOPICS, 3)
  const topicPapers = dailyTopic
    ? dailyTopic.paperIds.map((id) => papers.find((p) => p.paper_id === id)).filter(Boolean) as Paper[]
    : []

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
          <b> {THEME_REVIEWS.length}</b> 大理论主题，
          覆盖 <b>{countries.size}</b> 个国别民俗学传统，时间跨度 <b>{yearMax - yearMin}</b> 年（{yearMin}—{yearMax}）。
        </Paragraph>
      </div>

      <Divider titlePlacement="left">☀️ 今日</Divider>
      <Row gutter={[16, 16]}>
        {/* 每日专题 */}
        {dailyTopic && (
          <Col xs={24} lg={12}>
            <Card
              title={<span>🧭 每日专题 · {dailyTopic.topic}</span>}
              style={{ height: '100%', borderTop: '3px solid #2c3e50' }}
              size="small"
              className="folk-corner"
            >
              <Paragraph strong style={{ fontSize: 14, marginBottom: 10 }}>{dailyTopic.oneLiner}</Paragraph>
              <Paragraph
                type="secondary"
                style={{ fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 12 }}
                ellipsis={{ rows: 8, expandable: true, symbol: '展开全文' }}
              >
                {dailyTopic.insight}
              </Paragraph>
              {topicPapers.length > 0 && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>延伸阅读：</Text>
                  {topicPapers.slice(0, 4).map((p) => (
                    <div key={p.paper_id} style={{ marginTop: 4 }}>
                      <Link to={`/paper/${p.paper_id}`}>
                        <Text style={{ fontSize: 12.5, color: '#2c3e50' }}>
                          <RightOutlined style={{ fontSize: 10, marginRight: 4 }} />
                          {p.title}（{p.author?.split(/[,，;；]/)[0]}, {p.year}）
                        </Text>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        )}

        <Col xs={24} lg={12}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* 每日案例 */}
            {dailyCase && dailyCaseData && (
              <Card
                title={<span>🔬 每日案例</span>}
                size="small"
                style={{ borderTop: '3px solid #b08d57' }}
                extra={<Link to="/cases"><Text type="secondary" style={{ fontSize: 12 }}>案例库 →</Text></Link>}
              >
                <Text strong style={{ fontSize: 14 }}>{dailyCaseData.case_name}</Text>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8, marginBottom: 8 }}
                  ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                >
                  {dailyCaseData.case_detail}
                </Paragraph>
                <Link to={`/paper/${dailyCase.paper_id}`}>
                  <Text type="secondary" style={{ fontSize: 12 }}>出自：{dailyCase.title} →</Text>
                </Link>
              </Card>
            )}

            {/* 每日推荐文献 */}
            {dailyPaper && (
              <Card
                title={<span>📖 每日推荐</span>}
                size="small"
                style={{ borderTop: '3px solid #52c41a' }}
              >
                <Link to={`/paper/${dailyPaper.paper_id}`}>
                  <Text strong style={{ fontSize: 14, color: '#2c3e50' }}>{dailyPaper.title}</Text>
                </Link>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dailyPaper.author} · {dailyPaper.year} {dailyPaper.publication ? `· ${dailyPaper.publication}` : ''}
                  </Text>
                </div>
                {dailyPaper.abstract && (
                  <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.8, marginTop: 8, marginBottom: 0 }} ellipsis={{ rows: 3 }}>
                    {dailyPaper.abstract.replace(/【[^】]*】/g, ' ').trim().slice(0, 180)}
                  </Paragraph>
                )}
                <Link to={`/paper/${dailyPaper.paper_id}`}>
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 4 }}>去精读 →</Button>
                </Link>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

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
            <Statistic title="覆盖国别" value={countries.size} suffix="国" />
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
