/**
 * ================================================================
 *  MoodTravel 情感支持 — 情绪响应规则库
 *  包含暖心话术、资源链接、合规免责声明
 *  【重要】所有医疗相关内容仅指向合规专业资源
 * ================================================================
 */

// ---- 情绪记录弹窗选项 ----
export const EMOTION_RECORD_OPTIONS = [
  { key: 'happy',   emoji: '😊', label: '开心',   color: '#8BA88C' },
  { key: 'calm',    emoji: '😌', label: '平静',   color: '#A3B5A6' },
  { key: 'tired',   emoji: '😴', label: '疲惫',   color: '#6B8FA3' },
  { key: 'anxious', emoji: '😰', label: '焦虑',   color: '#B5A3C4' },
  { key: 'sad',     emoji: '😢', label: '低落',   color: '#C4A8A8' },
  { key: 'stressed',emoji: '😩', label: '压力大', color: '#A8A0C4' },
  { key: 'lonely',  emoji: '🥺', label: '孤独',   color: '#D4C4A8' },
  { key: 'grateful',emoji: '🥰', label: '感恩',   color: '#E8945A' }
]

// ---- 情绪强度等级 ----
export const INTENSITY_LEVELS = [
  { value: 1, label: '轻微', emoji: '🌱' },
  { value: 2, label: '中等', emoji: '🌿' },
  { value: 3, label: '明显', emoji: '🌊' },
  { value: 4, label: '强烈', emoji: '⛈️' },
  { value: 5, label: '非常强烈', emoji: '🌪️' }
]

// ---- 暖心话术响应规则库 ----
// 格式：{ emotion, intensity(1-5) } → { title, body, comfort, action, resources }
export const EMOTION_RESPONSE_RULES = {
  sad: {
    1: { title: '今天有一点点低落', body: '没关系的，就像天气偶尔会有阴天。允许自己稍微慢下来，不需要急着振作。', comfort: '你已经很勇敢了，愿意承认自己的情绪。', action: '听一首你最喜欢的歌，或者泡一杯热茶。', resources: [] },
    2: { title: '心情有些沉重', body: '我能感觉到你的低落。有时候，悲伤需要被看见，而不是被治愈。', comfort: '你的感受是真实的，也是值得被尊重的。', action: '试着写三行字，哪怕只是"今天天气很好，但我还是有点难过"——写下来，本身就是一种释放。', resources: [] },
    3: { title: '情绪像乌云一样压过来', body: '低落的时候，世界都像是灰色的。这不代表你不够好，只是你的心灵需要休息。', comfort: '你不需要一个人扛着。有时候，仅仅是承认"我很难过"，就已经是巨大的勇气。', action: '找一个安静的地方，什么都不做，只是呼吸十分钟。', resources: ['psy-help'] },
    4: { title: '很难受，需要被温柔对待', body: '我听到了。这种沉重不是你的错。此刻的你，值得被无条件地接纳和陪伴。', comfort: '你很重要，你的感受很重要。即使现在看不到光，也请相信它就在那里。', action: '如果可以，给一个信任的人打个电话，或者发一条消息。不需要说什么，只需要被听见。', resources: ['psy-help', 'hotline'] },
    5: { title: '请允许自己寻求帮助', body: '如果这种情绪已经持续了一段时间，并且影响到了你的日常生活，请一定不要一个人扛着。', comfort: '寻求帮助不是软弱，而是对自己最大的温柔。你已经很努力了。', action: '请拨打心理援助热线，或者预约一次心理咨询。你值得被专业的支持。', resources: ['psy-help', 'hotline', 'emergency'] }
  },
  anxious: {
    1: { title: '有一点点不安', body: '焦虑是你对生活认真负责的证明。深呼吸，你不会被这点不安打败的。', comfort: '你的担忧是正常的，很多人都会有这样的时刻。', action: '试试4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒。重复三次。', resources: [] },
    2: { title: '心跳有些快', body: '我能感觉到你的焦虑。把注意力放在你的呼吸上——吸气，呼气，慢慢地，慢慢地。', comfort: '焦虑是大脑在试图保护你，它只是在用错了方式。', action: '写下三件你确定的事：比如"我确定今天太阳升起来了"、"我确定现在是下午"——确定性会帮助大脑平静下来。', resources: [] },
    3: { title: '焦虑像潮水一样涌来', body: '手心出汗，心跳加速——这些都是焦虑在身体上的表现。它们不会伤害你，只是让你感觉不舒服。', comfort: '你正在经历一个困难的时刻，但这不代表你会一直这样。焦虑是暂时的，它会过去的。', action: '做一次"5-4-3-2-1"感官练习：说出5样你看到的东西，4样你摸到的，3样你听到的，2样你闻到的，1样你尝到的。', resources: ['psy-help'] },
    4: { title: '焦虑占据了一切', body: '当焦虑变得如此强烈，日常生活都会变得困难。这不是你的错，你不需要为此自责。', comfort: '你正在和一种非常真实的感受做斗争。你已经很勇敢了。', action: '找一个安静安全的地方坐下，把手放在心口，对自己说："我是安全的，这只是暂时的。"', resources: ['psy-help', 'hotline'] },
    5: { title: '请寻求专业支持', body: '如果焦虑已经严重影响了你的睡眠、饮食和日常功能，请考虑寻求专业的帮助。', comfort: '你不需要独自承受这些。专业的心理咨询师可以帮助你找到应对的方法。', action: '请拨打心理援助热线，专业的倾听者会陪着你。', resources: ['psy-help', 'hotline', 'emergency'] }
  },
  tired: {
    1: { title: '今天有点累', body: '累了就休息，这不是偷懒，是身体在提醒你充电。', comfort: '你已经做了很多了，允许自己停下来。', action: '泡一杯温热的茶，找一个舒服的角落，什么都不想。', resources: [] },
    2: { title: '精力快耗尽了', body: '疲惫不只是身体的事，有时候心灵也需要休息。', comfort: '你的努力我们都看到了。现在，请把时间还给自己。', action: '尝试一个10分钟的"屏幕禁食"——关掉手机，闭上眼睛，只是呼吸。', resources: [] },
    3: { title: '累到不想动', body: '当疲惫积累到一定程度，连起床都变成了一件需要勇气的事。', comfort: '不是你的问题。现代生活对每个人来说都太累了。', action: '如果可以，今天就给自己放个假。点一份外卖，看一部不用动脑的电影。', resources: [] },
    4: { title: '身心俱疲', body: '这种深度的疲惫，可能需要更系统的方式来恢复。', comfort: '你不需要在今天解决所有问题。今天就只是活着，就已经够了。', action: '考虑调整一下作息，或者给自己安排一个完整的休息日。', resources: ['psy-help'] },
    5: { title: '请关注自己的健康', body: '长期的严重疲惫可能是身体在发出信号。请关注自己的身心健康。', comfort: '你的健康是最重要的。没有什么比你的身心状态更重要。', action: '建议预约一次体检，或者咨询医生的意见。', resources: ['psy-help', 'hotline'] }
  },
  lonely: {
    1: { title: '有一点点孤单', body: '偶尔的孤独感是正常的，它提醒我们人类是需要连接的。', comfort: '你不是一个人。在这个世界上，有很多人和你一样，正在经历相似的感受。', action: '给一个朋友发一条消息，不需要多长，只是说一声"嗨，突然想到你"。', resources: [] },
    2: { title: '感觉有些孤单', body: '孤独不是身边没有人，而是感觉没有人真正理解你。', comfort: '你的感受是真实的。有时候，承认孤独本身就是一种连接。', action: '去附近的咖啡馆坐坐，不需要和任何人说话，只是感受周围人的存在。', resources: [] },
    3: { title: '孤独感很强烈', body: '当孤独变成一种常态，每一天都变得漫长。', comfort: '你值得被陪伴，值得被理解。即使现在没有，也不代表永远不会。', action: '考虑加入一个兴趣小组或社区活动——不需要是深刻的社交，只是和志同道合的人待在一起。', resources: ['psy-help'] },
    4: { title: '被孤独包围', body: '深度的孤独感会让人觉得自己被世界遗忘。但你没有被遗忘，你在这里，你是重要的。', comfort: '请相信，你的存在对这个世界是有意义的。即使现在看不到，也请相信。', action: '如果可以，请告诉一个信任的人你的感受。只是说出来，就会好一些。', resources: ['psy-help', 'hotline'] },
    5: { title: '请寻求连接', body: '如果孤独感已经严重影响了你的生活，请一定寻求帮助。', comfort: '你不需要一个人面对这些。专业的支持可以帮助你重新建立连接。', action: '请拨打心理援助热线，或者预约心理咨询。', resources: ['psy-help', 'hotline', 'emergency'] }
  }
}

// ---- 合规资源链接 ----
export const COMPLIANCE_RESOURCES = {
  'psy-help': {
    name: '心理咨询平台',
    desc: '推荐前往正规心理咨询平台进行专业评估',
    url: 'https://www.psy-helpline.org.cn',
    disclaimer: 'MoodTravel 不提供心理咨询或治疗服务。以上链接仅为信息参考，请咨询持证专业人士。'
  },
  'hotline': {
    name: '全国心理援助热线',
    desc: '24小时免费心理援助热线',
    phone: '400-161-9995',
    disclaimer: '如果您或身边的人正在经历心理危机，请立即拨打心理援助热线。'
  },
  'emergency': {
    name: '紧急求助',
    desc: '如果您有自伤或伤害他人的风险，请立即拨打 110 或前往最近的医院急诊科',
    phone: '110 / 120',
    disclaimer: 'MoodTravel 不是危机干预平台。如有紧急情况，请立即拨打 110 或 120。'
  }
}

// ---- 免责声明模板 ----
export const EMOTIONAL_DISCLAIMER = {
  short: 'MoodTravel 不提供心理咨询、诊断或治疗服务。情绪支持内容仅供参考，如有需要请咨询专业医生。',
  full: '【重要提示】MoodTravel 情绪旅行平台提供的内容（包括但不限于情绪记录、暖心话术、推荐信息）仅为旅行辅助和情绪陪伴目的，不构成心理咨询、诊断或治疗。如果您正在经历严重的情绪困扰或心理健康问题，请务必咨询持证心理医生或拨打心理援助热线。本平台不承担因依赖本平台内容而导致的任何后果。',
  medical: '本平台所有涉及医疗、心理健康的内容均指向合规专业资源，不提供任何形式的医疗建议。'
}

// ---- 获取情绪响应 ----
export function getEmotionResponse(emotion, intensity = 1) {
  const rules = EMOTION_RESPONSE_RULES[emotion]
  if (!rules) return EMOTION_RESPONSE_RULES.sad[1]
  const level = Math.min(intensity, 5)
  const response = rules[level] || rules[1]

  // 获取资源
  const resources = (response.resources || []).map(key => COMPLIANCE_RESOURCES[key]).filter(Boolean)

  return {
    ...response,
    resources,
    disclaimer: intensity >= 4 ? EMOTIONAL_DISCLAIMER.full : EMOTIONAL_DISCLAIMER.short,
    hasResources: resources.length > 0
  }
}

// ---- 简单加密工具（情绪数据本地加密存储） ----
export function encryptEmotionData(data) {
  // 生产环境应使用 AES 加密，此处为 Mock 实现
  try {
    const json = JSON.stringify(data)
    return btoa(unescape(encodeURIComponent(json)))
  } catch {
    return ''
  }
}

export function decryptEmotionData(encrypted) {
  try {
    const json = decodeURIComponent(escape(atob(encrypted)))
    return JSON.parse(json)
  } catch {
    return null
  }
}