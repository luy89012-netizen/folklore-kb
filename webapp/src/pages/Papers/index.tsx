import { useEffect, useState, useMemo } from 'react'
import { Card, Row, Col, Tag, Input, Select, Space, Typography, Spin, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchAllPapers, CATEGORY_META, THEME_META, Paper } from '../../api'
import './index.css'

const { Text, Paragraph, Title } = Typography

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const [keyword, setKeyword] = useState('')
  const category = searchParams.get('category') || ''
  const theme = searchParams.get('theme') || ''
  const lang = searchParams.get('lang') || ''

  useEffect(() => {
    fetchAllPapers()
      .then(setPapers)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (category && p.category !== category) return false
      if (theme && !(p.themes || '').includes(theme)) return false
      if (lang && p.lang !== lang) return false
      if (keyword) {
        const kw = keyword.toLowerCase()
        return (
          (p.title || '').toLowerCase().includes(kw) ||
          (p.title_en || '').toLowerCase().includes(kw) ||
          (p.author || '').toLowerCase().includes(kw) ||
          (p.key_concepts || '').toLowerCase().includes(kw) ||
          (p.abstract || '').toLowerCase().includes(kw)
        )
      }
      return true
    })
  }, [papers, category, theme, lang, keyword])

  function setFilter(key: string, val: string) {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val)
    else next.delete(key)
    setSearchParams(next)
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />

  return (
    <div className="papers-page">
      <div className="papers-filter">
        <Space wrap size={12}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索标题 / 作者 / 关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="分类"
            value={category || undefined}
            onChange={(v) => setFilter('category', v || '')}
            allowClear
            style={{ width: 140 }}
            options={Object.entries(CATEGORY_META).map(([k, m]) => ({
              value: k,
              label: m.label,
            }))}
          />
          <Select
            placeholder="主题"
            value={theme || undefined}
            onChange={(v) => setFilter('theme', v || '')}
            allowClear
            style={{ width: 180 }}
            options={Object.entries(THEME_META).map(([k, m]) => ({
              value: k,
              label: `${k.toUpperCase()} · ${m.label}`,
            }))}
          />
          <Select
            placeholder="语言"
            value={lang || undefined}
            onChange={(v) => setFilter('lang', v || '')}
            allowClear
            style={{ width: 100 }}
            options={[
              { value: 'zh', label: '中文' },
              { value: 'en', label: '英文' },
            ]}
          />
          <Text type="secondary">共 {filtered.length} / {papers.length} 篇</Text>
        </Space>
      </div>

      {filtered.length === 0 ? (
        <Empty description="没有匹配的文献" />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.paper_id}>
              <Link to={`/paper/${p.paper_id}`} style={{ display: 'block' }}>
                <Card hoverable className="paper-card">
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div>
                      {p.category && (
                        <Tag color={CATEGORY_META[p.category]?.color}>
                          {CATEGORY_META[p.category]?.label || p.category}
                        </Tag>
                      )}
                      {(p.themes || '').split(',').filter(Boolean).slice(0, 3).map((t) => (
                        <Tag key={t.trim()} color="default" style={{ borderColor: THEME_META[t.trim()]?.color }}>
                          {THEME_META[t.trim()]?.label || t.trim()}
                        </Tag>
                      ))}
                      {p.lang === 'en' && <Tag>EN</Tag>}
                    </div>
                    <Title level={5} style={{ margin: '4px 0', lineHeight: 1.4 }}>
                      {p.title}
                    </Title>
                    {p.title_en && p.title_en !== p.title && (
                      <Text type="secondary" italic style={{ fontSize: 12 }}>
                        {p.title_en}
                      </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {p.author} · {p.year} · {p.pages}p
                    </Text>
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 3 }}
                      style={{ fontSize: 13, marginBottom: 0, lineHeight: 1.6 }}
                    >
                      {p.abstract}
                    </Paragraph>
                  </Space>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
