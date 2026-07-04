<template>
  <view class="login-page" :style="{ background: gradientBg }">
    <!-- 动态背景层 -->
    <view class="bg-layer">
      <!-- 装饰圆 -->
      <view class="bg-circle circle-1" :style="{ background: theme.primaryLight + '30' }" />
      <view class="bg-circle circle-2" :style="{ background: theme.primary + '25' }" />
      <view class="bg-circle circle-3" :style="{ background: theme.accent + '20' }" />
      <!-- 浮动粒子 -->
      <view
        v-for="i in 12"
        :key="i"
        class="floating-particle"
        :style="particleStyle(i)"
      />
    </view>

    <!-- 顶部品牌区 -->
    <view class="brand-area">
      <view class="brand-icon" :style="{ background: theme.primary }">
        <text class="brand-emoji">{{ store.moodEmoji }}</text>
      </view>
      <text class="brand-name">MoodTravel</text>
      <text class="brand-slogan">懂情绪的 AI 旅行管家</text>
    </view>

    <!-- 磨砂玻璃登录卡片 -->
    <view class="login-card">
      <view class="card-header">
        <text class="card-title">欢迎回来</text>
        <text class="card-sub">用心情感知，定制专属旅程</text>
      </view>

      <!-- 微信授权登录按钮 -->
      <view class="wechat-btn" @click="handleWechatLogin" :class="{ loading: isLogging }">
        <view class="wechat-btn-inner">
          <text v-if="!isLogging" class="wechat-icon">💬</text>
          <view v-else class="btn-spinner" />
          <text class="wechat-text">{{ isLogging ? '正在授权登录...' : '微信授权登录' }}</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view class="divider">
        <view class="divider-line" />
        <text class="divider-text">其他登录方式</text>
        <view class="divider-line" />
      </view>

      <!-- 手机号登录 -->
      <view class="phone-login">
        <view class="phone-input-row">
          <text class="phone-prefix">+86</text>
          <input
            class="phone-input"
            type="number"
            v-model="phoneNumber"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </view>
        <view class="code-row">
          <input
            class="code-input"
            type="number"
            v-model="smsCode"
            placeholder="验证码"
            maxlength="6"
          />
          <view class="code-btn" @click="sendCode" :class="{ disabled: countdown > 0 }">
            <text>{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</text>
          </view>
        </view>
        <button class="phone-login-btn" @click="handlePhoneLogin" :disabled="!canLogin">
          <text>登录</text>
        </button>
      </view>

      <!-- 协议 -->
      <view class="agreement">
        <text>登录即表示同意</text>
        <text class="agreement-link">《用户协议》</text>
        <text>和</text>
        <text class="agreement-link">《隐私政策》</text>
      </view>
    </view>

    <!-- 跳过按钮 -->
    <view class="skip-area" @click="handleSkip">
      <text class="skip-text">先逛逛，稍后登录 ›</text>
    </view>

    <!-- Toast 提示 -->
    <view v-if="toast.show" class="toast" :class="toast.type">
      <text>{{ toast.msg }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTravelStore } from '@/store/travel.js'

const store = useTravelStore()

// 主题
const theme = computed(() => store.activeTheme)

// 动态渐变背景
const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(160deg, ${t.bg} 0%, ${t.bgGradient} 50%, ${t.primaryLight}30 100%)`
})

// 粒子样式
function particleStyle(i) {
  const size = 4 + Math.random() * 8
  const left = 10 + (i / 12) * 80 + Math.random() * 5
  const delay = Math.random() * 6
  const duration = 8 + Math.random() * 10
  const opacity = 0.15 + Math.random() * 0.25
  return {
    width: size + 'rpx',
    height: size + 'rpx',
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    opacity,
    background: theme.value.primary
  }
}

// 登录状态
const isLogging = ref(false)
const phoneNumber = ref('')
const smsCode = ref('')
const countdown = ref(0)
let countdownTimer = null

const canLogin = computed(() => {
  return phoneNumber.value.length === 11 && smsCode.value.length >= 4
})

// Toast
const toast = ref({ show: false, msg: '', type: 'success' })

function showToast(msg, type = 'success') {
  toast.value = { show: true, msg, type }
  setTimeout(() => { toast.value.show = false }, 2000)
}

// 微信授权登录
function handleWechatLogin() {
  if (isLogging.value) return
  isLogging.value = true

  // 模拟微信授权流程
  setTimeout(() => {
    isLogging.value = false
    const mockUser = {
      nickname: '旅行者',
      avatar: '😊',
      openid: 'wx_' + Date.now()
    }
    store.setLogin(mockUser)
    showToast('授权成功，欢迎回来！')
    setTimeout(() => navigateToHome(), 600)
  }, 1500)
}

// 手机号登录
function handlePhoneLogin() {
  if (!canLogin.value) return
  showToast('登录成功')
  const mockUser = {
    nickname: '用户' + phoneNumber.value.slice(-4),
    avatar: '😊',
    phone: phoneNumber.value
  }
  store.setLogin(mockUser)
  setTimeout(() => navigateToHome(), 800)
}

// 发送验证码
function sendCode() {
  if (countdown.value > 0 || phoneNumber.value.length !== 11) return
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
  showToast('验证码已发送')
}

// 跳过登录
function handleSkip() {
  navigateToHome()
}

function navigateToHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  position: relative;
  overflow: hidden;
  transition: background 0.6s ease;
}

/* ===== 动态背景层 ===== */
.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.bg-circle {
  position: absolute;
  border-radius: 50%;
}
.circle-1 {
  width: 500rpx; height: 500rpx;
  top: -120rpx; right: -180rpx;
}
.circle-2 {
  width: 360rpx; height: 360rpx;
  bottom: 10%; left: -120rpx;
}
.circle-3 {
  width: 280rpx; height: 280rpx;
  top: 40%; right: -80rpx;
}

/* 浮动粒子 */
.floating-particle {
  position: absolute;
  border-radius: 50%;
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0%   { transform: translateY(100vh) scale(0); opacity: 0; }
  10%  { opacity: 0.3; }
  50%  { opacity: 0.15; }
  90%  { opacity: 0.05; }
  100% { transform: translateY(-10vh) scale(1); opacity: 0; }
}

/* ===== 品牌区 ===== */
.brand-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
  position: relative;
  z-index: 1;
}
.brand-icon {
  width: 120rpx; height: 120rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  box-shadow: 0 16rpx 40rpx rgba(0,0,0,0.12);
  transition: background 0.5s;
}
.brand-emoji {
  font-size: 56rpx;
}
.brand-name {
  font-size: 48rpx;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: 4rpx;
}
.brand-slogan {
  font-size: 26rpx;
  color: var(--color-text-light);
  margin-top: 8rpx;
  letter-spacing: 2rpx;
}

/* ===== 磨砂玻璃登录卡片 ===== */
.login-card {
  width: 100%;
  max-width: 640rpx;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 8rpx 48rpx rgba(0,0,0,0.06), 0 0 0 1rpx rgba(255,255,255,0.5) inset;
  position: relative;
  z-index: 1;
}
.card-header {
  text-align: center;
  margin-bottom: 36rpx;
}
.card-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-text);
  display: block;
}
.card-sub {
  font-size: 24rpx;
  color: var(--color-text-light);
  margin-top: 8rpx;
  display: block;
}

/* ===== 微信登录按钮 ===== */
.wechat-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.25);
  transition: all 0.2s;
}
.wechat-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}
.wechat-btn.loading {
  opacity: 0.8;
}
.wechat-btn-inner {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.wechat-icon {
  font-size: 36rpx;
}
.wechat-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
.btn-spinner {
  width: 32rpx; height: 32rpx;
  border: 3rpx solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 分隔线 ===== */
.divider {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 32rpx 0;
}
.divider-line {
  flex: 1;
  height: 1rpx;
  background: rgba(0,0,0,0.08);
}
.divider-text {
  font-size: 22rpx;
  color: var(--color-text-light);
  flex-shrink: 0;
}

/* ===== 手机号登录 ===== */
.phone-login {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.phone-input-row {
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.03);
  border-radius: 16rpx;
  padding: 0 20rpx;
  height: 88rpx;
}
.phone-prefix {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text);
  padding-right: 16rpx;
  border-right: 1rpx solid rgba(0,0,0,0.08);
  margin-right: 16rpx;
}
.phone-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--color-text);
}
.code-row {
  display: flex;
  gap: 16rpx;
}
.code-input {
  flex: 1;
  height: 88rpx;
  background: rgba(0,0,0,0.03);
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: var(--color-text);
}
.code-btn {
  width: 200rpx;
  height: 88rpx;
  background: var(--theme-primary);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  color: #fff;
  transition: all 0.2s;
  flex-shrink: 0;
}
.code-btn:active {
  transform: scale(0.95);
}
.code-btn.disabled {
  opacity: 0.5;
}
.phone-login-btn {
  width: 100%;
  height: 88rpx;
  background: var(--color-text);
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
  transition: all 0.2s;
}
.phone-login-btn:active {
  transform: scale(0.97);
}
.phone-login-btn[disabled] {
  opacity: 0.4;
}

/* ===== 协议 ===== */
.agreement {
  display: flex;
  justify-content: center;
  gap: 4rpx;
  margin-top: 24rpx;
  font-size: 20rpx;
  color: var(--color-text-light);
}
.agreement-link {
  color: var(--theme-primary);
}

/* ===== 跳过 ===== */
.skip-area {
  margin-top: 48rpx;
  padding: 16rpx 32rpx;
  position: relative;
  z-index: 1;
}
.skip-text {
  font-size: 26rpx;
  color: var(--color-text-light);
  opacity: 0.7;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  top: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  color: #fff;
  z-index: 999;
  backdrop-filter: blur(16px);
}
.toast.success {
  background: rgba(7,193,96,0.85);
}
.toast.error {
  background: rgba(200,80,80,0.85);
}
</style>