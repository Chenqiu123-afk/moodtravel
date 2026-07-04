<template>
  <!-- ================================================================ -->
  <!-- 每日人文关怀页 — 一封来自小旅的每日关怀信 -->
  <!-- 基于情绪 + 天气 + 时间的个性化人文关怀内容 -->
  <!-- ================================================================ -->
  <div class="care-page" :style="{ background: gradientBg }">
    <!-- 顶部 -->
    <header class="care-top">
      <button class="care-back" @click="goBack">
        <span class="back-arrow">←</span>
      </button>
      <span class="care-nav-title">每日关怀</span>
    </header>

    <!-- 关怀信主体 -->
    <div class="letter-container">
      <!-- 信封装饰 -->
      <div class="letter-seal" :style="{ background: sealGradient }">
        <span class="seal-icon">💌</span>
      </div>

      <div class="letter-card glass-card">
        <!-- 问候语 -->
        <div class="letter-greeting">
          <span class="greeting-emoji">{{ letter.moodEmoji }}</span>
          <span class="greeting-text">{{ letter.greeting }}，{{ store.userInfo?.nickname || '旅行者' }}</span>
        </div>

        <!-- 今日主题 -->
        <h2 class="letter-title" :style="{ color: theme.primary }">{{ letter.title }}</h2>

        <!-- 正文 -->
        <p class="letter-body">{{ letter.body }}</p>

        <!-- 今日行动建议 -->
        <div class="letter-action-card" :style="{ background: theme.primary + '08', borderColor: theme.primary + '20' }">
          <span class="action-icon">🌿</span>
          <span class="action-text">{{ letter.action }}</span>
        </div>

        <!-- 名言 -->
        <div class="letter-quote">
          <span class="quote-mark">"</span>
          <span class="quote-text">{{ letter.quote }}</span>
        </div>

        <!-- 连续打卡鼓励 -->
        <div v-if="letter.streak > 0" class="letter-streak">
          <span class="streak-icon">🔥</span>
          <span class="streak-text">
            你已经连续记录了 <b :style="{ color: theme.primary }">{{ letter.streak }}</b> 天的心情
            <template v-if="letter.streak >= 7">，非常了不起！</template>
            <template v-else>，继续保持哦～</template>
          </span>
        </div>
      </div>

      <!-- 今日治愈推荐 -->
      <div class="healing-section">
        <div class="section-title">
          <span class="title-icon">🎵</span>
          <span class="title-text">今日治愈推荐</span>
        </div>

        <div class="healing-grid">
          <div
            v-for="item in healingItems"
            :key="item.title"
            class="healing-card glass-card"
          >
            <span class="healing-icon">{{ item.icon }}</span>
            <span class="healing-title">{{ item.title }}</span>
            <span class="healing-desc">{{ item.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="safe-bottom" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'

const router = useRouter()
const store = useTravelStore()
const theme = computed(() => store.activeTheme)

const gradientBg = computed(() => {
  const t = theme.value
  return `linear-gradient(180deg, ${t.bgGradient} 0%, ${t.bg} 40%)`
})

const sealGradient = computed(() => {
  const t = theme.value
  return `linear-gradient(135deg, ${t.primaryLight}, ${t.primary})`
})

const letter = computed(() => store.getCareLetter())

const healingItems = computed(() => {
  const mood = store.moodLabel
  const items = {
    tired: [
      { icon: '🎧', title: '白噪音歌单', desc: '雨声 · 篝火 · 海浪，让世界安静下来' },
      { icon: '📖', title: '《你今天真好看》', desc: '一本治愈系漫画，翻几页就会笑' },
      { icon: '🕯️', title: '香薰蜡烛时刻', desc: '关掉大灯，只有烛光和呼吸' }
    ],
    excited: [
      { icon: '🎵', title: '活力能量歌单', desc: '节奏轻快，让好心情加倍' },
      { icon: '📝', title: '写下你的灵感', desc: '兴奋时的大脑是创意工厂' },
      { icon: '🚶', title: '城市漫步', desc: '不设目的地，跟着感觉走' }
    ],
    happy: [
      { icon: '📸', title: '记录今日美好', desc: '拍一张代表今天心情的照片' },
      { icon: '☕', title: '和朋友分享', desc: '给想念的人发一条消息' },
      { icon: '🎨', title: '涂鸦时间', desc: '不需要画得好，画得开心就行' }
    ],
    calm: [
      { icon: '🧘', title: '五分钟正念', desc: '什么都不做，只是呼吸' },
      { icon: '🍵', title: '泡一杯好茶', desc: '慢慢注水，看茶叶舒展' },
      { icon: '📖', title: '《瓦尔登湖》', desc: '梭罗的宁静，适合平静的心' }
    ],
    anxious: [
      { icon: '🌬️', title: '4-7-8 呼吸法', desc: '吸气4秒·屏息7秒·呼气8秒' },
      { icon: '✍️', title: '焦虑清单', desc: '把担心的事写下来，会发现没那么可怕' },
      { icon: '🐾', title: '云撸猫时间', desc: '看猫咪视频，心率会自然下降' }
    ],
    sad: [
      { icon: '🎬', title: '《海蒂和爷爷》', desc: '阿尔卑斯山的阳光会治愈你' },
      { icon: '🛁', title: '一个热水澡', desc: '水温刚好，让身体先放松下来' },
      { icon: '📞', title: '给信任的人打电话', desc: '不需要解决问题，只需要被听见' }
    ]
  }
  return items[mood] || items.calm
})

function goBack() {
  router.back()
}
</script>

<style scoped>
.care-page {
  min-height: 100vh;
  padding: 0 16px;
  transition: background 0.5s ease;
}

/* ===== 顶部 ===== */
.care-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 44px 0 16px;
}

.care-back {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.back-arrow {
  font-size: 18px;
  color: #888;
}

.care-nav-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text, #3A3A3A);
}

/* ===== 信封主体 ===== */
.letter-container {
  position: relative;
  padding-top: 24px;
}

/* 信封封蜡 */
.letter-seal {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  z-index: 2;
  transition: background 0.5s;
}

.seal-icon {
  font-size: 22px;
  line-height: 1;
}

/* ===== 关怀信卡片 ===== */
.letter-card {
  border-radius: 20px;
  padding: 36px 20px 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04));
  position: relative;
  overflow: hidden;
}

.letter-greeting {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.greeting-emoji {
  font-size: 24px;
  line-height: 1;
}

.greeting-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text, #3A3A3A);
}

.letter-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 14px;
  line-height: 1.3;
  transition: color 0.5s;
}

.letter-body {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--color-text, #4A4A4A);
  font-weight: 400;
}

/* 行动建议卡片 */
.letter-action-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid;
  margin-bottom: 18px;
  transition: all 0.5s;
}

.action-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #3A3A3A);
  line-height: 1.5;
}

/* 名言 */
.letter-quote {
  margin-bottom: 16px;
  padding: 12px 0;
  text-align: center;
  position: relative;
}

.quote-mark {
  font-size: 48px;
  color: var(--theme-primary, #A3B5A6);
  opacity: 0.15;
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  font-family: Georgia, serif;
  line-height: 1;
  transition: color 0.5s;
}

.quote-text {
  font-size: 13px;
  color: var(--color-text-light, #8A8A8A);
  font-weight: 400;
  line-height: 1.7;
  font-style: italic;
  display: block;
  padding-top: 8px;
}

/* 连续打卡 */
.letter-streak {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.02);
}

.streak-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.streak-text {
  font-size: 13px;
  color: var(--color-text, #4A4A4A);
  font-weight: 400;
  line-height: 1.5;
}

/* ===== 治愈推荐 ===== */
.healing-section {
  margin-bottom: 16px;
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
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
}

.healing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.healing-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  box-shadow: var(--shadow-card, 0 1px 6px rgba(0,0,0,0.02));
}

.healing-icon {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
}

.healing-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text, #3A3A3A);
  display: block;
}

.healing-desc {
  font-size: 11px;
  color: var(--color-text-light, #9A9A9A);
  font-weight: 400;
}

.safe-bottom { height: 20px }

/* 长辈模式 */
[data-accessibility="elderly"] .care-nav-title {
  font-size: 22px;
}

[data-accessibility="elderly"] .letter-title {
  font-size: 26px;
}

[data-accessibility="elderly"] .letter-body {
  font-size: 17px;
  line-height: 2.1;
}

[data-accessibility="elderly"] .action-text {
  font-size: 16px;
}

[data-accessibility="elderly"] .quote-text {
  font-size: 16px;
}

[data-accessibility="elderly"] .healing-title {
  font-size: 17px;
}

[data-accessibility="elderly"] .healing-desc {
  font-size: 14px;
}
</style>