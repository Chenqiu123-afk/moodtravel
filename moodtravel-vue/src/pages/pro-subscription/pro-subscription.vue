<template>
  <!-- ================================================================ -->
  <!-- MoodTravel Pro 订阅页 — 解锁高级情绪旅行体验 -->
  <!-- ================================================================ -->
  <div class="pro-page" :style="{ background: gradientBg }">
    <!-- 顶部 -->
    <header class="pro-top">
      <button class="pro-back" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <div class="pro-header">
        <span class="pro-title">MoodTravel Pro</span>
        <span class="pro-sub">解锁完整情绪旅行体验</span>
      </div>
    </header>

    <!-- 当前方案 -->
    <div class="current-plan glass-card" v-if="currentPlan">
      <span class="current-label">当前方案</span>
      <span class="current-name" :style="{ color: currentPlan.color }">{{ currentPlan.name }}</span>
      <span class="current-desc">{{ currentPlan.features[0] }}</span>
    </div>

    <!-- Pro 方案列表 -->
    <div class="plans-section">
      <div class="section-title">
        <span class="title-icon">🌟</span>
        <span class="title-text">选择适合你的方案</span>
      </div>

      <div class="plans-grid">
        <div
          v-for="plan in PRO_PLANS"
          :key="plan.id"
          class="plan-card glass-card"
          :class="{ popular: plan.popular, active: store.proPlan === plan.id }"
        >
          <div v-if="plan.popular" class="popular-badge" :style="{ background: plan.color }">
            {{ plan.saveLabel || '推荐' }}
          </div>
          <div class="plan-header">
            <span class="plan-name">{{ plan.name }}</span>
            <div class="plan-price">
              <span class="plan-currency">¥</span>
              <span class="plan-amount">{{ plan.price }}</span>
              <span class="plan-period">/{{ plan.period }}</span>
            </div>
          </div>
          <div class="plan-features">
            <div v-for="(feat, i) in plan.features" :key="i" class="plan-feat">
              <span class="feat-check">✓</span>
              <span class="feat-text">{{ feat }}</span>
            </div>
          </div>
          <button
            class="plan-btn"
            :class="{ current: store.proPlan === plan.id }"
            :style="store.proPlan === plan.id ? { background: '#E8E4DC', color: '#888' } : { background: plan.color }"
            :disabled="store.proPlan === plan.id"
            @click="selectPlan(plan.id)"
          >
            {{ store.proPlan === plan.id ? '当前方案' : '选择方案' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pro 权益对比 -->
    <div class="compare-section">
      <div class="section-title">
        <span class="title-icon">📊</span>
        <span class="title-text">权益对比</span>
      </div>
      <div class="compare-table glass-card">
        <div class="compare-row header">
          <span class="compare-feat">功能</span>
          <span class="compare-val">免费版</span>
          <span class="compare-val pro">Pro</span>
        </div>
        <div v-for="row in compareRows" :key="row.label" class="compare-row">
          <span class="compare-feat">{{ row.label }}</span>
          <span class="compare-val">{{ row.free }}</span>
          <span class="compare-val pro">{{ row.pro }}</span>
        </div>
      </div>
    </div>

    <!-- 订阅按钮 -->
    <div class="subscribe-section">
      <button class="subscribe-btn" :style="{ background: theme.primary }" @click="confirmSubscribe">
        {{ store.proPlan !== 'pro-free' ? '立即订阅' : '升级到 Pro' }}
      </button>
      <span class="subscribe-note">随时可取消，无需长期绑定</span>
    </div>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import { PRO_PLANS, getProPlan } from '@/data/merchantPackageData.js'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 30%)`
})

const currentPlan = computed(() => getProPlan(store.proPlan))

const compareRows = [
  { label: '每日推荐', free: '5条', pro: '无限' },
  { label: 'AI 对话', free: '10次/天', pro: '无限次' },
  { label: '多维度推荐算法', free: '基础', pro: '高级' },
  { label: '认证商家折扣', free: '—', pro: '✓' },
  { label: '情绪数据导出', free: '—', pro: '✓' },
  { label: '年度情绪报告', free: '—', pro: '✓' },
  { label: '去广告体验', free: '—', pro: '✓' },
  { label: '专属客服', free: '—', pro: '✓' }
]

function selectPlan(planId) {
  if (store.proPlan === planId) return
  store.proPlan = planId
  localStorage.setItem('moodtravel_pro_plan', planId)
}

function confirmSubscribe() {
  if (store.proPlan === 'pro-free') {
    // 默认升级到月度
    store.proPlan = 'pro-monthly'
    localStorage.setItem('moodtravel_pro_plan', 'pro-monthly')
  }
  // 模拟订阅流程
  const plan = getProPlan(store.proPlan)
  const confirmed = confirm(`确认订阅 ${plan.name}？\n\n¥${plan.price}/${plan.period}\n\n（模拟支付流程）`)
  if (confirmed) {
    alert(`订阅成功！\n\n你已升级到 ${plan.name}，所有 Pro 权益已生效。`)
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.pro-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}

/* ===== 顶部 ===== */
.pro-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 44px 0 16px;
}

.pro-back {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.03);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}

.back-arrow { font-size: 18px; color: #888; }

.pro-header { display: flex; flex-direction: column; gap: 1px; }

.pro-title {
  font-size: 18px; font-weight: 800;
  color: var(--color-text, #3A3A3A);
}

.pro-sub {
  font-size: 12px; color: var(--color-text-light, #9A9A9A);
  font-weight: 400;
}

/* ===== 当前方案 ===== */
.current-plan {
  display: flex; flex-direction: column; gap: 4px;
  padding: 14px; border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.current-label { font-size: 11px; color: var(--color-text-light); font-weight: 600; }
.current-name { font-size: 16px; font-weight: 800; }
.current-desc { font-size: 12px; color: var(--color-text-light); }

/* ===== 方案卡片 ===== */
.plans-section { margin-bottom: 16px; }

.section-title {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 10px;
}

.title-icon { font-size: 16px; }
.title-text { font-size: 15px; font-weight: 700; color: var(--color-text); }

.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.plan-card {
  position: relative;
  padding: 16px;
  border-radius: 14px;
  border: 1.5px solid transparent;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.plan-card.popular {
  border-color: #E8945A30;
}

.plan-card.active {
  border-color: var(--theme-primary, #A3B5A6);
}

.popular-badge {
  position: absolute;
  top: -8px; right: 10px;
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 10px; font-weight: 700; color: #fff;
}

.plan-header {
  display: flex; flex-direction: column;
  gap: 6px; margin-bottom: 12px;
}

.plan-name {
  font-size: 14px; font-weight: 700; color: var(--color-text);
}

.plan-price { display: flex; align-items: baseline; }

.plan-currency { font-size: 14px; font-weight: 700; color: var(--color-text); }
.plan-amount { font-size: 28px; font-weight: 800; color: var(--color-text); }
.plan-period { font-size: 12px; color: var(--color-text-light); }

.plan-features {
  display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 12px;
}

.plan-feat { display: flex; align-items: flex-start; gap: 6px; }

.feat-check { font-size: 12px; color: var(--theme-primary, #8BA88C); font-weight: 700; flex-shrink: 0; }
.feat-text { font-size: 11px; color: var(--color-text, #4A4A4A); line-height: 1.4; }

.plan-btn {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  color: #fff;
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.plan-btn:active:not(:disabled) { transform: scale(0.95); opacity: 0.85; }
.plan-btn:disabled { cursor: default; }

/* ===== 权益对比 ===== */
.compare-section { margin-bottom: 16px; }

.compare-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.compare-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  padding: 10px 14px;
  border-bottom: 1px solid #F0EDE8;
}

.compare-row:last-child { border-bottom: none; }
.compare-row.header { background: #F8F5F0; }

.compare-feat { font-size: 12px; color: var(--color-text); font-weight: 600; }
.compare-row.header .compare-feat { font-size: 11px; color: var(--color-text-light); }
.compare-val { font-size: 12px; color: var(--color-text-light); text-align: center; }
.compare-val.pro { color: var(--theme-primary, #8BA88C); font-weight: 700; }

/* ===== 订阅按钮 ===== */
.subscribe-section {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 20px 0;
}

.subscribe-btn {
  width: 100%; max-width: 320px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  color: #fff;
  font-size: 16px; font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.subscribe-btn:active { transform: scale(0.95); opacity: 0.8; }

.subscribe-note {
  font-size: 11px; color: var(--color-text-light);
}

.safe-bottom { height: 20px; }

/* 长辈模式 */
[data-accessibility="elderly"] .pro-title { font-size: 22px; }
[data-accessibility="elderly"] .plan-name { font-size: 17px; }
[data-accessibility="elderly"] .plan-amount { font-size: 34px; }
[data-accessibility="elderly"] .feat-text { font-size: 14px; }
[data-accessibility="elderly"] .plan-btn { font-size: 16px; padding: 14px; }
[data-accessibility="elderly"] .compare-feat { font-size: 15px; }
[data-accessibility="elderly"] .compare-val { font-size: 15px; }
</style>