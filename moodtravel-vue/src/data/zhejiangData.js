/**
 * ================================================================
 *  MoodTravel 浙江全域测试数据字典
 *  涵盖浙江 11 个地级市，每个城市带有标签和场景标记
 *  用于 AI 生成"散心路线"时随机抽取浙江省内城市
 * ================================================================
 */

export const ZHEJIANG_CITIES = [
  {
    name: '杭州',
    tags: ['西湖', '人文', '茶文化', '互联网', '慢生活'],
    vibe: '温婉江南，人间天堂',
    scenarios: ['relax', 'culture', 'food', 'couple', 'nature'],
    poiKeywords: ['西湖', '灵隐寺', '龙井', '西溪湿地', '宋城', '河坊街']
  },
  {
    name: '宁波',
    tags: ['港口', '海鲜', '历史', '经济', '书香'],
    vibe: '书藏古今，港通天下',
    scenarios: ['food', 'culture', 'business'],
    poiKeywords: ['天一阁', '老外滩', '东钱湖', '象山海鲜', '奉化溪口']
  },
  {
    name: '温州',
    tags: ['山水', '商业', '美食', '活力', '民营'],
    vibe: '敢为人先的山水之城',
    scenarios: ['food', 'nature', 'business', 'shopping'],
    poiKeywords: ['雁荡山', '楠溪江', '江心屿', '五马街', '南麂岛']
  },
  {
    name: '嘉兴',
    tags: ['水乡', '古镇', '红色', '粽子', '恬静'],
    vibe: '梦里水乡，红色起航',
    scenarios: ['relax', 'culture', 'couple', 'food'],
    poiKeywords: ['乌镇', '西塘', '南湖', '月河老街', '盐官观潮']
  },
  {
    name: '湖州',
    tags: ['竹海', '太湖', '民宿', '安吉', '清幽'],
    vibe: '行遍江南清丽地，人生只合住湖州',
    scenarios: ['relax', 'nature', 'couple', 'escape'],
    poiKeywords: ['莫干山', '南浔古镇', '安吉竹海', '太湖旅游度假区', '长兴银杏']
  },
  {
    name: '绍兴',
    tags: ['黄酒', '鲁迅', '水乡', '书法', '古韵'],
    vibe: '没有围墙的博物馆',
    scenarios: ['culture', 'food', 'relax', 'history'],
    poiKeywords: ['鲁迅故里', '沈园', '东湖', '安昌古镇', '兰亭']
  },
  {
    name: '金华',
    tags: ['火腿', '溶洞', '影视', '温泉', '古村'],
    vibe: '水墨金华，东方好莱坞',
    scenarios: ['culture', 'nature', 'relax', 'family'],
    poiKeywords: ['双龙洞', '横店影视城', '诸葛八卦村', '武义温泉', '义乌小商品城']
  },
  {
    name: '衢州',
    tags: ['美食', '辣味', '古城', '山水', '围棋'],
    vibe: '南孔圣地，衢州有礼',
    scenarios: ['food', 'culture', 'nature', 'history'],
    poiKeywords: ['江郎山', '廿八都古镇', '龙游石窟', '烂柯山', '水亭门']
  },
  {
    name: '舟山',
    tags: ['海岛', '海鲜', '普陀', '沙滩', '渔港'],
    vibe: '海天佛国，渔都港城',
    scenarios: ['nature', 'relax', 'escape', 'couple'],
    poiKeywords: ['普陀山', '朱家尖', '嵊泗列岛', '东极岛', '沈家门渔港']
  },
  {
    name: '台州',
    tags: ['山海', '佛道', '蜜橘', '古城', '海鲜'],
    vibe: '山海水城，和合圣地',
    scenarios: ['nature', 'relax', 'food', 'culture'],
    poiKeywords: ['天台山', '神仙居', '临海古城', '大陈岛', '长屿硐天']
  },
  {
    name: '丽水',
    tags: ['吸氧', '梯田', '畲族', '古堰', '画乡'],
    vibe: '浙江绿谷，天然氧吧',
    scenarios: ['nature', 'relax', 'escape', 'photo'],
    poiKeywords: ['云和梯田', '古堰画乡', '缙云仙都', '南尖岩', '龙泉青瓷']
  }
]

/**
 * 从浙江城市池中随机抽取一个城市
 * @param {string[]} excludeNames - 要排除的城市名
 * @returns {object} 城市对象
 */
export function randomZhejiangCity(excludeNames = []) {
  const pool = ZHEJIANG_CITIES.filter(c => !excludeNames.includes(c.name))
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * 根据场景筛选合适的城市
 * @param {string} scenario - 场景 key
 * @returns {object[]} 匹配的城市列表
 */
export function getCitiesByScenario(scenario) {
  return ZHEJIANG_CITIES.filter(c => c.scenarios.includes(scenario))
}

/**
 * 获取散心推荐城市（排除杭州，优先自然/放松类）
 * @returns {object} 城市对象
 */
export function getSanxinCity() {
  const escapeCities = ZHEJIANG_CITIES.filter(
    c => c.name !== '杭州' && (c.scenarios.includes('escape') || c.scenarios.includes('nature') || c.scenarios.includes('relax'))
  )
  if (escapeCities.length === 0) {
    // fallback: 排除杭州后的任意城市
    const pool = ZHEJIANG_CITIES.filter(c => c.name !== '杭州')
    return pool[Math.floor(Math.random() * pool.length)]
  }
  return escapeCities[Math.floor(Math.random() * escapeCities.length)]
}

/**
 * 焦虑关键词列表（用于隐性情绪检测）
 */
export const ANXIOUS_KEYWORDS = [
  '好累', '不想上班', '心烦', '压力大', '焦虑', '想逃',
  '散心', '心累', '崩溃', '受不了', '想哭', '难过',
  '不想动', '没力气', 'emo', '抑郁', '烦躁', '憋屈',
  '想静静', '想一个人', '想离开', '太累了', '撑不住'
]

/**
 * 预算动态区间公式
 * @param {number} days - 行程天数
 * @returns {{ min: number, max: number }}
 */
export function getBudgetRange(days) {
  const ranges = {
    1: { min: 500, max: 2000 },
    2: { min: 1000, max: 4000 },
    3: { min: 1500, max: 8000 },
    4: { min: 2000, max: 12000 },
    5: { min: 2500, max: 15000 }
  }
  return ranges[Math.min(Math.max(days, 1), 5)] || ranges[3]
}