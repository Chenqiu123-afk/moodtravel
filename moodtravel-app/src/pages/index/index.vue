<template>
  <view class="home-page" :style="{ background: gradientBg }">
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-left">
        <text class="logo-text" :style="{ color: theme.primary }">MoodTravel</text>
      </view>
      <view class="nav-right" @click="goToMine">
        <view class="avatar" :style="{ background: theme.primaryLight + '30' }">
          {{ store.moodEmoji }}
        </view>
      </view>
    </view>

    <!-- 心情问候 -->
    <view class="greeting">
      <text class="greeting-text">嗨，今天想去哪里？</text>
      <text class="greeting-sub">{{ store.moodDescription }}</text>
      <view class="theme-badge" :style="{ background: theme.primary + '20', color: theme.primary }">
        {{ theme.name }}主题
      </view>
    </view>

    <!-- 心情选择器 -->
    <view class="section">
      <view class="section-title">
        <text class="title-icon">😊</text>
        <text class="title-text">此刻的心情？</text>
        <text class="title-hint">选择心情，自动切换主题色</text>
      </view>
      <view class="mood-grid">
        <view
          v-for="mood in moods"
          :key="mood.key"
          class="mood-item"
          :class="{ active: store.moodLabel === mood.key }"
          :style="moodItemStyle(mood)"
          @click="selectMood(mood)"
        >
          <text class="mood-emoji">{{ mood.emoji }}</text>
          <text class="mood-label">{{ mood.label }}</text>
          <text class="mood-hint">{{ mood.hint }}</text>
          <view class="mood-theme-dot" :style="{ background: mood.themeColor }" />
          <view v-if="store.moodLabel === mood.key" class="mood-check">✓</view>
        </view>
      </view>
    </view>

    <!-- 快捷设置 -->
    <view class="section">
      <view class="section-title">
        <text class="title-icon">⚙️</text>
        <text class="title-text">快速设置</text>
      </view>
      <view class="toggle-group">
        <view class="toggle-row" @click="store.toggleSetting('diet')">
          <view class="toggle-left">
            <view class="toggle-icon" :style="{ background: theme.primary + '15' }">🥗</view>
            <view class="toggle-info">
              <text class="toggle-name">正在减肥</text>
              <text class="toggle-hint">推荐低卡健康餐食</text>
            </view>
          </view>
          <switch :checked="store.isDieting" :color="theme.primary" />
        </view>
        <view class="toggle-row" @click="store.toggleSetting('budget')">
          <view class="toggle-left">
            <view class="toggle-icon" :style="{ background: theme.primary + '15' }">💰</view>
            <view class="toggle-info">
              <text class="toggle-name">预算敏感</text>
              <text class="toggle-hint">优先免费低价景点</text>
            </view>
          </view>
          <switch :checked="store.budgetSensitive" :color="theme.primary" />
        </view>
        <!-- 同行人入口 -->
        <view class="toggle-row" @click="openCompanionPopup">
          <view class="toggle-left">
            <view class="toggle-icon" :style="{ background: theme.primary + '15' }">�</view>
            <view class="toggle-info">
              <text class="toggle-name">同行人设置</text>
              <text class="toggle-hint">{{ companionSummary }}</text>
            </view>
          </view>
          <text class="toggle-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 开始规划按钮 -->
    <button class="plan-btn" :style="planBtnStyle" @click="startPlan">
      <text class="plan-btn-text">✨ 开始规划</text>
    </button>

    <!-- 旅程预览 -->
    <view class="preview-section" v-if="store.itinerary">
      <view class="section-title">
        <text class="title-icon">📋</text>
        <text class="title-text">最近行程</text>
      </view>
      <view class="preview-card" @click="goToPlan">
        <view class="preview-header">
          <text class="preview-dest">{{ store.destination }}</text>
          <text class="preview-days">{{ store.days }}天行程</text>
        </view>
        <view class="preview-stats">
          <text>预算 ¥{{ store.budget }} · {{ store.companionCount }}人同行</text>
        </view>
      </view>
    </view>

    <!-- 同行人设置弹窗 -->
    <view class="popup-overlay" v-if="store.showCompanionPopup" @click="closeCompanionPopup">
      <view class="popup-sheet" @click.stop :style="{ background: popupBg }">
        <view class="popup-handle" />
        <view class="popup-header">
          <text class="popup-title">👥 同行人设置</text>
          <text class="popup-close" @click="closeCompanionPopup">✕</text>
        </view>
        <view class="popup-body">
          <text class="popup-desc">添加同行人，AI 将据此优化景点和酒店推荐</text>

          <!-- 已有同行人列表 -->
          <view class="companion-list">
            <view
              v-for="(c, idx) in store.companions"
              :key="idx"
              class="companion-item"
            >
              <view class="companion-avatar" :style="{ background: theme.primary + '20' }">
                <text>{{ roleEmoji(c.role) }}</text>
              </view>
              <view class="companion-info">
                <text class="companion-name">{{ c.name }}</text>
                <text class="companion-detail">{{ roleLabel(c.role) }} · {{ c.age }}岁</text>
              </view>
              <view class="companion-actions">
                <picker
                  mode="selector"
                  :range="roleOptions"
                  @change="(e) => changeRole(idx, e.detail.value)"
                >
                  <text class="companion-edit">身份</text>
                </picker>
                <text
                  v-if="idx > 0"
                  class="companion-remove"
                  @click="store.removeCompanion(idx)"
                >移除</text>
              </view>
            </view>
          </view>

          <!-- 快捷添加按钮 -->
          <view class="add-buttons">
            <view class="add-btn" @click="quickAdd('child')" :style="{ borderColor: theme.primary }">
              <text class="add-btn-icon">👶</text>
              <text class="add-btn-text">带小孩</text>
            </view>
            <view class="add-btn" @click="quickAdd('elderly')" :style="{ borderColor: theme.primary }">
              <text class="add-btn-icon">👴</text>
              <text class="add-btn-text">带老人</text>
            </view>
            <view class="add-btn" @click="quickAdd('friend')" :style="{ borderColor: theme.primary }">
              <text class="add-btn-icon">🙋</text>
              <text class="add-btn-text">加朋友</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-confirm-btn" :style="{ background: theme.primary }" @click="closeCompanionPopup">
            <text>确认 ({{ store.companionCount }}人)</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 底部安全区 -->
    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTravelStore } from '@/store/travel.js'

const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 30%)`
})

const popupBg = computed(() => {
  return `linear-gradient(180deg, ${theme.value.bg} 0%, #FFFCF8 100%)`
})

const planBtnStyle = computed(() => ({
  background: `linear-gradient(135deg, ${theme.value.primaryLight}, ${theme.value.primary})`,
  boxShadow: `0 12rpx 32rpx ${theme.value.primary}40`
}))

const companionSummary = computed(() => {
  const count = store.companionCount
  const parts = []
  if (store.hasKids) parts.push('含儿童')
  if (store.hasElderly) parts.push('含老人')
  if (count === 1) return '独自出行'
  return `${count}人同行` + (parts.length ? ' · ' + parts.join('·') : '')
})

const moods = [
  { key: 'tired', label: '疲惫', emoji: '�', hint: '放慢节奏', index: 2, themeColor: '#6B8FA3', themeName: '静谧蓝' },
  { key: 'excited', label: '兴奋', emoji: '🤩', hint: '精彩不停', index: 9, themeColor: '#E8945A', themeName: '活力橙' },
  { key: 'happy', label: '开心', emoji: '�', hint: '活力满满', index: 8, themeColor: '#8BA88C', themeName: '暖阳绿' },
  { key: 'calm', label: '平静', emoji: '�', hint: '顺其自然', index: 5, themeColor: '#A3B5A6', themeName: '莫兰迪绿' },
  { key: 'anxious', label: '焦虑', emoji: '�', hint: '需要治愈', index: 3, themeColor: '#B5A3C4', themeName: '薰衣草紫' },
  { key: 'sad', label: '低落', emoji: '😢', hint: '温柔对待', index: 2, themeColor: '#C4A8A8', themeName: '柔雾粉' }
]

const roleOptions = ['自己', '朋友', '小孩', '老人']
const roleMap = ['self', 'friend', 'child', 'elderly']

function moodItemStyle(mood) {
  if (store.moodLabel === mood.key) {
    return {
      borderColor: mood.themeColor,
      background: mood.themeColor + '15',
      boxShadow: `0 0 0 6rpx ${mood.themeColor}18`
    }
  }
  return {}
}

function selectMood(mood) {
  store.setMood(mood.key, mood.index, mood.emoji)
}

function roleEmoji(role) {
  const map = { self: '😊', friend: '🙋', child: '👶', elderly: '👴' }
  return map[role] || '🙋'
}

function roleLabel(role) {
  const map = { self: '自己', friend: '朋友', child: '小孩', elderly: '老人' }
  return map[role] || '同行者'
}

function openCompanionPopup() {
  store.showCompanionPopup = true
}

function closeCompanionPopup() {
  store.showCompanionPopup = false
}

function quickAdd(role) {
  const ageMap = { child: 5, elderly: 65, friend: 25 }
  store.addCompanion(role, ageMap[role])
}

function changeRole(idx, value) {
  const newRole = roleMap[value]
  const ageMap = { self: 28, friend: 25, child: 5, elderly: 65 }
  store.updateCompanion(idx, { role: newRole, age: ageMap[newRole] })
}

function startPlan() {
  uni.switchTab({ url: '/pages/plan/plan' })
}

function goToPlan() {
  uni.switchTab({ url: '/pages/plan/plan' })
}

function goToMine() {
  uni.switchTab({ url: '/pages/mine/mine' })
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 0 32rpx;
  transition: background 0.5s ease;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 88rpx 0 32rpx;
}
.logo-text {
  font-size: 36rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
  transition: color 0.5s;
}
.avatar {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,.06);
  transition: background 0.5s;
}

/* 问候 */
.greeting {
  padding: 16rpx 0 40rpx;
}
.greeting-text {
  font-size: 44rpx; font-weight: 800;
  color: var(--color-text);
  display: block;
}
.greeting-sub {
  font-size: 26rpx; color: var(--color-text-light);
  margin-top: 8rpx; display: block;
}
.theme-badge {
  display: inline-block;
  margin-top: 12rpx;
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 600;
  transition: all 0.5s;
}

/* 通用区块 */
.section {
  margin-bottom: 32rpx;
}
.section-title {
  display: flex; align-items: center; gap: 12rpx;
  margin-bottom: 20rpx;
}
.title-icon { font-size: 32rpx }
.title-text { font-size: 30rpx; font-weight: 700; color: var(--color-text) }
.title-hint { font-size: 22rpx; color: var(--color-text-light); margin-left: auto }

/* 心情选择器 */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}
.mood-item {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24rpx 16rpx;
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  border: 2rpx solid transparent;
  position: relative; overflow: hidden;
  transition: all 0.3s;
}
.mood-item:active { transform: scale(.96) }
.mood-emoji { font-size: 52rpx; line-height: 1 }
.mood-label { font-size: 26rpx; font-weight: 700; color: var(--color-text) }
.mood-hint { font-size: 20rpx; color: var(--color-text-light) }
.mood-theme-dot {
  width: 12rpx; height: 12rpx;
  border-radius: 50%;
  position: absolute;
  top: 12rpx; right: 12rpx;
}
.mood-check {
  position: absolute; top: 8rpx; right: 8rpx;
  width: 36rpx; height: 36rpx; border-radius: 50%;
  background: var(--theme-primary); color: #fff;
  font-size: 20rpx; display: flex; align-items: center; justify-content: center;
  transition: background 0.5s;
}

/* 开关组 */
.toggle-group {
  display: flex; flex-direction: column; gap: 12rpx;
}
.toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20rpx 24rpx; background: var(--color-card);
  border-radius: var(--radius);
}
.toggle-left {
  display: flex; align-items: center; gap: 16rpx;
}
.toggle-icon {
  width: 72rpx; height: 72rpx; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx;
  transition: background 0.5s;
}
.toggle-name { font-size: 28rpx; font-weight: 600; color: var(--color-text); display: block }
.toggle-hint { font-size: 22rpx; color: var(--color-text-light); margin-top: 4rpx; display: block }
.toggle-arrow { font-size: 36rpx; color: #D0CCC4 }

/* 规划按钮 */
.plan-btn {
  margin: 40rpx 0;
  width: 100%; height: 96rpx;
  border-radius: 48rpx;
  border: none;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.plan-btn:active { transform: scale(.97); opacity: .9 }
.plan-btn-text {
  font-size: 32rpx; font-weight: 700; color: #fff;
}

/* 行程预览 */
.preview-section {
  margin-bottom: 32rpx;
}
.preview-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,.03);
}
.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8rpx;
}
.preview-dest { font-size: 28rpx; font-weight: 700; color: var(--color-text) }
.preview-days { font-size: 24rpx; color: var(--theme-primary); font-weight: 600 }
.preview-stats { font-size: 22rpx; color: var(--color-text-light) }

/* ===== 同行人弹窗 ===== */
.popup-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex; align-items: flex-end;
  animation: fadeIn 0.25s;
}
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}
.popup-sheet {
  width: 100%;
  border-radius: 40rpx 40rpx 0 0;
  padding: 0 32rpx 32rpx;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%) }
  to { transform: translateY(0) }
}
.popup-handle {
  width: 64rpx; height: 6rpx;
  background: #D0CCC4;
  border-radius: 3rpx;
  margin: 16rpx auto 24rpx;
}
.popup-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8rpx;
}
.popup-title {
  font-size: 32rpx; font-weight: 700; color: var(--color-text);
}
.popup-close {
  width: 48rpx; height: 48rpx;
  border-radius: 50%;
  background: rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: var(--color-text-light);
}
.popup-desc {
  font-size: 24rpx; color: var(--color-text-light);
  margin-bottom: 24rpx; display: block;
}

/* 同行人列表 */
.companion-list {
  display: flex; flex-direction: column; gap: 12rpx;
  margin-bottom: 24rpx;
}
.companion-item {
  display: flex; align-items: center; gap: 16rpx;
  padding: 16rpx;
  background: rgba(0,0,0,0.02);
  border-radius: var(--radius);
}
.companion-avatar {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx;
  transition: background 0.5s;
}
.companion-info { flex: 1 }
.companion-name { font-size: 28rpx; font-weight: 600; color: var(--color-text); display: block }
.companion-detail { font-size: 22rpx; color: var(--color-text-light); margin-top: 4rpx; display: block }
.companion-actions {
  display: flex; gap: 16rpx;
}
.companion-edit, .companion-remove {
  font-size: 22rpx; padding: 6rpx 16rpx;
  border-radius: 20rpx;
}
.companion-edit {
  color: var(--theme-primary);
  background: var(--theme-primary) + '15';
  transition: all 0.5s;
}
.companion-remove {
  color: #C48888;
  background: rgba(196,136,136,0.1);
}

/* 添加快捷按钮 */
.add-buttons {
  display: flex; gap: 16rpx;
}
.add-btn {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  padding: 20rpx 12rpx;
  border: 2rpx dashed;
  border-radius: var(--radius);
  transition: all 0.2s;
}
.add-btn:active {
  transform: scale(0.95);
}
.add-btn-icon {
  font-size: 40rpx;
}
.add-btn-text {
  font-size: 22rpx; font-weight: 600; color: var(--color-text);
}

/* 弹窗底部 */
.popup-footer {
  margin-top: 32rpx;
}
.popup-confirm-btn {
  width: 100%; height: 88rpx;
  border-radius: 44rpx;
  border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700; color: #fff;
  transition: background 0.5s;
}
.popup-confirm-btn:active { transform: scale(.97) }

.safe-bottom { height: 40rpx }
</style>