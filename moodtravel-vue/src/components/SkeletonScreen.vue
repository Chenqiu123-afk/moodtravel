<template>
  <div>
    <div
      v-for="i in count"
      :key="i"
      :class="shapeClass"
      class="skeleton"
      :style="skeletonStyle"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  shape:  { type: String, default: 'text' },  // text | circle | rect | card | avatar
  width:  { type: String, default: '100%' },
  height: { type: String, default: '14px' },
  count:  { type: Number, default: 1 },
  gap:    { type: String, default: '8px' },
})

const shapeClass = computed(() => {
  return `skeleton-${props.shape}`
})

const skeletonStyle = computed(() => {
  const style = {
    width: props.width,
    height: props.height,
    marginBottom: props.gap,
  }
  if (props.shape === 'circle' || props.shape === 'avatar') {
    style.borderRadius = '50%'
  }
  return style
})
</script>

<style scoped>
.skeleton-text {
  border-radius: 6px;
}
.skeleton-text:last-child {
  width: 60%;
}
.skeleton-rect {
  border-radius: var(--skeleton-radius);
}
.skeleton-card {
  border-radius: var(--layout-card-radius);
  height: 120px;
}
</style>