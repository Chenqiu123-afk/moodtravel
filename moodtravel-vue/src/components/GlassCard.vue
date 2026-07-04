<template>
  <div class="glass-card" :style="cardStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  blur:     { type: Number, default: 12 },
  opacity:  { type: Number, default: 0.82 },
  padding:  { type: String, default: '' },
  elevated: { type: Boolean, default: false },
})

const cardStyle = computed(() => {
  const style = {}
  if (props.blur !== 12) {
    style['--glass-blur-sm'] = props.blur + 'px'
  }
  if (props.opacity !== 0.82) {
    style['--glass-opacity-card'] = props.opacity
  }
  if (props.padding) {
    style.padding = props.padding
  }
  if (props.elevated) {
    style.boxShadow = 'var(--shadow-elevate)'
  }
  return style
})
</script>