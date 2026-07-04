<template>
  <div class="ai-chat-page">
    <!-- ============================================================ -->
    <!-- 顶部栏：返回 + AI 身份 -->
    <!-- ============================================================ -->
    <header class="chat-topbar">
      <button class="topbar-back" @click="goBack" aria-label="返回">
        <span class="back-arrow">←</span>
      </button>
      <div class="topbar-ai">
        <div class="ai-avatar-ring">
          <div class="ai-avatar-inner" :style="{ background: avatarGradient }">
            <span class="ai-avatar-face">🧳</span>
          </div>
          <div class="ai-avatar-glow" :style="{ borderColor: theme.primary }" />
        </div>
        <div class="ai-meta">
          <span class="ai-name">小旅</span>
          <span class="ai-status">
            <span class="ai-dot" />
            在线 · 倾听中
          </span>
        </div>
      </div>
    </header>

    <!-- ============================================================ -->
    <!-- 消息区 -->
    <!-- ============================================================ -->
    <div class="chat-body" ref="bodyEl">
      <!-- 空态：欢迎区 + 快捷标签 -->
      <div v-if="messages.length === 0" class="welcome-zone">
        <div class="welcome-wave">
          <span class="wave-emoji">👋</span>
        </div>
        <p class="welcome-greeting">{{ greetingText }}</p>
        <p class="welcome-hint">试试下面这些，或者直接告诉我你的状态</p>

        <!-- 快捷情绪标签 -->
        <div class="quick-tags">
          <button
            v-for="tag in quickTags"
            :key="tag.label"
            class="quick-tag"
            @click="tapQuickTag(tag)"
          >
            <span class="tag-icon">{{ tag.icon }}</span>
            <span class="tag-text">{{ tag.label }}</span>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <TransitionGroup name="bubble" tag="div" class="msg-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="msg-row"
          :class="msg.role === 'user' ? 'row-user' : 'row-ai'"
        >
          <!-- AI 头像 -->
          <div v-if="msg.role === 'ai'" class="msg-avatar" :style="{ background: avatarGradient }">
            <span>🧳</span>
          </div>

          <div class="msg-body">
            <!-- 气泡 -->
            <div
              class="msg-bubble"
              :class="{
                'bubble-ai': msg.role === 'ai',
                'bubble-user': msg.role === 'user',
                'bubble-thinking': msg.thinking
              }"
              :style="msg.role === 'ai' ? { borderColor: theme.primary + '30' } : {}"
            >
              <!-- 思考中动画 -->
              <template v-if="msg.thinking">
                <span class="think-dot" />
                <span class="think-dot" />
                <span class="think-dot" />
                <span class="think-label">正在思考...</span>
              </template>
              <!-- 正常文本 -->
              <template v-else>
                <span class="bubble-text" v-html="msg.text"></span>
              </template>
            </div>

            <!-- 快捷追问按钮（仅 AI 消息附带） -->
            <div v-if="msg.actions && msg.actions.length && !msg.thinking" class="msg-actions">
              <button
                v-for="act in msg.actions"
                :key="act.label"
                class="action-chip"
                :style="{ borderColor: theme.primary + '40', color: theme.primary }"
                @click="tapQuickTag(act)"
              >
                {{ act.label }}
              </button>
            </div>
          </div>

          <!-- 用户头像 -->
          <div v-if="msg.role === 'user'" class="msg-avatar msg-avatar-self">
            <span>{{ store.moodEmoji }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- ============================================================ -->
    <!-- 底部输入区 -->
    <!-- ============================================================ -->
    <div class="chat-footer">
      <div class="footer-inner">
        <!-- 长辈模式：麦克风按钮 -->
        <button
          v-if="store.elderlyMode"
          class="mic-btn"
          aria-label="按住说话"
        >
          <span class="mic-icon">🎤</span>
        </button>

        <div class="input-box">
          <input
            ref="inputEl"
            v-model="inputText"
            class="text-input"
            :placeholder="store.elderlyMode ? '在这里输入你想问的...' : '说说你的感受...'"
            @keydown.enter="send"
            :disabled="isThinking"
          />
        </div>

        <button
          class="send-btn"
          :class="{ ready: inputText.trim() && !isThinking }"
          :disabled="!inputText.trim() || isThinking"
          @click="send"
          :aria-label="store.elderlyMode ? '发送' : '发送消息'"
        >
          <span v-if="store.elderlyMode" class="send-label">发送</span>
          <span v-else class="send-arrow">↑</span>
        </button>
      </div>

      <!-- 长辈模式：按住说话提示条 -->
      <div v-if="store.elderlyMode" class="voice-hint-bar">
        <span class="voice-hint-icon">🎤</span>
        <span class="voice-hint-text">按住说话</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/store/travel.js'

const router = useRouter()
const store = useTravelStore()

const theme   = computed(() => store.activeTheme)
const bodyEl  = ref(null)
const inputEl = ref(null)
const inputText   = ref('')
const isThinking  = ref(false)

let _id = 0
const messages = ref([])

/* ============================================================
   头像渐变
   ============================================================ */
const avatarGradient = computed(() =>
  `linear-gradient(135deg, ${theme.value.primaryLight}, ${theme.value.primary})`
)

/* ============================================================
   欢迎语 — 根据情绪动态生成
   ============================================================ */
const greetingText = computed(() => {
  const map = {
    tired:   '看起来你今天有点累。没关系，说给我听听，我帮你找个安静的地方充充电。',
    excited: '哇，状态不错！今天想探索点什么？',
    happy:   '心情好就是最好的旅行天气。想做点什么？',
    calm:    '不紧不慢，刚刚好。让我陪你慢慢逛。',
    anxious: '我能感觉到你的不安。来，深呼吸，我会帮你找到平静。',
    sad:     '没关系的，有时候我们都需要一个温柔的角落。让我陪着你。'
  }
  return map[store.moodLabel] || '嗨，我是小旅。告诉我你的状态，我来帮你安排。'
})

/* ============================================================
   快捷情绪标签
   ============================================================ */
const quickTags = computed(() => {
  const base = [
    { icon: '😮‍💨', label: '今天好累',     query: '今天好累' },
    { icon: '🏠',   label: '不想走远',     query: '不想走远' },
    { icon: '🧘',   label: '想一个人静静', query: '想一个人静静' },
    { icon: '🍜',   label: '想吃点好的',   query: '想吃点好的' },
    { icon: '💕',   label: '想约会',       query: '想约会' },
    { icon: '👶',   label: '带娃出行',     query: '带娃出行' }
  ]
  if (store.elderlyMode) {
    return [
      { icon: '🚶', label: '慢慢逛逛',  query: '想找个地方慢慢逛' },
      { icon: '🍵', label: '喝杯茶',    query: '附近有安静的茶馆吗' },
      { icon: '�', label: '附近哪里有公厕？', query: '附近哪里有公厕' },
      { icon: '🥬', label: '我想买点新鲜蔬菜', query: '我想买点新鲜蔬菜' },
      { icon: '🌤️', label: '今天天气怎么样？', query: '今天天气怎么样' },
      { icon: '🏠', label: '不想走远',  query: '不想走远' }
    ]
  }
  return base
})

/* ============================================================
   AI 回复引擎 — 情绪安抚文案
   ============================================================ */
function think(userText) {
  const t = userText.trim()
  const mood = store.moodLabel
  const isElderly = store.elderlyMode
  const isCouple  = store.isCouple
  const hasKids   = store.hasKids
  const energy    = store.energyLevel

  // ---- 累 / 疲惫 ----
  if (t.includes('累') || t.includes('疲惫') || t.includes('困') || t.includes('没力气')) {
    return {
      text: '懂你，辛苦了。深呼吸，把烦恼留在门外。<br><br>步行 5 分钟有一家藏在巷子里的<b>猫空书店</b>，我给你留了个靠窗的安静位置。点一杯热拿铁，翻几页闲书，让时间慢慢流过去。<br><br>需要我帮你导航过去吗？',
      actions: [
        { label: '好的，带我过去', query: '带我去猫空书店' },
        { label: '还有别的选择吗', query: '还有没有其他安静的地方' }
      ]
    }
  }

  // ---- 不想走远 / 附近 ----
  if (t.includes('不想走') || t.includes('近') || t.includes('附近') || t.includes('不远')) {
    return {
      text: '完全理解，今天就让脚步轻一点。<br><br>在你周边 500 米内，我找到了三个好去处：<br><br>☕ <b>转角咖啡</b> — 3 分钟步行，手冲很棒<br>🌿 <b>社区小花园</b> — 5 分钟，有长椅和树荫<br>📚 <b>西西弗书店</b> — 8 分钟，可以待一下午<br><br>每一步都不超过 800 步，慢慢走就好。',
      actions: [
        { label: '转角咖啡', query: '带我去转角咖啡' },
        { label: '社区小花园', query: '社区小花园怎么走' }
      ]
    }
  }

  // ---- 一个人静静 / 独处 ----
  if (t.includes('一个人') || t.includes('静静') || t.includes('独处') || t.includes('安静') || t.includes('放空')) {
    return {
      text: '没问题，有时候我们需要和自己待一会儿。<br><br>为你找到了一处<b>避世书局</b>——藏在老城区二楼，知道的人很少。木地板踩上去会轻轻响，空气里有旧书和咖啡的味道。找一个靠窗的角落，没有人会打扰你。<br><br>想一个人待多久都可以。',
      actions: [
        { label: '避世书局在哪里', query: '避世书局怎么走' },
        { label: '就想去那里', query: '好的，帮我导航到避世书局' }
      ]
    }
  }

  // ---- 想吃 / 美食 ----
  if (t.includes('吃') || t.includes('美食') || t.includes('餐厅') || t.includes('饿')) {
    if (mood === 'tired' || mood === 'sad') {
      return {
        text: '心情需要被温柔对待的时候，食物是最好的安慰。<br><br>🍜 推荐<b>知味观</b>，一碗热腾腾的片儿川，汤头浓郁，面条筋道。百年老店，味道从不让人失望。坐在靠窗的位置，看街上人来人往，慢慢吃完，心情会好起来的。<br><br>走路 10 分钟就到。',
        actions: [
          { label: '就这家', query: '带我去知味观' },
          { label: '想吃甜的', query: '有没有甜品店推荐' }
        ]
      }
    }
    if (isCouple) {
      return {
        text: '约会晚餐，当然要够浪漫。<br><br>🕯️ <b>桂语山房</b> — 藏在满觉陇的山间，烛光晚餐，私密包间，窗外就是竹林。人均 ¥300，需要提前预约，但值得。<br><br>需要我帮你们预订今晚的位子吗？',
        actions: [
          { label: '帮我预订', query: '帮我预订桂语山房今晚的位置' },
          { label: '看看别的', query: '还有没有其他浪漫餐厅' }
        ]
      }
    }
    if (isElderly) {
      return {
        text: '和长辈一起用餐，舒适最重要。我帮你筛选了这些：<br><br>🥢 <b>楼外楼</b> — 经典杭帮菜，有电梯，环境宽敞不拥挤。人均 ¥150。<br>🍵 <b>湖畔居</b> — 西湖边茶馆 + 简餐，安静雅致，备热茶。<br><br>两家都没有辣菜，口味清淡，适合慢慢享用。',
        actions: [
          { label: '楼外楼', query: '带我去楼外楼' },
          { label: '湖畔居', query: '湖畔居怎么走' }
        ]
      }
    }
    return {
      text: '杭州好吃的太多了！推荐几家：<br><br>🍜 <b>奎元馆</b> — 一碗片儿川，百年老味道<br>🥟 <b>知味观</b> — 小笼包和猫耳朵必点<br>🍵 <b>青藤茶馆</b> — 喝茶发呆好去处<br><br>想吃哪种类型的？',
      actions: [
        { label: '本地小吃', query: '推荐杭州本地特色小吃' },
        { label: '精致餐厅', query: '有没有环境好的餐厅' }
      ]
    }
  }

  // ---- 约会 / 浪漫 ----
  if (t.includes('约会') || t.includes('浪漫') || t.includes('对象') || t.includes('情侣')) {
    return {
      text: '约会模式启动～为你们精心挑选：<br><br>📸 <b>杨公堤</b> — 人少景美，随手拍都是大片<br>🌅 <b>宝石山日落</b> — 杭州最美的日落视角<br>🍷 <b>桂语山房</b> — 私密包间，烛光晚餐<br><br>需要我帮你们规划一整个约会日吗？',
      actions: [
        { label: '规划约会日', query: '帮我规划一个完整的约会日' },
        { label: '宝石山怎么去', query: '宝石山什么时间去最好' }
      ]
    }
  }

  // ---- 带娃 ----
  if (t.includes('带娃') || t.includes('孩子') || t.includes('亲子') || t.includes('小孩')) {
    return {
      text: '带娃出行，轻松和安全最重要！<br><br>🎠 <b>杭州动物园</b> — 有母婴室，推车方便，孩子最爱<br>🏛️ <b>浙江自然博物院</b> — 恐龙展超震撼，有母婴室<br>🌳 <b>太子湾公园</b> — 大草坪随便跑，有儿童游乐区<br><br>这些地方都有母婴室和休息区，带娃不累。',
      actions: [
        { label: '动物园', query: '杭州动物园门票和开放时间' },
        { label: '亲子一日游', query: '帮我规划亲子一日游' }
      ]
    }
  }

  // ---- 老人 / 长辈 日常关怀 — 公厕 / 买菜 / 天气 ----
  if (t.includes('公厕') || t.includes('厕所') || t.includes('卫生间')) {
    return {
      text: '好的，帮您找了一下。<br><br>🚻 出门右转，步行约 150 米，在社区小公园旁边就有一个公共卫生间。很干净，有专人打扫，还配备了无障碍扶手。<br><br>另外，旁边的便利店也有洗手间，如果急用的话可以先去那里。<br><br>您慢慢走，不着急，出门记得带好手机。',
      actions: [
        { label: '帮我导航到公厕', query: '帮我导航到最近的公厕' },
        { label: '还有别的吗', query: '附近还有没有其他公厕' }
      ]
    }
  }

  if (t.includes('买菜') || t.includes('蔬菜') || t.includes('菜市场') || t.includes('新鲜')) {
    return {
      text: '好的。出门右转步行 200 米就是<b>幸福菜市场</b>，那里早上刚进了一批新鲜的西红柿和黄瓜。今天天气不错，慢慢走，不着急。<br><br>🥬 他们家的青菜都是本地农户直供的，很新鲜，价格也实惠。<br><br>如果不想走太远，小区门口的<b>街角便利店</b>也有蔬菜和鸡蛋，距您只有 80 米，更方便。',
      actions: [
        { label: '幸福菜市场怎么走', query: '帮我导航到幸福菜市场' },
        { label: '去便利店看看', query: '街角便利店在哪里' }
      ]
    }
  }

  if (t.includes('天气') || t.includes('下雨') || t.includes('温度') || t.includes('冷') || t.includes('热')) {
    return {
      text: '帮您看了一下今天的天气：<br><br>🌤️ 今天多云转晴，气温 18°C ~ 26°C，体感舒适。<br><br>空气质量良好，适合出门散步。不过下午 3 点左右可能转阴，建议带一把轻便的折叠伞，以防万一。<br><br>今天穿一件薄外套就够了，早晚稍微有点凉，注意保暖哦。',
      actions: [
        { label: '适合出门散步吗', query: '今天适合出门散步吗' },
        { label: '明天天气怎么样', query: '明天天气怎么样' }
      ]
    }
  }

  // ---- 老人 / 长辈 ----
  if (t.includes('老人') || t.includes('长辈') || t.includes('爸妈') || t.includes('慢慢逛') || t.includes('慢慢走')) {
    return {
      text: '带长辈出行，舒适和便利最重要。<br><br>👴 <b>西湖苏堤</b> — 路面平坦，轮椅友好，走累了随时有长椅休息<br>🏛️ <b>中国茶叶博物馆</b> — 室内为主，免费参观，有充足休息座椅<br>🍵 <b>湖畔居</b> — 西湖边茶馆，有电梯，安静雅致<br><br>沿途有浙一医院和多家药店，医疗保障充足。要不要我开启「长辈关怀模式」？字号会更大，按钮更好点。',
      actions: [
        { label: '开启长辈模式', query: '帮我开启长辈关怀模式' },
        { label: '苏堤怎么走', query: '苏堤怎么走最轻松' }
      ]
    }
  }

  // ---- 默认：根据情绪回应 ----
  if (mood === 'tired') {
    return {
      text: '累了就放慢脚步，不着急。<br><br>杭州有很多不需要走太多路的地方——猫空书店、青藤茶馆，或者西湖边的长椅，坐下来就是风景。<br><br>你想去哪种类型的？',
      actions: [
        { label: '安静的地方', query: '推荐最安静的地方' },
        { label: '不用走路的', query: '有没有不用怎么走路的好去处' }
      ]
    }
  }
  if (mood === 'anxious') {
    return {
      text: '我听到了。焦虑的时候，大自然是最好的疗愈师。<br><br>🌿 推荐去<b>梅家坞</b>——茶园深处，找一家农家茶室，只听鸟叫，看茶树一层层绿到天边。泡一壶明前龙井，深呼吸，慢慢地，心跳会平复下来的。<br><br>走路 15 分钟就到，不急。',
      actions: [
        { label: '带我去梅家坞', query: '梅家坞怎么走' },
        { label: '想听点别的', query: '还有没有其他治愈的地方' }
      ]
    }
  }
  return {
    text: '好的，我听到了～<br><br>让我想想怎么帮你安排。你可以告诉我更多细节吗？比如想去什么类型的地方、有什么特别的需求？',
    actions: [
      { label: '推荐景点', query: '推荐几个杭州必去的景点' },
      { label: '推荐美食', query: '附近有什么好吃的' }
    ]
  }
}

/* ============================================================
   发送消息
   ============================================================ */
async function send() {
  const text = inputText.value.trim()
  if (!text || isThinking.value) return

  // 添加用户消息
  pushMsg('user', text)
  inputText.value = ''

  // 思考中...
  isThinking.value = true
  const thinkMsg = pushMsg('ai', '', { thinking: true })

  // 模拟思考延迟 1.2-2 秒
  const delay = store.elderlyMode ? 2000 : 1200 + Math.random() * 800
  await new Promise(r => setTimeout(r, delay))

  // 移除思考消息
  const idx = messages.value.findIndex(m => m.thinking)
  if (idx > -1) messages.value.splice(idx, 1)

  // 生成回复
  const reply = think(text)
  pushMsg('ai', reply.text, { actions: reply.actions || null })

  isThinking.value = false
  scrollBottom()
  nextTick(() => inputEl.value?.focus())
}

function tapQuickTag(tag) {
  inputText.value = tag.query || tag.label
  send()
}

function pushMsg(role, text, opts = {}) {
  const msg = {
    id: ++_id,
    role,
    text,
    thinking: !!opts.thinking,
    actions: opts.actions || null
  }
  messages.value.push(msg)
  scrollBottom()
  return msg
}

function scrollBottom() {
  nextTick(() => {
    if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
  })
}

function goBack() {
  router.back()
}

onMounted(() => {
  nextTick(() => inputEl.value?.focus())
})
</script>

<style scoped>
/* ============================================================
   AI Chat Page — 极简 · 情绪 · 零门槛
   ============================================================ */
.ai-chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #F5F2ED;
  font-weight: 300;
  letter-spacing: 0.5px;
}

/* ============================================================
   TOP BAR
   ============================================================ */
.chat-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 44px 16px 12px;
  flex-shrink: 0;
  background: transparent;
}

.topbar-back {
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
  font-weight: 400;
}

.topbar-ai {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* AI 头像 + 呼吸光环 */
.ai-avatar-ring {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.ai-avatar-inner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.ai-avatar-face {
  font-size: 20px;
  line-height: 1;
}

.ai-avatar-glow {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0.5;
  animation: glowPulse 2.5s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50%      { transform: scale(1.15); opacity: 0.7; }
}

.ai-meta {
  display: flex;
  flex-direction: column;
}

.ai-name {
  font-size: 16px;
  font-weight: 700;
  color: #3A3A3A;
}

.ai-status {
  font-size: 11px;
  color: #9A9A9A;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
}

.ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8BA88C;
  animation: dotBreathe 2s ease-in-out infinite;
}

@keyframes dotBreathe {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}

/* ============================================================
   MESSAGE BODY
   ============================================================ */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============================================================
   WELCOME ZONE
   ============================================================ */
.welcome-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 12px 24px;
  text-align: center;
}

.welcome-wave {
  margin-bottom: 16px;
}

.wave-emoji {
  font-size: 48px;
  display: inline-block;
  animation: waveHand 2s ease-in-out infinite;
  transform-origin: 70% 70%;
}

@keyframes waveHand {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(14deg); }
  50%      { transform: rotate(-8deg); }
  75%      { transform: rotate(10deg); }
}

.welcome-greeting {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #3A3A3A;
  line-height: 1.7;
  max-width: 300px;
}

.welcome-hint {
  margin: 0 0 20px;
  font-size: 13px;
  color: #A0A0A0;
  font-weight: 400;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 340px;
}

.quick-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.quick-tag:active {
  transform: scale(0.94);
  background: rgba(0,0,0,0.04);
}

.tag-icon {
  font-size: 18px;
  line-height: 1;
}

.tag-text {
  font-size: 14px;
  font-weight: 500;
  color: #4A4A4A;
}

/* ============================================================
   MESSAGE ROW
   ============================================================ */
.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 100%;
}

.row-user { flex-direction: row-reverse; }
.row-ai   { flex-direction: row; }

.msg-body {
  max-width: 80%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 头像 */
.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 15px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.msg-avatar-self {
  background: #E8E4DC;
  font-size: 13px;
}

/* ============================================================
   BUBBLES
   ============================================================ */
.msg-bubble {
  padding: 14px 18px;
  border-radius: 22px;
  line-height: 1.7;
  font-size: 14px;
  font-weight: 400;
  word-break: break-word;
}

/* AI 气泡：低饱和度莫兰迪色，大圆角，靠左 */
.bubble-ai {
  background: #EDF3F0;
  color: #3A3A3A;
  border: 1px solid rgba(0,0,0,0.04);
  border-bottom-left-radius: 8px;
}

/* 用户气泡：深灰底，白字，靠右 */
.bubble-user {
  background: #3A3A3A;
  color: #F5F2ED;
  border-bottom-right-radius: 8px;
}

/* 思考中气泡 */
.bubble-thinking {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 22px;
  min-width: 100px;
  background: #EDF3F0;
}

.think-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #C0BCB4;
  animation: thinkBounce 1.4s ease-in-out infinite;
}
.think-dot:nth-child(2) { animation-delay: 0.2s; }
.think-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes thinkBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
  30%          { transform: translateY(-6px); opacity: 0.8; }
}

.think-label {
  margin-left: 6px;
  font-size: 13px;
  color: #A0A0A0;
  font-weight: 400;
  font-style: italic;
}

/* ============================================================
   MESSAGE ACTIONS
   ============================================================ */
.msg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 4px;
}

.action-chip {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid;
  background: rgba(255,255,255,0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: inherit;
}

.action-chip:active {
  transform: scale(0.94);
}

/* ============================================================
   BUBBLE TRANSITIONS
   ============================================================ */
.bubble-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.bubble-leave-active {
  transition: all 0.2s cubic-bezier(0.55, 0, 1, 0.45);
}
.bubble-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* ============================================================
   FOOTER INPUT
   ============================================================ */
.chat-footer {
  flex-shrink: 0;
  padding: 10px 16px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  background: rgba(245,242,237,0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(0,0,0,0.04);
}

.footer-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-box {
  flex: 1;
  background: rgba(255,255,255,0.8);
  border-radius: 24px;
  border: 1px solid rgba(0,0,0,0.05);
  padding: 0 16px;
}

.text-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  color: #3A3A3A;
  padding: 10px 0;
  font-family: inherit;
  line-height: 1.5;
}

.text-input::placeholder {
  color: #C0BCB4;
  font-weight: 300;
}

.text-input:disabled {
  opacity: 0.5;
}

/* 发送按钮 */
.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #D0CCC4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  flex-shrink: 0;
}

.send-btn.ready {
  background: #3A3A3A;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
}

.send-btn:active {
  transform: scale(0.88);
}

.send-btn:disabled {
  cursor: not-allowed;
}

.send-arrow {
  font-size: 18px;
  color: #fff;
  font-weight: 600;
}

/* 长辈模式：发送文字 */
.send-label {
  font-size: 15px;
  color: #fff;
  font-weight: 700;
}

/* 麦克风按钮（长辈模式） */
.mic-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.mic-btn:active {
  transform: scale(0.9);
  background: rgba(0,0,0,0.05);
}

.mic-icon {
  font-size: 22px;
  line-height: 1;
}

/* 按住说话提示条 */
.voice-hint-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.03);
  border: 1px dashed rgba(0,0,0,0.08);
}

.voice-hint-icon {
  font-size: 22px;
}

.voice-hint-text {
  font-size: 16px;
  font-weight: 600;
  color: #6A6A6A;
}

/* ============================================================
   长辈模式全局适配
   ============================================================ */
[data-accessibility="elderly"] .ai-chat-page {
  background: #FFFFFF;
}

[data-accessibility="elderly"] .chat-topbar {
  padding: 44px 20px 16px;
}

[data-accessibility="elderly"] .topbar-back {
  width: 48px;
  height: 48px;
}

[data-accessibility="elderly"] .back-arrow {
  font-size: 24px;
}

[data-accessibility="elderly"] .ai-avatar-ring {
  width: 52px;
  height: 52px;
}

[data-accessibility="elderly"] .ai-avatar-inner {
  width: 52px;
  height: 52px;
}

[data-accessibility="elderly"] .ai-avatar-face {
  font-size: 26px;
}

[data-accessibility="elderly"] .ai-name {
  font-size: 20px;
}

[data-accessibility="elderly"] .ai-status {
  font-size: 14px;
}

[data-accessibility="elderly"] .welcome-greeting {
  font-size: 22px;
  max-width: 360px;
}

[data-accessibility="elderly"] .welcome-hint {
  font-size: 16px;
}

[data-accessibility="elderly"] .quick-tag {
  padding: 14px 24px;
  border-radius: 30px;
}

[data-accessibility="elderly"] .tag-icon {
  font-size: 24px;
}

[data-accessibility="elderly"] .tag-text {
  font-size: 18px;
}

[data-accessibility="elderly"] .msg-avatar {
  width: 44px;
  height: 44px;
}

[data-accessibility="elderly"] .msg-bubble {
  font-size: 17px;
  padding: 18px 24px;
  border-radius: 28px;
  line-height: 1.9;
}

[data-accessibility="elderly"] .bubble-ai {
  background: #F0F0F0;
}

[data-accessibility="elderly"] .action-chip {
  font-size: 16px;
  padding: 12px 22px;
  border-radius: 24px;
}

[data-accessibility="elderly"] .chat-footer {
  background: #FFFFFF;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  padding: 14px 20px;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
}

[data-accessibility="elderly"] .input-box {
  background: #FFFFFF;
  border-radius: 30px;
  padding: 0 20px;
}

[data-accessibility="elderly"] .text-input {
  font-size: 17px;
  padding: 12px 0;
}

[data-accessibility="elderly"] .send-btn {
  width: 52px;
  height: 52px;
  border-radius: 26px;
}

[data-accessibility="elderly"] .send-label {
  font-size: 18px;
}

[data-accessibility="elderly"] .mic-btn {
  width: 56px;
  height: 56px;
}

[data-accessibility="elderly"] .mic-icon {
  font-size: 28px;
}

[data-accessibility="elderly"] .voice-hint-text {
  font-size: 20px;
}

[data-accessibility="elderly"] .think-label {
  font-size: 16px;
}
</style>