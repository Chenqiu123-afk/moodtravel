<template>
  <!-- ================================================================ -->
  <!-- 情绪记录弹窗 — 三步式情绪快照，轻量交互，加密本地存储 -->
  <!-- ================================================================ -->
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <!-- 头部 -->
        <div class="modal-header">
          <span class="modal-title">记录此刻的情绪</span>
          <button class="modal-close" @click="$emit('close')" aria-label="关闭">✕</button>
        </div>

        <!-- 步骤 1：情绪选择 -->
        <div v-if="step === 1" class="modal-step">
          <div class="emotion-grid">
            <button
              v-for="opt in EMOTION_RECORD_OPTIONS"
              :key="opt.key"
              class="emotion-btn"
              :class="{ selected: selectedEmotion?.key === opt.key }"
              :style="selectedEmotion?.key === opt.key ? {
                borderColor: opt.color,
                background: opt.color + '14',
                boxShadow: `0 0 0 3px ${opt.color}18`
              } : {}"
              @click="selectEmotion(opt)"
            >
              <span class="emotion-emoji">{{ opt.emoji }}</span>
              <span class="emotion-label">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- 步骤 2：强度选择 -->
        <div v-if="step === 2" class="modal-step">
          <div class="step-label">当前感受有多强烈？</div>
          <div class="intensity-options">
            <button
              v-for="level in INTENSITY_LEVELS"
              :key="level.value"
              class="intensity-btn"
              :class="{ selected: selectedIntensity === level.value, high: level.value >= 4 }"
              @click="selectIntensity(level.value)"
            >
              <span class="intensity-emoji">{{ level.emoji }}</span>
              <span class="intensity-label">{{ level.label }}</span>
            </button>
          </div>
          <button class="back-btn" @click="step = 1">← 返回重新选择情绪</button>
        </div>

        <!-- 步骤 3：备注 -->
        <div v-if="step === 3" class="modal-step">
          <div class="step-label">还有什么想说的？</div>
          <textarea
            v-model="noteText"
            class="note-textarea"
            placeholder="想说的话..."
            maxlength="200"
            rows="3"
          />
          <button class="back-btn" @click="step = 2">← 返回调整强度</button>
        </div>

        <!-- 底部操作区 -->
        <div class="modal-footer">
          <button
            v-if="step < 3"
            class="submit-btn"
            :disabled="!canProceed"
            :style="canProceed ? { background: selectedEmotion?.color || '#A3B5A6' } : {}"
            @click="nextStep"
          >
            {{ step === 1 ? '下一步' : '下一步' }} →
          </button>
          <button
            v-else
            class="submit-btn"
            :style="{ background: selectedEmotion?.color || '#A3B5A6' }"
            @click="handleSubmit"
          >
            {{ selectedEmotion?.emoji }} 记录
          </button>
        </div>

        <!-- 免责声明 -->
        <div class="disclaimer-section">
          <p class="disclaimer-text">{{ EMOTIONAL_DISCLAIMER.short }}</p>
        </div>

        <!-- 高强度警告 -->
        <div v-if="selectedIntensity >= 4" class="intensity-warning">
          <div class="warning-header">
            <span class="warning-icon">⚠️</span>
            <span class="warning-title">请注意</span>
          </div>
          <p class="warning-body">{{ EMOTIONAL_DISCLAIMER.full }}</p>
          <div class="warning-resources">
            <a
              v-for="res in intensityResources"
              :key="res.name"
              class="resource-link"
              :href="res.url || '#'"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ res.name }}
              <span v-if="res.phone">：{{ res.phone }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  EMOTION_RECORD_OPTIONS,
  INTENSITY_LEVELS,
  getEmotionResponse,
  EMOTIONAL_DISCLAIMER,
  encryptEmotionData
} from '@/data/emotionResponseData.js'
import { useTravelStore } from '@/store/travel.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'recorded'])

const store = useTravelStore()

const step = ref(1)
const selectedEmotion = ref(null)
const selectedIntensity = ref(1)
const noteText = ref('')

const canProceed = computed(() => {
  if (step.value === 1) return !!selectedEmotion.value
  if (step.value === 2) return true
  return true
})

const intensityResources = computed(() => {
  if (!selectedEmotion.value) return []
  const response = getEmotionResponse(selectedEmotion.value.key, selectedIntensity.value)
  return response.resources || []
})

function selectEmotion(opt) {
  selectedEmotion.value = opt
  selectedIntensity.value = 1
  noteText.value = ''
}

function selectIntensity(value) {
  selectedIntensity.value = value
}

function nextStep() {
  if (step.value === 1 && selectedEmotion.value) {
    step.value = 2
  } else if (step.value === 2) {
    step.value = 3
  }
}

function handleSubmit() {
  if (!selectedEmotion.value) return

  const record = {
    emotion: selectedEmotion.value.key,
    emotionLabel: selectedEmotion.value.label,
    emoji: selectedEmotion.value.emoji,
    intensity: selectedIntensity.value,
    note: noteText.value.trim(),
    timestamp: Date.now(),
    date: new Date().toISOString().slice(0, 10)
  }

  const encrypted = encryptEmotionData(record)

  // 存储到 localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('moodtravel_emotion_records') || '[]')
    existing.unshift({ encrypted, timestamp: record.timestamp })
    localStorage.setItem('moodtravel_emotion_records', JSON.stringify(existing))
  } catch {
    localStorage.setItem('moodtravel_emotion_records', JSON.stringify([{ encrypted, timestamp: record.timestamp }]))
  }

  emit('recorded', record)
  resetAndClose()
}

function resetAndClose() {
  step.value = 1
  selectedEmotion.value = null
  selectedIntensity.value = 1
  noteText.value = ''
  emit('close')
}
</script>

<style scoped>
/* ============================================================
   遮罩层
   ============================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: overlayIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ============================================================
   玻璃卡片
   ============================================================ */
.modal-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-card, rgba(255, 255, 255, 0.82));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 24px 22px 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
  animation: cardIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text, #4A4640);
  letter-spacing: 0.5px;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  font-size: 14px;
  color: var(--color-text-light, #7A7670);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-close:active {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(0.92);
}

/* ============================================================
   步骤区域
   ============================================================ */
.modal-step {
  margin-bottom: 16px;
}

/* 步骤标签 */
.step-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text, #4A4640);
  margin-bottom: 12px;
  letter-spacing: 0.3px;
}

/* 返回按钮 */
.back-btn {
  display: inline-block;
  margin-top: 12px;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-light, #7A7670);
  cursor: pointer;
  transition: color 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.back-btn:active {
  color: var(--color-text, #4A4640);
}

/* ============================================================
   情绪选择网格 (4x2)
   ============================================================ */
.emotion-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.emotion-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 6px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.emotion-btn:active {
  transform: scale(0.93);
}

.emotion-btn.selected {
  border-color: var(--morandi-sage, #A3B5A6);
}

.emotion-emoji {
  font-size: 32px;
  line-height: 1;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.emotion-btn.selected .emotion-emoji {
  transform: scale(1.12);
}

.emotion-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #4A4640);
}

/* ============================================================
   强度选择器
   ============================================================ */
.intensity-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intensity-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.015);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.intensity-btn:active {
  transform: scale(0.98);
}

.intensity-btn.selected {
  border-color: var(--morandi-sage, #A3B5A6);
  background: rgba(163, 181, 166, 0.1);
}

.intensity-btn.high.selected {
  border-color: var(--morandi-clay, #C4A8A0);
  background: rgba(196, 168, 160, 0.1);
}

.intensity-emoji {
  font-size: 22px;
  line-height: 1;
}

.intensity-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #4A4640);
}

/* ============================================================
   备注输入
   ============================================================ */
.note-textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 300;
  color: var(--color-text, #4A4640);
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.note-textarea:focus {
  border-color: var(--morandi-sage, #A3B5A6);
}

.note-textarea::placeholder {
  color: #C0BCB4;
  font-weight: 300;
}

/* ============================================================
   底部操作区
   ============================================================ */
.modal-footer {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
  background: var(--morandi-sage, #A3B5A6);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):active {
  transform: scale(0.96);
  opacity: 0.85;
}

/* ============================================================
   免责声明
   ============================================================ */
.disclaimer-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.disclaimer-text {
  margin: 0;
  font-size: 11px;
  font-weight: 300;
  color: var(--color-text-muted, #A8A094);
  line-height: 1.5;
  text-align: center;
}

/* ============================================================
   高强度警告
   ============================================================ */
.intensity-warning {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(196, 168, 160, 0.08);
  border: 1px solid rgba(196, 168, 160, 0.15);
  animation: warnIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes warnIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.warning-icon {
  font-size: 16px;
}

.warning-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--morandi-clay, #C4A8A0);
}

.warning-body {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 300;
  color: var(--color-text-light, #7A7670);
  line-height: 1.6;
}

.warning-resources {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-link {
  display: block;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 500;
  color: var(--morandi-clay, #C4A8A0);
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(196, 168, 160, 0.1);
}

.resource-link:active {
  background: rgba(196, 168, 160, 0.1);
  transform: scale(0.98);
}

/* ============================================================
   过渡动画
   ============================================================ */
.modal-fade-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ============================================================
   长辈模式适配
   ============================================================ */
[data-accessibility="elderly"] .modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

[data-accessibility="elderly"] .modal-card {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  padding: 28px 24px 24px;
  max-width: 420px;
}

[data-accessibility="elderly"] .modal-title {
  font-size: 22px;
  font-weight: 700;
}

[data-accessibility="elderly"] .modal-close {
  width: 44px;
  height: 44px;
  font-size: 20px;
}

[data-accessibility="elderly"] .emotion-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

[data-accessibility="elderly"] .emotion-btn {
  padding: 18px 10px;
  border-radius: 16px;
}

[data-accessibility="elderly"] .emotion-emoji {
  font-size: 40px;
}

[data-accessibility="elderly"] .emotion-label {
  font-size: 16px;
  font-weight: 600;
}

[data-accessibility="elderly"] .intensity-btn {
  padding: 16px 20px;
  border-radius: 14px;
}

[data-accessibility="elderly"] .intensity-emoji {
  font-size: 28px;
}

[data-accessibility="elderly"] .intensity-label {
  font-size: 18px;
  font-weight: 600;
}

[data-accessibility="elderly"] .step-label {
  font-size: 18px;
  font-weight: 600;
}

[data-accessibility="elderly"] .note-textarea {
  font-size: 17px;
  padding: 16px 20px;
  border-radius: 16px;
  border: 2px solid #D0D0D0;
}

[data-accessibility="elderly"] .submit-btn {
  height: 60px;
  border-radius: 30px;
  font-size: 18px;
  font-weight: 700;
}

[data-accessibility="elderly"] .back-btn {
  font-size: 16px;
  font-weight: 500;
}

[data-accessibility="elderly"] .disclaimer-text {
  font-size: 14px;
}

[data-accessibility="elderly"] .warning-title {
  font-size: 16px;
}

[data-accessibility="elderly"] .warning-body {
  font-size: 15px;
}

[data-accessibility="elderly"] .resource-link {
  font-size: 15px;
  padding: 12px 16px;
}
</style>