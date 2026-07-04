import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CERTIFIED_MERCHANTS } from '@/data/certifiedData.js'
import { MBTI_WEIGHTS, EMOTION_BASE_WEIGHTS } from '@/data/userProfileData.js'
import { getMerchantPackage } from '@/data/merchantPackageData.js'
import { useTravelStore } from '@/store/travel.js'

// ---- 情绪标签 → 商家标签兼容映射 ----
const MOOD_TAG_MAP = {
  excited: ['演出', '主题乐园', '拍照', '冒险', '夜生活', '情侣'],
  happy:   ['亲子', '下午茶', '拍照', '美食', '演出', '情侣'],
  calm:    ['安静', '放松', '茶山', '园林', '博物馆', '品茶', '养生', 'SPA', '民宿', '文艺'],
  anxious: ['安静', '放松', 'SPA', '养生', '清淡', '品茶', '园林'],
  tired:   ['放松', 'SPA', '安静', '民宿', '养生', '品茶'],
  sad:     ['放松', '安静', '下午茶', '园林', '品茶', '茶山']
}

// ---- MBTI/情绪权重类别 → 商家标签映射 ----
const CATEGORY_TAG_MAP = {
  culture:   ['博物馆', '演出', '老字号', '穿越', '园林', '历史', '文艺'],
  nature:    ['茶山', '湖景', '西湖', '自然', '园林'],
  relax:     ['SPA', '放松', '安静', '养生', '民宿', '下午茶', '品茶', '园林', '清淡'],
  adventure: ['主题乐园', '冒险', '户外', '穿越'],
  photo:     ['拍照', '文艺', '湖景', '园林', '茶山'],
  food:      ['杭帮菜', '小笼包', '米其林', '药膳', '下午茶', '品茶', '美食', '清淡'],
  nightlife: ['夜生活', '酒吧'],
  shopping:  ['购物', '性价比']
}

// ---- 认证等级 → 套餐 level 映射 ----
const CERT_LEVEL_MAP = {
  '钻石认证': 'diamond',
  '金牌认证': 'gold',
  '银牌认证': 'silver'
}

// ---- 认证优先级分数 ----
const CERT_PRIORITY_SCORE = {
  diamond: 30,
  gold: 22,
  silver: 14,
  free: 0
}

export const useRecommendationStore = defineStore('recommendation', () => {
  const travelStore = useTravelStore()

  // ---- State ----
  const recommendations = ref([])
  const algorithmVersion = ref('v2.0-multi-dimensional')
  const lastUpdated = ref(null)

  // ---- Getters ----
  const topRecommendations = computed(() => {
    return [...recommendations.value]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  })

  const certifiedOnly = computed(() => {
    return recommendations.value.filter(r => r.merchant.isCertified)
  })

  // ---- Actions ----

  /**
   * 核心多维度推荐算法
   * 综合预算匹配、情绪匹配、人格匹配、认证优先级、行为奖励五个维度
   */
  function computeRecommendations() {
    const profile = {
      budget: travelStore.budget || 2000,
      mood: travelStore.moodLabel || 'calm',
      mbti: travelStore.mbti || 'unknown',
      emotionBase: travelStore.emotionBase || travelStore.moodLabel || 'calm',
      travelPreferences: travelStore.travelPreferences || ['nature', 'food', 'relax'],
      browsingHistory: travelStore.browsingHistory || [],
      favoriteMerchants: travelStore.favoriteMerchants || []
    }

    const merchants = CERTIFIED_MERCHANTS
    const scored = []

    for (const merchant of merchants) {
      // 1. 预算匹配 (0-30分)
      const budgetScore = computeBudgetScore(profile.budget, merchant.platformPrice)

      // 2. 情绪匹配 (0-20分)
      const moodScore = computeMoodScore(profile.mood, merchant.tags)

      // 3. 人格匹配 (0-20分)
      const personalityScore = computePersonalityScore(profile, merchant.tags)

      // 4. 认证优先级 (0-30分)
      const certScore = computeCertScore(merchant.certifiedLevel)

      // 5. 行为奖励 (0-10分)
      const behaviorScore = computeBehaviorScore(profile, merchant.id)

      const totalScore = budgetScore + moodScore + personalityScore + certScore + behaviorScore

      scored.push({
        merchant,
        score: Math.round(totalScore * 100) / 100,
        breakdown: {
          budget: budgetScore,
          mood: moodScore,
          personality: personalityScore,
          certification: certScore,
          behavior: behaviorScore
        }
      })
    }

    // 按总分降序排列
    scored.sort((a, b) => b.score - a.score)

    recommendations.value = scored
    lastUpdated.value = new Date().toISOString()
  }

  /**
   * 预算匹配：商家价格 <= 用户预算 → 30 * (1 - price/budget)，否则 0
   */
  function computeBudgetScore(userBudget, merchantPrice) {
    if (merchantPrice <= 0) return 30  // 免费景点满分
    if (merchantPrice <= userBudget) {
      return Math.round(30 * (1 - merchantPrice / userBudget) * 100) / 100
    }
    return 0
  }

  /**
   * 情绪匹配：基于情绪标签与商家标签的兼容性
   */
  function computeMoodScore(mood, merchantTags) {
    const preferredTags = MOOD_TAG_MAP[mood] || MOOD_TAG_MAP.calm
    if (!preferredTags || preferredTags.length === 0) return 10

    let matchCount = 0
    for (const tag of merchantTags) {
      if (preferredTags.some(pt => tag.includes(pt) || pt.includes(tag))) {
        matchCount++
      }
    }

    // 匹配比例 × 20，最多20分
    const ratio = Math.min(matchCount / Math.max(preferredTags.length, 1), 1)
    return Math.round(ratio * 20 * 100) / 100
  }

  /**
   * 人格匹配：使用 MBTI_WEIGHTS 或 EMOTION_BASE_WEIGHTS 匹配商家标签
   */
  function computePersonalityScore(profile, merchantTags) {
    // 优先使用 MBTI 权重，fallback 到情绪底色权重
    const mbtiWeights = MBTI_WEIGHTS[profile.mbti] || MBTI_WEIGHTS.unknown
    const emotionWeights = EMOTION_BASE_WEIGHTS[profile.emotionBase] || EMOTION_BASE_WEIGHTS.calm

    // 合并权重：MBTI 占 60%，情绪底色占 40%
    const mergedWeights = {}
    const allCategories = new Set([...Object.keys(mbtiWeights), ...Object.keys(emotionWeights)])

    for (const cat of allCategories) {
      mergedWeights[cat] = (mbtiWeights[cat] || 0) * 0.6 + (emotionWeights[cat] || 0) * 0.4
    }

    let totalScore = 0
    let totalWeight = 0

    for (const [category, weight] of Object.entries(mergedWeights)) {
      const categoryTags = CATEGORY_TAG_MAP[category] || []
      if (categoryTags.length === 0) continue

      // 该类别下商家标签的匹配度
      let categoryMatch = 0
      for (const tag of merchantTags) {
        if (categoryTags.some(ct => tag.includes(ct) || ct.includes(tag))) {
          categoryMatch++
        }
      }

      const categoryRatio = Math.min(categoryMatch / Math.max(categoryTags.length, 1), 1)
      totalScore += categoryRatio * weight
      totalWeight += weight
    }

    if (totalWeight === 0) return 10

    const normalized = (totalScore / totalWeight) * 20
    return Math.round(Math.min(normalized, 20) * 100) / 100
  }

  /**
   * 认证优先级：根据商家套餐等级计算分数
   */
  function computeCertScore(certifiedLevel) {
    const level = CERT_LEVEL_MAP[certifiedLevel] || 'free'
    return CERT_PRIORITY_SCORE[level] || 0
  }

  /**
   * 行为奖励：浏览历史 +5，收藏 +10
   */
  function computeBehaviorScore(profile, merchantId) {
    let score = 0
    if (profile.browsingHistory.includes(merchantId)) {
      score += 5
    }
    if (profile.favoriteMerchants.includes(merchantId)) {
      score += 10
    }
    return score
  }

  /**
   * 行为追踪：记录用户行为事件
   */
  function trackBehavior(action, merchantId) {
    const profile = travelStore

    // 更新浏览历史
    if (action === 'view' && merchantId) {
      if (!profile.browsingHistory) {
        profile.browsingHistory = []
      }
      if (!profile.browsingHistory.includes(merchantId)) {
        profile.browsingHistory.unshift(merchantId)
        if (profile.browsingHistory.length > 20) {
          profile.browsingHistory = profile.browsingHistory.slice(0, 20)
        }
      }
    }

    // 更新收藏
    if (action === 'favorite' && merchantId) {
      if (!profile.favoriteMerchants) {
        profile.favoriteMerchants = []
      }
      if (!profile.favoriteMerchants.includes(merchantId)) {
        profile.favoriteMerchants.push(merchantId)
      }
    }

    // 行为发生后重新计算推荐
    computeRecommendations()

    return {
      action,
      merchantId,
      timestamp: Date.now()
    }
  }

  return {
    // State
    recommendations,
    algorithmVersion,
    lastUpdated,
    // Getters
    topRecommendations,
    certifiedOnly,
    // Actions
    computeRecommendations,
    trackBehavior
  }
})