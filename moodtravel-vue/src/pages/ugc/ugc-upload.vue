<template>
  <div class="ugc-page" :style="{ background: pageBg }">
    <!-- ============================================================ -->
    <!-- 顶部导航 -->
    <!-- ============================================================ -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <div class="header-center">
        <span class="header-title">分享你的治愈空间</span>
        <span class="header-sub">上传你发现的宝藏地点</span>
      </div>
      <div class="header-right" />
    </div>

    <!-- ============================================================ -->
    <!-- 上传表单 -->
    <!-- ============================================================ -->
    <div class="upload-section">
      <!-- 地点名称 -->
      <div class="form-group">
        <label class="form-label">地点名称</label>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="给这个治愈空间取个名字"
          maxlength="50"
        />
      </div>

      <!-- 地点描述 -->
      <div class="form-group">
        <label class="form-label">地点描述</label>
        <textarea
          class="form-textarea"
          v-model="form.description"
          placeholder="描述一下这个地方为什么让你感到治愈..."
          rows="4"
          maxlength="500"
        />
        <span class="char-count">{{ form.description.length }}/500</span>
      </div>

      <!-- 地址 -->
      <div class="form-group">
        <label class="form-label">地址</label>
        <input
          class="form-input"
          v-model="form.address"
          placeholder="输入详细地址"
        />
      </div>

      <!-- 图片上传区域 -->
      <div class="form-group">
        <label class="form-label">上传图片</label>
        <div class="upload-area" @click="triggerUpload" :style="{ borderColor: theme.primary + '40' }">
          <div v-if="!previewUrl" class="upload-placeholder">
            <span class="upload-icon">📷</span>
            <span class="upload-text">点击上传治愈空间的照片</span>
            <span class="upload-hint">支持 JPG、PNG，最大 10MB</span>
          </div>
          <img v-else :src="previewUrl" class="preview-image" />
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="file-input-hidden"
            @change="onFileChange"
          />
        </div>
      </div>

      <!-- 标签 -->
      <div class="form-group">
        <label class="form-label">标签（可选）</label>
        <div class="tag-selector">
          <div
            v-for="tag in availableTags"
            :key="tag"
            class="tag-chip"
            :class="{ active: form.tags.includes(tag) }"
            :style="form.tags.includes(tag) ? { background: theme.primary + '20', color: theme.primary, borderColor: theme.primary } : {}"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- CC0 协议勾选框 -->
      <!-- ============================================================ -->
      <div class="license-section">
        <label class="license-checkbox" @click="form.cc0Accepted = !form.cc0Accepted">
          <span
            class="license-checkbox-icon"
            :class="{ checked: form.cc0Accepted }"
            :style="form.cc0Accepted ? { background: theme.primary, borderColor: theme.primary } : {}"
          >
            <span v-if="form.cc0Accepted">✓</span>
          </span>
          <span class="license-text">
            我同意将上传的内容以
            <span class="license-link" @click.stop="showCC0Info = true">CC0 协议</span>
            贡献至公共领域，允许任何人自由使用、修改和分发。
          </span>
        </label>

        <!-- CC0 协议说明弹窗 -->
        <div class="cc0-info-card" v-if="showCC0Info">
          <div class="cc0-info-header">
            <span class="cc0-info-icon">📜</span>
            <span class="cc0-info-title">CC0 1.0 通用公共领域贡献</span>
            <button class="cc0-info-close" @click="showCC0Info = false">✕</button>
          </div>
          <div class="cc0-info-body">
            <p>CC0（Creative Commons Zero）是一种公共领域贡献工具，允许创作者放弃其作品的版权和相关权利，将其贡献至公共领域。</p>
            <p><strong>这意味着：</strong></p>
            <ul>
              <li>任何人都可以自由复制、修改、分发和表演该作品，即使是出于商业目的。</li>
              <li>无需署名，无需获得许可。</li>
              <li>MoodTravel 平台将在展示用户上传内容时进行匿名化处理，不显示个人身份信息。</li>
            </ul>
            <p class="cc0-info-note">通过勾选此协议，您确认您是该内容的原创作者，并自愿将其贡献至公共领域。</p>
          </div>
        </div>
      </div>

      <!-- 数据匿名化声明 -->
      <div class="anonymization-notice">
        <span class="anonymization-icon">🔒</span>
        <span class="anonymization-text">
          根据 MoodTravel <span class="agreement-link" @click="goToAgreement">用户协议</span>，上传内容中的个人身份信息将在发布前进行匿名化处理，您的隐私将得到严格保护。
        </span>
      </div>
    </div>

    <!-- 提交按钮 -->
    <button
      class="submit-btn"
      :style="submitBtnStyle"
      :disabled="!canSubmit || isSubmitting"
      @click="handleSubmit"
    >
      <span v-if="!isSubmitting">✨ 提交分享</span>
      <span v-else>上传中...</span>
    </button>

    <!-- 提交成功 Toast -->
    <Transition name="toast">
      <div v-if="submitSuccess" class="success-toast" :style="{ background: toastBg }">
        <span class="success-toast-icon">🎉</span>
        <span class="success-toast-text">分享成功！感谢你的贡献</span>
      </div>
    </Transition>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const fileInput = ref(null)
const previewUrl = ref(null)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const showCC0Info = ref(false)

const form = reactive({
  name: '',
  description: '',
  address: '',
  tags: [],
  imageFile: null,
  cc0Accepted: false
})

const availableTags = ['安静', '治愈', '放松', '自然', '咖啡', '书店', '美食', '拍照', '独处', '浪漫', '亲子', '宠物友好']

const canSubmit = computed(() => {
  return form.name.trim() && form.description.trim() && form.address.trim() && form.cc0Accepted
})

const pageBg = computed(() => theme.value.bg)
const toastBg = computed(() => `linear-gradient(135deg, ${theme.value.bg}, #FFFCF8)`)

const submitBtnStyle = computed(() => ({
  background: canSubmit.value
    ? `linear-gradient(135deg, ${theme.value.primaryLight}, ${theme.value.primary})`
    : '#E0DCD4',
  boxShadow: canSubmit.value ? `0 6px 16px ${theme.value.primary}40` : 'none'
}))

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    form.imageFile = file
    const reader = new FileReader()
    reader.onload = (ev) => {
      previewUrl.value = ev.target.result
    }
    reader.readAsDataURL(file)
  }
}

function toggleTag(tag) {
  const idx = form.tags.indexOf(tag)
  if (idx >= 0) {
    form.tags.splice(idx, 1)
  } else if (form.tags.length < 5) {
    form.tags.push(tag)
  }
}

function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    submitSuccess.value = true
    // 重置表单
    form.name = ''
    form.description = ''
    form.address = ''
    form.tags = []
    form.imageFile = null
    form.cc0Accepted = false
    previewUrl.value = null
    setTimeout(() => {
      submitSuccess.value = false
    }, 2500)
  }, 1500)
}

function goBack() {
  router.back()
}

function goToAgreement() {
  router.push({ name: 'userAgreement' })
}
</script>

<style scoped>
.ugc-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}

/* ===== 顶部导航 ===== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 44px 0 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.back-arrow {
  font-size: 18px;
  color: #555;
  font-weight: 600;
}

.header-center {
  text-align: center;
}

.header-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  display: block;
}

.header-sub {
  font-size: 11px;
  color: var(--color-text-light);
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

.header-right {
  width: 36px;
}

/* ===== 表单 ===== */
.upload-section {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #E0DCD4;
  border-radius: 12px;
  font-size: 14px;
  color: var(--color-text);
  background: rgba(255,255,255,0.8);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--theme-primary);
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #E0DCD4;
  border-radius: 12px;
  font-size: 14px;
  color: var(--color-text);
  background: rgba(255,255,255,0.8);
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: var(--theme-primary);
}

.char-count {
  display: block;
  text-align: right;
  font-size: 11px;
  color: var(--color-text-light);
  margin-top: 4px;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #E0DCD4;
  border-radius: 14px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.upload-area:active {
  transform: scale(0.98);
}

.file-input-hidden {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 36px;
}

.upload-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.upload-hint {
  font-size: 11px;
  color: var(--color-text-light);
}

.preview-image {
  max-width: 100%;
  max-height: 240px;
  border-radius: 8px;
  object-fit: cover;
}

/* 标签选择器 */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #E0DCD4;
  background: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-light);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.tag-chip:active {
  transform: scale(0.95);
}

.tag-chip.active {
  border-color: transparent;
}

/* ===== CC0 协议 ===== */
.license-section {
  margin-bottom: 12px;
  padding: 14px;
  background: #F8FFF0;
  border-radius: 12px;
  border: 1px solid #8BA88C20;
}

.license-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.license-checkbox-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #D0CCC4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.license-checkbox-icon.checked {
  border-color: transparent;
}

.license-text {
  font-size: 12px;
  color: #555;
  line-height: 1.6;
}

.license-link {
  color: #8BA88C;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

/* CC0 信息卡片 */
.cc0-info-card {
  margin-top: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E0DCD4;
}

.cc0-info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.cc0-info-icon {
  font-size: 18px;
}

.cc0-info-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  flex: 1;
}

.cc0-info-close {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.05);
  font-size: 12px;
  color: var(--color-text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cc0-info-body {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.cc0-info-body p {
  margin: 0 0 6px;
}

.cc0-info-body ul {
  margin: 0 0 8px;
  padding-left: 18px;
}

.cc0-info-body li {
  margin-bottom: 4px;
}

.cc0-info-note {
  color: #8BA88C;
  font-weight: 600;
}

/* 匿名化声明 */
.anonymization-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #F5F2ED;
  border-radius: 10px;
  margin-bottom: 16px;
}

.anonymization-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.anonymization-text {
  font-size: 11px;
  color: #8A8A8A;
  line-height: 1.5;
}

.agreement-link {
  color: var(--theme-primary);
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 16px;
}

.submit-btn:active {
  transform: scale(0.97);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 成功 Toast */
.success-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 60;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0,0,0,0.04);
}

.success-toast-icon {
  font-size: 20px;
}

.success-toast-text {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.safe-bottom {
  height: 40px;
}
</style>