<template>
  <div class="detail-page" :style="{ background: pageBg }">
    <!-- ============================================================ -->
    <!-- 全屏头图（40vh）+ 渐变遮罩 -->
    <!-- ============================================================ -->
    <div class="hero-section">
      <div class="hero-image">
        <img :src="spot.imageUrl" :alt="spot.title" />
        <div class="hero-gradient" />
      </div>
      <!-- 返回按钮 -->
      <button class="back-btn glass-card" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <!-- 图片上的标题 -->
      <div class="hero-title-wrap">
        <h1 class="hero-title">{{ spot.title }}</h1>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 主体内容区 -->
    <!-- ============================================================ -->
    <div class="detail-body">
      <!-- 情绪标签胶囊 -->
      <div class="capsule-row">
        <span
          v-for="capsule in emotionCapsules"
          :key="capsule.label"
          class="capsule"
          :style="{ background: capsule.color + '18', color: capsule.color, borderColor: capsule.color + '30' }"
        >
          <span class="capsule-icon">{{ capsule.icon }}</span>
          <span class="capsule-label">{{ capsule.label }}</span>
        </span>
      </div>

      <!-- 情绪文案 -->
      <div class="description-block">

      <!-- ============================================================ -->
      <!-- 认证信息模块（仅认证商家显示） -->
      <!-- ============================================================ -->
      <div v-if="spot.isCertified" class="cert-section">
        <div class="cert-header">
          <span class="cert-header-icon">🛡️</span>
          <div class="cert-header-info">
            <span class="cert-header-title">认证商家</span>
            <span class="cert-header-level" :class="certLevelClass(spot.certifiedLevel)">
              {{ spot.certifiedLevel }}
            </span>
          </div>
        </div>
        <div class="cert-number-row">
          <span class="cert-number-label">认证编号</span>
          <span class="cert-number-value">{{ spot.certificationNumber }}</span>
        </div>
        <div class="cert-number-row">
          <span class="cert-number-label">认证时间</span>
          <span class="cert-number-value">{{ spot.certifiedSince }}</span>
        </div>
        <div class="cert-standards">
          <span class="cert-standards-label">认证标准</span>
          <div class="cert-standards-list">
            <div
              v-for="std in certifiedStandards"
              :key="std.id"
              class="cert-standard-item"
            >
              <span class="cert-standard-icon">{{ std.icon }}</span>
              <div class="cert-standard-info">
                <span class="cert-standard-name">{{ std.name }}</span>
                <span class="cert-standard-desc">{{ std.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- 情绪文案 -->
      <div class="description-block">
        <p class="description-text">{{ spot.description }}</p>
      </div>

      <!-- 分隔线 -->
      <div class="divider" />

      <!-- 地点小贴士 -->
      <div class="tips-block">
        <div class="tips-title">
          <span class="tips-icon">💡</span>
          <span>小贴士</span>
        </div>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-dot" :style="{ background: theme.primary }" />
            <span>最佳到访时间：{{ bestTime }}</span>
          </div>
          <div class="tip-item">
            <span class="tip-dot" :style="{ background: theme.primary }" />
            <span>建议停留：{{ stayDuration }}</span>
          </div>
          <div class="tip-item">
            <span class="tip-dot" :style="{ background: theme.primary }" />
            <span>能量消耗：{{ energyLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部占位（防止被悬浮栏遮挡） -->
    <div class="bottom-spacer" />

    <!-- ============================================================ -->
    <!-- 底部悬浮操作栏 — 毛玻璃 + 顶部细边框 -->
    <!-- ============================================================ -->
    <div class="bottom-bar">
      <button
        class="action-btn"
        :class="{ 'breathing': !toastVisible }"
        :style="{ background: btnGradient }"
        @click="onAddToPlan"
      >
        <span class="action-btn-text">{{ store.elderlyMode ? '一键前往' : '加入我的回血计划' }}</span>
        <span class="action-btn-sparkle">✨</span>
      </button>
    </div>

    <!-- ============================================================ -->
    <!-- Toast 提示 — 从底部滑出 -->
    <!-- ============================================================ -->
    <Transition name="toast">
      <div v-if="toastVisible" class="toast" :style="{ background: toastBg }">
        <span class="toast-icon">🍵</span>
        <span class="toast-text">已为你保留靠窗的安静位置</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import { travelSpots } from '@/data/travelData.js'
import { CERTIFIED_MERCHANTS, getStandardById } from '@/data/certifiedData.js'

const router = useRouter()
const route = useRoute()
const store = useTravelStore()

const theme = computed(() => store.activeTheme)
const toastVisible = ref(false)

// 根据路由 id 查找对应地点（先从认证商家查找，再查普通地点）
const spot = computed(() => {
  const id = route.params.id
  const certified = CERTIFIED_MERCHANTS.find(m => m.id === id)
  if (certified) {
    return {
      ...certified,
      tags: certified.tags || [],
      energyLevel: 30,
      description: certified.description,
      isFromCertified: true
    }
  }
  return travelSpots.find(s => s.id === id) || {
    id: 'unknown',
    title: '未知地点',
    tags: [],
    energyLevel: 50,
    description: '抱歉，找不到这个地点。',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fm=webp'
  }
})

// 认证标准详情
const certifiedStandards = computed(() => {
  if (!spot.value.isCertified || !spot.value.certifiedStandards) return []
  return spot.value.certifiedStandards.map(id => getStandardById(id)).filter(Boolean)
})

// 标签 → 情绪胶囊映射
const TAG_CAPSULE_MAP = {
  '躺平':   { icon: '🛋️', label: '适合发呆',   color: '#B5A3C4' },
  '回血':   { icon: '🔋', label: '能量回血',   color: '#8BA88C' },
  '安静':   { icon: '🤫', label: '社恐友好',   color: '#A3B5A6' },
  '放松':   { icon: '🧘', label: '深度放松',   color: '#6B8FA3' },
  '按摩':   { icon: '💆', label: '舒缓身心',   color: '#C4A8A8' },
  '疗愈':   { icon: '🌿', label: '自然疗愈',   color: '#8BA88C' },
  '治愈':   { icon: '💚', label: '温柔治愈',   color: '#B5A3C4' },
  '独处':   { icon: '🚶', label: '独自漫步',   color: '#A3B5A6' },
  '自然':   { icon: '🌲', label: '拥抱自然',   color: '#8BA88C' },
  '慢生活': { icon: '🍵', label: '慢下来',     color: '#6B8FA3' },
  '萌宠':   { icon: '🐱', label: '猫咪陪伴',   color: '#E8945A' },
  '咖啡':   { icon: '☕', label: '手冲咖啡',   color: '#C4A8A8' },
  '浪漫':   { icon: '💕', label: '浪漫时刻',   color: '#E8945A' },
  '美景':   { icon: '🌅', label: '绝美风景',   color: '#E8945A' },
  '创造':   { icon: '🎨', label: '自由创作',   color: '#B5A3C4' },
}

const emotionCapsules = computed(() => {
  return spot.value.tags
    .map(tag => TAG_CAPSULE_MAP[tag] || null)
    .filter(Boolean)
})

// 小贴士数据
const bestTime = computed(() => {
  const map = {
    'spot-001': '工作日下午，人少安静',
    'spot-002': '傍晚时分，放松后好入眠',
    'spot-003': '午后到傍晚，光线最美',
    'spot-004': '清晨日出时分，空气最清新',
    'spot-005': '细雨蒙蒙的午后，最有江南韵味',
    'spot-006': '慵懒的下午，猫咪最活跃',
    'spot-007': '日落前半小时，金色时刻',
    'spot-008': '周末下午，给自己一段安静时光',
  }
  return map[spot.value.id] || '任何想放松的时刻'
})

const stayDuration = computed(() => {
  const map = {
    'spot-001': '2-3 小时',
    'spot-002': '1-1.5 小时',
    'spot-003': '2-4 小时',
    'spot-004': '1-2 小时',
    'spot-005': '1-3 小时',
    'spot-006': '1-2 小时',
    'spot-007': '30 分钟 - 1 小时',
    'spot-008': '2-3 小时',
  }
  return map[spot.value.id] || '1-2 小时'
})

const energyLabel = computed(() => {
  const e = spot.value.energyLevel
  if (e <= 15) return '🛋️ 极低消耗 · 躺平级'
  if (e <= 30) return '🧘 低消耗 · 放松级'
  if (e <= 50) return '🚶 中等消耗 · 漫步级'
  return '🥾 较高消耗 · 探索级'
})

// 页面背景色
const pageBg = computed(() => theme.value.bg)

// 按钮渐变
const btnGradient = computed(() =>
  `linear-gradient(135deg, ${theme.value.primaryLight}, ${theme.value.primary})`
)

// Toast 背景
const toastBg = computed(() =>
  `linear-gradient(135deg, ${theme.value.bg}, #FFFCF8)`
)

function goBack() {
  router.back()
}

function onAddToPlan() {
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

function certLevelClass(level) {
  if (level === '钻石认证') return 'diamond'
  if (level === '金牌认证') return 'gold'
  return 'silver'
}
</script>

<style scoped>
/* ============================================================
   页面容器
   ============================================================ */
.detail-page {
  min-height: 100vh;
  transition: background 0.5s ease;
}

/* ============================================================
   全屏头图（40vh）+ 渐变遮罩
   ============================================================ */
.hero-section {
  position: relative;
  height: 40vh;
  min-height: 240px;
  overflow: hidden;
}

[data-accessibility="elderly"] .hero-section {
  height: 50vh;
  min-height: 320px;
}

.hero-image {
  position: absolute;
  inset: 0;
}

.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 渐变遮罩：从透明到白色，让文字自然融入 */
.hero-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255,255,255,0.15) 30%,
    rgba(255,255,255,0.5) 55%,
    rgba(255,255,255,0.85) 75%,
    #fff 100%
  );
  pointer-events: none;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 44px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  background: rgba(255,255,255,0.88);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

@media (min-width: 768px) {
  .back-btn {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

[data-accessibility="elderly"] .back-btn {
  width: 48px;
  height: 48px;
  top: 44px;
  left: 20px;
}

.back-arrow {
  font-size: 18px;
  color: #555;
  font-weight: 600;
}

[data-accessibility="elderly"] .back-arrow {
  font-size: 24px;
}

/* 图片上的标题 */
.hero-title-wrap {
  position: absolute;
  bottom: 24px;
  left: 20px;
  right: 20px;
  z-index: 5;
}

[data-accessibility="elderly"] .hero-title-wrap {
  bottom: 32px;
  left: 24px;
  right: 24px;
}

.hero-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #2C2C2C;
  letter-spacing: 0.5px;
  line-height: 1.3;
  text-shadow: 0 1px 4px rgba(255,255,255,0.6);
}

[data-accessibility="elderly"] .hero-title {
  font-size: 36px;
}

/* ============================================================
   主体内容区
   ============================================================ */
.detail-body {
  padding: 0 20px;
}

/* ============================================================
   情绪标签胶囊
   ============================================================ */
.capsule-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 28px;
}

.capsule {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 600;
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.capsule:active {
  transform: scale(0.96);
}

[data-accessibility="elderly"] .capsule {
  font-size: 16px;
  padding: 10px 20px;
  border-radius: 24px;
  gap: 8px;
}

.capsule-icon {
  font-size: 15px;
  line-height: 1;
}

[data-accessibility="elderly"] .capsule-icon {
  font-size: 20px;
}

.capsule-label {
  white-space: nowrap;
}

/* ============================================================
   情绪文案排版
   ============================================================ */
.description-block {
  margin-bottom: 28px;
}

.description-text {
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  color: #555;
  line-height: 1.8;
  letter-spacing: 0.3px;
}

[data-accessibility="elderly"] .description-text {
  font-size: 22px;
  line-height: 2;
}

/* ============================================================
   分隔线
   ============================================================ */
.divider {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    #E0DCD4 20%,
    #E0DCD4 80%,
    transparent 100%
  );
  margin: 0 0 24px;
}

/* ============================================================
   地点小贴士
   ============================================================ */
.tips-block {
  margin-bottom: 24px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
}

[data-accessibility="elderly"] .tips-title {
  font-size: 18px;
}

.tips-icon {
  font-size: 16px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(0,0,0,0.02);
  border-radius: 10px;
  font-size: 13px;
  color: #666;
  font-weight: 400;
}

[data-accessibility="elderly"] .tip-item {
  font-size: 16px;
  padding: 14px 16px;
}

.tip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.5s;
}

[data-accessibility="elderly"] .tip-dot {
  width: 8px;
  height: 8px;
}

/* ============================================================
   底部占位
   ============================================================ */
.bottom-spacer {
  height: 100px;
}

[data-accessibility="elderly"] .bottom-spacer {
  height: 130px;
}

/* ============================================================
   底部悬浮操作栏 — 毛玻璃 + 顶部细边框
   ============================================================ */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: rgba(255,255,255,0.88);
  border-top: 0.5px solid rgba(0,0,0,0.06);
  display: flex;
  justify-content: center;
  z-index: 50;
}

@media (min-width: 768px) {
  .bottom-bar {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
}

[data-accessibility="elderly"] .bottom-bar {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-top: 1px solid rgba(0,0,0,0.1);
  padding: 16px 24px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

/* 操作按钮 */
.action-btn {
  width: 80%;
  max-width: 360px;
  height: 50px;
  border-radius: 25px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.action-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

[data-accessibility="elderly"] .action-btn {
  height: 60px;
  border-radius: 30px;
  font-size: 18px;
  max-width: 420px;
}

/* 呼吸感缩放动画 */
.action-btn.breathing {
  animation: breathe-scale 3s ease-in-out infinite;
}

@keyframes breathe-scale {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}

.action-btn-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

[data-accessibility="elderly"] .action-btn-text {
  font-size: 20px;
}

.action-btn-sparkle {
  font-size: 16px;
}

[data-accessibility="elderly"] .action-btn-sparkle {
  font-size: 20px;
}

/* ============================================================
   Toast 提示 — 从底部滑出
   ============================================================ */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 60;
  white-space: nowrap;
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(0,0,0,0.04);
}

@media (min-width: 768px) {
  .toast {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

[data-accessibility="elderly"] .toast {
  bottom: 130px;
  padding: 16px 28px;
  border-radius: 14px;
}

.toast-icon {
  font-size: 20px;
  line-height: 1;
}

[data-accessibility="elderly"] .toast-icon {
  font-size: 24px;
}

.toast-text {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

[data-accessibility="elderly"] .toast-text {
  font-size: 18px;
}

/* Toast 过渡动画 */
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* ============================================================
   认证信息模块
   ============================================================ */
.cert-section {
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #F8FFF0, #F2FDE8);
  border-radius: 14px;
  border: 1px solid #8BA88C20;
}

.cert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.cert-header-icon {
  font-size: 24px;
}

.cert-header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cert-header-title {
  font-size: 15px;
  font-weight: 700;
  color: #2C2C2C;
}

.cert-header-level {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
  width: fit-content;
  color: #fff;
}

.cert-header-level.diamond {
  background: linear-gradient(135deg, #B8C4F8, #8E9FE6);
}

.cert-header-level.gold {
  background: linear-gradient(135deg, #D4A84B, #C4943A);
}

.cert-header-level.silver {
  background: linear-gradient(135deg, #A8B8A8, #8BA88C);
}

.cert-number-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.cert-number-label {
  font-size: 12px;
  color: #8A8A8A;
}

.cert-number-value {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  font-family: monospace;
}

.cert-standards {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #8BA88C20;
}

.cert-standards-label {
  font-size: 12px;
  font-weight: 700;
  color: #6B8E6C;
  display: block;
  margin-bottom: 8px;
}

.cert-standards-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cert-standard-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
}

.cert-standard-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.cert-standard-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cert-standard-name {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.cert-standard-desc {
  font-size: 11px;
  color: #9A9A9A;
  line-height: 1.4;
}
</style>