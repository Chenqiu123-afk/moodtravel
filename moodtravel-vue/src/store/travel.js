import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBudgetRange, getSanxinCity, ANXIOUS_KEYWORDS } from '@/data/zhejiangData.js'

const MOOD_THEME_MAP = {
  tired:   { name: '静谧蓝', primary: '#6B8FA3', primaryLight: '#A3C4D6', bg: '#EDF3F6', bgGradient: '#DCE8EE', accent: '#5B7D8F' },
  excited: { name: '活力橙', primary: '#E8945A', primaryLight: '#F5C19A', bg: '#FEF8F2', bgGradient: '#FDF0E4', accent: '#D4783A' },
  happy:   { name: '暖阳绿', primary: '#8BA88C', primaryLight: '#B5CEB6', bg: '#F2F7F0', bgGradient: '#E6F0E4', accent: '#6B8E6C' },
  calm:    { name: '莫兰迪绿', primary: '#A3B5A6', primaryLight: '#C5D5C8', bg: '#F5F2ED', bgGradient: '#E8EDE5', accent: '#7A9680' },
  anxious: { name: '薰衣草紫', primary: '#B5A3C4', primaryLight: '#D5C8E0', bg: '#F6F3F8', bgGradient: '#EDE8F2', accent: '#8E7DA8' },
  sad:     { name: '柔雾粉', primary: '#C4A8A8', primaryLight: '#DDC8C8', bg: '#F8F4F4', bgGradient: '#F0E8E8', accent: '#A88888' }
}

const DEFAULT_THEME = MOOD_THEME_MAP.calm

function applyTheme(theme) {
  const root = document.documentElement
  root.style.setProperty('--theme-primary', theme.primary)
  root.style.setProperty('--theme-primary-light', theme.primaryLight)
  root.style.setProperty('--theme-bg', theme.bg)
  root.style.setProperty('--theme-bg-gradient', theme.bgGradient)
  root.style.setProperty('--theme-accent', theme.accent)
}

export const useTravelStore = defineStore('travel', () => {
  const moodIndex = ref(5)
  const moodLabel = ref('calm')
  const moodEmoji = ref('😌')
  const activeTheme = ref({ ...DEFAULT_THEME })

  const budget = ref(2000)
  const budgetLabel = ref('舒适出行')

  const companionCount = ref(1)
  const companions = ref([{ role: 'self', age: 28, name: '我' }])
  const hasElderly = ref(false)
const hasKids = ref(false)
const isCouple = ref(false)
const showCompanionPopup = ref(false)

  const isDieting = ref(false)
  const budgetSensitive = ref(false)

  const destination = ref('杭州')
  const days = ref(2)

  const itinerary = ref(null)
  const hotel = ref(null)
  const stats = ref(null)
  const isPlanning = ref(false)

  // 旅程进行中状态
  const tripActive = ref(false)
  const currentDayIndex = ref(0)
  const currentItemIndex = ref(0)

  const isLoggedIn = ref(false)
const userInfo = ref(null)

// 长辈关怀模式
const elderlyMode = ref(false)

// 能量状态：0=躺平 → 100=探索
const energyLevel = ref(50)

// 日常微情绪场景（高频打低频）：null 表示无过滤，否则为场景 key
const dailyScenario = ref(null)

// 首页展示模式：daily（日常）| travel（旅行）
const displayMode = ref('daily')

// Pro 订阅方案
  const proPlan = ref(localStorage.getItem('moodtravel_pro_plan') || 'pro-free')

  // ================================================================
  //  预算动态区间 & 校验
  // ================================================================
  const budgetMin = computed(() => getBudgetRange(days.value).min)
  const budgetMax = computed(() => getBudgetRange(days.value).max)
  const budgetWarning = ref('')   // 预算校验提示文案

  // ================================================================
  //  模式色彩：旅游=温暖系(#FFA500)，出行=冷静系(#4682B4)
  // ================================================================
  const modeColor = computed(() => displayMode.value === 'travel' ? '#FFA500' : '#4682B4')
  const modeColorLight = computed(() => displayMode.value === 'travel' ? '#FFB830' : '#6BA0CC')
  const modeLabel = computed(() => displayMode.value === 'travel' ? '放松 · 探索' : '高效 · 便捷')

  // ================================================================
  //  隐性情绪检测：滚动计数 + 关键词检测
  // ================================================================
  const scrollCount = ref(0)       // 当前页面滚动次数
  const keywordTriggered = ref(false) // 是否已通过关键词触发过 anxious

  function resetScrollCount() {
    scrollCount.value = 0
  }

  function incrementScroll() {
    scrollCount.value++
    // 单页滚动超过 10 次，自动触发 anxious
    if (scrollCount.value >= 10 && moodLabel.value !== 'anxious') {
      triggerAnxious('scroll')
    }
  }

  function detectAnxiousKeyword(text) {
    if (!text || keywordTriggered.value) return false
    const lower = text.toLowerCase()
    const matched = ANXIOUS_KEYWORDS.some(kw => lower.includes(kw))
    if (matched && moodLabel.value !== 'anxious') {
      triggerAnxious('keyword')
      return true
    }
    return false
  }

  function triggerAnxious(source) {
    keywordTriggered.value = true
    setMood('anxious', 3, '😫')
    // 自动切换到旅行模式以生成散心路线
    if (displayMode.value !== 'travel') {
      displayMode.value = 'travel'
    }
    // 随机选择一个浙江散心城市（排除杭州）
    const city = getSanxinCity()
    destination.value = city.name
    console.log(`[MoodTravel] 隐性情绪触发 (${source}): mood=anxious, dest=${city.name}`)
  }

  // ================================================================
  //  浙江散心路线快速生成
  // ================================================================
  function quickSanxinPlan() {
    setMood('anxious', 3, '😫')
    keywordTriggered.value = true
    if (displayMode.value !== 'travel') {
      displayMode.value = 'travel'
    }
    const city = getSanxinCity()
    destination.value = city.name
    return city
  }

  // ================================================================
  //  日常情绪与人文关怀 — 情绪日记 & 每日打卡
  // ================================================================
  const moodJournal = ref(loadJournal())        // [{ date, mood, emoji, note, timestamp }]
  const lastCheckInDate = ref(localStorage.getItem('moodtravel_last_checkin') || '')
  const dailyCareLetter = ref(null)              // 当日人文关怀信

  // 打卡天数统计
  const dailyStreak = computed(() => {
    const entries = moodJournal.value
    if (!entries.length) return 0
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    let checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)
    for (const entry of sorted) {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)
      const diff = (checkDate.getTime() - entryDate.getTime()) / 86400000
      if (diff === streak) { streak++; checkDate = entryDate }
      else break
    }
    return streak
  })

  const totalCheckIns = computed(() => moodJournal.value.length)

  const checkedInToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return lastCheckInDate.value === today
  })

  function loadJournal() {
    try {
      return JSON.parse(localStorage.getItem('moodtravel_journal') || '[]')
    } catch { return [] }
  }

  function saveJournal() {
    localStorage.setItem('moodtravel_journal', JSON.stringify(moodJournal.value))
  }

  function checkInToday(mood, emoji, note = '') {
    const today = new Date().toISOString().slice(0, 10)
    if (lastCheckInDate.value === today) return false
    const entry = {
      date: today,
      mood,
      emoji,
      note,
      timestamp: Date.now()
    }
    moodJournal.value.unshift(entry)
    saveJournal()
    lastCheckInDate.value = today
    localStorage.setItem('moodtravel_last_checkin', today)
    return true
  }

  function generateCareLetter() {
    const hour = new Date().getHours()
    const timeGreeting = hour < 6 ? '深夜好' : hour < 9 ? '早安' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
    const mood = moodLabel.value
    const streak = dailyStreak.value
    const isElderly = elderlyMode.value

    const moodCare = {
      tired:   { title: '今天允许自己慢下来', body: '疲惫不是软弱，是身体在提醒你需要休息。泡一杯温热的茶，找一个舒服的角落，不需要做任何事——只是呼吸，只是存在。', action: '点一支香薰蜡烛，听一首没有歌词的轻音乐。' },
      excited: { title: '让这份能量流动起来', body: '兴奋是生命力的绽放。今天适合去做一件你一直想做但没做的事，哪怕只是走出门散个步，或者给一个老朋友打个电话。', action: '把这份能量写下来，或者画下来——创造力需要出口。' },
      happy:   { title: '珍惜此刻的光亮', body: '开心的时候，世界都是暖色调的。不需要寻找意义，此刻本身就是意义。如果可以，记得把这份温暖传递给身边的人。', action: '拍一张记录此刻的照片，放进你的情绪日记里。' },
      calm:    { title: '平静是最高级的能量', body: '不疾不徐，不忧不惧。平静不是无聊，而是内心足够丰盈。今天的一切都刚刚好——阳光、空气、和你自己。', action: '尝试五分钟的正念呼吸：吸气四秒，屏息四秒，呼气六秒。' },
      anxious: { title: '焦虑是你在乎的证明', body: '手心出汗、心跳加速——这些都是你认真生活的证据。深呼吸，把手放在心口，对自己说：我已经做得很好了。', action: '写下三件今天让你感到安全的小事，哪怕只是喝到了一杯温度刚好的水。' },
      sad:     { title: '悲伤值得被温柔对待', body: '低落的时候不需要急着振作。眼泪是心灵的雨水，落完了，天空自然会放晴。今天你是被允许脆弱的。', action: '裹一条柔软的毯子，看一部温暖的电影，或者什么也不做——只是允许自己难过。' }
    }

    const care = moodCare[mood] || moodCare.calm

    const quotes = [
      '「你不需要成为更好的自己，你只需要更温柔地对待此刻的自己。」',
      '「生活不是马拉松，而是散步——停下来看看花，也是一种前进。」',
      '「今天你已经很棒了，哪怕只是起床、呼吸、存在。」',
      '「情绪像天气，没有好坏之分。雨天的意义，是让晴天的阳光更珍贵。」',
      '「真正的勇敢，不是从不疲惫，而是疲惫时依然选择温柔对待自己。」'
    ]

    dailyCareLetter.value = {
      greeting: timeGreeting,
      title: care.title,
      body: care.body,
      action: care.action,
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      streak: streak,
      date: new Date().toISOString().slice(0, 10),
      moodEmoji: moodEmoji.value,
      moodLabel: moodLabelCN.value
    }
    return dailyCareLetter.value
  }

  function getCareLetter() {
    if (!dailyCareLetter.value) return generateCareLetter()
    const today = new Date().toISOString().slice(0, 10)
    if (dailyCareLetter.value.date !== today) return generateCareLetter()
    return dailyCareLetter.value
  }

  const moodDescription = computed(() => {
    const map = {
      excited: '活力满满，想要精彩不停', happy: '心情不错，享受美好旅程',
      calm: '不紧不慢，顺其自然', anxious: '有点焦虑，需要安静治愈',
      tired: '身心疲惫，需要放慢节奏', sad: '情绪低落，需要被温柔对待'
    }
    return map[moodLabel.value] || '开始你的旅程'
  })

  const moodLabelCN = computed(() => {
    const map = { excited:'兴奋', happy:'开心', calm:'平静', anxious:'焦虑', tired:'疲惫', sad:'低落' }
    return map[moodLabel.value] || '平静'
  })

  function setMood(label, index, emoji) {
    moodLabel.value = label
    moodIndex.value = index
    moodEmoji.value = emoji
    const theme = MOOD_THEME_MAP[label] || DEFAULT_THEME
    activeTheme.value = { ...theme }
    applyTheme(theme)
    localStorage.setItem('moodtravel_last_mood', label)
  }

  function setBudget(amount, label) {
    budget.value = amount
    if (label) budgetLabel.value = label
  }

  function addCompanion(role = 'friend', age = 25, name = '') {
    const roleNames = { child: '小朋友', elderly: '长辈', friend: '朋友', self: '我' }
    companions.value.push({ role, age, name: name || (roleNames[role] || '同行者') + (companions.value.length) })
    companionCount.value = companions.value.length
    syncCompanionFlags()
  }

  function removeCompanion(index) {
    if (index > 0 && companions.value.length > 1) {
      companions.value.splice(index, 1)
      companionCount.value = companions.value.length
      syncCompanionFlags()
    }
  }

  function updateCompanion(index, data) {
    if (companions.value[index]) {
      Object.assign(companions.value[index], data)
      syncCompanionFlags()
    }
  }

  function syncCompanionFlags() {
    hasKids.value = companions.value.some(c => c.role === 'child' && c.age < 12)
    hasElderly.value = companions.value.some(c => c.age >= 60)
    // 情侣模式：2人同行，另一位是朋友（年龄差<15岁），无小孩无老人
    isCouple.value = companionCount.value === 2
      && companions.value.some(c => c.role === 'friend')
      && !hasKids.value
      && !hasElderly.value
  }

  function toggleSetting(key) {
    if (key === 'diet') isDieting.value = !isDieting.value
    if (key === 'budget') budgetSensitive.value = !budgetSensitive.value
  }

  function toggleDisplayMode() {
    displayMode.value = displayMode.value === 'daily' ? 'travel' : 'daily'
  }

  function toggleElderlyMode() {
    elderlyMode.value = !elderlyMode.value
    if (elderlyMode.value) {
      document.documentElement.setAttribute('data-accessibility', 'elderly')
    } else {
      document.documentElement.removeAttribute('data-accessibility')
    }
    localStorage.setItem('moodtravel_elderly_mode', elderlyMode.value ? '1' : '0')
  }

  function applyElderlyMode() {
    const saved = localStorage.getItem('moodtravel_elderly_mode')
    if (saved === '1') {
      elderlyMode.value = true
      document.documentElement.setAttribute('data-accessibility', 'elderly')
    }
  }

  function setLogin(user) {
    isLoggedIn.value = true
    userInfo.value = user
    localStorage.setItem('moodtravel_user', JSON.stringify(user))
  }

  function logout() {
    isLoggedIn.value = false
    userInfo.value = null
    localStorage.removeItem('moodtravel_user')
  }

  function reset() {
    moodIndex.value = 5; moodLabel.value = 'calm'; moodEmoji.value = '😌'
    activeTheme.value = { ...DEFAULT_THEME }; applyTheme(DEFAULT_THEME)
    budget.value = 2000; budgetLabel.value = '舒适出行'
    companionCount.value = 1; companions.value = [{ role: 'self', age: 28, name: '我' }]
    hasKids.value = false; hasElderly.value = false; isCouple.value = false
    isDieting.value = false; budgetSensitive.value = false
    itinerary.value = null; hotel.value = null; stats.value = null; isPlanning.value = false
    tripActive.value = false; currentDayIndex.value = 0; currentItemIndex.value = 0
    energyLevel.value = 50
    // 注意：elderlyMode 和 情绪日记 不随 reset 重置，保持用户偏好
  }

  // ================================================================
  //  认证商家 & 分成相关状态
  // ================================================================
  const certifiedOnly = ref(true)
  const showBookingSharePopup = ref(false)
  const bookingShareData = ref(null)

  function toggleCertifiedOnly() {
    certifiedOnly.value = !certifiedOnly.value
  }

  function showSharePopup(data) {
    bookingShareData.value = data
    showBookingSharePopup.value = true
  }

  function hideSharePopup() {
    showBookingSharePopup.value = false
    bookingShareData.value = null
  }

  return {
    moodIndex, moodLabel, moodEmoji, activeTheme,
    budget, budgetLabel, companionCount, companions, hasElderly, hasKids, isCouple, showCompanionPopup,
    isDieting, budgetSensitive, destination, days,
    itinerary, hotel, stats, isPlanning, isLoggedIn, userInfo,
    tripActive, currentDayIndex, currentItemIndex,
    elderlyMode, energyLevel, dailyScenario, displayMode, proPlan,
    moodDescription, moodLabelCN,
    setMood, setBudget, addCompanion, removeCompanion, updateCompanion, syncCompanionFlags,
    toggleSetting, toggleDisplayMode, toggleElderlyMode, applyElderlyMode, reset, setLogin, logout,
    // 情绪日记 & 人文关怀
    moodJournal, lastCheckInDate, dailyCareLetter,
    dailyStreak, totalCheckIns, checkedInToday,
    checkInToday, generateCareLetter, getCareLetter,
    // 认证商家 & 分成
    certifiedOnly, showBookingSharePopup, bookingShareData,
    toggleCertifiedOnly, showSharePopup, hideSharePopup,
    // 预算动态区间 & 校验
    budgetMin, budgetMax, budgetWarning,
    // 模式色彩
    modeColor, modeColorLight, modeLabel,
    // 隐性情绪检测
    scrollCount, keywordTriggered,
    resetScrollCount, incrementScroll, detectAnxiousKeyword, triggerAnxious,
    // 浙江散心
    quickSanxinPlan
  }
})