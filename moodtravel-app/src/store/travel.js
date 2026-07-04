import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/**
 * 全局旅行状态管理 + 动态主题系统
 * 保存用户心情、预算、同行人、主题色等跨页面共享数据
 */

// 心情 → 主题色映射
const MOOD_THEME_MAP = {
  tired:   { name: '静谧蓝', primary: '#6B8FA3', primaryLight: '#A3C4D6', bg: '#EDF3F6', bgGradient: '#DCE8EE', accent: '#5B7D8F' },
  excited: { name: '活力橙', primary: '#E8945A', primaryLight: '#F5C19A', bg: '#FEF8F2', bgGradient: '#FDF0E4', accent: '#D4783A' },
  happy:   { name: '暖阳绿', primary: '#8BA88C', primaryLight: '#B5CEB6', bg: '#F2F7F0', bgGradient: '#E6F0E4', accent: '#6B8E6C' },
  calm:    { name: '莫兰迪绿', primary: '#A3B5A6', primaryLight: '#C5D5C8', bg: '#F5F2ED', bgGradient: '#E8EDE5', accent: '#7A9680' },
  anxious: { name: '薰衣草紫', primary: '#B5A3C4', primaryLight: '#D5C8E0', bg: '#F6F3F8', bgGradient: '#EDE8F2', accent: '#8E7DA8' },
  sad:     { name: '柔雾粉', primary: '#C4A8A8', primaryLight: '#DDC8C8', bg: '#F8F4F4', bgGradient: '#F0E8E8', accent: '#A88888' }
}

const DEFAULT_THEME = MOOD_THEME_MAP.calm

export const useTravelStore = defineStore('travel', () => {

  // ============ 心情状态 ============
  const moodIndex = ref(5)
  const moodLabel = ref('calm')
  const moodEmoji = ref('😌')

  // ============ 动态主题 ============
  const activeTheme = ref({ ...DEFAULT_THEME })

  // ============ 预算 ============
  const budget = ref(2000)
  const budgetLabel = ref('舒适出行')

  // ============ 同行人管理 ============
  const companionCount = ref(1)
  const companions = ref([{ role: 'self', age: 28, name: '我' }])
  const hasElderly = ref(false)
  const hasKids = ref(false)
  const showCompanionPopup = ref(false)

  // ============ 开关 ============
  const isDieting = ref(false)
  const budgetSensitive = ref(false)

  // ============ 目的地 ============
  const destination = ref('杭州')
  const startDate = ref('')
  const days = ref(2)

  // ============ 行程结果 ============
  const itinerary = ref(null)
  const hotel = ref(null)
  const stats = ref(null)
  const isPlanning = ref(false)

  // ============ 登录状态 ============
  const isLoggedIn = ref(false)
  const userInfo = ref(null)

  // ============ 计算属性 ============
  const moodDescription = computed(() => {
    const map = {
      excited: '活力满满，想要精彩不停',
      happy: '心情不错，享受美好旅程',
      calm: '不紧不慢，顺其自然',
      anxious: '有点焦虑，需要安静治愈',
      tired: '身心疲惫，需要放慢节奏',
      sad: '情绪低落，需要被温柔对待'
    }
    return map[moodLabel.value] || '开始你的旅程'
  })

  const moodTag = computed(() => {
    if (moodIndex.value >= 8) return { text: '高能量', color: '#E8945A' }
    if (moodIndex.value >= 6) return { text: '愉悦', color: '#8BA88C' }
    if (moodIndex.value >= 4) return { text: '平静', color: '#A3B5A6' }
    if (moodIndex.value >= 2) return { text: '低能量', color: '#6B8FA3' }
    return { text: '需要治愈', color: '#C4A8A8' }
  })

  const moodLabelCN = computed(() => {
    const map = { excited:'兴奋', happy:'开心', calm:'平静', anxious:'焦虑', tired:'疲惫', sad:'低落' }
    return map[moodLabel.value] || '平静'
  })

  // ============ 方法 ============

  /** 设置心情（同时切换主题） */
  function setMood(label, index, emoji) {
    moodLabel.value = label
    moodIndex.value = index
    moodEmoji.value = emoji
    // 切换主题
    const theme = MOOD_THEME_MAP[label] || DEFAULT_THEME
    activeTheme.value = { ...theme }
    applyTheme(theme)
    // 持久化
    try { uni.setStorageSync('moodtravel_last_mood', label) } catch (e) {}
  }

  /** 设置预算 */
  function setBudget(amount, label) {
    budget.value = amount
    if (label) budgetLabel.value = label
  }

  /** 添加同行人 */
  function addCompanion(role = 'friend', age = 25, name = '') {
    const roleNames = { child: '小朋友', elderly: '长辈', friend: '朋友', self: '我' }
    companions.value.push({
      role,
      age,
      name: name || (roleNames[role] || '同行者') + (companions.value.length)
    })
    companionCount.value = companions.value.length
    syncCompanionFlags()
  }

  /** 移除同行人 */
  function removeCompanion(index) {
    if (index > 0 && companions.value.length > 1) {
      companions.value.splice(index, 1)
      companionCount.value = companions.value.length
      syncCompanionFlags()
    }
  }

  /** 更新同行人信息 */
  function updateCompanion(index, data) {
    if (companions.value[index]) {
      Object.assign(companions.value[index], data)
      syncCompanionFlags()
    }
  }

  /** 同步同行人标签 */
  function syncCompanionFlags() {
    hasKids.value = companions.value.some(c => c.role === 'child' && c.age < 12)
    hasElderly.value = companions.value.some(c => c.age >= 60)
  }

  /** 切换开关 */
  function toggleSetting(key) {
    if (key === 'diet') isDieting.value = !isDieting.value
    if (key === 'budget') budgetSensitive.value = !budgetSensitive.value
  }

  /** 设置登录状态 */
  function setLogin(user) {
    isLoggedIn.value = true
    userInfo.value = user
    try { uni.setStorageSync('moodtravel_user', user) } catch (e) {}
  }

  /** 退出登录 */
  function logout() {
    isLoggedIn.value = false
    userInfo.value = null
    try { uni.removeStorageSync('moodtravel_user') } catch (e) {}
  }

  /** 重置所有状态 */
  function reset() {
    moodIndex.value = 5
    moodLabel.value = 'calm'
    moodEmoji.value = '😌'
    activeTheme.value = { ...DEFAULT_THEME }
    applyTheme(DEFAULT_THEME)
    budget.value = 2000
    budgetLabel.value = '舒适出行'
    companionCount.value = 1
    companions.value = [{ role: 'self', age: 28, name: '我' }]
    hasKids.value = false
    hasElderly.value = false
    isDieting.value = false
    budgetSensitive.value = false
    itinerary.value = null
    hotel.value = null
    stats.value = null
    isPlanning.value = false
  }

  return {
    // 状态
    moodIndex, moodLabel, moodEmoji,
    activeTheme,
    budget, budgetLabel,
    companionCount, companions, hasElderly, hasKids, showCompanionPopup,
    isDieting, budgetSensitive,
    destination, startDate, days,
    itinerary, hotel, stats, isPlanning,
    isLoggedIn, userInfo,
    // 计算属性
    moodDescription, moodTag, moodLabelCN,
    // 方法
    setMood, setBudget,
    addCompanion, removeCompanion, updateCompanion, syncCompanionFlags,
    toggleSetting, reset,
    setLogin, logout
  }
})

/**
 * 将主题应用到页面 CSS 变量
 */
function applyTheme(theme) {
  const vars = {
    '--theme-primary': theme.primary,
    '--theme-primary-light': theme.primaryLight,
    '--theme-bg': theme.bg,
    '--theme-bg-gradient': theme.bgGradient,
    '--theme-accent': theme.accent
  }
  // 在 H5 环境设置 :root
  // #ifdef H5
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  // #endif
  // 小程序环境通过 page 样式
  // #ifdef MP-WEIXIN
  // 小程序通过 globalData 传递
  const app = getApp()
  if (app) app.globalData = { ...app.globalData, theme: vars }
  // #endif
}