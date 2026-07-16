import { sbSelect } from './client'

export interface Paper {
  paper_id: string
  title: string
  title_en?: string
  author?: string
  year?: number
  publication?: string
  category?: string
  subcategory?: string
  themes?: string
  abstract?: string
  key_arguments?: string
  key_concepts?: string
  dialogues?: string
  cover_url?: string
  pdf_url?: string
  pages?: number
  lang?: string
  extra?: Record<string, unknown>
}

/** 分类元数据 */
export const CATEGORY_META: Record<string, { label: string; color: string; desc: string }> = {
  classic: { label: '经典', color: '#F6BD16', desc: '被反复引用、构成学科基础的作品' },
  frontier: { label: '前沿', color: '#5B8FF9', desc: '2020 年后的新论文，回应当代议题' },
  textbook: { label: '教材', color: '#5AD8A6', desc: '导论/概论/手册，覆盖学科基本框架' },
  related: { label: '相关学科经典', color: '#945FB9', desc: '来自人类学/宗教社会学等相邻学科的经典' },
  reference: { label: '工具书', color: '#8c8c8c', desc: '合订本/参考文献汇编' },
}

/** 主题元数据（用于卡片背景色 / 标签） */
export const THEME_META: Record<string, { label: string; color: string }> = {
  t1: { label: '学科身份与政治性', color: '#FF6B6B' },
  t2: { label: '神话与符号', color: '#4ECDC4' },
  t3: { label: '民间宗教与仪式', color: '#FFA502' },
  t4: { label: '表演与展演', color: '#A29BFE' },
  t5: { label: '叙事理论', color: '#26DE81' },
  t6: { label: '当代政治与身体', color: '#FC5C65' },
}

/** 加载全部文献（≤200 条） */
export async function fetchAllPapers(): Promise<Paper[]> {
  return sbSelect<Paper>('papers', { order: 'year.desc.nullslast', limit: 200 })
}

/** 按 id 查单篇 */
export async function fetchPaperById(paperId: string): Promise<Paper | null> {
  const rows = await sbSelect<Paper>('papers', { filter: `paper_id=eq.${paperId}`, limit: 1 })
  return rows[0] || null
}
