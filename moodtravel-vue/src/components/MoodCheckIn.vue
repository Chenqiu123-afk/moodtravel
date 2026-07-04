<template>
  <!-- ================================================================ -->
  <!-- 心情打卡组件 — 每日情绪快照，轻量交互，零门槛 -->
  <!-- 可嵌入首页或独立使用 -->
  <!-- ================================================================ -->
  <div class="mood-checkin" :class="{ 'checked-in': store.checkedInToday }">
    <!-- 已打卡：展示今日状态 -->
    <div v-if="store.checkedInToday" class="checkin-done">
      <div class="done-glow" :style="{ background: glowBg }" />
      <div class="done-inner">
        <span class="done-emoji">{{ todayEntry?.emoji || '🌸' }}</span>
        <div class="done-text">
          <span class="done-title">今日已记录</span>
          <span class="done-sub">
            已连续打卡 <b :style="{ color: theme.primary }">{{ store.dailyStreak }}</b> 天
          </span>
          <span v-if="todayEntry?.note" class="done-note">"{{ todayEntry.note }}"</span>
        </div>
        <span class="done-arrow" @click="$emit('goJournal')">查看日记 ›</span>
      </div>
    </div>

    <!-- 未打卡：情绪选择器 -->
    <div v-else class="checkin-prompt">
      <div class="prompt-header">
        <span class="prompt-wave">👋</span>
        <span class="prompt-question">今天感觉怎么样？</span>
      </div>

      <!-- 情绪按钮组 -->
      <div class="emotion-row">
        <button
          v-for="emo in emotions"
          :key="emo.key"
          class="emotion-btn"
          :class="{ selected: selectedMood === emo.key }"
          :style="selectedMood === emo.key ? { borderColor: emo.color, background: emo.color + '12', boxShadow: `0 0 0 3px ${emo.color}15` } : {}"
          @click="selectMood(emo)"
        >
          <span class="emotion-emoji">{{ emo.emoji }}</span>
          <span class="emotion-label">{{ emo.label }}</span>
        </button>
      </div>

      <!-- 备注输入（选中情绪后展开） -->
      <transition name="note-expand">
        <div v-if="selectedMood" class="note-area">
          <input
            ref="noteInput"
            v-model="noteText"
            class="note-input"
            placeholder="随便写点什么..."
            maxlength="60"
            @keydown.enter="confirmCheckIn"
          />
          <button
            class="note-confirm"
            :style="{ background: theme.primary }"
            @click="confirmCheckIn"
          >
            ✓ 记录这一刻
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useTravelStore } from '@/store/travel.js'

const emit = defineEmits(['goJournal'])
const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const selectedMood = ref(null)
const noteText = ref('')
const noteInput = ref(null)

const emotions = [
  { key: 'happy',   emoji: '😊', label: '开心',   color: '#8BA88C' },
  { key: 'calm',    emoji: '😌', label: '平静',   color: '#A3B5A6' },
  { key: 'tired',   emoji: '😴', label: '疲惫',   color: '#6B8FA3' },
  { key: 'anxious', emoji: '😰', label: '焦虑',   color: '#B5A3C4' },
  { key: 'sad',     emoji: '😢', label: '低落',   color: '#C4A8A8' },
  { key: 'excited', emoji: '🤩', label: '兴奋',   color: '#E8945A' }
]

const todayEntry = computed(() => {
  if (!store.moodJournal.length) return null
  const today = new Date().toISOString().slice(0, 10)
  return store.moodJournal.find(e => e.date === today) || null
})

const glowBg = computed(() => {
  const t = theme.value
  return `radial-gradient(circle, ${t.primary}10 0%, transparent 70%)`
})

function selectMood(emo) {
  selectedMood.value = emo.key
  nextTick(() => noteInput.value?.focus())
}

function confirmCheckIn() {
  if (!selectedMood.value) return
  const emo = emotions.find(e => e.key === selectedMood.value)
  store.checkInToday(selectedMood.value, emo?.emoji || '🌸', noteText.value.trim())
  selectedMood.value = null
  noteText.value = ''
}
</script>

<style scoped>
.mood-checkin {
  position: relative;
  border-radius: 16px;
  background: var(--color-card, rgba(255,255,255,0.7));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0,0,0,0.04);
  overflow: hidden;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.03));
}

/* ===== 已打卡态 ===== */
.checkin-done {
  position: relative;
  padding: 16px;
}

.done-glow {
  position: absolute;
  inset: -20px;
  pointer-events: none;
  opacity: 0.5;
}

.done-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.done-emoji {
  font-size: 36px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.06));
}

.done-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.done-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
}

.done-sub {
  font-size: 12px;
  color: var(--color-text-light, #9A9A9A);
  font-weight: 400;
}

.done-note {
  font-size: 11px;
  color: var(--color-text-light, #B0B0B0);
  font-style: italic;
  margin-top: 2px;
}

.done-arrow {
  font-size: 13px;
  color: var(--theme-primary, #A3B5A6);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.done-arrow:active {
  opacity: 0.6;
}

/* ===== 未打卡态 ===== */
.checkin-prompt {
  padding: 16px;
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.prompt-wave {
  font-size: 24px;
  animation: waveHand 2s ease-in-out infinite;
  transform-origin: 70% 70%;
}

@keyframes waveHand {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(14deg); }
  50%      { transform: rotate(-8deg); }
  75%      { transform: rotate(10deg); }
}

.prompt-question {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
}

/* 情绪按钮组 */
.emotion-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.emotion-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.emotion-btn:active {
  transform: scale(0.93);
}

.emotion-emoji {
  font-size: 28px;
  line-height: 1;
  transition: transform 0.25s;
}

.emotion-btn.selected .emotion-emoji {
  transform: scale(1.15);
}

.emotion-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text, #4A4A4A);
}

/* 备注输入 */
.note-area {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}

.note-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.6);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text, #3A3A3A);
  outline: none;
  font-family: inherit;
  transition: border-color 0.3s;
}

.note-input:focus {
  border-color: var(--theme-primary, #A3B5A6);
}

.note-input::placeholder {
  color: #C0BCB4;
  font-weight: 300;
}

.note-confirm {
  padding: 10px 16px;
  border-radius: 20px;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.note-confirm:active {
  transform: scale(0.93);
  opacity: 0.85;
}

/* 展开动画 */
.note-expand-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.note-expand-leave-active {
  transition: all 0.2s ease-in;
}
.note-expand-enter-from {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.note-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 长辈模式适配 */
[data-accessibility="elderly"] .emotion-btn {
  padding: 14px 8px;
  border-radius: 14px;
}

[data-accessibility="elderly"] .emotion-emoji {
  font-size: 34px;
}

[data-accessibility="elderly"] .emotion-label {
  font-size: 15px;
}

[data-accessibility="elderly"] .done-emoji {
  font-size: 44px;
}

[data-accessibility="elderly"] .done-title {
  font-size: 18px;
}

[data-accessibility="elderly"] .done-sub {
  font-size: 14px;
}

[data-accessibility="elderly"] .note-input {
  font-size: 16px;
  padding: 12px 18px;
}

[data-accessibility="elderly"] .note-confirm {
  font-size: 16px;
  padding: 12px 20px;
}
</style>