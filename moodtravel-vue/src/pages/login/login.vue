<template>
  <div class="login-page" :style="pageStyle">
    <!-- 极简单层光晕背景 -->
    <div class="atmosphere">
      <div class="aura" :style="auraStyle" />
    </div>

    <!-- 品牌区 -->
    <div class="brand">
      <div class="brand-mark" :style="{ background: theme.primaryLight + '18', borderColor: theme.primaryLight + '30' }">
        <span class="brand-emoji">{{ store.moodEmoji }}</span>
      </div>
      <span class="brand-name">MoodTravel</span>
      <span class="brand-tagline">情绪旅行</span>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
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
            inputmode="numeric"
          />
        </div>
        <div class="input-row">
          <input
            type="tel"
            v-model="smsCode"
            placeholder="验证码"
            maxlength="6"
            class="field flex-1"
            inputmode="numeric"
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
        <a class="link" @click="$router.push({name:'userAgreement'})">《用户协议》</a>
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

// 页面背景
const pageStyle = computed(() => {
  const t = theme.value
  return {
    background: `linear-gradient(165deg, ${t.bg} 0%, ${t.bgGradient} 40%, ${t.primaryLight}12 100%)`
  }
})

// 单层光晕
const auraStyle = computed(() => ({
  width: '280px',
  height: '280px',
  top: '-60px',
  right: '-80px',
  background: `radial-gradient(circle, ${theme.value.primaryLight}20, ${theme.value.primaryLight}05 60%, transparent)`,
  opacity: 0.15
}))

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
   移动优先：登录页 — 极简呼吸背景
   ============================================================ */
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  position: relative;
  overflow: hidden;
  transition: background 0.8s var(--spring-responsive);
}

/* 单层光晕 */
.atmosphere {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.aura {
  position: absolute;
  border-radius: 50%;
  animation: breathe 18s var(--spring-responsive) infinite alternate;
}
@keyframes breathe {
  0%   { transform: scale(1) translate(0, 0); }
  50%  { transform: scale(1.08) translate(6px, -8px); }
  100% { transform: scale(0.96) translate(-4px, 4px); }
}

/* ============================================================
   品牌区
   ============================================================ */
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36px;
  position: relative;
  z-index: 1;
}
.brand-mark {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  box-shadow: var(--shadow-float);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  transition: all 0.6s var(--spring-responsive);
}
.brand-emoji { font-size: 28px; }
.brand-name {
  font-size: 32px;
  font-weight: 200;
  letter-spacing: 6px;
  color: var(--color-text-primary);
  opacity: 0.85;
}
.brand-tagline {
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 3px;
  color: var(--color-text-light);
  margin-top: 6px;
  opacity: 0.55;
}

/* ============================================================
   登录卡片 — 移动端禁用backdrop-filter
   ============================================================ */
.login-card {
  width: 100%;
  max-width: 340px;
  background: var(--material-card);
  border-radius: 20px;
  padding: 28px 22px 24px;
  position: relative;
  z-index: 1;
  box-shadow:
    0 -0.5px 0 rgba(255,255,255,0.7),
    0 1px 0 rgba(0,0,0,0.03),
    var(--shadow-elevated),
    0 0 0 0.5px rgba(255,255,255,0.4) inset;
  transition: all 0.6s var(--spring-responsive);
}

/* 仅大屏保留backdrop-filter */
@media (min-width: 768px) {
  .login-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 24px;
    padding: 36px 28px 28px;
    box-shadow:
      0 2px 40px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  }
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}
.welcome {
  display: block;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 2px;
  color: var(--color-text-primary);
}
.subtitle {
  display: block;
  font-size: 11px;
  font-weight: 300;
  color: var(--color-text-light);
  margin-top: 6px;
  letter-spacing: 1px;
  opacity: 0.65;
}

/* ============================================================
   微信登录按钮
   ============================================================ */
.wechat-btn {
  width: 100%;
  height: 48px;
  min-height: 44px;
  border: none;
  border-radius: 24px;
  background: linear-gradient(135deg, #2DC85C, #1FA84A);
  color: #fff;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 2px;
  cursor: pointer;
  transition: transform var(--duration-150) var(--spring-responsive),
              box-shadow var(--duration-200) var(--ease-out-expo);
  box-shadow: 0 4px 16px rgba(7, 193, 96, 0.15);
}
.wechat-btn:active {
  transform: scale(0.97);
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
.btn-icon { font-size: 18px; }
.btn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  animation: dotPulse 1s var(--spring-responsive) infinite;
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
  gap: 12px;
  margin: 24px 0;
}
.sep-line {
  flex: 1;
  height: 1px;
  background: var(--divider-light);
}
.sep-text {
  font-size: 10px;
  font-weight: 300;
  color: var(--color-text-light);
  letter-spacing: 2px;
  opacity: 0.45;
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
  background: var(--color-bg);
  box-shadow: var(--shadow-inset);
  border-radius: 12px;
  padding: 0 14px;
  height: 48px;
  min-height: 44px;
  transition: background 0.2s;
}
.input-group:focus-within {
  background: rgba(0, 0, 0, 0.04);
}
.prefix {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-primary);
  padding-right: 12px;
  margin-right: 12px;
}
.field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: 300;
  color: var(--color-text-primary);
  letter-spacing: 1px;
  min-height: 44px;
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
  min-width: 100px;
  height: 48px;
  min-height: 44px;
  border: none;
  border-radius: 12px;
  background: var(--theme-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1px;
  cursor: pointer;
  transition: transform var(--duration-150) var(--spring-responsive);
  flex-shrink: 0;
}
.code-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.submit-btn {
  width: 100%;
  height: 48px;
  min-height: 44px;
  border: none;
  border-radius: 24px;
  background: var(--color-text);
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 3px;
  cursor: pointer;
  transition: transform var(--duration-150) var(--spring-responsive),
              box-shadow var(--duration-200) var(--ease-out-expo);
}
.submit-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.submit-btn:not(:disabled):active {
  transform: scale(0.97);
}

/* ============================================================
   协议
   ============================================================ */
.terms {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  margin-top: 18px;
  font-size: 10px;
  font-weight: 300;
  color: var(--color-text-light);
  opacity: 0.5;
}
.link {
  color: var(--theme-primary);
  cursor: pointer;
  white-space: nowrap;
}

/* ============================================================
   底部跳过
   ============================================================ */
.skip-link {
  margin-top: 32px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 2px;
  color: var(--color-text-tertiary);
  opacity: 0.45;
  cursor: pointer;
  position: relative;
  z-index: 1;
  padding: 12px 16px;
  min-height: 44px;
  transition: opacity 0.3s;
}
.skip-link:active {
  transform: scale(0.97);
  transition: transform var(--spring-snappy);
}

/* ============================================================
   Toast — 移动端禁用backdrop-filter
   ============================================================ */
.toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 300;
  letter-spacing: 1px;
  color: #fff;
  z-index: 999;
  box-shadow: var(--shadow-elevated);
}
.toast.success { background: rgba(7, 193, 96, 0.85); }
.toast.error   { background: rgba(200, 80, 80, 0.85); }
.toast-enter-active {
  transition: all 0.4s var(--spring-responsive);
}
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(-6px); }

/* ============================================================
   桌面端：登录页精致化
   ============================================================ */
@media (min-width: 768px) {
  .login-page {
    padding: 0;
  }

  .brand {
    margin-bottom: 48px;
  }
  .brand-mark {
    width: 80px;
    height: 80px;
    border-radius: 22px;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  }
  .brand-emoji { font-size: 36px; }
  .brand-name {
    font-size: 32px;
    letter-spacing: 8px;
  }
  .brand-tagline {
    font-size: 13px;
    letter-spacing: 5px;
    margin-top: 8px;
  }

  .login-card {
    max-width: 380px;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    border-radius: 24px;
    padding: 40px 32px 32px;
    box-shadow:
      0 4px 48px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
    transition: transform 0.3s var(--spring-responsive),
                box-shadow 0.4s;
  }
  .login-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 56px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  }

  .card-header { margin-bottom: 36px; }
  .welcome {
    font-size: 24px;
    font-family: 'Playfair Display', 'Georgia', serif;
    font-weight: 500;
  }
  .subtitle { font-size: 13px; margin-top: 8px; }

  .wechat-btn {
    height: 52px;
    border-radius: 26px;
    font-size: 16px;
    transition: transform 0.2s var(--spring-responsive),
                box-shadow 0.3s;
  }
  .wechat-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(7, 193, 96, 0.25);
  }

  .input-group {
    height: 52px;
    border-radius: 14px;
  }
  .submit-btn {
    height: 52px;
    border-radius: 26px;
    font-size: 15px;
    transition: transform 0.2s, box-shadow 0.3s;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .skip-link {
    margin-top: 48px;
    font-size: 14px;
    letter-spacing: 3px;
    transition: opacity 0.3s, color 0.3s;
  }
  .skip-link:hover {
    opacity: 0.8;
    color: var(--theme-primary);
  }
}
</style>