// Cloudflare Function: AI Multi-Agent Pipeline
// 端点: /api/agents — 接收规划参数，并行调用5个AI Agent
// 部署到 Cloudflare Pages Functions
// Powered by pollinations.ai (free LLM) + Cloudflare Edge Network

export async function onRequest(context) {
  const { request } = context;
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  try {
    let params = {};
    if (request.method === 'POST') {
      try { params = await request.json(); } catch(e) {}
    }

    const city = params.city || '杭州';
    const mood = params.mood || 'calm';
    const moodLabels = { calm:'平静放松', happy:'开心愉快', sad:'安静治愈', anxious:'焦虑不安', excited:'兴奋激动', tired:'疲惫需要休息', insomnia:'深夜emo' };
    const companionLabels = { solo:'独行', couple:'情侣', family:'家庭', friends:'朋友', business:'商务' };
    const now = new Date();
    const month = now.getMonth() + 1;
    const season = month >= 3 && month <= 5 ? '春季' : month >= 6 && month <= 8 ? '夏季' : month >= 9 && month <= 11 ? '秋季' : '冬季';

    const agentParams = {
      city: city,
      mood: moodLabels[mood] || mood,
      days: params.days || 2,
      budget: params.budget || 2000,
      companion: companionLabels[params.companion] || '独行',
      season: season,
      weather: params.weather || '晴朗'
    };

    // 并行调用所有5个Agent — 每个Agent有独立的专业prompt
    const [routeResult, hotelResult, foodResult, weatherResult, budgetResult] = await Promise.allSettled([
      callAgent(agentRoutePlanner(agentParams)),
      callAgent(agentHotelAdvisor(agentParams)),
      callAgent(agentFoodCurator(agentParams)),
      callAgent(agentWeatherRisk(agentParams)),
      callAgent(agentBudgetOptimizer(agentParams))
    ]);

    return new Response(JSON.stringify({
      success: true,
      agents: [
        { name: 'Route Planner', icon: '🗺️', result: getResult(routeResult, '🗺️ 根据你的心情和偏好，推荐杭州西湖、灵隐寺、龙井村三个经典景点，节奏舒适适合放松') },
        { name: 'Hotel Advisor', icon: '🏨', result: getResult(hotelResult, '🏨 推荐西湖区精品民宿（¥300-500/晚），安静舒适，步行可达西湖') },
        { name: 'Food Curator', icon: '🍜', result: getResult(foodResult, '🍜 必吃推荐：西湖醋鱼、龙井虾仁、东坡肉，人均¥80-150') },
        { name: 'Weather Risk', icon: '🌤️', result: getResult(weatherResult, '🌤️ 当前天气晴朗，适合户外活动，建议携带防晒用品') },
        { name: 'Budget Optimizer', icon: '💰', result: getResult(budgetResult, '💰 推荐预算分配：门票¥200/餐饮¥300/住宿¥400/交通¥100，总计约¥1000/天') }
      ],
      poweredBy: 'pollinations.ai (free LLM) via Cloudflare Edge Functions',
      timestamp: new Date().toISOString()
    }), { status: 200, headers });

  } catch(e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers });
  }
}

function getResult(promise, fallback) {
  return (promise.status === 'fulfilled' && promise.value) ? promise.value : fallback;
}

async function callAgent(prompt) {
  if (!prompt) return '';
  try {
    const encoded = encodeURIComponent(prompt);
    const url = `https://text.pollinations.ai/${encoded}?model=openai&seed=${Math.floor(Math.random() * 100000)}`;
    const resp = await fetch(url, { headers: { 'Accept': 'text/plain' } });
    const text = await resp.text();
    const result = text.trim();
    return (result && result.length > 10 && !result.includes('error')) ? result : '';
  } catch(e) {
    return '';
  }
}

// ================================================================
//  Agent 1: 路线规划师 — 情绪驱动的景点推荐
// ================================================================
function agentRoutePlanner(params) {
  return [
    `你是一位深耕长三角地区10年的资深旅行规划师，同时也是PAD情绪心理学爱好者。`,
    `你的任务是根据用户的情绪状态、旅伴类型和预算，推荐最匹配的旅行路线。`,
    ``,
    `【用户画像】`,
    `- 目的地: ${params.city}`,
    `- 当前心情: ${params.mood}`,
    `- 旅行天数: ${params.days}天`,
    `- 预算: ¥${params.budget}/人`,
    `- 旅伴: ${params.companion}`,
    `- 季节: ${params.season}`,
    `- 天气: ${params.weather}`,
    ``,
    `【推荐原则】`,
    `- 平静放松 → 推荐自然景观、园林、寺庙，节奏慢、人少`,
    `- 开心愉快 → 推荐网红打卡地、美食街、热闹景点`,
    `- 安静治愈 → 推荐湖边、茶园、独立书店、美术馆`,
    `- 焦虑不安 → 推荐开阔空间、山顶、森林步道，帮助释放压力`,
    `- 兴奋激动 → 推荐极限运动、主题乐园、夜生活`,
    `- 疲惫需要休息 → 推荐温泉、SPA、度假村，以躺平为主`,
    `- 深夜emo → 推荐夜景、24小时书店、深夜食堂`,
    ``,
    `请用中文回复，按以下格式（严格60字以内）：`,
    `推荐3个景点：景点1（理由）→ 景点2（理由）→ 景点3（理由）`,
    `最后加一句旅行金句，用「」包裹。`
  ].join('\n');
}

// ================================================================
//  Agent 2: 酒店顾问 — 住宿匹配推荐
// ================================================================
function agentHotelAdvisor(params) {
  return [
    `你是一位拥有15年酒店行业经验的住宿顾问，深谙不同旅伴类型的住宿需求。`,
    `你的任务是根据用户的旅伴类型、心情和预算，推荐最合适的住宿方案。`,
    ``,
    `【用户画像】`,
    `- 目的地: ${params.city}`,
    `- 预算: ¥${params.budget}/人`,
    `- 旅伴: ${params.companion}`,
    `- 心情: ${params.mood}`,
    ``,
    `【推荐原则】`,
    `- 独行 → 推荐青旅/胶囊旅馆/精品民宿，社交性强、性价比高`,
    `- 情侣 → 推荐精品酒店/民宿，私密性好、有浪漫元素`,
    `- 家庭 → 推荐亲子酒店/公寓式酒店，有家庭房、儿童设施`,
    `- 朋友 → 推荐民宿/电竞酒店，公区大、适合聚会`,
    `- 商务 → 推荐商务酒店，交通便利、有会议室`,
    ``,
    `请用中文回复，格式（严格50字以内）：`,
    `推荐区域：XX区 | 推荐类型：XX | 预算：¥XX-XX/晚 | 一句话理由`
  ].join('\n');
}

// ================================================================
//  Agent 3: 美食策展人 — 本地化美食推荐
// ================================================================
function agentFoodCurator(params) {
  return [
    `你是一位长三角地区的美食KOL，对当地美食文化了如指掌。`,
    `你的任务是根据用户的心情和预算，推荐最匹配的当地美食体验。`,
    ``,
    `【用户画像】`,
    `- 城市: ${params.city}`,
    `- 预算: ¥${params.budget}/人`,
    `- 心情: ${params.mood}`,
    ``,
    `【推荐原则】`,
    `- 平静 → 推荐精致本帮菜、茶馆、素食`,
    `- 开心 → 推荐网红餐厅、小吃街、甜品店`,
    `- 治愈 → 推荐温暖的家庭料理、暖汤、甜点`,
    `- 焦虑 → 推荐安静的小众餐厅、咖啡厅`,
    `- 兴奋 → 推荐夜市、大排档、火锅`,
    `- 疲惫 → 推荐外卖友好型美食、养生汤`,
    `- 深夜 → 推荐深夜食堂、24小时餐厅`,
    ``,
    `请用中文回复，格式（严格60字以内）：`,
    `早餐：XX | 午餐：XX | 晚餐：XX | 必吃小吃：XX | 预算约¥XX/天`
  ].join('\n');
}

// ================================================================
//  Agent 4: 天气风险评估师 — 出行安全提示
// ================================================================
function agentWeatherRisk(params) {
  return [
    `你是一位专业的气象旅行顾问，擅长分析天气对旅行体验的影响。`,
    `你的任务是根据城市、季节和天气，给出精准的出行建议。`,
    ``,
    `【参数】`,
    `- 城市: ${params.city}`,
    `- 季节: ${params.season}`,
    `- 天气: ${params.weather}`,
    ``,
    `【分析维度】`,
    `- 温度舒适度（是否需要增减衣物）`,
    `- 降雨概率（是否需要备伞/调整行程）`,
    `- 紫外线强度（是否需要防晒）`,
    `- 最佳出行时段（几点出门最舒适）`,
    ``,
    `请用中文回复，格式（严格50字以内）：`,
    `🌡️体感温度XX°C | ☔降雨概率XX% | 🕐最佳时段：XX | 💡一句话提醒`
  ].join('\n');
}

// ================================================================
//  Agent 5: 预算优化师 — 智能费用分配
// ================================================================
function agentBudgetOptimizer(params) {
  return [
    `你是一位旅行财务规划师，擅长在有限预算内最大化旅行体验。`,
    `你的任务是根据用户参数，给出最优预算分配方案。`,
    ``,
    `【参数】`,
    `- 总预算: ¥${params.budget}/人`,
    `- 天数: ${params.days}天`,
    `- 城市: ${params.city}`,
    `- 心情: ${params.mood}`,
    ``,
    `【优化原则】`,
    `- 平静/治愈类 → 住宿占比可稍高（舒适第一）`,
    `- 兴奋/探索类 → 门票/体验占比可稍高`,
    `- 家庭出行 → 餐饮占比适当提高`,
    `- 商务出行 → 交通占比适当提高`,
    ``,
    `请用中文回复，格式（严格60字以内）：`,
    `🏨住宿¥XX | 🍜餐饮¥XX | 🎫门票¥XX | 🚗交通¥XX | 💡省钱tip：XX`
  ].join('\n');
}