<template>
  <transition name="weather-alert">
    <div v-if="visible" class="weather-alert-wrap">
      <div class="weather-alert-card" :style="cardStyle">
        <!-- 顶部雨滴动画 -->
        <div class="rain-drops">
          <span v-for="i in 5" :key="i" class="rain-drop" :style="rainDropStyle(i)" />
        </div>

        <!-- 内容区 -->
        <div class="weather-content">
          <div class="weather-icon-row">
            <span class="weather-icon">{{ icon }}</span>
            <span class="weather-type">{{ typeLabel }}</span>
          </div>
          <p class="weather-message">{{ message }}</p>
          <div class="weather-details" v-if="details.length">
            <div v-for="(d, i) in details" :key="i" class="weather-detail">
              <span class="detail-dot" />
              <span>{{ d }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="weather-actions">
          <button class="weather-btn secondary" @click="dismiss">
            <span>我知道了</span>
          </button>
          <button class="weather-btn primary" @click="onAction">
            <span>{{ actionLabel }}</span>
          </button>
        </div>

        <!-- 关闭按钮 -->
        <div class="weather-close" @click="dismiss">
          <span>✕</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  type:    { type: String, default: 'rain' },     // rain | storm | wind | heat
  message: { type: String, default: '' },
  details: { type: Array,  default: () => [] },
  actionLabel: { type: String, default: '查看建议' },
  show:    { type: Boolean, default: true },
})

const emit = defineEmits(['dismiss', 'action'])
const visible = ref(props.show)

const icon = computed(() => {
  const map = { rain: '🌧️', storm: '⛈️', wind: '💨', heat: '☀️' }
  return map[props.type] || '🌧️'
})

const typeLabel = computed(() => {
  const map = { rain: '小雨提醒', storm: '暴雨预警', wind: '大风注意', heat: '高温提示' }
  return map[props.type] || '天气提醒'
})

const cardStyle = computed(() => {
  const gradients = {
    rain:  'linear-gradient(135deg, #DCE8F0 0%, #E8F0F4 40%, #F0F4F6 100%)',
    storm: 'linear-gradient(135deg, #C8D4DE 0%, #D8E2E8 40%, #E4EAEE 100%)',
    wind:  'linear-gradient(135deg, #E8EDF0 0%, #F0F3F5 40%, #F5F6F7 100%)',
    heat:  'linear-gradient(135deg, #F5EDE4 0%, #F8F2EA 40%, #FBF7F2 100%)',
  }
  return { background: gradients[props.type] || gradients.rain }
})

function rainDropStyle(i) {
  const lefts = [15, 35, 55, 72, 88]
  const delays = [0, 0.8, 1.6, 0.4, 1.2]
  const durations = [2.5, 3.0, 2.2, 2.8, 3.2]
  return {
    left: lefts[i - 1] + '%',
    animationDelay: delays[i - 1] + 's',
    animationDuration: durations[i - 1] + 's',
  }
}

function dismiss() {
  visible.value = false
  emit('dismiss')
}

function onAction() {
  emit('action')
}
</script>

<style scoped>
.weather-alert-wrap {
  padding: 0 0 12px;
  overflow: hidden;
}

.weather-alert-card {
  position: relative;
  border-radius: 16px;
  padding: 16px 14px 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 2px 16px rgba(0,0,0,0.04);
}

/* ===== 雨滴动画 ===== */
.rain-drops {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.rain-drop {
  position: absolute;
  top: -20px;
  width: 2px;
  height: 16px;
  background: linear-gradient(180deg, transparent 0%, rgba(130,170,200,0.3) 50%, rgba(130,170,200,0.6) 100%);
  border-radius: 1px;
  animation: rain-fall linear infinite;
  opacity: 0;
}
@keyframes rain-fall {
  0%   { transform: translateY(-20px); opacity: 0; }
  10%  { opacity: 0.6; }
  80%  { opacity: 0.6; }
  100% { transform: translateY(120px); opacity: 0; }
}

/* ===== 内容 ===== */
.weather-content {
  position: relative;
  z-index: 1;
}
.weather-icon-row {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px;
}
.weather-icon {
  font-size: 28px;
  animation: icon-float 3s ease-in-out infinite;
}
@keyframes icon-float {
  0%, 100% { transform: translateY(0) }
  50% { transform: translateY(-3px) }
}
.weather-type {
  font-size: 14px; font-weight: 700;
  color: #5A7A8A;
  letter-spacing: 0.5px;
}
.weather-message {
  font-size: 15px; font-weight: 600;
  color: #4A5A64;
  margin: 0 0 10px;
  line-height: 1.5;
  font-family: 'Playfair Display', 'Georgia', serif;
  font-style: italic;
}
.weather-details {
  display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 4px;
}
.weather-detail {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #6A7A84;
  font-weight: 400;
}
.detail-dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #8AB0C0;
  flex-shrink: 0;
}

/* ===== 按钮 ===== */
.weather-actions {
  display: flex; gap: 8px;
  margin-top: 12px;
  position: relative; z-index: 1;
}
.weather-btn {
  flex: 1;
  height: 38px;
  border-radius: 19px;
  border: none;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s cubic-bezier(0.32, 0.72, 0, 1),
              opacity 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}
.weather-btn:active {
  transform: scale(0.95);
  opacity: 0.85;
}
.weather-btn.secondary {
  background: rgba(255,255,255,0.7);
  color: #5A7A8A;
  border: 1px solid rgba(130,170,200,0.2);
}
.weather-btn.primary {
  background: #7A9E76;
  color: #fff;
  box-shadow: 0 2px 8px rgba(122,158,118,0.2);
}

/* ===== 关闭按钮 ===== */
.weather-close {
  position: absolute;
  top: 10px; right: 10px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(0,0,0,0.04);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #8A9AA4;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
}
.weather-close:active {
  background: rgba(0,0,0,0.08);
  transform: scale(0.9);
}

/* ===== 过渡动画 ===== */
.weather-alert-enter-active {
  animation: weather-enter 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}
.weather-alert-leave-active {
  animation: weather-leave 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}
@keyframes weather-enter {
  0%   { transform: scale(0.92); opacity: 0; filter: blur(2px); }
  60%  { transform: scale(1.01); opacity: 1; }
  100% { transform: scale(1); opacity: 1; filter: blur(0); }
}
@keyframes weather-leave {
  0%   { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0; filter: blur(2px); }
}
</style>