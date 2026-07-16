import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout, Menu, Card, Tag, Empty, Spin, Space, Typography, Segmented, Breadcrumb } from 'antd'
import {
  BulbOutlined,
} from '@ant-design/icons'
import { fetchAllPapers, type Paper, CATEGORY_META, THEME_META } from '../../api/papers'
import './index.css'

const { Sider, Content } = Layout
const { Title, Paragraph, Text } = Typography

// ============================================
// 分类维度元数据
// ============================================

const TRADITION_META: Record<string, { label: string; color: string; desc: string }> = {
  anthropological_school: { label: '人类学派', color: '#1677ff', desc: '19-20世纪英美主流：Tylor/Lang/Frazer/Dorson/Dundes/Ben-Amos，比较进化论 + 学科建制' },
  performance: { label: '表演学派', color: '#ff85c0', desc: 'Bauman/Hymes 之后：把民俗看作一次次「表演事件」，关注情境、身体、互动' },
  structuralism: { label: '结构主义', color: '#722ed1', desc: 'Propp/Lévi-Strauss 传统，寻找叙事与神话的深层结构语法' },
  formalism: { label: '俄国形式主义', color: '#9254de', desc: 'Propp/Veselovsky/Meletinsky，把民间叙事作为形式系统分析' },
  functionalism: { label: '功能主义', color: '#13c2c2', desc: 'Malinowski/Bascom/Durkheim，问「民俗在社会里做什么」' },
  historical_geographic: { label: '芬兰历史地理学派', color: '#08979c', desc: 'Krohn 奠基，追溯故事变体的传播路径与原型' },
  romantic: { label: '德国浪漫主义', color: '#d4380d', desc: 'Herder/Grimm/Riehl，把民俗当作「民族精神」的表达' },
  hermeneutic: { label: '诠释-理解学派', color: '#7cb305', desc: 'Weber/Simmel/Ricoeur，从意义与主观视角进入' },
  phenomenology_religion: { label: '现象学宗教学', color: '#eb2f96', desc: 'Eliade/De Martino，把宗教-民俗作为「本体经验」分析' },
  marxist: { label: '马克思主义', color: '#f5222d', desc: 'Gramsci/Bakhtin/De Martino/苏联传统，从阶级、意识形态、霸权分析民俗' },
  cultural_studies: { label: '文化研究', color: '#fa8c16', desc: 'Bausinger/Bourdieu/Bronner，把民俗嵌入当代文化政治' },
  semiotics: { label: '符号学', color: '#a0d911', desc: 'Barthes 传统，把民俗神话解码为符号系统' },
  feminist: { label: '女性主义', color: '#eb2f96', desc: 'Eisler 等，从性别视角重读神话与文化' },
  japanese_folklore: { label: '日本民俗学', color: '#f5222d', desc: '柳田/折口/宫本/南方，独立发展的东亚民俗学传统' },
  chinese_folklore: { label: '中国民俗学', color: '#c41d7f', desc: '钟敬文/高丙中/叶舒宪，本土学科建制与研究' },
  area_studies_china: { label: '中国研究（海外）', color: '#531dab', desc: '孔飞力/王斯福 等海外汉学与中国人类学' },
}

const OBJECT_META: Record<string, { label: string; color: string; icon: string }> = {
  myth: { label: '神话', color: '#4ECDC4', icon: '🌌' },
  ritual: { label: '仪式', color: '#FFA502', icon: '🕯️' },
  tale: { label: '民间故事', color: '#26DE81', icon: '📖' },
  epic: { label: '史诗', color: '#8854D0', icon: '⚔️' },
  folksong: { label: '歌谣', color: '#45AAF2', icon: '🎵' },
  narrative: { label: '叙事', color: '#26C6DA', icon: '📝' },
  everyday_life: { label: '日常生活', color: '#FED330', icon: '🏡' },
  belief_magic: { label: '信仰与巫术', color: '#FC5C65', icon: '🔮' },
  body_gender: { label: '身体与性别', color: '#FF6B9D', icon: '💃' },
  heritage: { label: '遗产/非遗', color: '#A55EEA', icon: '🏛️' },
  identity_discipline: { label: '学科身份与方法论', color: '#778CA3', icon: '📚' },
}

const APPROACH_META: Record<string, { label: string; color: string }> = {
  comparative: { label: '比较', color: '#1890ff' },
  structural: { label: '结构分析', color: '#722ed1' },
  functional: { label: '功能分析', color: '#13c2c2' },
  historical: { label: '历史/历时', color: '#fa8c16' },
  performance_event: { label: '表演事件', color: '#eb2f96' },
  phenomenological: { label: '现象学', color: '#f5222d' },
  ethnographic: { label: '民族志', color: '#52c41a' },
  textual: { label: '文本考据', color: '#8c8c8c' },
  discursive: { label: '话语分析', color: '#faad14' },
  critical: { label: '批判', color: '#d4380d' },
}

const COUNTRY_META: Record<string, { label: string; flag: string }> = {
  Germany: { label: '德国', flag: '🇩🇪' },
  Japan: { label: '日本', flag: '🇯🇵' },
  UK: { label: '英国', flag: '🇬🇧' },
  USA: { label: '美国', flag: '🇺🇸' },
  Italy: { label: '意大利', flag: '🇮🇹' },
  'Russia/USSR': { label: '俄罗斯/苏联', flag: '🇷🇺' },
  France: { label: '法国', flag: '🇫🇷' },
  China: { label: '中国', flag: '🇨🇳' },
}

// ============================================
// 类型
// ============================================

type Dimension = 'tradition' | 'object' | 'approach' | 'country' | 'theme'

interface PaperTags {
  tradition?: string[]
  object?: string[]
  approach?: string[]
}

// ============================================
// 组件
// ============================================

export default function CategoriesPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [dimension, setDimension] = useState<Dimension>('tradition')
  const [selectedKey, setSelectedKey] = useState<string>('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchAllPapers()
      .then((rows) => {
        if (!mounted) return
        setPapers(rows)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  // 按维度构造 { 分类key: [paper, ...] }
  const grouped = useMemo(() => {
    const map: Record<string, Paper[]> = {}
    for (const p of papers) {
      const keys = getKeys(p, dimension)
      for (const k of keys) {
        if (!map[k]) map[k] = []
        map[k].push(p)
      }
    }
    return map
  }, [papers, dimension])

  // 目录树（Menu items）
  const menuItems = useMemo(() => {
    const meta = getDimensionMeta(dimension)
    // 按数量降序
    const entries = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
    return entries.map(([key, list]) => ({
      key,
      label: (
        <span className="cat-menu-label">
          <span className="cat-menu-name">{meta[key]?.label || key}</span>
          <span className="cat-menu-count">{list.length}</span>
        </span>
      ),
    }))
  }, [grouped, dimension])

  // 首次加载 + 维度切换：默认选中数量最多的分类
  useEffect(() => {
    const entries = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
    if (entries.length > 0) {
      setSelectedKey(entries[0][0])
    } else {
      setSelectedKey('')
    }
  }, [dimension, grouped])

  const currentList = grouped[selectedKey] || []
  const dimensionMeta = getDimensionMeta(dimension)
  const currentMeta = dimensionMeta[selectedKey]

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large" tip="加载文献..." />
      </div>
    )
  }

  return (
    <div className="cat-page">
      {/* 顶部维度切换 */}
      <div className="cat-toolbar">
        <Space size="middle" align="center" wrap>
          <Text strong style={{ fontSize: 15 }}>
            <BulbOutlined /> 按维度浏览：
          </Text>
          <Segmented<Dimension>
            value={dimension}
            onChange={setDimension}
            options={[
              { label: '🎭 学派/传统', value: 'tradition' },
              { label: '📖 研究对象', value: 'object' },
              { label: '🔬 方法路径', value: 'approach' },
              { label: '🌍 国别', value: 'country' },
              { label: '🎨 主题', value: 'theme' },
            ]}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            共 {papers.length} 篇 · {menuItems.length} 个分类
          </Text>
        </Space>
      </div>

      <Layout className="cat-layout">
        {/* 左侧目录 */}
        <Sider width={260} theme="light" className="cat-sider">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={(e) => setSelectedKey(e.key)}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>

        {/* 右侧卡片区 */}
        <Content className="cat-content">
          <Breadcrumb
            items={[
              { title: getDimensionName(dimension) },
              { title: currentMeta?.label || selectedKey || '(未选择)' },
            ]}
            style={{ marginBottom: 12 }}
          />
          {currentMeta && (
            <div className="cat-header">
              <Title level={3} style={{ margin: 0, color: (currentMeta as { color?: string }).color || '#333' }}>
                {(currentMeta as { flag?: string; icon?: string }).flag || (currentMeta as { icon?: string }).icon || ''}{' '}
                {currentMeta.label}
              </Title>
              {(currentMeta as { desc?: string }).desc && (
                <Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 0 }}>
                  {(currentMeta as { desc?: string }).desc}
                </Paragraph>
              )}
              <Text type="secondary" style={{ fontSize: 13 }}>
                共 {currentList.length} 篇文献
              </Text>
            </div>
          )}

          {currentList.length === 0 ? (
            <Empty description="该分类下暂无文献" />
          ) : (
            <div className="cat-card-grid">
              {currentList
                .slice()
                .sort((a, b) => (b.year || 0) - (a.year || 0))
                .map((p) => (
                  <PaperCard key={p.paper_id} paper={p} />
                ))}
            </div>
          )}
        </Content>
      </Layout>
    </div>
  )
}

// ============================================
// 卡片
// ============================================

function PaperCard({ paper }: { paper: Paper }) {
  const tags = ((paper.extra as { tags?: PaperTags } | undefined)?.tags) || {}
  const country = (paper.extra as { country?: string } | undefined)?.country
  const catMeta = paper.category ? CATEGORY_META[paper.category] : undefined
  const themeIds = (paper.themes || '').split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <Link to={`/paper/${paper.paper_id}`} className="cat-card-link">
      <Card hoverable className="cat-card" bodyStyle={{ padding: 16 }}>
        <div className="cat-card-header">
          {catMeta && (
            <Tag color={catMeta.color} style={{ margin: 0 }}>
              {catMeta.label}
            </Tag>
          )}
          {country && COUNTRY_META[country] && (
            <span className="cat-card-flag">{COUNTRY_META[country].flag}</span>
          )}
          {paper.year && <Text type="secondary" style={{ fontSize: 12 }}>{paper.year}</Text>}
        </div>

        <Title level={5} style={{ margin: '10px 0 4px', lineHeight: 1.35 }}>
          {paper.title}
        </Title>
        {paper.title_en && (
          <Text type="secondary" italic style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            {paper.title_en}
          </Text>
        )}
        <Text style={{ fontSize: 13, color: '#666' }}>{paper.author}</Text>

        {/* 学派 tag */}
        {(tags.tradition || []).length > 0 && (
          <div className="cat-card-tags">
            {(tags.tradition || []).slice(0, 2).map((t) => (
              <Tag key={t} color={TRADITION_META[t]?.color} style={{ fontSize: 11 }}>
                {TRADITION_META[t]?.label || t}
              </Tag>
            ))}
          </div>
        )}

        {/* 主题 tag */}
        {themeIds.length > 0 && (
          <div className="cat-card-tags" style={{ marginTop: 4 }}>
            {themeIds.slice(0, 3).map((t) => {
              const meta = THEME_META[t]
              if (!meta) return null
              return (
                <Tag key={t} color={meta.color} style={{ fontSize: 11 }}>
                  {meta.label}
                </Tag>
              )
            })}
          </div>
        )}
      </Card>
    </Link>
  )
}

// ============================================
// helpers
// ============================================

function getKeys(p: Paper, dim: Dimension): string[] {
  if (dim === 'tradition' || dim === 'object' || dim === 'approach') {
    const tags = ((p.extra as { tags?: PaperTags } | undefined)?.tags) || {}
    return tags[dim] || []
  }
  if (dim === 'country') {
    const c = (p.extra as { country?: string } | undefined)?.country
    return c ? [c] : ['(未标注)']
  }
  if (dim === 'theme') {
    return (p.themes || '').split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function getDimensionMeta(dim: Dimension): Record<string, { label: string; color?: string; flag?: string; icon?: string; desc?: string }> {
  if (dim === 'tradition') return TRADITION_META
  if (dim === 'object') return OBJECT_META
  if (dim === 'approach') return APPROACH_META
  if (dim === 'country') return COUNTRY_META
  if (dim === 'theme') return THEME_META
  return {}
}

function getDimensionName(dim: Dimension): string {
  const map: Record<Dimension, string> = {
    tradition: '学派/传统',
    object: '研究对象',
    approach: '方法路径',
    country: '国别',
    theme: '主题',
  }
  return map[dim]
}
