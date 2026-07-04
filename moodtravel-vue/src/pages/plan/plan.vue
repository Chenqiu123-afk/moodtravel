<template>
  <div class="plan-page" :style="{ background: gradientBg }">
    <!-- 顶部状态栏 -->
    <div class="header">
      <span class="header-title">行程规划</span>
      <span class="header-sub" :style="{ color: store.modeColor }">
        MoodTravel · {{ store.displayMode === 'travel' ? '治愈旅行' : '日常出行' }}
      </span>
      <!-- 模式标签 -->
      <div class="mode-tag" :style="{ background: store.modeColor + '18', color: store.modeColor }">
        {{ store.modeLabel }}
      </div>
    </div>

    <!-- 心情状态卡片 -->
    <div class="mood-card">
      <div class="mood-card-left">
        <span class="mood-emoji">{{ store.moodEmoji }}</span>
        <div class="mood-info">
          <span class="mood-label">当前心情：{{ store.moodLabelCN }}</span>
          <span class="mood-hint">{{ store.moodDescription }}</span>
        </div>
      </div>
      <div class="mood-badge" :style="{ background: theme.primary }">
        {{ theme.name }}
      </div>
    </div>

    <!-- 行程设置 -->
    <div class="section">
      <div class="section-title">📋 行程设置</div>
      <div class="form-card">
        <div class="form-row">
          <span class="form-label">目的地</span>
          <input
            class="form-input"
            :value="store.destination"
            @input="onDestInput"
            placeholder="输入城市名（试试输入"好累"）"
          />
        </div>
        <div class="form-row">
          <span class="form-label">预算</span>
          <div class="budget-slider">
            <span class="budget-value" :style="{ color: theme.primary }">¥{{ store.budget }}</span>
            <input
              type="range"
              :value="store.budget"
              :min="budgetMin"
              :max="budgetMax"
              :step="100"
              @input="onBudgetChange"
              class="range-input"
              :style="{ '--range-color': theme.primary }"
            />
          </div>
        </div>
        <div class="budget-range-hint">
          <span>{{ days }}天行程合理预算：¥{{ budgetMin }} - ¥{{ budgetMax }}</span>
        </div>
        <!-- 预算校验提示 -->
        <div v-if="budgetWarning" class="budget-warning" :class="{ luxury: budgetWarning.includes('奢华') }">
          <span>{{ budgetWarning.includes('不够') ? '⚠️' : '👑' }}</span>
          <span>{{ budgetWarning }}</span>
        </div>
        <div class="budget-presets">
          <div
            v-for="preset in budgetPresets"
            :key="preset.label"
            class="budget-preset"
            :class="{ active: store.budgetLabel === preset.label }"
            :style="store.budgetLabel === preset.label ? { background: theme.primary } : {}"
            @click="store.setBudget(preset.value, preset.label)"
          >
            <span>{{ preset.icon }} {{ preset.label }}</span>
          </div>
        </div>
        <div class="form-row">
          <span class="form-label">同行人数</span>
          <span class="form-value" @click="openCompanionPopup">{{ companionSummary }}</span>
        </div>
        <div class="form-row">
          <span class="form-label">行程天数</span>
          <div class="stepper">
            <div class="stepper-btn" @click="days > 1 ? days-- : null">−</div>
            <span class="stepper-value">{{ days }}</span>
            <div class="stepper-btn" @click="days < 5 ? days++ : null">+</div>
          </div>
        </div>
        <div class="form-row">
          <span class="form-label">天气模拟</span>
          <div class="weather-toggle">
            <span>{{ isRain ? '🌧️ 暴雨模式' : '☀️ 晴天模式' }}</span>
            <label class="switch-wrapper">
              <input type="checkbox" :checked="isRain" @change="isRain = !isRain" />
              <span class="switch-slider" :style="{ '--switch-color': theme.primary }"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 品牌IP加载动画 -->
    <CloudLoading
      v-if="store.isPlanning"
      :steps="loadingSteps"
      :current-step="currentStep"
      :theme-color="theme.primary"
    />

    <!-- 仪表盘 -->
    <div v-if="store.stats" class="section">
      <div class="section-title">📊 行程概览</div>
      <div class="dashboard">
        <div class="gauge-card">
          <span class="gauge-label">⚡ 精力消耗</span>
          <div class="gauge-bar">
            <div class="gauge-fill" :style="{ width: energyPercent + '%', background: energyColor }" />
          </div>
          <span class="gauge-value" :style="{ color: energyColor }">{{ energyLabel }}</span>
        </div>
        <div class="gauge-card">
          <span class="gauge-label">💳 预算使用</span>
          <div class="gauge-bar">
            <div class="gauge-fill" :style="{ width: budgetPercent + '%', background: budgetColor }" />
          </div>
          <span class="gauge-value" :style="{ color: budgetColor }">
            ¥{{ store.stats?.totalCost || 0 }} / ¥{{ store.budget }}
          </span>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">{{ store.stats?.filterPassed || 0 }}/{{ store.stats?.filterTotal || 0 }}</span>
          <span class="stat-label">通过过滤</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ store.stats?.totalPois || 0 }}</span>
          <span class="stat-label">精选景点</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">¥{{ store.stats?.totalSaved || 0 }}</span>
          <span class="stat-label">比价节省</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ isRain ? '🌧️' : '☀️' }}</span>
          <span class="stat-label">天气</span>
        </div>
      </div>
    </div>

    <!-- 行程时间轴 -->
    <div class="section" v-if="store.itinerary">
      <div class="section-title">📅 推荐行程</div>
      <div v-for="(day, di) in store.itinerary" :key="di">
        <div class="day-header" :style="{ background: theme.primaryLight + '25', color: theme.primary }">
          <span>Day {{ day.day }}</span>
          <span>{{ day.items?.length || 0 }} 个节点</span>
        </div>
        <div class="timeline">
          <div v-for="(item, ii) in day.items" :key="ii" class="timeline-item">
            <div class="timeline-dot" :style="{ background: dotColor(item.type) }" />
            <div class="timeline-card" :class="{ 'has-booking': item.type !== 'rest' }">
              <div class="time-row">
                <span class="time">{{ item.time }}</span>
                <span class="category">{{ typeLabel(item.type) }}</span>
              </div>
              <span class="poi-name">{{ item.name }}</span>
              <span class="poi-desc" v-if="item.desc">{{ item.desc }}</span>
              <div class="reason-bar">
                <span>💡 {{ item.reason }}</span>
              </div>
              <div class="tags" v-if="item.reasonTags">
                <span v-for="tag in item.reasonTags" :key="tag" class="tag" :style="tagStyle(tag)">{{ tag }}</span>
              </div>
              <div class="booking-row" v-if="item.type !== 'rest'">
                <div class="price-tag" :style="{ color: theme.primary }">
                  ¥{{ item.estimatedCost || 0 }}
                </div>
                <div class="book-btn" :style="{ background: theme.primary }" @click="handleBooking(item)" :class="{ loading: bookingItem === item }">
                  <span v-if="bookingItem !== item">预订</span>
                  <span v-else>比价中...</span>
                </div>
              </div>
              <div class="compare-inline" v-if="item.type !== 'rest' && item.estimatedCost > 0">
                <span class="compare-inline-icon">🔍</span>
                <span class="compare-inline-text">AI比价：美团 ¥{{ Math.round(item.estimatedCost * 0.93) }} 起</span>
                <span class="compare-inline-save">省¥{{ Math.round(item.estimatedCost * 0.12) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 酒店推荐 -->
    <div class="section" v-if="store.hotel">
      <div class="section-title">🏨 酒店推荐</div>
      <div class="hotel-card">
        <div class="hotel-header">
          <div class="hotel-info">
            <span class="hotel-name">{{ store.hotel.name }}</span>
            <span class="hotel-rating">⭐ {{ store.hotel.rating }}分</span>
          </div>
          <div class="hotel-price" :style="{ color: theme.primary }">
            ¥{{ store.hotel.bestPrice || store.hotel.price }}
          </div>
        </div>
        <span class="hotel-reason">💡 {{ store.hotel.reason }}</span>

        <!-- AI 比价结论 -->
        <div class="ai-compare" v-if="store.hotel.platforms">
          <div class="compare-title">
            <span class="ai-badge">AI 比价</span>
            <span class="ai-tip">已为您对比 {{ store.hotel.platforms.length }} 个平台</span>
          </div>
          <div class="compare-list">
            <div
              v-for="p in store.hotel.platforms"
              :key="p.name"
              class="compare-row"
              :class="{ best: p.isBest }"
            >
              <span class="compare-platform">{{ p.icon }} {{ p.name }}</span>
              <span class="compare-price">¥{{ p.price }}</span>
              <span class="compare-features">{{ p.features }}</span>
              <span v-if="p.isBest" class="compare-best-tag">最优</span>
            </div>
          </div>
          <div class="compare-verdict" :style="{ background: theme.primary + '12' }">
            <span>� AI建议：{{ store.hotel.bestPlatform }}（{{ store.hotel.bestReason }}）</span>
          </div>
        </div>

        <div class="hotel-savings" v-if="store.hotel.savedAmount > 0">
          💰 比价节省 ¥{{ store.hotel.savedAmount }}
        </div>
        <div class="book-btn hotel-book-btn" :style="{ background: theme.primary }" @click="handleBooking(store.hotel)">
          <span>预订酒店</span>
        </div>
      </div>
    </div>

    <!-- 开启旅程按钮 -->
    <button v-if="store.itinerary && !store.tripActive" class="start-trip-btn" :style="genBtnStyle" @click="startTrip">
      <span>🚀 开启旅程 · 进入今日向导</span>
    </button>

    <!-- 生成按钮 -->
    <button class="generate-btn" :style="genBtnStyle" @click="generatePlan" :disabled="store.isPlanning">
      <span v-if="!store.isPlanning">✨ 智能生成行程</span>
      <span v-else>⏳ AI 正在规划中...</span>
    </button>

    <!-- SOS 紧急模式 -->
    <EmergencyModal
      v-if="store.itinerary"
      :itinerary="store.itinerary"
      :destination="store.destination"
      :is-rain="isRain"
      :has-elderly="store.hasElderly"
      @apply-itinerary="onApplySOS"
      @set-rain="onSetRain"
    />

    <!-- 预订比价弹窗 -->
    <div class="popup-overlay" v-if="showBookingPopup" @click="showBookingPopup = false">
      <div class="booking-popup" @click.stop>
        <div class="booking-popup-header">
          <span class="booking-popup-title">🔍 全网比价中</span>
        </div>
        <div class="booking-popup-body">
          <div class="booking-spinner" :style="{ borderTopColor: theme.primary }" />
          <span class="booking-popup-text">正在为您查询 {{ platforms.length }} 个平台...</span>
          <div class="platform-list">
            <div v-for="(p, i) in platforms" :key="p.name" class="platform-item" :class="{ checked: i <= checkedPlatform }">
              <span class="platform-icon">{{ p.icon }}</span>
              <span class="platform-name">{{ p.name }}</span>
              <span v-if="i <= checkedPlatform" class="platform-price">¥{{ p.price }}</span>
              <span v-else class="platform-wait">查询中...</span>
            </div>
          </div>
        </div>
        <div class="booking-popup-footer" v-if="bookingDone">
          <span class="booking-best">🏆 {{ bestPlatform }} 最优惠，仅需 ¥{{ bestPrice }}</span>
          <span class="booking-save">已为您节省 ¥{{ savedAmount }}</span>
          <button class="booking-action-btn" :style="{ background: theme.primary }" @click="showBookingPopup = false">
            前往预订
          </button>
        </div>
      </div>
    </div>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import { getBudgetRange, ZHEJIANG_CITIES } from '@/data/zhejiangData.js'
import CloudLoading from '@/components/CloudLoading.vue'
import EmergencyModal from '@/components/EmergencyModal.vue'

const store = useTravelStore()
const router = useRouter()
const theme = computed(() => store.activeTheme)

const days = ref(store.days || 2)
const isRain = ref(false)
const loadingText = ref('正在分析...')
const currentStep = ref(0)

// ---- 预算动态区间 ----
const budgetRange = computed(() => getBudgetRange(days.value))
const budgetMin = computed(() => budgetRange.value.min)
const budgetMax = computed(() => budgetRange.value.max)
const budgetWarning = ref('')
const budgetInputFocused = ref(false)

// ---- 目的地输入监听 ----
const destInput = ref(store.destination || '')
const lastDestChange = ref(0)

// 监听目的地输入，检测焦虑关键词
function onDestInput(e) {
  const val = e.target.value
  destInput.value = val
  store.destination = val
  lastDestChange.value = Date.now()
  // 隐性检测：关键词触发
  if (val.length >= 2) {
    store.detectAnxiousKeyword(val)
  }
}

// 监听预算变化进行校验
function onBudgetChange(e) {
  const val = parseInt(e.target.value)
  store.budget = val
  validateBudget(val)
}

function validateBudget(val) {
  const min = budgetMin.value
  const max = budgetMax.value
  if (val < min) {
    budgetWarning.value = `预算可能不够哦（${days.value}天行程建议至少 ¥${min}）`
  } else if (val > max * 2.5) {
    budgetWarning.value = '已为您开启奢华模式'
  } else {
    budgetWarning.value = ''
  }
}

// 监听天数变化，同步 store 并调整预算
watch(days, (newVal) => {
  store.days = newVal
  const range = getBudgetRange(newVal)
  // 如果当前预算超出新区间，自动调整到合理值
  if (store.budget < range.min) {
    store.setBudget(range.min, '')
    validateBudget(range.min)
  } else if (store.budget > range.max) {
    validateBudget(store.budget)
  } else {
    validateBudget(store.budget)
  }
})

// ---- 滚动检测 ----
let scrollTimer = null
function onPageScroll() {
  if (scrollTimer) return
  scrollTimer = setTimeout(() => {
    scrollTimer = null
  }, 200)
  store.incrementScroll()
}

onMounted(() => {
  window.addEventListener('scroll', onPageScroll, { passive: true })
  store.resetScrollCount()
  // 初始校验
  validateBudget(store.budget)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onPageScroll)
})

const loadingSteps = [
  '分析心情状态',
  '加载目的地数据',
  '计算多维权重矩阵',
  '比价酒店平台',
  '模拟天气影响',
  '编排最优行程'
]

const genBtnStyle = computed(() => ({
  background: `linear-gradient(135deg, ${theme.value.primaryLight}, ${theme.value.primary})`,
  boxShadow: `0 6px 16px ${theme.value.primary}40`
}))

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 30%)`
})

const companionSummary = computed(() => {
  const c = store.companionCount
  if (c === 1) return '独自出行'
  const parts = []
  if (store.hasKids) parts.push('含儿童')
  if (store.hasElderly) parts.push('含老人')
  return `${c}人` + (parts.length ? ' · ' + parts.join('·') : '')
})

const energyPercent = computed(() => {
  const mood = store.moodLabel
  const map = { tired: 25, sad: 30, anxious: 40, calm: 50, happy: 65, excited: 85 }
  return map[mood] || 50
})
const energyColor = computed(() => {
  if (energyPercent.value <= 30) return '#6B8FA3'
  if (energyPercent.value <= 60) return '#A3B5A6'
  return '#E8945A'
})
const energyLabel = computed(() => {
  if (energyPercent.value <= 30) return '轻松漫步'
  if (energyPercent.value <= 60) return '适度游玩'
  return '精力充沛'
})

const budgetPercent = computed(() => {
  if (!store.stats || !store.budget) return 0
  return Math.min(Math.round(store.stats.totalCost / store.budget * 100), 100)
})
const budgetColor = computed(() => {
  if (budgetPercent.value <= 50) return '#8BA88C'
  if (budgetPercent.value <= 80) return '#E8945A'
  return '#C48888'
})

const budgetPresets = computed(() => {
  const min = budgetMin.value
  const max = budgetMax.value
  const step = Math.round((max - min) / 3)
  return [
    { label: '经济出行', value: min, icon: '🎒' },
    { label: '舒适出行', value: Math.round(min + step), icon: '🏨' },
    { label: '品质享受', value: Math.round(min + step * 2), icon: '✨' },
    { label: '奢华体验', value: max, icon: '👑' }
  ]
})

const showBookingPopup = ref(false)
const bookingItem = ref(null)
const platforms = ref([])
const checkedPlatform = ref(-1)
const bookingDone = ref(false)
const bestPlatform = ref('')
const bestPrice = ref(0)
const savedAmount = ref(0)

const PLATFORM_LIST = [
  { name: '携程', icon: '🏨', baseMultiplier: 1.0 },
  { name: '美团', icon: '🍜', baseMultiplier: 0.95 },
  { name: '飞猪', icon: '🐷', baseMultiplier: 0.92 },
  { name: '去哪儿', icon: '✈️', baseMultiplier: 0.97 },
  { name: '同程', icon: '🎫', baseMultiplier: 0.93 }
]

function onBudgetChange(e) {
  store.budget = parseInt(e.target.value)
}

function openCompanionPopup() {
  store.showCompanionPopup = true
}

function dotColor(type) {
  const map = { poi: '#A3B5A6', restaurant: '#E8945A', rest: '#B5A3C4' }
  return map[type] || '#A3B5A6'
}

function typeLabel(type) {
  const map = { poi: '景点', restaurant: '餐厅', rest: '休息' }
  return map[type] || '景点'
}

function tagStyle(tag) {
  if (tag.includes('心情')) return { background: '#F0EDF5', color: '#B5A3C4' }
  if (tag.includes('预算') || tag.includes('性价比') || tag.includes('免费')) return { background: '#FDF3E6', color: '#E8945A' }
  if (tag.includes('低卡') || tag.includes('健康')) return { background: '#F5ECEE', color: '#C48888' }
  if (tag.includes('亲子')) return { background: '#E4F0E6', color: '#8BA88C' }
  return { background: '#F0EDE8', color: '#7A7670' }
}

function handleBooking(item) {
  if (bookingItem.value) return
  const basePrice = item.estimatedCost || item.price || 100
  bookingItem.value = item
  showBookingPopup.value = true
  checkedPlatform.value = -1
  bookingDone.value = false

  platforms.value = PLATFORM_LIST.map(p => ({
    ...p,
    price: Math.round(basePrice * (p.baseMultiplier + (Math.random() - 0.5) * 0.15))
  })).sort((a, b) => a.price - b.price)

  let i = 0
  const timer = setInterval(() => {
    checkedPlatform.value = i
    i++
    if (i >= platforms.value.length) {
      clearInterval(timer)
      setTimeout(() => {
        bookingDone.value = true
        bestPlatform.value = platforms.value[0].name
        bestPrice.value = platforms.value[0].price
        savedAmount.value = Math.max(...platforms.value.map(p => p.price)) - bestPrice.value
        bookingItem.value = null
      }, 500)
    }
  }, 600)
}

// ===== SOS 紧急模式处理 =====
function onApplySOS(newItinerary) {
  store.itinerary = newItinerary
  // 重新计算统计
  let totalCost = 0
  newItinerary.forEach(d => d.items.forEach(it => { totalCost += it.estimatedCost || 0 }))
  store.stats = { ...store.stats, totalCost, totalPois: newItinerary.reduce((s, d) => s + d.items.length, 0) }
}

function onSetRain(val) {
  isRain.value = val
}

function startTrip() {
  store.tripActive = true
  store.currentDayIndex = 0
  store.currentItemIndex = 0
  router.push('/')
}

function generatePlan() {
  store.isPlanning = true
  store.days = days.value
  currentStep.value = 0
  loadingText.value = loadingSteps[0]

  const stepTimer = setInterval(() => {
    currentStep.value++
    if (currentStep.value < loadingSteps.length) {
      loadingText.value = loadingSteps[currentStep.value]
    }
  }, 400)

  setTimeout(() => {
    clearInterval(stepTimer)
    const result = doGenerate()
    store.itinerary = result.itinerary
    store.hotel = result.hotel
    store.stats = result.stats
    store.isPlanning = false
    currentStep.value = loadingSteps.length
  }, 2400)
}

// ============================================================
// 核心引擎 (内联自 planning-engine.js)
// ============================================================
const WEIGHT_MATRIX = {
  'tired_solo':     { mood: 0.35, budget: 0.15, energy: 0.30, crowd: 0.15, kid: 0, elderly: 0, couple: 0, diet: 0.05 },
  'tired_kids':     { mood: 0.30, budget: 0.10, energy: 0.25, crowd: 0.15, kid: 0.15, elderly: 0, couple: 0, diet: 0.05 },
  'tired_elderly':  { mood: 0.25, budget: 0.15, energy: 0.30, crowd: 0.15, kid: 0, elderly: 0.10, couple: 0, diet: 0.05 },
  'tired_couple':   { mood: 0.30, budget: 0.10, energy: 0.15, crowd: 0.10, kid: 0, elderly: 0, couple: 0.30, diet: 0.05 },
  'excited_solo':   { mood: 0.20, budget: 0.15, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, couple: 0, diet: 0 },
  'excited_couple': { mood: 0.25, budget: 0.10, energy: 0.05, crowd: 0.05, kid: 0, elderly: 0, couple: 0.30, diet: 0.05 },
  'sad_kids':       { mood: 0.30, budget: 0.10, energy: 0.15, crowd: 0.20, kid: 0.20, elderly: 0, couple: 0, diet: 0.05 },
  'sad_solo':       { mood: 0.35, budget: 0.15, energy: 0.20, crowd: 0.20, kid: 0, elderly: 0, couple: 0, diet: 0.10 },
  'sad_couple':     { mood: 0.30, budget: 0.10, energy: 0.15, crowd: 0.15, kid: 0, elderly: 0, couple: 0.25, diet: 0.05 },
  'anxious_solo':   { mood: 0.30, budget: 0.15, energy: 0.20, crowd: 0.25, kid: 0, elderly: 0, couple: 0, diet: 0.10 },
  'happy_couple':   { mood: 0.15, budget: 0.10, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, couple: 0.35, diet: 0.05 },
  'happy_budget':   { mood: 0.15, budget: 0.35, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, couple: 0, diet: 0.05 },
  'calm_family':    { mood: 0.20, budget: 0.15, energy: 0.15, crowd: 0.15, kid: 0.20, elderly: 0, couple: 0, diet: 0.15 },
  'calm_couple':    { mood: 0.20, budget: 0.10, energy: 0.15, crowd: 0.10, kid: 0, elderly: 0, couple: 0.30, diet: 0.15 },
  'default':        { mood: 0.25, budget: 0.20, energy: 0.15, crowd: 0.15, kid: 0.10, elderly: 0.05, couple: 0, diet: 0.10 }
}

const MOOD_ENERGY_MAP = { tired: 1, sad: 1, anxious: 2, calm: 2, happy: 3, excited: 4 }

const POIS = [
  // romanticLevel: 1-5 情侣友好度, hasPhotoSpot: 拍照打卡点
  // hasNursingRoom: 母婴室, strollerFriendly: 推车友好
  // wheelchairAccessible: 无障碍通道, restSeats: 1-5 休息座椅, nearMedical: 近医疗点
  { id:1, name:'悦榕庄SPA水疗', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:680, kidsFriendly:false, elderlyFriendly:true, minAge:null,
    romanticLevel:5, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:10,anxious:8,sad:9,calm:8,excited:2,happy:5}, tags:['高端','放松','按摩'], estimatedDuration:120 },
  { id:2, name:'猫的天空之城·概念书店', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:35, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:9,anxious:9,sad:10,calm:9,excited:3,happy:6}, tags:['安静','文艺','拍照'], estimatedDuration:90 },
  { id:3, name:'泰式古法按摩', category:'leisure', energyLevel:1, crowdednessLevel:1, weatherSensitivity:'indoor',
    ticketPrice:198, kidsFriendly:false, elderlyFriendly:true, minAge:null,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:3, nearMedical:false,
    moodScores:{tired:10,anxious:7,sad:8,calm:8,excited:4,happy:5}, tags:['性价比','放松','拉伸'], estimatedDuration:60 },
  { id:4, name:'永福寺·抄经体验', category:'temple', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:45, kidsFriendly:true, elderlyFriendly:true, minAge:6,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:4, nearMedical:false,
    moodScores:{tired:8,anxious:10,sad:9,calm:9,excited:2,happy:5}, tags:['安静','禅意','抄经'], estimatedDuration:120 },
  { id:5, name:'中国茶叶博物馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:3,happy:6}, tags:['免费','安静','品茶'], estimatedDuration:90 },
  { id:6, name:'西湖漫步', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false,
    moodScores:{tired:6,anxious:5,sad:8,calm:8,excited:6,happy:8}, tags:['免费','西湖','散步'], estimatedDuration:60 },
  { id:7, name:'杭州宋城·千古情', category:'theme_park', energyLevel:4, crowdednessLevel:4, weatherSensitivity:'mixed',
    ticketPrice:320, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false,
    moodScores:{tired:2,anxious:2,sad:3,calm:5,excited:10,happy:9}, tags:['演出','穿越','亲子'], estimatedDuration:240 },
  { id:8, name:'苏堤骑行', category:'sport', energyLevel:4, crowdednessLevel:3, weatherSensitivity:'outdoor',
    ticketPrice:30, kidsFriendly:true, elderlyFriendly:false, minAge:8,
    romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false,
    moodScores:{tired:2,anxious:4,sad:4,calm:6,excited:9,happy:9}, tags:['骑行','户外','运动'], estimatedDuration:120 },
  { id:9, name:'河坊街夜市', category:'shopping', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:2, nearMedical:true,
    moodScores:{tired:3,anxious:2,sad:4,calm:5,excited:8,happy:9}, tags:['免费','小吃','古街'], estimatedDuration:120 },
  { id:10, name:'湖滨银泰in77', category:'shopping', energyLevel:3, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true,
    moodScores:{tired:4,anxious:3,sad:4,calm:6,excited:8,happy:9}, tags:['购物','美食','免费'], estimatedDuration:150 },
  { id:11, name:'杭州动物园', category:'theme_park', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor',
    ticketPrice:20, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false,
    moodScores:{tired:4,anxious:5,sad:5,calm:7,excited:8,happy:9}, tags:['亲子','动物','户外'], estimatedDuration:180 },
  { id:12, name:'浙江省科技馆', category:'museum', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:5,anxious:5,sad:5,calm:7,excited:8,happy:8}, tags:['免费','亲子','互动'], estimatedDuration:120 },
  { id:13, name:'烂苹果乐园', category:'theme_park', energyLevel:3, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:160, kidsFriendly:true, elderlyFriendly:false, minAge:3,
    romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false,
    moodScores:{tired:3,anxious:4,sad:4,calm:6,excited:9,happy:9}, tags:['亲子','室内','游乐'], estimatedDuration:240 },
  { id:14, name:'十里琅珰步道', category:'scenic', energyLevel:4, crowdednessLevel:2, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:6,
    romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false,
    moodScores:{tired:3,anxious:6,sad:6,calm:8,excited:7,happy:7}, tags:['免费','徒步','茶山'], estimatedDuration:180 },
  { id:15, name:'郭庄园林下午茶', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'mixed',
    ticketPrice:68, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:false, restSeats:5, nearMedical:false,
    moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:5,happy:7}, tags:['园林','下午茶','安静'], estimatedDuration:90 },
  { id:16, name:'Wagas轻食沙拉', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:68, isDietFriendly:true, dietaryTags:['lowFat','highProtein'], avgCalories:350,
    queueTime:5, hasElevator:true, spicinessLevel:0, hasPrivateRoom:false, hasHotTea:false, noiseLevel:2,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:6,sad:6,calm:7,excited:5,happy:6}, estimatedDuration:60 },
  { id:17, name:'蒸年轻·蒸汽海鲜', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:90, isDietFriendly:true, dietaryTags:['lowFat','highProtein','lightFlavor'], avgCalories:400,
    queueTime:15, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:6,happy:7}, estimatedDuration:60 },
  { id:18, name:'楼外楼·杭帮菜', category:'restaurant', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:120, isDietFriendly:false, dietaryTags:[], avgCalories:900,
    queueTime:45, hasElevator:false, spicinessLevel:1, hasPrivateRoom:true, hasHotTea:true, noiseLevel:3,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:3, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:4,sad:5,calm:6,excited:7,happy:8}, estimatedDuration:60 },
  { id:19, name:'外婆家', category:'restaurant', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:65, isDietFriendly:false, dietaryTags:[], avgCalories:750,
    queueTime:60, hasElevator:true, spicinessLevel:1, hasPrivateRoom:false, hasHotTea:true, noiseLevel:4,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:2, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:4,anxious:3,sad:4,calm:5,excited:6,happy:7}, estimatedDuration:60 },
  { id:25, name:'知味观·味庄', category:'restaurant', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:85, isDietFriendly:true, dietaryTags:['lightFlavor','traditional'], avgCalories:500,
    queueTime:10, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:8,anxious:8,sad:8,calm:8,excited:5,happy:7}, estimatedDuration:60 },
  { id:26, name:'绿茶餐厅', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:55, isDietFriendly:false, dietaryTags:[], avgCalories:800,
    queueTime:30, hasElevator:false, spicinessLevel:2, hasPrivateRoom:false, hasHotTea:false, noiseLevel:3,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:4,anxious:3,sad:4,calm:5,excited:7,happy:8}, estimatedDuration:60 },
  { id:27, name:'鼎泰丰', category:'restaurant', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:110, isDietFriendly:true, dietaryTags:['lightFlavor','steamed'], avgCalories:420,
    queueTime:20, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1,
    romanticLevel:3, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, estimatedDuration:60 },
  { id:28, name:'方回春堂·药膳餐厅', category:'restaurant', energyLevel:1, crowdednessLevel:1, weatherSensitivity:'indoor',
    ticketPrice:75, isDietFriendly:true, dietaryTags:['medicinal','lightFlavor','warm'], avgCalories:380,
    queueTime:5, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1,
    romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:true,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:9,anxious:9,sad:9,calm:9,excited:3,happy:6}, estimatedDuration:60 },
  { id:20, name:'浙江美术馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:7,anxious:8,sad:8,calm:8,excited:4,happy:6}, tags:['免费','艺术','安静'], estimatedDuration:90 },
  { id:21, name:'西西弗书店', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:30, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:9,anxious:8,sad:9,calm:9,excited:3,happy:6}, tags:['安静','咖啡','阅读'], estimatedDuration:90 },
  { id:22, name:'杭州博物馆', category:'museum', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false,
    moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:5,happy:6}, tags:['免费','历史','文化'], estimatedDuration:120 },
  { id:23, name:'灵隐寺', category:'temple', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor',
    ticketPrice:75, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false,
    moodScores:{tired:4,anxious:4,sad:5,calm:6,excited:5,happy:6}, tags:['佛教','古迹','人流量大'], estimatedDuration:120 },
  { id:24, name:'九溪烟树', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:5,
    romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false,
    moodScores:{tired:4,anxious:6,sad:7,calm:8,excited:7,happy:8}, tags:['免费','徒步','溪流'], estimatedDuration:180 }
]

const HOTELS = [
  { id:1, name:'安缦法云精品酒店', priceRangeLow:3800, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:10,anxious:9,sad:9,calm:10,excited:7,happy:8}, rating:4.9 },
  { id:2, name:'西溪湿地悦榕庄', priceRangeLow:2200, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:10,anxious:9,sad:9,calm:9,excited:8,happy:8}, rating:4.8 },
  { id:3, name:'西湖国宾馆', priceRangeLow:1200, stars:5, has_spa:false, has_pool:true, has_gym:true, breakfastIncluded:true,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:7}, rating:4.7 },
  { id:4, name:'全季酒店（西湖店）', priceRangeLow:350, stars:3, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:false,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:5,sad:5,calm:6,excited:5,happy:6}, rating:4.3 },
  { id:5, name:'如家快捷酒店', priceRangeLow:180, stars:2, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:false,
    kidsFriendly:false, elderlyFriendly:true, moodScores:{tired:3,anxious:3,sad:3,calm:4,excited:3,happy:4}, rating:3.8 },
  { id:6, name:'杭州西子湖四季酒店', priceRangeLow:2800, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:9,anxious:9,sad:9,calm:10,excited:8,happy:9}, rating:4.9 }
]

function getWeightKey() {
  const k = store.hasKids ? 'kids' : store.hasElderly ? 'elderly' : store.isCouple ? 'couple' : 'solo'
  return WEIGHT_MATRIX[`${store.moodLabel}_${k}`] || WEIGHT_MATRIX.default
}

function doGenerate() {
  const moodLabel = store.moodLabel
  const moodIndex = store.moodIndex
  const weights = getWeightKey()
  const dailyBudget = store.budget / days.value

  // 旅游 vs 出行模式：不同优先策略
  const isTravel = store.displayMode === 'travel'

  const candidates = POIS.filter(poi => {
    if (poi.ticketPrice > dailyBudget * 0.5) return false
    if (isRain.value && poi.weatherSensitivity === 'outdoor') return false
    if (store.hasKids && !poi.kidsFriendly) return false
    if (store.hasKids && poi.minAge && poi.minAge > 5) return false
    if (store.hasElderly && !poi.elderlyFriendly && poi.energyLevel >= 4) return false
    if (store.isDieting && poi.category === 'restaurant' && !poi.isDietFriendly) return false
    // 老人模式：餐厅过滤
    if (store.hasElderly && poi.category === 'restaurant') {
      if (poi.queueTime > 60) return false
      if (poi.hasElevator === false) return false
      if (poi.spicinessLevel >= 3) return false
    }
    // 带娃模式：过滤无母婴室且无推车友好的景点
    if (store.hasKids && poi.energyLevel >= 3) {
      if (!poi.hasNursingRoom && !poi.strollerFriendly) return false
    }
    // 老人模式：过滤无无障碍通道的高体力景点
    if (store.hasElderly && poi.energyLevel >= 3) {
      if (!poi.wheelchairAccessible && poi.restSeats < 3) return false
    }
    // 旅游模式：优先风景区、网红打卡地，过滤纯商务类
    if (isTravel && poi.category === 'business') return false
    // 出行模式：优先交通枢纽周边、商务酒店、快捷餐饮
    if (!isTravel && poi.energyLevel >= 4) return false
    return true
  })

  const energyIdeal = MOOD_ENERGY_MAP[moodLabel] || 2
  const scored = candidates.map(poi => {
    const moodScore = (poi.moodScores[moodLabel] || 5) * weights.mood * 10
    const budgetRatio = dailyBudget > 0 ? Math.min(poi.ticketPrice / dailyBudget, 1) : 0
    const budgetScore = (1 - budgetRatio) * weights.budget * 100
    const energyDiff = Math.abs(poi.energyLevel - energyIdeal)
    const energyScore = (1 - energyDiff / 4) * weights.energy * 100
    const crowdScore = (5 - poi.crowdednessLevel) / 4 * weights.crowd * 100
    const kidScore = store.hasKids ? (poi.kidsFriendly ? weights.kid * 100 : 0) : 0
    const elderlyScore = store.hasElderly ? (poi.elderlyFriendly ? weights.elderly * 100 : 0) : 0
    const coupleScore = store.isCouple ? (poi.romanticLevel / 5 * weights.couple * 100) : 0
    const dietScore = store.isDieting && poi.isDietFriendly ? weights.diet * 100 : 0
    // 老人模式：餐厅加分（有包间、有热茶、安静）
    let elderlyRestaurantBonus = 0
    if (store.hasElderly && poi.category === 'restaurant') {
      if (poi.hasPrivateRoom) elderlyRestaurantBonus += 20
      if (poi.hasHotTea) elderlyRestaurantBonus += 15
      if (poi.noiseLevel <= 2) elderlyRestaurantBonus += 15
    }
    // 情侣模式：拍照点 + 浪漫晚餐加分
    let coupleBonus = 0
    if (store.isCouple) {
      if (poi.hasPhotoSpot) coupleBonus += 15
      if (poi.category === 'restaurant' && poi.romanticLevel >= 4) coupleBonus += 20
      if (poi.category === 'leisure' && poi.romanticLevel >= 4) coupleBonus += 15
    }
    // 带娃模式：母婴室 + 推车友好加分
    let kidsBonus = 0
    if (store.hasKids) {
      if (poi.hasNursingRoom) kidsBonus += 20
      if (poi.strollerFriendly) kidsBonus += 15
    }
    // 老人模式：无障碍 + 休息座椅 + 近医疗点加分
    let elderlyBonus = 0
    if (store.hasElderly) {
      if (poi.wheelchairAccessible) elderlyBonus += 15
      if (poi.restSeats >= 4) elderlyBonus += 15
      if (poi.nearMedical) elderlyBonus += 20
    }
    // 旅游模式加分：风景区、网红打卡地
    let travelBonus = 0
    if (isTravel) {
      if (poi.category === 'scenic') travelBonus += 25
      if (poi.hasPhotoSpot) travelBonus += 20
      if (poi.tags && poi.tags.some(t => ['网红', '打卡', '拍照', '美景'].includes(t))) travelBonus += 15
    }
    // 出行模式加分：低体力消耗、快捷餐饮
    let commuteBonus = 0
    if (!isTravel) {
      if (poi.energyLevel <= 2) commuteBonus += 20
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) commuteBonus += 15
    }
    const total = moodScore + budgetScore + energyScore + crowdScore + kidScore + elderlyScore + coupleScore + dietScore + elderlyRestaurantBonus + coupleBonus + kidsBonus + elderlyBonus + travelBonus + commuteBonus
    return { ...poi, _scores: { moodScore, budgetScore, energyScore, crowdScore, kidScore, elderlyScore, coupleScore, dietScore }, _total: total }
  })
  scored.sort((a, b) => b._total - a._total)

  const maxPerDay = moodIndex <= 3 ? 4 : 5
  const used = new Set()
  const itinerary = []

  for (let d = 0; d < days.value; d++) {
    const items = []
    const dayPois = []
    for (const poi of scored) {
      if (dayPois.length >= maxPerDay) break
      if (!used.has(poi.id)) { used.add(poi.id); dayPois.push(poi) }
    }
    const cats = new Set(dayPois.map(p => p.category))
    if (cats.size < 2 && dayPois.length >= 3) {
      for (const poi of scored) {
        if (!used.has(poi.id) && !cats.has(poi.category)) {
          used.delete(dayPois[dayPois.length - 1].id)
          dayPois[dayPois.length - 1] = poi
          used.add(poi.id)
          break
        }
      }
    }
    let hour = 9
    dayPois.forEach((poi, idx) => {
      if (idx === 2) {
        const lunchPoi = scored.find(p => p.category === 'restaurant' && !used.has(p.id))
        if (lunchPoi) {
          used.add(lunchPoi.id)
          const isDiet = store.isDieting && lunchPoi.isDietFriendly
          items.push({
            type: 'restaurant', time: fmtTime(hour), endTime: fmtTime(hour + 1),
            name: lunchPoi.name, estimatedCost: lunchPoi.ticketPrice || lunchPoi.avgCost || 80,
            energyLevel: 1, tags: lunchPoi.tags || [],
            isDietFriendly: lunchPoi.isDietFriendly, avgCalories: lunchPoi.avgCalories,
            reason: isDiet ? '根据减肥需求推荐低卡餐食' : '午餐时间，推荐附近高评分餐厅',
            reasonTags: isDiet ? ['低卡健康', '饮食匹配'] : ['位置便利', '高评分']
          })
          hour += 1
        }
      }
      if (moodIndex <= 3 && idx === 2) {
        items.push({
          type: 'rest', time: fmtTime(hour), endTime: fmtTime(hour + 0.5),
          name: '☕ 休息时间', estimatedCost: 30,
          reason: '疲惫模式：自动插入半小时休息，避免体力透支',
          reasonTags: ['心情匹配', '体力保护']
        })
        hour += 0.5
      }
      const dur = moodIndex <= 3 ? 2 : 1.5
      items.push({
        type: 'poi', time: fmtTime(hour), endTime: fmtTime(hour + dur),
        name: poi.name, category: poi.category, estimatedCost: poi.ticketPrice,
        energyLevel: poi.energyLevel, weatherSensitivity: poi.weatherSensitivity,
        tags: poi.tags || [], estimatedDuration: poi.estimatedDuration,
        ticketPrice: poi.ticketPrice,
        reason: genReason(poi, moodLabel),
        reasonTags: genTags(poi),
        _scores: poi._scores, _total: poi._total
      })
      hour += dur
    })
    itinerary.push({ day: d + 1, items })
  }

  const hotelCandidates = HOTELS.map(h => {
    let score = 0
    const ratio = h.priceRangeLow / dailyBudget
    if (ratio <= 0.3) score += 30; else if (ratio <= 0.5) score += 25; else if (ratio <= 0.8) score += 20; else if (ratio <= 1.2) score += 15; else score += 5
    if (store.budgetSensitive) score *= 1.5
    score += (h.moodScores[moodLabel] || 5) * 3
    if (store.hasKids && h.kidsFriendly) score += 20
    if (store.hasElderly && h.elderlyFriendly) score += 20
    if (store.isCouple && h.has_spa) score += 25
    if (store.isCouple && h.stars >= 5) score += 15
    score += h.rating * 5
    return { ...h, _score: score }
  }).sort((a, b) => b._score - a._score)

  const best = hotelCandidates[0]
  let totalCost = 0
  itinerary.forEach(d => d.items.forEach(it => { totalCost += it.estimatedCost || 0 }))
  totalCost += (best?.priceRangeLow || 0) * days.value

  // 酒店多平台比价数据
  let hotelData = null
  if (best) {
    const platforms = [
      { name: '携程', icon: '🏨', price: Math.round(best.priceRangeLow * 1.0), features: '含早', isBest: false },
      { name: '美团', icon: '🍜', price: Math.round(best.priceRangeLow * 0.95), features: '含早且可取消', isBest: true },
      { name: '飞猪', icon: '🐷', price: Math.round(best.priceRangeLow * 0.92), features: '免费升级房型', isBest: false },
      { name: '去哪儿', icon: '✈️', price: Math.round(best.priceRangeLow * 0.97), features: '含双早', isBest: false }
    ]
    const bestPlatform = platforms.find(p => p.isBest)
    hotelData = {
      name: best.name,
      rating: best.rating,
      price: best.priceRangeLow,
      bestPrice: bestPlatform.price,
      bestPlatform: bestPlatform.name,
      bestReason: bestPlatform.features,
      savedAmount: Math.max(...platforms.map(p => p.price)) - bestPlatform.price,
      platforms,
      reason: genHotelReason(best, moodLabel)
    }
  }

  return {
    itinerary,
    hotel: hotelData,
    stats: {
      totalCost,
      totalSaved: hotelData?.savedAmount || 0,
      totalPois: used.size,
      filterTotal: POIS.length,
      filterPassed: candidates.length,
      moodLabel, weights
    }
  }
}

function genReason(poi, moodLabel) {
  const s = poi._scores
  const reasons = []
  if (s.moodScore > 25) reasons.push('当前心情高度匹配')
  else if (s.moodScore > 15) reasons.push('适合当前心情状态')
  if (s.budgetScore > 15) reasons.push(poi.ticketPrice === 0 ? '免费景点，零预算压力' : '低价高性价比')
  if (s.energyScore > 20) reasons.push('体力消耗符合当前状态')
  if (s.kidScore > 15) reasons.push('亲子游首选')
  if (s.coupleScore > 20) reasons.push('情侣浪漫之选')
  if (s.elderlyScore > 15) reasons.push('适合老人出行')
  return reasons.join('；') || '综合匹配推荐'
}

function genTags(poi) {
  const s = poi._scores
  const tags = []
  if (s.moodScore > 20) tags.push('心情匹配')
  if (s.budgetScore > 15) tags.push(poi.ticketPrice === 0 ? '免费景点' : '高性价比')
  if (store.isDieting && poi.isDietFriendly) tags.push('低卡健康')
  if (store.hasKids && poi.kidsFriendly) tags.push('亲子推荐')
  // 情侣标签
  if (store.isCouple && poi.romanticLevel >= 4) tags.push('浪漫约会')
  if (store.isCouple && poi.hasPhotoSpot) tags.push('拍照打卡')
  // 带娃标签
  if (store.hasKids && poi.hasNursingRoom) tags.push('母婴室')
  if (store.hasKids && poi.strollerFriendly) tags.push('推车友好')
  // 老人标签
  if (store.hasElderly && poi.wheelchairAccessible) tags.push('无障碍')
  if (store.hasElderly && poi.restSeats >= 4) tags.push('休息充足')
  if (store.hasElderly && poi.nearMedical) tags.push('近医疗点')
  if (store.hasElderly && poi.hasPrivateRoom) tags.push('有包间')
  return tags
}

function genHotelReason(hotel, moodLabel) {
  const reasons = []
  if (hotel.moodScores[moodLabel] >= 8) reasons.push('当前心情高度匹配')
  if (hotel.priceRangeLow <= store.budget * 0.3) reasons.push('预算友好')
  if (hotel.rating >= 4.5) reasons.push('高评分推荐')
  if (store.isCouple) reasons.push('私密性好，适合情侣入住')
  if (store.hasKids && hotel.kidsFriendly) reasons.push('亲子友好，儿童设施齐全')
  if (store.hasElderly && hotel.elderlyFriendly) reasons.push('老人友好，无障碍设施完善')
  return reasons.join('；') || '综合推荐'
}

function fmtTime(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}
</script>

<style scoped>
.plan-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}
.header {
  padding: 44px 0 16px; text-align: center;
}
.header-title { font-size: 18px; font-weight: 800; color: var(--color-text); display: block }
.header-sub { font-size: 12px; color: var(--color-text-light); margin-top: 4px; display: block }

/* 模式标签 */
.mode-tag {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 预算区间提示 */
.budget-range-hint {
  font-size: 11px;
  color: var(--color-text-light);
  margin-bottom: 6px;
  text-align: right;
}

/* 预算校验提示 */
.budget-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #FFF3E0;
  color: #E8945A;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  animation: fadeIn 0.25s ease;
}

.budget-warning.luxury {
  background: #FDF0E6;
  color: #D4A060;
}

/* 心情卡片 */
.mood-card {
  background: var(--color-card); border-radius: 8px;
  padding: 12px; display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.mood-card-left { display: flex; align-items: center; gap: 8px }
.mood-emoji { font-size: 24px }
.mood-label { font-size: 14px; font-weight: 700; color: var(--color-text); display: block }
.mood-hint { font-size: 11px; color: var(--color-text-light); margin-top: 2px; display: block }
.mood-badge {
  padding: 4px 10px; border-radius: 10px;
  font-size: 11px; font-weight: 600; color: #fff;
  transition: background 0.5s;
}

/* 表单 */
.section { margin-bottom: 16px }
.section-title { font-size: 14px; font-weight: 700; margin-bottom: 8px }
.form-card { background: var(--color-card); border-radius: 8px; padding: 12px }
.form-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px }
.form-label { font-size: 13px; font-weight: 600; color: var(--color-text); flex-shrink: 0 }
.form-input { flex: 1; text-align: right; font-size: 13px; color: var(--color-text); border: none; outline: none; background: transparent }
.form-value { font-size: 13px; color: var(--theme-primary); font-weight: 600; transition: color 0.5s; cursor: pointer }
.budget-slider { flex: 1; display: flex; align-items: center; gap: 8px }
.budget-value { font-size: 13px; font-weight: 700; flex-shrink: 0 }
.range-input { flex: 1; accent-color: var(--range-color, #A3B5A6) }
.budget-presets { display: flex; gap: 4px; margin-bottom: 10px }
.budget-preset {
  flex: 1; padding: 6px 4px; border-radius: 5px;
  background: #F5F2ED; font-size: 10px; font-weight: 600;
  text-align: center; color: var(--color-text-light);
  transition: all 0.2s;
  cursor: pointer;
}
.budget-preset.active { color: #fff }
.stepper { display: flex; align-items: center; gap: 12px }
.stepper-btn {
  width: 28px; height: 28px; border-radius: 50%;
  background: #F5F2ED; display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; color: var(--color-text);
  cursor: pointer;
}
.stepper-value { font-size: 16px; font-weight: 700 }
.weather-toggle {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--color-text);
}

/* Custom Switch */
.switch-wrapper {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch-wrapper input {
  opacity: 0;
  width: 0;
  height: 0;
}
.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #ccc;
  border-radius: 24px;
  transition: 0.3s;
}
.switch-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}
.switch-wrapper input:checked + .switch-slider {
  background-color: var(--switch-color, #A3B5A6);
}
.switch-wrapper input:checked + .switch-slider::before {
  transform: translateX(20px);
}

/* 仪表盘 */
.dashboard {
  display: flex; gap: 8px;
}
.gauge-card {
  flex: 1;
  background: var(--color-card);
  border-radius: 8px;
  padding: 10px;
}
.gauge-label {
  font-size: 12px; font-weight: 600; color: var(--color-text);
  display: block; margin-bottom: 6px;
}
.gauge-bar {
  height: 6px; background: #E8E4DC;
  border-radius: 3px; overflow: hidden;
  margin-bottom: 4px;
}
.gauge-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.8s ease;
}
.gauge-value {
  font-size: 11px; font-weight: 600;
}
.stats-row {
  display: flex; gap: 6px; margin-top: 8px;
}
.stat-item {
  flex: 1; text-align: center;
  background: var(--color-card); border-radius: 8px;
  padding: 8px 4px;
}
.stat-num { font-size: 14px; font-weight: 700; color: var(--color-text); display: block }
.stat-label { font-size: 10px; color: var(--color-text-light); margin-top: 2px; display: block }

/* 日期标题 */
.day-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 700;
  margin-bottom: 8px;
  transition: all 0.5s;
}

/* 时间轴 */
.timeline { padding-left: 20px; position: relative }
.timeline::before {
  content: ''; position: absolute; left: 5px; top: 4px; bottom: 4px;
  width: 2px; background: #E0DCD4; border-radius: 1px;
}
.timeline-item { position: relative; margin-bottom: 12px }
.timeline-dot {
  position: absolute; left: -15px; top: 8px;
  width: 10px; height: 10px; border-radius: 50%; z-index: 2;
}
.timeline-card {
  background: var(--color-card); border-radius: 8px;
  padding: 10px; box-shadow: 0 1px 6px rgba(0,0,0,.02);
}
.time-row { display: flex; justify-content: space-between; margin-bottom: 4px }
.time { font-size: 12px; font-weight: 700; color: var(--theme-primary); transition: color 0.5s }
.category { font-size: 10px; color: var(--color-text-light); background: #F5F2ED; padding: 2px 6px; border-radius: 4px }
.poi-name { font-size: 15px; font-weight: 700; display: block; margin-bottom: 3px }
.poi-desc { font-size: 12px; color: var(--color-text-light); display: block; margin-bottom: 6px }
.reason-bar { font-size: 11px; color: var(--color-text-light); background: #F8F6F2; padding: 6px; border-radius: 5px }
.tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px }
.tag {
  font-size: 10px; padding: 2px 6px; border-radius: 6px;
}

/* 预订按钮行 */
.booking-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding-top: 8px;
  border-top: 1px solid #F0EDE8;
}
.price-tag {
  font-size: 14px; font-weight: 700;
  transition: color 0.5s;
}
.book-btn {
  padding: 5px 14px;
  border-radius: 12px;
  font-size: 12px; font-weight: 600; color: #fff;
  transition: all 0.2s;
  cursor: pointer;
}
.book-btn:active { transform: scale(0.95); opacity: 0.9 }
.book-btn.loading { opacity: 0.7 }

/* 门票内联比价 */
.compare-inline {
  margin-top: 6px;
  padding: 6px 8px;
  background: linear-gradient(135deg, #F8FFF0, #F2FDE8);
  border-radius: 6px;
  display: flex; align-items: center; gap: 4px;
  font-size: 11px;
}
.compare-inline-icon { font-size: 10px }
.compare-inline-text { color: #6B8E6C; font-weight: 600; flex: 1 }
.compare-inline-save { color: #E8945A; font-weight: 700 }

/* 酒店卡片 */
.hotel-card {
  background: var(--color-card);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.hotel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.hotel-name { font-size: 15px; font-weight: 700; color: var(--color-text) }
.hotel-rating { font-size: 12px; color: var(--color-text-light); display: block; margin-top: 2px }
.hotel-price { font-size: 18px; font-weight: 800; transition: color 0.5s }
.hotel-reason { font-size: 12px; color: var(--color-text-light); display: block; margin-bottom: 4px }
.hotel-savings { font-size: 12px; color: #8BA88C; font-weight: 600; margin-bottom: 8px }
.hotel-book-btn { width: 100%; text-align: center; padding: 8px 0; border-radius: 16px; font-size: 14px; font-weight: 600; }

/* 开启旅程按钮 */
.start-trip-btn {
  margin: 16px 0 0;
  width: 100%; height: 48px;
  border-radius: 24px; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; color: #fff;
  transition: all 0.3s;
  cursor: pointer;
  animation: pulse 2s ease-in-out infinite;
}
.start-trip-btn:active { transform: scale(.97) }
@keyframes pulse {
  0%, 100% { box-shadow: 0 6px 16px rgba(0,0,0,.15) }
  50% { box-shadow: 0 6px 24px rgba(0,0,0,.25) }
}

/* 生成按钮 */
.generate-btn {
  margin: 20px 0;
  width: 100%; height: 48px;
  border-radius: 24px; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; color: #fff;
  transition: all 0.3s;
  cursor: pointer;
}
.generate-btn:active { transform: scale(.97) }
.generate-btn:disabled { opacity: .7; cursor: not-allowed }

/* 预订比价弹窗 */
.popup-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.25s;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.booking-popup {
  width: 85%;
  max-width: 300px;
  background: #FFFCF8;
  border-radius: 16px;
  padding: 20px;
  animation: popIn 0.3s ease;
}
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}
.booking-popup-header {
  text-align: center; margin-bottom: 12px;
}
.booking-popup-title {
  font-size: 16px; font-weight: 700; color: var(--color-text);
}
.booking-popup-body {
  display: flex; flex-direction: column; align-items: center;
}
.booking-spinner {
  width: 28px; height: 28px;
  border: 2px solid #E0DCD4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}
.booking-popup-text {
  font-size: 13px; color: var(--color-text-light);
  margin-bottom: 12px;
}
.platform-list {
  width: 100%;
  display: flex; flex-direction: column; gap: 4px;
}
.platform-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px;
  background: #F5F2ED;
  border-radius: 6px;
  font-size: 13px;
}
.platform-item.checked {
  background: #E4F0E6;
}
.platform-icon { font-size: 16px }
.platform-name { flex: 1; font-weight: 600; color: var(--color-text) }
.platform-price { font-weight: 700; color: #8BA88C }
.platform-wait { color: var(--color-text-light); font-size: 11px }
.booking-popup-footer {
  margin-top: 12px; text-align: center;
}
.booking-best {
  font-size: 14px; font-weight: 700; color: var(--color-text);
  display: block;
}
.booking-save {
  font-size: 12px; color: #8BA88C; font-weight: 600;
  margin: 4px 0 8px; display: block;
}
.booking-action-btn {
  width: 100%; height: 40px;
  border-radius: 20px; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  transition: background 0.5s;
  cursor: pointer;
}
.booking-action-btn:active { transform: scale(.97) }

.safe-bottom { height: 20px }
</style>