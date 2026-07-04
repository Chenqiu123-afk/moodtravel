<template>
  <!-- ================================================================ -->
  <!-- 动态成本面板 — 实时预算明细 + 饼图可视化 -->
  <!-- ================================================================ -->
  <div class="cost-panel" ref="panelEl">
    <!-- 面板标题 -->
    <div class="cost-panel-header">
      <span class="cost-panel-title">预算明细</span>
      <span class="cost-panel-badge" :style="{ background: accent + '18', color: accent }">
        {{ costSummary.totalBudget }} 总预算
      </span>
    </div>

    <!-- 饼图可视化 -->
    <div class="cost-chart-wrap">
      <svg class="cost-chart" viewBox="0 0 160 160" ref="chartEl">
        <!-- 背景圆环 -->
        <circle
          cx="80" cy="80" r="64"
          fill="none"
          stroke="rgba(42, 52, 64, 0.06)"
          stroke-width="18"
        />
        <!-- 各段弧 -->
        <circle
          v-for="(seg, i) in segments"
          :key="i"
          cx="80" cy="80" r="64"
          fill="none"
          :stroke="seg.color"
          stroke-width="18"
          :stroke-dasharray="seg.dashArray"
          :stroke-dashoffset="seg.dashOffset"
          :transform="seg.rotate"
          stroke-linecap="round"
          class="chart-segment"
          :style="{ animationDelay: i * 0.12 + 's' }"
        />
        <!-- 中心文字 -->
        <text x="80" y="74" text-anchor="middle" class="chart-center-amount" :style="{ fill: textColor }">
          {{ costSummary.remaining }}
        </text>
        <text x="80" y="92" text-anchor="middle" class="chart-center-label" :style="{ fill: textSecondary }">
          剩余
        </text>
      </svg>
    </div>

    <!-- 分类明细 -->
    <div class="cost-breakdown">
      <div
        v-for="item in costItems"
        :key="item.label"
        class="cost-breakdown-item"
        ref="breakdownItems"
      >
        <div class="cost-breakdown-left">
          <span class="cost-dot" :style="{ background: item.color }" />
          <span class="cost-label">{{ item.label }}</span>
        </div>
        <div class="cost-breakdown-right">
          <span class="cost-amount">{{ item.amount }}</span>
          <span class="cost-percent">{{ item.percent }}%</span>
        </div>
      </div>
    </div>

    <!-- 超支预警 -->
    <Transition name="alert-slide">
      <div v-if="isOverBudget" class="cost-alert" ref="alertEl">
        <span class="cost-alert-icon">⚠️</span>
        <div class="cost-alert-text">
          <span class="cost-alert-title">预算超支</span>
          <span class="cost-alert-desc">当前方案超出预算 {{ overBudgetAmount }}，建议调整</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import anime from 'animejs'

const props = defineProps({
  budget: { type: Number, default: 2000 },
  accent: { type: String, default: '#FF6B6B' },
  textColor: { type: String, default: '#2A3440' },
  textSecondary: { type: String, default: '#6B7685' }
})

const panelEl = ref(null)
const chartEl = ref(null)
const alertEl = ref(null)
const breakdownItems = ref([])

// 模拟成本数据 — 基于预算动态计算
const costItems = computed(() => {
  const b = props.budget
  const hotel = Math.round(b * 0.42)
  const food = Math.round(b * 0.28)
  const transport = Math.round(b * 0.15)
  const tickets = Math.round(b * 0.10)
  const other = b - hotel - food - transport - tickets

  return [
    { label: '住宿', amount: hotel, percent: 42, color: '#FF6B6B' },
    { label: '餐饮', amount: food, percent: 28, color: '#FFB347' },
    { label: '交通', amount: transport, percent: 15, color: '#6B8FA3' },
    { label: '门票', amount: tickets, percent: 10, color: '#8BA88C' },
    { label: '其他', amount: other, percent: 5, color: '#B5A3C4' }
  ]
})

const costSummary = computed(() => {
  const total = props.budget
  const used = costItems.value.reduce((s, i) => s + i.amount, 0)
  return {
    totalBudget: total,
    totalUsed: used,
    remaining: total - used,
    remainingPercent: Math.round(((total - used) / total) * 100)
  }
})

const isOverBudget = computed(() => costSummary.value.totalUsed > props.budget)
const overBudgetAmount = computed(() => {
  const diff = costSummary.value.totalUsed - props.budget
  return `¥${diff}`
})

// 饼图各段计算
const segments = computed(() => {
  const items = costItems.value
  const total = items.reduce((s, i) => s + i.amount, 0)
  const circumference = 2 * Math.PI * 64 // r=64

  let cumulative = 0
  return items.map((item) => {
    const ratio = item.amount / total
    const dashLen = circumference * ratio
    const dashGap = circumference - dashLen
    const offset = -cumulative * circumference
    cumulative += ratio

    return {
      color: item.color,
      dashArray: `${dashLen} ${dashGap}`,
      dashOffset: circumference * 0.25, // 从12点方向开始
      rotate: `rotate(${offset * (360 / circumference)} 80 80)`
    }
  })
})

// 动画
function animateChart() {
  if (!chartEl.value) return
  const segments = chartEl.value.querySelectorAll('.chart-segment')
  anime({
    targets: segments,
    opacity: [0, 1],
    scale: [0.8, 1],
    delay: anime.stagger(80),
    duration: 500,
    easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
  })
}

function animateBreakdown() {
  if (!breakdownItems.value.length) return
  anime({
    targets: breakdownItems.value,
    translateX: [12, 0],
    opacity: [0, 1],
    delay: anime.stagger(60),
    duration: 400,
    easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
  })
}

function animateAlert() {
  if (!alertEl.value) return
  anime({
    targets: alertEl.value,
    scale: [0.95, 1],
    opacity: [0, 1],
    duration: 400,
    easing: 'cubicBezier(0.34, 1.56, 0.64, 1)'
  })
}

// 预算变化时触发动画
watch(() => props.budget, () => {
  nextTick(() => {
    animateChart()
    animateBreakdown()
    if (isOverBudget.value) {
      nextTick(animateAlert)
    }
  })
})

onMounted(() => {
  nextTick(() => {
    animateChart()
    animateBreakdown()
  })
})
</script>

<style scoped>
/* ============================================================
   Cost Panel
   ============================================================ */
.cost-panel {
  background: var(--premium-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--premium-glass-border);
  border-radius: var(--premium-radius-md);
  padding: 24px;
  box-shadow: var(--premium-shadow-sm);
  will-change: transform;
}

.cost-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.cost-panel-title {
  font-family: var(--premium-font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--premium-text);
  letter-spacing: 0.3px;
}

.cost-panel-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 10px;
  font-family: var(--premium-font-body);
}

/* 饼图 */
.cost-chart-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.cost-chart {
  width: 160px;
  height: 160px;
}

.chart-segment {
  opacity: 0;
  will-change: transform, opacity;
}

.chart-center-amount {
  font-family: var(--premium-font-display);
  font-size: 22px;
  font-weight: 700;
}

.chart-center-label {
  font-family: var(--premium-font-body);
  font-size: 11px;
  font-weight: 400;
}

/* 分类明细 */
.cost-breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.cost-breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--premium-radius-sm);
  background: rgba(42, 52, 64, 0.02);
  border: 1px solid rgba(42, 52, 64, 0.04);
  will-change: transform, opacity;
}

.cost-breakdown-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cost-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cost-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--premium-text);
  font-family: var(--premium-font-body);
}

.cost-breakdown-right {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cost-amount {
  font-size: 13px;
  font-weight: 600;
  color: var(--premium-text);
  font-variant-numeric: tabular-nums;
  font-family: var(--premium-font-display);
}

.cost-percent {
  font-size: 11px;
  font-weight: 400;
  color: var(--premium-text-muted);
  min-width: 28px;
  text-align: right;
}

/* 超支预警 */
.cost-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--premium-radius-sm);
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.15);
  animation: pulseGlow 2s ease-in-out infinite;
}

.cost-alert-icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1.3;
}

.cost-alert-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cost-alert-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--premium-accent);
  font-family: var(--premium-font-body);
}

.cost-alert-desc {
  font-size: 11px;
  color: var(--premium-text-secondary);
  line-height: 1.4;
}

/* 弹出层过渡 */
.alert-slide-enter-active {
  transition: all 0.4s var(--premium-easing-bounce);
}
.alert-slide-leave-active {
  transition: all 0.2s var(--premium-easing);
}
.alert-slide-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}
.alert-slide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 长辈模式 */
[data-accessibility="elderly"] .cost-panel {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(0,0,0,0.08);
}
[data-accessibility="elderly"] .cost-panel-title { font-size: 20px; }
[data-accessibility="elderly"] .cost-panel-badge { font-size: 14px; }
[data-accessibility="elderly"] .cost-label { font-size: 16px; }
[data-accessibility="elderly"] .cost-amount { font-size: 16px; }
[data-accessibility="elderly"] .cost-percent { font-size: 14px; }
[data-accessibility="elderly"] .cost-alert-title { font-size: 16px; }
[data-accessibility="elderly"] .cost-alert-desc { font-size: 14px; }
[data-accessibility="elderly"] .chart-center-amount { font-size: 28px; }
[data-accessibility="elderly"] .chart-center-label { font-size: 14px; }
</style>