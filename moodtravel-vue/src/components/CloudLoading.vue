<template>
  <div class="cloud-loading">
    <!-- 天空背景 -->
    <div class="sky">
      <!-- 飘浮云朵 -->
      <div
        v-for="(cloud, i) in clouds"
        :key="'c' + i"
        class="cloud"
        :style="cloud.style"
      >
        <div class="cloud-body" />
        <div class="cloud-bump bump-1" />
        <div class="cloud-bump bump-2" />
        <div class="cloud-bump bump-3" />
      </div>

      <!-- 小行李箱 -->
      <div class="suitcase-wrapper">
        <div class="suitcase" :class="{ walking: isWalking }">
          <div class="suitcase-body">
            <div class="suitcase-handle" />
            <div class="suitcase-stripe" />
            <div class="suitcase-tag" />
          </div>
          <div class="suitcase-wheel wheel-left" />
          <div class="suitcase-wheel wheel-right" />
        </div>
        <!-- 阴影 -->
        <div class="suitcase-shadow" :class="{ walking: isWalking }" />
      </div>

      <!-- 地面线 -->
      <div class="ground-line" />
    </div>

    <!-- 步骤文字 -->
    <div class="loading-info">
      <div class="step-indicator">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="step-dot"
          :class="{
            active: i === currentStep,
            done: i < currentStep
          }"
          :style="i <= currentStep ? { background: stepColor } : {}"
        />
      </div>
      <span class="step-text" :style="{ color: stepColor }">
        {{ steps[currentStep] || '准备出发' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  steps: {
    type: Array,
    default: () => ['分析心情状态', '加载目的地数据', '计算多维权重矩阵', '比价酒店平台', '模拟天气影响', '编排最优行程']
  },
  currentStep: {
    type: Number,
    default: 0
  },
  themeColor: {
    type: String,
    default: '#A3B5A6'
  }
})

const emit = defineEmits(['complete'])

const isWalking = ref(true)
const stepColor = computed(() => props.themeColor)

// 生成云朵
const clouds = ref([])
const cloudConfigs = [
  { top: 8, left: 10, scale: 0.7, duration: 28, delay: 0, opacity: 0.5 },
  { top: 18, left: 70, scale: 1.0, duration: 35, delay: 4, opacity: 0.6 },
  { top: 5, left: 45, scale: 0.5, duration: 22, delay: 8, opacity: 0.35 },
  { top: 25, left: 30, scale: 0.85, duration: 32, delay: 2, opacity: 0.55 },
  { top: 12, left: 85, scale: 0.6, duration: 25, delay: 6, opacity: 0.4 }
]

onMounted(() => {
  clouds.value = cloudConfigs.map(c => ({
    style: {
      top: c.top + '%',
      left: c.left + '%',
      transform: `scale(${c.scale})`,
      opacity: c.opacity,
      animation: `cloudDrift ${c.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${c.delay}s infinite`
    }
  }))
})

onUnmounted(() => {
  isWalking.value = false
})
</script>

<style scoped>
.cloud-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  width: 100%;
}

/* ===== 天空画布 ===== */
.sky {
  position: relative;
  width: 100%;
  max-width: 300px;
  height: 180px;
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    rgba(163, 181, 166, 0.08) 0%,
    rgba(163, 181, 166, 0.03) 60%,
    rgba(180, 170, 155, 0.06) 100%
  );
}

/* ===== 云朵 ===== */
.cloud {
  position: absolute;
  z-index: 2;
}
.cloud-body {
  width: 60px;
  height: 24px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  position: relative;
}
.cloud-bump {
  position: absolute;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
}
.bump-1 {
  width: 28px; height: 28px;
  top: -16px; left: 10px;
}
.bump-2 {
  width: 34px; height: 34px;
  top: -20px; left: 24px;
}
.bump-3 {
  width: 22px; height: 22px;
  top: -12px; left: 42px;
}

@keyframes cloudDrift {
  0%   { transform: translateX(0) scale(var(--s, 1)); }
  25%  { transform: translateX(15px) scale(calc(var(--s, 1) * 1.03)); }
  50%  { transform: translateX(30px) scale(var(--s, 1)); }
  75%  { transform: translateX(15px) scale(calc(var(--s, 1) * 0.97)); }
  100% { transform: translateX(0) scale(var(--s, 1)); }
}

/* ===== 行李箱 ===== */
.suitcase-wrapper {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}
.suitcase {
  position: relative;
  width: 40px;
  height: 32px;
  transform-origin: center bottom;
  animation: suitcaseWalk 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.suitcase-body {
  position: relative;
  width: 40px;
  height: 28px;
  background: linear-gradient(135deg, #D4C8B8, #C4B5A5);
  border-radius: 6px 6px 4px 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3);
}
.suitcase-handle {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 6px;
  border: 2px solid #B5A593;
  border-radius: 3px 3px 0 0;
  border-bottom: none;
}
.suitcase-stripe {
  position: absolute;
  top: 50%;
  left: 4px;
  right: 4px;
  height: 2px;
  background: rgba(255,255,255,0.4);
  transform: translateY(-50%);
}
.suitcase-tag {
  position: absolute;
  top: -3px;
  right: -6px;
  width: 10px;
  height: 7px;
  background: var(--tag-color, #A3B5A6);
  border-radius: 1px;
  animation: tagWave 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.suitcase-wheel {
  position: absolute;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: #8B7D6B;
  border-radius: 50%;
  border: 2px solid #A09383;
  animation: wheelSpin 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.wheel-left { left: 4px; }
.wheel-right { right: 4px; }

.suitcase-shadow {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 4px;
  background: rgba(0,0,0,0.08);
  border-radius: 50%;
  animation: shadowPulse 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}

@keyframes suitcaseWalk {
  0%, 100% { transform: rotate(-1deg) translateY(0); }
  25%  { transform: rotate(1deg) translateY(-3px); }
  50%  { transform: rotate(-1deg) translateY(-1px); }
  75%  { transform: rotate(1deg) translateY(-3px); }
}

@keyframes wheelSpin {
  0%, 100% { transform: rotate(0deg); }
  25%  { transform: rotate(15deg); }
  50%  { transform: rotate(0deg); }
  75%  { transform: rotate(-15deg); }
}

@keyframes shadowPulse {
  0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.6; }
  50%  { transform: translateX(-50%) scaleX(0.8); opacity: 0.4; }
}

@keyframes tagWave {
  0%, 100% { transform: rotate(0deg); }
  25%  { transform: rotate(5deg); }
  75%  { transform: rotate(-5deg); }
}

/* ===== 地面线 ===== */
.ground-line {
  position: absolute;
  bottom: 18px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(180, 170, 155, 0.2),
    rgba(180, 170, 155, 0.3),
    rgba(180, 170, 155, 0.2),
    transparent
  );
}

/* ===== 步骤指示器 ===== */
.loading-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 24px;
  gap: 12px;
}
.step-indicator {
  display: flex;
  gap: 8px;
}
.step-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #E0DCD4;
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.step-dot.active {
  transform: scale(1.5);
  box-shadow: 0 0 8px currentColor;
}
.step-dot.done {
  opacity: 0.5;
}
.step-text {
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 2px;
  transition: color 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
</style>