<template>
  <div class="page" :style="{ backgroundColor: bgColor }">
    <!-- ================================================================ -->
    <!-- 1. 能量状态滑块 (Mood Slider) -->
    <!-- ================================================================ -->
    <div class="slider-section">
      <div class="slider-header">
        <span class="slider-title">今天想怎么过？</span>
        <span class="slider-sub">拖动滑块，找到你的节奏</span>
      </div>

      <!-- 滑块本体 -->
      <div class="slider-wrap">
        <!-- 隐藏的原生 range -->
        <input
          type="range"
          class="slider-input"
          :value="moodValue"
          :min="0"
          :max="100"
          :step="1"
          @input="onSliderInput"
        />

        <!-- 视觉轨道 -->
        <div class="slider-track" />
        <div class="slider-fill" :style="{ width: moodValue + '%' }" />

        <!-- 视觉滑块圆点 -->
        <div class="slider-thumb" :style="{ left: 'calc(' + moodValue + '% - 15px)' }" />

        <!-- 数值气泡 -->
        <div class="slider-bubble" :style="{ left: 'calc(' + moodValue + '% - 20px)' }">
          {{ moodValue }}
        </div>
      </div>

      <!-- 标签 -->
      <div class="slider-labels">
        <span class="slider-label" :class="{ active: moodValue <= 20 }">🛋️ 躺平</span>
        <span class="slider-label-center">{{ moodLabel }}</span>
        <span class="slider-label" :class="{ active: moodValue >= 80 }">🗺️ 探索</span>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 2. 推荐卡片列表 (TransitionGroup + fade) -->
    <!-- ================================================================ -->
    <div class="cards-section">
      <div class="section-title">推荐活动</div>
      <TransitionGroup name="card-fade" tag="div" class="cards-grid">
        <div
          v-for="card in filteredCards"
          :key="card.id"
          class="card"
        >
          <span class="card-icon">{{ card.icon }}</span>
          <div class="card-info">
            <span class="card-name">{{ card.title }}</span>
            <span class="card-desc">{{ card.desc }}</span>
          </div>
          <div class="card-tags">
            <span
              v-for="tag in card.tags"
              :key="tag"
              class="card-tag"
              :class="tagClass(tag)"
            >{{ tag }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- ================================================================ -->
    <!-- 3. B计划卡片 (B-Plan Card) -->
    <!-- ================================================================ -->
    <!-- 右上角测试按钮 -->
    <button class="rain-test-btn" @click="triggerRain">
      {{ showBPlan ? '✕ 关闭' : '🌧️ 模拟下雨' }}
    </button>

    <Transition name="bplan-slide">
      <div v-if="showBPlan" class="bplan-overlay" @click.self="showBPlan = false">
        <div class="bplan-card">
          <div class="bplan-header">
            <span class="bplan-icon">🌧️</span>
            <div class="bplan-header-text">
              <span class="bplan-title">B计划 · 雨天应对</span>
              <span class="bplan-sub">外面下雨了，帮你切换了室内方案</span>
            </div>
            <button class="bplan-close" @click="showBPlan = false">✕</button>
          </div>

          <div class="bplan-list">
            <div v-for="item in bPlanItems" :key="item.id" class="bplan-item">
              <span class="bplan-item-icon">{{ item.icon }}</span>
              <div class="bplan-item-info">
                <span class="bplan-item-name">{{ item.name }}</span>
                <span class="bplan-item-desc">{{ item.desc }}</span>
              </div>
              <span class="bplan-item-time">{{ item.time }}</span>
            </div>
          </div>

          <div class="bplan-footer">
            <button class="bplan-accept" @click="acceptBPlan">采纳 B 计划</button>
            <button class="bplan-ignore" @click="showBPlan = false">我再想想</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ===== 响应式状态 =====
const moodValue = ref(50)
const showBPlan = ref(false)

// ===== 动态背景色 =====
const bgColor = computed(() => {
  const v = moodValue.value
  if (v <= 30) {
    // 低饱和度暖灰 → 偏暖
    const t = v / 30
    const r = Math.round(237 + t * 0)
    const g = Math.round(235 + t * 0)
    const b = Math.round(232 + t * 0)
    return `rgb(${r}, ${g}, ${b})`
  } else if (v <= 70) {
    // 中间过渡
    const t = (v - 30) / 40
    const r = Math.round(237 - t * 17)
    const g = Math.round(235 - t * 10)
    const b = Math.round(232 + t * 18)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // 明亮浅蓝
    const t = (v - 70) / 30
    const r = Math.round(220 - t * 10)
    const g = Math.round(225 - t * 5)
    const b = Math.round(250 + t * 5)
    return `rgb(${r}, ${g}, ${b})`
  }
})

// ===== 滑块标签 =====
const moodLabel = computed(() => {
  const v = moodValue.value
  if (v <= 20) return '回血充电'
  if (v <= 40) return '轻度漫步'
  if (v <= 60) return '适度游玩'
  if (v <= 80) return '活力探索'
  return '全情投入'
})

// ===== 卡片数据 =====
const allCards = [
  { id: 1,  icon: '☕', title: '猫空咖啡',   desc: '窝在角落看书画画',      tags: ['躺平', '回血'] },
  { id: 2,  icon: '🧘', title: '瑜伽冥想',   desc: '在安静空间里放空自己',  tags: ['躺平', '回血'] },
  { id: 3,  icon: '🎬', title: '私人影院',   desc: '一个人看一部老电影',    tags: ['躺平', '回血'] },
  { id: 4,  icon: '📚', title: '书店漫游',   desc: '在书店里泡一个下午',    tags: ['躺平', '回血'] },
  { id: 5,  icon: '🏛️', title: '博物馆巡礼', desc: '浙博之江馆新展上线',    tags: ['打卡', '探索'] },
  { id: 6,  icon: '🍵', title: '龙井茶山',   desc: '品明前龙井赏茶园风光',  tags: ['打卡', '探索'] },
  { id: 7,  icon: '🥾', title: '十里琅珰',   desc: '经典山脊线徒步挑战',    tags: ['探索', '打卡'] },
  { id: 8,  icon: '🚴', title: '环湖骑行',   desc: '30km 西湖全环绕',       tags: ['探索', '打卡'] },
  { id: 9,  icon: '🎨', title: '油画体验',   desc: '零基础也能画一幅西湖',  tags: ['打卡', '探索'] },
  { id: 10, icon: '🏊', title: '无边泳池',   desc: '山顶泳池俯瞰城市全景',  tags: ['探索', '打卡'] },
]

// ===== 卡片过滤逻辑 =====
const filteredCards = computed(() => {
  const v = moodValue.value
  if (v <= 30) {
    return allCards.filter(c => c.tags.some(t => ['躺平', '回血'].includes(t)))
  }
  if (v >= 70) {
    return allCards.filter(c => c.tags.some(t => ['探索', '打卡'].includes(t)))
  }
  // 中间态：显示全部
  return allCards
})

// ===== B计划雨天数据 =====
const bPlanItems = [
  { id: 1, icon: '🏛️', name: '浙江省博物馆',  desc: '武林馆区 · 常设展免费',   time: '2h' },
  { id: 2, icon: '📚', name: '茑屋书店',      desc: '天目里 · 日系美学空间',   time: '1.5h' },
  { id: 3, icon: '🍜', name: '知味观',        desc: '仁和路总店 · 老字号杭帮菜', time: '1h' },
  { id: 4, icon: '🎭', name: '蜂巢剧场',      desc: '今晚有孟京辉话剧',         time: '2.5h' },
]

// ===== 方法 =====
function onSliderInput(e) {
  moodValue.value = parseInt(e.target.value)
}

function triggerRain() {
  showBPlan.value = !showBPlan.value
}

function acceptBPlan() {
  showBPlan.value = false
  // 后续可接入行程更新逻辑
}

function tagClass(tag) {
  if (['躺平', '回血'].includes(tag)) return 'tag-rest'
  if (['探索', '打卡'].includes(tag)) return 'tag-explore'
  return ''
}
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.page {
  min-height: 100vh;
  padding: 20px 16px;
  transition: background-color 0.8s ease;
  font-family: 'Inter', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ================================================================
   1. MOOD SLIDER
   ================================================================ */
.slider-section {
  margin-bottom: 24px;
}
.slider-header {
  margin-bottom: 16px;
}
.slider-title {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #4A4640;
  letter-spacing: -0.2px;
}
.slider-sub {
  display: block;
  font-size: 12px;
  color: #7A7670;
  margin-top: 2px;
}

/* 滑块容器 */
.slider-wrap {
  position: relative;
  height: 48px;
  margin-bottom: 4px;
}

/* --- 隐藏原生 input[range] --- */
.slider-input {
  position: absolute;
  top: 0; left: 0; right: 0;
  width: 100%; height: 48px;
  opacity: 0;
  cursor: pointer;
  z-index: 3;
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

/* --- 视觉轨道 (Track) 6px 渐变 --- */
.slider-track {
  position: absolute;
  top: 50%; left: 0; right: 0;
  transform: translateY(-50%);
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #A8D5BA 0%, #FFD1A9 100%);
  z-index: 0;
}

/* --- 填充轨道（覆盖在渐变上，只显示左侧部分） --- */
.slider-fill {
  position: absolute;
  top: 50%; left: 0;
  transform: translateY(-50%);
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #A8D5BA 0%, #8BC4A0 100%);
  z-index: 0;
  transition: width 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}

/* --- 视觉滑块 (Thumb) 30px 白色圆形 --- */
.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px; height: 30px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
  pointer-events: none;
  transition: left 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}

/* --- 数值气泡 --- */
.slider-bubble {
  position: absolute;
  top: -8px;
  transform: translateX(-50%);
  width: 40px;
  height: 22px;
  line-height: 22px;
  border-radius: 11px;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  font-size: 11px;
  font-weight: 700;
  color: #4A4640;
  text-align: center;
  pointer-events: none;
  transition: left 0.15s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 1;
}

/* --- 标签 --- */
.slider-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2px;
  margin-top: 12px;
}
.slider-label {
  font-size: 12px;
  font-weight: 600;
  color: #A8A094;
  cursor: pointer;
  transition: color 0.3s;
}
.slider-label.active {
  color: #4A4640;
  font-weight: 700;
}
.slider-label-center {
  font-size: 13px;
  font-weight: 700;
  color: #7A7670;
  transition: color 0.5s;
}

/* ================================================================
   2. CARD LIST + TransitionGroup
   ================================================================ */
.cards-section {
  margin-bottom: 24px;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #4A4640;
  margin-bottom: 10px;
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

/* --- 卡片 --- */
.card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.04);
}
.card-icon {
  font-size: 28px;
  flex-shrink: 0;
}
.card-info {
  flex: 1;
  min-width: 0;
}
.card-name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #4A4640;
}
.card-desc {
  display: block;
  font-size: 11px;
  color: #7A7670;
  margin-top: 2px;
}
.card-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.card-tag {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}
.tag-rest {
  background: #E6EFE5;
  color: #526A50;
}
.tag-explore {
  background: #FDF0E4;
  color: #D4783A;
}

/* ================================================================
   TransitionGroup: card-fade
   ================================================================ */
.card-fade-enter-active {
  transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.card-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0, 1, 0.45);
  position: absolute;
}
.card-fade-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.card-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}
.card-fade-move {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

/* ================================================================
   3. B-PLAN CARD
   ================================================================ */
.rain-test-btn {
  position: fixed;
  top: 12px; right: 12px;
  z-index: 100;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.92);
  font-size: 12px;
  font-weight: 600;
  color: #5C7E9A;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: transform 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}

@media (min-width: 768px) {
  .rain-test-btn {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}
.rain-test-btn:active {
  transform: scale(0.95);
}

/* --- 遮罩 --- */
.bplan-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0,0,0,0.25);
}

@media (min-width: 768px) {
  .bplan-overlay {
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
}

/* --- 毛玻璃卡片 --- */
.bplan-card {
  width: 90%;
  max-width: 420px;
  margin-bottom: max(20px, env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.88);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  padding: 18px;
  overflow: hidden;
}

@media (min-width: 768px) {
  .bplan-card {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}

/* --- 头部 --- */
.bplan-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}
.bplan-icon {
  font-size: 28px;
  flex-shrink: 0;
}
.bplan-header-text {
  flex: 1;
}
.bplan-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #4A4640;
  font-family: 'Playfair Display', 'Georgia', serif;
}
.bplan-sub {
  display: block;
  font-size: 12px;
  color: #7A7670;
  margin-top: 2px;
}
.bplan-close {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.04);
  font-size: 14px;
  color: #8A9AA4;
  cursor: pointer;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.bplan-close:active {
  background: rgba(0,0,0,0.08);
  transform: scale(0.9);
}

/* --- 列表 --- */
.bplan-list {
  display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 14px;
}
.bplan-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px;
  background: rgba(255,255,255,0.6);
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.04);
}
.bplan-item-icon {
  font-size: 22px;
  flex-shrink: 0;
}
.bplan-item-info {
  flex: 1; min-width: 0;
}
.bplan-item-name {
  display: block;
  font-size: 13px; font-weight: 700;
  color: #4A4640;
}
.bplan-item-desc {
  display: block;
  font-size: 11px; color: #7A7670;
  margin-top: 1px;
}
.bplan-item-time {
  font-size: 11px; font-weight: 600;
  color: #A8A094;
  flex-shrink: 0;
}

/* --- 底部按钮 --- */
.bplan-footer {
  display: flex; gap: 8px;
}
.bplan-accept {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: #7A9E76;
  color: #fff;
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}
.bplan-accept:active { transform: scale(0.95) }
.bplan-ignore {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.6);
  color: #7A7670;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}
.bplan-ignore:active { transform: scale(0.95) }

/* ================================================================
   B-Plan Transition: 底部滑入
   ================================================================ */
.bplan-slide-enter-active {
  transition: all 0.45s cubic-bezier(0.32, 0.72, 0, 1);
}
.bplan-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0, 1, 0.45);
}
.bplan-slide-enter-from {
  opacity: 0;
}
.bplan-slide-enter-from .bplan-card {
  transform: translateY(100%);
}
.bplan-slide-leave-to {
  opacity: 0;
}
.bplan-slide-leave-to .bplan-card {
  transform: translateY(100%);
}
</style>