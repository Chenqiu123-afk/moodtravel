<template>
  <!-- ================================================================ -->
  <!-- 卡片翻转组件 — rotateY(180deg) + 延迟加载新内容 -->
  <!-- ================================================================ -->
  <div class="flip-card-wrap" :style="{ height: cardHeight }">
    <div class="flip-card-inner" :class="{ flipped }" :style="innerStyle">
      <!-- 正面 -->
      <div class="flip-face flip-front" :style="{ background: frontBg }">
        <slot name="front" />
      </div>
      <!-- 背面 -->
      <div class="flip-face flip-back" :style="{ background: backBg }">
        <slot v-if="flipped" name="back" />
        <div v-else class="flip-back-placeholder">
          <slot name="back-placeholder">
            <div class="placeholder-skeleton">
              <div class="skeleton-line skeleton-line-short" />
              <div class="skeleton-line skeleton-line-long" />
              <div class="skeleton-line skeleton-line-medium" />
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 翻转按钮 -->
    <button
      class="flip-trigger"
      :class="{ flipped }"
      :style="{ color: theme.primary }"
      @click="toggle"
    >
      <span class="flip-icon">{{ flipped ? '↩' : '↪' }}</span>
      <span>{{ flipped ? backLabel : frontLabel }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import anime from 'animejs'

const props = defineProps({
  theme: { type: Object, default: () => ({ primary: '#A3B5A6', primaryLight: '#C5D5C8' }) },
  frontBg: { type: String, default: 'rgba(255,255,255,0.72)' },
  backBg: { type: String, default: 'rgba(255,255,255,0.72)' },
  cardHeight: { type: String, default: '320px' },
  frontLabel: { type: String, default: '查看方案B' },
  backLabel: { type: String, default: '返回方案A' },
  duration: { type: Number, default: 600 }
})

const emit = defineEmits(['flip'])

const flipped = ref(false)
const isAnimating = ref(false)

const innerStyle = computed(() => ({
  transition: `transform ${props.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
  transform: `perspective(1200px) rotateY(${flipped.value ? 180 : 0}deg)`
}))

function toggle() {
  if (isAnimating.value) return
  isAnimating.value = true

  // 翻转前先触发加载状态
  if (!flipped.value) {
    // 正向翻转：延迟 150ms 后加载背面内容（模拟加载延迟）
    setTimeout(() => {
      flipped.value = true
      emit('flip', { side: 'back' })
      setTimeout(() => { isAnimating.value = false }, props.duration)
    }, 150)
  } else {
    flipped.value = false
    emit('flip', { side: 'front' })
    setTimeout(() => { isAnimating.value = false }, props.duration)
  }
}
</script>

<style scoped>
/* ============================================================
   翻转容器
   ============================================================ */
.flip-card-wrap {
  position: relative;
  width: 100%;
  margin-bottom: 55px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
}

.flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.flip-front {
  transform: rotateY(0deg);
}

.flip-back {
  transform: rotateY(180deg);
  background: rgba(255,255,255,0.72);
}

/* 背面占位骨架 */
.flip-back-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.placeholder-skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #E8E4DE 0%, #F0EDE8 40%, #E8E4DE 80%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skeleton-line-short { width: 40%; }
.skeleton-line-long { width: 90%; }
.skeleton-line-medium { width: 65%; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 翻转按钮 */
.flip-trigger {
  position: absolute;
  bottom: -44px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 24px;
  border: 1.5px solid currentColor;
  background: rgba(255,255,255,0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
  white-space: nowrap;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.flip-trigger:active {
  transform: translateX(-50%) scale(0.93);
}

.flip-icon {
  font-size: 18px;
  transition: transform 0.3s;
}

.flip-trigger.flipped .flip-icon {
  transform: rotate(180deg);
}

/* ============================================================
   长辈模式
   ============================================================ */
[data-accessibility="elderly"] .flip-face {
  background: #FFFFFF !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(0,0,0,0.08);
}

[data-accessibility="elderly"] .flip-trigger {
  font-size: 17px;
  padding: 14px 28px;
  border-radius: 30px;
  background: #FFFFFF;
}

[data-accessibility="elderly"] .flip-icon { font-size: 22px; }
</style>