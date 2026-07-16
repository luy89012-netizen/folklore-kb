import { useEffect, useMemo, useState } from 'react'
import { Card, List, Typography, Space, Tag, Spin, Empty, Divider, Alert, Button, Select } from 'antd'
import { LinkOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons'
import { fetchWeeklyFeed, WeeklyFeedItem } from '../../api'
import './index.css'

const { Title, Text, Paragraph } = Typography

// 分类元数据（英文枚举 → 中文标签 + 颜色）
const FIELD_META: Record<string, { label: string; color: string }> = {
  folklore: { label: '民俗学', color: 'green' },
  anthropology: { label: '人类学', color: 'blue' },
  heritage: { label: '遗产研究', color: 'geekblue' },
  religion: { label: '宗教研究', color: 'volcano' },
  interdisciplinary: { label: '跨学科', color: 'magenta' },
}

const METHOD_META: Record<string, { label: string; color: string }> = {
  ethnography: { label: '民族志', color: 'cyan' },
  archival: { label: '档案研究', color: 'gold' },
  theoretical: { label: '理论', color: 'purple' },
  mixed: { label: '混合方法', color: 'lime' },
  review: { label: '综述', color: 'default' },
  digital: { label: '数字方法', color: 'blue' },
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  empirical: { label: '经验研究', color: 'orange' },
  theory_building: { label: '理论建构', color: 'red' },
  theory_review: { label: '理论回顾', color: 'volcano' },
  disciplinary_history: { label: '学术史', color: 'gold' },
  book_review: { label: '书评', color: 'default' },
  editorial: { label: '编辑按语', color: 'default' },
  essay: { label: '评论/随笔', color: 'blue' },
}

const ALL = '__all__'

export default function WeeklyPage() {
  const [items, setItems] = useState<WeeklyFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fField, setFField] = useState<string>(ALL)
  const [fMethod, setFMethod] = useState<string>(ALL)
  const [fType, setFType] = useState<string>(ALL)

  const reload = () => {
    setLoading(true)
    fetchWeeklyFeed(500)
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  // 筛选后
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (fField !== ALL && it.field !== fField) return false
      if (fMethod !== ALL && it.method !== fMethod) return false
      if (fType !== ALL && it.paper_type !== fType) return false
      return true
    })
  }, [items, fField, fMethod, fType])

  // 按周分组
  const grouped = filtered.reduce<Record<string, WeeklyFeedItem[]>>((acc, it) => {
    const w = it.week_of || '未分周'
    if (!acc[w]) acc[w] = []
    acc[w].push(it)
    return acc
  }, {})
  const weeks = Object.keys(grouped).sort().reverse()

  // 生成筛选下拉选项（只从当前数据中提取真实存在的值）
  const fieldOptions = useMemo(() => {
    const s = new Set(items.map((i) => i.field).filter(Boolean) as string[])
    return [{ value: ALL, label: `全部领域 (${items.length})` }].concat(
      Array.from(s).map((k) => ({
        value: k,
        label: `${FIELD_META[k]?.label || k} (${items.filter((i) => i.field === k).length})`,
      })),
    )
  }, [items])

  const methodOptions = useMemo(() => {
    const s = new Set(items.map((i) => i.method).filter(Boolean) as string[])
    return [{ value: ALL, label: `全部方法 (${items.length})` }].concat(
      Array.from(s).map((k) => ({
        value: k,
        label: `${METHOD_META[k]?.label || k} (${items.filter((i) => i.method === k).length})`,
      })),
    )
  }, [items])

  const typeOptions = useMemo(() => {
    const s = new Set(items.map((i) => i.paper_type).filter(Boolean) as string[])
    return [{ value: ALL, label: `全部类型 (${items.length})` }].concat(
      Array.from(s).map((k) => ({
        value: k,
        label: `${TYPE_META[k]?.label || k} (${items.filter((i) => i.paper_type === k).length})`,
      })),
    )
  }, [items])

  const hasFilter = fField !== ALL || fMethod !== ALL || fType !== ALL

  return (
    <div className="weekly-page">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>⚡ 新作速览</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            自动抓取民俗学、人类学、遗产研究领域的新作，每周一 09:00 更新
          </Text>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={reload}>刷新</Button>
      </div>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Space wrap size={8} style={{ width: '100%' }}>
          <Space size={4}>
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>筛选：</Text>
          </Space>
          <Select
            value={fField}
            onChange={setFField}
            options={fieldOptions}
            style={{ minWidth: 160 }}
            size="middle"
          />
          <Select
            value={fMethod}
            onChange={setFMethod}
            options={methodOptions}
            style={{ minWidth: 160 }}
            size="middle"
          />
          <Select
            value={fType}
            onChange={setFType}
            options={typeOptions}
            style={{ minWidth: 160 }}
            size="middle"
          />
          {hasFilter && (
            <Button
              size="small"
              type="link"
              onClick={() => { setFField(ALL); setFMethod(ALL); setFType(ALL) }}
            >
              清空筛选
            </Button>
          )}
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
            当前：{filtered.length} / {items.length} 篇
          </Text>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message="说明"
        description={
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            <Text>
              数据源：Journal of American Folklore · Journal of Folklore Research · Western Folklore ·
              Cultural Anthropology · American Ethnologist · International Journal of Heritage Studies ·
              Journal of the Royal Anthropological Institute · Museum & Society
            </Text>
            <Text type="secondary">
              为保证内容有效性，仅收录含英文摘要的论文；中文速读与三维分类由 DeepSeek 自动生成
            </Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : filtered.length === 0 ? (
        <Empty
          description={
            hasFilter
              ? '没有符合当前筛选条件的论文，试试清空筛选'
              : '还没有抓取到新文献，定时任务将于每周一早上 9:00 自动运行'
          }
        />
      ) : (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          {weeks.map((week) => (
            <div key={week}>
              <Divider titlePlacement="left">
                <Text strong>📅 {week} 周</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  {grouped[week].length} 篇
                </Text>
              </Divider>
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2 }}
                dataSource={grouped[week]}
                renderItem={(it) => (
                  <List.Item>
                    <Card hoverable size="small" className="weekly-card">
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        {/* 分类 tags */}
                        <div>
                          {it.field && FIELD_META[it.field] && (
                            <Tag color={FIELD_META[it.field].color} style={{ fontSize: 11 }}>
                              📚 {FIELD_META[it.field].label}
                            </Tag>
                          )}
                          {it.method && METHOD_META[it.method] && (
                            <Tag color={METHOD_META[it.method].color} style={{ fontSize: 11 }}>
                              🔍 {METHOD_META[it.method].label}
                            </Tag>
                          )}
                          {it.paper_type && TYPE_META[it.paper_type] && (
                            <Tag color={TYPE_META[it.paper_type].color} style={{ fontSize: 11 }}>
                              📝 {TYPE_META[it.paper_type].label}
                            </Tag>
                          )}
                          {it.source && (
                            <Tag style={{ fontSize: 11 }}>{it.source}</Tag>
                          )}
                        </div>
                        <Text strong style={{ fontSize: 14, lineHeight: 1.5 }}>{it.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {it.authors} · {it.year}
                        </Text>

                        {/* 中文速读区块 */}
                        {it.summary_zh && (
                          <div className="zh-summary">
                            <div className="zh-summary-row">
                              <span className="zh-summary-label">🎯 核心观点</span>
                              <span className="zh-summary-text">{it.summary_zh}</span>
                            </div>
                            {it.theory && it.theory !== '无明显理论指向' && (
                              <div className="zh-summary-row">
                                <span className="zh-summary-label">🔬 理论</span>
                                <span className="zh-summary-text">{it.theory}</span>
                              </div>
                            )}
                            {it.innovation && it.innovation !== '摘要信息不足以判断' && (
                              <div className="zh-summary-row">
                                <span className="zh-summary-label">💡 创新点</span>
                                <span className="zh-summary-text">{it.innovation}</span>
                              </div>
                            )}
                            {it.keywords_zh && (
                              <div style={{ marginTop: 4 }}>
                                {it.keywords_zh.split(/[,，]/).map((kw, idx) => (
                                  <Tag key={idx} color="purple" style={{ fontSize: 11, marginBottom: 2 }}>
                                    {kw.trim()}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {it.abstract && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2, expandable: true, symbol: '展开原文摘要' }}
                            style={{ fontSize: 12, marginBottom: 0 }}
                          >
                            <Text type="secondary" style={{ fontSize: 11, marginRight: 4 }}>[原文]</Text>
                            {it.abstract}
                          </Paragraph>
                        )}
                        {it.link && (
                          <a href={it.link} target="_blank" rel="noreferrer">
                            <Button type="link" icon={<LinkOutlined />} size="small" style={{ padding: 0 }}>
                              查看原文
                            </Button>
                          </a>
                        )}
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </div>
          ))}
        </Space>
      )}
    </div>
  )
}
