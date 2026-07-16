/**
 * 文献之间的理论对话关系（关系图数据）
 * 每条 edge 描述两篇文献之间的关系类型
 */

export type EdgeType = 'echo' | 'contrast' | 'critique' | 'extend' | 'methodological' | 'genealogy'

export interface RelationEdge {
  source: string  // paper_id
  target: string  // paper_id
  type: EdgeType
  label: string  // 简短描述
}

export const EDGE_TYPE_META: Record<EdgeType, { label: string; color: string }> = {
  echo: { label: '呼应', color: '#5AD8A6' },
  contrast: { label: '对照', color: '#F6BD16' },
  critique: { label: '批评/紧张', color: '#E86452' },
  extend: { label: '延伸/接续', color: '#5B8FF9' },
  methodological: { label: '方法论共享', color: '#945FB9' },
  genealogy: { label: '师承/谱系', color: '#6DC8EC' },
}

export const RELATIONS: RelationEdge[] = [
  // Ricoeur 作为叙事工具，被多篇借用
  { source: 'p08_ricoeur_time_narrative', target: 'p19_duque_ghosts', type: 'methodological', label: '叙事同一性 → 分析校园鬼故事的空间生产' },
  { source: 'p08_ricoeur_time_narrative', target: 'p14_phillips_folksong', type: 'methodological', label: '三重摹仿 → 分析演唱作为「重构」' },
  { source: 'p08_ricoeur_time_narrative', target: 'p02_ito_china_japan', type: 'methodological', label: '摹仿 II（构型）→ 分析同一母题的不同改造' },
  // 结构主义谱系
  { source: 'p09_ye_structural_myth', target: 'p06_barthes_mythologies', type: 'genealogy', label: '共享结构主义符号学谱系' },
  { source: 'p09_ye_structural_myth', target: 'p02_ito_china_japan', type: 'methodological', label: '共享形式取向（结构 vs 类型学）' },
  { source: 'p09_ye_structural_myth', target: 'p08_ricoeur_time_narrative', type: 'contrast', label: '结构主义 → 诠释学的分化' },
  // Barthes 与其他
  { source: 'p06_barthes_mythologies', target: 'p03_eisler_sacred_pleasure', type: 'echo', label: '共享「神话去自然化」姿态' },
  { source: 'p06_barthes_mythologies', target: 'p04_kuhn_soulstealers', type: 'methodological', label: '二级符号系统 → 分析「妖术」如何被官僚话语生产' },
  { source: 'p06_barthes_mythologies', target: 'p10_feuchtwang_imperial', type: 'methodological', label: '「隐喻」作为符号运作机制' },
  // 中国民间宗教双翼
  { source: 'p04_kuhn_soulstealers', target: 'p10_feuchtwang_imperial', type: 'contrast', label: '上层皇权视角 vs 下层民间视角的双翼' },
  // 学科史元反思对话
  { source: 'p05_benamos_history', target: 'p11_gao_new_era', type: 'echo', label: '中—美学科史元反思的代际对话' },
  { source: 'p05_benamos_history', target: 'p18_sandberg_dei', type: 'extend', label: '学科史意识 → 学科政治意识（半世纪跨度）' },
  { source: 'p05_benamos_history', target: 'p15_soviet_borderlands', type: 'echo', label: '学科史反思在冷战语境的延伸' },
  { source: 'p11_gao_new_era', target: 'p15_soviet_borderlands', type: 'echo', label: '社会主义 / 后社会主义国家民俗学转型的比较' },
  { source: 'p11_gao_new_era', target: 'p07_zhong_intro_folklit', type: 'extend', label: '学派主张（钟）→ 转型评估（高）的代际对话' },
  // JAF 2026 同期专题
  { source: 'p13_kitta_disease', target: 'p18_sandberg_dei', type: 'echo', label: 'JAF 139(552) 同期对政治气候的响应' },
  { source: 'p16_bronner_ge', target: 'p18_sandberg_dei', type: 'contrast', label: '美国内部政策约束 vs 欧洲同行立场（跨大西洋对话）' },
  { source: 'p17_mcdonald_critical', target: 'p13_kitta_disease', type: 'genealogy', label: '「批判民俗学」→ 学者的公共介入责任' },
  { source: 'p17_mcdonald_critical', target: 'p18_sandberg_dei', type: 'genealogy', label: '「批判民俗学」→ DEI 学术自由主张' },
  { source: 'p17_mcdonald_critical', target: 'p16_bronner_ge', type: 'echo', label: '共享学科政治性主张' },
  // Bronner 作者—编者双重身份
  { source: 'p16_bronner_ge', target: 'p15_soviet_borderlands', type: 'echo', label: 'Bronner 作者—编者双重身份呼应' },
  // 教材 → 前沿的距离
  { source: 'p07_zhong_intro_folklit', target: 'p14_phillips_folksong', type: 'contrast', label: '文本层分类 vs 表演层民族志' },
  { source: 'p07_zhong_intro_folklit', target: 'p10_feuchtwang_imperial', type: 'extend', label: '民间信仰分类 → 田野解释' },
  { source: 'p07_zhong_intro_folklit', target: 'p02_ito_china_japan', type: 'extend', label: '教材分类学 → 具体比较案例' },
  // 妖术—阴谋论跨时代对读
  { source: 'p04_kuhn_soulstealers', target: 'p13_kitta_disease', type: 'echo', label: '「妖术恐慌」→「阴谋论恐慌」跨两个半世纪的机制对读' },
  // 身体政治主题的连接
  { source: 'p03_eisler_sacred_pleasure', target: 'p04_kuhn_soulstealers', type: 'methodological', label: '身体、权力与集体想象的两个视角' },
  { source: 'p14_phillips_folksong', target: 'p19_duque_ghosts', type: 'echo', label: '表演与身体在场的现场取向' },
  { source: 'p19_duque_ghosts', target: 'p04_kuhn_soulstealers', type: 'methodological', label: '民间讲述如何塑造空间/权力关系' },
]

/** 找出与指定 paperId 有直接关系的所有其他文献 */
export function findRelatedPapers(paperId: string): RelationEdge[] {
  return RELATIONS.filter(r => r.source === paperId || r.target === paperId)
}
