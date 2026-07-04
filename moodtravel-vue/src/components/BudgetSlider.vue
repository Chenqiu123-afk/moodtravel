<template>
  <!-- ================================================================ -->
  <!-- 预算滑块 — 动态区间 + 校验提示 -->
  <!-- ================================================================ -->
  <div class="budget-slider">
    <!-- 标签行 -->
    <div class="slider-header">
      <span class="slider-label">预算设置</span>
      <span class="slider-value" :style="{ color: primaryColor }">
        ¥{{ modelValue.toLocaleString() }}
      </span>
    </div>

    <!-- 自定义滑块 -->
    <div class="slider-track-wrap">
      <div class="slider-track-bg" :style="trackBgStyle" />
      <div
        class="slider-track-fill"
        :style="trackFillStyle"
      />
      <input
        type="range"
        class="slider-input"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="onInput"
      />
      <!-- 刻度标记 -->
      <div class="tick-marks">
        <div
          v-for="tick in dynamicTicks"
          :key="tick"
          class="tick-mark"
          :class="{ active: modelValue >= tick }"
          :style="{ left: tickPercent(tick) }"
        >
          <div class="tick-dot" :style="modelValue >= tick ? { background: primaryColor } : {}" />
          <span class="tick-label">¥{{ tick >= 1000 ? (tick / 1000) + 'k' : tick }}</span>
        </div>
      </div>
    </div>

    <!-- 快捷预设按钮 -->
    <div class="preset-buttons">
      <button
        v-for="preset in dynamicPresets"
        :key="preset"
        class="preset-btn"
        :class="{ active: modelValue === preset }"
        :style="modelValue === preset ? {
          background: primaryColor,
          color: '#fff',
          borderColor: primaryColor
        } : {}"
        @click="setPreset(preset)"
      >
        ¥{{ preset.toLocaleString() }}
      </button>
    </div>

    <!-- 校验提示 -->
    <div v-if="warning" class="budget-warning" :class="{ luxury: warning.includes('奢华') }">
      <span>{{ warning.includes('不够') ? '⚠️' : '👑' }}</span>
      <span>{{ warning }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 2000 },
  min:        { type: Number, default: 500 },
  max:        { type: Number, default: 5000 },
  step:       { type: Number, default: 100 },
  theme:      { type: Object, default: () => ({ primary: '#A3B5A6', primaryLight: '#C5D5C8', accent: '#7A9680' }) },
  days:       { type: Number, default: 2 },
  warning:    { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const primaryColor = computed(() => props.theme?.primary || '#A3B5A6')
const primaryLightColor = computed(() => props.theme?.primaryLight || '#C5D5C8')

// 动态刻度
const dynamicTicks = computed(() => {
  const range = props.max - props.min
  const step = Math.round(range / 4)
  return [props.min, props.min + step, props.min + step * 2, props.min + step * 3, props.max]
})

// 动态预设
const dynamicPresets = computed(() => {
  const range = props.max - props.min
  const step = Math.round(range / 3)
  return [props.min, Math.round(props.min + step), Math.round(props.min + step * 2), props.max]
})

const rangePercent = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

const trackBgStyle = computed(() => ({
  background: `linear-gradient(90deg, ${primaryColor.value}08, ${primaryColor.value}12)`
}))

const trackFillStyle = computed(() => ({
  width: `${rangePercent.value}%`,
  background: `linear-gradient(90deg, ${primaryColor.value}, ${primaryColor.value}CC)`
}))

function tickPercent(value) {
  return `${((value - props.min) / (props.max - props.min)) * 100}%`
}

function onInput(e) {
  const val = Number(e.target.value)
  emit('update:modelValue', val)
}

function setPreset(value) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
/* ============================================================
   容器
   ============================================================ */
.budget-slider {
  padding: 16px 0;
}

/* 标签行 */
.slider-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.slider-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text, #4A4640);
  letter-spacing: 0.3px;
}

.slider-value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* ============================================================
   滑块轨道
   ============================================================ */
.slider-track-wrap {
  position: relative;
  height: 48px;
  margin-bottom: 8px;
}

.slider-track-bg {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 3px;
  transform: translateY(-50%);
  pointer-events: none;
}

.slider-track-fill {
  position: absolute;
  top: 50%;
  left: 0;
  height: 6px;
  border-radius: 3px;
  transform: translateY(-50%);
  pointer-events: none;
  transition: width 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 原生的 range input 透明地覆盖在轨道上方 */
.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  margin: 0;
  z-index: 2;
}

/* 滑块滑轨（webkit） */
.slider-input::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  height: 6px;
  background: transparent;
  border-radius: 3px;
}

/* 滑块拇指（webkit） */
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid v-bind(primaryColor);
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  margin-top: -9px;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slider-input::-webkit-slider-thumb:active {
  transform: scale(1.15);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

/* 滑块拇指（Firefox） */
.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid v-bind(primaryColor);
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slider-input::-moz-range-track {
  height: 6px;
  background: transparent;
  border-radius: 3px;
}

/* ============================================================
   刻度标记
   ============================================================ */
.tick-marks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.tick-mark {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.tick-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1;
}

.tick-mark.active .tick-dot {
  background: var(--morandi-sage, #A3B5A6);
  box-shadow: 0 0 0 3px rgba(163, 181, 166, 0.15);
}

.tick-label {
  font-size: 10px;
  font-weight: 400;
  color: var(--color-text-muted, #A8A094);
  white-space: nowrap;
  transition: color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.tick-mark.active .tick-label {
  color: var(--color-text-light, #7A7670);
  font-weight: 500;
}

/* ============================================================
   快捷预设按钮
   ============================================================ */
.preset-buttons {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.preset-btn {
  flex: 1;
  min-width: 56px;
  padding: 8px 4px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.015);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #4A4640);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
  white-space: nowrap;
}

.preset-btn:active {
  transform: scale(0.95);
}

.preset-btn.active {
  border-color: transparent;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(163, 181, 166, 0.2);
}

/* 预算校验提示 */
.budget-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #FFF3E0;
  color: #E8945A;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
  animation: fadeIn 0.25s ease;
}

.budget-warning.luxury {
  background: #FDF0E6;
  color: #D4A060;
}

/* ============================================================
   长辈模式适配
   ============================================================ */
[data-accessibility="elderly"] .slider-label {
  font-size: 18px;
  font-weight: 600;
}

[data-accessibility="elderly"] .slider-value {
  font-size: 24px;
}

[data-accessibility="elderly"] .slider-track-wrap {
  height: 60px;
  margin-bottom: 12px;
}

[data-accessibility="elderly"] .slider-track-bg {
  height: 8px;
  border-radius: 4px;
}

[data-accessibility="elderly"] .slider-track-fill {
  height: 8px;
  border-radius: 4px;
}

[data-accessibility="elderly"] .slider-input::-webkit-slider-thumb {
  width: 32px;
  height: 32px;
  margin-top: -12px;
  border-width: 3px;
}

[data-accessibility="elderly"] .slider-input::-moz-range-thumb {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

[data-accessibility="elderly"] .tick-dot {
  width: 10px;
  height: 10px;
}

[data-accessibility="elderly"] .tick-label {
  font-size: 13px;
}

[data-accessibility="elderly"] .preset-btn {
  padding: 12px 8px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  min-height: 48px;
}

/* 长辈模式下隐藏原生滑块，改用预设按钮 */
[data-accessibility="elderly"] .slider-input {
  display: none;
}

[data-accessibility="elderly"] .slider-track-bg {
  background: rgba(0, 0, 0, 0.04) !important;
}

[data-accessibility="elderly"] .slider-track-fill {
  background: v-bind(primaryColor) !important;
}
</style>