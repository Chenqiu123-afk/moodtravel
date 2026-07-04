<template>
  <view class="plan-page" :style="{ background: gradientBg }">
    <!-- 顶部状态栏 -->
    <view class="header">
      <text class="header-title">行程规划</text>
      <text class="header-sub">MoodTravel · 情绪旅行</text>
    </view>

    <!-- 心情状态卡片 -->
    <view class="mood-card">
      <view class="mood-card-left">
        <text class="mood-emoji">{{ store.moodEmoji }}</text>
        <view class="mood-info">
          <text class="mood-label">当前心情：{{ store.moodLabelCN }}</text>
          <text class="mood-hint">{{ store.moodDescription }}</text>
        </view>
      </view>
      <view class="mood-badge" :style="{ background: theme.primary }">
        {{ theme.name }}
      </view>
    </view>

    <!-- 行程设置 -->
    <view class="section">
      <view class="section-title">📋 行程设置</view>
      <view class="form-card">
        <view class="form-row">
          <text class="form-label">目的地</text>
          <input class="form-input" v-model="store.destination" placeholder="输入城市名" />
        </view>
        <view class="form-row">
          <text class="form-label">预算</text>
          <view class="budget-slider">
            <text class="budget-value" :style="{ color: theme.primary }">¥{{ store.budget }}</text>
            <slider
              :value="store.budget"
              :min="200" :max="5000" :step="100"
              :activeColor="theme.primary"
              backgroundColor="#E0DCD4"
              block-size="20" @change="onBudgetChange"
            />
          </view>
        </view>
        <view class="budget-presets">
          <view
            v-for="preset in budgetPresets"
            :key="preset.label"
            class="budget-preset"
            :class="{ active: store.budgetLabel === preset.label }"
            :style="store.budgetLabel === preset.label ? { background: theme.primary } : {}"
            @click="store.setBudget(preset.value, preset.label)"
          >
            <text>{{ preset.icon }} {{ preset.label }}</text>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">同行人数</text>
          <text class="form-value" @click="openCompanionPopup">{{ companionSummary }}</text>
        </view>
        <view class="form-row">
          <text class="form-label">行程天数</text>
          <view class="stepper">
            <view class="stepper-btn" @click="days > 1 ? days-- : null">−</view>
            <text class="stepper-value">{{ days }}</text>
            <view class="stepper-btn" @click="days < 5 ? days++ : null">+</view>
          </view>
        </view>
        <!-- 天气模拟 -->
        <view class="form-row">
          <text class="form-label">天气模拟</text>
          <view class="weather-toggle" @click="isRain = !isRain">
            <text>{{ isRain ? '🌧️ 暴雨模式' : '☀️ 晴天模式' }}</text>
            <switch :checked="isRain" :color="theme.primary" />
          </view>
        </view>
      </view>
    </view>

    <!-- 加载动画 -->
    <view v-if="store.isPlanning" class="loading-section">
      <view class="loading-spinner" :style="{ borderTopColor: theme.primary }" />
      <text class="loading-text">{{ loadingText }}</text>
      <view class="loading-steps">
        <view v-for="(step, i) in loadingSteps" :key="i" class="loading-step" :class="{ done: i < currentStep }">
          <view class="step-dot" :style="i < currentStep ? { background: theme.primary } : {}" />
          <text class="step-text">{{ step }}</text>
        </view>
      </view>
    </view>

    <!-- 仪表盘 -->
    <view v-if="store.stats" class="section">
      <view class="section-title">📊 行程概览</view>
      <view class="dashboard">
        <view class="gauge-card">
          <text class="gauge-label">⚡ 精力消耗</text>
          <view class="gauge-bar">
            <view
              class="gauge-fill"
              :style="{
                width: energyPercent + '%',
                background: energyColor
              }"
            />
          </view>
          <text class="gauge-value" :style="{ color: energyColor }">{{ energyLabel }}</text>
        </view>
        <view class="gauge-card">
          <text class="gauge-label">💳 预算使用</text>
          <view class="gauge-bar">
            <view
              class="gauge-fill"
              :style="{
                width: budgetPercent + '%',
                background: budgetColor
              }"
            />
          </view>
          <text class="gauge-value" :style="{ color: budgetColor }">
            ¥{{ store.stats?.totalCost || 0 }} / ¥{{ store.budget }}
          </text>
        </view>
      </view>
      <!-- 统计行 -->
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">{{ store.stats?.filterPassed || 0 }}/{{ store.stats?.filterTotal || 0 }}</text>
          <text class="stat-label">通过过滤</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ store.stats?.totalPois || 0 }}</text>
          <text class="stat-label">精选景点</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">¥{{ store.stats?.totalSaved || 0 }}</text>
          <text class="stat-label">比价节省</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ isRain ? '🌧️' : '☀️' }}</text>
          <text class="stat-label">天气</text>
        </view>
      </view>
    </view>

    <!-- 行程时间轴 -->
    <view class="section" v-if="store.itinerary">
      <view class="section-title">📅 推荐行程</view>
      <view v-for="(day, di) in store.itinerary" :key="di">
        <view class="day-header" :style="{ background: theme.primaryLight + '25', color: theme.primary }">
          <text>Day {{ day.day }}</text>
          <text>{{ day.items?.length || 0 }} 个节点</text>
        </view>
        <view class="timeline">
          <view v-for="(item, ii) in day.items" :key="ii" class="timeline-item">
            <view class="timeline-dot" :style="{ background: dotColor(item.type) }" />
            <view class="timeline-card" :class="{ 'has-booking': item.type !== 'rest' }">
              <view class="time-row">
                <text class="time">{{ item.time }}</text>
                <text class="category">{{ typeLabel(item.type) }}</text>
              </view>
              <text class="poi-name">{{ item.name }}</text>
              <text class="poi-desc" v-if="item.desc">{{ item.desc }}</text>
              <view class="reason-bar">
                <text>💡 {{ item.reason }}</text>
              </view>
              <view class="tags" v-if="item.reasonTags">
                <text
                  v-for="tag in item.reasonTags"
                  :key="tag"
                  class="tag"
                  :style="tagStyle(tag)"
                >{{ tag }}</text>
              </view>

              <!-- 预订按钮 -->
              <view class="booking-row" v-if="item.type !== 'rest'">
                <view class="price-tag" :style="{ color: theme.primary }">
                  ¥{{ item.estimatedCost || 0 }}
                </view>
                <view
                  class="book-btn"
                  :style="{ background: theme.primary }"
                  @click="handleBooking(item)"
                  :class="{ loading: bookingItem === item }"
                >
                  <text v-if="bookingItem !== item">预订</text>
                  <text v-else>比价中...</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 酒店推荐 -->
    <view class="section" v-if="store.hotel">
      <view class="section-title">🏨 酒店推荐</view>
      <view class="hotel-card">
        <view class="hotel-header">
          <view class="hotel-info">
            <text class="hotel-name">{{ store.hotel.name }}</text>
            <text class="hotel-rating">⭐ {{ store.hotel.rating }}分</text>
          </view>
          <view class="hotel-price" :style="{ color: theme.primary }">
            ¥{{ store.hotel.price }}
          </view>
        </view>
        <text class="hotel-reason">💡 {{ store.hotel.reason }}</text>
        <view class="hotel-savings" v-if="store.hotel.savedAmount > 0">
          💰 比价 {{ store.hotel.bestPlatform }} 最低，为您节省 ¥{{ store.hotel.savedAmount }}
        </view>
        <view class="book-btn hotel-book-btn" :style="{ background: theme.primary }" @click="handleBooking(store.hotel)">
          <text>预订酒店</text>
        </view>
      </view>
    </view>

    <!-- 生成按钮 -->
    <button
      class="generate-btn"
      :style="genBtnStyle"
      @click="generatePlan"
      :disabled="store.isPlanning"
    >
      <text v-if="!store.isPlanning">✨ 智能生成行程</text>
      <text v-else>⏳ AI 正在规划中...</text>
    </button>

    <!-- 预订比价弹窗 -->
    <view class="popup-overlay" v-if="showBookingPopup" @click="showBookingPopup = false">
      <view class="booking-popup" @click.stop>
        <view class="booking-popup-header">
          <text class="booking-popup-title">🔍 全网比价中</text>
        </view>
        <view class="booking-popup-body">
          <view class="booking-spinner" :style="{ borderTopColor: theme.primary }" />
          <text class="booking-popup-text">正在为您查询 {{ platforms.length }} 个平台...</text>
          <view class="platform-list">
            <view v-for="(p, i) in platforms" :key="p.name" class="platform-item" :class="{ checked: i <= checkedPlatform }">
              <text class="platform-icon">{{ p.icon }}</text>
              <text class="platform-name">{{ p.name }}</text>
              <text v-if="i <= checkedPlatform" class="platform-price">¥{{ p.price }}</text>
              <text v-else class="platform-wait">查询中...</text>
            </view>
          </view>
        </view>
        <view class="booking-popup-footer" v-if="bookingDone">
          <text class="booking-best">🏆 {{ bestPlatform }} 最优惠，仅需 ¥{{ bestPrice }}</text>
          <text class="booking-save">已为您节省 ¥{{ savedAmount }}</text>
          <button class="booking-action-btn" :style="{ background: theme.primary }" @click="showBookingPopup = false">
            <text>前往预订</text>
          </button>
        </view>
      </view>
    </view>

    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTravelStore } from '@/store/travel.js'

const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const days = ref(2)
const isRain = ref(false)
const loadingText = ref('正在分析...')
const currentStep = ref(0)

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
  boxShadow: `0 12rpx 32rpx ${theme.value.primary}40`
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

// 仪表盘
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

const budgetPresets = [
  { label: '经济穷游', value: 500, icon: '🎒' },
  { label: '舒适出行', value: 2000, icon: '🏨' },
  { label: '品质享受', value: 3500, icon: '✨' },
  { label: '奢华体验', value: 5000, icon: '👑' }
]

// 预订比价
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
  store.budget = e.detail.value
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

// 预订比价
function handleBooking(item) {
  if (bookingItem.value) return
  const basePrice = item.estimatedCost || item.price || 100
  bookingItem.value = item
  showBookingPopup.value = true
  checkedPlatform.value = -1
  bookingDone.value = false

  // 生成模拟价格
  platforms.value = PLATFORM_LIST.map(p => ({
    ...p,
    price: Math.round(basePrice * (p.baseMultiplier + (Math.random() - 0.5) * 0.15))
  })).sort((a, b) => a.price - b.price)

  // 逐个平台"查询"
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

// 生成行程
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
  'tired_solo':     { mood: 0.35, budget: 0.15, energy: 0.30, crowd: 0.15, kid: 0, elderly: 0, diet: 0.05 },
  'tired_kids':     { mood: 0.30, budget: 0.10, energy: 0.25, crowd: 0.15, kid: 0.15, elderly: 0, diet: 0.05 },
  'tired_elderly':  { mood: 0.25, budget: 0.15, energy: 0.30, crowd: 0.15, kid: 0, elderly: 0.10, diet: 0.05 },
  'excited_solo':   { mood: 0.20, budget: 0.15, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, diet: 0 },
  'excited_couple': { mood: 0.25, budget: 0.10, energy: 0.05, crowd: 0.05, kid: 0, elderly: 0, diet: 0.05 },
  'sad_kids':       { mood: 0.30, budget: 0.10, energy: 0.15, crowd: 0.20, kid: 0.20, elderly: 0, diet: 0.05 },
  'sad_solo':       { mood: 0.35, budget: 0.15, energy: 0.20, crowd: 0.20, kid: 0, elderly: 0, diet: 0.10 },
  'anxious_solo':   { mood: 0.30, budget: 0.15, energy: 0.20, crowd: 0.25, kid: 0, elderly: 0, diet: 0.10 },
  'happy_budget':   { mood: 0.15, budget: 0.35, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, diet: 0.05 },
  'calm_family':    { mood: 0.20, budget: 0.15, energy: 0.15, crowd: 0.15, kid: 0.20, elderly: 0, diet: 0.15 },
  'default':        { mood: 0.25, budget: 0.20, energy: 0.15, crowd: 0.15, kid: 0.10, elderly: 0.05, diet: 0.10 }
}

const MOOD_ENERGY_MAP = { tired: 1, sad: 1, anxious: 2, calm: 2, happy: 3, excited: 4 }

const POIS = [
  { id:1, name:'悦榕庄SPA水疗', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:680, kidsFriendly:false, elderlyFriendly:true, minAge:null,
    moodScores:{tired:10,anxious:8,sad:9,calm:8,excited:2,happy:5}, tags:['高端','放松','按摩'], estimatedDuration:120 },
  { id:2, name:'猫的天空之城·概念书店', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:35, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:9,anxious:9,sad:10,calm:9,excited:3,happy:6}, tags:['安静','文艺','拍照'], estimatedDuration:90 },
  { id:3, name:'泰式古法按摩', category:'leisure', energyLevel:1, crowdednessLevel:1, weatherSensitivity:'indoor',
    ticketPrice:198, kidsFriendly:false, elderlyFriendly:true, minAge:null,
    moodScores:{tired:10,anxious:7,sad:8,calm:8,excited:4,happy:5}, tags:['性价比','放松','拉伸'], estimatedDuration:60 },
  { id:4, name:'永福寺·抄经体验', category:'temple', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:45, kidsFriendly:true, elderlyFriendly:true, minAge:6,
    moodScores:{tired:8,anxious:10,sad:9,calm:9,excited:2,happy:5}, tags:['安静','禅意','抄经'], estimatedDuration:120 },
  { id:5, name:'中国茶叶博物馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:3,happy:6}, tags:['免费','安静','品茶'], estimatedDuration:90 },
  { id:6, name:'西湖漫步', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    moodScores:{tired:6,anxious:5,sad:8,calm:8,excited:6,happy:8}, tags:['免费','西湖','散步'], estimatedDuration:60 },
  { id:7, name:'杭州宋城·千古情', category:'theme_park', energyLevel:4, crowdednessLevel:4, weatherSensitivity:'mixed',
    ticketPrice:320, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:2,anxious:2,sad:3,calm:5,excited:10,happy:9}, tags:['演出','穿越','亲子'], estimatedDuration:240 },
  { id:8, name:'苏堤骑行', category:'sport', energyLevel:4, crowdednessLevel:3, weatherSensitivity:'outdoor',
    ticketPrice:30, kidsFriendly:true, elderlyFriendly:false, minAge:8,
    moodScores:{tired:2,anxious:4,sad:4,calm:6,excited:9,happy:9}, tags:['骑行','户外','运动'], estimatedDuration:120 },
  { id:9, name:'河坊街夜市', category:'shopping', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    moodScores:{tired:3,anxious:2,sad:4,calm:5,excited:8,happy:9}, tags:['免费','小吃','古街'], estimatedDuration:120 },
  { id:10, name:'湖滨银泰in77', category:'shopping', energyLevel:3, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    moodScores:{tired:4,anxious:3,sad:4,calm:6,excited:8,happy:9}, tags:['购物','美食','免费'], estimatedDuration:150 },
  { id:11, name:'杭州动物园', category:'theme_park', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor',
    ticketPrice:20, kidsFriendly:true, elderlyFriendly:true, minAge:0,
    moodScores:{tired:4,anxious:5,sad:5,calm:7,excited:8,happy:9}, tags:['亲子','动物','户外'], estimatedDuration:180 },
  { id:12, name:'浙江省科技馆', category:'museum', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:5,anxious:5,sad:5,calm:7,excited:8,happy:8}, tags:['免费','亲子','互动'], estimatedDuration:120 },
  { id:13, name:'烂苹果乐园', category:'theme_park', energyLevel:3, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:160, kidsFriendly:true, elderlyFriendly:false, minAge:3,
    moodScores:{tired:3,anxious:4,sad:4,calm:6,excited:9,happy:9}, tags:['亲子','室内','游乐'], estimatedDuration:240 },
  { id:14, name:'十里琅珰步道', category:'scenic', energyLevel:4, crowdednessLevel:2, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:6,
    moodScores:{tired:3,anxious:6,sad:6,calm:8,excited:7,happy:7}, tags:['免费','徒步','茶山'], estimatedDuration:180 },
  { id:15, name:'郭庄园林下午茶', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'mixed',
    ticketPrice:68, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:5,happy:7}, tags:['园林','下午茶','安静'], estimatedDuration:90 },
  { id:16, name:'Wagas轻食沙拉', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:68, isDietFriendly:true, dietaryTags:['lowFat','highProtein'], avgCalories:350,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:6,sad:6,calm:7,excited:5,happy:6}, estimatedDuration:60 },
  { id:17, name:'蒸年轻·蒸汽海鲜', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:90, isDietFriendly:true, dietaryTags:['lowFat','highProtein','lightFlavor'], avgCalories:400,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:6,happy:7}, estimatedDuration:60 },
  { id:18, name:'楼外楼·杭帮菜', category:'restaurant', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor',
    ticketPrice:120, isDietFriendly:false, dietaryTags:[], avgCalories:900,
    kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:4,sad:5,calm:6,excited:7,happy:8}, estimatedDuration:60 },
  { id:20, name:'浙江美术馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:7,anxious:8,sad:8,calm:8,excited:4,happy:6}, tags:['免费','艺术','安静'], estimatedDuration:90 },
  { id:21, name:'西西弗书店', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor',
    ticketPrice:30, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:9,anxious:8,sad:9,calm:9,excited:3,happy:6}, tags:['安静','咖啡','阅读'], estimatedDuration:90 },
  { id:22, name:'杭州博物馆', category:'museum', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'indoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:5,happy:6}, tags:['免费','历史','文化'], estimatedDuration:120 },
  { id:23, name:'灵隐寺', category:'temple', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor',
    ticketPrice:75, kidsFriendly:true, elderlyFriendly:true, minAge:3,
    moodScores:{tired:4,anxious:4,sad:5,calm:6,excited:5,happy:6}, tags:['佛教','古迹','人流量大'], estimatedDuration:120 },
  { id:24, name:'九溪烟树', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor',
    ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:5,
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
  const k = store.hasKids ? 'kids' : store.hasElderly ? 'elderly' : 'solo'
  return WEIGHT_MATRIX[`${store.moodLabel}_${k}`] || WEIGHT_MATRIX.default
}

function doGenerate() {
  const moodLabel = store.moodLabel
  const moodIndex = store.moodIndex
  const weights = getWeightKey()
  const dailyBudget = store.budget / days.value

  // 第1层：硬性过滤
  const candidates = POIS.filter(poi => {
    if (poi.ticketPrice > dailyBudget * 0.5) return false
    if (isRain.value && poi.weatherSensitivity === 'outdoor') return false
    if (store.hasKids && !poi.kidsFriendly) return false
    if (store.hasKids && poi.minAge && poi.minAge > 5) return false
    if (store.hasElderly && !poi.elderlyFriendly && poi.energyLevel >= 4) return false
    if (store.isDieting && poi.category === 'restaurant' && !poi.isDietFriendly) return false
    return true
  })

  // 第2层：多维评分
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
    const dietScore = store.isDieting && poi.isDietFriendly ? weights.diet * 100 : 0
    const total = moodScore + budgetScore + energyScore + crowdScore + kidScore + elderlyScore + dietScore
    return { ...poi, _scores: { moodScore, budgetScore, energyScore, crowdScore, kidScore, elderlyScore, dietScore }, _total: total }
  })
  scored.sort((a, b) => b._total - a._total)

  // 第3层：编排
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
        reason: genReason(poi, moodLabel),
        reasonTags: genTags(poi),
        _scores: poi._scores, _total: poi._total
      })
      hour += dur
    })
    itinerary.push({ day: d + 1, items })
  }

  // 酒店
  const hotelCandidates = HOTELS.map(h => {
    let score = 0
    const ratio = h.priceRangeLow / dailyBudget
    if (ratio <= 0.3) score += 30; else if (ratio <= 0.5) score += 25; else if (ratio <= 0.8) score += 20; else if (ratio <= 1.2) score += 15; else score += 5
    if (store.budgetSensitive) score *= 1.5
    score += (h.moodScores[moodLabel] || 5) * 3
    if (store.hasKids && h.kidsFriendly) score += 20
    if (store.hasElderly && h.elderlyFriendly) score += 20
    score += h.rating * 5
    return { ...h, _score: score }
  }).sort((a, b) => b._score - a._score)

  const best = hotelCandidates[0]
  let totalCost = 0
  itinerary.forEach(d => d.items.forEach(it => { totalCost += it.estimatedCost || 0 }))
  totalCost += (best?.priceRangeLow || 0) * days.value

  return {
    itinerary,
    hotel: best ? {
      name: best.name,
      rating: best.rating,
      price: best.priceRangeLow,
      savedAmount: Math.round(best.priceRangeLow * 0.15),
      bestPlatform: '飞猪',
      reason: genHotelReason(best, moodLabel)
    } : null,
    stats: {
      totalCost,
      totalSaved: Math.round(best?.priceRangeLow * 0.15 || 0),
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
  return reasons.join('；') || '综合匹配推荐'
}

function genTags(poi) {
  const s = poi._scores
  const tags = []
  if (s.moodScore > 20) tags.push('心情匹配')
  if (s.budgetScore > 15) tags.push(poi.ticketPrice === 0 ? '免费景点' : '高性价比')
  if (store.isDieting && poi.isDietFriendly) tags.push('低卡健康')
  if (store.hasKids && poi.kidsFriendly) tags.push('亲子推荐')
  return tags
}

function genHotelReason(hotel, moodLabel) {
  const reasons = []
  if (hotel.moodScores[moodLabel] >= 8) reasons.push('当前心情高度匹配')
  if (hotel.priceRangeLow <= store.budget * 0.3) reasons.push('预算友好')
  if (hotel.rating >= 4.5) reasons.push('高评分推荐')
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
  padding: 0 32rpx;
  transition: background 0.5s ease;
}
.header {
  padding: 88rpx 0 32rpx; text-align: center;
}
.header-title { font-size: 36rpx; font-weight: 800; color: var(--color-text); display: block }
.header-sub { font-size: 24rpx; color: var(--color-text-light); margin-top: 8rpx; display: block }

/* 心情卡片 */
.mood-card {
  background: var(--color-card); border-radius: var(--radius);
  padding: 24rpx; display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 32rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.03);
}
.mood-card-left { display: flex; align-items: center; gap: 16rpx }
.mood-emoji { font-size: 48rpx }
.mood-label { font-size: 28rpx; font-weight: 700; color: var(--color-text); display: block }
.mood-hint { font-size: 22rpx; color: var(--color-text-light); margin-top: 4rpx; display: block }
.mood-badge {
  padding: 8rpx 20rpx; border-radius: 20rpx;
  font-size: 22rpx; font-weight: 600; color: #fff;
  transition: background 0.5s;
}

/* 表单 */
.section { margin-bottom: 32rpx }
.section-title { font-size: 28rpx; font-weight: 700; margin-bottom: 16rpx }
.form-card { background: var(--color-card); border-radius: var(--radius); padding: 24rpx }
.form-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx }
.form-label { font-size: 26rpx; font-weight: 600; color: var(--color-text); flex-shrink: 0 }
.form-input { flex: 1; text-align: right; font-size: 26rpx; color: var(--color-text) }
.form-value { font-size: 26rpx; color: var(--theme-primary); font-weight: 600; transition: color 0.5s }
.budget-slider { flex: 1; display: flex; align-items: center; gap: 16rpx }
.budget-value { font-size: 26rpx; font-weight: 700; flex-shrink: 0 }
.budget-presets { display: flex; gap: 8rpx; margin-bottom: 20rpx }
.budget-preset {
  flex: 1; padding: 12rpx 8rpx; border-radius: var(--radius-sm);
  background: #F5F2ED; font-size: 20rpx; font-weight: 600;
  text-align: center; color: var(--color-text-light);
  transition: all 0.2s;
}
.budget-preset.active { color: #fff }
.stepper { display: flex; align-items: center; gap: 24rpx }
.stepper-btn {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  background: #F5F2ED; display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: 700; color: var(--color-text);
}
.stepper-value { font-size: 32rpx; font-weight: 700 }
.weather-toggle {
  display: flex; align-items: center; gap: 12rpx;
  font-size: 26rpx; color: var(--color-text);
}

/* 加载动画 */
.loading-section {
  display: flex; flex-direction: column; align-items: center;
  padding: 48rpx 0;
}
.loading-spinner {
  width: 64rpx; height: 64rpx;
  border: 4rpx solid #E0DCD4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }
.loading-text {
  font-size: 28rpx; font-weight: 600; color: var(--color-text);
  margin-top: 20rpx;
}
.loading-steps {
  display: flex; flex-direction: column; gap: 8rpx;
  margin-top: 24rpx; width: 100%;
}
.loading-step {
  display: flex; align-items: center; gap: 12rpx;
  font-size: 24rpx; color: var(--color-text-light);
}
.loading-step.done { color: var(--theme-primary) }
.step-dot {
  width: 12rpx; height: 12rpx; border-radius: 50%;
  background: #E0DCD4;
}
.step-text { font-size: 24rpx }

/* 仪表盘 */
.dashboard {
  display: flex; gap: 16rpx;
}
.gauge-card {
  flex: 1;
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 20rpx;
}
.gauge-label {
  font-size: 24rpx; font-weight: 600; color: var(--color-text);
  display: block; margin-bottom: 12rpx;
}
.gauge-bar {
  height: 12rpx; background: #E8E4DC;
  border-radius: 6rpx; overflow: hidden;
  margin-bottom: 8rpx;
}
.gauge-fill {
  height: 100%; border-radius: 6rpx;
  transition: width 0.8s ease;
}
.gauge-value {
  font-size: 22rpx; font-weight: 600;
}
.stats-row {
  display: flex; gap: 12rpx; margin-top: 16rpx;
}
.stat-item {
  flex: 1; text-align: center;
  background: var(--color-card); border-radius: var(--radius);
  padding: 16rpx 8rpx;
}
.stat-num { font-size: 28rpx; font-weight: 700; color: var(--color-text); display: block }
.stat-label { font-size: 20rpx; color: var(--color-text-light); margin-top: 4rpx; display: block }

/* 日期标题 */
.day-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 24rpx; border-radius: var(--radius);
  font-size: 26rpx; font-weight: 700;
  margin-bottom: 16rpx;
  transition: all 0.5s;
}

/* 时间轴 */
.timeline { padding-left: 40rpx; position: relative }
.timeline::before {
  content: ''; position: absolute; left: 11rpx; top: 8rpx; bottom: 8rpx;
  width: 4rpx; background: #E0DCD4; border-radius: 2rpx;
}
.timeline-item { position: relative; margin-bottom: 24rpx }
.timeline-dot {
  position: absolute; left: -29rpx; top: 16rpx;
  width: 20rpx; height: 20rpx; border-radius: 50%; z-index: 2;
}
.timeline-card {
  background: var(--color-card); border-radius: var(--radius);
  padding: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.02);
}
.time-row { display: flex; justify-content: space-between; margin-bottom: 8rpx }
.time { font-size: 24rpx; font-weight: 700; color: var(--theme-primary); transition: color 0.5s }
.category { font-size: 20rpx; color: var(--color-text-light); background: #F5F2ED; padding: 4rpx 12rpx; border-radius: 8rpx }
.poi-name { font-size: 30rpx; font-weight: 700; display: block; margin-bottom: 6rpx }
.poi-desc { font-size: 24rpx; color: var(--color-text-light); display: block; margin-bottom: 12rpx }
.reason-bar { font-size: 22rpx; color: var(--color-text-light); background: #F8F6F2; padding: 12rpx; border-radius: var(--radius-sm) }
.tags { display: flex; flex-wrap: wrap; gap: 6rpx; margin-top: 8rpx }
.tag {
  font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 12rpx;
}

/* 预订按钮行 */
.booking-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 16rpx; padding-top: 16rpx;
  border-top: 1rpx solid #F0EDE8;
}
.price-tag {
  font-size: 28rpx; font-weight: 700;
  transition: color 0.5s;
}
.book-btn {
  padding: 10rpx 28rpx;
  border-radius: 24rpx;
  font-size: 24rpx; font-weight: 600; color: #fff;
  transition: all 0.2s;
}
.book-btn:active { transform: scale(0.95); opacity: 0.9 }
.book-btn.loading { opacity: 0.7 }

/* 酒店卡片 */
.hotel-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,.03);
}
.hotel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12rpx;
}
.hotel-name { font-size: 30rpx; font-weight: 700; color: var(--color-text) }
.hotel-rating { font-size: 24rpx; color: var(--color-text-light); display: block; margin-top: 4rpx }
.hotel-price { font-size: 36rpx; font-weight: 800; transition: color 0.5s }
.hotel-reason { font-size: 24rpx; color: var(--color-text-light); display: block; margin-bottom: 8rpx }
.hotel-savings { font-size: 24rpx; color: #8BA88C; font-weight: 600; margin-bottom: 16rpx }
.hotel-book-btn { width: 100%; text-align: center; padding: 16rpx 0; border-radius: 32rpx; font-size: 28rpx; font-weight: 600; }

/* 生成按钮 */
.generate-btn {
  margin: 40rpx 0;
  width: 100%; height: 96rpx;
  border-radius: 48rpx; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: 700; color: #fff;
  transition: all 0.3s;
}
.generate-btn:active { transform: scale(.97) }
.generate-btn[disabled] { opacity: .7 }

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
  max-width: 600rpx;
  background: #FFFCF8;
  border-radius: 32rpx;
  padding: 40rpx;
  animation: popIn 0.3s ease;
}
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}
.booking-popup-header {
  text-align: center; margin-bottom: 24rpx;
}
.booking-popup-title {
  font-size: 32rpx; font-weight: 700; color: var(--color-text);
}
.booking-popup-body {
  display: flex; flex-direction: column; align-items: center;
}
.booking-spinner {
  width: 56rpx; height: 56rpx;
  border: 4rpx solid #E0DCD4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16rpx;
}
.booking-popup-text {
  font-size: 26rpx; color: var(--color-text-light);
  margin-bottom: 24rpx;
}
.platform-list {
  width: 100%;
  display: flex; flex-direction: column; gap: 8rpx;
}
.platform-item {
  display: flex; align-items: center; gap: 12rpx;
  padding: 16rpx;
  background: #F5F2ED;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.platform-item.checked {
  background: #E4F0E6;
}
.platform-icon { font-size: 32rpx }
.platform-name { flex: 1; font-weight: 600; color: var(--color-text) }
.platform-price { font-weight: 700; color: #8BA88C }
.platform-wait { color: var(--color-text-light); font-size: 22rpx }
.booking-popup-footer {
  margin-top: 24rpx; text-align: center;
}
.booking-best {
  font-size: 28rpx; font-weight: 700; color: var(--color-text);
  display: block;
}
.booking-save {
  font-size: 24rpx; color: #8BA88C; font-weight: 600;
  margin: 8rpx 0 16rpx; display: block;
}
.booking-action-btn {
  width: 100%; height: 80rpx;
  border-radius: 40rpx; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700; color: #fff;
  transition: background 0.5s;
}
.booking-action-btn:active { transform: scale(.97) }

.safe-bottom { height: 40rpx }
</style>