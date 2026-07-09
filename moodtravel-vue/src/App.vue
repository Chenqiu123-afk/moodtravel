<template>
  <!-- ================================================================ -->
  <!-- 玻璃背景层 — 桌面端才有，手机端隐藏 -->
  <!-- ================================================================ -->
  <div class="glass-bg-layer" aria-hidden="true">
    <div class="glass-bg-gradient" />
  </div>

  <!-- ================================================================ -->
  <!-- 桌面端侧边导航 -->
  <!-- ================================================================ -->
  <nav class="desktop-sidebar" v-if="route.path !== '/login'">
    <div class="sidebar-brand" @click="$router.push('/home')">
      <span class="sidebar-logo">{{ store.moodEmoji }}</span>
      <span class="sidebar-name">MoodTravel</span>
    </div>
    <div class="sidebar-links">
      <button
        v-for="tab in bottomTabs"
        :key="tab.path"
        class="sidebar-link"
        :class="{ active: isTabActive(tab.path) }"
        @click="$router.push(tab.path)"
      >
        <span class="sidebar-icon">{{ tab.icon }}</span>
        <span class="sidebar-label">{{ tab.label }}</span>
      </button>
    </div>
    <div class="sidebar-footer">
      <span class="privacy-text">🛡️ 隐私至上</span>
    </div>
  </nav>

  <!-- ================================================================ -->
  <!-- 页面路由 + 弹簧过渡动画 -->
  <!-- ================================================================ -->
  <div class="main-area" :class="{ 'with-sidebar': route.path !== '/login' }">
    <div class="scroll-container">
      <router-view v-slot="{ Component, route: r }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="r.path" />
        </transition>
      </router-view>

      <!-- 隐私声明 — 手机端才显示 -->
      <div class="privacy-footer" v-if="route.path !== '/login'">
        <span>🛡️ 你的感受，只属于你。我们仅在本地浏览器瞬间感知你的状态以提供陪伴，不记录任何行为轨迹，关闭网页即烟消云散。</span>
      </div>
    </div>
  </div>

  <!-- ================================================================ -->
  <!-- 底部导航栏 — 仅手机端显示 -->
  <!-- ================================================================ -->
  <nav class="bottom-tab-bar" :class="{ 'elderly-nav': store.elderlyMode }" v-if="route.path !== '/login'">
    <button
      v-for="tab in bottomTabs"
      :key="tab.path"
      class="tab-btn"
      :class="{ active: isTabActive(tab.path) }"
      @click="$router.push(tab.path)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import { loadGoogleFonts } from '@/utils/compliance.js'

const store = useTravelStore()
const route = useRoute()

const transitionName = computed(() => {
  return store.elderlyMode ? 'page-fade' : 'page-spring'
})

const bottomTabs = [
  { path: '/home', icon: '🏠', label: '首页' },
  { path: '/journal', icon: '📝', label: '日记' },
  { path: '/plan', icon: '📋', label: '行程' },
  { path: '/daily-care', icon: '💌', label: '关怀' },
  { path: '/mine', icon: '👤', label: '我的' }
]

function isTabActive(path) {
  return route.path === path
}

onMounted(() => {
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
   App-level CSS — 移动优先
   ================================================================ */
:root {
  --tab-bar-height: 56px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --sidebar-width: 200px;
}

/* 情绪驱动的全局色调 */
[data-mood="tired"]   { --mood-tint: #EBF0F5; }
[data-mood="excited"] { --mood-tint: #FFF5F0; }
[data-mood="happy"]   { --mood-tint: #F2F7F0; }
[data-mood="calm"]    { --mood-tint: #F2F5F0; }
[data-mood="anxious"] { --mood-tint: #F5F2F8; }
[data-mood="sad"]     { --mood-tint: #FFEAD5; }

/* ================================================================
   页面过渡 — 120fps GPU
   ================================================================ */
.page-spring-enter-active {
  transition: opacity var(--duration-400) var(--spring-responsive),
              transform var(--duration-400) var(--spring-responsive);
}
.page-spring-leave-active {
  transition: opacity var(--duration-150) var(--ease-out-expo),
              transform var(--duration-150) var(--ease-out-expo);
}
.page-spring-enter-from { opacity: 0; transform: translateY(16px) scale(0.98); }
.page-spring-leave-to   { opacity: 0; transform: translateY(-8px); }

.page-fade-enter-active { transition: opacity 0.15s ease-out; }
.page-fade-leave-active { transition: opacity 0.10s ease-in; }
.page-fade-enter-from, .page-fade-leave-to { opacity: 0; }

/* ================================================================
   全局微交互
   ================================================================ */
button, [role="button"], a, input, textarea, select {
  transition: transform var(--duration-150) var(--spring-responsive),
              opacity var(--duration-150) var(--ease-out-expo);
}
button:active, [role="button"]:active, a:active {
  transform: scale(0.97);
  opacity: 0.85;
}
button, [role="button"], .tab-btn, .sidebar-link {
  min-height: 44px;
  min-width: 44px;
}
[data-accessibility="elderly"] button:active,
[data-accessibility="elderly"] [role="button"]:active,
[data-accessibility="elderly"] a:active {
  transform: scale(0.93);
  opacity: 0.75;
}

::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.06); border-radius: 3px; }

/* ================================================================
   背景层 — 桌面端有渐变光晕
   ================================================================ */
.glass-bg-layer {
  display: none;
}
@media (min-width: 768px) {
  .glass-bg-layer {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .glass-bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(165deg,
      var(--theme-bg, #F9F6F1) 0%,
      var(--theme-bg-gradient, #F0ECE5) 50%,
      var(--theme-primary-light, #C5D5C8)10 100%
    );
    transition: background 1.2s var(--spring-responsive);
  }
}

/* ================================================================
   主内容区 — 手机端：暖调渐变 + CSS噪点纹理
   噪点纹理模拟纸张质感，告别塑料平板色
   ================================================================ */
.main-area {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(175deg, #FBF9F5 0%, #F7F3EC 40%, #F2EEE6 100%);
}
/* 噪点纹理叠加层 */
.main-area::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
}
.main-area.with-sidebar {
  padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom));
}
.scroll-container {
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  scroll-behavior: smooth;
}

@media (min-width: 768px) {
  .main-area { background: transparent; }
  .main-area::before { display: none; }
  .main-area.with-sidebar {
    margin-left: var(--sidebar-width);
    padding-bottom: 0;
  }
}

/* ================================================================
   桌面端侧边导航
   ================================================================ */
.desktop-sidebar { display: none; }
@media (min-width: 768px) {
  .desktop-sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: var(--sidebar-width);
    z-index: 200;
    background: rgba(255,255,255,0.5);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border-right: 0.5px solid rgba(255,255,255,0.3);
    padding: 28px 0;
    box-shadow: 2px 0 32px rgba(0,0,0,0.03);
  }
  .sidebar-brand {
    display: flex; align-items: center; gap: 10px;
    padding: 0 20px 28px; cursor: pointer;
    border-bottom: 0.5px solid rgba(0,0,0,0.04);
    margin-bottom: 16px; transition: opacity 0.3s;
  }
  .sidebar-brand:hover { opacity: 0.8; }
  .sidebar-logo {
    font-size: 26px; width: 44px; height: 44px;
    border-radius: 14px;
    background: var(--theme-primary-light, #C5D5C8)20;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.3s var(--spring-responsive);
  }
  .sidebar-brand:hover .sidebar-logo { transform: scale(1.08); }
  .sidebar-name {
    font-size: 18px; font-weight: 200; letter-spacing: 3px;
    color: var(--color-text-primary);
  }
  .sidebar-links { flex: 1; display: flex; flex-direction: column; padding: 0 12px; gap: 2px; }
  .sidebar-link {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; border: none; background: transparent;
    border-radius: 12px; cursor: pointer; font-family: inherit;
    font-size: 14px; font-weight: 400; color: var(--color-text-secondary);
    position: relative; transition: all 0.25s var(--spring-responsive);
  }
  .sidebar-link:hover { background: rgba(0,0,0,0.03); transform: translateX(4px); color: var(--color-text-primary); }
  .sidebar-link.active { background: var(--theme-primary-light, #C5D5C8)20; color: var(--theme-primary, #7A9E76); font-weight: 500; }
  .sidebar-link.active::before {
    content: ''; position: absolute; left: 0; top: 50%;
    transform: translateY(-50%); width: 3px; height: 20px;
    background: var(--theme-primary, #7A9E76); border-radius: 0 3px 3px 0;
  }
  .sidebar-icon { font-size: 20px; width: 28px; text-align: center; transition: transform 0.25s var(--spring-responsive); }
  .sidebar-link:hover .sidebar-icon { transform: scale(1.15); }
  .sidebar-footer { padding: 16px 20px 0; border-top: 0.5px solid rgba(0,0,0,0.04); margin-top: 16px; }
  .privacy-text { font-size: 10px; font-weight: 300; color: var(--color-text-quaternary); opacity: 0.5; }
}

/* ================================================================
   底部导航栏 — 手机端真正的磨砂玻璃
   单个 backdrop-filter 不会影响性能
   ================================================================ */
.bottom-tab-bar {
  display: flex;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  max-width: 480px;
  margin: 0 auto;
  height: calc(var(--tab-bar-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: rgba(254, 253, 251, 0.8);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  box-shadow:
    0 -0.5px 0 rgba(255,255,255,0.6),
    0 -2px 8px rgba(0,0,0,0.04);
  z-index: 100;
  justify-content: space-around;
  align-items: center;
  will-change: transform;
  transform: translateZ(0);
}
@media (min-width: 768px) {
  .bottom-tab-bar { display: none; }
}

.bottom-tab-bar.elderly-nav {
  background: #FFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: 0 -0.5px 0 rgba(0,0,0,0.08), 0 -4px 12px rgba(0,0,0,0.06);
}

.tab-btn {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px; padding: 4px 8px;
  border: none; background: transparent;
  cursor: pointer; font-family: inherit;
  flex: 1; min-height: 44px;
  transition: transform var(--duration-150) var(--spring-responsive);
  -webkit-tap-highlight-color: transparent;
  position: relative;
}
.tab-btn:active { transform: scale(0.88); }

.tab-btn.active::before {
  content: ''; position: absolute;
  top: -2px; left: 50%; transform: translateX(-50%);
  width: 20px; height: 2.5px; border-radius: 2px;
  background: var(--theme-primary, #7A9E76);
  transition: background var(--duration-300);
}

.tab-icon {
  font-size: 20px; line-height: 1;
  transition: transform var(--duration-300) var(--spring-bouncy);
}
.tab-btn.active .tab-icon { transform: scale(1.15); }
.tab-label {
  font-size: 10px; font-weight: 400;
  color: var(--color-text-tertiary);
  transition: color var(--duration-300);
  letter-spacing: 0.5px;
}
.tab-btn.active .tab-label { color: var(--theme-primary, #7A9E76); font-weight: 500; }

[data-accessibility="elderly"] .tab-icon { font-size: 24px; }
[data-accessibility="elderly"] .tab-label { font-size: 13px; font-weight: 600; }
[data-accessibility="elderly"] .bottom-tab-bar { height: calc(68px + var(--safe-bottom)); }

/* ================================================================
   隐私声明
   ================================================================ */
.privacy-footer {
  padding: 16px 24px 90px;
  text-align: center;
  font-size: 10px; font-weight: 300;
  color: var(--color-text-quaternary);
  opacity: 0.35;
  line-height: 1.5; letter-spacing: 0.5px;
  max-width: 480px; margin: 0 auto;
}
@media (min-width: 768px) { .privacy-footer { display: none; } }
</style>