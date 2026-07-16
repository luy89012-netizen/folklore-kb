import { useEffect, useState } from 'react'
import { Card, List, Typography, Space, Tag, Spin, Empty, Divider, Alert, Button } from 'antd'
import { LinkOutlined, ReloadOutlined } from '@ant-design/icons'
import { fetchWeeklyFeed, WeeklyFeedItem } from '../../api'
import './index.css'

const { Title, Text, Paragraph } = Typography

export default function WeeklyPage() {
  const [items, setItems] = useState<WeeklyFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = () => {
    setLoading(true)
    fetchWeeklyFeed(200)
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  // 按周分组
  const grouped = items.reduce<Record<string, WeeklyFeedItem[]>>((acc, it) => {
    const w = it.week_of || '未分周'
    if (!acc[w]) acc[w] = []
    acc[w].push(it)
    return acc
  }, {})
  const weeks = Object.keys(grouped).sort().reverse()

  return (
    <div className="weekly-page">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>⚡ 每周前沿</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            自动抓取美国 / 欧洲人类学、民俗学、遗产研究领域的新论文，每周一 09:00 更新
          </Text>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={reload}>刷新</Button>
      </div>

      <Alert
        type="info"
        showIcon
        message="抓取源"
        description={
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            <Text>
              期刊：Journal of American Folklore · Journal of Folklore Research · Western Folklore ·
              Cultural Anthropology · American Ethnologist · International Journal of Heritage Studies ·
              Journal of the Royal Anthropological Institute · Museum & Society
            </Text>
            <Text>
              关键词：intangible cultural heritage · critical heritage studies · folklore performance ·
              vernacular religion · narrative and memory · ritual and politics · digital folklore ·
              folk medicine and conspiracy · ethnography of religion · sociology of religion ·
              cultural anthropology
            </Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : items.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical" size={4}>
              <Text>还没有抓取到新文献</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                定时任务将于每周一早上 9:00 自动运行；也可以联系管理员手动触发
              </Text>
            </Space>
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
                        <div>
                          {it.keyword && (
                            <Tag color="cyan" style={{ fontSize: 11 }}>{it.keyword}</Tag>
                          )}
                          {it.source && (
                            <Tag color="default" style={{ fontSize: 11 }}>{it.source}</Tag>
                          )}
                        </div>
                        <Text strong style={{ fontSize: 14, lineHeight: 1.5 }}>{it.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {it.authors} · {it.year}
                        </Text>
                        {it.abstract && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                            style={{ fontSize: 12, marginBottom: 0 }}
                          >
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
