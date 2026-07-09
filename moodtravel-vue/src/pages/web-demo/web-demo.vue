<template>
  <!-- ================================================================ -->
  <!--  MoodTravel 全屏沉浸版 v2 — 动态动画背景 · 左右分栏 · 玻璃拟态 -->
  <!--  背景：CSS 多层动画（天空渐变 + 浮云 + 热气球 + 粒子） -->
  <!--  布局：左 40% 品牌+心情 | 右 60% 预算+卡片（可滚动） -->
  <!-- ================================================================ -->
  <div class="premium-page" ref="pageEl">

    <!-- ============================================================ -->
    <!--  背景层：固定全屏，多层 CSS 动画 -->
    <!-- ============================================================ -->
    <div class="bg-layer" aria-hidden="true">
      <!-- 天空渐变 -->
      <div class="bg-sky" :class="'sky-' + activeMood" />
      <!-- 浮云 -->
      <div class="bg-clouds">
        <div class="cloud cloud-1" />
        <div class="cloud cloud-2" />
        <div class="cloud cloud-3" />
        <div class="cloud cloud-4" />
        <div class="cloud cloud-5" />
      </div>
      <!-- 热气球 -->
      <div class="bg-balloons">
        <div class="balloon balloon-1">
          <div class="balloon-envelope" />
          <div class="balloon-basket" />
        </div>
        <div class="balloon balloon-2">
          <div class="balloon-envelope" />
          <div class="balloon-basket" />
        </div>
      </div>
      <!-- 飞机 -->
      <div class="bg-airplane">
        <span class="airplane-icon">✈️</span>
        <div class="airplane-trail" />
      </div>
      <!-- 粒子 -->
      <div class="bg-particles">
        <span v-for="n in 20" :key="n" class="particle" :style="particleStyle(n)" />
      </div>
      <!-- 底部山峦剪影 -->
      <div class="bg-mountains">
        <div class="mountain mountain-1" />
        <div class="mountain mountain-2" />
        <div class="mountain mountain-3" />
      </div>
    </div>

    <!-- ============================================================ -->
    <!--  主布局：左右分栏 -->
    <!-- ============================================================ -->
    <div class="main-layout">

      <!-- ========================================================== -->
      <!--  左侧面板 (40%)：品牌 · 心情选择 · 快捷入口 -->
      <!-- ========================================================== -->
      <aside class="left-panel">
        <div class="left-content">
          <!-- 品牌区 -->
          <div class="brand-section">
            <div class="brand-icon">✦</div>
            <h1 class="brand-name">MoodTravel</h1>
            <p class="brand-slogan">让每一次出发<br/>都有温度</p>
            <p class="brand-sub">情绪驱动旅行 · 随心而行</p>
          </div>

          <!-- 心情选择器 -->
          <div class="mood-section">
            <h3 class="mood-section-title">此刻心情</h3>
            <div class="mood-grid">
              <button
                v-for="mood in moods"
                :key="mood.key"
                class="mood-btn"
                :class="{ active: activeMood === mood.key }"
                :style="activeMood === mood.key ? {
                  background: mood.color + '28',
                  borderColor: mood.color + '60',
                  color: mood.color,
                  boxShadow: `0 0 32px ${mood.color}30, inset 0 0 24px ${mood.color}10`
                } : {}"
                @click="selectMood(mood)"
                @mouseenter="hoveredMood = mood.key"
                @mouseleave="hoveredMood = null"
                :aria-label="'选择' + mood.label + '心情'"
              >
                <span class="mood-btn-emoji" :class="{ wiggle: hoveredMood === mood.key }">
                  {{ mood.emoji }}
                </span>
                <span class="mood-btn-label">{{ mood.label }}</span>
              </button>
            </div>
          </div>

          <!-- 底部快捷入口 -->
          <div class="left-quick">
            <button class="quick-link" @click="scrollToContent">
              <span>↓</span> 探索方案
            </button>
          </div>
        </div>
      </aside>

      <!-- ========================================================== -->
      <!--  右侧面板 (60%)：预算 · 热门路线 · 方案卡片 -->
      <!-- ========================================================== -->
      <main class="right-panel" ref="rightPanelEl">
        <div class="right-content">

          <!-- 预算控制面板 -->
          <section class="budget-section" ref="budgetSectionEl">
            <div class="glass-panel budget-panel">
              <div class="budget-header">
                <span class="budget-label">旅行预算</span>
                <span class="budget-hint">拖动滑块或直接输入</span>
              </div>

              <!-- 金额展示 -->
              <div class="budget-display">
                <span class="budget-currency">¥</span>
                <span class="budget-number" ref="budgetNumberEl">
                  {{ displayBudget.toLocaleString() }}
                </span>
              </div>

              <!-- 滑块 -->
              <div class="budget-slider-wrap">
                <div class="budget-slider-track">
                  <div
                    class="budget-slider-fill"
                    :class="{ glowing: isDragging }"
                    :style="{ width: sliderPercent + '%', background: activeMoodColor }"
                  />
                </div>
                <input
                  type="range"
                  class="budget-slider-input"
                  :min="200" :max="5000" :step="50"
                  :value="budget"
                  @input="onSliderInput"
                  @mousedown="onSliderStart"
                  @mouseup="onSliderEnd"
                  @touchstart="onSliderStart"
                  @touchend="onSliderEnd"
                />
                <div class="budget-range-labels">
                  <span>¥200</span>
                  <span>¥5,000</span>
                </div>
              </div>

              <!-- 预设 + 自定义 -->
              <div class="budget-controls">
                <div class="budget-presets">
                  <button
                    v-for="p in budgetPresets"
                    :key="p.value"
                    class="preset-chip"
                    :class="{ active: budget === p.value }"
                    :style="budget === p.value ? {
                      background: activeMoodColor + '22',
                      borderColor: activeMoodColor,
                      color: activeMoodColor
                    } : {}"
                    @click="setBudget(p.value)"
                  >{{ p.label }}</button>
                </div>
                <div class="budget-custom-wrap">
                  <span class="budget-custom-prefix">¥</span>
                  <input
                    type="text"
                    class="budget-custom-input"
                    placeholder="自定义金额"
                    :value="customInput"
                    @input="onCustomInput"
                    @blur="onCustomBlur"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- 热门情绪路线 — 横向滚动 -->
          <section class="hot-routes-section">
            <div class="section-header">
              <h2 class="section-title">热门情绪路线</h2>
              <span class="section-hint">← 左右滑动 →</span>
            </div>
            <div class="hot-routes-scroll" ref="hotRoutesEl">
              <div
                v-for="route in hotRoutes"
                :key="route.id"
                class="hot-route-card glass-panel"
                @click="showToast(`探索「${route.title}」`)"
              >
                <div class="hot-route-img" :style="{ background: route.bg }">
                  <span class="hot-route-emoji">{{ route.emoji }}</span>
                </div>
                <div class="hot-route-info">
                  <span class="hot-route-title">{{ route.title }}</span>
                  <span class="hot-route-meta">{{ route.days }} · {{ route.budget }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 推荐方案瀑布流 -->
          <section class="plans-section" ref="plansSectionEl">
            <div class="section-header">
              <h2 class="section-title">推荐方案</h2>
              <span class="section-count" :style="{ background: activeMoodColor + '18', color: activeMoodColor }">
                {{ visibleCards.length }} 套
              </span>
            </div>
            <div class="plans-waterfall">
              <div
                v-for="card in visibleCards"
                :key="card.id"
                class="plan-card glass-panel"
                ref="planCardEls"
              >
                <!-- 头部 -->
                <div class="plan-card-header">
                  <span class="plan-card-mood" :style="{ background: card.color + '22', color: card.color }">
                    {{ card.moodLabel }}
                  </span>
                  <button
                    class="plan-card-switch"
                    @click.stop="toggleCardSide(card)"
                    :style="{ color: activeMoodColor }"
                  >{{ card.showBack ? '方案A' : '方案B' }}</button>
                </div>
                <!-- 路线 -->
                <div class="plan-card-route">
                  <div
                    v-for="(step, si) in (card.showBack ? card.planB : card.planA)"
                    :key="si"
                    class="plan-route-step"
                  >
                    <span class="plan-step-time">{{ step.time }}</span>
                    <span class="plan-step-dot" :style="{ background: card.color }" />
                    <span class="plan-step-name">{{ step.name }}</span>
                  </div>
                </div>
                <!-- 底部 -->
                <div class="plan-card-footer">
                  <div class="plan-card-stats">
                    <span>{{ (card.showBack ? card.planBStats : card.planAStats).steps }}</span>
                    <span>{{ (card.showBack ? card.planBStats : card.planAStats).time }}</span>
                    <span>{{ (card.showBack ? card.planBStats : card.planAStats).budget }}</span>
                  </div>
                  <button class="plan-card-book" :style="{ background: activeMoodColor }" @click.stop="onReserve(card)">
                    预订
                  </button>
                </div>
              </div>
            </div>

            <div v-if="hasMoreCards" class="load-more-wrap">
              <button class="load-more-btn glass-panel" @click="loadMore" :disabled="loadingMore">
                <span v-if="!loadingMore">加载更多</span>
                <span v-else class="loading-dots"><span class="dot" /><span class="dot" /><span class="dot" /></span>
              </button>
            </div>
          </section>

          <!-- 合规 -->
          <div class="compliance-strip">
            <span class="comp-item">🖼️ CSS 动画 · 自主绘制</span>
            <span class="comp-item">🔤 Google Fonts · SIL OFL 1.1</span>
            <span class="comp-item wcag-badge" :class="wcagLevel">
              <span class="wcag-dot" /> WCAG 2.1 {{ wcagLevel }}
            </span>
          </div>

          <!-- 底部 -->
          <footer class="mini-footer">
            <span>MoodTravel 情绪旅行</span>
            <span class="dot-sep">·</span>
            <span>图片来自 Unsplash（免费商用授权）</span>
            <span class="dot-sep">·</span>
            <span>字体来自 Google Fonts（SIL OFL 1.1）</span>
          </footer>
        </div>
      </main>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast-bar">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import anime from 'animejs'
import { IMAGE_ASSETS, FONT_ASSETS, checkThemeContrast, generateComplianceReport } from '@/utils/compliance.js'

// ================================================================
//  心情系统
// ================================================================
const moods = [
  { key: 'calm',    label: '平静',   emoji: '😌', color: '#8BA88C' },
  { key: 'happy',   label: '开心',   emoji: '😊', color: '#E8A85A' },
  { key: 'sad',     label: '治愈',   emoji: '🌅', color: '#E8945A' },
  { key: 'anxious', label: '放松',   emoji: '🌿', color: '#6B8FA3' },
  { key: 'excited', label: '探索',   emoji: '🔥', color: '#FF6B6B' },
  { key: 'tired',   label: '慵懒',   emoji: '😴', color: '#B5A3C4' }
]

const activeMood = ref('calm')
const activeMoodLabel = ref('平静')
const activeMoodColor = ref('#8BA88C')
const hoveredMood = ref(null)

function selectMood(mood) {
  activeMood.value = mood.key
  activeMoodLabel.value = mood.label
  activeMoodColor.value = mood.color
  document.documentElement.setAttribute('data-mood', mood.key)
  showToast(`已切换至「${mood.label}」模式`)
}

// ================================================================
//  预算系统
// ================================================================
const budget = ref(2000)
const displayBudget = ref(2000)
const customInput = ref('')
const isDragging = ref(false)

const budgetPresets = [
  { label: '¥500', value: 500 },
  { label: '¥1,000', value: 1000 },
  { label: '¥2,000', value: 2000 },
  { label: '¥3,000', value: 3000 },
  { label: '¥5,000', value: 5000 }
]

const sliderPercent = computed(() => ((budget.value - 200) / (5000 - 200)) * 100)

function setBudget(val) {
  budget.value = val
  displayBudget.value = val
  customInput.value = ''
  animateBudget()
}

function onSliderInput(e) {
  const val = Number(e.target.value)
  budget.value = val
  displayBudget.value = val
  customInput.value = ''
}

function onSliderStart() { isDragging.value = true }
function onSliderEnd() { isDragging.value = false }

function onCustomInput(e) {
  const raw = e.target.value.replace(/[^0-9]/g, '')
  customInput.value = raw
  if (raw) {
    const val = Math.min(5000, Math.max(200, Number(raw)))
    budget.value = val
    displayBudget.value = val
  }
}

function onCustomBlur() {
  if (customInput.value) {
    const val = Math.min(5000, Math.max(200, Number(customInput.value)))
    budget.value = val
    displayBudget.value = val
  }
}

function animateBudget() {
  anime({
    targets: { val: displayBudget.value },
    val: budget.value,
    round: 1,
    easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)',
    duration: 400,
    update: (a) => { displayBudget.value = a.animations[0].currentValue }
  })
}

// ================================================================
//  热门路线
// ================================================================
const hotRoutes = [
  { id: 1, title: '森林治愈之旅', emoji: '🌲', days: '2天1夜', budget: '¥800起', bg: 'linear-gradient(135deg, #a8d8a8, #6b9b6b)' },
  { id: 2, title: '海边发呆指南', emoji: '🌊', days: '3天2夜', budget: '¥1,500起', bg: 'linear-gradient(135deg, #89CFF0, #4A90D9)' },
  { id: 3, title: '城市漫步探店', emoji: '☕', days: '1天', budget: '¥300起', bg: 'linear-gradient(135deg, #D4A574, #A67C52)' },
  { id: 4, title: '山间露营观星', emoji: '🏕️', days: '2天1夜', budget: '¥600起', bg: 'linear-gradient(135deg, #7B8FB2, #4A5F7A)' },
  { id: 5, title: '古镇文艺之旅', emoji: '🏘️', days: '2天1夜', budget: '¥500起', bg: 'linear-gradient(135deg, #C4A8A8, #8B7070)' },
  { id: 6, title: '骑行追风计划', emoji: '🚴', days: '1天', budget: '¥200起', bg: 'linear-gradient(135deg, #FFB347, #E8945A)' },
  { id: 7, title: '温泉放松之旅', emoji: '♨️', days: '2天1夜', budget: '¥1,200起', bg: 'linear-gradient(135deg, #B5A3C4, #7B6B8A)' }
]

// ================================================================
//  方案卡片
// ================================================================
const planCards = [
  {
    id: 1, color: '#FF6B6B', moodLabel: '活力出行', showBack: false,
    planA: [
      { time: '09:00', name: '西湖苏堤漫步' }, { time: '12:00', name: '知味观午餐' },
      { time: '14:00', name: '青藤茶馆品茗' }, { time: '17:00', name: '雷峰塔日落' }
    ],
    planAStats: { steps: '🚶 8k步', time: '⏱ 8h', budget: '💰 ¥1,200' },
    planB: [
      { time: '08:00', name: '十里琅珰徒步' }, { time: '11:30', name: '龙井村农家菜' },
      { time: '14:00', name: '环湖骑行30km' }, { time: '18:00', name: '桂语山房晚餐' }
    ],
    planBStats: { steps: '🚶 25k步', time: '⏱ 10h', budget: '💰 ¥2,800' }
  },
  {
    id: 2, color: '#8BA88C', moodLabel: '治愈放松', showBack: false,
    planA: [
      { time: '10:00', name: '浙博之江馆' }, { time: '13:00', name: '素食餐厅' },
      { time: '15:00', name: '梅家坞茶园' }, { time: '18:00', name: '湖边散步' }
    ],
    planAStats: { steps: '🚶 5k步', time: '⏱ 6h', budget: '💰 ¥800' },
    planB: [
      { time: '09:00', name: '西溪湿地摇橹船' }, { time: '12:30', name: '湿地农庄午餐' },
      { time: '15:00', name: '湿地博物馆' }, { time: '18:00', name: '河坊街小吃' }
    ],
    planBStats: { steps: '🚶 12k步', time: '⏱ 9h', budget: '💰 ¥1,500' }
  },
  {
    id: 3, color: '#6B8FA3', moodLabel: '静谧时光', showBack: false,
    planA: [
      { time: '11:00', name: '猫空书店' }, { time: '13:30', name: '转角咖啡馆' },
      { time: '16:00', name: '社区花园' }, { time: '19:00', name: '日式居酒屋' }
    ],
    planAStats: { steps: '🚶 3k步', time: '⏱ 5h', budget: '💰 ¥500' },
    planB: [
      { time: '10:00', name: '避世书局' }, { time: '13:00', name: '法喜寺素斋' },
      { time: '15:00', name: '云栖竹径' }, { time: '18:00', name: '灵隐寺晚钟' }
    ],
    planBStats: { steps: '🚶 8k步', time: '⏱ 8h', budget: '💰 ¥1,000' }
  },
  {
    id: 4, color: '#E8A85A', moodLabel: '探索冒险', showBack: false,
    planA: [
      { time: '07:00', name: '宝石山日出' }, { time: '10:00', name: '北山街骑行' },
      { time: '13:00', name: '青芝坞午餐' }, { time: '16:00', name: '九溪烟树徒步' }
    ],
    planAStats: { steps: '🚶 20k步', time: '⏱ 11h', budget: '💰 ¥1,800' },
    planB: [
      { time: '06:30', name: '满觉陇登山' }, { time: '11:00', name: '虎跑泉水泡茶' },
      { time: '14:00', name: '六和塔登高' }, { time: '17:00', name: '钱塘江骑行' }
    ],
    planBStats: { steps: '🚶 28k步', time: '⏱ 12h', budget: '💰 ¥2,000' }
  },
  {
    id: 5, color: '#B5A3C4', moodLabel: '文艺漫步', showBack: false,
    planA: [
      { time: '10:00', name: '中国美院象山校区' }, { time: '13:00', name: '转塘艺术街区' },
      { time: '15:00', name: '单向空间书店' }, { time: '18:00', name: '爵士酒吧' }
    ],
    planAStats: { steps: '🚶 10k步', time: '⏱ 8h', budget: '💰 ¥1,200' },
    planB: [
      { time: '09:00', name: '南宋御街漫步' }, { time: '12:00', name: '杭帮菜博物馆' },
      { time: '14:30', name: '晓风书屋' }, { time: '17:00', name: '西湖音乐喷泉' }
    ],
    planBStats: { steps: '🚶 15k步', time: '⏱ 9h', budget: '💰 ¥1,600' }
  },
  {
    id: 6, color: '#C4A8A8', moodLabel: '温暖陪伴', showBack: false,
    planA: [
      { time: '09:30', name: '花港观鱼' }, { time: '12:00', name: '楼外楼午餐' },
      { time: '14:00', name: '三潭印月游船' }, { time: '17:00', name: '湖滨银泰晚餐' }
    ],
    planAStats: { steps: '🚶 6k步', time: '⏱ 7h', budget: '💰 ¥1,500' },
    planB: [
      { time: '10:00', name: '杭州动物园' }, { time: '13:00', name: '外婆家午餐' },
      { time: '15:00', name: '少年宫游乐' }, { time: '18:00', name: '武林夜市' }
    ],
    planBStats: { steps: '🚶 10k步', time: '⏱ 8h', budget: '💰 ¥1,800' }
  }
]

const extraCards = [
  {
    id: 7, color: '#A3B5A6', moodLabel: '自然呼吸', showBack: false,
    planA: [
      { time: '08:00', name: '植物园晨练' }, { time: '11:00', name: '农家乐午餐' },
      { time: '14:00', name: '龙井问茶' }, { time: '17:00', name: '茅家埠日落' }
    ],
    planAStats: { steps: '🚶 12k步', time: '⏱ 8h', budget: '💰 ¥1,000' },
    planB: [
      { time: '07:00', name: '玉皇山登顶' }, { time: '11:00', name: '八卦田采摘' },
      { time: '14:00', name: '江洋畈生态公园' }, { time: '17:00', name: '白塔公园' }
    ],
    planBStats: { steps: '🚶 18k步', time: '⏱ 10h', budget: '💰 ¥1,400' }
  },
  {
    id: 8, color: '#FFB347', moodLabel: '美食之旅', showBack: false,
    planA: [
      { time: '09:00', name: '新丰小吃早餐' }, { time: '12:00', name: '奎元馆虾爆鳝面' },
      { time: '15:00', name: '定胜糕体验' }, { time: '18:00', name: '湖滨28餐厅' }
    ],
    planAStats: { steps: '🚶 4k步', time: '⏱ 6h', budget: '💰 ¥2,000' },
    planB: [
      { time: '08:30', name: '游埠豆浆' }, { time: '12:00', name: '德明饭店' },
      { time: '15:00', name: 'Cycle&Cycle' }, { time: '18:00', name: '金沙厅' }
    ],
    planBStats: { steps: '🚶 6k步', time: '⏱ 7h', budget: '💰 ¥3,500' }
  }
]

const visibleCards = ref([...planCards])
const loadingMore = ref(false)
const hasMoreCards = ref(true)

function toggleCardSide(card) {
  card.showBack = !card.showBack
  showToast(`${card.moodLabel} · ${card.showBack ? '方案B' : '方案A'}`)
}

function loadMore() {
  if (loadingMore.value) return
  loadingMore.value = true
  setTimeout(() => {
    visibleCards.value.push(...extraCards)
    hasMoreCards.value = false
    loadingMore.value = false
    nextTick(() => observeCards())
  }, 600)
}

// ================================================================
//  Toast
// ================================================================
const toast = ref(null)
function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2500)
}

// ================================================================
//  事件
// ================================================================
function onReserve(card) { showToast(`预订「${card.moodLabel}」方案...`) }
function scrollToContent() {
  const el = document.querySelector('.budget-section')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

// ================================================================
//  合规
// ================================================================
const wcagResults = computed(() => checkThemeContrast({
  primary: activeMoodColor.value, primaryLight: '#FF8E8E', bg: '#F0F4F8', bgGradient: '#E4EAF0'
}))
const wcagLevel = computed(() =>
  Object.values(wcagResults.value).every(r => r.aa) ? 'AA' : 'FAIL'
)

// ================================================================
//  粒子样式
// ================================================================
function particleStyle(n) {
  const left = (n * 37 + 13) % 100
  const delay = (n * 0.7) % 8
  const duration = 6 + (n % 5) * 2
  const size = 2 + (n % 3)
  return {
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    width: size + 'px',
    height: size + 'px'
  }
}

// ================================================================
//  滚动渐入
// ================================================================
let cardObserver = null
function observeCards() {
  if (cardObserver) cardObserver.disconnect()
  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible')
        cardObserver.unobserve(e.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' })

  document.querySelectorAll('.plan-card').forEach(el => cardObserver.observe(el))
}

// ================================================================
//  Refs
// ================================================================
const pageEl = ref(null)
const rightPanelEl = ref(null)
const budgetSectionEl = ref(null)
const hotRoutesEl = ref(null)
const plansSectionEl = ref(null)
const budgetNumberEl = ref(null)
const planCardEls = ref([])

// ================================================================
//  入场动画
// ================================================================
function animateEntrance() {
  const tl = anime.timeline({ easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)' })

  // 品牌区
  tl.add({ targets: '.brand-section', translateY: [30, 0], opacity: [0, 1], duration: 700 })
  // 心情按钮
  tl.add({ targets: '.mood-btn', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(60), duration: 500 }, '-=300')
  // 快捷入口
  tl.add({ targets: '.left-quick', opacity: [0, 1], duration: 400 }, '-=200')
  // 预算面板
  tl.add({ targets: '.budget-section', translateX: [40, 0], opacity: [0, 1], duration: 600 }, '-=300')
  // 热门路线
  tl.add({ targets: '.hot-routes-section', translateX: [30, 0], opacity: [0, 1], duration: 500 }, '-=200')
}

// ================================================================
//  生命周期
// ================================================================
onMounted(() => {
  nextTick(() => {
    animateEntrance()
    observeCards()
  })
  console.log('[MoodTravel] 合规报告:', generateComplianceReport())
})

onUnmounted(() => {
  if (cardObserver) cardObserver.disconnect()
})
</script>

<style scoped>
/* ================================================================
   CSS 变量
   ================================================================ */
.premium-page {
  --easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --font-display: 'Playfair Display', 'Noto Serif SC', 'Georgia', serif;
  --font-body: 'Inter', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  --font-title: 'Montserrat', 'Inter', system-ui, sans-serif;

  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  position: relative;
}

/* ================================================================
   背景层 — 固定全屏，多层 CSS 动画
   ================================================================ */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

/* 天空渐变 */
.bg-sky {
  position: absolute;
  inset: 0;
  transition: background 1.2s var(--easing);
}
.bg-sky.sky-calm    { background: linear-gradient(180deg, #A8D8EA 0%, #C9E8D4 40%, #F0E6D3 80%, #E8D5C4 100%); }
.bg-sky.sky-happy   { background: linear-gradient(180deg, #FFD89B 0%, #F7C89C 30%, #F5D5A0 60%, #E8C89A 100%); }
.bg-sky.sky-sad     { background: linear-gradient(180deg, #FFB7B2 0%, #FFDAC1 30%, #E2F0CB 70%, #B5EAD7 100%); }
.bg-sky.sky-anxious { background: linear-gradient(180deg, #A8C8E8 0%, #C8DCE8 40%, #D8E8D8 80%, #C8D8C8 100%); }
.bg-sky.sky-excited { background: linear-gradient(180deg, #FF9A9E 0%, #FECFEF 30%, #FEE599 60%, #A1C4FD 100%); }
.bg-sky.sky-tired   { background: linear-gradient(180deg, #C8B8D8 0%, #D8C8E8 40%, #E0D0E8 80%, #D0C0D8 100%); }

/* 浮云 */
.bg-clouds {
  position: absolute;
  inset: 0;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 50%;
}
.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}
.cloud-1 { width: 180px; height: 60px; top: 12%;  animation: cloudDrift1 32s linear infinite; }
.cloud-1::before { width: 70px;  height: 70px;  top: -35px; left: 30px; }
.cloud-1::after  { width: 90px;  height: 90px;  top: -40px; left: 80px; }

.cloud-2 { width: 140px; height: 50px; top: 28%;  animation: cloudDrift2 28s linear infinite; }
.cloud-2::before { width: 55px;  height: 55px;  top: -28px; left: 25px; }
.cloud-2::after  { width: 70px;  height: 70px;  top: -32px; left: 60px; }

.cloud-3 { width: 200px; height: 65px; top: 45%;  animation: cloudDrift1 35s linear infinite; animation-delay: -8s; }
.cloud-3::before { width: 80px;  height: 80px;  top: -38px; left: 35px; }
.cloud-3::after  { width: 100px; height: 100px; top: -45px; left: 90px; }

.cloud-4 { width: 120px; height: 40px; top: 62%;  animation: cloudDrift2 30s linear infinite; animation-delay: -12s; }
.cloud-4::before { width: 50px;  height: 50px;  top: -24px; left: 20px; }
.cloud-4::after  { width: 60px;  height: 60px;  top: -28px; left: 50px; }

.cloud-5 { width: 160px; height: 55px; top: 75%;  animation: cloudDrift1 33s linear infinite; animation-delay: -18s; }
.cloud-5::before { width: 65px;  height: 65px;  top: -30px; left: 28px; }
.cloud-5::after  { width: 80px;  height: 80px;  top: -35px; left: 70px; }

@keyframes cloudDrift1 {
  from { transform: translateX(-220px); opacity: 0.6; }
  50%  { opacity: 0.9; }
  to   { transform: translateX(calc(100vw + 220px)); opacity: 0.6; }
}
@keyframes cloudDrift2 {
  from { transform: translateX(calc(100vw + 160px)); opacity: 0.5; }
  50%  { opacity: 0.85; }
  to   { transform: translateX(-160px); opacity: 0.5; }
}

/* 热气球 */
.bg-balloons {
  position: absolute;
  inset: 0;
}

.balloon {
  position: absolute;
  animation: balloonFloat 18s ease-in-out infinite;
}
.balloon-1 { left: 15%; animation-duration: 20s; animation-delay: -3s; }
.balloon-2 { right: 12%; animation-duration: 22s; animation-delay: -8s; }

.balloon-envelope {
  width: 60px;
  height: 75px;
  background: radial-gradient(ellipse at 50% 30%, #FF6B6B, #E85555 60%, #D44 100%);
  border-radius: 50% 50% 45% 45%;
  position: relative;
  box-shadow: inset 0 -8px 16px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.08);
}
.balloon-2 .balloon-envelope {
  background: radial-gradient(ellipse at 50% 30%, #6BB5FF, #4A90D9 60%, #357ABD 100%);
}
.balloon-basket {
  width: 20px;
  height: 16px;
  background: #8B6914;
  border-radius: 0 0 4px 4px;
  margin: -2px auto 0;
  position: relative;
}
.balloon-basket::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 4px;
  width: 1px;
  height: 14px;
  background: rgba(0,0,0,0.2);
  box-shadow: 12px 0 0 rgba(0,0,0,0.2);
}

@keyframes balloonFloat {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  25%      { transform: translateY(-20px) rotate(1deg); }
  50%      { transform: translateY(-10px) rotate(-0.5deg); }
  75%      { transform: translateY(-30px) rotate(0.5deg); }
}

/* 飞机 */
.bg-airplane {
  position: absolute;
  top: 8%;
  left: -80px;
  animation: airplaneFly 18s linear infinite;
  z-index: 2;
}

.airplane-icon {
  font-size: 32px;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.airplane-trail {
  position: absolute;
  top: 50%;
  right: 100%;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), rgba(255,255,255,0.8));
  border-radius: 1px;
  animation: trailPulse 1.5s ease-in-out infinite;
}

@keyframes airplaneFly {
  0%   { transform: translateX(0) translateY(0); }
  25%  { transform: translateX(calc(100vw + 80px)) translateY(-15px); }
  50%  { transform: translateX(calc(100vw + 80px)) translateY(0); }
  50.01% { transform: translateX(-80px) translateY(0); }
  100% { transform: translateX(0) translateY(0); }
}

@keyframes trailPulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 0.8; }
}

/* 粒子 */
.bg-particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: particleRise linear infinite;
}

@keyframes particleRise {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 0.8; }
  90%  { opacity: 0.3; }
  100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
}

/* 底部山峦剪影 */
.bg-mountains {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25vh;
  pointer-events: none;
}

.mountain {
  position: absolute;
  bottom: 0;
  border-radius: 50% 50% 0 0;
}
.mountain-1 {
  left: -5%;
  width: 45%;
  height: 100%;
  background: rgba(139, 168, 140, 0.15);
}
.mountain-2 {
  left: 25%;
  width: 50%;
  height: 80%;
  background: rgba(107, 143, 163, 0.12);
}
.mountain-3 {
  right: -5%;
  width: 40%;
  height: 90%;
  background: rgba(139, 168, 140, 0.1);
}

/* ================================================================
   主布局：左右分栏
   ================================================================ */
.main-layout {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100vh;
}

/* ================================================================
   左侧面板 40%
   ================================================================ */
.left-panel {
  width: 42%;
  min-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 48px 48px 64px;
  position: relative;
  z-index: 2;
}

.left-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 56px;
  width: 100%;
}

/* 品牌区 */
.brand-section {
  text-align: left;
}

.brand-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 16px;
  animation: brandGlow 3s ease-in-out infinite;
}

@keyframes brandGlow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.08); }
}

.brand-name {
  font-family: var(--font-title);
  font-size: clamp(36px, 4.5vw, 56px);
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 3px;
  margin: 0 0 20px;
  text-shadow: 0 2px 24px rgba(0,0,0,0.15);
}

.brand-slogan {
  font-family: var(--font-display);
  font-size: clamp(28px, 3.5vw, 44px);
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1.35;
  margin: 0 0 14px;
  text-shadow: 0 1px 12px rgba(0,0,0,0.1);
}

.brand-sub {
  font-family: var(--font-body);
  font-size: clamp(16px, 1.8vw, 20px);
  font-weight: 300;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 3px;
  margin: 0;
}

/* 心情选择器 */
.mood-section {
  width: 100%;
}

.mood-section-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 20px;
  text-align: left;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: all 0.35s var(--easing);
}

.mood-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
}

.mood-btn.active {
  font-weight: 500;
}

.mood-btn-emoji {
  font-size: 36px;
  transition: transform 0.4s var(--easing);
  display: inline-block;
  line-height: 1;
}

.mood-btn-emoji.wiggle {
  animation: moodWiggle 0.6s var(--easing);
}

@keyframes moodWiggle {
  0%, 100% { transform: rotate(0); }
  20%      { transform: rotate(-8deg) scale(1.2); }
  40%      { transform: rotate(6deg); }
  60%      { transform: rotate(-4deg); }
  80%      { transform: rotate(2deg); }
}

.mood-btn-label {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
}

/* 快捷入口 */
.left-quick {
  opacity: 0;
}

.quick-link {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  padding: 14px 36px;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-body);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s var(--easing);
}

.quick-link:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.1);
}

/* ================================================================
   右侧面板 60% — 可滚动
   ================================================================ */
.right-panel {
  width: 58%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 48px 64px 48px 0;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.right-panel::-webkit-scrollbar {
  width: 4px;
}
.right-panel::-webkit-scrollbar-track {
  background: transparent;
}
.right-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.right-content {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* ================================================================
   玻璃拟态面板
   ================================================================ */
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.35s var(--easing);
}

.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

/* ================================================================
   预算面板
   ================================================================ */
.budget-section {
}

.budget-panel {
  padding: 44px 40px;
}

.budget-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 32px;
}

.budget-label {
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.budget-hint {
  font-family: var(--font-body);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.35);
}

.budget-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 36px;
}

.budget-currency {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.budget-number {
  font-family: var(--font-title);
  font-size: clamp(64px, 8vw, 96px);
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -3px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.12);
  transition: color 0.6s var(--easing);
}

/* 滑块 */
.budget-slider-wrap {
  position: relative;
  margin-bottom: 28px;
}

.budget-slider-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.budget-slider-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.05s linear, background 0.6s var(--easing);
  position: relative;
}

.budget-slider-fill.glowing::after {
  content: '';
  position: absolute;
  inset: -4px 0;
  background: inherit;
  filter: blur(12px);
  opacity: 0.6;
  animation: glowPulse 0.8s ease-in-out infinite alternate;
}

@keyframes glowPulse {
  from { opacity: 0.4; }
  to   { opacity: 0.8; }
}

.budget-slider-input {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  width: 100%;
  height: 40px;
  transform: translateY(-50%);
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

.budget-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 3px 18px rgba(0, 0, 0, 0.25);
  cursor: grab;
  transition: transform 0.2s var(--easing), box-shadow 0.2s var(--easing);
}

.budget-slider-input::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.25);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.35);
}

.budget-range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
}

/* 预设 + 自定义 */
.budget-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-presets {
  display: flex;
  gap: 8px;
}

.preset-chip {
  flex: 1;
  padding: 12px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.65);
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s var(--easing);
}

.preset-chip:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.28);
  color: #FFFFFF;
  transform: translateY(-1px);
}

.preset-chip.active {
  font-weight: 600;
}

.budget-custom-wrap {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0 14px;
  transition: all 0.3s var(--easing);
}

.budget-custom-wrap:focus-within {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.02);
}

.budget-custom-prefix {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.4);
  margin-right: 6px;
}

.budget-custom-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  padding: 13px 0;
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 500;
  color: #FFFFFF;
}
.budget-custom-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
  font-weight: 300;
}

/* ================================================================
   热门路线 — 横向滚动
   ================================================================ */
.hot-routes-section {
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  color: #FFFFFF;
  margin: 0;
  text-shadow: 0 1px 8px rgba(0,0,0,0.1);
}

.section-hint {
  font-family: var(--font-body);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
}

.section-count {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 12px;
  transition: all 0.6s var(--easing);
}

.hot-routes-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.hot-routes-scroll::-webkit-scrollbar {
  height: 3px;
}
.hot-routes-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.hot-routes-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.hot-route-card {
  flex: 0 0 220px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  scroll-snap-align: start;
  transition: all 0.35s var(--easing);
}

.hot-route-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
}

.hot-route-img {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hot-route-emoji {
  font-size: 52px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}

.hot-route-info {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hot-route-title {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}

.hot-route-meta {
  font-family: var(--font-body);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* ================================================================
   方案卡片瀑布流
   ================================================================ */
.plans-section {
}

.plans-waterfall {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plan-card {
  padding: 28px;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s var(--easing), transform 0.6s var(--easing), border-color 0.35s var(--easing), box-shadow 0.35s var(--easing);
  cursor: default;
}

.plan-card.visible {
  opacity: 1;
  transform: translateY(0);
}

.plan-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.plan-card-mood {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 10px;
}

.plan-card-switch {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.25s var(--easing);
}

.plan-card-switch:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.3);
}

.plan-card-route {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 2px;
}

.plan-route-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 0;
  position: relative;
}

.plan-route-step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 30px;
  width: 1.5px;
  height: calc(100% + 2px);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
}

.plan-step-time {
  font-family: var(--font-title);
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  width: 48px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.plan-step-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.plan-step-name {
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 500;
  color: #FFFFFF;
}

.plan-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.plan-card-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
}

.plan-card-book {
  padding: 9px 24px;
  border-radius: 12px;
  border: none;
  color: #FFFFFF;
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s var(--easing);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
}

.plan-card-book:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.plan-card-book:active {
  transform: scale(0.95);
}

/* 加载更多 */
.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0 0;
}

.load-more-btn {
  padding: 16px 48px;
  border: none;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.25s var(--easing);
}

.load-more-btn:hover:not(:disabled) {
  color: #FFFFFF;
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loading-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.loading-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: dotPulse 0.6s ease-in-out infinite alternate;
}
.loading-dots .dot:nth-child(2) { animation-delay: 0.15s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes dotPulse {
  from { transform: translateY(0); opacity: 0.3; }
  to   { transform: translateY(-6px); opacity: 1; }
}

/* ================================================================
   合规 & 底部
   ================================================================ */
.compliance-strip {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 10px;
}

.comp-item {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

.wcag-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(139, 168, 140, 0.15);
  color: #8BA88C;
}
.wcag-badge.FAIL {
  background: rgba(196, 168, 168, 0.15);
  color: #C4A8A8;
}
.wcag-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.mini-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  padding-bottom: 8px;
}
.dot-sep {
  color: rgba(255, 255, 255, 0.1);
}

/* ================================================================
   Toast
   ================================================================ */
.toast-bar {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 28px;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.75);
  color: #FFFFFF;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  z-index: 300;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}
.toast-enter-active { transition: all 0.3s var(--easing-bounce); }
.toast-leave-active { transition: all 0.2s var(--easing); }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* ================================================================
   响应式
   ================================================================ */
@media (max-width: 1200px) {
  .left-panel {
    width: 45%;
    padding: 40px 32px 40px 40px;
  }
  .right-panel {
    width: 55%;
    padding: 40px 40px 40px 0;
  }
}

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    min-width: 0;
    padding: 32px 24px 20px;
    height: auto;
  }
  .left-content {
    align-items: center;
    gap: 32px;
  }
  .brand-section {
    text-align: center;
  }
  .mood-section-title {
    text-align: center;
  }
  .mood-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }
  .mood-btn {
    padding: 16px 8px 14px;
    border-radius: 16px;
  }
  .mood-btn-emoji { font-size: 24px; }
  .mood-btn-label { font-size: 13px; }
  .right-panel {
    width: 100%;
    padding: 0 24px 40px;
    overflow-y: visible;
    height: auto;
  }
  .premium-page {
    overflow-y: auto;
    height: auto;
  }
  .brand-slogan { font-size: 24px; }
  .budget-number { font-size: 56px; }
  .section-title { font-size: 28px; }
}

@media (max-width: 640px) {
  .left-panel { padding: 24px 16px 16px; }
  .mood-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .budget-panel { padding: 28px 20px; }
  .budget-number { font-size: 48px; }
  .hot-route-card { flex: 0 0 160px; }
  .section-title { font-size: 24px; }
  .plan-card { padding: 20px; }
  .plan-step-name { font-size: 14px; }
  .brand-name { font-size: 28px; }
  .brand-slogan { font-size: 20px; }
}
</style>