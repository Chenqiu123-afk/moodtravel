<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useTravelStore } from '@/store/travel.js'

onLaunch(() => {
  console.log('MoodTravel App Launch')
  // 恢复上次心情主题
  try {
    const lastMood = uni.getStorageSync('moodtravel_last_mood')
    if (lastMood) {
      const store = useTravelStore()
      const moodMap = {
        tired:   { label: 'tired', index: 2, emoji: '😴' },
        excited: { label: 'excited', index: 9, emoji: '🤩' },
        happy:   { label: 'happy', index: 8, emoji: '😄' },
        calm:    { label: 'calm', index: 5, emoji: '😌' },
        anxious: { label: 'anxious', index: 3, emoji: '😰' },
        sad:     { label: 'sad', index: 2, emoji: '😢' }
      }
      const mood = moodMap[lastMood]
      if (mood) store.setMood(mood.label, mood.index, mood.emoji)
    }
  } catch (e) {}
  // 恢复登录状态
  try {
    const user = uni.getStorageSync('moodtravel_user')
    if (user) {
      const store = useTravelStore()
      store.setLogin(user)
    }
  } catch (e) {}
})

onShow(() => { console.log('App Show') })
</script>
<style>
/* 全局基础变量 */
page {
  --color-sage: #A3B5A6;
  --color-sage-light: #C5D5C8;
  --color-rose: #C4A8A8;
  --color-sand: #DDD0C0;
  --color-warm-gray: #9B9790;
  --color-text: #4A4640;
  --color-text-light: #7A7670;
  --color-bg: #F5F2ED;
  --color-card: #FFFCF8;
  --radius: 16rpx;
  --radius-sm: 10rpx;
  --radius-lg: 24rpx;

  /* 动态主题变量（默认值，会被 JS 覆盖） */
  --theme-primary: #A3B5A6;
  --theme-primary-light: #C5D5C8;
  --theme-bg: #F5F2ED;
  --theme-bg-gradient: #E8EDE5;
  --theme-accent: #7A9680;

  background-color: var(--theme-bg, var(--color-bg));
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--color-text);
  font-size: 28rpx;
  -webkit-font-smoothing: antialiased;
}

/* 全局过渡动画 */
page {
  transition: background-color 0.5s ease;
}
</style>