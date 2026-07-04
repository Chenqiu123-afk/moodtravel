/**
 * ================================================================
 *  MoodTravel 认证商家套餐管理 & Pro 订阅
 *  包含商家套餐等级、Pro 订阅方案、权限控制、数据报告导出
 * ================================================================
 */

// ---- 认证商家套餐等级 ----
export const MERCHANT_PACKAGES = [
  {
    id: 'pkg-free',
    name: '免费入驻',
    level: 'free',
    price: 0,
    features: [
      '基础商家信息展示',
      '平台基础流量曝光',
      '用户评价管理',
      '基础数据看板'
    ],
    commissionRate: 0.15,  // 15% 分成
    priority: 0,            // 推荐优先级（0最低）
    badge: null
  },
  {
    id: 'pkg-silver',
    name: '银牌认证',
    level: 'silver',
    price: 299,
    priceUnit: '月',
    features: [
      '银牌认证标识展示',
      '优先推荐排序（+20%权重）',
      '专属折扣发布权限',
      '高级数据看板',
      '月度数据报告',
      '平台服务费减至 8%'
    ],
    commissionRate: 0.08,
    priority: 20,
    badge: '🥈 银牌认证'
  },
  {
    id: 'pkg-gold',
    name: '金牌认证',
    level: 'gold',
    price: 799,
    priceUnit: '月',
    features: [
      '金牌认证标识展示',
      '首页推荐位曝光',
      '优先推荐排序（+40%权重）',
      '专属折扣 + 套餐发布',
      '完整数据看板 + 导出',
      '周度数据报告',
      '平台服务费减至 5%',
      '专属客服'
    ],
    commissionRate: 0.05,
    priority: 40,
    badge: '🥇 金牌认证'
  },
  {
    id: 'pkg-diamond',
    name: '钻石认证',
    level: 'diamond',
    price: 1999,
    priceUnit: '月',
    features: [
      '钻石认证标识展示',
      '首页 banner 轮播曝光',
      '最高推荐排序（+60%权重）',
      '全部折扣/套餐权限',
      '完整数据看板 + API 导出',
      '日报 + 周报 + 月报',
      '平台服务费仅 3%',
      '专属客户经理',
      '联合营销活动参与'
    ],
    commissionRate: 0.03,
    priority: 60,
    badge: '💎 钻石认证'
  }
]

// ---- Pro 用户订阅方案 ----
export const PRO_PLANS = [
  {
    id: 'pro-free',
    name: '免费版',
    price: 0,
    period: '永久',
    features: [
      '基础情绪记录',
      '每日推荐（限5条）',
      '基础旅行规划',
      'AI 对话（限10次/天）'
    ],
    color: '#A3B5A6'
  },
  {
    id: 'pro-monthly',
    name: 'Pro 月度',
    price: 29,
    period: '月',
    features: [
      '无限情绪记录 & 时光轴',
      '无限推荐 & 个性化推荐',
      '高级旅行规划（含多维度算法）',
      'AI 对话无限次',
      '认证商家专属折扣',
      '情绪数据导出',
      '去广告体验'
    ],
    color: '#8BA88C',
    popular: false
  },
  {
    id: 'pro-yearly',
    name: 'Pro 年度',
    price: 199,
    period: '年',
    features: [
      'Pro 月度全部权益',
      '年度情绪报告',
      '优先体验新功能',
      '专属客服通道',
      '节省 ¥149（相当于每月 ¥16.6）'
    ],
    color: '#E8945A',
    popular: true,
    saveLabel: '省 ¥149'
  }
]

// ---- Pro 权限控制 ----
export const PRO_PERMISSIONS = {
  'pro-free': {
    maxDailyRecommendations: 5,
    maxDailyAIChats: 10,
    canExportData: false,
    canSeeDiscounts: false,
    adFree: false,
    advancedAlgorithm: false
  },
  'pro-monthly': {
    maxDailyRecommendations: Infinity,
    maxDailyAIChats: Infinity,
    canExportData: true,
    canSeeDiscounts: true,
    adFree: true,
    advancedAlgorithm: true
  },
  'pro-yearly': {
    maxDailyRecommendations: Infinity,
    maxDailyAIChats: Infinity,
    canExportData: true,
    canSeeDiscounts: true,
    adFree: true,
    advancedAlgorithm: true,
    annualReport: true,
    prioritySupport: true
  }
}

// ---- 数据报告导出模板 ----
export const REPORT_TEMPLATES = {
  merchant: {
    title: '商家数据报告',
    sections: ['订单概览', '收入分析', '用户画像', '评价统计', '趋势预测'],
    format: ['PDF', 'Excel', 'API']
  },
  user: {
    title: '用户情绪报告',
    sections: ['情绪趋势', '高频情绪', '打卡统计', '推荐偏好', '年度总结'],
    format: ['PDF']
  }
}

// ---- 获取商家套餐 ----
export function getMerchantPackage(level) {
  return MERCHANT_PACKAGES.find(p => p.level === level) || MERCHANT_PACKAGES[0]
}

// ---- 获取 Pro 方案 ----
export function getProPlan(planId) {
  return PRO_PLANS.find(p => p.id === planId) || PRO_PLANS[0]
}

// ---- 检查 Pro 权限 ----
export function checkProPermission(planId, permission) {
  const perms = PRO_PERMISSIONS[planId] || PRO_PERMISSIONS['pro-free']
  return perms[permission] || false
}