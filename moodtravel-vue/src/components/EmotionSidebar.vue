<template>
  <!-- ================================================================ -->
  <!-- 情绪侧边栏 — 全屏版左列固定 + 情绪驱动推荐弹出 -->
  <!-- ================================================================ -->
  <aside class="emotion-sidebar-premium" :class="{ open: sidebarOpen }" ref="sidebarEl">
    <!-- 展开/收起 -->
    <div class="sidebar-toggle" @click="toggleSidebar" :style="{ background: accent }" aria-label="展开情绪面板">
      <span class="toggle-icon" :class="{ open: sidebarOpen }">›</span>
    </div>

    <!-- 情绪图标列 -->
    <div class="emotion-icon-column">
      <div
        v-for="(emo, i) in emotions"
        :key="emo.key"
        class="emotion-icon-item"
        :class="{ active: activeEmotion === emo.key }"
        :style="activeEmotion === emo.key ? {
          background: emo.gradient,
          boxShadow: `0 0 24px ${emo.color}40`
        } : {}"
        @click="selectEmotion(emo, i)"
        role="button"
        :aria-label="'选择' + emo.label + '情绪'"
      >
        <span class="emoji">{{ emo.emoji }}</span>
        <span class="emo-label">{{ emo.label }}</span>
      </div>
    </div>

    <!-- 推荐弹出层 -->
    <Transition name="popup-premium">
      <div v-if="sidebarOpen && activeEmotion" class="emotion-popup" ref="popupEl">
        <div class="popup-header">
          <span class="popup-emoji">{{ activeEmotionData.emoji }}</span>
          <div class="popup-title-wrap">
            <span class="popup-title">{{ activeEmotionData.label }}</span>
            <span class="popup-sub">{{ activeEmotionData.subtitle }}</span>
          </div>
        </div>

        <div class="popup-divider" :style="{ background: activeEmotionData.gradient }" />

        <div class="popup-recommendations">
          <div
            v-for="rec in activeEmotionData.recommendations"
            :key="rec.name"
            class="popup-rec-item"
            role="button"
            :aria-label="rec.name + '，' + rec.distance"
          >
            <span class="rec-icon">{{ rec.icon }}</span>
            <div class="rec-info">
              <span class="rec-name">{{ rec.name }}</span>
              <span class="rec-desc">{{ rec.desc }}</span>
            </div>
            <span class="rec-distance" :style="{ color: accent }">{{ rec.distance }}</span>
          </div>
        </div>

        <div class="popup-footer">
          <span class="popup-quote">"{{ activeEmotionData.quote }}"</span>
          <button
            class="popup-action-btn"
            :style="{ background: activeEmotionData.gradient }"
            @click="onAction"
          >
            {{ activeEmotionData.action }}
          </button>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import anime from 'animejs'

const props = defineProps({
  accent: { type: String, default: '#FF6B6B' }
})

const emit = defineEmits(['select', 'action'])

const sidebarOpen = ref(false)
const activeEmotion = ref(null)
const sidebarEl = ref(null)
const popupEl = ref(null)

const emotions = [
  { key: 'tired',   emoji: '😴', label: '疲惫', color: '#6B8FA3', gradient: 'linear-gradient(135deg, #6B8FA3, #A3C4D6)' },
  { key: 'excited', emoji: '🤩', label: '兴奋', color: '#E8945A', gradient: 'linear-gradient(135deg, #E8945A, #F5C19A)' },
  { key: 'happy',   emoji: '😄', label: '开心', color: '#8BA88C', gradient: 'linear-gradient(135deg, #8BA88C, #B5CEB6)' },
  { key: 'calm',    emoji: '😌', label: '平静', color: '#A3B5A6', gradient: 'linear-gradient(135deg, #A3B5A6, #C5D5C8)' },
  { key: 'anxious', emoji: '😰', label: '焦虑', color: '#B5A3C4', gradient: 'linear-gradient(135deg, #B5A3C4, #D5C8E0)' },
  { key: 'sad',     emoji: '😢', label: '低落', color: '#C4A8A8', gradient: 'linear-gradient(135deg, #C4A8A8, #DDC8C8)' }
]

const emotionData = {
  tired: {
    subtitle: '允许自己慢下来',
    quote: '疲惫不是软弱，是身体在提醒你需要休息。',
    action: '找一处安静角落',
    recommendations: [
      { icon: '📚', name: '猫空书店', desc: '藏在巷子里的安静角落', distance: '步行5分钟' },
      { icon: '☕', name: '转角咖啡', desc: '手冲咖啡 + 靠窗座位', distance: '步行3分钟' },
      { icon: '🌿', name: '社区花园', desc: '长椅 + 树荫 + 鸟鸣', distance: '步行6分钟' }
    ]
  },
  excited: {
    subtitle: '让能量流动起来',
    quote: '兴奋是生命力的绽放，今天适合探索。',
    action: '开始一场冒险',
    recommendations: [
      { icon: '🥾', name: '十里琅珰', desc: '山脊线徒步，风景绝佳', distance: '车程20分钟' },
      { icon: '🚴', name: '环湖骑行', desc: '30km 环湖路线', distance: '起点步行2分钟' },
      { icon: '🏔️', name: '宝石山', desc: '登顶俯瞰西湖全景', distance: '步行15分钟' }
    ]
  },
  happy: {
    subtitle: '珍惜此刻的光亮',
    quote: '开心的时候，世界都是暖色调的。',
    action: '记录美好瞬间',
    recommendations: [
      { icon: '📸', name: '杨公堤', desc: '人少景美，拍照圣地', distance: '骑行8分钟' },
      { icon: '🍰', name: '甜品工坊', desc: '手工蛋糕 + 现磨咖啡', distance: '步行10分钟' },
      { icon: '🌅', name: '雷峰塔', desc: '日落时分，金色西湖', distance: '车程15分钟' }
    ]
  },
  calm: {
    subtitle: '不疾不徐，刚刚好',
    quote: '平静不是无聊，而是内心足够丰盈。',
    action: '享受当下时光',
    recommendations: [
      { icon: '🍵', name: '青藤茶馆', desc: '龙井路，窗外就是茶园', distance: '步行12分钟' },
      { icon: '🏛️', name: '浙博之江馆', desc: '安静逛展，新展很棒', distance: '车程15分钟' },
      { icon: '🚣', name: '西溪湿地', desc: '摇橹船，水上漂着放空', distance: '车程25分钟' }
    ]
  },
  anxious: {
    subtitle: '深呼吸，你会好起来的',
    quote: '焦虑是你在乎的证明，你已经做得很好了。',
    action: '寻找内心平静',
    recommendations: [
      { icon: '🌿', name: '梅家坞茶园', desc: '只听鸟叫，看茶山绿到天边', distance: '车程20分钟' },
      { icon: '🧘', name: '冥想空间', desc: '安静空间 + 引导音频', distance: '步行8分钟' },
      { icon: '🏛️', name: '茶叶博物馆', desc: '免费参观，室内安静', distance: '车程12分钟' }
    ]
  },
  sad: {
    subtitle: '悲伤值得被温柔对待',
    quote: '眼泪是心灵的雨水，落完了，天空自然会放晴。',
    action: '给自己一个拥抱',
    recommendations: [
      { icon: '📚', name: '避世书局', desc: '老城区二楼，知道的人很少', distance: '步行15分钟' },
      { icon: '🍜', name: '知味观', desc: '一碗片儿川，温暖入胃', distance: '步行10分钟' },
      { icon: '🌊', name: '西湖长椅', desc: '选一个角落，看水波荡漾', distance: '步行5分钟' }
    ]
  }
}

const activeEmotionData = computed(() => {
  if (!activeEmotion.value) {
    return { subtitle: '', quote: '', action: '', recommendations: [], emoji: '😌', label: '选择心情', gradient: 'linear-gradient(135deg, #A3B5A6, #C5D5C8)' }
  }
  return {
    ...emotionData[activeEmotion.value],
    emoji: emotions.find(e => e.key === activeEmotion.value)?.emoji,
    label: emotions.find(e => e.key === activeEmotion.value)?.label,
    gradient: emotions.find(e => e.key === activeEmotion.value)?.gradient
  }
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
  if (sidebarOpen.value && !activeEmotion.value) {
    activeEmotion.value = 'calm'
  }
  nextTick(() => {
    if (popupEl.value) {
      anime({
        targets: popupEl.value,
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
      })
    }
  })
}

function selectEmotion(emo, index) {
  const prev = activeEmotion.value
  activeEmotion.value = emo.key
  if (!sidebarOpen.value) {
    sidebarOpen.value = true
    nextTick(() => {
      if (popupEl.value) {
        anime({
          targets: popupEl.value,
          translateX: [-20, 0],
          opacity: [0, 1],
          duration: 400,
          easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
        })
      }
    })
  }
  emit('select', emo)
  if (prev !== emo.key) {
    nextTick(() => {
      const items = document.querySelectorAll('.emotion-popup .popup-rec-item')
      anime({
        targets: items,
        translateX: [12, 0],
        opacity: [0, 1],
        delay: anime.stagger(60),
        duration: 350,
        easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
      })
    })
  }
}

function onAction() {
  emit('action', activeEmotion.value)
}
</script>

<style scoped>
/* ============================================================
   Emotion Sidebar Premium — 全屏版左列
   ============================================================ */
.emotion-sidebar-premium {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  height: 100%;
}

/* 展开/收起开关 */
.sidebar-toggle {
  width: 28px;
  height: 56px;
  border-radius: 0 14px 14px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: 40px;
  transition: all 0.3s var(--premium-easing);
  box-shadow: 2px 0 12px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.toggle-icon {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  transition: transform 0.3s var(--premium-easing);
  font-family: var(--premium-font-body);
}

.toggle-icon.open {
  transform: rotate(180deg);
}

/* 图标列 */
.emotion-icon-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--premium-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--premium-glass-border);
  border-radius: 0 16px 16px 0;
  box-shadow: 2px 0 16px rgba(0,0,0,0.04);
  flex-shrink: 0;
}

.emotion-icon-item {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.35s var(--premium-easing);
  background: rgba(255,255,255,0.4);
  position: relative;
  overflow: hidden;
}

.emotion-icon-item:active {
  transform: scale(0.92);
}

.emotion-icon-item.active {
  transform: scale(1.06);
}

.emoji {
  font-size: 20px;
  line-height: 1;
  transition: transform 0.35s;
}

.emotion-icon-item.active .emoji {
  transform: scale(1.18);
}

.emo-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--premium-text-secondary);
  transition: color 0.35s;
  font-family: var(--premium-font-body);
}

.emotion-icon-item.active .emo-label {
  color: #fff;
}

/* 推荐弹出层 */
.emotion-popup {
  width: 260px;
  background: var(--premium-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--premium-glass-border);
  border-radius: var(--premium-radius-md);
  padding: 20px;
  margin-left: 12px;
  box-shadow: var(--premium-shadow-md);
  max-height: 60vh;
  overflow-y: auto;
  will-change: transform, opacity;
  flex-shrink: 0;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.popup-emoji {
  font-size: 32px;
  line-height: 1;
}

.popup-title-wrap {
  display: flex;
  flex-direction: column;
}

.popup-title {
  font-family: var(--premium-font-display);
  font-size: 17px;
  font-weight: 700;
  color: var(--premium-text);
  letter-spacing: 0.3px;
}

.popup-sub {
  font-family: var(--premium-font-body);
  font-size: 12px;
  color: var(--premium-text-secondary);
  font-weight: 400;
}

.popup-divider {
  height: 2px;
  border-radius: 1px;
  margin-bottom: 14px;
  opacity: 0.5;
}

.popup-recommendations {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.popup-rec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--premium-radius-sm);
  background: rgba(42, 52, 64, 0.02);
  border: 1px solid rgba(42, 52, 64, 0.04);
  cursor: pointer;
  transition: all 0.2s var(--premium-easing);
  will-change: transform, opacity;
}

.popup-rec-item:active {
  transform: scale(0.97);
  background: rgba(42, 52, 64, 0.04);
}

.rec-icon {
  font-size: 26px;
  flex-shrink: 0;
}

.rec-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rec-name {
  font-family: var(--premium-font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--premium-text);
}

.rec-desc {
  font-size: 11px;
  color: var(--premium-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-distance {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  font-family: var(--premium-font-body);
}

.popup-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popup-quote {
  font-family: var(--premium-font-serif);
  font-size: 12px;
  font-style: italic;
  color: var(--premium-text-secondary);
  line-height: 1.5;
}

.popup-action-btn {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-radius: var(--premium-radius-sm);
  color: #fff;
  font-family: var(--premium-font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--premium-easing);
}

.popup-action-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

/* 弹出层过渡 */
.popup-premium-enter-active {
  transition: all 0.4s var(--premium-easing);
}
.popup-premium-leave-active {
  transition: all 0.2s var(--premium-easing);
}
.popup-premium-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.popup-premium-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 长辈模式 */
[data-accessibility="elderly"] .emotion-sidebar-premium {
  flex-direction: column;
  width: 100%;
}
[data-accessibility="elderly"] .emotion-icon-column {
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
  border-radius: 16px;
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
[data-accessibility="elderly"] .emotion-icon-item {
  width: 56px;
  height: 56px;
  border-radius: 16px;
}
[data-accessibility="elderly"] .emoji { font-size: 24px; }
[data-accessibility="elderly"] .emo-label { font-size: 12px; }
[data-accessibility="elderly"] .sidebar-toggle { display: none; }
[data-accessibility="elderly"] .emotion-popup {
  width: 100%;
  margin-left: 0;
  margin-top: 8px;
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-radius: 16px;
}
[data-accessibility="elderly"] .popup-title { font-size: 20px; }
[data-accessibility="elderly"] .popup-sub { font-size: 15px; }
[data-accessibility="elderly"] .rec-name { font-size: 16px; }
[data-accessibility="elderly"] .rec-desc { font-size: 14px; }
[data-accessibility="elderly"] .popup-action-btn { font-size: 16px; padding: 14px 0; }
[data-accessibility="elderly"] .popup-quote { font-size: 14px; }
</style>