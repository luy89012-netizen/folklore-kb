// 文献对话关系边——由 scripts 从 papers.dialogues 离线提取，勿手改
// type: dialogue(泛对话) | inherit(承继/共享谱系) | complement(互补/对读) | critique(批判/争议)

export type RelationType = 'dialogue' | 'inherit' | 'complement' | 'critique'

export interface RelationEdge {
  source: string
  target: string
  type: RelationType
}

export const RELATION_TYPE_META: Record<RelationType, { label: string; color: string }> = {
  dialogue:   { label: '对话', color: '#93a1b0' },
  inherit:    { label: '承继', color: '#d4b483' },
  complement: { label: '互补', color: '#7fa8b0' },
  critique:   { label: '批判', color: '#c58a7a' },
}

export const RELATIONS: RelationEdge[] = [
  { source: 'p01_jaf_journal', target: 'p18_sandberg_dei', type: 'dialogue' },
  { source: 'p02_ito_china_japan', target: 'p06_barthes_mythologies', type: 'complement' },
  { source: 'p02_ito_china_japan', target: 'p09_ye_structural_myth', type: 'complement' },
  { source: 'p03_eisler_sacred_pleasure', target: 'p06_barthes_mythologies', type: 'complement' },
  { source: 'p03_eisler_sacred_pleasure', target: 'p04_kuhn_soulstealers', type: 'complement' },
  { source: 'p04_kuhn_soulstealers', target: 'p06_barthes_mythologies', type: 'complement' },
  { source: 'p04_kuhn_soulstealers', target: 'p10_feuchtwang_imperial', type: 'complement' },
  { source: 'p05_benamos_history', target: 'p11_gao_new_era', type: 'dialogue' },
  { source: 'p05_benamos_history', target: 'p18_sandberg_dei', type: 'dialogue' },
  { source: 'p06_barthes_mythologies', target: 'p03_eisler_sacred_pleasure', type: 'complement' },
  { source: 'p06_barthes_mythologies', target: 'p02_ito_china_japan', type: 'complement' },
  { source: 'p06_barthes_mythologies', target: 'p04_kuhn_soulstealers', type: 'complement' },
  { source: 'p06_barthes_mythologies', target: 'p09_ye_structural_myth', type: 'complement' },
  { source: 'p07_zhong_intro_folklit', target: 'p11_gao_new_era', type: 'complement' },
  { source: 'p07_zhong_intro_folklit', target: 'p02_ito_china_japan', type: 'complement' },
  { source: 'p08_ricoeur_time_narrative', target: 'p04_kuhn_soulstealers', type: 'inherit' },
  { source: 'p08_ricoeur_time_narrative', target: 'p06_barthes_mythologies', type: 'inherit' },
  { source: 'p08_ricoeur_time_narrative', target: 'p14_phillips_folksong', type: 'inherit' },
  { source: 'p08_ricoeur_time_narrative', target: 'p19_duque_ghosts', type: 'inherit' },
  { source: 'p09_ye_structural_myth', target: 'p06_barthes_mythologies', type: 'critique' },
  { source: 'p09_ye_structural_myth', target: 'p08_ricoeur_time_narrative', type: 'critique' },
  { source: 'p09_ye_structural_myth', target: 'p02_ito_china_japan', type: 'critique' },
  { source: 'p10_feuchtwang_imperial', target: 'p04_kuhn_soulstealers', type: 'complement' },
  { source: 'p10_feuchtwang_imperial', target: 'p07_zhong_intro_folklit', type: 'complement' },
  { source: 'p10_feuchtwang_imperial', target: 'p03_eisler_sacred_pleasure', type: 'complement' },
  { source: 'p11_gao_new_era', target: 'p07_zhong_intro_folklit', type: 'dialogue' },
  { source: 'p11_gao_new_era', target: 'p05_benamos_history', type: 'dialogue' },
  { source: 'p11_gao_new_era', target: 'p18_sandberg_dei', type: 'dialogue' },
  { source: 'p13_kitta_disease', target: 'p04_kuhn_soulstealers', type: 'complement' },
  { source: 'p13_kitta_disease', target: 'p17_mcdonald_critical', type: 'complement' },
  { source: 'p13_kitta_disease', target: 'p18_sandberg_dei', type: 'complement' },
  { source: 'p14_phillips_folksong', target: 'p07_zhong_intro_folklit', type: 'complement' },
  { source: 'p15_soviet_borderlands', target: 'p16_bronner_ge', type: 'inherit' },
  { source: 'p15_soviet_borderlands', target: 'p11_gao_new_era', type: 'inherit' },
  { source: 'p15_soviet_borderlands', target: 'p05_benamos_history', type: 'inherit' },
  { source: 'p16_bronner_ge', target: 'p17_mcdonald_critical', type: 'critique' },
  { source: 'p16_bronner_ge', target: 'p18_sandberg_dei', type: 'critique' },
  { source: 'p16_bronner_ge', target: 'p15_soviet_borderlands', type: 'critique' },
  { source: 'p17_mcdonald_critical', target: 'p16_bronner_ge', type: 'critique' },
  { source: 'p17_mcdonald_critical', target: 'p13_kitta_disease', type: 'critique' },
  { source: 'p17_mcdonald_critical', target: 'p07_zhong_intro_folklit', type: 'critique' },
  { source: 'p17_mcdonald_critical', target: 'p18_sandberg_dei', type: 'critique' },
  { source: 'p18_sandberg_dei', target: 'p16_bronner_ge', type: 'critique' },
  { source: 'p18_sandberg_dei', target: 'p17_mcdonald_critical', type: 'critique' },
  { source: 'p18_sandberg_dei', target: 'p13_kitta_disease', type: 'critique' },
  { source: 'p18_sandberg_dei', target: 'p05_benamos_history', type: 'critique' },
  { source: 'p19_duque_ghosts', target: 'p04_kuhn_soulstealers', type: 'complement' },
  { source: 'p19_duque_ghosts', target: 'p08_ricoeur_time_narrative', type: 'complement' },
  { source: 'p19_duque_ghosts', target: 'p14_phillips_folksong', type: 'complement' },
  { source: 'p64_roussou_transreligiosity_greece', target: 'p06_barthes_mythologies', type: 'complement' },
  { source: 'p64_roussou_transreligiosity_greece', target: 'p48_demartino_mondo_magico', type: 'complement' },
  { source: 'p64_roussou_transreligiosity_greece', target: 'p10_feuchtwang_imperial', type: 'complement' },
  { source: 'p64_roussou_transreligiosity_greece', target: 'p37_bausinger_folk_culture_technological_world', type: 'complement' },
  { source: 'p65_xiong_jesus_asian_catholic', target: 'p04_kuhn_soulstealers', type: 'complement' },
  { source: 'p65_xiong_jesus_asian_catholic', target: 'p55_fei_xiaotong_xiangtu_zhongguo', type: 'complement' },
  { source: 'p65_xiong_jesus_asian_catholic', target: 'p47_gramsci_observations_folklore', type: 'complement' },
  { source: 'p65_xiong_jesus_asian_catholic', target: 'p10_feuchtwang_imperial', type: 'complement' },
  { source: 'p66_jirattikorn_ahom_east', target: 'p11_gao_new_era', type: 'complement' },
  { source: 'p66_jirattikorn_ahom_east', target: 'p15_soviet_borderlands', type: 'complement' },
  { source: 'p66_jirattikorn_ahom_east', target: 'p40_yanagita_kaijo_no_michi', type: 'complement' },
  { source: 'p67_kim_nora_dance_thailand', target: 'p47_gramsci_observations_folklore', type: 'complement' },
  { source: 'p67_kim_nora_dance_thailand', target: 'p21_bauman_performance', type: 'complement' },
  { source: 'p67_kim_nora_dance_thailand', target: 'p63_cui_black_myth_wukong_heritage', type: 'complement' },
  { source: 'p67_kim_nora_dance_thailand', target: 'p24_bakhtin_rabelais', type: 'complement' },
  { source: 'p67_kim_nora_dance_thailand', target: 'p23_hymes_breakthrough', type: 'complement' },
  { source: 'p68_sofi_shanidar_kurdish_digital', target: 'p63_cui_black_myth_wukong_heritage', type: 'complement' },
  { source: 'p68_sofi_shanidar_kurdish_digital', target: 'p03_eisler_sacred_pleasure', type: 'complement' },
  { source: 'p68_sofi_shanidar_kurdish_digital', target: 'p59_pfeifer_algorithmic_storms', type: 'complement' },
  { source: 'p69_pansters_santa_muerte_mexico', target: 'p06_barthes_mythologies', type: 'complement' },
  { source: 'p69_pansters_santa_muerte_mexico', target: 'p48_demartino_mondo_magico', type: 'complement' },
  { source: 'p69_pansters_santa_muerte_mexico', target: 'p63_cui_black_myth_wukong_heritage', type: 'complement' },
  { source: 'p69_pansters_santa_muerte_mexico', target: 'p10_feuchtwang_imperial', type: 'complement' },
  { source: 'p70_zhou_confucian_folk_theory_douyin', target: 'p31_bourdieu_practice', type: 'complement' },
  { source: 'p70_zhou_confucian_folk_theory_douyin', target: 'p57_gao_bingzhong_folk_life', type: 'complement' },
  { source: 'p70_zhou_confucian_folk_theory_douyin', target: 'p59_pfeifer_algorithmic_storms', type: 'complement' },
  { source: 'p70_zhou_confucian_folk_theory_douyin', target: 'p37_bausinger_folk_culture_technological_world', type: 'complement' },
  { source: 'p71_wang_liu_zhanen_martyr', target: 'p08_ricoeur_time_narrative', type: 'complement' },
  { source: 'p71_wang_liu_zhanen_martyr', target: 'p53_gu_jiegang_mengjiangnu', type: 'complement' },
  { source: 'p71_wang_liu_zhanen_martyr', target: 'p62_kopf_rust_reparations_senegal', type: 'complement' },
  { source: 'p71_wang_liu_zhanen_martyr', target: 'p56_liu_kuili_life_tree', type: 'complement' },
]

/** 返回与某篇文献有对话关系的所有文献（双向）*/
export function findRelated(paperId: string): { paperId: string; type: RelationType; direction: 'out' | 'in' }[] {
  const out = RELATIONS.filter((r) => r.source === paperId).map((r) => ({ paperId: r.target, type: r.type, direction: 'out' as const }))
  const inn = RELATIONS.filter((r) => r.target === paperId).map((r) => ({ paperId: r.source, type: r.type, direction: 'in' as const }))
  const seen = new Set<string>()
  const merged: { paperId: string; type: RelationType; direction: 'out' | 'in' }[] = []
  for (const item of [...out, ...inn]) {
    if (seen.has(item.paperId)) continue
    seen.add(item.paperId)
    merged.push(item)
  }
  return merged
}
