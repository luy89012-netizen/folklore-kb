// 讨论区话题引导：给不知道发什么的访客一个开帖脚手架
// 点击卡片 → 打开发帖 Modal，预填标题 + 内容提纲（用户可随意改）

export interface ForumStarter {
  id: string
  emoji: string
  /** 卡片上的话题名 */
  title: string
  /** 卡片上的一句话引导 */
  hint: string
  /** 预填的帖子标题 */
  prefillTitle: string
  /** 预填的正文脚手架（提问式，用户替换成自己的话） */
  prefillContent: string
  /** 可选：预挂的专题标签（自由文本） */
  topicTag?: string
  /** 可选：预关联的文献 paper_id（必须真实存在） */
  paperId?: string
}

export const FORUM_STARTERS: ForumStarter[] = [
  {
    id: 's1_intro',
    emoji: '👋',
    title: '报个到：你为什么对民俗学感兴趣？',
    hint: '一两句就行，让大家认识你',
    prefillTitle: '报个到：我为什么翻开这个库',
    prefillContent:
      '我是（学校/专业/身份）——\n\n最初对民俗学产生兴趣是因为：\n\n最近在关注的问题：\n\n（想到哪写到哪，不用工整）',
  },
  {
    id: 's2_digital_legend',
    emoji: '💻',
    title: '你见过哪些「网络传说」？',
    hint: '从 Slender Man 聊到你手机里的都市传说',
    prefillTitle: '我见过的网络传说：______',
    prefillContent:
      '库里 Slender Man 那篇讲：网络传说复现了口头传说的生成机制（多版本扩散、集体加工、与现实模糊边界）。\n\n我想到自己见过的一个例子是：\n\n它的版本变化/扩散路径：\n\n身边有人「当真」过吗：',
    paperId: 'p79_fernandez_slender_man_digital_legend',
  },
  {
    id: 's3_food',
    emoji: '🍜',
    title: '你家的「食物民俗」',
    hint: '一道只有你家那样做的菜，就是活的民俗',
    prefillTitle: '我家的食物民俗：______',
    prefillContent:
      '这道菜/这种吃法是：\n\n谁教给谁（掌勺权威是谁）：\n\n有没有说不清来历但必须遵守的规矩：\n\n——读了 barbacoa 那篇再看自家厨房，突然发现「味觉记忆」到处都是。',
    paperId: 'p77_haber_barbacoa_texmex_border',
  },
  {
    id: 's4_douyin',
    emoji: '📱',
    title: '短视频里的「传统」',
    hint: '抖音上的国学、汉服、非遗——是复兴还是发明？',
    prefillTitle: '短视频里的传统：我刷到的一个案例',
    prefillContent:
      '我最近刷到的案例（账号/内容形态）：\n\n它把「传统」包装成了什么样子：\n\n评论区的人怎么接（当真？玩梗？考据？）：\n\n用库里「抖音上的儒家民间理论」那篇的视角看，这算传统的再生产还是新的发明？',
    paperId: 'p70_zhou_confucian_folk_theory_douyin',
  },
  {
    id: 's5_ritual',
    emoji: '🕯️',
    title: '你身边的仪式与禁忌',
    hint: '考试周的转发锦鲤也算——说一个你参与过的',
    prefillTitle: '我参与过的一个仪式/禁忌：______',
    prefillContent:
      '这个仪式/禁忌是：\n\n什么场合、谁参与、具体怎么做：\n\n我自己信吗？不信为什么还做：\n\n（转发锦鲤、宿舍楼下的许愿池、面试前的幸运物……都算）',
  },
  {
    id: 's6_reading',
    emoji: '📚',
    title: '三句话安利一篇文献',
    hint: '最近读的哪篇让你想拉人讨论？',
    prefillTitle: '三句话安利：《______》',
    prefillContent:
      '这篇讲什么（一句话）：\n\n最打动我的一个论点/案例：\n\n我的一个疑问（想听听大家怎么看）：\n\n（记得在下面「关联一篇文献」里挂上它）',
  },
]
