<template>
  <!-- ================================================================ -->
  <!-- 地图缩略图组件 — 精选景点标注 + 情绪适配高亮 -->
  <!-- ================================================================ -->
  <div class="map-thumbnail" ref="mapEl">
    <div class="map-header">
      <span class="map-title">附近精选</span>
      <span class="map-subtitle" :style="{ color: accent }">{{ moodLabel }}适配</span>
    </div>

    <!-- 模拟地图画布 -->
    <div class="map-canvas" :style="{ background: mapBg }">
      <!-- 装饰网格线 -->
      <div class="map-grid">
        <div v-for="n in 6" :key="'h'+n" class="map-grid-h" />
        <div v-for="n in 8" :key="'v'+n" class="map-grid-v" />
      </div>

      <!-- 当前位置 -->
      <div class="map-current-loc" :style="{ top: '62%', left: '48%' }">
        <div class="loc-pulse" :style="{ borderColor: accent }" />
        <div class="loc-dot" :style="{ background: accent }" />
      </div>

      <!-- POI 标注点 -->
      <div
        v-for="(poi, i) in mapPois"
        :key="i"
        class="map-poi"
        :style="{ top: poi.y + '%', left: poi.x + '%' }"
        :class="{ highlighted: poi.highlight }"
        @mouseenter="hoveredPoi = i"
        @mouseleave="hoveredPoi = null"
      >
        <div class="poi-marker" :class="{ active: hoveredPoi === i }" :style="{ background: poi.highlight ? accent : '#6B7685' }">
          <span class="poi-icon">{{ poi.icon }}</span>
        </div>

        <!-- 悬停气泡 -->
        <Transition name="bubble-pop">
          <div v-if="hoveredPoi === i" class="poi-bubble">
            <span class="bubble-name">{{ poi.name }}</span>
            <span class="bubble-dist">{{ poi.distance }}</span>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 图例 -->
    <div class="map-legend">
      <div class="legend-item">
        <span class="legend-dot" :style="{ background: accent }" />
        <span>情绪推荐</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" :style="{ background: '#6B7685' }" />
        <span>常规地点</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot current" />
        <span>当前位置</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  mood: { type: String, default: 'calm' },
  accent: { type: String, default: '#FF6B6B' },
  moodLabel: { type: String, default: '平静' }
})

const mapEl = ref(null)
const hoveredPoi = ref(null)

// 背景渐变 — 根据情绪微调
const mapBg = computed(() => {
  const tints = {
    tired:   'linear-gradient(180deg, #EBF0F5 0%, #DCE4EC 100%)',
    excited: 'linear-gradient(180deg, #FFF5F0 0%, #FFE8D5 100%)',
    happy:   'linear-gradient(180deg, #F2F7F0 0%, #E5F0E0 100%)',
    calm:    'linear-gradient(180deg, #F2F5F0 0%, #E5EDE2 100%)',
    anxious: 'linear-gradient(180deg, #F5F2F8 0%, #EBE5F2 100%)',
    sad:     'linear-gradient(180deg, #FFEAD5 0%, #FFDDC0 100%)'
  }
  return tints[props.mood] || tints.calm
})

// 情绪驱动的 POI 数据
const mapPois = computed(() => {
  const allPois = [
    { name: '西湖苏堤', icon: '🌿', distance: '步行5分钟', y: 68, x: 52, mood: ['calm','tired','sad'] },
    { name: '青藤茶馆', icon: '🍵', distance: '步行12分钟', y: 55, x: 38, mood: ['calm','anxious','tired'] },
    { name: '知味观', icon: '🍜', distance: '步行10分钟', y: 72, x: 58, mood: ['happy','sad','tired'] },
    { name: '十里琅珰', icon: '🥾', distance: '车程20分钟', y: 38, x: 28, mood: ['excited','happy'] },
    { name: '雷峰塔', icon: '🌅', distance: '车程15分钟', y: 78, x: 44, mood: ['excited','happy','calm'] },
    { name: '梅家坞茶园', icon: '🌿', distance: '车程20分钟', y: 42, x: 62, mood: ['anxious','calm','tired'] },
    { name: '避世书局', icon: '📚', distance: '步行15分钟', y: 60, x: 72, mood: ['sad','calm','anxious'] },
    { name: '冥想空间', icon: '🧘', distance: '步行8分钟', y: 50, x: 48, mood: ['anxious','tired'] }
  ]
  return allPois.map(p => ({
    ...p,
    highlight: p.mood.includes(props.mood)
  }))
})
</script>

<style scoped>
/* ============================================================
   Map Thumbnail
   ============================================================ */
.map-thumbnail {
  background: var(--premium-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--premium-glass-border);
  border-radius: var(--premium-radius-md);
  padding: 20px;
  box-shadow: var(--premium-shadow-sm);
}

.map-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.map-title {
  font-family: var(--premium-font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--premium-text);
  letter-spacing: 0.3px;
}

.map-subtitle {
  font-size: 12px;
  font-weight: 500;
  font-family: var(--premium-font-body);
}

/* 地图画布 */
.map-canvas {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: var(--premium-radius-sm);
  overflow: hidden;
  margin-bottom: 14px;
  border: 1px solid rgba(42, 52, 64, 0.06);
}

/* 网格装饰 */
.map-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.map-grid-h {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: rgba(42, 52, 64, 0.04);
}
.map-grid-h:nth-child(1) { top: 16.66%; }
.map-grid-h:nth-child(2) { top: 33.33%; }
.map-grid-h:nth-child(3) { top: 50%; }
.map-grid-h:nth-child(4) { top: 66.66%; }
.map-grid-h:nth-child(5) { top: 83.33%; }
.map-grid-h:nth-child(6) { top: 100%; }

.map-grid-v {
  position: absolute;
  top: 0; bottom: 0;
  width: 1px;
  background: rgba(42, 52, 64, 0.04);
}
.map-grid-v:nth-child(1) { left: 12.5%; }
.map-grid-v:nth-child(2) { left: 25%; }
.map-grid-v:nth-child(3) { left: 37.5%; }
.map-grid-v:nth-child(4) { left: 50%; }
.map-grid-v:nth-child(5) { left: 62.5%; }
.map-grid-v:nth-child(6) { left: 75%; }
.map-grid-v:nth-child(7) { left: 87.5%; }
.map-grid-v:nth-child(8) { left: 100%; }

/* 当前位置 */
.map-current-loc {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
}

.loc-pulse {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid;
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: pulseGlow 2s ease-in-out infinite;
}

.loc-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 8px rgba(0,0,0,0.15);
}

/* POI 标注 */
.map-poi {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
  cursor: pointer;
}

.poi-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s var(--premium-easing);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  will-change: transform;
}

.poi-marker.active {
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 5;
}

.poi-marker.highlighted {
  animation: pulseGlow 2s ease-in-out infinite;
}

.poi-icon {
  font-size: 14px;
  line-height: 1;
}

/* 气泡 */
.poi-bubble {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--premium-text);
  color: white;
  padding: 6px 12px;
  border-radius: 10px;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 10;
}

.poi-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--premium-text);
}

.bubble-name {
  font-size: 11px;
  font-weight: 600;
}

.bubble-dist {
  font-size: 10px;
  opacity: 0.7;
}

/* 气泡过渡 */
.bubble-pop-enter-active {
  transition: all 0.25s var(--premium-easing-bounce);
}
.bubble-pop-leave-active {
  transition: all 0.15s var(--premium-easing);
}
.bubble-pop-enter-from {
  opacity: 0;
  transform: translateX(-50%) scale(0.8) translateY(8px);
}
.bubble-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.9);
}

/* 图例 */
.map-legend {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--premium-text-secondary);
  font-family: var(--premium-font-body);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.current {
  background: var(--premium-accent);
  animation: pulseGlow 2s ease-in-out infinite;
}

/* 长辈模式 */
[data-accessibility="elderly"] .map-thumbnail {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(0,0,0,0.08);
}
[data-accessibility="elderly"] .map-title { font-size: 18px; }
[data-accessibility="elderly"] .map-subtitle { font-size: 15px; }
[data-accessibility="elderly"] .map-canvas { height: 260px; }
[data-accessibility="elderly"] .poi-marker { width: 40px; height: 40px; }
[data-accessibility="elderly"] .poi-icon { font-size: 18px; }
[data-accessibility="elderly"] .legend-item { font-size: 14px; }
[data-accessibility="elderly"] .bubble-name { font-size: 14px; }
[data-accessibility="elderly"] .bubble-dist { font-size: 13px; }
</style>