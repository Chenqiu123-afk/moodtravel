<template>
  <div class="certified-page" :style="{ background: pageBg }">
    <!-- ============================================================ -->
    <!-- 顶部导航 -->
    <!-- ============================================================ -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <div class="header-center">
        <span class="header-title">寻找治愈空间</span>
        <span class="header-sub">认证商家 · 品质保障</span>
      </div>
      <div class="header-right" />
    </div>

    <!-- ============================================================ -->
    <!-- 分类筛选栏 -->
    <!-- ============================================================ -->
    <div class="filter-bar">
      <div
        v-for="cat in categories"
        :key="cat.key"
        class="filter-chip"
        :class="{ active: activeCategory === cat.key }"
        :style="activeCategory === cat.key ? { background: theme.primary + '18', color: theme.primary, borderColor: theme.primary } : {}"
        @click="activeCategory = cat.key"
      >
        <span class="filter-chip-icon">{{ cat.icon }}</span>
        <span class="filter-chip-label">{{ cat.label }}</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 认证商家列表 -->
    <!-- ============================================================ -->
    <div class="merchant-list">
      <TransitionGroup name="list" tag="div" class="merchant-grid" move-class="list-move">
        <div
          v-for="m in filteredMerchants"
          :key="m.id"
          class="merchant-card glass-card"
          @click="goToDetail(m)"
        >
          <!-- 商家图片 -->
          <div class="merchant-image">
            <img :src="m.imageUrl" :alt="m.name" loading="lazy" />
            <!-- 认证徽章 -->
            <div class="cert-badge" :class="certLevelClass(m.certifiedLevel)">
              <span class="cert-badge-icon">✓</span>
              <span class="cert-badge-text">{{ m.certifiedLevel }}</span>
            </div>
          </div>

          <!-- 商家信息 -->
          <div class="merchant-info">
            <div class="merchant-name-row">
              <h3 class="merchant-name">{{ m.name }}</h3>
              <span class="merchant-rating">⭐ {{ m.rating }}</span>
            </div>

            <!-- 认证编号 -->
            <div class="cert-number">
              <span class="cert-number-icon">🛡️</span>
              <span class="cert-number-text">认证编号：{{ m.certificationNumber }}</span>
            </div>

            <!-- 地址 -->
            <p class="merchant-address">📍 {{ m.address }}</p>

            <!-- 标签 -->
            <div class="merchant-tags">
              <span
                v-for="tag in m.tags"
                :key="tag"
                class="merchant-tag"
                :style="{ background: theme.primary + '10', color: theme.primary }"
              >
                {{ tag }}
              </span>
            </div>

            <!-- 价格与预订 -->
            <div class="merchant-footer">
              <div class="merchant-price">
                <span class="price-original" v-if="m.platformPrice < m.basePrice">¥{{ m.basePrice }}</span>
                <span class="price-current" :style="{ color: theme.primary }">
                  {{ m.platformPrice > 0 ? '¥' + m.platformPrice : '免费' }}
                </span>
                <span class="price-save" v-if="m.platformPrice < m.basePrice && m.platformPrice > 0">
                  省¥{{ m.basePrice - m.platformPrice }}
                </span>
              </div>
              <button
                class="book-btn"
                :style="{ background: theme.primary }"
                @click.stop="handleBooking(m)"
              >
                预订
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="filteredMerchants.length === 0" class="empty-state">
        <span class="empty-icon">🌿</span>
        <span class="empty-text">该分类暂无认证商家，去看看其他分类吧</span>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 预订分成弹窗 -->
    <!-- ============================================================ -->
    <div class="popup-overlay" v-if="showSharePopup" @click="showSharePopup = false">
      <div class="share-popup" @click.stop>
        <div class="share-popup-header">
          <span class="share-popup-icon">🤝</span>
          <span class="share-popup-title">订单确认</span>
        </div>
        <div class="share-popup-body">
          <div class="share-merchant-info">
            <span class="share-merchant-name">{{ bookingMerchant?.name }}</span>
            <span class="share-cert-badge">✓ 认证商家</span>
          </div>
          <div class="share-detail-row">
            <span class="share-detail-label">原价</span>
            <span class="share-detail-value">¥{{ bookingMerchant?.basePrice }}</span>
          </div>
          <div class="share-detail-row">
            <span class="share-detail-label">平台价</span>
            <span class="share-detail-value highlight" :style="{ color: theme.primary }">
              ¥{{ bookingMerchant?.platformPrice }}
            </span>
          </div>
          <div class="share-divider" />
          <div class="share-detail-row">
            <span class="share-detail-label">平台服务费 (2%)</span>
            <span class="share-detail-value">¥{{ platformFee }}</span>
          </div>
          <div class="share-detail-row">
            <span class="share-detail-label">商家分成 ({{ (bookingMerchant?.revenueShareRate || 0) * 100 }}%)</span>
            <span class="share-detail-value share-amount">¥{{ shareAmount }}</span>
          </div>
          <div class="share-note">
            <span>💡 订单金额的 {{ (bookingMerchant?.revenueShareRate || 0) * 100 }}% 将作为平台运营分成，用于品质审核与用户权益保障。</span>
          </div>
        </div>
        <div class="share-popup-footer">
          <button class="share-cancel-btn" @click="showSharePopup = false">取消</button>
          <button
            class="share-confirm-btn"
            :style="{ background: theme.primary }"
            @click="confirmBooking"
            :disabled="isBooking"
          >
            {{ isBooking ? '处理中...' : '确认预订' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 预订成功 Toast -->
    <Transition name="toast">
      <div v-if="bookingSuccess" class="success-toast" :style="{ background: toastBg }">
        <span class="success-toast-icon">🎉</span>
        <span class="success-toast-text">预订成功！已为您保留位置</span>
      </div>
    </Transition>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import { CERTIFIED_MERCHANTS } from '@/data/certifiedData.js'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const activeCategory = ref('all')
const showSharePopup = ref(false)
const bookingMerchant = ref(null)
const isBooking = ref(false)
const bookingSuccess = ref(false)

const categories = [
  { key: 'all', icon: '🏷️', label: '全部' },
  { key: 'hotel', icon: '🏨', label: '酒店住宿' },
  { key: 'restaurant', icon: '🍽️', label: '餐饮美食' },
  { key: 'leisure', icon: '🧘', label: '休闲放松' },
  { key: 'attraction', icon: '🎭', label: '景点游玩' }
]

const filteredMerchants = computed(() => {
  if (activeCategory.value === 'all') return CERTIFIED_MERCHANTS
  return CERTIFIED_MERCHANTS.filter(m => m.category === activeCategory.value)
})

const platformFee = computed(() => {
  if (!bookingMerchant.value) return 0
  return Math.round(bookingMerchant.value.platformPrice * 0.02 * 100) / 100
})

const shareAmount = computed(() => {
  if (!bookingMerchant.value) return 0
  return Math.round(bookingMerchant.value.platformPrice * bookingMerchant.value.revenueShareRate * 100) / 100
})

const pageBg = computed(() => theme.value.bg)
const toastBg = computed(() => `linear-gradient(135deg, ${theme.value.bg}, #FFFCF8)`)

function certLevelClass(level) {
  if (level === '钻石认证') return 'diamond'
  if (level === '金牌认证') return 'gold'
  return 'silver'
}

function goBack() {
  router.back()
}

function goToDetail(merchant) {
  router.push({ name: 'detail', params: { id: merchant.id } })
}

function handleBooking(merchant) {
  bookingMerchant.value = merchant
  showSharePopup.value = true
}

function confirmBooking() {
  if (isBooking.value) return
  isBooking.value = true
  setTimeout(() => {
    isBooking.value = false
    showSharePopup.value = false
    bookingSuccess.value = true
    setTimeout(() => {
      bookingSuccess.value = false
    }, 2500)
  }, 1000)
}
</script>

<style scoped>
.certified-page {
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
  color: #8BA88C;
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

.header-right {
  width: 36px;
}

/* ===== 分类筛选栏 ===== */
.filter-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-bar::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid #E0DCD4;
  background: rgba(255,255,255,0.6);
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-light);
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  border-color: transparent;
}

.filter-chip-icon {
  font-size: 14px;
  line-height: 1;
}

/* ===== 商家列表 ===== */
.merchant-list {
  margin-bottom: 16px;
}

.merchant-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* TransitionGroup 动画 */
.list-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.list-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* ===== 商家卡片 ===== */
.merchant-card {
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,.04));
}

.merchant-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.merchant-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.merchant-card:active .merchant-image img {
  transform: scale(1.03);
}

/* 认证徽章 */
.cert-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.cert-badge.diamond {
  background: linear-gradient(135deg, #B8C4F8, #8E9FE6);
}

.cert-badge.gold {
  background: linear-gradient(135deg, #D4A84B, #C4943A);
}

.cert-badge.silver {
  background: linear-gradient(135deg, #A8B8A8, #8BA88C);
}

.cert-badge-icon {
  font-size: 10px;
}

/* 商家信息 */
.merchant-info {
  padding: 14px;
}

.merchant-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.merchant-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  flex: 1;
}

.merchant-rating {
  font-size: 12px;
  font-weight: 600;
  color: #E8945A;
  flex-shrink: 0;
}

.cert-number {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: #8BA88C10;
  border-radius: 6px;
  width: fit-content;
}

.cert-number-icon {
  font-size: 12px;
}

.cert-number-text {
  font-size: 11px;
  font-weight: 600;
  color: #8BA88C;
}

.merchant-address {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--color-text-light);
  line-height: 1.4;
}

.merchant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.merchant-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.merchant-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #F0EDE8;
}

.merchant-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price-original {
  font-size: 12px;
  color: #C0BCB4;
  text-decoration: line-through;
}

.price-current {
  font-size: 18px;
  font-weight: 800;
  transition: color 0.5s;
}

.price-save {
  font-size: 10px;
  font-weight: 700;
  color: #8BA88C;
  background: #8BA88C15;
  padding: 2px 6px;
  border-radius: 6px;
}

.book-btn {
  padding: 8px 20px;
  border-radius: 16px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.book-btn:active {
  transform: scale(0.95);
  opacity: 0.9;
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-light);
}

.empty-icon {
  display: block;
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  font-weight: 400;
}

/* ===== 预订分成弹窗 ===== */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.25s;
}

@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

.share-popup {
  width: 85%;
  max-width: 320px;
  background: #FFFCF8;
  border-radius: 16px;
  padding: 20px;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}

.share-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.share-popup-icon {
  font-size: 24px;
}

.share-popup-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}

.share-merchant-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #F8F6F2;
  border-radius: 8px;
}

.share-merchant-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.share-cert-badge {
  font-size: 10px;
  font-weight: 700;
  color: #8BA88C;
  background: #8BA88C15;
  padding: 3px 8px;
  border-radius: 8px;
}

.share-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.share-detail-label {
  font-size: 13px;
  color: var(--color-text-light);
}

.share-detail-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.share-detail-value.highlight {
  font-size: 16px;
  font-weight: 800;
}

.share-detail-value.share-amount {
  color: #8BA88C;
  font-weight: 700;
}

.share-divider {
  height: 1px;
  background: #E8E4DC;
  margin: 6px 0;
}

.share-note {
  margin-top: 10px;
  padding: 8px 10px;
  background: #F8FFF0;
  border-radius: 8px;
  font-size: 11px;
  color: #6B8E6C;
  line-height: 1.5;
}

.share-popup-footer {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.share-cancel-btn {
  flex: 1;
  height: 42px;
  border-radius: 21px;
  border: 1px solid #E0DCD4;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-light);
  cursor: pointer;
}

.share-confirm-btn {
  flex: 2;
  height: 42px;
  border-radius: 21px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.share-confirm-btn:active {
  transform: scale(0.97);
}

.share-confirm-btn:disabled {
  opacity: 0.7;
}

/* ===== 预订成功 Toast ===== */
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