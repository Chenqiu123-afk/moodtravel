<template>
  <button
    class="mode-switch"
    :class="{ 'mode-travel': store.displayMode === 'travel' }"
    :style="modeStyle"
    @click="store.toggleDisplayMode()"
  >
    <span class="mode-icon">{{ store.displayMode === 'travel' ? '🧳' : '�' }}</span>
    <span class="mode-label">{{ store.displayMode === 'travel' ? '治愈旅行' : '日常出行' }}</span>
    <span class="mode-desc" :style="{ color: store.modeColor }">
      {{ store.displayMode === 'travel' ? '放松·探索' : '高效·便捷' }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useTravelStore } from '@/store/travel.js'

const store = useTravelStore()

const modeStyle = computed(() => {
  if (store.displayMode === 'travel') {
    return {
      borderColor: '#FFA50030',
      background: 'linear-gradient(135deg, #FFF8F0, #FFF3E6)',
      color: '#FFA500'
    }
  }
  return {
    borderColor: '#4682B430',
    background: 'linear-gradient(135deg, #F0F6FB, #E8F0F8)',
    color: '#4682B4'
  }
})
</script>

<style scoped>
.mode-switch {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.mode-switch:active {
  transform: scale(0.93);
}

.mode-icon {
  font-size: 16px;
  line-height: 1;
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.mode-switch.mode-travel .mode-icon {
  transform: rotate(-10deg) scale(1.1);
}

.mode-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.mode-desc {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.8;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255,255,255,0.5);
}

/* ================================================================
   长辈模式适配
   ================================================================ */
[data-accessibility="elderly"] .mode-switch {
  padding: 8px 18px;
  border-radius: 24px;
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 2px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 48px;
}

[data-accessibility="elderly"] .mode-icon {
  font-size: 20px;
}

[data-accessibility="elderly"] .mode-label {
  font-size: 16px;
  font-weight: 500;
}
</style>