<template>
  <!-- ================================================================ -->
  <!-- 全屏高级版悬浮预算输入 — 24px+ 字号，极简聚焦 -->
  <!-- ================================================================ -->
  <div class="budget-input-premium" ref="cardEl">
    <!-- 金额主展示 -->
    <div class="budget-display" ref="displayEl">
      <span class="budget-currency">¥</span>
      <span class="budget-amount" ref="amountEl">{{ animatedValue }}</span>
      <span class="budget-label" :style="{ color: accent }">{{ budgetLabel }}</span>
    </div>

    <!-- 模式切换 -->
    <div class="budget-mode-tabs">
      <button
        class="budget-mode-tab"
        :class="{ active: mode === 'slider' }"
        @click="switchMode('slider')"
      >滑块</button>
      <button
        class="budget-mode-tab"
        :class="{ active: mode === 'preset' }"
        @click="switchMode('preset')"
      >预设</button>
    </div>

    <!-- 滑块模式 -->
    <div v-if="mode === 'slider'" class="budget-slider-mode">
      <div class="budget-slider-wrap">
        <div class="budget-slider-track" />
        <div class="budget-slider-fill" ref="fillEl" :style="fillStyle" />
        <div class="budget-float" :style="floatStyle" :class="{ dragging: isDragging }">
          <span class="float-value">¥{{ animatedValue }}</span>
        </div>
        <input
          type="range"
          class="budget-slider-native"
          :min="min"
          :max="max"
          :step="step"
          :value="modelValue"
          @input="onSliderInput"
          @mousedown="isDragging = true"
          @mouseup="isDragging = false"
          @touchstart="isDragging = true"
          @touchend="isDragging = false"
        />
      </div>
      <div class="budget-range-labels">
        <span>¥{{ fmt(min) }}</span>
        <span>¥{{ fmt(max) }}</span>
      </div>
    </div>

    <!-- 预设模式 -->
    <div v-else class="budget-preset-mode">
      <div class="budget-preset-grid">
        <button
          v-for="p in presets"
          :key="p.value"
          class="budget-preset-card"
          :class="{ active: modelValue === p.value }"
          :style="modelValue === p.value ? {
            borderColor: accent,
            background: accent + '10',
            color: accent
          } : {}"
          @click="selectPreset(p)"
        >
          <span class="preset-icon">{{ p.icon }}</span>
          <span class="preset-label">{{ p.label }}</span>
          <span class="preset-value">¥{{ fmt(p.value) }}</span>
        </button>
      </div>
    </div>

    <!-- 推荐预览 -->
    <div class="budget-recommend" ref="recommendEl">
      <div class="recommend-header">
        <span class="recommend-title">推荐方案</span>
        <span class="recommend-badge" :style="{ background: accent + '14', color: accent }">
          {{ previewData.hotelCount }} 酒店 · {{ previewData.poiCount }} 景点
        </span>
      </div>
      <div class="recommend-cards">
        <div v-for="item in previewData.items" :key="item.name" class="recommend-card">
          <div class="recommend-card-img" :style="{ background: item.bg }">
            <span class="recommend-card-emoji">{{ item.icon }}</span>
          </div>
          <div class="recommend-card-info">
            <span class="recommend-card-name">{{ item.name }}</span>
            <span class="recommend-card-price">¥{{ item.price }}/晚</span>
            <span class="recommend-card-tag" :style="{ color: accent }">{{ item.tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import anime from 'animejs'

const props = defineProps({
  modelValue: { type: Number, default: 2000 },
  min: { type: Number, default: 200 },
  max: { type: Number, default: 5000 },
  step: { type: Number, default: 100 },
  accent: { type: String, default: '#FF6B6B' },
  textColor: { type: String, default: '#2A3440' }
})

const emit = defineEmits(['update:modelValue'])

const mode = ref('slider')
const isDragging = ref(false)
const animatedValue = ref(props.modelValue)
const cardEl = ref(null)
const fillEl = ref(null)
const displayEl = ref(null)
const amountEl = ref(null)
const recommendEl = ref(null)

const presets = [
  { value: 500,  label: '经济穷游', icon: '🎒' },
  { value: 1000, label: '精打细算', icon: '💰' },
  { value: 2000, label: '舒适出行', icon: '🏨' },
  { value: 3000, label: '品质享受', icon: '✨' },
  { value: 5000, label: '奢华体验', icon: '👑' }
]

const budgetLabel = computed(() => {
  const p = presets.find(p => p.value === props.modelValue)
  return p ? p.label : '自定义预算'
})

const percentVal = computed(() =>
  ((props.modelValue - props.min) / (props.max - props.min)) * 100
)

const fillStyle = computed(() => ({
  width: percentVal.value + '%',
  background: `linear-gradient(90deg, ${props.accent}40, ${props.accent})`
}))

const floatStyle = computed(() => ({
  left: `calc(${percentVal.value}% - 28px)`
}))

const previewData = computed(() => {
  const v = props.modelValue
  if (v < 800) return {
    hotelCount: 3, poiCount: 5,
    items: [
      { icon: '🏨', name: '青旅床位', price: 60, tag: '性价比', bg: 'linear-gradient(135deg, #E8E8F0, #D5D8E0)' },
      { icon: '🍜', name: '片儿川', price: 18, tag: '本地', bg: 'linear-gradient(135deg, #F0EDF0, #E8E4E8)' }
    ]
  }
  if (v < 2000) return {
    hotelCount: 6, poiCount: 12,
    items: [
      { icon: '🏨', name: '如家精选', price: 280, tag: '经济', bg: 'linear-gradient(135deg, #E4EAF0, #D0D8E4)' },
      { icon: '🍜', name: '知味观', price: 80, tag: '经典', bg: 'linear-gradient(135deg, #F0EDF0, #E8E4E8)' }
    ]
  }
  if (v < 4000) return {
    hotelCount: 10, poiCount: 20,
    items: [
      { icon: '🏨', name: '西湖国宾馆', price: 880, tag: '景观', bg: 'linear-gradient(135deg, #D5DBE0, #C0C8D0)' },
      { icon: '🍜', name: '桂语山房', price: 300, tag: '私房', bg: 'linear-gradient(135deg, #E8EDF0, #D5DCE0)' }
    ]
  }
  return {
    hotelCount: 15, poiCount: 30,
    items: [
      { icon: '🏨', name: '法云安缦', price: 4500, tag: '奢华', bg: 'linear-gradient(135deg, #C5CCD5, #A0A8B0)' },
      { icon: '🍜', name: '金沙厅', price: 800, tag: '米其林', bg: 'linear-gradient(135deg, #D5D0CC, #C0B8B0)' }
    ]
  }
})

function percent(v) { return ((v - props.min) / (props.max - props.min)) * 100 }
function fmt(v) { return v >= 1000 ? (v / 1000) + 'k' : v }

function switchMode(m) {
  mode.value = m
  nextTick(() => {
    anime({
      targets: cardEl.value,
      scale: [0.98, 1],
      opacity: [0.85, 1],
      duration: 400,
      easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
    })
  })
}

function onSliderInput(e) {
  const val = Number(e.target.value)
  animatedValue.value = val
  emit('update:modelValue', val)
}

function selectPreset(p) {
  emit('update:modelValue', p.value)
  anime({
    targets: cardEl.value,
    scale: [0.97, 1],
    duration: 300,
    easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
  })
}

watch(() => props.modelValue, () => {
  animatedValue.value = props.modelValue
  nextTick(() => {
    if (recommendEl.value) {
      anime({
        targets: recommendEl.value,
        translateY: [8, 0],
        opacity: [0.5, 1],
        duration: 400,
        easing: 'cubicBezier(0.25, 0.46, 0.45, 0.94)'
      })
    }
  })
})
</script>

<style scoped>
/* ============================================================
   Budget Input Premium — 全屏高级版
   ============================================================ */
.budget-input-premium {
  background: var(--premium-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--premium-glass-border);
  border-radius: var(--premium-radius-xl);
  padding: 36px 32px;
  box-shadow: var(--premium-shadow-lg);
  will-change: transform, opacity;
  max-width: 520px;
  margin: 0 auto;
}

/* 金额主展示 */
.budget-display {
  text-align: center;
  margin-bottom: 24px;
  will-change: transform;
}

.budget-currency {
  font-family: var(--premium-font-display);
  font-size: 28px;
  font-weight: 300;
  color: var(--premium-text-secondary);
  vertical-align: super;
  margin-right: 2px;
}

.budget-amount {
  font-family: var(--premium-font-display);
  font-size: 56px;
  font-weight: 700;
  color: var(--premium-text);
  letter-spacing: -1.5px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.budget-label {
  display: block;
  font-family: var(--premium-font-display);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-top: 8px;
}

/* 模式切换 */
.budget-mode-tabs {
  display: flex;
  gap: 4px;
  background: rgba(42, 52, 64, 0.04);
  border-radius: var(--premium-radius-sm);
  padding: 4px;
  margin-bottom: 28px;
}

.budget-mode-tab {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-family: var(--premium-font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--premium-text-muted);
  cursor: pointer;
  transition: all 0.25s var(--premium-easing);
}
.budget-mode-tab.active {
  background: var(--premium-white);
  color: var(--premium-text);
  font-weight: 600;
  box-shadow: var(--premium-shadow-sm);
}

/* 滑块 */
.budget-slider-mode { position: relative; }

.budget-slider-wrap {
  position: relative;
  height: 56px;
  margin: 0 8px 4px;
}

.budget-slider-track {
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 6px;
  border-radius: 3px;
  background: rgba(42, 52, 64, 0.06);
  transform: translateY(-50%);
}

.budget-slider-fill {
  position: absolute;
  top: 50%; left: 0;
  height: 6px;
  border-radius: 3px;
  transform: translateY(-50%);
  transition: width 0.15s var(--premium-easing);
  will-change: width;
}

.budget-float {
  position: absolute;
  top: -14px;
  z-index: 3;
  pointer-events: none;
  transition: left 0.15s var(--premium-easing);
  will-change: left;
}
.budget-float.dragging { transition: none; }

.float-value {
  display: inline-block;
  background: var(--premium-text);
  color: var(--premium-bg);
  font-family: var(--premium-font-display);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 10px;
  white-space: nowrap;
}

.budget-slider-native {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  z-index: 2;
  margin: 0;
}
.budget-slider-native::-webkit-slider-runnable-track { -webkit-appearance: none; height: 6px; background: transparent; }
.budget-slider-native::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid var(--premium-accent);
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  cursor: pointer;
  margin-top: -11px;
  transition: transform 0.2s var(--premium-easing);
}
.budget-slider-native::-webkit-slider-thumb:active { transform: scale(1.15); }
.budget-slider-native::-moz-range-thumb {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid var(--premium-accent);
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  cursor: pointer;
}
.budget-slider-native::-moz-range-track { height: 6px; background: transparent; }

.budget-range-labels {
  display: flex;
  justify-content: space-between;
  font-family: var(--premium-font-body);
  font-size: 12px;
  font-weight: 400;
  color: var(--premium-text-muted);
  padding: 0 12px;
  margin-top: 2px;
}

/* 预设网格 */
.budget-preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.budget-preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border-radius: var(--premium-radius-sm);
  border: 1.5px solid rgba(42, 52, 64, 0.08);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-family: var(--premium-font-body);
  transition: all 0.25s var(--premium-easing);
}
.budget-preset-card:active { transform: scale(0.96); }
.budget-preset-card.active { font-weight: 700; }

.preset-icon { font-size: 28px; line-height: 1; }
.preset-label { font-size: 15px; font-weight: 600; color: var(--premium-text); }
.preset-value { font-size: 13px; font-weight: 500; color: var(--premium-text-secondary); }

/* 推荐预览 */
.budget-recommend {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(42, 52, 64, 0.06);
  will-change: transform, opacity;
}

.recommend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.recommend-title {
  font-family: var(--premium-font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--premium-text);
  letter-spacing: 0.3px;
}

.recommend-badge {
  font-family: var(--premium-font-body);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 10px;
}

.recommend-cards {
  display: flex;
  gap: 10px;
}

.recommend-card {
  flex: 1;
  border-radius: var(--premium-radius-sm);
  overflow: hidden;
  background: rgba(42, 52, 64, 0.02);
  border: 1px solid rgba(42, 52, 64, 0.04);
}

.recommend-card-img {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recommend-card-emoji { font-size: 30px; }

.recommend-card-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.recommend-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--premium-text);
}

.recommend-card-price {
  font-size: 12px;
  color: var(--premium-text-secondary);
}

.recommend-card-tag {
  font-size: 11px;
  font-weight: 500;
}

/* 长辈模式 */
[data-accessibility="elderly"] .budget-input-premium {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(0,0,0,0.08);
}
[data-accessibility="elderly"] .budget-amount { font-size: 68px; }
[data-accessibility="elderly"] .budget-currency { font-size: 36px; }
[data-accessibility="elderly"] .budget-label { font-size: 18px; }
[data-accessibility="elderly"] .budget-mode-tab { font-size: 17px; padding: 14px 0; }
[data-accessibility="elderly"] .budget-slider-wrap { height: 72px; }
[data-accessibility="elderly"] .budget-slider-track { height: 10px; }
[data-accessibility="elderly"] .budget-slider-fill { height: 10px; }
[data-accessibility="elderly"] .budget-slider-native::-webkit-slider-thumb { width: 36px; height: 36px; margin-top: -13px; }
[data-accessibility="elderly"] .preset-icon { font-size: 34px; }
[data-accessibility="elderly"] .preset-label { font-size: 18px; }
[data-accessibility="elderly"] .preset-value { font-size: 16px; }
[data-accessibility="elderly"] .recommend-card-name { font-size: 16px; }
[data-accessibility="elderly"] .recommend-card-price { font-size: 15px; }
[data-accessibility="elderly"] .recommend-card-tag { font-size: 14px; }
</style>