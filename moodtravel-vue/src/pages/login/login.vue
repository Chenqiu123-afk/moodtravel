<template>
  <div class="login-page" :style="pageStyle">
    <!-- 呼吸感背景层 -->
    <div class="atmosphere">
      <!-- 大光晕：缓慢呼吸 -->
      <div class="aura aura-1" :style="auraStyle(1)" />
      <div class="aura aura-2" :style="auraStyle(2)" />
      <div class="aura aura-3" :style="auraStyle(3)" />

      <!-- 高斯模糊遮罩 -->
      <div class="blur-veil" />
    </div>

    <!-- 浮动光粒子 -->
    <div class="light-dust">
      <div
        v-for="i in 8"
        :key="'d' + i"
        class="dust-particle"
        :style="dustStyle(i)"
      />
    </div>

    <!-- 极简品牌区 -->
    <div class="brand">
      <div class="brand-mark" :style="{ background: theme.primaryLight + '18', borderColor: theme.primaryLight + '30' }">
        <span class="brand-emoji">{{ store.moodEmoji }}</span>
      </div>
      <span class="brand-name">MoodTravel</span>
      <span class="brand-tagline">情绪旅行</span>
    </div>

    <!-- 玻璃态登录卡片 -->
    <div class="glass-card">
      <!-- 卡片内光晕 -->
      <div class="card-glow" :style="{ background: `radial-gradient(ellipse at 50% 0%, ${theme.primaryLight}10, transparent 60%)` }" />

      <div class="card-header">
        <span class="welcome">欢迎回来</span>
        <span class="subtitle">用心情感知，定制专属旅程</span>
      </div>

      <!-- 微信登录 -->
      <button class="wechat-btn" @click="handleWechatLogin" :disabled="isLogging">
        <span class="btn-content">
          <span v-if="!isLogging" class="btn-icon">💬</span>
          <span v-else class="btn-dot" />
          <span>{{ isLogging ? '授权中...' : '微信授权登录' }}</span>
        </span>
      </button>

      <!-- 分隔 -->
      <div class="sep">
        <span class="sep-line" />
        <span class="sep-text">其他方式</span>
        <span class="sep-line" />
      </div>

      <!-- 手机号登录 -->
      <div class="phone-form">
        <div class="input-group">
          <span class="prefix">+86</span>
          <input
            type="tel"
            v-model="phoneNumber"
            placeholder="手机号"
            maxlength="11"
            class="field"
          />
        </div>
        <div class="input-row">
          <input
            type="tel"
            v-model="smsCode"
            placeholder="验证码"
            maxlength="6"
            class="field flex-1"
          />
          <button
            class="code-btn"
            :disabled="countdown > 0 || phoneNumber.length !== 11"
            @click="sendCode"
          >
            {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
          </button>
        </div>
        <button
          class="submit-btn"
          :disabled="!canLogin"
          @click="handlePhoneLogin"
        >
          登录
        </button>
      </div>

      <!-- 协议 -->
      <p class="terms">
        <span>登录即表示同意</span>
        <a class="link">《用户协议》</a>
        <span>和</span>
        <a class="link">《隐私政策》</a>
      </p>
    </div>

    <!-- 底部 -->
    <button class="skip-link" @click="handleSkip">
      先逛逛，稍后登录&nbsp;›
    </button>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.msg }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'

const store = useTravelStore()
const router = useRouter()

const theme = computed(() => store.activeTheme)

// 页面背景：极浅莫兰迪渐变
const pageStyle = computed(() => {
  const t = theme.value
  return {
    background: `linear-gradient(165deg, ${t.bg} 0%, ${t.bgGradient} 40%, ${t.primaryLight}18 100%)`
  }
})

// 大光晕样式
function auraStyle(i) {
  const configs = {
    1: { size: 320, top: -80, right: -100, color: theme.value.primaryLight, opacity: 0.18, duration: 14, delay: 0 },
    2: { size: 240, bottom: 60, left: -80, color: theme.value.accent, opacity: 0.12, duration: 18, delay: 3 },
    3: { size: 200, top: '35%', right: -60, color: theme.value.primary, opacity: 0.10, duration: 16, delay: 6 }
  }
  const c = configs[i]
  return {
    width: c.size + 'px',
    height: c.size + 'px',
    top: typeof c.top === 'number' ? c.top + 'px' : c.top,
    bottom: typeof c.bottom === 'number' ? c.bottom + 'px' : c.bottom,
    right: typeof c.right === 'number' ? c.right + 'px' : c.right,
    left: typeof c.left === 'number' ? c.left + 'px' : c.left,
    background: `radial-gradient(circle, ${c.color}30, ${c.color}08 60%, transparent)`,
    opacity: c.opacity,
    animation: `breathe ${c.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${c.delay}s infinite alternate`
  }
}

// 光粒子样式
function dustStyle(i) {
  const seed = (i * 137.5) % 100
  return {
    left: (10 + seed * 0.8) + '%',
    top: (5 + (i * 73) % 90) + '%',
    animationDelay: (i * 1.3) + 's',
    animationDuration: (8 + i * 2.5) + 's',
    opacity: 0.15 + (i % 3) * 0.08
  }
}

// 登录逻辑
const isLogging = ref(false)
const phoneNumber = ref('')
const smsCode = ref('')
const countdown = ref(0)
let timer = null

const canLogin = computed(() => phoneNumber.value.length === 11 && smsCode.value.length >= 4)

const toast = ref({ show: false, msg: '', type: 'success' })

function showToast(msg, type = 'success') {
  toast.value = { show: true, msg, type }
  setTimeout(() => { toast.value.show = false }, 2200)
}

function handleWechatLogin() {
  if (isLogging.value) return
  isLogging.value = true
  setTimeout(() => {
    isLogging.value = false
    store.setLogin({ nickname: '旅行者', avatar: '😊', openid: 'wx_' + Date.now() })
    showToast('授权成功')
    setTimeout(() => router.push('/home'), 500)
  }, 1500)
}

function handlePhoneLogin() {
  if (!canLogin.value) return
  store.setLogin({ nickname: '用户' + phoneNumber.value.slice(-4), avatar: '😊', phone: phoneNumber.value })
  showToast('登录成功')
  setTimeout(() => router.push('/home'), 600)
}

function sendCode() {
  if (countdown.value > 0 || phoneNumber.value.length !== 11) return
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) { clearInterval(timer); timer = null }
  }, 1000)
  showToast('验证码已发送')
}

function handleSkip() { router.push('/home') }
</script>

<style scoped>
/* ============================================================
   呼吸感背景系统
   ============================================================ */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  position: relative;
  overflow: hidden;
  transition: background 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.atmosphere {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.aura {
  position: absolute;
  border-radius: 50%;
  will-change: transform, opacity;
}
@keyframes breathe {
  0%   { transform: scale(1) translate(0, 0); }
  33%  { transform: scale(1.04) translate(4px, -6px); }
  66%  { transform: scale(0.97) translate(-3px, 4px); }
  100% { transform: scale(1.02) translate(2px, -2px); }
}

.blur-veil {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(60px);
  -webkit-backdrop-filter: blur(60px);
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

/* 光粒子 */
.light-dust {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.dust-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #fff;
  animation: dustFloat linear infinite;
}
@keyframes dustFloat {
  0%   { transform: translateY(0) scale(0); opacity: 0; }
  20%  { opacity: 0.6; }
  50%  { opacity: 0.3; transform: scale(1.5); }
  80%  { opacity: 0.1; }
  100% { transform: translateY(-60px) scale(0); opacity: 0; }
}

/* ============================================================
   品牌区 —— 极简、大量留白
   ============================================================ */
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48px;
  position: relative;
  z-index: 1;
}
.brand-mark {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: brandFloat 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
@keyframes brandFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.brand-emoji {
  font-size: 32px;
}
.brand-name {
  font-size: 26px;
  font-weight: 200;
  letter-spacing: 6px;
  color: var(--color-text);
  opacity: 0.85;
}
.brand-tagline {
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 4px;
  color: var(--color-text-light);
  margin-top: 8px;
  opacity: 0.6;
}

/* ============================================================
   玻璃态卡片
   ============================================================ */
.glass-card {
  width: 100%;
  max-width: 340px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border-radius: 24px;
  padding: 36px 28px 28px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  box-shadow:
    0 2px 40px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  pointer-events: none;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}
.welcome {
  display: block;
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 3px;
  color: var(--color-text);
}
.subtitle {
  display: block;
  font-size: 12px;
  font-weight: 300;
  color: var(--color-text-light);
  margin-top: 8px;
  letter-spacing: 1px;
  opacity: 0.7;
}

/* ============================================================
   微信登录按钮
   ============================================================ */
.wechat-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #2DC85C, #1FA84A);
  color: #fff;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 20px rgba(7, 193, 96, 0.18);
}
.wechat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(7, 193, 96, 0.25);
}
.wechat-btn:active {
  transform: scale(0.98);
}
.wechat-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-icon {
  font-size: 18px;
}
.btn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  animation: dotPulse 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
@keyframes dotPulse {
  0%, 100% { transform: scale(0.8); opacity: 0.4; }
  50%      { transform: scale(1.2); opacity: 1; }
}

/* ============================================================
   分隔
   ============================================================ */
.sep {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 28px 0;
}
.sep-line {
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
}
.sep-text {
  font-size: 11px;
  font-weight: 300;
  color: var(--color-text-light);
  letter-spacing: 2px;
  opacity: 0.5;
}

/* ============================================================
   手机号表单
   ============================================================ */
.phone-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.input-group {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(0, 0, 0, 0.025);
  border-radius: 12px;
  padding: 0 14px;
  height: 48px;
  transition: background 0.3s;
}
.input-group:focus-within {
  background: rgba(0, 0, 0, 0.04);
}
.prefix {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text);
  padding-right: 12px;
  border-right: 1px solid rgba(0,0,0,0.08);
  margin-right: 12px;
}
.field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 300;
  color: var(--color-text);
  letter-spacing: 1px;
}
.field::placeholder {
  color: rgba(0,0,0,0.2);
  font-weight: 300;
}
.flex-1 { flex: 1; }
.input-row {
  display: flex;
  gap: 10px;
}
.code-btn {
  width: 110px;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--theme-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  flex-shrink: 0;
}
.code-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.submit-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: var(--color-text);
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.submit-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.submit-btn:not(:disabled):active {
  transform: scale(0.98);
}

/* ============================================================
   协议
   ============================================================ */
.terms {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 20px;
  font-size: 10px;
  font-weight: 300;
  color: var(--color-text-light);
  opacity: 0.5;
}
.link {
  color: var(--theme-primary);
  cursor: pointer;
  transition: opacity 0.3s;
}
.link:hover { opacity: 0.7; }

/* ============================================================
   底部跳过
   ============================================================ */
.skip-link {
  margin-top: 40px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 2px;
  color: var(--color-text-light);
  opacity: 0.45;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: opacity 0.4s;
  padding: 8px 16px;
}
.skip-link:hover { opacity: 0.7; }

/* ============================================================
   Toast
   ============================================================ */
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 1px;
  color: #fff;
  z-index: 999;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.toast.success { background: rgba(7, 193, 96, 0.78); }
.toast.error   { background: rgba(200, 80, 80, 0.78); }
.toast-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>