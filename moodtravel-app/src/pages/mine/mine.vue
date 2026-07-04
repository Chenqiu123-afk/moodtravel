<template>
  <view class="mine-page" :style="{ background: gradientBg }">
    <!-- 头部 -->
    <view class="header">
      <view class="avatar-large" :style="{ background: theme.primaryLight + '30' }">
        {{ store.userInfo?.avatar || store.moodEmoji }}
      </view>
      <text class="nickname">{{ store.userInfo?.nickname || '旅行者' }}</text>
      <view class="mood-status" :style="{ background: theme.primary }">
        {{ store.moodLabelCN }} · {{ theme.name }}
      </view>
    </view>

    <!-- 当前状态 -->
    <view class="section">
      <view class="section-title">📊 当前旅行状态</view>
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value" :style="{ color: theme.primary }">{{ store.moodEmoji }}</text>
          <text class="stat-label">心情</text>
        </view>
        <view class="stat-card">
          <text class="stat-value" :style="{ color: theme.primary }">¥{{ store.budget }}</text>
          <text class="stat-label">预算</text>
        </view>
        <view class="stat-card">
          <text class="stat-value" :style="{ color: theme.primary }">{{ store.companionCount }}</text>
          <text class="stat-label">同行人数</text>
        </view>
        <view class="stat-card">
          <text class="stat-value" :style="{ color: theme.primary }">{{ store.destination }}</text>
          <text class="stat-label">目的地</text>
        </view>
      </view>
    </view>

    <!-- 设置面板 -->
    <view class="section">
      <view class="section-title">⚙️ 偏好设置</view>
      <view class="setting-list">
        <view class="setting-row" v-for="s in settings" :key="s.key">
          <view class="setting-left">
            <text class="setting-icon">{{ s.icon }}</text>
            <text class="setting-name">{{ s.name }}</text>
          </view>
          <view class="setting-right">
            <text class="setting-value" :style="{ color: s.active ? theme.primary : '' }">{{ s.value }}</text>
            <text class="setting-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 主题预览 -->
    <view class="section">
      <view class="section-title">🎨 当前主题</view>
      <view class="theme-preview">
        <view class="theme-bar" :style="{ background: theme.primary }" />
        <view class="theme-info">
          <text class="theme-name">{{ theme.name }}</text>
          <text class="theme-desc">心情「{{ store.moodLabelCN }}」自动匹配</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <button v-if="store.isLoggedIn" class="logout-btn" @click="handleLogout">
      <text>退出登录</text>
    </button>

    <!-- 重置按钮 -->
    <button class="reset-btn" @click="store.reset()">
      <text>🔄 重置所有状态</text>
    </button>

    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useTravelStore } from '@/store/travel.js'

const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 30%)`
})

const settings = computed(() => [
  { key: 'diet', icon: '🥗', name: '正在减肥', value: store.isDieting ? '已开启' : '已关闭', active: store.isDieting },
  { key: 'budget', icon: '💰', name: '预算敏感', value: store.budgetSensitive ? '已开启' : '已关闭', active: store.budgetSensitive },
  { key: 'kids', icon: '�', name: '同行儿童', value: store.hasKids ? '有' : '无', active: store.hasKids },
  { key: 'elderly', icon: '👴', name: '同行老人', value: store.hasElderly ? '有' : '无', active: store.hasElderly },
  { key: 'companion', icon: '👥', name: '同行人数', value: store.companionCount + '人', active: store.companionCount > 1 },
  { key: 'budgetval', icon: '💳', name: '预算设置', value: '¥' + store.budget, active: true }
])

function handleLogout() {
  store.logout()
  uni.reLaunch({ url: '/pages/login/login' })
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  padding: 0 32rpx;
  transition: background 0.5s ease;
}
.header {
  padding: 88rpx 0 32rpx;
  display: flex; flex-direction: column; align-items: center; gap: 16rpx;
}
.avatar-large {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 60rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06);
  transition: background 0.5s;
}
.nickname { font-size: 32rpx; font-weight: 700; color: var(--color-text) }
.mood-status {
  padding: 8rpx 24rpx; border-radius: 20rpx;
  font-size: 22rpx; font-weight: 600; color: #fff;
  transition: background 0.5s;
}
.section { margin-bottom: 32rpx }
.section-title { font-size: 28rpx; font-weight: 700; margin-bottom: 16rpx }

/* 统计卡片 */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx }
.stat-card {
  background: var(--color-card); border-radius: var(--radius);
  padding: 24rpx; text-align: center;
}
.stat-value { font-size: 36rpx; font-weight: 700; display: block; transition: color 0.5s }
.stat-label { font-size: 22rpx; color: var(--color-text-light); margin-top: 8rpx; display: block }

/* 设置列表 */
.setting-list { background: var(--color-card); border-radius: var(--radius); overflow: hidden }
.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx; border-bottom: 1rpx solid #F0EDE8;
}
.setting-row:last-child { border-bottom: none }
.setting-left { display: flex; align-items: center; gap: 12rpx }
.setting-icon { font-size: 28rpx }
.setting-name { font-size: 26rpx; font-weight: 600; color: var(--color-text) }
.setting-right { display: flex; align-items: center; gap: 8rpx }
.setting-value { font-size: 24rpx; transition: color 0.5s }
.setting-arrow { font-size: 32rpx; color: #D0CCC4 }

/* 主题预览 */
.theme-preview {
  background: var(--color-card);
  border-radius: var(--radius);
  overflow: hidden;
}
.theme-bar {
  height: 8rpx;
  transition: background 0.5s;
}
.theme-info {
  padding: 20rpx 24rpx;
}
.theme-name { font-size: 28rpx; font-weight: 700; color: var(--color-text); display: block }
.theme-desc { font-size: 22rpx; color: var(--color-text-light); margin-top: 4rpx; display: block }

/* 按钮 */
.logout-btn {
  margin-bottom: 20rpx;
  width: 100%; height: 88rpx;
  background: rgba(196,136,136,0.1);
  border-radius: 44rpx; border: 2rpx solid rgba(196,136,136,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: #C48888;
}
.reset-btn {
  margin-bottom: 20rpx;
  width: 100%; height: 88rpx;
  background: var(--color-card); border-radius: 44rpx; border: 2rpx solid #E0DCD4;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: var(--color-text-light);
}
.reset-btn:active { background: #F5F0EB }
.safe-bottom { height: 40rpx }
</style>