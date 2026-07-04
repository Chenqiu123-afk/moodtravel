/**
 * ================================================================
 *  MoodTravel 用户画像数据模型
 *  包含注册问卷、MBTI 人格、动态画像字段、行为日志
 * ================================================================
 */

// ---- 注册问卷题目 ----
export const SURVEY_QUESTIONS = [
  {
    id: 'q1',
    type: 'single',
    title: '你的旅行预算偏好？',
    icon: '💰',
    options: [
      { value: 'budget', label: '精打细算', desc: '¥500/天以内', budgetRange: [0, 500] },
      { value: 'comfort', label: '舒适出行', desc: '¥500-1500/天', budgetRange: [500, 1500] },
      { value: 'premium', label: '品质享受', desc: '¥1500-3000/天', budgetRange: [1500, 3000] },
      { value: 'luxury', label: '奢华体验', desc: '¥3000+/天', budgetRange: [3000, 9999] }
    ]
  },
  {
    id: 'q2',
    type: 'single',
    title: '你的 MBTI 人格类型？',
    icon: '🧠',
    desc: '不确定可以先跳过，后期可以修改',
    options: [
      { value: 'INTJ', label: 'INTJ 建筑师', desc: '喜欢深度规划，追求效率' },
      { value: 'INFP', label: 'INFP 调停者', desc: '感性浪漫，喜欢有意义的体验' },
      { value: 'ENFP', label: 'ENFP 竞选者', desc: '社交达人，喜欢新鲜刺激' },
      { value: 'ISTJ', label: 'ISTJ 物流师', desc: '务实可靠，喜欢井井有条' },
      { value: 'ISFJ', label: 'ISFJ 守卫者', desc: '温和体贴，重视安全感' },
      { value: 'ESTP', label: 'ESTP 企业家', desc: '行动派，喜欢即时体验' },
      { value: 'INFJ', label: 'INFJ 提倡者', desc: '理想主义，追求深度连接' },
      { value: 'unknown', label: '不确定 / 跳过', desc: '之后再了解' }
    ]
  },
  {
    id: 'q3',
    type: 'multi',
    title: '你的旅行偏好？（可多选）',
    icon: '🎯',
    options: [
      { value: 'nature', label: '自然风光', icon: '🏔️' },
      { value: 'food', label: '美食探店', icon: '🍜' },
      { value: 'culture', label: '人文历史', icon: '🏛️' },
      { value: 'photo', label: '拍照打卡', icon: '📸' },
      { value: 'relax', label: '躺平放空', icon: '🧘' },
      { value: 'adventure', label: '户外冒险', icon: '🥾' },
      { value: 'shopping', label: '购物逛街', icon: '🛍️' },
      { value: 'nightlife', label: '夜生活', icon: '🌃' }
    ]
  },
  {
    id: 'q4',
    type: 'single',
    title: '你的情绪底色？',
    icon: '🎨',
    desc: '最近一个月，哪种情绪最常出现？',
    options: [
      { value: 'energetic', label: '充满能量', emoji: '⚡' },
      { value: 'calm', label: '平静温和', emoji: '😌' },
      { value: 'anxious', label: '容易焦虑', emoji: '😰' },
      { value: 'down', label: '有些低落', emoji: '😢' },
      { value: 'mixed', label: '起伏不定', emoji: '🎢' }
    ]
  }
]

// ---- MBTI 人格对应的旅行推荐权重 ----
export const MBTI_WEIGHTS = {
  INTJ: { culture: 0.35, nature: 0.25, relax: 0.15, adventure: 0.15, photo: 0.05, food: 0.05 },
  INFP: { nature: 0.30, photo: 0.25, culture: 0.20, relax: 0.15, food: 0.05, adventure: 0.05 },
  ENFP: { adventure: 0.25, photo: 0.20, food: 0.20, culture: 0.15, nightlife: 0.10, nature: 0.10 },
  ISTJ: { culture: 0.30, food: 0.25, nature: 0.20, relax: 0.15, photo: 0.05, shopping: 0.05 },
  ISFJ: { relax: 0.30, nature: 0.25, food: 0.20, culture: 0.15, photo: 0.05, shopping: 0.05 },
  ESTP: { adventure: 0.35, nightlife: 0.20, food: 0.20, shopping: 0.15, photo: 0.05, nature: 0.05 },
  INFJ: { culture: 0.30, nature: 0.25, relax: 0.20, photo: 0.15, food: 0.05, adventure: 0.05 },
  unknown: { nature: 0.20, food: 0.20, culture: 0.20, relax: 0.15, photo: 0.15, adventure: 0.10 }
}

// ---- 情绪底色对应的推荐偏好 ----
export const EMOTION_BASE_WEIGHTS = {
  energetic: { adventure: 0.30, nightlife: 0.20, food: 0.15, photo: 0.15, culture: 0.10, nature: 0.10 },
  calm:      { relax: 0.30, nature: 0.25, culture: 0.20, food: 0.15, photo: 0.05, adventure: 0.05 },
  anxious:   { relax: 0.35, nature: 0.25, culture: 0.15, food: 0.10, photo: 0.10, adventure: 0.05 },
  down:      { relax: 0.30, nature: 0.25, culture: 0.20, food: 0.15, photo: 0.05, adventure: 0.05 },
  mixed:     { nature: 0.20, food: 0.20, culture: 0.15, relax: 0.15, photo: 0.15, adventure: 0.15 }
}

// ---- 默认用户画像 ----
export const DEFAULT_PROFILE = {
  budget: 2000,
  budgetTier: 'comfort',
  mbti: 'unknown',
  travelPreferences: ['nature', 'food', 'relax'],
  emotionBase: 'calm',
  surveyCompleted: false,
  behaviorLog: [],           // [{ action, targetId, timestamp }]
  browsingHistory: [],       // 最近浏览的商家 ID
  favoriteMerchants: [],     // 收藏的商家
  createdAt: null,
  updatedAt: null
}

// ---- 行为日志记录 ----
export function createBehaviorLog(action, targetId, metadata = {}) {
  return {
    action,      // 'view' | 'click' | 'book' | 'favorite' | 'share'
    targetId,
    metadata,
    timestamp: Date.now()
  }
}

// ---- 画像更新逻辑：基于行为日志动态调整权重 ----
export function updateProfileFromBehavior(profile, newLog) {
  profile.behaviorLog.push(newLog)
  // 只保留最近 50 条
  if (profile.behaviorLog.length > 50) {
    profile.behaviorLog = profile.behaviorLog.slice(-50)
  }

  // 更新浏览历史
  if (newLog.action === 'view' && newLog.targetId) {
    if (!profile.browsingHistory.includes(newLog.targetId)) {
      profile.browsingHistory.unshift(newLog.targetId)
      if (profile.browsingHistory.length > 20) {
        profile.browsingHistory = profile.browsingHistory.slice(0, 20)
      }
    }
  }

  // 更新收藏
  if (newLog.action === 'favorite') {
    if (!profile.favoriteMerchants.includes(newLog.targetId)) {
      profile.favoriteMerchants.push(newLog.targetId)
    }
  }

  profile.updatedAt = new Date().toISOString()
  return profile
}

// ---- 测试用户画像 ----
export const TEST_PROFILES = [
  {
    id: 'test-001',
    nickname: '文艺青年小陈',
    budget: 1500,
    budgetTier: 'comfort',
    mbti: 'INFP',
    travelPreferences: ['nature', 'photo', 'culture'],
    emotionBase: 'calm',
    surveyCompleted: true,
    browsingHistory: ['cm-005', 'cm-009', 'cm-008'],
    favoriteMerchants: ['cm-005'],
    behaviorLog: [
      { action: 'view', targetId: 'cm-005', timestamp: Date.now() - 3600000 },
      { action: 'favorite', targetId: 'cm-005', timestamp: Date.now() - 1800000 },
      { action: 'view', targetId: 'cm-009', timestamp: Date.now() - 900000 }
    ]
  },
  {
    id: 'test-002',
    nickname: '退休教师王阿姨',
    budget: 800,
    budgetTier: 'budget',
    mbti: 'ISFJ',
    travelPreferences: ['relax', 'nature', 'food'],
    emotionBase: 'calm',
    surveyCompleted: true,
    browsingHistory: ['cm-002', 'cm-004', 'cm-010'],
    favoriteMerchants: ['cm-002'],
    behaviorLog: [
      { action: 'view', targetId: 'cm-002', timestamp: Date.now() - 7200000 },
      { action: 'view', targetId: 'cm-004', timestamp: Date.now() - 3600000 }
    ]
  },
  {
    id: 'test-003',
    nickname: '996程序员小李',
    budget: 3000,
    budgetTier: 'premium',
    mbti: 'INTJ',
    travelPreferences: ['adventure', 'food', 'relax'],
    emotionBase: 'anxious',
    surveyCompleted: true,
    browsingHistory: ['cm-001', 'cm-003', 'cm-006'],
    favoriteMerchants: [],
    behaviorLog: [
      { action: 'view', targetId: 'cm-001', timestamp: Date.now() - 1800000 },
      { action: 'view', targetId: 'cm-003', timestamp: Date.now() - 900000 }
    ]
  }
]