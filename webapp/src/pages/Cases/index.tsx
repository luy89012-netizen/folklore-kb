import { useEffect, useMemo, useState } from 'react'
import { Card, Tag, Typography, Spin, Empty, Space, Segmented, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { fetchAllPapers, Paper } from '../../api'

const { Text, Paragraph, Title } = Typography

interface CaseItem {
  paper: Paper
  case_name: string
  case_detail: string
  how_used: string
  extended_reading: string
  source_note: string
  objects: string[]
}

export default function CasesPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [objFilter, setObjFilter] = useState<string>('all')
  const [randomSeed, setRandomSeed] = useState(0)

  useEffect(() => {
    fetchAllPapers().then(setPapers).finally(() => setLoading(false))
  }, [])

  const cases: CaseItem[] = useMemo(() => {
    return papers
      .filter((p) => (p.extra as any)?.case_analysis)
      .map((p) => {
        const c = (p.extra as any).case_analysis
        const tags = (p.extra as any)?.tags || {}
        return {
          paper: p,
          case_name: c.case_name || '',
          case_detail: c.case_detail || '',
          how_used: c.how_used || '',
          extended_reading: c.extended_reading || '',
          source_note: c.source_note || '',
          objects: tags.object || [],
        }
      })
  }, [papers])

  // 按研究对象聚合（出现>=2次的才作为筛选项）
  const objectOptions = useMemo(() => {
    const cnt: Record<string, number> = {}
    cases.forEach((c) => c.objects.forEach((o) => { cnt[o] = (cnt[o] || 0) + 1 }))
    return Object.entries(cnt)
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([o, n]) => ({ label: `${o}（${n}）`, value: o }))
  }, [cases])

  const filtered = useMemo(() => {
    if (objFilter === 'all') return cases
    return cases.filter((c) => c.objects.includes(objFilter))
  }, [cases, objFilter])

  // 每日案例：以日期为种子取一个（randomSeed>0 时改用随机）
  const daily = useMemo(() => {
    if (!cases.length) return null
    if (randomSeed > 0) return cases[Math.floor(Math.random() * cases.length)]
    const day = Math.floor(Date.now() / 86400000)
    return cases[day % cases.length]
  }, [cases, randomSeed])

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (!cases.length) return <Empty description="还没有案例数据" />

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {daily && (
        <Card
          style={{ marginBottom: 24, borderLeft: '4px solid #b08d57' }}
          title={
            <Space>
              <span>📅 每日案例</span>
              <Button size="small" type="text" icon={<ReloadOutlined />} onClick={() => setRandomSeed(Math.random())}>
                换一个
              </Button>
            </Space>
          }
        >
          <Title level={5} style={{ marginTop: 0 }}>{daily.case_name}</Title>
          <Paragraph style={{ lineHeight: 1.9 }}>{daily.case_detail}</Paragraph>
          <Paragraph style={{ lineHeight: 1.9 }}>
            <Text strong>论证角色：</Text>{daily.how_used}
          </Paragraph>
          <Link to={`/paper/${daily.paper.paper_id}`}>
            <Text style={{ color: '#b08d57' }}>→ {daily.paper.title}</Text>
          </Link>
        </Card>
      )}

      <div style={{ marginBottom: 16, overflowX: 'auto' }}>
        <Segmented
          value={objFilter}
          onChange={(v) => setObjFilter(v as string)}
          options={[{ label: `全部（${cases.length}）`, value: 'all' }, ...objectOptions]}
        />
      </div>

      {filtered.map((c) => (
        <Card key={c.paper.paper_id} size="small" style={{ marginBottom: 12 }} hoverable>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <div>
              {c.objects.slice(0, 3).map((o) => (
                <Tag key={o} color="default" style={{ fontSize: 11 }}>{o}</Tag>
              ))}
            </div>
            <Text strong style={{ fontSize: 15 }}>{c.case_name}</Text>
            <Paragraph type="secondary" ellipsis={{ rows: 2, expandable: true, symbol: '展开' }} style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.8 }}>
              {c.case_detail}
            </Paragraph>
            <Link to={`/paper/${c.paper.paper_id}`}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                出自：{c.paper.title}（{c.paper.year}）→
              </Text>
            </Link>
          </Space>
        </Card>
      ))}
    </div>
  )
}
