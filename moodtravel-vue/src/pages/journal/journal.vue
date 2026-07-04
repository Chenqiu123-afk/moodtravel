<template>
  <!-- ================================================================ -->
  <!-- 情绪日记页 — 情绪时光轴，记录每一天的内心天气 -->
  <!-- ================================================================ -->
  <div class="journal-page" :style="{ background: gradientBg }">
    <!-- 顶部 -->
    <header class="journal-top">
      <button class="journal-back" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <div class="journal-header">
        <span class="journal-title">情绪日记</span>
        <span class="journal-sub" :style="{ color: theme.primary }">
          已记录 {{ store.totalCheckIns }} 天
        </span>
      </div>
    </header>

    <!-- 统计卡片 -->
    <div class="stats-card glass-card">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num" :style="{ color: theme.primary }">{{ store.dailyStreak }}</span>
          <span class="stat-label">连续打卡</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-num" :style="{ color: theme.primary }">{{ store.totalCheckIns }}</span>
          <span class="stat-label">累计记录</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-num">{{ dominantMood.emoji }}</span>
          <span class="stat-label">近期情绪</span>
        </div>
      </div>
      <!-- 最近7天情绪条 -->
      <div class="week-bar">
        <div
          v-for="(d, i) in weekMoods"
          :key="i"
          class="week-dot"
          :class="{ empty: !d }"
          :style="d ? { background: d.color } : {}"
          :title="d ? d.label : ''"
        >
          <span v-if="d" class="week-emoji">{{ d.emoji }}</span>
          <span v-else class="week-empty">·</span>
        </div>
      </div>
    </div>

    <!-- 打卡区（今日未打卡时显示） -->
    <MoodCheckIn
      v-if="!store.checkedInToday"
      class="checkin-card"
      @goJournal="scrollToEntries"
    />

    <!-- 日记列表 -->
    <div class="entries-section" ref="entriesEl">
      <div class="section-title">
        <span class="title-icon">📖</span>
        <span class="title-text">记录时光</span>
      </div>

      <div v-if="store.moodJournal.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <span class="empty-title">还没有记录</span>
        <span class="empty-desc">记录下今天的心情，开始你的情绪之旅吧</span>
      </div>

      <TransitionGroup name="entry" tag="div" class="entries-list">
        <div
          v-for="entry in store.moodJournal"
          :key="entry.timestamp"
          class="entry-card glass-card"
        >
          <div class="entry-left">
            <div class="entry-emoji-ring" :style="{ background: entryColor(entry.mood) + '15' }">
              <span class="entry-emoji">{{ entry.emoji }}</span>
            </div>
          </div>
          <div class="entry-body">
            <div class="entry-header">
              <span class="entry-date">{{ formatDate(entry.date) }}</span>
              <span class="entry-mood-tag" :style="{ background: entryColor(entry.mood) + '18', color: entryColor(entry.mood) }">
                {{ moodLabel(entry.mood) }}
              </span>
            </div>
            <p v-if="entry.note" class="entry-note">{{ entry.note }}</p>
            <p v-else class="entry-note empty-note">这一天，没有留下文字</p>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import MoodCheckIn from '@/components/MoodCheckIn.vue'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)
const entriesEl = ref(null)

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 30%)`
})

const moodMap = {
  happy:   { label: '开心', emoji: '😊', color: '#8BA88C' },
  calm:    { label: '平静', emoji: '😌', color: '#A3B5A6' },
  tired:   { label: '疲惫', emoji: '😴', color: '#6B8FA3' },
  anxious: { label: '焦虑', emoji: '😰', color: '#B5A3C4' },
  sad:     { label: '低落', emoji: '😢', color: '#C4A8A8' },
  excited: { label: '兴奋', emoji: '🤩', color: '#E8945A' }
}

const dominantMood = computed(() => {
  const recent = store.moodJournal.slice(0, 7)
  if (!recent.length) return { emoji: '🌸', label: '--' }
  const counts = {}
  recent.forEach(e => { counts[e.mood] = (counts[e.mood] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  return moodMap[top] || { emoji: '🌸', label: '--' }
})

const weekMoods = computed(() => {
  const result = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const entry = store.moodJournal.find(e => e.date === dateStr)
    result.push(entry ? moodMap[entry.mood] || null : null)
  }
  return result
})

function entryColor(mood) {
  return (moodMap[mood] || moodMap.calm).color
}

function moodLabel(mood) {
  return (moodMap[mood] || moodMap.calm).label
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (diff < 1) return '今天'
  if (diff < 2) return '昨天'
  if (diff < 3) return '前天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function scrollToEntries() {
  entriesEl.value?.scrollIntoView({ behavior: 'smooth' })
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.journal-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}

/* ===== 顶部栏 ===== */
.journal-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 44px 0 16px;
}

.journal-back {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.back-arrow {
  font-size: 18px;
  color: #888;
}

.journal-header {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.journal-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text, #3A3A3A);
}

.journal-sub {
  font-size: 12px;
  font-weight: 600;
  transition: color 0.5s;
}

/* ===== 统计卡片 ===== */
.stats-card {
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.03));
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text, #3A3A3A);
  transition: color 0.5s;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-light, #9A9A9A);
  font-weight: 400;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #E8E4DC;
}

/* 近7天情绪条 */
.week-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.week-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.week-dot.empty {
  background: #F0EDE8;
}

.week-emoji {
  font-size: 16px;
  line-height: 1;
}

.week-empty {
  font-size: 14px;
  color: #D0CCC4;
}

/* ===== 打卡卡片 ===== */
.checkin-card {
  margin-bottom: 16px;
}

/* ===== 日记列表 ===== */
.entries-section {
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.title-icon { font-size: 16px; }

.title-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entry-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  box-shadow: var(--shadow-card, 0 1px 6px rgba(0,0,0,0.02));
}

.entry-emoji-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.5s;
}

.entry-emoji {
  font-size: 20px;
  line-height: 1;
}

.entry-body {
  flex: 1;
  min-width: 0;
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.entry-date {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
}

.entry-mood-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  transition: all 0.5s;
}

.entry-note {
  margin: 0;
  font-size: 13px;
  color: var(--color-text, #4A4A4A);
  line-height: 1.6;
  font-weight: 400;
}

.entry-note.empty-note {
  color: #C0BCB4;
  font-style: italic;
  font-size: 12px;
}

/* 列表动画 */
.entry-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.entry-leave-active {
  transition: all 0.25s ease-in;
}
.entry-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.entry-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.entry-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 空态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
  display: block;
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-light, #9A9A9A);
}

.safe-bottom { height: 20px }

/* 长辈模式 */
[data-accessibility="elderly"] .journal-title {
  font-size: 22px;
}

[data-accessibility="elderly"] .stat-num {
  font-size: 30px;
}

[data-accessibility="elderly"] .stat-label {
  font-size: 14px;
}

[data-accessibility="elderly"] .week-dot {
  width: 40px;
  height: 40px;
}

[data-accessibility="elderly"] .entry-card {
  padding: 18px;
}

[data-accessibility="elderly"] .entry-date {
  font-size: 16px;
}

[data-accessibility="elderly"] .entry-note {
  font-size: 16px;
}
</style>