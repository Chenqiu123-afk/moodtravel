<template>
  <transition name="overlay-fade">
    <div v-if="visible" class="questionnaire-overlay" @click.self="$emit('close')">
      <transition name="card-slide" appear>
        <div v-if="visible" class="questionnaire-card" @click.stop>
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="$emit('close')">&times;</button>

          <!-- 步骤指示器 -->
          <div class="step-indicator">
            <div class="step-text">{{ currentStep + 1 }} / {{ totalSteps }}</div>
            <div class="step-dots">
              <div
                v-for="i in totalSteps"
                :key="i"
                class="step-dot"
                :class="{ active: i - 1 <= currentStep, current: i - 1 === currentStep }"
              />
            </div>
          </div>

          <!-- 题目内容 -->
          <transition :name="slideDirection" mode="out-in">
            <div :key="currentStep" class="question-body">
              <!-- 标题 -->
              <div class="question-header">
                <span class="question-icon">{{ currentQuestion.icon }}</span>
                <h3 class="question-title">{{ currentQuestion.title }}</h3>
                <p v-if="currentQuestion.desc" class="question-desc">{{ currentQuestion.desc }}</p>
              </div>

              <!-- Step 1: 预算（单选卡片） -->
              <div v-if="currentQuestion.id === 'q1'" class="options-grid options-grid-budget">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.value"
                  class="option-card"
                  :class="{ selected: answers.q1 === opt.value }"
                  @click="answers.q1 = opt.value"
                >
                  <span class="option-label">{{ opt.label }}</span>
                  <span class="option-desc">{{ opt.desc }}</span>
                </button>
              </div>

              <!-- Step 2: MBTI（单选卡片+描述） -->
              <div v-if="currentQuestion.id === 'q2'" class="options-grid options-grid-mbti">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.value"
                  class="option-card option-card-mbti"
                  :class="{ selected: answers.q2 === opt.value }"
                  @click="answers.q2 = opt.value"
                >
                  <span class="option-label">{{ opt.label }}</span>
                  <span class="option-desc">{{ opt.desc }}</span>
                </button>
              </div>

              <!-- Step 3: 旅行偏好（多选 chip） -->
              <div v-if="currentQuestion.id === 'q3'" class="options-grid options-grid-chips">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.value"
                  class="option-chip"
                  :class="{ selected: answers.q3.includes(opt.value) }"
                  @click="toggleMulti(opt.value)"
                >
                  <span class="chip-icon">{{ opt.icon }}</span>
                  <span class="chip-label">{{ opt.label }}</span>
                </button>
              </div>

              <!-- Step 4: 情绪底色（单选 emoji 卡片） -->
              <div v-if="currentQuestion.id === 'q4'" class="options-grid options-grid-emotion">
                <button
                  v-for="opt in currentQuestion.options"
                  :key="opt.value"
                  class="option-card option-card-emotion"
                  :class="{ selected: answers.q4 === opt.value }"
                  @click="answers.q4 = opt.value"
                >
                  <span class="emotion-emoji">{{ opt.emoji }}</span>
                  <span class="option-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>
          </transition>

          <!-- 底部导航 -->
          <div class="question-footer">
            <button
              v-if="currentStep > 0"
              class="nav-btn nav-btn-prev"
              @click="prevStep"
            >
              上一步
            </button>
            <div v-else class="nav-btn-spacer" />

            <button
              v-if="currentQuestion.id === 'q2'"
              class="nav-btn nav-btn-skip"
              @click="skipStep"
            >
              跳过
            </button>

            <button
              class="nav-btn nav-btn-next"
              :disabled="!canProceed"
              @click="nextStep"
            >
              {{ currentStep === totalSteps - 1 ? '完成' : '下一步' }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { SURVEY_QUESTIONS, DEFAULT_PROFILE } from '@/data/userProfileData.js'
import { useTravelStore } from '@/store/travel.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'completed'])

const store = useTravelStore()

const currentStep = ref(0)
const totalSteps = 4
const slideDirection = ref('slide-left')

const answers = ref({
  q1: null,
  q2: null,
  q3: [],
  q4: null
})

// 重置状态
watch(() => props.visible, (val) => {
  if (val) {
    currentStep.value = 0
    answers.value = { q1: null, q2: null, q3: [], q4: null }
    slideDirection.value = 'slide-left'
  }
})

const currentQuestion = computed(() => SURVEY_QUESTIONS[currentStep.value])

const canProceed = computed(() => {
  const q = currentQuestion.value
  if (q.type === 'multi') return answers.value.q3.length > 0
  return !!answers.value[q.id]
})

function toggleMulti(value) {
  const idx = answers.value.q3.indexOf(value)
  if (idx >= 0) {
    answers.value.q3.splice(idx, 1)
  } else {
    answers.value.q3.push(value)
  }
}

function nextStep() {
  if (!canProceed.value) return
  if (currentStep.value === totalSteps - 1) {
    complete()
    return
  }
  slideDirection.value = 'slide-left'
  currentStep.value++
}

function prevStep() {
  if (currentStep.value === 0) return
  slideDirection.value = 'slide-right'
  currentStep.value--
}

function skipStep() {
  answers.value.q2 = 'unknown'
  slideDirection.value = 'slide-left'
  currentStep.value++
}

function complete() {
  // 构建 profile 对象
  const budgetOption = SURVEY_QUESTIONS[0].options.find(o => o.value === answers.value.q1)
  const profile = {
    ...DEFAULT_PROFILE,
    budget: budgetOption ? budgetOption.budgetRange[0] : DEFAULT_PROFILE.budget,
    budgetTier: answers.value.q1 || DEFAULT_PROFILE.budgetTier,
    mbti: answers.value.q2 || DEFAULT_PROFILE.mbti,
    travelPreferences: answers.value.q3.length ? [...answers.value.q3] : DEFAULT_PROFILE.travelPreferences,
    emotionBase: answers.value.q4 || DEFAULT_PROFILE.emotionBase,
    surveyCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // 保存到 localStorage
  localStorage.setItem('moodtravel_profile', JSON.stringify(profile))

  emit('completed', profile)
}
</script>

<style scoped>
/* ================================================================
   遮罩层
   ================================================================ */
.questionnaire-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 20px;
}

/* ================================================================
   毛玻璃卡片
   ================================================================ */
.questionnaire-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50%;
  font-size: 20px;
  color: var(--color-text-muted, #A8A094);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-weight: 300;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.close-btn:active {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.9);
}

/* ================================================================
   步骤指示器
   ================================================================ */
.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.step-text {
  font-size: 12px;
  font-weight: 300;
  color: var(--color-text-muted, #A8A094);
  letter-spacing: 0.5px;
}

.step-dots {
  display: flex;
  gap: 8px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.step-dot.active {
  background: var(--theme-primary, #A3B5A6);
}

.step-dot.current {
  transform: scale(1.4);
  box-shadow: 0 0 0 4px rgba(163, 181, 166, 0.15);
}

/* ================================================================
   题目内容区
   ================================================================ */
.question-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-header {
  text-align: center;
}

.question-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 6px;
}

.question-title {
  font-size: 17px;
  font-weight: 300;
  color: var(--color-text, #4A4640);
  margin: 0;
  letter-spacing: 0.3px;
}

.question-desc {
  font-size: 12px;
  font-weight: 300;
  color: var(--color-text-muted, #A8A094);
  margin: 4px 0 0;
}

/* ================================================================
   选项卡片（通用）
   ================================================================ */
.options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 14px;
  border-radius: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
  width: 100%;
}

.option-card:active {
  transform: scale(0.975);
}

.option-card.selected {
  border-color: var(--theme-primary, #A3B5A6);
  background: rgba(163, 181, 166, 0.1);
  box-shadow: 0 0 0 3px rgba(163, 181, 166, 0.08);
}

.option-label {
  font-size: 14px;
  font-weight: 300;
  color: var(--color-text, #4A4640);
  letter-spacing: 0.3px;
}

.option-desc {
  font-size: 11px;
  font-weight: 300;
  color: var(--color-text-muted, #A8A094);
}

/* MBTI 卡片：左对齐 */
.option-card-mbti {
  align-items: flex-start;
  padding: 14px 16px;
}

/* ================================================================
   多选 chips（Step 3）
   ================================================================ */
.options-grid-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.option-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.option-chip:active {
  transform: scale(0.95);
}

.option-chip.selected {
  border-color: var(--theme-primary, #A3B5A6);
  background: rgba(163, 181, 166, 0.12);
  box-shadow: 0 0 0 3px rgba(163, 181, 166, 0.08);
}

.chip-icon {
  font-size: 16px;
  line-height: 1;
}

.chip-label {
  font-size: 13px;
  font-weight: 300;
  color: var(--color-text, #4A4640);
}

/* ================================================================
   情绪卡片（Step 4）
   ================================================================ */
.options-grid-emotion {
  gap: 8px;
}

.option-card-emotion {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 16px;
}

.emotion-emoji {
  font-size: 24px;
  line-height: 1;
}

/* ================================================================
   底部导航
   ================================================================ */
.question-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.nav-btn-spacer {
  flex: 1;
}

.nav-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
  min-width: 80px;
  text-align: center;
}

.nav-btn:active {
  transform: scale(0.95);
}

.nav-btn-prev {
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-text-light, #7A7670);
}

.nav-btn-prev:active {
  background: rgba(0, 0, 0, 0.08);
}

.nav-btn-skip {
  background: transparent;
  color: var(--color-text-muted, #A8A094);
  font-size: 12px;
}

.nav-btn-next {
  flex: 1;
  background: var(--theme-primary, #A3B5A6);
  color: #fff;
  font-weight: 400;
}

.nav-btn-next:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.nav-btn-next:not(:disabled):active {
  opacity: 0.85;
}

/* ================================================================
   过渡动画
   ================================================================ */

/* 遮罩淡入淡出 */
.overlay-fade-enter-active {
  transition: opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.overlay-fade-leave-active {
  transition: opacity 0.25s ease-in;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* 卡片淡入+上滑 */
.card-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.card-slide-leave-active {
  transition: all 0.2s ease-in;
}
.card-slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
.card-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}

/* 步骤切换：左滑 / 右滑 */
.slide-left-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-left-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
  width: 100%;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-right-leave-active {
  transition: all 0.2s ease-in;
  position: absolute;
  width: 100%;
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ================================================================
   长辈模式适配
   ================================================================ */
[data-accessibility="elderly"] .questionnaire-overlay {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

[data-accessibility="elderly"] .questionnaire-card {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  padding: 32px 24px 28px;
  border-radius: 22px;
  gap: 24px;
}

[data-accessibility="elderly"] .close-btn {
  width: 44px;
  height: 44px;
  font-size: 26px;
  top: 14px;
  right: 16px;
}

[data-accessibility="elderly"] .step-text {
  font-size: 16px;
  font-weight: 500;
}

[data-accessibility="elderly"] .step-dot {
  width: 12px;
  height: 12px;
}

[data-accessibility="elderly"] .question-title {
  font-size: 22px;
  font-weight: 500;
}

[data-accessibility="elderly"] .question-desc {
  font-size: 15px;
}

[data-accessibility="elderly"] .option-card {
  padding: 20px 18px;
  border-radius: 16px;
  border-width: 2px;
}

[data-accessibility="elderly"] .option-label {
  font-size: 17px;
  font-weight: 500;
}

[data-accessibility="elderly"] .option-desc {
  font-size: 14px;
}

[data-accessibility="elderly"] .option-chip {
  padding: 14px 22px;
  border-radius: 24px;
  border-width: 2px;
  min-height: 52px;
}

[data-accessibility="elderly"] .chip-label {
  font-size: 16px;
  font-weight: 500;
}

[data-accessibility="elderly"] .chip-icon {
  font-size: 20px;
}

[data-accessibility="elderly"] .emotion-emoji {
  font-size: 30px;
}

[data-accessibility="elderly"] .nav-btn {
  font-size: 17px;
  font-weight: 500;
  padding: 14px 28px;
  border-radius: 24px;
  min-height: 52px;
}

[data-accessibility="elderly"] .nav-btn-skip {
  font-size: 15px;
}
</style>