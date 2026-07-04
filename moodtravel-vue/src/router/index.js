import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: () => import('@/pages/login/login.vue') },
  { path: '/home', name: 'home', component: () => import('@/pages/index/index.vue') },
  { path: '/plan', name: 'plan', component: () => import('@/pages/plan/plan.vue') },
  { path: '/mine', name: 'mine', component: () => import('@/pages/mine/mine.vue') },
  { path: '/demo', name: 'demo', component: () => import('@/pages/demo/EnergySlider.vue') },
  { path: '/detail/:id', name: 'detail', component: () => import('@/pages/detail/detail.vue') },
  { path: '/ai-chat', name: 'aiChat', component: () => import('@/pages/chat/chat.vue') },
  // 日常情绪与人文关怀
  { path: '/journal', name: 'journal', component: () => import('@/pages/journal/journal.vue') },
  { path: '/daily-care', name: 'dailyCare', component: () => import('@/pages/daily-care/daily-care.vue') },
  // 认证商家 & 商业模式
  { path: '/certified-places', name: 'certifiedPlaces', component: () => import('@/pages/certified-places/certified-places.vue') },
  { path: '/about/business-model', name: 'businessModel', component: () => import('@/pages/about/business-model.vue') },
  // 合规页面
  { path: '/ugc-upload', name: 'ugcUpload', component: () => import('@/pages/ugc/ugc-upload.vue') },
  { path: '/user-agreement', name: 'userAgreement', component: () => import('@/pages/agreement/user-agreement.vue') },
  // 商业化 & Pro 订阅
  { path: '/pro-subscription', name: 'proSubscription', component: () => import('@/pages/pro-subscription/pro-subscription.vue') },
  // 组件库演示
  { path: '/web-demo', name: 'webDemo', component: () => import('@/pages/web-demo/web-demo.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router