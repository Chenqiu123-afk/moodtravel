<template>
  <!-- ================================================================ -->
  <!-- 玻璃背景层 — 自然风景 + 毛玻璃叠加 -->
  <!-- ================================================================ -->
  <div class="glass-bg-layer" aria-hidden="true">
    <div class="glass-bg-image" />
    <div class="glass-bg-overlay" />
  </div>

  <!-- ================================================================ -->
  <!-- 页面路由 + 弹簧过渡动画 -->
  <!-- ================================================================ -->
  <div class="scroll-container" style="height:100vh; overflow-y:auto">
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>

  <!-- ================================================================ -->
  <!-- 长辈模式：底部固定导航栏 -->
  <!-- ================================================================ -->
  <nav class="elderly-bottom-nav" v-if="store.elderlyMode">
    <button class="elderly-nav-btn" @click="$router.push('/home')">
      <span class="nav-icon">🏠</span>
      <span>首页</span>
    </button>
    <button class="elderly-nav-btn" @click="$router.push('/journal')">
      <span class="nav-icon">📝</span>
      <span>日记</span>
    </button>
    <button class="elderly-nav-btn" @click="$router.push('/plan')">
      <span class="nav-icon">📋</span>
      <span>行程</span>
    </button>
    <button class="elderly-nav-btn" @click="$router.push('/daily-care')">
      <span class="nav-icon">💌</span>
      <span>关怀</span>
    </button>
    <button class="elderly-nav-btn" @click="$router.push('/mine')">
      <span class="nav-icon">👤</span>
      <span>我的</span>
    </button>
  </nav>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useTravelStore } from '@/store/travel.js'
import { loadGoogleFonts } from '@/utils/compliance.js'

const store = useTravelStore()

const transitionName = computed(() => {
  return store.elderlyMode ? 'page-fade' : 'page-spring'
})

onMounted(() => {
  // 加载 Google Fonts
  loadGoogleFonts()
  const lastMood = localStorage.getItem('moodtravel_last_mood')
  if (lastMood) {
    const moodMap = {
      tired:   { label: 'tired', index: 2, emoji: '😴' },
      excited: { label: 'excited', index: 9, emoji: '🤩' },
      happy:   { label: 'happy', index: 8, emoji: '😄' },
      calm:    { label: 'calm', index: 5, emoji: '😌' },
      anxious: { label: 'anxious', index: 3, emoji: '😰' },
      sad:     { label: 'sad', index: 2, emoji: '😢' }
    }
    const mood = moodMap[lastMood]
    if (mood) store.setMood(mood.label, mood.index, mood.emoji)
  }
  const user = localStorage.getItem('moodtravel_user')
  if (user) {
    try { store.setLogin(JSON.parse(user)) } catch (e) {}
  }
  store.applyElderlyMode()
})
</script>

<style>
/* ================================================================
   CSS 变量 — 全屏高级版色彩系统
   主色：#F0F4F8（背景）｜#2A3440（文字）｜#FF6B6B（品牌色）
   ================================================================ */
:root {
  --premium-bg: #F0F4F8;
  --premium-bg-deep: #E4EAF0;
  --premium-text: #2A3440;
  --premium-text-secondary: #6B7685;
  --premium-text-muted: #99A3B0;
  --premium-accent: #FF6B6B;
  --premium-accent-light: #FF8E8E;
  --premium-accent-glow: rgba(255, 107, 107, 0.18);
  --premium-white: #FFFFFF;
  --premium-glass: rgba(255, 255, 255, 0.72);
  --premium-glass-border: rgba(255, 255, 255, 0.36);
  --premium-shadow-sm: 0 2px 12px rgba(42, 52, 64, 0.04);
  --premium-shadow-md: 0 8px 32px rgba(42, 52, 64, 0.06);
  --premium-shadow-lg: 0 16px 48px rgba(42, 52, 64, 0.08);
  --premium-radius-sm: 12px;
  --premium-radius-md: 20px;
  --premium-radius-lg: 28px;
  --premium-radius-xl: 36px;
  --premium-font-display: 'Montserrat', 'Inter', system-ui, sans-serif;
  --premium-font-body: 'Inter', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  --premium-font-serif: 'Playfair Display', 'Georgia', serif;
  --premium-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --premium-easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 情绪驱动的全局色调微调 */
[data-mood="tired"]   { --premium-mood-tint: #EBF0F5; }
[data-mood="excited"] { --premium-mood-tint: #FFF5F0; }
[data-mood="happy"]   { --premium-mood-tint: #F2F7F0; }
[data-mood="calm"]    { --premium-mood-tint: #F2F5F0; }
[data-mood="anxious"] { --premium-mood-tint: #F5F2F8; }
[data-mood="sad"]     { --premium-mood-tint: #FFEAD5; }

/* ================================================================
   页面过渡动画 — iOS 弹簧效果（青年模式）
   仅使用 transform + opacity，保证 60fps
   ================================================================ */
.page-spring-enter-active {
  transition: all 0.45s cubic-bezier(0.32, 0.72, 0, 1);
}
.page-spring-leave-active {
  transition: all 0.2s cubic-bezier(0.55, 0, 1, 0.45);
}
.page-spring-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}
.page-spring-leave-to {
  opacity: 0;
  transform: translateX(-24px) scale(0.98);
  filter: blur(4px);
}

/* 长辈模式：极速淡入淡出，无位移 */
.page-fade-enter-active {
  transition: opacity 0.15s ease-out;
}
.page-fade-leave-active {
  transition: opacity 0.10s ease-in;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* ================================================================
   全局微交互系统
   按钮悬停：边框光晕 + 背景透明度提升
   输入聚焦：微缩放 102% → 100%
   按压反馈：scale(0.97) + opacity 0.85
   所有动画 ≤ 300ms
   ================================================================ */
a, button, [role="button"],
input, textarea, select,
.mood-item, .toggle-row, .setting-row, .preview-card,
.timeline-card, .budget-preset, .add-btn, .companion-remove,
.guide-timeline-item, .nav-right, .book-btn, .elderly-nav-btn {
  transition: transform 0.18s var(--premium-easing),
              opacity 0.18s var(--premium-easing),
              box-shadow 0.25s var(--premium-easing),
              border-color 0.25s var(--premium-easing);
  will-change: transform;
}

/* 按钮悬停：1px 光晕 + 背景提升 */
button:not(:disabled):hover,
[role="button"]:hover {
  box-shadow: 0 0 0 1px rgba(255, 107, 107, 0.25), var(--premium-shadow-sm);
}

/* 输入框聚焦：微缩放 */
input:focus, textarea:focus, select:focus {
  outline: none;
  animation: inputFocusIn 0.3s var(--premium-easing) forwards;
}

@keyframes inputFocusIn {
  0%   { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* 按压反馈 */
a:active, button:active, [role="button"]:active,
.mood-item:active, .toggle-row:active, .setting-row:active, .preview-card:active,
.timeline-card:active, .budget-preset:active, .add-btn:active, .companion-remove:active,
.guide-timeline-item:active, .nav-right:active, .book-btn:active, .elderly-nav-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

/* 长辈模式：更明显的反馈 */
[data-accessibility="elderly"] a:active,
[data-accessibility="elderly"] button:active,
[data-accessibility="elderly"] [role="button"]:active,
[data-accessibility="elderly"] .mood-item:active,
[data-accessibility="elderly"] .toggle-row:active,
[data-accessibility="elderly"] .setting-row:active,
[data-accessibility="elderly"] .preview-card:active,
[data-accessibility="elderly"] .timeline-card:active,
[data-accessibility="elderly"] .budget-preset:active,
[data-accessibility="elderly"] .add-btn:active,
[data-accessibility="elderly"] .companion-remove:active,
[data-accessibility="elderly"] .guide-timeline-item:active,
[data-accessibility="elderly"] .nav-right:active,
[data-accessibility="elderly"] .book-btn:active,
[data-accessibility="elderly"] .elderly-nav-btn:active {
  transform: scale(0.93);
  opacity: 0.75;
}

/* ================================================================
   全局滚动条美化
   ================================================================ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(42, 52, 64, 0.12);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(42, 52, 64, 0.24);
}

/* ================================================================
   骨架屏关键帧
   ================================================================ */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.25); }
  50%      { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>