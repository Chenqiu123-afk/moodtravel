<template>
  <div class="home-page" :style="{ background: gradientBg }">

    <!-- ============================================================ -->
    <!-- 导航栏（新增长辈关怀开关） -->
    <!-- ============================================================ -->
    <div class="nav-bar">
      <div class="nav-left">
        <span class="logo-text" :style="{ color: theme.primary }">MoodTravel</span>
      </div>
      <div class="nav-right">
        <!-- 长辈关怀模式开关 -->
        <div class="elder-toggle">
          <span class="toggle-label">👴 长辈关怀</span>
          <label class="switch-wrapper">
            <input
              type="checkbox"
              :checked="store.elderlyMode"
              @change="store.toggleElderlyMode"
            />
            <span
              class="switch-slider"
              :style="{ '--switch-color': theme.primary }"
            ></span>
          </label>
        </div>
        <!-- 寻找治愈空间入口 -->
        <div class="chat-entry" @click="goToCertified" :style="{ background: healEntryBg }">
          <span class="chat-entry-icon">🌿</span>
          <span class="chat-entry-label">寻找治愈空间</span>
        </div>
        <!-- AI 向导入口 -->
        <div class="chat-entry" @click="goToChat" :style="{ background: aiWizardBg }">
          <span class="chat-entry-icon">✨</span>
          <span class="chat-entry-label">AI 向导</span>
        </div>
        <!-- 头像入口 -->
        <div class="avatar" :style="{ background: theme.primaryLight + '30' }" @click="goToMine">
          {{ store.moodEmoji }}
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 今日向导模式 (旅程进行中) -->
    <!-- ============================================================ -->
    <template v-if="store.tripActive && store.itinerary">
      <!-- 导航栏 -->
      <div class="nav-bar guide-nav">
        <div class="nav-left">
          <span class="guide-badge" :style="{ background: theme.primary + '20', color: theme.primary }">
            🗺️ 今日向导
          </span>
        </div>
        <div class="nav-right">
          <span class="guide-day-badge" :style="{ background: theme.primary, color: '#fff' }">
            Day {{ currentDay.day }}
          </span>
        </div>
      </div>

      <!-- 目的地状态 -->
      <div class="guide-status">
        <span class="guide-dest">{{ store.destination }}</span>
        <span class="guide-status-dot" :style="{ background: theme.primary }" />
        <span class="guide-status-text">正在进行中</span>
      </div>

      <!-- 当前进度卡片 -->
      <div class="guide-progress-card depth-card">
        <div class="progress-time-row">
          <span class="progress-label">⏰ 当前时间</span>
          <span class="progress-time">{{ simulatedTime }}</span>
        </div>
        <div class="progress-next">
          <span class="progress-label">📍 下一站</span>
          <span class="progress-next-name">{{ nextItem?.name || '今日行程已结束' }}</span>
        </div>
        <div v-if="nextItem" class="progress-meta">
          <div class="progress-meta-item">
            <span>🚶 距离约 {{ nextItemDistance }}m</span>
          </div>
          <div class="progress-meta-item">
            <span>🕐 建议 {{ nextItemTime }}</span>
          </div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" :style="{ width: dayProgress + '%', background: theme.primary }" />
        </div>
        <span class="progress-text">今日已完成 {{ completedCount }}/{{ totalCount }} 项</span>
      </div>

      <!-- 贴心提示 -->
      <div class="guide-tips">
        <div class="section-title">
          <span class="title-icon">💡</span>
          <span class="title-text">贴心提示</span>
        </div>
        <div class="tips-list">
          <div v-for="(tip, i) in guideTips" :key="i" class="tip-item">
            <span class="tip-icon">{{ tip.icon }}</span>
            <span class="tip-text">{{ tip.text }}</span>
          </div>
        </div>
      </div>

      <!-- 今日行程概览 -->
      <div class="guide-timeline">
        <div class="section-title">
          <span class="title-icon">📋</span>
          <span class="title-text">今日行程</span>
        </div>
        <div class="guide-timeline-list">
          <div
            v-for="(item, ii) in currentDay.items"
            :key="ii"
            class="guide-timeline-item"
            :class="{
              done: ii < currentItemIndex,
              active: ii === currentItemIndex,
              upcoming: ii > currentItemIndex
            }"
          >
            <div class="guide-tl-dot" :style="ii <= currentItemIndex ? { background: theme.primary } : {}" />
            <div class="guide-tl-content">
              <span class="guide-tl-time">{{ item.time }}</span>
              <span class="guide-tl-name">{{ item.name }}</span>
              <span v-if="ii === currentItemIndex" class="guide-tl-tag" :style="{ background: theme.primary }">当前</span>
              <span v-else-if="ii < currentItemIndex" class="guide-tl-check">✓</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="guide-actions">
        <button class="guide-btn secondary" @click="endTrip">结束旅程</button>
        <button class="guide-btn primary" :style="{ background: theme.primary }" @click="goToPlan">查看完整行程</button>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- 普通首页模式 -->
    <!-- ============================================================ -->
    <template v-else>
      <!-- 能量状态滑块 -->
      <div class="energy-section">
        <div class="energy-header">
          <span class="energy-greeting">{{ elderlyGreeting }}</span>
          <span class="energy-sub">{{ elderlySub }}</span>
        </div>

        <!-- ============================================================ -->
        <!-- 显性情绪选择器（极简三态：😐平静 😫焦虑 ✨兴奋） -->
        <!-- ============================================================ -->
        <div class="explicit-mood" v-if="!store.elderlyMode">
          <span class="explicit-mood-label">快速选择心情：</span>
          <div class="explicit-mood-options">
            <button
              class="explicit-mood-btn"
              :class="{ active: store.moodLabel === 'calm' }"
              :style="store.moodLabel === 'calm' ? activeMoodStyle('calm') : {}"
              @click="quickMood('calm', '😐')"
            >
              <span class="explicit-mood-emoji">😐</span>
              <span class="explicit-mood-text">平静</span>
            </button>
            <button
              class="explicit-mood-btn anxious-btn"
              :class="{ active: store.moodLabel === 'anxious' }"
              :style="store.moodLabel === 'anxious' ? activeMoodStyle('anxious') : {}"
              @click="quickMoodAnxious"
            >
              <span class="explicit-mood-emoji">😫</span>
              <span class="explicit-mood-text">焦虑</span>
              <span class="explicit-mood-hint">去散心</span>
            </button>
            <button
              class="explicit-mood-btn"
              :class="{ active: store.moodLabel === 'excited' }"
              :style="store.moodLabel === 'excited' ? activeMoodStyle('excited') : {}"
              @click="quickMood('excited', '🤩')"
            >
              <span class="explicit-mood-emoji">✨</span>
              <span class="explicit-mood-text">兴奋</span>
            </button>
          </div>
        </div>

        <div class="mode-switch-row">
          <ModeSwitch />
        </div>

        <!-- 滑块主体 -->
        <div class="energy-slider-wrap">
          <div class="energy-track" :style="energyTrackStyle">
            <div class="energy-fill" :style="energyFillStyle" />
            <div class="energy-thumb" :style="energyThumbStyle" />
          </div>
          <div class="energy-labels">
            <span
              class="energy-label left"
              :class="{ active: energyPercent <= 20 }"
              @click="setEnergy(0)"
            >
              🛋️ 躺平
            </span>
            <span
              class="energy-mid-label"
              :style="{ color: energyLabelColor }"
            >
              {{ energyLabelText }}
            </span>
            <span
              class="energy-label right"
              :class="{ active: energyPercent >= 80 }"
              @click="setEnergy(100)"
            >
              🗺️ 探索
            </span>
          </div>
          <!-- 隐藏的原生 range 用于拖拽（长辈模式下会全局隐藏） -->
          <input
            type="range"
            class="energy-input"
            :value="store.energyLevel"
            :min="0"
            :max="100"
            :step="1"
            @input="onEnergyInput"
          />
        </div>

        <!-- 长辈模式：增加能量档位大按钮 -->
        <div v-if="store.elderlyMode" class="elder-energy-buttons">
          <button
            v-for="btn in energyButtons"
            :key="btn.value"
            class="elder-energy-btn"
            :class="{ active: isNearEnergy(btn.value) }"
            :style="{
              borderColor: activeEnergyBtnColor,
              background: isNearEnergy(btn.value) ? theme.primary + '15' : 'transparent',
              color: isNearEnergy(btn.value) ? theme.primary : '#333'
            }"
            @click="setEnergy(btn.value)"
          >
            {{ btn.label }}
          </button>
        </div>

        <!-- 能量推荐卡片 -->
        <div class="energy-cards" :style="cardsStyle">
          <div class="energy-card material-card" :style="energyCardStyle(0)">
            <span class="energy-card-icon">{{ energyCards[0].icon }}</span>
            <span class="energy-card-title">{{ energyCards[0].title }}</span>
            <span class="energy-card-desc">{{ energyCards[0].desc }}</span>
          </div>
          <div class="energy-card material-card" :style="energyCardStyle(1)">
            <span class="energy-card-icon">{{ energyCards[1].icon }}</span>
            <span class="energy-card-title">{{ energyCards[1].title }}</span>
            <span class="energy-card-desc">{{ energyCards[1].desc }}</span>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- 日常情绪与人文关怀 — 每日心情打卡 -->
      <!-- ============================================================ -->
      <div class="daily-care-section">
        <MoodCheckIn @goJournal="goToJournal" />
      </div>

      <!-- 预算滑块 -->
      <div class="budget-section" v-if="!store.elderlyMode">
        <BudgetSlider
          v-model="store.budget"
          :min="0"
          :max="5000"
          :step="100"
          :theme="theme"
        />
      </div>

      <!-- ============================================================ -->
      <!-- 日常微情绪场景 — 金刚区快捷入口（高频打低频） -->
      <!-- ============================================================ -->
      <div class="scenario-section" v-if="!store.elderlyMode">
        <div class="scenario-scroll">
          <div
            v-for="sc in scenarios"
            :key="sc.key"
            class="scenario-chip spring-touch"
            :class="{ active: store.dailyScenario === sc.key }"
            :style="store.dailyScenario === sc.key ? { background: theme.primary + '15', borderColor: theme.primary } : {}"
            @click="toggleScenario(sc.key)"
          >
            <span class="scenario-icon">{{ sc.icon }}</span>
            <span class="scenario-label">{{ sc.label }}</span>
          </div>
        </div>
      </div>

      <!-- 每日人文关怀入口卡片 -->
      <div class="care-entry material-card spring-press" @click="goToDailyCare">
        <div class="care-entry-left">
          <span class="care-entry-icon">💌</span>
          <div class="care-entry-info">
            <span class="care-entry-title">今日暖心关怀</span>
            <span class="care-entry-desc">小旅为你准备了一封特别的信</span>
          </div>
        </div>
        <span class="care-entry-arrow">›</span>
      </div>

      <!-- 天气预警卡片 -->
      <WeatherAlert
        v-if="showWeatherAlert"
        type="rain"
        message="外面下着小雨呢，带把伞吧。小雨淅沥的西湖，反而更有江南韵味。"
        :details="['预计持续 2 小时', '气温 18°C，体感微凉', '建议改为室内场馆或备伞出行']"
        action-label="查看雨天行程"
        @dismiss="showWeatherAlert = false"
        @action="onWeatherAction"
      />

      <!-- 认证商家筛选 -->
      <div class="certified-filter" v-if="!store.elderlyMode">
        <label class="certified-checkbox" @click="store.toggleCertifiedOnly">
          <span class="certified-checkbox-icon" :class="{ checked: store.certifiedOnly }" :style="store.certifiedOnly ? { background: theme.primary, borderColor: theme.primary } : {}">
            <span v-if="store.certifiedOnly">✓</span>
          </span>
          <span class="certified-checkbox-label">仅看认证商家</span>
          <span class="certified-checkbox-badge" :style="{ background: '#8BA88C' + '20', color: '#8BA88C' }">品质保障</span>
        </label>
        <span class="certified-filter-hint" :style="{ color: theme.primary }" @click="goToCertified">查看全部 ›</span>
      </div>

      <!-- ============================================================ -->
      <!-- 精选地点推荐列表（基于能量 + 场景过滤，TransitionGroup 动画） -->
      <!-- 长辈模式：极简大卡片，只保留图片+名字+距离 -->
      <!-- ============================================================ -->
      <div class="spots-section">
        <div class="section-title">
          <span class="title-icon">{{ sectionIcon }}</span>
          <span class="title-text">{{ sectionTitle }}</span>
          <span class="title-hint">{{ filteredSpots.length }} 个推荐</span>
        </div>

        <!-- 长辈模式：极简列表 -->
        <template v-if="store.elderlyMode">
          <div class="elder-spots-list">
            <div
              v-for="spot in filteredSpots"
              :key="spot.id"
              class="elder-spot-card"
              @click="onSpotClick(spot)"
            >
              <div class="elder-spot-image">
                <img :src="spot.imageUrl" :alt="spot.title" loading="lazy" />
              </div>
              <div class="elder-spot-info">
                <span class="elder-spot-name">{{ spot.elderDesc || spot.title }}</span>
                <span class="elder-spot-distance">距您{{ spot.distance }}米</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 普通模式：TransitionGroup 卡片 -->
        <TransitionGroup
          v-else
          name="list"
          tag="div"
          class="spots-grid"
          move-class="list-move"
        >
          <div
            v-for="spot in filteredSpots"
            :key="spot.id"
            class="spot-card material-card spring-press"
            @click="onSpotClick(spot)"
          >
            <div class="spot-image">
              <img :src="spot.imageUrl" :alt="spot.title" loading="lazy" />
            </div>
            <div class="spot-info">
              <h3 class="spot-title">{{ spot.title }}</h3>
              <p class="spot-desc">{{ spot.description }}</p>
              <div class="spot-tags">
                <span
                  v-for="tag in spot.tags"
                  :key="tag"
                  class="spot-tag"
                  :style="{ background: theme.primary + '10', color: theme.primary }"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- 如果没有匹配结果 -->
        <div v-if="filteredSpots.length === 0" class="empty-state">
          <span class="empty-icon">🧘</span>
          <span class="empty-text">调整一下能量值，看看有什么惊喜吧</span>
        </div>
      </div>

      <!-- 心情选择器 -->
      <div class="section" v-if="!store.elderlyMode">
        <div class="section-title">
          <span class="title-icon">😊</span>
          <span class="title-text">此刻的心情？</span>
          <span class="title-hint">选择心情，自动切换主题色</span>
        </div>
        <div class="mood-grid">
          <div
            v-for="mood in moods"
            :key="mood.key"
            class="mood-item material-card spring-press"
            :class="{ active: store.moodLabel === mood.key }"
            :style="moodItemStyle(mood)"
            @click="selectMood(mood)"
          >
            <span class="mood-emoji">{{ mood.emoji }}</span>
            <span class="mood-label">{{ mood.label }}</span>
            <span class="mood-hint">{{ mood.hint }}</span>
            <div class="mood-theme-dot" :style="{ background: mood.themeColor }" />
            <div v-if="store.moodLabel === mood.key" class="mood-check">✓</div>
          </div>
        </div>
      </div>

      <!-- 快捷设置 -->
      <div class="section" v-if="!store.elderlyMode">
        <div class="section-title">
          <span class="title-icon">⚙️</span>
          <span class="title-text">快速设置</span>
        </div>
        <div class="toggle-group">
          <div class="toggle-row material-card spring-press" @click="store.toggleSetting('diet')">
            <div class="toggle-left">
              <div class="toggle-icon" :style="{ background: theme.primary + '15' }">🥗</div>
              <div class="toggle-info">
                <span class="toggle-name">正在减肥</span>
                <span class="toggle-hint">推荐低卡健康餐食</span>
              </div>
            </div>
            <label class="switch-wrapper">
              <input type="checkbox" :checked="store.isDieting" @change="store.toggleSetting('diet')" />
              <span class="switch-slider" :style="{ '--switch-color': theme.primary }"></span>
            </label>
          </div>
          <div class="toggle-row material-card spring-press" @click="store.toggleSetting('budget')">
            <div class="toggle-left">
              <div class="toggle-icon" :style="{ background: theme.primary + '15' }">💰</div>
              <div class="toggle-info">
                <span class="toggle-name">预算敏感</span>
                <span class="toggle-hint">优先免费低价景点</span>
              </div>
            </div>
            <label class="switch-wrapper">
              <input type="checkbox" :checked="store.budgetSensitive" @change="store.toggleSetting('budget')" />
              <span class="switch-slider" :style="{ '--switch-color': theme.primary }"></span>
            </label>
          </div>
          <div class="toggle-row material-card spring-press" @click="openCompanionPopup">
            <div class="toggle-left">
              <div class="toggle-icon" :style="{ background: theme.primary + '15' }">👥</div>
              <div class="toggle-info">
                <span class="toggle-name">同行人设置</span>
                <span class="toggle-hint">{{ companionSummary }}</span>
              </div>
            </div>
            <span class="toggle-arrow">›</span>
          </div>
        </div>
      </div>

      <!-- 开始规划按钮 -->
      <button class="plan-btn spring-press" :style="planBtnStyle" @click="startPlan">
        <span class="plan-btn-text">{{ store.displayMode === 'travel' ? '✨ 开始规划旅程' : '🚀 快速出行规划' }}</span>
      </button>

      <!-- 旅程预览 -->
      <div class="preview-section" v-if="store.itinerary">
        <div class="section-title">
          <span class="title-icon">📋</span>
          <span class="title-text">最近行程</span>
        </div>
        <div class="preview-card material-card spring-press" @click="goToPlan">
          <div class="preview-header">
            <span class="preview-dest">{{ store.destination }}</span>
            <span class="preview-days">{{ store.days }}天行程</span>
          </div>
          <div class="preview-stats">
            <span>预算 ¥{{ store.budget }} · {{ store.companionCount }}人同行</span>
          </div>
        </div>
      </div>

      <!-- 长辈模式：悬浮一键呼叫按钮 -->
      <div v-if="store.elderlyMode" class="elder-float-btn" :style="{ background: 'linear-gradient(135deg, #E06060, #C04040)', boxShadow: '0 6px 20px rgba(224,96,96,0.45)' }" @click="onCallFamily">
        <span class="elder-float-icon">📞</span>
        <span class="elder-float-label">一键呼叫家人</span>
      </div>

      <!-- 同行人设置弹窗 -->
      <div class="popup-overlay" v-if="store.showCompanionPopup" @click="closeCompanionPopup">
        <div class="popup-sheet" @click.stop :style="{ background: popupBg }">
          <div class="popup-handle" />
          <div class="popup-header">
            <span class="popup-title">👥 同行人设置</span>
            <span class="popup-close" @click="closeCompanionPopup">✕</span>
          </div>
          <div class="popup-body">
            <span class="popup-desc">添加同行人，AI 将据此优化景点和酒店推荐</span>
            <div class="companion-list">
              <div v-for="(c, idx) in store.companions" :key="idx" class="companion-item">
                <div class="companion-avatar" :style="{ background: theme.primary + '20' }">
                  <span>{{ roleEmoji(c.role) }}</span>
                </div>
                <div class="companion-info">
                  <span class="companion-name">{{ c.name }}</span>
                  <span class="companion-detail">{{ roleLabel(c.role) }} · {{ c.age }}岁</span>
                </div>
                <div class="companion-actions">
                  <select class="companion-select" @change="(e) => changeRole(idx, e.target.value)">
                    <option v-for="(ro, ri) in roleOptions" :key="ri" :value="ri">{{ ro }}</option>
                  </select>
                  <span v-if="idx > 0" class="companion-remove" @click="store.removeCompanion(idx)">移除</span>
                </div>
              </div>
            </div>
            <div class="add-buttons">
              <div class="add-btn" @click="quickAdd('child')" :style="{ borderColor: theme.primary }">
                <span class="add-btn-icon">👶</span>
                <span class="add-btn-text">带小孩</span>
              </div>
              <div class="add-btn" @click="quickAdd('elderly')" :style="{ borderColor: theme.primary }">
                <span class="add-btn-icon">👴</span>
                <span class="add-btn-text">带老人</span>
              </div>
              <div class="add-btn" @click="quickAdd('friend')" :style="{ borderColor: theme.primary }">
                <span class="add-btn-icon">🙋</span>
                <span class="add-btn-text">加朋友</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <button class="popup-confirm-btn" :style="{ background: theme.primary }" @click="closeCompanionPopup">
              确认 ({{ store.companionCount }}人)
            </button>
          </div>
        </div>
      </div>
    </template>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'
import { travelSpots } from '@/data/travelData.js'
import WeatherAlert from '@/components/WeatherAlert.vue'
import MoodCheckIn from '@/components/MoodCheckIn.vue'
import BudgetSlider from '@/components/BudgetSlider.vue'
import ModeSwitch from '@/components/ModeSwitch.vue'

const store = useTravelStore()
const router = useRouter()
const theme = computed(() => store.activeTheme)

/* ============================================================
   基于能量水平 + 场景过滤的精选地点
   - 能量阈值：显示 energyLevel <= 当前滑块 + 10
   - 场景过滤：当 dailyScenario 激活时，只显示距离 <= 500m 且匹配场景的点
============================================================ */
const filteredSpots = computed(() => {
  const threshold = store.energyLevel + 10
  let spots = travelSpots.filter(spot => spot.energyLevel <= threshold)

  // 日常场景过滤：距离 <= 500m 且匹配场景
  if (store.dailyScenario) {
    spots = spots.filter(spot => spot.distance <= 500 && spot.scenario === store.dailyScenario)
  }

  return spots
})

/* ============================================================
   日常微情绪场景 — 金刚区
============================================================ */
const scenarios = [
  { key: 'walk',    icon: '🚶‍♂️', label: '下班透透气' },
  { key: 'break',   icon: '☕',   label: '摸鱼5分钟' },
  { key: 'grocery', icon: '🛒',   label: '帮长辈买菜' },
  { key: 'rain',    icon: '🌧️',   label: '雨天躲雨处' }
]

function toggleScenario(key) {
  store.dailyScenario = store.dailyScenario === key ? null : key
}

/* ============================================================
   长辈模式 — 文案降级 & 功能放大
============================================================ */
const elderlyGreeting = computed(() => {
  return store.elderlyMode ? '您好，今天想去哪里走走？' : '嗨，今天想去哪里？'
})

const elderlySub = computed(() => {
  return store.elderlyMode ? '附近有好去处，慢慢看，不急' : store.moodDescription
})

const sectionIcon = computed(() => {
  return store.elderlyMode ? '📍' : '✨'
})

const sectionTitle = computed(() => {
  return store.elderlyMode ? '附近的好去处' : '此刻适合去'
})

function onCallFamily() {
  // 模拟呼叫家人
  const confirmed = confirm('即将呼叫紧急联系人，确认拨打吗？')
  if (confirmed) {
    // 模拟呼叫动画
    alert('正在呼叫家人...\n\n已为您拨打紧急联系人的电话，请稍候。')
  }
}

/* ============================================================
   渐变背景计算
   根据当前能量水平动态调整背景色调
============================================================ */
const gradientBg = computed(() => {
  const t = theme.value
  const p = store.energyLevel / 100
  const r = Math.round(237 + p * 8)
  const g = Math.round(243 + p * 5)
  const b = Math.round(246 + p * 4)
  const r2 = Math.round(220 + p * 12)
  const g2 = Math.round(232 + p * 8)
  const b2 = Math.round(238 + p * 6)
  return `linear-gradient(180deg, rgb(${r2},${g2},${b2}) 0%, rgb(${r},${g},${b}) 30%)`
})

/* ============================================================
   能量滑块相关计算
============================================================ */
const energyPercent = computed(() => store.energyLevel)

const energyLabelText = computed(() => {
  const p = energyPercent.value
  if (p <= 20) return '放松充电'
  if (p <= 40) return '轻度漫步'
  if (p <= 60) return '适度游玩'
  if (p <= 80) return '活力探索'
  return '全情投入'
})

const energyLabelColor = computed(() => {
  const p = energyPercent.value
  const r = Math.round(122 + p * 0.3)
  const g = Math.round(158 + p * (-0.2))
  const b = Math.round(118 + p * (-0.1))
  return `rgb(${r},${g},${b})`
})

const energyTrackStyle = computed(() => {
  const p = energyPercent.value / 100
  const r = Math.round(200 + p * (-30))
  const g = Math.round(210 + p * (-20))
  const b = Math.round(196 + p * (-10))
  return { background: `rgb(${r},${g},${b})` }
})

const energyFillStyle = computed(() => {
  const p = energyPercent.value / 100
  const r = Math.round(180 - p * 58)
  const g = Math.round(190 - p * 32)
  const b = Math.round(176 - p * 58)
  return {
    width: energyPercent.value + '%',
    background: `linear-gradient(90deg, rgb(${r},${g},${b}), #7A9E76)`
  }
})

const energyThumbStyle = computed(() => {
  const p = energyPercent.value / 100
  const r = Math.round(180 - p * 58)
  const g = Math.round(190 - p * 32)
  const b = Math.round(176 - p * 58)
  return {
    left: `calc(${energyPercent.value}% - 14px)`,
    background: `rgb(${r},${g},${b})`
  }
})

const cardsStyle = computed(() => {
  const p = energyPercent.value / 100
  return {
    opacity: 0.85 + p * 0.15,
    transform: `translateY(${(1 - p) * 4}px)`
  }
})

function energyCardStyle(index) {
  const p = energyPercent.value / 100
  const scale = 0.96 + p * 0.04
  const rotate = index === 0 ? (1 - p) * -2 : (1 - p) * 2
  return {
    transform: `scale(${scale}) rotate(${rotate}deg)`,
    transition: 'all 0.5s var(--spring-smooth)'
  }
}

const energyCards = computed(() => {
  const p = energyPercent.value
  if (p <= 30) {
    return [
      { icon: '☕', title: '猫空咖啡', desc: '窝在角落看书发呆' },
      { icon: '🧘', title: '湖畔瑜伽', desc: '在西湖边拉伸放松' }
    ]
  }
  if (p <= 60) {
    return [
      { icon: '🏛️', title: '博物馆巡礼', desc: '浙博之江馆新展' },
      { icon: '🍵', title: '龙井茶山', desc: '品明前龙井赏茶园' }
    ]
  }
  return [
    { icon: '🥾', title: '十里琅珰徒步', desc: '经典山脊线挑战' },
    { icon: '🚴', title: '环湖骑行', desc: '30km 西湖全环绕' }
  ]
})

function onEnergyInput(e) {
  store.energyLevel = parseInt(e.target.value)
}

function setEnergy(val) {
  store.energyLevel = val
}

// 长辈模式：能量档位大按钮
const energyButtons = [
  { value: 0, label: '完全躺平' },
  { value: 25, label: '轻度漫步' },
  { value: 50, label: '中等强度' },
  { value: 75, label: '活力探索' },
  { value: 100, label: '尽情折腾' }
]

function isNearEnergy(target) {
  return Math.abs(store.energyLevel - target) <= 12
}

const activeEnergyBtnColor = computed(() => theme.value.primary)

/* ============================================================
   心情选择器
============================================================ */
const moods = [
  { key: 'tired', label: '疲惫', emoji: '😴', hint: '放慢节奏', index: 2, themeColor: '#6B8FA3', themeName: '静谧蓝' },
  { key: 'excited', label: '兴奋', emoji: '🤩', hint: '精彩不停', index: 9, themeColor: '#E8945A', themeName: '活力橙' },
  { key: 'happy', label: '开心', emoji: '😄', hint: '活力满满', index: 8, themeColor: '#8BA88C', themeName: '暖阳绿' },
  { key: 'calm', label: '平静', emoji: '😌', hint: '顺其自然', index: 5, themeColor: '#A3B5A6', themeName: '莫兰迪绿' },
  { key: 'anxious', label: '焦虑', emoji: '😰', hint: '需要治愈', index: 3, themeColor: '#B5A3C4', themeName: '薰衣草紫' },
  { key: 'sad', label: '低落', emoji: '😢', hint: '温柔对待', index: 2, themeColor: '#C4A8A8', themeName: '柔雾粉' }
]

function moodItemStyle(mood) {
  if (store.moodLabel === mood.key) {
    return {
      borderColor: mood.themeColor,
      background: mood.themeColor + '15',
      boxShadow: `0 0 0 3px ${mood.themeColor}18`
    }
  }
  return {}
}

function selectMood(mood) {
  store.setMood(mood.key, mood.index, mood.emoji)
}

/* ============================================================
   显性情绪选择器（极简三态）
============================================================ */
function quickMood(label, emoji) {
  const moodMap = {
    calm: { index: 5, emoji: '😌' },
    excited: { index: 9, emoji: '🤩' }
  }
  const m = moodMap[label]
  if (m) store.setMood(label, m.index, m.emoji)
}

function quickMoodAnxious() {
  // 选择 😫 → 立即触发 anxious + 浙江散心路线
  store.quickSanxinPlan()
  // 跳转到规划页
  router.push('/plan')
}

function activeMoodStyle(mood) {
  const themeMap = {
    calm: { borderColor: '#A3B5A6', background: '#A3B5A615', boxShadow: '0 0 0 3px #A3B5A618' },
    anxious: { borderColor: '#B5A3C4', background: '#B5A3C415', boxShadow: '0 0 0 3px #B5A3C418' },
    excited: { borderColor: '#E8945A', background: '#E8945A15', boxShadow: '0 0 0 3px #E8945A18' }
  }
  return themeMap[mood] || {}
}

/* ============================================================
   同行人相关
============================================================ */
const roleOptions = ['自己', '朋友', '小孩', '老人']
const roleMap = ['self', 'friend', 'child', 'elderly']

const companionSummary = computed(() => {
  const count = store.companionCount
  const parts = []
  if (store.isCouple) return '情侣出行'
  if (store.hasKids) parts.push('含儿童')
  if (store.hasElderly) parts.push('含老人')
  if (count === 1) return '独自出行'
  return `${count}人同行` + (parts.length ? ' · ' + parts.join('·') : '')
})

function roleEmoji(role) {
  const map = { self: '😊', friend: '🙋', child: '👶', elderly: '👴' }
  return map[role] || '🙋'
}

function roleLabel(role) {
  const map = { self: '自己', friend: '朋友', child: '小孩', elderly: '老人' }
  return map[role] || '同行者'
}

function openCompanionPopup() {
  store.showCompanionPopup = true
}

function closeCompanionPopup() {
  store.showCompanionPopup = false
}

function quickAdd(role) {
  const ageMap = { child: 5, elderly: 65, friend: 25 }
  store.addCompanion(role, ageMap[role])
}

function changeRole(idx, value) {
  const newRole = roleMap[value]
  const ageMap = { self: 28, friend: 25, child: 5, elderly: 65 }
  store.updateCompanion(idx, { role: newRole, age: ageMap[newRole] })
}

/* ============================================================
   今日向导计算属性（旅程进行中）
============================================================ */
const currentDay = computed(() => {
  if (!store.itinerary) return { day: 1, items: [] }
  const idx = Math.min(store.currentDayIndex, store.itinerary.length - 1)
  return store.itinerary[idx] || { day: 1, items: [] }
})

const currentItemIndex = computed(() => store.currentItemIndex)

const totalCount = computed(() => currentDay.value.items?.length || 0)
const completedCount = computed(() => currentItemIndex.value)

const dayProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((currentItemIndex.value / totalCount.value) * 100)
})

const nextItem = computed(() => {
  const items = currentDay.value.items || []
  if (currentItemIndex.value >= items.length) return null
  return items[currentItemIndex.value]
})

const simulatedTime = computed(() => {
  const items = currentDay.value.items || []
  if (items.length === 0) return '--:--'
  if (currentItemIndex.value >= items.length) return items[items.length - 1]?.endTime || '18:00'
  const item = items[currentItemIndex.value]
  if (item && item.time) {
    const [h, m] = item.time.split(':').map(Number)
    let totalMin = h * 60 + m - 10
    if (totalMin < 0) totalMin = 0
    const nh = Math.floor(totalMin / 60)
    const nm = totalMin % 60
    return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0')
  }
  return '--:--'
})

const nextItemDistance = computed(() => {
  const distances = [350, 500, 800, 1200, 200, 650, 450, 900]
  return distances[currentItemIndex.value % distances.length]
})

const nextItemTime = computed(() => {
  if (!nextItem.value) return '--:--'
  if (nextItem.value.time) {
    const [h, m] = nextItem.value.time.split(':').map(Number)
    let totalMin = h * 60 + m - 8
    if (totalMin < 0) totalMin = 0
    const nh = Math.floor(totalMin / 60)
    const nm = totalMin % 60
    return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0')
  }
  return '--:--'
})

const guideTips = computed(() => {
  const tips = []
  const items = currentDay.value.items || []
  const idx = currentItemIndex.value

  if (idx < items.length && items[idx]?.type !== 'rest') {
    tips.push({
      icon: '☕',
      text: '走累了？旁边的猫空书店适合歇脚，喝杯咖啡看看书'
    })
  }

  tips.push({
    icon: '🌦️',
    text: '下午3点可能转阴，建议提前进室内场馆'
  })

  if (store.isCouple) {
    tips.push({
      icon: '💑',
      text: '今晚推荐浪漫晚餐，已为你筛选私密包间餐厅'
    })
  }

  if (store.hasElderly) {
    tips.push({
      icon: '👴',
      text: '老人同行：当前步行距离适中，请注意休息节奏'
    })
  }

  if (store.hasKids) {
    tips.push({
      icon: '👶',
      text: '附近有母婴室和儿童乐园，带娃出行更轻松'
    })
  }

  if (store.isDieting) {
    tips.push({
      icon: '🥗',
      text: '已为你筛选低卡健康餐食，放心享用'
    })
  }

  return tips.slice(0, 3)
})

const popupBg = computed(() => {
  return `linear-gradient(180deg, ${theme.value.bg} 0%, #FFFCF8 100%)`
})

const planBtnStyle = computed(() => ({
  background: `linear-gradient(135deg, ${theme.value.primaryLight}, ${theme.value.primary})`,
  boxShadow: `0 6px 16px ${theme.value.primary}40`
}))

const aiWizardBg = computed(() =>
  `linear-gradient(135deg, ${theme.value.primaryLight}60, ${theme.value.primary}30)`
)

const healEntryBg = computed(() =>
  `linear-gradient(135deg, #A8C8A0, #8BA88C50)`
)

/* ============================================================
   方法
============================================================ */
function onSpotClick(spot) {
  // 点击卡片跳转到详情页，携带地点 id
  router.push({ name: 'detail', params: { id: spot.id } })
}

function onWeatherAction() {
  router.push('/plan')
}

function startPlan() {
  router.push('/plan')
}

function goToPlan() {
  router.push('/plan')
}

function goToMine() {
  router.push('/mine')
}

function goToChat() {
  router.push({ name: 'aiChat' })
}

function goToJournal() {
  router.push({ name: 'journal' })
}

function goToDailyCare() {
  router.push({ name: 'dailyCare' })
}

function goToCertified() {
  router.push({ name: 'certifiedPlaces' })
}

function endTrip() {
  store.tripActive = false
  store.currentDayIndex = 0
  store.currentItemIndex = 0
}

const showWeatherAlert = computed(() => !store.elderlyMode)
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 0 var(--layout-page-padding, 16px);
  transition: background 0.5s ease;
}

/* ===== 导航栏 ===== */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 44px 0 16px;
  gap: 8px;
  background: transparent;
}

.nav-left {
  flex-shrink: 0;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

/* 长辈关怀开关 */
.elder-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 4px;
}

.toggle-label {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* 移动端：隐藏开关标签，仅显示图标 */
@media (max-width: 380px) {
  .toggle-label { display: none; }
  .chat-entry-label { display: none; }
  .chat-entry { padding: 6px 8px; }
  .nav-right { gap: 4px; }
}

[data-accessibility="elderly"] .toggle-label {
  font-size: 14px;
}

.logo-text {
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 2px;
  transition: color 0.5s;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  transition: background 0.5s;
  cursor: pointer;
}

/* AI 向导入口 — 移动端禁用backdrop-filter */
.chat-entry {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  cursor: pointer;
  transition: transform 0.15s var(--spring-responsive);
  min-height: 36px;
}

.chat-entry:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

.chat-entry-icon {
  font-size: 14px;
  line-height: 1;
}

.chat-entry-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* ===== 今日向导导航栏 ===== */
.guide-nav {
  padding: 44px 0 12px;
}

.guide-badge {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
  transition: all 0.5s;
}

.guide-day-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 10px;
  transition: background 0.5s;
}

/* ===== 向导状态行 ===== */
.guide-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 16px;
}

.guide-dest {
  font-size: 24px;
  font-weight: 300;
  color: var(--color-text-primary);
}

.guide-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  animation: breathe 2s ease-in-out infinite;
  transition: background 0.5s;
}

@keyframes breathe {
  0%, 100% { opacity: 0.4; transform: scale(0.8) }
  50% { opacity: 1; transform: scale(1.2) }
}

.guide-status-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

/* ===== 进度卡片 ===== */
.guide-progress-card {
  border-radius: var(--layout-card-radius, 12px);
  padding: var(--layout-card-padding, 14px);
  margin-bottom: 12px;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,.04));
}

.progress-time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.progress-time {
  font-size: 20px;
  font-weight: 400;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.progress-next {
  margin-bottom: 8px;
}

.progress-next-name {
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text-primary);
  display: block;
  margin-top: 2px;
}

.progress-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.progress-meta-item {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: #F5F2ED;
  padding: 4px 8px;
  border-radius: 6px;
}

.progress-bar-wrap {
  height: 4px;
  background: #E8E4DC;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.8s var(--spring-responsive);
}

.progress-text {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

/* ===== 贴心提示 ===== */
.guide-tips {
  margin-bottom: 12px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px;
  background: var(--color-card);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.02);
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-text {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 400;
  line-height: 1.5;
}

/* ===== 今日行程时间轴 ===== */
.guide-timeline {
  margin-bottom: 16px;
}

.guide-timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.guide-timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  position: relative;
}

.guide-timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 24px;
  bottom: -4px;
  width: 1px;
  background: #E0DCD4;
}

.guide-timeline-item.done .guide-tl-name {
  color: var(--color-text-secondary);
  text-decoration: line-through;
}

.guide-timeline-item.upcoming .guide-tl-name {
  color: #C0BCB4;
}

.guide-tl-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #E0DCD4;
  flex-shrink: 0;
  margin-top: 4px;
  transition: background 0.5s;
}

.guide-timeline-item.active .guide-tl-dot {
  box-shadow: 0 0 0 3px var(--theme-primary-light);
}

.guide-tl-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.guide-tl-time {
  font-size: 12px;
  font-weight: 500;
  color: var(--theme-primary);
  min-width: 38px;
  transition: color 0.5s;
}

.guide-tl-name {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-primary);
  flex: 1;
}

.guide-tl-tag {
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  padding: 2px 6px;
  border-radius: 8px;
  transition: background 0.5s;
}

.guide-tl-check {
  font-size: 12px;
  color: #8BA88C;
  font-weight: 500;
}

/* ===== 操作按钮 ===== */
.guide-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.guide-btn {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.guide-btn.primary { color: #fff; }

.guide-btn.secondary {
  background: var(--color-card);
  color: var(--color-text-primary);
  border: 1px solid #E0DCD4;
}

/* ===== 能量区域 ===== */
.energy-section {
  margin-bottom: var(--layout-section-gap, 16px);
  padding: 0 0 4px;
}

.energy-header {
  margin-bottom: 12px;
}

.energy-greeting {
  font-size: 24px;
  font-weight: 300;
  color: var(--color-text-primary);
  display: block;
  letter-spacing: -0.3px;
}

.energy-sub {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  display: block;
  font-weight: 300;
}

.energy-slider-wrap {
  position: relative;
  padding: 0 4px;
  margin-bottom: 8px;
}

.energy-track {
  position: relative;
  height: 8px;
  border-radius: 4px;
  transition: background 0.5s var(--spring-smooth);
  overflow: hidden;
}

.energy-fill {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  transition: width 0.2s var(--spring-smooth),
              background 0.5s var(--spring-smooth);
}

.energy-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 0 4px rgba(255,255,255,0.8);
  transition: left 0.2s var(--spring-smooth),
              background 0.5s var(--spring-smooth);
  pointer-events: none;
  z-index: 2;
}

.energy-input {
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  width: 100%;
  height: 40px;
  opacity: 0;
  cursor: pointer;
  z-index: 3;
  -webkit-appearance: none;
  appearance: none;
}

.energy-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 2px;
}

.energy-label {
  font-size: 12px;
  font-weight: 400;
  color: #A8A094;
  cursor: pointer;
  transition: all 0.3s var(--spring-smooth);
  padding: 2px 6px;
  border-radius: 8px;
}

.energy-label:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

.energy-label.active {
  color: var(--color-text-primary);
  font-weight: 500;
}

.energy-mid-label {
  font-size: 13px;
  font-weight: 400;
  transition: color 0.5s var(--spring-smooth);
  letter-spacing: 0.5px;
}

/* 长辈模式：能量档位大按钮 */
.elder-energy-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin: 12px 0;
}

.elder-energy-btn {
  padding: 8px 4px;
  border: 2px solid #DDD;
  border-radius: 12px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

/* 能量推荐卡片 */
.energy-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
  transition: all 0.5s var(--spring-smooth);
}

.energy-card {
  border-radius: var(--layout-card-radius, 10px);
  padding: var(--layout-card-padding, 10px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: var(--shadow-card, 0 1px 6px rgba(0,0,0,0.03));
}

.energy-card-icon {
  font-size: 22px;
  transition: transform 0.3s;
}

.energy-card-title {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-primary);
}

.energy-card-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 300;
}

/* ===== 精选地点网格 ===== */
.spots-section {
  margin-bottom: var(--layout-section-gap, 16px);
}

.spots-grid {
  display: grid;
  grid-template-columns: repeat(var(--layout-grid-columns, 2), 1fr);
  gap: var(--layout-card-gap, 12px);
}

.spot-card {
  border-radius: var(--layout-card-radius, 14px);
  overflow: hidden;
  cursor: pointer;
  content-visibility: auto;
  contain-intrinsic-size: auto 280px;
}

/* 进入动画 */
.list-enter-active {
  transition: all 0.4s var(--spring-responsive);
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

/* 离开动画 */
.list-leave-active {
  transition: all 0.3s var(--spring-responsive);
  position: absolute;
  opacity: 1;
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 核心平滑移动动画：当其他卡片位移时保持平滑 */
.list-move {
  transition: transform 0.5s var(--spring-responsive);
}

.spot-image {
  width: 100%;
  height: 140px;
  overflow: hidden;
}

[data-accessibility="elderly"] .spot-image {
  height: 160px;
}

.spot-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.spot-card:active .spot-image img {
  transform: scale(1.02);
}

.spot-info {
  padding: 12px;
}

.spot-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text-primary);
}

.spot-desc {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.spot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.spot-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 400;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);
}

.empty-icon {
  display: block;
  font-size: 48px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
}

/* ===== 通用区块 ===== */
.section {
  margin-bottom: var(--layout-section-gap, 16px);
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
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
}

.title-hint {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-left: auto;
}

/* ===== 心情选择器 ===== */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mood-item {
  border-radius: 8px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.mood-emoji { font-size: 26px; line-height: 1; }

.mood-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.mood-hint {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.mood-theme-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: absolute;
  top: 6px;
  right: 6px;
}

.mood-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--theme-primary);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.5s;
}

/* ===== 开关组 ===== */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  width: 36px;
  height: 36px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.5s;
}

.toggle-name {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-primary);
  display: block;
}

.toggle-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  display: block;
}

.toggle-arrow {
  font-size: 18px;
  color: #D0CCC4;
}

/* ===== Custom Switch ===== */
.switch-wrapper {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch-wrapper input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #ccc;
  border-radius: 24px;
  transition: 0.3s;
}

.switch-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.switch-wrapper input:checked + .switch-slider {
  background-color: var(--switch-color, #A3B5A6);
}

.switch-wrapper input:checked + .switch-slider::before {
  transform: translateX(20px);
}

/* ===== 规划按钮 ===== */
.plan-btn {
  margin: 20px 0;
  width: 100%;
  height: 48px;
  border-radius: 24px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: pointer;
}

.plan-btn-text {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

/* ===== 行程预览 ===== */
.preview-section {
  margin-bottom: var(--layout-section-gap, 16px);
}

.preview-card {
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
  cursor: pointer;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.preview-dest {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.preview-days {
  font-size: 12px;
  color: var(--theme-primary);
  font-weight: 400;
}

.preview-stats {
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* ===== 同行人弹窗 ===== */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.25s;
}

@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

.popup-sheet {
  width: 100%;
  border-radius: 20px 20px 0 0;
  padding: 0 16px 16px;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%) }
  to { transform: translateY(0) }
}

.popup-handle {
  width: 32px;
  height: 3px;
  background: #D0CCC4;
  border-radius: 2px;
  margin: 8px auto 12px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.popup-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.popup-close {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.popup-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  display: block;
}

.companion-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.companion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
}

.companion-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.5s;
}

.companion-info { flex: 1 }

.companion-name {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-primary);
  display: block;
}

.companion-detail {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  display: block;
}

.companion-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.companion-select {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  color: var(--theme-primary);
}

.companion-remove {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  color: #C48888;
  background: rgba(196,136,136,0.1);
  cursor: pointer;
}

.add-buttons {
  display: flex;
  gap: 8px;
}

.add-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px dashed;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.add-btn-icon { font-size: 20px }

.add-btn-text {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-primary);
}

.popup-footer { margin-top: 16px }

.popup-confirm-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  transition: background 0.5s;
  cursor: pointer;
}

.safe-bottom { height: 80px }

/* ===== 日常情绪与人文关怀 ===== */
.daily-care-section {
  margin-bottom: 12px;
}

.mode-switch-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.budget-section {
  margin-bottom: 14px;
}

.care-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-radius: 14px;
  margin-bottom: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.03));
  transition: all 0.2s var(--spring-responsive);
}

.care-entry:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

.care-entry-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.care-entry-icon {
  font-size: 28px;
  line-height: 1;
}

.care-entry-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.care-entry-title {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-primary, #3A3A3A);
}

.care-entry-desc {
  font-size: 11px;
  color: var(--color-text-secondary, #9A9A9A);
  font-weight: 300;
}

.care-entry-arrow {
  font-size: 20px;
  color: #D0CCC4;
  font-weight: 300;
}

[data-accessibility="elderly"] .care-entry-title {
  font-size: 17px;
}

[data-accessibility="elderly"] .care-entry-desc {
  font-size: 14px;
}

/* ===== 日常场景金刚区 ===== */
.scenario-section {
  margin-bottom: 12px;
  overflow: hidden;
}

.scenario-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px 0;
}

.scenario-scroll::-webkit-scrollbar {
  display: none;
}

.scenario-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.04);
  background: rgba(255,255,255,0.75);
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.25s var(--spring-responsive);
  min-width: 80px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
}

.scenario-chip:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

.scenario-chip.active {
  border-color: var(--theme-primary);
}

.scenario-icon {
  font-size: 24px;
  line-height: 1;
}

.scenario-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-primary, #3A3A3A);
}

/* ===== 长辈模式极简列表 ===== */
.elder-spots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.elder-spot-card {
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-card, #fff);
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s var(--spring-responsive);
}

.elder-spot-card:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

.elder-spot-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.elder-spot-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.elder-spot-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.elder-spot-name {
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text-primary, #2A2A2A);
  line-height: 1.3;
}

.elder-spot-distance {
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-primary, #A3B5A6);
}

/* ===== 长辈模式悬浮按钮 ===== */
.elder-float-btn {
  position: fixed;
  bottom: 30px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 22px;
  border-radius: 28px;
  color: #fff;
  cursor: pointer;
  z-index: 999;
  animation: floatBreath 2.5s ease-in-out infinite;
  transition: transform 0.2s;
}

.elder-float-btn:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

@keyframes floatBreath {
  0%, 100% { box-shadow: 0 6px 20px rgba(224,96,96,0.45); }
  50% { box-shadow: 0 6px 30px rgba(224,96,96,0.7); }
}

.elder-float-icon {
  font-size: 24px;
  line-height: 1;
}

.elder-float-label {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* ===== 认证商家筛选 ===== */
.certified-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: rgba(255,255,255,0.65);
  border-radius: 12px;
  box-shadow: var(--shadow-float);
}

.certified-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.certified-checkbox-icon {
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
  transition: all 0.2s var(--spring-responsive);
}

.certified-checkbox-icon.checked {
  border-color: transparent;
}

.certified-checkbox-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-primary);
}

.certified-checkbox-badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 8px;
}

.certified-filter-hint {
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  transition: opacity 0.2s;
}

.certified-filter-hint:active {
  opacity: 0.7;
}

/* ===== 显性情绪选择器 ===== */
.explicit-mood {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.explicit-mood-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.explicit-mood-options {
  display: flex;
  gap: 6px;
  flex: 1;
}

.explicit-mood-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  border-radius: 12px;
  box-shadow: var(--shadow-float);
  background: var(--material-card);
  cursor: pointer;
  transition: all 0.25s var(--spring-responsive);
  position: relative;
  overflow: hidden;
}

.explicit-mood-btn:active {
  transform: scale(0.97);
  transition: transform var(--duration-75) var(--spring-snappy);
}

.explicit-mood-btn.anxious-btn {
  position: relative;
}

.explicit-mood-btn.anxious-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 2px solid transparent;
  animation: anxiousPulse 2s ease-in-out infinite;
}

@keyframes anxiousPulse {
  0%, 100% { border-color: #B5A3C440; }
  50% { border-color: #B5A3C4; }
}

.explicit-mood-emoji {
  font-size: 22px;
  line-height: 1;
}

.explicit-mood-text {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-primary);
}

.explicit-mood-hint {
  font-size: 9px;
  font-weight: 400;
  color: #B5A3C4;
  background: #B5A3C412;
  padding: 1px 6px;
  border-radius: 6px;
}

/* ================================================================
   桌面端响应式 — 首页
   ================================================================ */
@media (min-width: 768px) {
  .home-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px var(--layout-page-padding);
  }

  /* 导航栏展开 */
  .nav-bar {
    padding: 28px 0 24px;
  }
  .logo-text {
    font-size: 22px;
    letter-spacing: 2px;
  }
  .toggle-label {
    font-size: 13px;
  }

  /* 心情选择器：居中大卡片 */
  .mood-selector {
    display: flex;
    justify-content: center;
    gap: 32px;
    padding: 24px 0;
  }

  /* 推荐卡片网格 */
  .spot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  /* 场景入口横向排列 */
  .scenario-scroll {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  /* 玻璃卡片 */
  .glass-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
    transition: transform 0.3s var(--spring-responsive),
                box-shadow 0.4s;
  }
  .glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  }

  /* 推荐卡片悬停 */
  .spot-card {
    transition: transform 0.35s var(--spring-responsive),
                box-shadow 0.4s;
  }
  .spot-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  }

  /* 场景芯片悬停 */
  .scenario-chip {
    transition: transform 0.2s var(--spring-responsive),
                box-shadow 0.3s;
  }
  .scenario-chip:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  /* 段落间距加大 */
  .section {
    margin-bottom: 28px;
  }
  .section-title {
    margin-bottom: 16px;
  }
  .title-text {
    font-size: 17px;
  }

  /* 设置行悬停 */
  .setting-row {
    transition: background 0.2s;
    border-radius: 12px;
  }
  .setting-row:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  /* 安全底部 */
  .safe-bottom {
    height: 40px;
  }
}
</style>
