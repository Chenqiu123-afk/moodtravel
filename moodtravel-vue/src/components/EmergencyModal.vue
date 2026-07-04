<template>
  <div class="sos-system">
    <!-- 浮动触发按钮：平时不碍眼，需要时醒目 -->
    <div class="sos-trigger" :class="{ pulsing: !showPanel }" @click="togglePanel">
      <div class="sos-icon">🆘</div>
      <span class="sos-label">突发状况</span>
    </div>

    <!-- 选项面板 -->
    <transition name="panel">
      <div v-if="showPanel && !sosActive" class="sos-panel" @click.stop>
        <div class="panel-header">
          <span class="panel-title">遇到突发状况？</span>
          <span class="panel-sub">别急，AI 会立刻帮你调整</span>
          <div class="panel-close" @click="showPanel = false">✕</div>
        </div>
        <div class="option-list">
          <div
            v-for="opt in options"
            :key="opt.key"
            class="option-card"
            :style="opt.key === 'health' ? { borderColor: '#C48888' } : {}"
            @click="triggerSOS(opt.key)"
          >
            <div class="option-icon" :style="{ background: opt.color }">
              {{ opt.icon }}
            </div>
            <div class="option-info">
              <span class="option-name">{{ opt.name }}</span>
              <span class="option-desc">{{ opt.desc }}</span>
            </div>
            <span class="option-arrow">›</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== SOS 激活后的完整流程 ===== -->
    <transition name="sos">
      <div v-if="sosActive" class="sos-overlay">
        <div class="sos-fullscreen">

          <!-- 步骤 0：暖心的安抚话术 -->
          <div v-if="sosPhase === 'comfort'" class="sos-phase comfort-phase">
            <div class="comfort-heart">💙</div>
            <span class="comfort-title">别担心，我们都在</span>
            <span class="comfort-text">{{ comfortMessage }}</span>
            <div class="comfort-actions">
              <button class="sos-btn primary" @click="sosPhase = 'hospital'">
                查看附近医疗点
              </button>
              <button class="sos-btn ghost" @click="dismissSOS">
                我没事，继续行程
              </button>
            </div>
          </div>

          <!-- 步骤 1：医院/药店搜索 -->
          <div v-if="sosPhase === 'hospital'" class="sos-phase hospital-phase">
            <div class="phase-header">
              <span class="phase-icon">🏥</span>
              <span class="phase-title">附近医疗点</span>
              <span class="phase-badge">3公里内</span>
            </div>
            <div class="hospital-list">
              <div v-for="h in nearbyHospitals" :key="h.id" class="hospital-card">
                <div class="h-left">
                  <span class="h-icon">{{ h.type === 'hospital' ? '🏥' : '💊' }}</span>
                  <div class="h-info">
                    <span class="h-name">{{ h.name }}</span>
                    <span class="h-meta">{{ h.level }} · {{ h.distance }}km</span>
                  </div>
                </div>
                <div class="h-right">
                  <span class="h-taxi">🚕 {{ h.taxiTime }}min</span>
                  <button class="h-nav-btn" @click="navigateTo(h)">导航</button>
                </div>
              </div>
            </div>
            <button class="sos-btn primary" @click="sosPhase = 'itinerary'">
              下一步：调整行程 →
            </button>
          </div>

          <!-- 步骤 2：行程调整预览 -->
          <div v-if="sosPhase === 'itinerary'" class="sos-phase itinerary-phase">
            <div class="phase-header">
              <span class="phase-icon">🔄</span>
              <span class="phase-title">行程已自动调整</span>
              <span class="phase-badge green">休息模式</span>
            </div>

            <div class="change-summary">
              <div class="change-item removed">
                <span class="change-label">已取消</span>
                <span v-for="c in sosChanges.removed" :key="c" class="change-poi">✕ {{ c }}</span>
              </div>
              <div class="change-item added">
                <span class="change-label">替换为</span>
                <span v-for="c in sosChanges.added" :key="c" class="change-poi">✓ {{ c }}</span>
              </div>
              <div class="change-item diet">
                <span class="change-label">🍲 餐厅调整</span>
                <span class="change-poi">{{ sosChanges.dietChange }}</span>
              </div>
            </div>

            <div class="new-itinerary-preview">
              <span class="preview-label">修改后行程预览</span>
              <div v-for="(day, di) in sosItinerary" :key="di" class="preview-day">
                <span class="preview-day-label">Day {{ day.day }}</span>
                <div v-for="(item, ii) in day.items" :key="ii" class="preview-item">
                  <span class="preview-time">{{ item.time }}</span>
                  <span class="preview-name">{{ item.name }}</span>
                  <span class="preview-tag" :class="item.energyLevel <= 1 ? 'low' : 'mid'">
                    {{ item.energyLevel <= 1 ? '轻松' : '适中' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="sos-btn-row">
              <button class="sos-btn primary" @click="applySOS">
                确认调整，应用新行程
              </button>
              <button class="sos-btn ghost" @click="dismissSOS">
                恢复原行程
              </button>
            </div>
          </div>

          <!-- 步骤 3：完成 -->
          <div v-if="sosPhase === 'done'" class="sos-phase done-phase">
            <div class="done-icon">✅</div>
            <span class="done-title">行程已更新</span>
            <span class="done-text">{{ doneMessage }}</span>
            <button class="sos-btn primary" @click="dismissSOS">
              好的，继续旅程
            </button>
          </div>

        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  itinerary: { type: Array, default: () => [] },
  destination: { type: String, default: '杭州' },
  themeColor: { type: String, default: '#A3B5A6' },
  isRain: { type: Boolean, default: false },
  hasElderly: { type: Boolean, default: false }
})

const emit = defineEmits(['apply-itinerary', 'set-rain'])

// ===== 面板状态 =====
const showPanel = ref(false)
const sosActive = ref(false)
const sosPhase = ref('comfort') // comfort | hospital | itinerary | done
const sosType = ref('')        // health | weather | reroute

const options = [
  { key: 'health', name: '身体不适', icon: '🤒', desc: '老人生病/身体不适，需调整行程', color: '#C48888' },
  { key: 'weather', name: '天气突变', icon: '🌧️', desc: '突然暴雨，需要室内备选方案', color: '#8BA3B5' },
  { key: 'reroute', name: '改行程', icon: '🔀', desc: '临时想换个风格，重新规划', color: '#A3B5A6' }
]

// ===== 安抚话术 =====
const comfortMessage = computed(() => {
  if (sosType.value === 'health') {
    return '别担心，已为您锁定最近医院，后续行程已调整为休息模式，身体第一。'
  }
  if (sosType.value === 'weather') {
    return '天气突变不要紧，AI 已将所有户外景点换成室内项目，安心享受旅程。'
  }
  return '没问题，AI 正在根据你的新偏好重新规划，稍等片刻。'
})

const doneMessage = computed(() => {
  if (sosType.value === 'health') {
    return '所有高强度行程已取消，餐厅已切换为清淡饮食。请照顾好自己，旅程随时可以继续。'
  }
  return '新行程已生成，祝你旅途愉快！'
})

// ===== 医院/药店数据（模拟） =====
const HOSPITALS = {
  '杭州': [
    { id: 1, name: '浙江大学医学院附属第一医院', type: 'hospital', level: '三甲', distance: 1.8, taxiTime: 6, lat: 30.266, lng: 120.176 },
    { id: 2, name: '杭州市第一人民医院', type: 'hospital', level: '三甲', distance: 2.3, taxiTime: 8, lat: 30.243, lng: 120.169 },
    { id: 3, name: '浙江省中医院', type: 'hospital', level: '三甲', distance: 2.8, taxiTime: 10, lat: 30.249, lng: 120.165 },
    { id: 4, name: '海王星辰大药房', type: 'pharmacy', level: '24小时', distance: 0.6, taxiTime: 3, lat: 30.258, lng: 120.173 },
    { id: 5, name: '老百姓大药房', type: 'pharmacy', level: '24小时', distance: 1.2, taxiTime: 4, lat: 30.252, lng: 120.171 }
  ],
  '北京': [
    { id: 1, name: '北京协和医院', type: 'hospital', level: '三甲', distance: 2.0, taxiTime: 7, lat: 39.913, lng: 116.413 },
    { id: 2, name: '北京大学第一医院', type: 'hospital', level: '三甲', distance: 2.5, taxiTime: 9, lat: 39.932, lng: 116.363 },
    { id: 3, name: '同仁堂药店', type: 'pharmacy', level: '24小时', distance: 0.8, taxiTime: 3, lat: 39.916, lng: 116.405 }
  ],
  '上海': [
    { id: 1, name: '复旦大学附属华山医院', type: 'hospital', level: '三甲', distance: 1.5, taxiTime: 5, lat: 31.218, lng: 121.442 },
    { id: 2, name: '上海交通大学医学院附属瑞金医院', type: 'hospital', level: '三甲', distance: 2.2, taxiTime: 8, lat: 31.212, lng: 121.462 },
    { id: 3, name: '国大药房', type: 'pharmacy', level: '24小时', distance: 0.5, taxiTime: 2, lat: 31.235, lng: 121.475 }
  ]
}

const nearbyHospitals = computed(() => {
  const dest = props.destination || '杭州'
  return HOSPITALS[dest] || HOSPITALS['杭州']
})

// ===== SOS 变更摘要 =====
const sosChanges = ref({ removed: [], added: [], dietChange: '' })
const sosItinerary = ref([])

// 低体力 POI 池（室内、低能量消耗）
const LOW_ENERGY_POIS = [
  { id: 101, name: '中国茶叶博物馆', category: 'museum', energyLevel: 1, tags: ['免费', '安静', '品茶'], estimatedDuration: 90, ticketPrice: 0, weatherSensitivity: 'indoor' },
  { id: 102, name: '浙江美术馆', category: 'museum', energyLevel: 1, tags: ['免费', '艺术', '安静'], estimatedDuration: 90, ticketPrice: 0, weatherSensitivity: 'indoor' },
  { id: 103, name: '猫的天空之城·概念书店', category: 'leisure', energyLevel: 1, tags: ['安静', '文艺', '拍照'], estimatedDuration: 90, ticketPrice: 35, weatherSensitivity: 'indoor' },
  { id: 104, name: '永福寺·抄经体验', category: 'temple', energyLevel: 1, tags: ['安静', '禅意', '抄经'], estimatedDuration: 120, ticketPrice: 45, weatherSensitivity: 'indoor' },
  { id: 105, name: '郭庄园林下午茶', category: 'leisure', energyLevel: 1, tags: ['园林', '下午茶', '安静'], estimatedDuration: 90, ticketPrice: 68, weatherSensitivity: 'mixed' },
  { id: 106, name: '杭州博物馆', category: 'museum', energyLevel: 2, tags: ['免费', '历史', '文化'], estimatedDuration: 120, ticketPrice: 0, weatherSensitivity: 'indoor' },
  { id: 107, name: '浙江省科技馆', category: 'museum', energyLevel: 2, tags: ['免费', '亲子', '互动'], estimatedDuration: 120, ticketPrice: 0, weatherSensitivity: 'indoor' },
  { id: 108, name: '西湖漫步', category: 'scenic', energyLevel: 2, tags: ['免费', '西湖', '散步'], estimatedDuration: 60, ticketPrice: 0, weatherSensitivity: 'outdoor' },
  { id: 109, name: '酒店内SPA放松', category: 'leisure', energyLevel: 1, tags: ['放松', '按摩', '室内'], estimatedDuration: 90, ticketPrice: 280, weatherSensitivity: 'indoor' },
  { id: 110, name: '酒店休息', category: 'rest', energyLevel: 0, tags: ['休息', '恢复体力'], estimatedDuration: 120, ticketPrice: 0, weatherSensitivity: 'indoor' },
  { id: 111, name: '西西弗书店', category: 'leisure', energyLevel: 1, tags: ['安静', '咖啡', '阅读'], estimatedDuration: 90, ticketPrice: 30, weatherSensitivity: 'indoor' },
  { id: 112, name: '南宋官窑博物馆', category: 'museum', energyLevel: 1, tags: ['免费', '陶瓷', '安静'], estimatedDuration: 90, ticketPrice: 0, weatherSensitivity: 'indoor' }
]

// 清淡饮食池
const LIGHT_MEALS = [
  { name: '方回春堂·药膳餐厅', reason: '温补药膳，适合身体不适时食用', tags: ['药膳', '清淡', '滋补'] },
  { name: '知味观·味庄', reason: '杭帮菜老字号，可点粥品和清淡小菜', tags: ['老字号', '清淡', '粥品'] },
  { name: '鼎泰丰', reason: '小笼包和汤面，易消化不油腻', tags: ['汤面', '小笼包', '清淡'] },
  { name: '桂林米粉', reason: '清汤米粉，暖胃好消化', tags: ['米粉', '清汤', '易消化'] },
  { name: '医院食堂', reason: '医院附近食堂，干净卫生，适合病患食用', tags: ['医院食堂', '干净', '营养'] }
]

// ===== 核心逻辑 =====
function togglePanel() {
  showPanel.value = !showPanel.value
}

function triggerSOS(type) {
  sosType.value = type
  showPanel.value = false
  sosActive.value = true
  sosPhase.value = 'comfort'

  if (type === 'weather') {
    // 天气突变：直接激活雨天模式
    emit('set-rain', true)
    setTimeout(() => {
      sosPhase.value = 'itinerary'
      computeChanges('weather')
    }, 1200)
  } else if (type === 'reroute') {
    // 改行程：快速重规划
    setTimeout(() => {
      sosPhase.value = 'itinerary'
      computeChanges('reroute')
    }, 1200)
  }
  // health 类型：等待用户点击"查看附近医疗点"
}

function computeChanges(type) {
  if (!props.itinerary || props.itinerary.length === 0) return

  const removed = []
  const added = []
  const newItinerary = []

  props.itinerary.forEach((day, di) => {
    const newItems = []
    day.items.forEach(item => {
      if (type === 'health') {
        // 取消高体力活动（energyLevel >= 3）和长途
        if (item.energyLevel >= 3 ||
            (item.tags && (item.tags.includes('骑行') || item.tags.includes('徒步') || item.tags.includes('爬山')))) {
          removed.push(item.name)
          // 替换为低体力活动
          const replacement = LOW_ENERGY_POIS[Math.floor(Math.random() * LOW_ENERGY_POIS.length)]
          added.push(replacement.name)
          newItems.push({
            ...item,
            name: replacement.name,
            category: replacement.category,
            energyLevel: replacement.energyLevel,
            tags: replacement.tags,
            estimatedDuration: replacement.estimatedDuration,
            ticketPrice: replacement.ticketPrice,
            weatherSensitivity: replacement.weatherSensitivity,
            reason: 'SOS模式：已替换为低体力活动',
            reasonTags: ['健康模式', '低体力', 'SOS调整']
          })
        } else if (item.type === 'restaurant') {
          // 替换餐厅为清淡饮食
          removed.push(item.name)
          const lightMeal = LIGHT_MEALS[Math.floor(Math.random() * LIGHT_MEALS.length)]
          added.push(lightMeal.name)
          newItems.push({
            ...item,
            name: lightMeal.name,
            reason: lightMeal.reason,
            reasonTags: lightMeal.tags,
            isDietFriendly: true,
            estimatedCost: 40
          })
        } else {
          newItems.push(item)
        }
      } else if (type === 'weather') {
        // 天气突变：替换户外活动
        if (item.weatherSensitivity === 'outdoor') {
          removed.push(item.name)
          const indoor = LOW_ENERGY_POIS.filter(p => p.weatherSensitivity === 'indoor')
          const replacement = indoor[Math.floor(Math.random() * indoor.length)]
          added.push(replacement.name)
          newItems.push({
            ...item,
            name: replacement.name,
            category: replacement.category,
            weatherSensitivity: 'indoor',
            tags: replacement.tags,
            reason: '雨天模式：已替换为室内活动',
            reasonTags: ['雨天调整', '室内', 'SOS天气']
          })
        } else {
          newItems.push(item)
        }
      } else {
        // reroute: 简单打乱顺序
        newItems.push(item)
      }
    })
    newItinerary.push({ day: day.day, items: newItems })
  })

  if (type === 'reroute') {
    // 简单重排：反转顺序
    newItinerary.forEach(day => day.items.reverse())
    sosChanges.value = {
      removed: [],
      added: [],
      dietChange: '已重新排列行程顺序，换一种游览节奏'
    }
  } else {
    sosChanges.value = {
      removed: [...new Set(removed)],
      added: [...new Set(added)],
      dietChange: '已从网红餐厅切换为：粥粉面、清淡蒸品、药膳等易消化食物'
    }
  }

  sosItinerary.value = newItinerary
}

function applySOS() {
  emit('apply-itinerary', sosItinerary.value)
  sosPhase.value = 'done'
}

function dismissSOS() {
  sosActive.value = false
  showPanel.value = false
  sosPhase.value = 'comfort'
  sosType.value = ''
}

function navigateTo(hospital) {
  // 模拟导航：打开高德地图
  const url = `https://uri.amap.com/navigation?to=${hospital.lng},${hospital.lat},${hospital.name}&mode=car&coordinate=gaode`
  window.open(url, '_blank')
}
</script>

<style scoped>
/* ============================================================
   浮动触发按钮
   ============================================================ */
.sos-system {
  position: fixed;
  bottom: 100px;
  right: 16px;
  z-index: 900;
}
.sos-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: floatSOS 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.sos-trigger.pulsing {
  animation: floatSOS 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite,
             pulseRing 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
.sos-trigger:active {
  transform: scale(0.95);
}
.sos-icon {
  font-size: 18px;
}
.sos-label {
  font-size: 12px;
  font-weight: 500;
  color: #C48888;
  letter-spacing: 1px;
}
@keyframes floatSOS {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
@keyframes pulseRing {
  0%, 100% { box-shadow: 0 2px 16px rgba(196,136,136,0.08), 0 0 0 1px rgba(0,0,0,0.04); }
  50%      { box-shadow: 0 2px 16px rgba(196,136,136,0.15), 0 0 0 4px rgba(196,136,136,0.08); }
}

/* ============================================================
   选项面板
   ============================================================ */
.sos-panel {
  position: fixed;
  bottom: 160px;
  right: 16px;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  z-index: 901;
}
.panel-header {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
}
.panel-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}
.panel-sub {
  display: block;
  font-size: 12px;
  font-weight: 300;
  color: var(--color-text-light);
  margin-top: 4px;
}
.panel-close {
  position: absolute;
  top: -4px; right: 0;
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: #D0CCC4;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(0,0,0,0.03);
}
.option-list {
  display: flex; flex-direction: column; gap: 8px;
}
.option-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  background: rgba(0,0,0,0.01);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.option-card:active {
  transform: scale(0.98);
  background: rgba(0,0,0,0.04);
}
.option-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.option-info { flex: 1 }
.option-name {
  display: block;
  font-size: 14px; font-weight: 500; color: var(--color-text);
}
.option-desc {
  display: block;
  font-size: 11px; font-weight: 300; color: var(--color-text-light);
  margin-top: 2px;
}
.option-arrow {
  font-size: 18px; color: #D0CCC4;
}

/* 面板过渡动画 */
.panel-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.panel-leave-active {
  transition: all 0.25s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}
.panel-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
.panel-leave-to   { opacity: 0; transform: translateY(8px) scale(0.97); }

/* ============================================================
   SOS 全屏流程
   ============================================================ */
.sos-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.sos-fullscreen {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  max-height: 85vh;
  background: #FFFCF8;
  border-radius: 24px 24px 0 0;
  overflow-y: auto;
  animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
@keyframes slideUp {
  from { transform: translateY(100%) }
  to { transform: translateY(0) }
}

.sos-phase {
  padding: 24px 20px;
}

/* 安抚阶段 */
.comfort-phase {
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 40px 24px;
}
.comfort-heart {
  font-size: 48px;
  animation: heartBeat 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}
@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  15%  { transform: scale(1.15); }
  30%  { transform: scale(1); }
}
.comfort-title {
  font-size: 20px; font-weight: 500;
  color: var(--color-text);
  letter-spacing: 2px;
}
.comfort-text {
  font-size: 14px; font-weight: 300;
  color: var(--color-text-light);
  line-height: 1.8;
  max-width: 280px;
}
.comfort-actions {
  display: flex; flex-direction: column; gap: 8px;
  width: 100%; max-width: 260px;
  margin-top: 8px;
}

/* 通用按钮 */
.sos-btn {
  width: 100%; height: 48px;
  border: none; border-radius: 24px;
  font-size: 14px; font-weight: 500;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.sos-btn.primary {
  background: #C48888;
  color: #fff;
  box-shadow: 0 4px 16px rgba(196,136,136,0.25);
}
.sos-btn.primary:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(196,136,136,0.2);
}
.sos-btn.ghost {
  background: transparent;
  color: var(--color-text-light);
  border: 1px solid rgba(0,0,0,0.08);
}
.sos-btn-row {
  display: flex; flex-direction: column; gap: 8px;
  margin-top: 16px;
}

/* 阶段标题 */
.phase-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
}
.phase-icon { font-size: 22px }
.phase-title {
  font-size: 16px; font-weight: 600; color: var(--color-text);
  flex: 1;
}
.phase-badge {
  padding: 3px 10px; border-radius: 10px;
  font-size: 11px; font-weight: 500;
  background: rgba(196,136,136,0.12);
  color: #C48888;
}
.phase-badge.green {
  background: rgba(139,168,140,0.12);
  color: #8BA88C;
}

/* 医院列表 */
.hospital-list {
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 16px;
}
.hospital-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px;
  background: rgba(0,0,0,0.02);
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.04);
}
.h-left {
  display: flex; align-items: center; gap: 8px;
  flex: 1; min-width: 0;
}
.h-icon { font-size: 20px; flex-shrink: 0 }
.h-name {
  font-size: 13px; font-weight: 500; color: var(--color-text);
  display: block;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.h-meta {
  font-size: 11px; font-weight: 300; color: var(--color-text-light);
  display: block; margin-top: 2px;
}
.h-right {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.h-taxi {
  font-size: 12px; font-weight: 500; color: #C48888;
}
.h-nav-btn {
  padding: 4px 12px; border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #fff;
  font-size: 11px; font-weight: 500; color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
}
.h-nav-btn:active {
  background: rgba(0,0,0,0.04);
}

/* 变更摘要 */
.change-summary {
  display: flex; flex-direction: column; gap: 10px;
  margin-bottom: 16px;
}
.change-item {
  padding: 12px;
  border-radius: 10px;
  display: flex; flex-wrap: wrap; gap: 4px;
  align-items: center;
}
.change-item.removed {
  background: rgba(196,136,136,0.06);
}
.change-item.added {
  background: rgba(139,168,140,0.06);
}
.change-item.diet {
  background: rgba(232,180,90,0.06);
}
.change-label {
  font-size: 11px; font-weight: 600;
  color: var(--color-text-light);
  margin-right: 4px;
}
.change-poi {
  font-size: 12px; font-weight: 400;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(0,0,0,0.04);
  color: var(--color-text);
}

/* 新行程预览 */
.new-itinerary-preview {
  margin-bottom: 8px;
}
.preview-label {
  font-size: 13px; font-weight: 600; color: var(--color-text);
  display: block; margin-bottom: 8px;
}
.preview-day {
  margin-bottom: 8px;
}
.preview-day-label {
  font-size: 12px; font-weight: 600;
  color: var(--color-text-light);
  display: block; margin-bottom: 4px;
}
.preview-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px;
  background: rgba(0,0,0,0.015);
  border-radius: 6px;
  margin-bottom: 3px;
}
.preview-time {
  font-size: 11px; font-weight: 500; color: var(--color-text-light);
  width: 40px; flex-shrink: 0;
}
.preview-name {
  font-size: 12px; font-weight: 400; color: var(--color-text);
  flex: 1;
}
.preview-tag {
  font-size: 10px; padding: 1px 6px; border-radius: 6px;
  font-weight: 500;
}
.preview-tag.low {
  background: rgba(139,168,140,0.12);
  color: #8BA88C;
}
.preview-tag.mid {
  background: rgba(232,180,90,0.12);
  color: #C8985A;
}

/* 完成阶段 */
.done-phase {
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 40px 24px;
}
.done-icon {
  font-size: 48px;
  animation: popIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.done-title {
  font-size: 20px; font-weight: 500; color: var(--color-text);
}
.done-text {
  font-size: 14px; font-weight: 300; color: var(--color-text-light);
  line-height: 1.8; max-width: 280px;
}

/* SOS 过渡 */
.sos-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.sos-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}
.sos-enter-from { opacity: 0; }
.sos-leave-to { opacity: 0; }
</style>