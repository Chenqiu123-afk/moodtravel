<template>
  <div class="business-page" :style="{ background: pageBg }">
    <!-- ============================================================ -->
    <!-- 顶部导航 -->
    <!-- ============================================================ -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <div class="header-center">
        <span class="header-title">关于我们</span>
        <span class="header-sub">认证计划 · 商业模式</span>
      </div>
      <div class="header-right" />
    </div>

    <!-- ============================================================ -->
    <!-- Tab 切换 -->
    <!-- ============================================================ -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        :style="activeTab === tab.key ? { color: theme.primary } : {}"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <div v-if="activeTab === tab.key" class="tab-indicator" :style="{ background: theme.primary }" />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- Tab 1: 认证计划说明 -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'plan'" class="tab-content">
      <div class="hero-card glass-card">
        <div class="hero-icon">🛡️</div>
        <h2 class="hero-title">MoodTravel 认证计划</h2>
        <p class="hero-desc">
          我们建立了一套严格的商家认证体系，确保每一位用户在「寻找治愈空间」中发现的所有商家，都经过品质、安全、隐私等多维度的审核。
        </p>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">📋</span>
          <span>认证标准</span>
        </div>
        <div class="standards-list">
          <div v-for="std in standards" :key="std.id" class="standard-card glass-card">
            <div class="standard-icon-wrap">
              <span class="standard-icon">{{ std.icon }}</span>
            </div>
            <div class="standard-info">
              <span class="standard-name">{{ std.name }}</span>
              <span class="standard-desc">{{ std.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">🏅</span>
          <span>认证等级</span>
        </div>
        <div class="levels-grid">
          <div class="level-card glass-card diamond">
            <div class="level-badge">💎</div>
            <span class="level-name">钻石认证</span>
            <span class="level-desc">通过全部7项标准审核</span>
            <span class="level-count">1家</span>
          </div>
          <div class="level-card glass-card gold">
            <div class="level-badge">🥇</div>
            <span class="level-name">金牌认证</span>
            <span class="level-desc">通过5-6项标准审核</span>
            <span class="level-count">4家</span>
          </div>
          <div class="level-card glass-card silver">
            <div class="level-badge">🥈</div>
            <span class="level-name">银牌认证</span>
            <span class="level-desc">通过4-5项标准审核</span>
            <span class="level-count">5家</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- Tab 2: 分成模式 -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'share'" class="tab-content">
      <div class="hero-card glass-card">
        <div class="hero-icon">🤝</div>
        <h2 class="hero-title">透明分成模式</h2>
        <p class="hero-desc">
          平台采用阶梯式分成机制，不同品类商家享有不同的分成比例。所有分成明细公开透明，商家可随时查看流水。
        </p>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">💰</span>
          <span>分成比例</span>
        </div>
        <div class="rate-table">
          <div class="rate-row header-row">
            <span class="rate-col">品类</span>
            <span class="rate-col">分成比例</span>
            <span class="rate-col">平台服务费</span>
            <span class="rate-col">示例</span>
          </div>
          <div v-for="rate in shareRates" :key="rate.category" class="rate-row">
            <span class="rate-col">{{ rate.icon }} {{ rate.category }}</span>
            <span class="rate-col highlight" :style="{ color: theme.primary }">{{ rate.rate }}%</span>
            <span class="rate-col">2%</span>
            <span class="rate-col rate-example">¥1000 → ¥{{ rate.example }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">📊</span>
          <span>最近分成流水</span>
        </div>
        <div class="revenue-list">
          <div v-for="item in recentRevenue" :key="item.id" class="revenue-card glass-card">
            <div class="revenue-left">
              <span class="revenue-merchant">{{ item.merchantName }}</span>
              <span class="revenue-date">{{ item.date }}</span>
            </div>
            <div class="revenue-right">
              <span class="revenue-amount">¥{{ item.amount }}</span>
              <span class="revenue-share" :style="{ color: theme.primary }">
                分成 ¥{{ item.shareAmount }}
              </span>
              <span class="revenue-status" :class="item.status === '已结算' ? 'settled' : 'pending'">
                {{ item.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- Tab 3: 数据报告 -->
    <!-- ============================================================ -->
    <div v-if="activeTab === 'report'" class="tab-content">
      <div class="hero-card glass-card">
        <div class="hero-icon">📈</div>
        <h2 class="hero-title">Mock 数据报告</h2>
        <p class="hero-desc">
          以下为模拟数据，展示平台运营概况。实际数据将根据真实订单动态更新。
        </p>
        <span class="report-period">{{ report.period }} 月报</span>
      </div>

      <!-- KPI 卡片 -->
      <div class="kpi-grid">
        <div class="kpi-card glass-card">
          <span class="kpi-label">总订单数</span>
          <span class="kpi-value">{{ report.totalOrders.toLocaleString() }}</span>
          <span class="kpi-change up">↑ {{ (report.monthlyGrowth * 100).toFixed(0) }}%</span>
        </div>
        <div class="kpi-card glass-card">
          <span class="kpi-label">总交易额</span>
          <span class="kpi-value">¥{{ report.totalRevenue.toLocaleString() }}</span>
          <span class="kpi-change up">↑ {{ (report.monthlyGrowth * 100).toFixed(0) }}%</span>
        </div>
        <div class="kpi-card glass-card">
          <span class="kpi-label">平台分成</span>
          <span class="kpi-value">¥{{ report.totalShareAmount.toLocaleString() }}</span>
          <span class="kpi-change">平均 {{ (report.avgShareRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="kpi-card glass-card">
          <span class="kpi-label">用户满意度</span>
          <span class="kpi-value">{{ report.userSatisfaction }}</span>
          <span class="kpi-change">退款率 {{ (report.refundRate * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 品类分布 -->
      <div class="section">
        <div class="section-title">
          <span class="section-icon">🏷️</span>
          <span>品类分布</span>
        </div>
        <div class="category-chart">
          <div v-for="cat in report.topCategories" :key="cat.name" class="chart-row">
            <div class="chart-label">
              <span class="chart-name">{{ cat.name }}</span>
              <span class="chart-count">{{ cat.orderCount }}单</span>
            </div>
            <div class="chart-bar-wrap">
              <div
                class="chart-bar"
                :style="{
                  width: (cat.revenue / report.totalRevenue * 100).toFixed(0) + '%',
                  background: chartColors[cat.name] || theme.primary
                }"
              />
            </div>
            <span class="chart-value">¥{{ cat.revenue.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- 日趋势简图 -->
      <div class="section">
        <div class="section-title">
          <span class="section-icon">📅</span>
          <span>每日趋势</span>
        </div>
        <div class="trend-chart">
          <div class="trend-bars">
            <div v-for="day in report.dailyTrend" :key="day.date" class="trend-bar-col">
              <div class="trend-bar-wrap">
                <div
                  class="trend-bar"
                  :style="{
                    height: (day.orders / maxDailyOrders * 100).toFixed(0) + '%',
                    background: theme.primary
                  }"
                />
              </div>
              <span class="trend-bar-label">{{ day.date }}</span>
              <span class="trend-bar-value">{{ day.orders }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import {
  CERTIFICATION_STANDARDS,
  REVENUE_HISTORY,
  DATA_REPORT
} from '@/data/certifiedData.js'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const activeTab = ref('plan')

const tabs = [
  { key: 'plan', icon: '🛡️', label: '认证计划' },
  { key: 'share', icon: '💰', label: '分成模式' },
  { key: 'report', icon: '📊', label: '数据报告' }
]

const standards = CERTIFICATION_STANDARDS

const shareRates = [
  { category: '酒店住宿', icon: '🏨', rate: 12, example: 120 },
  { category: '餐饮美食', icon: '🍽️', rate: 10, example: 100 },
  { category: '景点门票', icon: '🎭', rate: 12, example: 120 },
  { category: '休闲娱乐', icon: '🧘', rate: 8, example: 80 }
]

const recentRevenue = REVENUE_HISTORY.slice(0, 8)

const report = DATA_REPORT

const chartColors = {
  '酒店住宿': '#B5A3C4',
  '餐饮美食': '#E8945A',
  '景点门票': '#8BA88C',
  '休闲娱乐': '#6B8FA3'
}

const maxDailyOrders = computed(() => {
  return Math.max(...report.dailyTrend.map(d => d.orders), 1)
})

const pageBg = computed(() => theme.value.bg)

function goBack() {
  router.back()
}
</script>

<style scoped>
.business-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}

/* ===== 顶部导航 ===== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 44px 0 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.back-arrow {
  font-size: 18px;
  color: #555;
  font-weight: 600;
}

.header-center {
  text-align: center;
}

.header-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  display: block;
}

.header-sub {
  font-size: 11px;
  color: var(--color-text-light);
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

.header-right {
  width: 36px;
}

/* ===== Tab 切换 ===== */
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  background: rgba(255,255,255,0.5);
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  color: var(--color-text-light);
}

.tab-item.active {
  background: #fff;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

.tab-icon {
  font-size: 16px;
}

.tab-label {
  font-size: 12px;
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  border-radius: 2px;
}

/* ===== Hero 卡片 ===== */
.hero-card {
  padding: 20px;
  border-radius: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.hero-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.hero-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.6;
}

.report-period {
  display: inline-block;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #8BA88C;
  background: #8BA88C15;
  padding: 4px 10px;
  border-radius: 10px;
}

/* ===== 通用区块 ===== */
.section {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 10px;
}

.section-icon {
  font-size: 16px;
}

/* ===== 认证标准列表 ===== */
.standards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.standard-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
}

.standard-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #8BA88C15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.standard-icon {
  font-size: 20px;
}

.standard-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.standard-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.standard-desc {
  font-size: 11px;
  color: var(--color-text-light);
  line-height: 1.4;
}

/* ===== 认证等级 ===== */
.levels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.level-card {
  padding: 14px 10px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.level-badge {
  font-size: 28px;
}

.level-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.level-desc {
  font-size: 10px;
  color: var(--color-text-light);
  line-height: 1.3;
}

.level-count {
  font-size: 12px;
  font-weight: 700;
  color: #8BA88C;
  background: #8BA88C15;
  padding: 2px 10px;
  border-radius: 10px;
}

/* ===== 分成比例表 ===== */
.rate-table {
  border-radius: 12px;
  overflow: hidden;
}

.rate-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr 1.2fr;
  padding: 10px 12px;
  font-size: 12px;
  align-items: center;
}

.rate-row.header-row {
  background: #F5F2ED;
  font-weight: 700;
  color: var(--color-text);
}

.rate-row:not(.header-row) {
  border-bottom: 1px solid #F0EDE8;
}

.rate-col {
  color: var(--color-text);
}

.rate-col.highlight {
  font-weight: 700;
}

.rate-example {
  color: var(--color-text-light);
  font-size: 11px;
}

/* ===== 分成流水 ===== */
.revenue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.revenue-card {
  padding: 12px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.revenue-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.revenue-merchant {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.revenue-date {
  font-size: 11px;
  color: var(--color-text-light);
}

.revenue-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.revenue-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.revenue-share {
  font-size: 11px;
  font-weight: 600;
}

.revenue-status {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
}

.revenue-status.settled {
  background: #8BA88C15;
  color: #8BA88C;
}

.revenue-status.pending {
  background: #E8945A15;
  color: #E8945A;
}

/* ===== KPI 卡片 ===== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.kpi-card {
  padding: 14px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label {
  font-size: 11px;
  color: var(--color-text-light);
  font-weight: 600;
}

.kpi-value {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text);
}

.kpi-change {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-light);
}

.kpi-change.up {
  color: #8BA88C;
}

/* ===== 品类分布图 ===== */
.category-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-label {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chart-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

.chart-count {
  font-size: 10px;
  color: var(--color-text-light);
}

.chart-bar-wrap {
  flex: 1;
  height: 8px;
  background: #F0EDE8;
  border-radius: 4px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-value {
  width: 70px;
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text);
  flex-shrink: 0;
}

/* ===== 日趋势图 ===== */
.trend-chart {
  padding: 12px 0;
}

.trend-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  gap: 4px;
}

.trend-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.trend-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 70%;
  max-width: 28px;
  border-radius: 4px 4px 0 0;
  transition: height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  min-height: 4px;
}

.trend-bar-label {
  font-size: 9px;
  color: var(--color-text-light);
  font-weight: 500;
}

.trend-bar-value {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text);
}

.safe-bottom {
  height: 40px;
}
</style>