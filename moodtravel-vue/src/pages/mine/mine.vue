<template>
  <div class="mine-page" :style="{ background: gradientBg }">
    <!-- 头部 -->
    <div class="header">
      <div class="avatar-large" :style="{ background: theme.primaryLight + '30' }">
        {{ store.userInfo?.avatar || store.moodEmoji }}
      </div>
      <span class="nickname">{{ store.userInfo?.nickname || '旅行者' }}</span>
      <div class="mood-status" :style="{ background: theme.primary }">
        {{ store.moodLabelCN }} · {{ theme.name }}
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 长辈关怀模式开关 -->
    <!-- ============================================================ -->
    <div class="section">
      <div class="elderly-toggle-card" :class="{ active: store.elderlyMode }">
        <div class="elderly-toggle-left">
          <div class="elderly-icon-wrap" :class="{ active: store.elderlyMode }">
            <span class="elderly-icon">{{ store.elderlyMode ? '👴' : '🧓' }}</span>
          </div>
          <div class="elderly-info">
            <span class="elderly-title">长辈关怀模式</span>
            <span class="elderly-desc">
              {{ store.elderlyMode ? '已开启 · 大字版、大按钮、更易读' : '更大字体、更易点击、更舒适' }}
            </span>
          </div>
        </div>
        <div class="elderly-toggle-right">
          <label class="elderly-switch">
            <input type="checkbox" :checked="store.elderlyMode" @change="store.toggleElderlyMode()" />
            <span class="elderly-switch-slider" :style="{ '--switch-color': theme.primary }">
              <span class="elderly-switch-knob" />
            </span>
          </label>
        </div>
      </div>
      <!-- 模式切换动画提示 -->
      <transition name="switch-hint">
        <div v-if="showHint" class="elderly-hint" :style="{ background: theme.primary + '12', color: theme.primary }">
          {{ store.elderlyMode ? '✓ 已切换至长辈模式，按钮更大、字体更清晰、动效更柔和' : '✓ 已切换至标准模式' }}
        </div>
      </transition>
    </div>

    <!-- 当前状态 -->
    <div class="section">
      <div class="section-title">📊 当前旅行状态</div>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value" :style="{ color: theme.primary }">{{ store.moodEmoji }}</span>
          <span class="stat-label">心情</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" :style="{ color: theme.primary }">¥{{ store.budget }}</span>
          <span class="stat-label">预算</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" :style="{ color: theme.primary }">{{ store.companionCount }}</span>
          <span class="stat-label">同行人数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" :style="{ color: theme.primary }">{{ store.destination }}</span>
          <span class="stat-label">目的地</span>
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="section">
      <div class="section-title">⚙️ 偏好设置</div>
      <div class="setting-list">
        <div class="setting-row" v-for="s in settings" :key="s.key">
          <div class="setting-left">
            <span class="setting-icon">{{ s.icon }}</span>
            <span class="setting-name">{{ s.name }}</span>
          </div>
          <div class="setting-right">
            <span class="setting-value" :style="{ color: s.active ? theme.primary : '' }">{{ s.value }}</span>
            <span class="setting-arrow">›</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pro 订阅入口 -->
    <div class="section">
      <div class="pro-entry glass-card" @click="goToPro">
        <div class="pro-entry-left">
          <span class="pro-entry-icon">🌟</span>
          <div class="pro-entry-info">
            <span class="pro-entry-title">MoodTravel Pro</span>
            <span class="pro-entry-desc" :style="{ color: theme.primary }">{{ proPlanName }}</span>
          </div>
        </div>
        <span class="pro-entry-arrow">›</span>
      </div>
    </div>

    <!-- 情绪记录 -->
    <div class="section">
      <div class="emotion-entry glass-card" @click="showEmotionModal = true">
        <div class="emotion-entry-left">
          <span class="emotion-entry-icon">📝</span>
          <div class="emotion-entry-info">
            <span class="emotion-entry-title">记录此刻情绪</span>
            <span class="emotion-entry-desc">记录你的心情，小旅会一直陪着你</span>
          </div>
        </div>
        <span class="emotion-entry-arrow">›</span>
      </div>
    </div>

    <!-- 合规页面入口 -->
    <div class="section">
      <div class="section-title">📋 合规与帮助</div>
      <div class="setting-list">
        <div class="setting-row" @click="goToAgreement">
          <div class="setting-left">
            <span class="setting-icon">📄</span>
            <span class="setting-name">用户协议</span>
          </div>
          <div class="setting-right">
            <span class="setting-arrow">›</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主题预览 -->
    <div class="section">
      <div class="section-title">🎨 当前主题</div>
      <div class="theme-preview">
        <div class="theme-bar" :style="{ background: theme.primary }" />
        <div class="theme-info">
          <span class="theme-name">{{ theme.name }}</span>
          <span class="theme-desc">心情「{{ store.moodLabelCN }}」自动匹配</span>
        </div>
      </div>
    </div>

    <!-- 退出登录 -->
    <button v-if="store.isLoggedIn" class="logout-btn" @click="handleLogout">
      退出登录
    </button>

    <!-- 重置按钮 -->
    <button class="reset-btn" @click="store.reset()">
      🔄 重置所有状态
    </button>

    <div class="safe-bottom" />

    <!-- 情绪记录弹窗 -->
    <EmotionRecordModal
      :visible="showEmotionModal"
      @close="showEmotionModal = false"
      @recorded="onEmotionRecorded"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import EmotionRecordModal from '@/components/EmotionRecordModal.vue'
import { getProPlan } from '@/data/merchantPackageData.js'

const store = useTravelStore()
const router = useRouter()
const theme = computed(() => store.activeTheme)

const showHint = ref(false)
const showEmotionModal = ref(false)

const proPlanName = computed(() => {
  const plan = getProPlan(store.proPlan)
  return plan ? plan.name : '免费版'
})

// 监听开关切换，显示提示
const originalToggle = store.toggleElderlyMode
store.toggleElderlyMode = () => {
  originalToggle()
  showHint.value = true
  setTimeout(() => { showHint.value = false }, 2500)
}

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 30%)`
})

const settings = computed(() => [
  { key: 'diet', icon: '🥗', name: '正在减肥', value: store.isDieting ? '已开启' : '已关闭', active: store.isDieting },
  { key: 'budget', icon: '💰', name: '预算敏感', value: store.budgetSensitive ? '已开启' : '已关闭', active: store.budgetSensitive },
  { key: 'kids', icon: '👶', name: '同行儿童', value: store.hasKids ? '有' : '无', active: store.hasKids },
  { key: 'elderly', icon: '👴', name: '同行老人', value: store.hasElderly ? '有' : '无', active: store.hasElderly },
  { key: 'companion', icon: '👥', name: '同行人数', value: store.companionCount + '人', active: store.companionCount > 1 },
  { key: 'budgetval', icon: '💳', name: '预算设置', value: '¥' + store.budget, active: true }
])

function handleLogout() {
  store.logout()
  router.replace('/login')
}

function goToPro() {
  router.push({ name: 'proSubscription' })
}

function goToAgreement() {
  router.push({ name: 'userAgreement' })
}

function onEmotionRecorded() {
  showEmotionModal.value = false
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}
.header {
  padding: 44px 0 16px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.avatar-large {
  width: 60px; height: 60px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,.06);
  transition: background 0.5s;
}
.nickname { font-size: 16px; font-weight: 700; color: var(--color-text) }
.mood-status {
  padding: 4px 12px; border-radius: 10px;
  font-size: 11px; font-weight: 600; color: #fff;
  transition: background 0.5s;
}

/* ===== 长辈关怀模式开关卡片 ===== */
.elderly-toggle-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px;
  background: var(--color-card);
  border-radius: 12px;
  border: 1.5px solid transparent;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.elderly-toggle-card.active {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 3px rgba(122, 158, 118, 0.08);
}
.elderly-toggle-left {
  display: flex; align-items: center; gap: 10px;
}
.elderly-icon-wrap {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: #F0EDE8;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.elderly-icon-wrap.active {
  background: var(--theme-primary);
  transform: scale(1.05);
}
.elderly-icon {
  font-size: 22px;
  transition: transform 0.3s;
}
.elderly-icon-wrap.active .elderly-icon {
  transform: scale(1.1);
}
.elderly-info {
  display: flex; flex-direction: column; gap: 2px;
}
.elderly-title {
  font-size: 15px; font-weight: 700; color: var(--color-text);
}
.elderly-desc {
  font-size: 11px; color: var(--color-text-light);
}

/* 自定义开关 */
.elderly-toggle-right {
  flex-shrink: 0;
}
.elderly-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}
.elderly-switch input {
  opacity: 0; width: 0; height: 0;
}
.elderly-switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #D0CCC4;
  border-radius: 28px;
  transition: background 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.elderly-switch-slider::before {
  content: "";
  position: absolute;
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 1px 3px rgba(0,0,0,.12);
}
.elderly-switch input:checked + .elderly-switch-slider {
  background-color: var(--switch-color, #7A9E76);
}
.elderly-switch input:checked + .elderly-switch-slider::before {
  transform: translateX(24px);
}

/* 提示条 */
.elderly-hint {
  margin-top: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 12px; font-weight: 600;
  text-align: center;
  transition: all 0.5s;
}
.switch-hint-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.switch-hint-leave-active {
  transition: all 0.3s ease-in;
}
.switch-hint-enter-from {
  opacity: 0; transform: translateY(-8px);
}
.switch-hint-leave-to {
  opacity: 0; transform: translateY(-4px);
}

/* ===== 通用区块 ===== */
.section { margin-bottom: 16px }
.section-title { font-size: 14px; font-weight: 700; margin-bottom: 8px }

/* 统计卡片 */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px }
.stat-card {
  background: var(--color-card); border-radius: 8px;
  padding: 12px; text-align: center;
}
.stat-value { font-size: 18px; font-weight: 700; display: block; transition: color 0.5s }
.stat-label { font-size: 11px; color: var(--color-text-light); margin-top: 4px; display: block }

/* 设置列表 */
.setting-list { background: var(--color-card); border-radius: 8px; overflow: hidden }
.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-bottom: 1px solid #F0EDE8;
}
.setting-row:last-child { border-bottom: none }
.setting-left { display: flex; align-items: center; gap: 6px }
.setting-icon { font-size: 14px }
.setting-name { font-size: 13px; font-weight: 600; color: var(--color-text) }
.setting-right { display: flex; align-items: center; gap: 4px }
.setting-value { font-size: 12px; transition: color 0.5s }
.setting-arrow { font-size: 16px; color: #D0CCC4 }

/* 主题预览 */
.theme-preview {
  background: var(--color-card);
  border-radius: 8px;
  overflow: hidden;
}
.theme-bar {
  height: 4px;
  transition: background 0.5s;
}
.theme-info {
  padding: 10px 12px;
}
.theme-name { font-size: 14px; font-weight: 700; color: var(--color-text); display: block }
.theme-desc { font-size: 11px; color: var(--color-text-light); margin-top: 2px; display: block }

/* 按钮 */
.logout-btn {
  margin-bottom: 10px;
  width: 100%; height: 44px;
  background: rgba(196,136,136,0.1);
  border-radius: 22px; border: 1px solid rgba(196,136,136,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #C48888;
  cursor: pointer;
}
.reset-btn {
  margin-bottom: 10px;
  width: 100%; height: 44px;
  background: var(--color-card); border-radius: 22px; border: 1px solid #E0DCD4;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: var(--color-text-light);
  cursor: pointer;
}
.reset-btn:active { background: #F5F0EB }
.safe-bottom { height: 20px }

/* ===== Pro 订阅入口 ===== */
.pro-entry, .emotion-entry {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px; border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.pro-entry:active, .emotion-entry:active { transform: scale(0.97); }

.pro-entry-left, .emotion-entry-left {
  display: flex; align-items: center; gap: 10px;
}

.pro-entry-icon, .emotion-entry-icon { font-size: 28px; line-height: 1; }

.pro-entry-info, .emotion-entry-info {
  display: flex; flex-direction: column; gap: 2px;
}

.pro-entry-title, .emotion-entry-title {
  font-size: 14px; font-weight: 700; color: var(--color-text);
}

.pro-entry-desc, .emotion-entry-desc {
  font-size: 11px; color: var(--color-text-light); font-weight: 400;
}

.pro-entry-arrow, .emotion-entry-arrow {
  font-size: 20px; color: #D0CCC4; font-weight: 300;
}
</style>