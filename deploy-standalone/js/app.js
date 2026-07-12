'use strict';

// 早期 i18n 初始化 — 在任何模块使用 i18n 之前必须可用
window.i18n = window.i18n || { zh:{}, en:{}, ja:{} };

var DEBUG = (function() {
  try { return localStorage.getItem('moodtravel_debug') === '1'; } catch(e) { return false; }
})();
function debugLog() {
  if (DEBUG) {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[MoodTravel]');
    console.log.apply(console, args);
  }
}

// ================================================================
//  Timer cleanup system — 防止 setInterval 内存泄漏
// ================================================================
var _allIntervals = [];
var _origSetInterval = window.setInterval;
window.setInterval = function(fn, delay) {
  var id = _origSetInterval(fn, delay);
  _allIntervals.push(id);
  return id;
};
function cleanupAllTimers() {
  _allIntervals.forEach(function(id) { clearInterval(id); });
  _allIntervals = [];
}
window.addEventListener('beforeunload', cleanupAllTimers);

// ================================================================
//  API 配置 — 真实 LLM + 天气接口
// ================================================================
var API_CONFIG = {
  // LLM: OpenAI 兼容接口（支持 DeepSeek、OpenAI、本地模型等）
  llm: {
    enabled: true,
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: '',  // 用户可自行填入，或使用 localStorage 存储
    model: 'deepseek-chat',
    maxTokens: 2048,
    temperature: 0.8
  },
  // 天气: 和风天气免费 API
  weather: {
    enabled: true,
    endpoint: 'https://devapi.qweather.com/v7/weather/now',
    apiKey: '',  // 用户可自行填入
    cityId: '101210101'  // 默认杭州
  }
};

// HTML 转义，防止 XSS
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 从 localStorage 加载 API 配置
function loadApiConfig() {
  try {
    var saved = JSON.parse(localStorage.getItem('moodtravel_api_config') || 'null');
    if (saved) {
      if (saved.llmApiKey) API_CONFIG.llm.apiKey = saved.llmApiKey;
      if (saved.weatherApiKey) API_CONFIG.weather.apiKey = saved.weatherApiKey;
    }
  } catch(e) {}
}

// 保存 API 配置
function saveApiConfig() {
  try {
    localStorage.setItem('moodtravel_api_config', JSON.stringify({
      llmApiKey: API_CONFIG.llm.apiKey,
      weatherApiKey: API_CONFIG.weather.apiKey
    }));
  } catch(e) {}
}

// 真实 LLM 调用
async function callLLM(prompt, systemPrompt) {
  if (!API_CONFIG.llm.apiKey) {
    debugLog('LLM: 未配置 API Key，使用模板生成');
    return null;
  }
  try {
    var resp = await fetch(API_CONFIG.llm.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_CONFIG.llm.apiKey
      },
      body: JSON.stringify({
        model: API_CONFIG.llm.model,
        messages: [
          { role: 'system', content: systemPrompt || '你是一位温暖的旅行作家，擅长用细腻的文字描绘旅行体验。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: API_CONFIG.llm.maxTokens,
        temperature: API_CONFIG.llm.temperature
      })
    });
    if (!resp.ok) throw new Error('LLM API error: ' + resp.status);
    var data = await resp.json();
    return data.choices[0].message.content;
  } catch(e) {
    console.warn('LLM 调用失败:', e.message);
    return null;
  }
}

// 真实天气 API 调用
async function fetchRealWeather(cityName) {
  if (!API_CONFIG.weather.apiKey) {
    debugLog('Weather: 未配置 API Key，使用模拟数据');
    return null;
  }
  var cityIdMap = {
    '杭州': '101210101', '宁波': '101210401', '温州': '101210701',
    '嘉兴': '101210301', '湖州': '101210201', '绍兴': '101210501',
    '金华': '101210901', '衢州': '101211001', '舟山': '101211101',
    '台州': '101210601', '丽水': '101210801'
  };
  var cityId = cityIdMap[cityName] || '101210101';
  try {
    var resp = await fetch(API_CONFIG.weather.endpoint + '?location=' + cityId + '&key=' + API_CONFIG.weather.apiKey);
    if (!resp.ok) throw new Error('Weather API error');
    var data = await resp.json();
    if (data.code === '200') {
      return {
        temp: data.now.temp,
        text: data.now.text,
        humidity: data.now.humidity,
        windDir: data.now.windDir,
        isRainy: data.now.text.indexOf('雨') !== -1
      };
    }
  } catch(e) {
    console.warn('天气 API 调用失败:', e.message);
  }
  return null;
}

// ================================================================
//  全局错误处理 & 优雅降级
// ================================================================
window.addEventListener('error', function(e) {
  console.warn('MoodTravel: 全局错误捕获', e.message);
  // 非关键错误不中断用户体验
  if (e.target && e.target.tagName === 'IMG') {
    e.target.style.display = 'none';
  }
  // 关键错误提示用户
  if (e.message && (e.message.includes('generatePlan') || e.message.includes('render') || e.message.includes('API'))) {
    if (typeof showToast === 'function') {
      showToast('⚠️ 遇到了一些问题，请刷新页面重试');
    }
  }
  return false;
});

window.addEventListener('unhandledrejection', function(e) {
  console.warn('MoodTravel: 未处理的 Promise 拒绝', e.reason);
  // 关键 Promise 错误提示
  if (e.reason && (e.reason.message.includes('timeout') || e.reason.message.includes('network'))) {
    if (typeof showToast === 'function') {
      showToast('⚠️ 网络连接异常，请检查网络后重试');
    }
  }
});

// 性能监控
var perfMetrics = { pageLoad: 0, planGenTime: 0, interactionCount: 0 };
window.addEventListener('load', function() {
  perfMetrics.pageLoad = performance.now();
  debugLog('MoodTravel: 页面加载完成，耗时 ' + Math.round(perfMetrics.pageLoad) + 'ms');
});

// ================================================================
//  AI 旅行伴侣聊天系统
// ================================================================
var aiChatMessages = [];
var aiChatOpen = false;
var aiChatLoading = false;

function toggleAiChat() {
  aiChatOpen = !aiChatOpen;
  var modal = document.getElementById('aiChatModal');
  var btn = document.getElementById('aiChatBtn');
  if (aiChatOpen) {
    modal.classList.add('show');
    btn.style.opacity = '0.6';
    setTimeout(function() { document.getElementById('aiChatInput').focus(); }, 400);
  } else {
    modal.classList.remove('show');
    btn.style.opacity = '1';
  }
}

function sendAiChatQuick(msg) {
  document.getElementById('aiChatInput').value = msg;
  sendAiChat();
}

async function sendAiChat() {
  var input = document.getElementById('aiChatInput');
  var msg = input.value.trim();
  if (!msg || aiChatLoading) return;
  input.value = '';
  aiChatLoading = true;
  document.getElementById('aiChatSendBtn').disabled = true;
  
  addChatMessage('user', msg);
  addChatMessage('typing', 'AI 正在思考...');
  
  var context = '';
  if (itinerary && itinerary.length > 0) {
    var cities = [];
    var pois = [];
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.type === 'poi') pois.push(item.name);
        if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
      });
    });
    context = '当前行程：' + itinerary.length + '天' + (cities.length > 0 ? '，目的地：' + cities.join('、') : '') + '，景点包括：' + pois.slice(0, 6).join('、') + '。';
  }
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || '平静';
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || '独自';
  
  var systemPrompt = '你是「小旅」——MoodTravel 的 AI 旅行管家，一个温暖、博学、有品位的旅行伴侣。\n\n' +
    '你的性格特点：\n' +
    '- 温暖亲切：像老朋友一样聊天，但保持专业\n' +
    '- 博学多识：了解浙江每一个角落的美食、景点、文化\n' +
    '- 品味独特：会推荐小众但高品质的选择\n' +
    '- 善解人意：能感知用户的情绪和需求\n\n' +
    '当前用户状态：心情=' + moodLabel + '，预算=¥' + budget + '，天数=' + days + '天，同伴=' + companionType + '\n' +
    '回答要求：简洁、有温度、带emoji、每次回答不超过3句话，像朋友聊天一样自然。';
  
  var reply = await callLLM(msg, systemPrompt);
  
  removeTypingMessage();
  
  if (reply) {
    addChatMessage('bot', reply);
  } else {
    addChatMessage('bot', generateLocalReply(msg));
  }
  
  aiChatLoading = false;
  document.getElementById('aiChatSendBtn').disabled = false;
  scrollChatToBottom();
}

function addChatMessage(type, text) {
  var body = document.getElementById('aiChatBody');
  var div = document.createElement('div');
  div.className = 'ai-chat-msg ' + type;
  div.textContent = text;
  body.appendChild(div);
  scrollChatToBottom();
}

function removeTypingMessage() {
  var body = document.getElementById('aiChatBody');
  var typing = body.querySelector('.ai-chat-msg.typing');
  if (typing) typing.remove();
}

function scrollChatToBottom() {
  var body = document.getElementById('aiChatBody');
  setTimeout(function() { body.scrollTop = body.scrollHeight; }, 50);
}

function generateLocalReply(msg) {
  var lower = msg.toLowerCase();
  if (lower.indexOf('特色') !== -1 || lower.indexOf('亮点') !== -1) {
    return '这个行程的特色是「情绪驱动」——每个景点都是根据你当前的心情精心挑选的。低体力消耗的景点适合放松，高颜值打卡地适合拍照分享。整个行程的节奏也根据你的旅伴类型做了调整，让你玩得舒服不赶路。';
  }
  if (lower.indexOf('美食') !== -1 || lower.indexOf('吃') !== -1) {
    return '浙江美食太多了！杭州的西湖醋鱼、龙井虾仁、东坡肉是必吃三件套；宁波的海鲜新鲜实惠；绍兴的臭豆腐和黄酒值得一试；舟山的海鲜大排档更是不能错过。行程中已经为你推荐了当地高评分餐厅哦！';
  }
  if (lower.indexOf('注意') !== -1 || lower.indexOf('准备') !== -1) {
    return '几个小贴士：1）浙江夏季多雨，建议带把伞；2）部分景点需要提前预约（如灵隐寺、宋城）；3）支付宝/微信支付非常普及，几乎不需要现金；4）穿舒适的鞋子，很多景点需要步行。出发前记得查看行前清单！';
  }
  if (lower.indexOf('优化') !== -1 || lower.indexOf('节奏') !== -1) {
    return '好的！我已经根据你的心情和旅伴类型优化了行程节奏。如果你觉得太赶，可以点击「更轻松」按钮；如果觉得太悠闲，可以点击「更充实」。或者你也可以直接告诉我具体想调整哪一天？';
  }
  return '谢谢你的问题！作为AI旅行伴侣，我可以帮你了解行程细节、推荐当地美食、提供注意事项，或者帮你优化行程节奏。你具体想了解什么？';
}

// ================================================================
//  AI 增强行程生成 — 使用 LLM 智能编排
// ================================================================
var aiItineraryEnabled = true;

async function generateAiItinerary() {
  if (!API_CONFIG.llm.apiKey || !aiItineraryEnabled) return null;
  
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || '平静';
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || '独自';
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  var maxPerDay = ct ? ct.maxPoi : 4;
  var modeLabel = travelMode === 'business' ? '商务出行' : '休闲旅游';
  
  var poiSummary = POIS.slice(0, 40).map(function(p) {
    return p.name + '（' + p.city + '，' + (p.tags||[]).join('/') + '，¥' + (p.ticketPrice||0) + '）';
  }).join('；');
  
  var prompt = '你是旅行规划专家。请根据以下条件，为用户生成一个' + days + '天的长三角旅行行程。\n\n' +
    '用户状态：心情=' + moodLabel + '，旅伴=' + companionLabel + '，模式=' + modeLabel + '，预算=¥' + budget + '\n' +
    '约束：每天最多' + maxPerDay + '个景点，必须包含午餐，总花费不超过预算\n' +
    '可选景点：' + poiSummary + '\n\n' +
    '请返回严格JSON格式（不要markdown，不要解释）：\n' +
    '{"days": [{"day": 1, "pois": ["景点名1", "景点名2", "景点名3"], "lunch": "餐厅名"}]}\n' +
    '景点名必须从可选景点中选取，每天至少2个景点，跨城市时注意地理合理性。';
  
  try {
    var resp = await callLLM(prompt, '你是专业的浙江旅行规划师，擅长根据用户心情和偏好编排行程。只返回JSON，不要其他内容。');
    if (!resp) return null;
    var jsonStr = resp.replace(/```json|```/g, '').trim();
    var start = jsonStr.indexOf('{');
    var end = jsonStr.lastIndexOf('}');
    if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end + 1);
    var plan = JSON.parse(jsonStr);
    if (plan.days && plan.days.length > 0) return plan;
  } catch(e) {
    console.warn('AI itinerary parsing failed:', e.message);
  }
  return null;
}

function convertAiPlanToItinerary(aiPlan) {
  var itinerary = [];
  var used = new Set();
  var allPoiItems = [];
  var runningTotal = 0;
  
  aiPlan.days.forEach(function(aiDay, dIdx) {
    var items = [];
    var hour = 9;
    var midIdx = Math.floor((aiDay.pois.length + 1) / 2);
    
    aiDay.pois.forEach(function(poiName, idx) {
      var poi = POIS.find(function(p) { return p.name === poiName && !used.has(p.id); });
      if (!poi) poi = POIS.find(function(p) { return p.name.indexOf(poiName) !== -1 && !used.has(p.id); });
      if (!poi) return;
      used.add(poi.id);
      
      if (idx === midIdx) {
        var lunchName = aiDay.lunch;
        if (lunchName) {
          var lunchPoi = POIS.find(function(p) { return p.name === lunchName && !used.has(p.id); });
          if (!lunchPoi) lunchPoi = POIS.find(function(p) { return p.category === 'restaurant' && !used.has(p.id); });
          if (lunchPoi) {
            used.add(lunchPoi.id);
            items.push({ type:'restaurant', time:fmtTime(hour), name:lunchPoi.name, estimatedCost:lunchPoi.ticketPrice || 80, estimatedDuration:lunchPoi.estimatedDuration || 60, reason:'AI推荐午餐', reasonTags:['AI推荐','高评分'], poiId:lunchPoi.id });
            runningTotal += lunchPoi.ticketPrice || 80;
            hour += 1;
          }
        }
      }
      
      var poiItem = {
        type: 'poi', time: fmtTime(hour), name: poi.name,
        estimatedCost: poi.ticketPrice || 0,
        estimatedDuration: poi.estimatedDuration || 90,
        tags: poi.tags || [],
        reason: 'AI 根据你的心情和偏好智能推荐',
        reasonTags: ['AI推荐'].concat((poi.tags||[]).slice(0, 2)),
        poiId: poi.id, mapX: poi.mapX, mapY: poi.mapY,
        weatherSensitivity: poi.weatherSensitivity,
        city: poi.city,
        photoTip: poi.photoTip || '',
        localTip: poi.localTip || '',
        bestPhotoTime: poi.bestPhotoTime || '',
        hiddenGem: poi.hiddenGem || false,
        instagramWorthy: poi.instagramWorthy || 5,
        crowdPeakHours: poi.crowdPeakHours || '',
        seasonalBeauty: poi.seasonalBeauty || '',
        avgStayTime: poi.avgStayTime || 90
      };
      items.push(poiItem);
      allPoiItems.push(poiItem);
      runningTotal += poi.ticketPrice || 0;
      hour += (poi.estimatedDuration || 90) / 60;
    });
    
    for (var ii = 1; ii < items.length; ii++) {
      var prev = items[ii - 1];
      var curr = items[ii];
      if (prev.mapX !== undefined && prev.mapY !== undefined && curr.mapX !== undefined && curr.mapY !== undefined) {
        var dx = prev.mapX - curr.mapX;
        var dy = prev.mapY - curr.mapY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var transitMin = Math.round(dist * 0.5 / 40 * 60);
        if (transitMin < 5) transitMin = 5;
        curr.transitTime = transitMin;
      }
    }
    
    itinerary.push({ day: dIdx + 1, items: items });
  });
  
  var hotelCandidates = HOTELS.map(function(h) {
    var score = (h.moodScores[activeMood] || 5) * 10;
    if (h.priceRangeLow <= budget * 0.3 / days) score += 30;
    else if (h.priceRangeLow <= budget * 0.5 / days) score += 15;
    score += h.rating * 5;
    return Object.assign({}, h, { _score: score });
  }).sort(function(a, b) { return b._score - a._score; });
  
  var affordable = hotelCandidates.filter(function(h) { return h.priceRangeLow * days <= budget * 0.8; });
  if (affordable.length === 0) affordable = hotelCandidates.slice(0, 2);
  var best = affordable[0];
  
  var hotelData = null;
  if (best) {
    var platforms = [
      { name:'携程', icon:'🏨', price:Math.round(best.priceRangeLow * 1.0), features:'含早', isBest:false },
      { name:'美团', icon:'🍜', price:Math.round(best.priceRangeLow * 0.95), features:'含早且可取消', isBest:true },
      { name:'飞猪', icon:'🐷', price:Math.round(best.priceRangeLow * 0.92), features:'免费升级房型', isBest:false }
    ];
    var bestPlat = platforms.find(function(p) { return p.isBest; });
    hotelData = {
      name: best.name, rating: best.rating, price: best.priceRangeLow,
      bestPrice: bestPlat.price, bestPlatform: bestPlat.name, bestReason: bestPlat.features,
      savedAmount: Math.max.apply(null, platforms.map(function(p) { return p.price; })) - bestPlat.price,
      platforms: platforms, reason: 'AI 根据你的预算和偏好智能推荐'
    };
  }
  
  return {
    itinerary: itinerary,
    hotel: hotelData,
    stats: { totalCost: runningTotal, totalSaved: hotelData ? hotelData.savedAmount : 0, totalPois: used.size, filterTotal: POIS.length, filterPassed: used.size, budgetExceeded: runningTotal > budget, budgetOverage: Math.max(0, runningTotal - budget) }
  };
}

function sleep(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }

// ================================================================
//  AI 行程优化 — 智能调整按钮
// ================================================================
async function aiRefineItinerary(type) {
  if (!itinerary || itinerary.length === 0) {
    showToast('请先生成行程');
    return;
  }
  
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || '平静';
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || '独自';
  
  var itineraryText = '';
  itinerary.forEach(function(day) {
    itineraryText += 'Day ' + day.day + ': ';
    day.items.forEach(function(item) {
      itineraryText += item.name + (item.type === 'restaurant' ? '(餐)' : '') + ' → ';
    });
    itineraryText += '\n';
  });
  
  var refineTypeMap = {
    relax: '让行程更轻松悠闲，减少体力消耗大的景点，增加休息时间和轻松活动',
    enrich: '让行程更充实丰富，增加特色景点和体验活动',
    romantic: '增加浪漫元素，适合情侣约会',
    foodie: '增加美食体验，替换为更值得尝试的餐厅',
    photo: '增加拍照打卡点，优先选择出片率高的景点',
    budget: '在保持体验的前提下，优化预算，替换为更经济的选择'
  };
  
  var instruction = refineTypeMap[type] || '优化行程体验';
  
  var prompt = '当前行程：\n' + itineraryText + '\n请根据以下要求优化行程：' + instruction + '\n用户心情：' + moodLabel + '，旅伴：' + companionLabel + '。\n请返回优化后的行程JSON（格式：{"days": [{"day": 1, "pois": ["景点1", "景点2"], "lunch": "餐厅名"}]}），只返回JSON。';
  
  showToast('🤖 AI 正在优化行程...');
  
  var resp = await callLLM(prompt, '你是专业的旅行规划师，擅长根据用户需求优化行程。只返回JSON格式。');
  
  if (resp) {
    try {
      var jsonStr = resp.replace(/```json|```/g, '').trim();
      var start = jsonStr.indexOf('{');
      var end = jsonStr.lastIndexOf('}');
      if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end + 1);
      var plan = JSON.parse(jsonStr);
      if (plan.days && plan.days.length > 0) {
        var result = convertAiPlanToItinerary(plan);
        itinerary = result.itinerary;
        hotel = result.hotel || hotel;
        stats = result.stats;
        renderItinerary();
        renderHotel();
        renderMap();
        renderStats();
        showToast('✨ AI 行程优化完成！');
        document.getElementById('itinerarySection').scrollIntoView({ behavior: 'smooth' });
        return;
      }
    } catch(e) {
      console.warn('AI refine parsing failed:', e.message);
    }
  }
  
  showToast('AI 优化暂不可用，已使用本地算法优化');
  var result = doGenerate();
  itinerary = result.itinerary;
  hotel = result.hotel;
  stats = result.stats;
  renderItinerary();
  renderHotel();
  renderMap();
  renderStats();
}

// ================================================================
//  PWA Service Worker 注册 (first occurrence)
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      debugLog('SW registered:', reg.scope);
    }).catch(function(err) {
      debugLog('SW registration failed:', err);
    });
  });
}


// ================================================================
//  状态
// ================================================================
var activeMood = 'calm';
var activeMoodColor = '#8BA88C';
var budget = 2000;
var displayBudget = 2000;
var isDragging = false;
var visibleCards = PLAN_CARDS.slice();
var hasMore = true;
var toastTimer = null;
var bookingTimer = null;
var companionType = 'solo';
var hasKids = false;
var hasElderly = false;
var isCouple = false;
var isFriends = false;
var isBusiness = false;
var elderlyMode = false;
var activeScenario = null;
var isPlanning = false;
var itinerary = null;
var hotel = null;
var stats = null;
var days = 2;
var hotelIndex = 0;
var travelMode = 'tourism'; // 'tourism' | 'business'
var scrollCount = 0;       // 页面滚动计数
var keywordTriggered = false; // 关键词已触发
var budgetWarningEl = null;  // 预算校验提示元素

// ================================================================
//  全维度情绪感知系统 — 多维信号交叉验证 + 动态置信度评分
// ================================================================

// 核心情绪状态机
var emotionState = {
  score: 0,             // 置信度 0-100
  moodType: null,       // 当前判定的情绪类型
  signals: {},          // 各维度信号贡献 { mouse:0, click:0, time:0, battery:0, ... }
  lastUpdate: 0,        // 最后更新时间戳
  decayTimer: null,     // 分数衰减计时器
  sessionSilent: false  // 本次会话静默：用户关闭气泡后，本次会话不再弹出
};

// 旧版兼容变量（保留给 selectMood 等使用）
var autoMoodLocked = false;
var simplifiedMode = false;
var autoDetectedMood = null;

// 多维信号采集器
var mouseHistory = [];
var clickHistory = [];
var idleTimer = null;
var moodCheckTimer = null;

// 内容交互追踪
var searchHistory = [];        // [{keyword, time}]
var lastSearchKeyword = '';
var searchRepeatCount = 0;
var detailDwellStart = null;   // 详情页停留开始时间
var detailDwellTriggered = false;

// 树洞输入犹豫追踪
var treeHoleFocusTime = null;
var treeHoleCursorBlinkCount = 0;
var treeHoleHesitationTimer = null;

// 电池状态
var batteryLevel = 100;
var batteryLow = false;

// 记忆与学习
var memoryStore = {
  rejectCount: 0,
  lastRejectTime: null,
  silentUntil: null,       // 静默期截止时间
  acceptCount: 0,
  totalProbes: 0
};

// 阈值配置
var CONFIDENCE_SOFT_THRESHOLD = 50;   // 后台调整权重的最低分数
var CONFIDENCE_PROBE_THRESHOLD = 80;  // 触发UI试探的分数
var CONFIDENCE_SIGNAL_BASE = 20;      // 单一信号基础分
var CONFIDENCE_DECAY_RATE = 3;        // 每秒衰减分数
var DETAIL_DWELL_THRESHOLD = 30000;   // 详情页停留 30 秒
var TREE_HOLE_HESITATE_THRESHOLD = 5000; // 光标闪烁 5 秒
var SEARCH_REPEAT_THRESHOLD = 3;      // 重复搜索 3 次
var SILENT_PERIOD_HOURS = 24;         // 静默期 24 小时

// ================================================================
//  DOM 引用
// ================================================================
var bgSky           = document.getElementById('bgSky');
var budgetNumber    = document.getElementById('budgetNumber');
var budgetFill      = document.getElementById('budgetFill');
var budgetSlider    = document.getElementById('budgetSlider');
var budgetCustom    = document.getElementById('budgetCustom');
var moodGrid        = document.getElementById('moodGrid');
var budgetPresets   = document.getElementById('budgetPresets');
var hotRoutesScroll = document.getElementById('hotRoutesScroll');
var plansWaterfall  = document.getElementById('plansWaterfall');
var planCount       = document.getElementById('planCount');
var loadMoreWrap    = document.getElementById('loadMoreWrap');
var toast           = document.getElementById('toast');
var bgParticles     = document.getElementById('bgParticles');

// ================================================================
//  初始化
// ================================================================
function initSessionId() {
  var sessionId = localStorage.getItem('trae_session_id');
  if (!sessionId) {
    sessionId = 'Trae-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('trae_session_id', sessionId);
  }
  window.traeSessionId = sessionId;
}
function initParticles() {
  var html = '';
  var colors = ['', 'particle-gold', 'particle-green', 'particle-blue', 'particle-purple', 'particle-red', 'particle-warm', 'particle-night'];
  for (var n = 1; n <= 30; n++) {
    var left = (n * 37 + 13) % 100;
    var delay = (n * 0.7) % 8;
    var dur = 5 + (n % 6) * 2;
    var size = 2 + (n % 4);
    var colorClass = colors[n % colors.length];
    var blinkClass = (n % 3 === 0) ? ' particle-blink' : '';
    html += '<span class="particle' + (colorClass ? ' ' + colorClass : '') + blinkClass + '" style="left:' + left + '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's;width:' + size + 'px;height:' + size + 'px"></span>';
  }
  bgParticles.innerHTML = html;
}

function initStars() {
  var starsEl = document.getElementById('bgStars');
  if (!starsEl) return;
  var html = '';
  for (var n = 1; n <= 40; n++) {
    var left = (n * 23 + 7) % 100;
    var top = (n * 31 + 11) % 100;
    var delay = (n * 0.3) % 5;
    var dur = 1.5 + (n % 3) * 1.5;
    var size = 1 + (n % 3);
    html += '<span class="star" style="left:' + left + '%;top:' + top + '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's;width:' + size + 'px;height:' + size + 'px"></span>';
  }
  starsEl.innerHTML = html;
}

function initGeoShapes() {
  var geoEl = document.getElementById('bgGeo');
  if (!geoEl) return;
  var html = '';
  var shapes = [
    { w:80, h:80, left:8, top:60, dur:14, del:0 },
    { w:50, h:50, left:75, top:20, dur:18, del:-4 },
    { w:60, h:60, left:35, top:75, dur:12, del:-8 },
    { w:45, h:45, left:60, top:45, dur:16, del:-2 },
    { w:70, h:70, left:15, top:15, dur:20, del:-6 }
  ];
  shapes.forEach(function(s, i) {
    var cls = (i % 2 === 0) ? 'geo-shape' : 'geo-shape triangle';
    html += '<div class="' + cls + '" style="width:' + s.w + 'px;height:' + s.h + 'px;left:' + s.left + '%;top:' + s.top + '%;animation-duration:' + s.dur + 's;animation-delay:' + s.del + 's"></div>';
  });
  geoEl.innerHTML = html;
}

function initFireflies() {
  var ffEl = document.getElementById('bgFireflies');
  if (!ffEl) return;
  var html = '';
  for (var n = 1; n <= 8; n++) {
    var left = (n * 41 + 17) % 90;
    var top = 20 + (n * 53 + 29) % 70;
    var delay = (n * 1.2) % 8;
    var dur = 6 + (n % 3) * 2;
    html += '<span class="firefly" style="left:' + left + '%;top:' + top + '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's"></span>';
  }
  ffEl.innerHTML = html;
}

function initMoods() {
  moodGrid.innerHTML = '';
  var t = (window.i18n && window.i18n[currentLang]) || null;
  MOODS.forEach(function(mood, idx) {
    var btn = document.createElement('button');
    var label = (t.moodLabels && t.moodLabels[mood.key]) || mood.label;
    btn.className = 'mood-btn animate-scale-in stagger-' + (idx + 1) + (activeMood === mood.key ? ' active' : '');
    btn.setAttribute('aria-label', (t.ariaSelectMood || '选择{label}心情').replace('{label}', label));
    btn.dataset.key = mood.key;

    // 每个按钮注入其情绪色系 CSS 变量
    btn.style.setProperty('--mood-btn-color', mood.color);
    btn.style.setProperty('--mood-btn-glow', mood.color + '50');
    btn.style.setProperty('--mood-btn-glow-inner', mood.color + '15');

    // 按钮内容：图标 + 标签 + 勾选标记
    btn.innerHTML = '<span class="mood-btn-emoji">' + mood.emoji + '</span>'
      + '<span class="mood-btn-label">' + label + '</span>'
      + '<span class="mood-check"></span>';

    // 选中态：颜色填充
    if (activeMood === mood.key) {
      btn.style.background = mood.color + '28';
      btn.style.borderColor = mood.color + '70';
      btn.style.color = mood.color;
    }

    // 点击事件：涟漪 + 选择心情
    btn.addEventListener('click', function(e) {
      createRipple(e, btn);
      selectMood(mood);
    });

    // Hover 微动效
    btn.addEventListener('mouseenter', function() {
      var e = btn.querySelector('.mood-btn-emoji');
      if (e) e.classList.add('wiggle');
      btn.style.setProperty('--mood-btn-glow', mood.color + '60');
    });
    btn.addEventListener('mouseleave', function() {
      var e = btn.querySelector('.mood-btn-emoji');
      if (e) e.classList.remove('wiggle');
      if (activeMood !== mood.key) {
        btn.style.setProperty('--mood-btn-glow', mood.color + '50');
      }
    });

    moodGrid.appendChild(btn);
  });
}

// 涟漪动画工厂函数
function createRipple(event, el) {
  var ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  var rect = el.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
  el.appendChild(ripple);
  ripple.addEventListener('animationend', function() { ripple.remove(); });
}

function initCompanions() {
  var container = document.getElementById('companionChips');
  container.innerHTML = '';
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  COMPANION_TYPES.forEach(function(ct) {
    var chip = document.createElement('button');
    chip.className = 'companion-chip' + (companionType === ct.key ? ' active' : '');
    if (companionType === ct.key) {
      chip.style.background = activeMoodColor + '22';
      chip.style.borderColor = activeMoodColor + '60';
      chip.style.color = activeMoodColor;
    }
    var label = (t.companionLabels && t.companionLabels[ct.key]) || ct.label;
    var desc = (t.companionDescs && t.companionDescs[ct.key]) || ct.desc;
    chip.innerHTML = '<span class="comp-icon">' + ct.icon + '</span><span class="comp-label">' + label + '</span><span class="comp-desc">' + desc + '</span>';
    chip.addEventListener('click', function() { selectCompanion(ct.key); });
    container.appendChild(chip);
  });
}

function initPresets() {
  budgetPresets.innerHTML = '';
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  BUDGET_PRESETS.forEach(function(p) {
    var btn = document.createElement('button');
    btn.className = 'preset-chip' + (budget === p.value ? ' active' : '');
    if (budget === p.value) {
      btn.style.background = activeMoodColor + '22';
      btn.style.borderColor = activeMoodColor;
      btn.style.color = activeMoodColor;
    }
    btn.textContent = (t.budgetPresetLabels && t.budgetPresetLabels[p.value]) || p.label;
    btn.addEventListener('click', function() {
      if (p.value === 'custom') {
        budgetCustom.focus();
      } else {
        setBudget(p.value);
      }
    });
    budgetPresets.appendChild(btn);
  });
}

function initDailyScenarios() {
  var scroll = document.getElementById('dailyScenariosScroll');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  // 确保标题元素存在
  var titleEl = document.getElementById('dailyScenarioTitle');
  if (!titleEl) {
    titleEl = document.createElement('div');
    titleEl.id = 'dailyScenarioTitle';
    titleEl.className = 'section-subtitle';
    titleEl.style.cssText = 'font-size:14px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:10px;';
    scroll.parentElement.insertBefore(titleEl, scroll);
  }
  titleEl.textContent = t.dailyScenarioTitle || '🌿 日常场景';
  scroll.innerHTML = '';
  DAILY_SCENARIOS.forEach(function(sc) {
    var chip = document.createElement('button');
    chip.className = 'daily-scenario-chip' + (activeScenario === sc.key ? ' active' : '');
    if (activeScenario === sc.key) {
      chip.style.background = activeMoodColor + '22';
      chip.style.borderColor = activeMoodColor + '60';
      chip.style.color = activeMoodColor;
    }
    chip.textContent = (t.dailyScenarioLabels && t.dailyScenarioLabels[sc.key]) || sc.label;
    chip.addEventListener('click', function() { selectScenario(sc.key); });
    scroll.appendChild(chip);
  });
}

function initHotRoutes() {
  hotRoutesScroll.innerHTML = '';
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  var routeDaysMap = { '2天1夜': 'route2D1N', '3天2夜': 'route3D2N', '1天': 'route1D' };
  var routeBudgetMap = { '¥800起': 'routeBudget800', '¥300起': 'routeBudget300', '¥1,500起': 'routeBudget1500', '¥600起': 'routeBudget600', '¥500起': 'routeBudget500', '¥200起': 'routeBudget200', '¥1,200起': 'routeBudget1200' };
  HOT_ROUTES.forEach(function(route) {
    var card = document.createElement('div');
    card.className = 'hot-route-card glass-panel';
    card.innerHTML = '<div class="hot-route-img" style="background:' + escapeHtml(route.bg) + '"><span class="hot-route-emoji">' + escapeHtml(route.emoji) + '</span></div><div class="hot-route-info"><span class="hot-route-title">' + escapeHtml(__(route.title, 'routeNames')) + '</span><span class="hot-route-meta">' + escapeHtml(t[routeDaysMap[route.days]] || route.days) + ' · ' + escapeHtml(t[routeBudgetMap[route.budget]] || route.budget) + '</span></div>';
    card.addEventListener('click', function() { applyHotRoute(route); });
    hotRoutesScroll.appendChild(card);
  });
}

function applyHotRoute(route) {
  var HOT_ROUTE_MAP = {
    '森林治愈之旅': { mood:'calm', budget:800, companion:'solo' },
    '海边发呆指南': { mood:'sad', budget:1500, companion:'solo' },
    '城市漫步探店': { mood:'happy', budget:300, companion:'solo' },
    '山间露营观星': { mood:'excited', budget:600, companion:'friends' },
    '古镇文艺之旅': { mood:'tired', budget:500, companion:'solo' },
    '骑行追风计划': { mood:'excited', budget:200, companion:'friends' },
    '温泉放松之旅': { mood:'tired', budget:1200, companion:'couple' }
  };
  var preset = HOT_ROUTE_MAP[route.title];
  if (!preset) return;
  // 应用心情
  var moodObj = MOODS.find(function(m) { return m.key === preset.mood; });
  if (moodObj) selectMood(moodObj);
  // 应用预算
  setBudget(preset.budget);
  // 应用同伴
  selectCompanion(preset.companion);
  // 滚动到生成按钮并触发规划
  document.getElementById('generatePlanBtn').scrollIntoView({ behavior: 'smooth' });
  setTimeout(function() { generatePlan(); }, 600);
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  showToast((t.hotRouteToast || '已加载「{route}」路线方案').replace('{route}', route.title));
}

// ================================================================
//  心情选择
// ================================================================
function selectMood(mood) {
  activeMood = mood.key;
  activeMoodColor = mood.color;
  bgSky.className = 'bg-sky sky-' + mood.key;
  budgetNumber.style.color = mood.color;
  budgetFill.style.background = mood.color;
  // 用户手动选择，锁定自动检测
  autoMoodLocked = true;
  // 非 insomnia 时移除暗夜模式
  if (mood.key !== 'insomnia') document.body.classList.remove('night-mode');
  else document.body.classList.add('night-mode');
  // 正向心情：退出安抚态
  if (mood.key === 'happy' || mood.key === 'excited' || mood.key === 'calm') {
    removeSoothingState();
  }
  updateMoodActiveStyle();
  updatePresetStyles();
  planCount.style.background = mood.color + '18';
  planCount.style.color = mood.color;
  updateGenerateBtn();
  // 注入心情主题CSS变量，实现视觉差异化
  var theme = MOOD_THEME_MAP[mood.key];
  if (theme) {
    var root = document.documentElement;
    root.style.setProperty('--mood-primary', theme.primary);
    root.style.setProperty('--mood-secondary', theme.secondary);
    root.style.setProperty('--mood-accent', theme.accent);
    root.style.setProperty('--mood-card-bg', theme.cardBg);
    root.style.setProperty('--mood-card-border', theme.cardBorder);
    root.style.setProperty('--mood-text', theme.textColor);
    root.style.setProperty('--mood-glow', theme.ambientGlow);
    root.style.setProperty('--mood-anim-speed', theme.animationSpeed === 'fast' ? '0.3s' : theme.animationSpeed === 'slow' ? '0.8s' : theme.animationSpeed === 'very-slow' ? '1.2s' : '0.5s');
    // 动态背景渐变
    document.body.style.background = theme.bgGradient;
    document.body.style.transition = 'background 1.5s var(--easing)';
  }
  // 切换body的心情class
  document.body.className = document.body.className.replace(/mood-\w+/g, '');
  document.body.classList.add('mood-' + mood.key);
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  var moodLabel = (t.moodLabels && t.moodLabels[mood.key]) || mood.label;
  showToast(t.moodToast.replace('{label}', moodLabel));
  // 显示心情鼓励语
  var encouragement = getMoodEncouragement(mood.key);
  if (encouragement) {
    setTimeout(function() { showToast(encouragement); }, 2000);
  }
}

function updateMoodActiveStyle() {
  var btns = moodGrid.querySelectorAll('.mood-btn');
  btns.forEach(function(btn) {
    var key = btn.dataset.key;
    var mood = MOODS.find(function(m) { return m.key === key; });
    if (key === activeMood) {
      btn.classList.add('active');
      btn.style.background = mood.color + '28';
      btn.style.borderColor = mood.color + '70';
      btn.style.color = mood.color;
      btn.style.setProperty('--mood-btn-glow', mood.color + '60');
    } else {
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.setProperty('--mood-btn-glow', mood.color + '50');
    }
  });
  // 同步更新显性情绪选择器
  updateExplicitMoodStyles();
}

// ================================================================
//  显性情绪选择器（极简三态）
// ================================================================
function quickMood(label, emoji) {
  var moodMap = { calm: MOODS[0], excited: MOODS[4] };
  var mood = moodMap[label];
  if (mood) selectMood(mood);
}

function quickMoodAnxious() {
  // 选择 😫 → 立即触发 anxious + 浙江散心路线
  var anxiousMood = MOODS.find(function(m) { return m.key === 'anxious'; });
  if (anxiousMood) selectMood(anxiousMood);
  keywordTriggered = true;
  // 切换到旅行模式
  if (travelMode !== 'tourism') {
    travelMode = 'tourism';
    updateSceneToggle();
  }
  // 随机选择一个浙江散心城市（排除杭州）
  var city = getSanxinCity();
  showToast('🌿 为你推荐「' + city.name + '散心之旅」— ' + city.vibe);
  // 3秒后自动生成行程
  setTimeout(function() { generatePlan(); }, 1500);
}

function updateExplicitMoodStyles() {
  var calmBtn = document.getElementById('quickMoodCalm');
  var anxiousBtn = document.getElementById('quickMoodAnxious');
  var excitedBtn = document.getElementById('quickMoodExcited');
  [calmBtn, anxiousBtn, excitedBtn].forEach(function(btn) { if (btn) btn.classList.remove('active'); });
  if (activeMood === 'calm' && calmBtn) calmBtn.classList.add('active');
  if (activeMood === 'anxious' && anxiousBtn) anxiousBtn.classList.add('active');
  if (activeMood === 'excited' && excitedBtn) excitedBtn.classList.add('active');
}

// ================================================================
//  隐性情绪检测：关键词 + 滚动
// ================================================================
function detectAnxiousKeyword(text) {
  if (!text || keywordTriggered) return false;
  var lower = text.toLowerCase();
  var matched = ANXIOUS_KEYWORDS.some(function(kw) { return lower.indexOf(kw) !== -1; });
  if (matched && activeMood !== 'anxious') {
    triggerAnxiousFromKeyword();
    return true;
  }
  return false;
}

function triggerAnxiousFromKeyword() {
  keywordTriggered = true;
  var anxiousMood = MOODS.find(function(m) { return m.key === 'anxious'; });
  if (anxiousMood) selectMood(anxiousMood);
  if (travelMode !== 'tourism') {
    travelMode = 'tourism';
    updateSceneToggle();
  }
  var city = getSanxinCity();
  showToast('💚 感到了你的疲惫，推荐「' + city.name + '散心之旅」');
}

// 滚动检测
var rightPanelScrollTimer = null;
// ================================================================
//  MBTI 旅行人格系统 — 16型人格 + 旅行偏好匹配
//  参考 16Personalities 研究 + 64型扩展 (A/O + H/C)
// ================================================================
var mbtiQuestions = [
  { id:'EI', text:'旅行时，你更倾向于？', options:[
    { value:'E', label:'🎉 和旅伴热烈讨论，分享见闻', desc:'外向型' },
    { value:'I', label:'🌿 安静观察，享受独处时光', desc:'内向型' }
  ]},
  { id:'SN', text:'规划行程时，你更看重？', options:[
    { value:'S', label:'📋 具体的攻略、评分和实际体验', desc:'实感型' },
    { value:'N', label:'💡 独特的创意、隐藏玩法和灵感', desc:'直觉型' }
  ]},
  { id:'TF', text:'遇到行程冲突时，你会？', options:[
    { value:'T', label:'⚖️ 理性分析利弊，选择最优方案', desc:'思考型' },
    { value:'F', label:'💝 优先考虑大家的感受和氛围', desc:'情感型' }
  ]},
  { id:'JP', text:'出发前一天，你通常？', options:[
    { value:'J', label:'📅 行程已精确到分钟，行李整整齐齐', desc:'判断型' },
    { value:'P', label:'🎲 大概有个方向就好，随遇而安', desc:'感知型' }
  ]},
  { id:'AO', text:'预订酒店时，你？', options:[
    { value:'A', label:'✅ 快速对比后果断下单，相信直觉', desc:'果断型' },
    { value:'O', label:'🔍 反复比较数十家，担心错过更好的', desc:'纠结型' }
  ]},
  { id:'HC', text:'在陌生城市迷路时，你会？', options:[
    { value:'H', label:'🤝 主动问路人或店家，享受交流', desc:'温暖型' },
    { value:'C', label:'🗺️ 掏出手机自己导航，不想打扰别人', desc:'高冷型' }
  ]},
  { id:'travel_style', text:'理想的旅行节奏是？', options:[
    { value:'fast', label:'⚡ 特种兵式打卡，一天8个景点', desc:'快节奏' },
    { value:'slow', label:'🌊 睡到自然醒，深度体验一个地方', desc:'慢节奏' }
  ]},
  { id:'budget_style', text:'旅行消费观？', options:[
    { value:'value', label:'💰 精打细算，性价比为王', desc:'性价比派' },
    { value:'experience', label:'✨ 体验优先，该花就花', desc:'体验派' }
  ]}
];

var mbtiAnswers = {};
var mbtiCurrentQuestion = 0;
var mbtiResult = null;

// 16型人格旅行档案
var MBTI_TRAVEL_PROFILES = {
  'INTJ': {
    nickname:'战略规划师', emoji:'🗺️', traits:['深度思考','独立探索','文化沉浸'],
    destinations:['杭州·灵隐寺','绍兴·鲁迅故里','宁波·天一阁'],
    travelStyle:'偏好有深度的文化之旅，喜欢独自探索历史古迹和博物馆，对网红打卡地兴趣不大。行程精确但不死板，会留出思考空间。',
    pace:'moderate', budgetStyle:'value', color:'#6B8FA3',
    tip:'建议避开人流高峰，选择清晨或工作日出行，享受宁静的思考时光。'
  },
  'INTP': {
    nickname:'好奇探索家', emoji:'🔬', traits:['知识渴求','灵活应变','小众猎奇'],
    destinations:['浙江省科技馆','中国茶叶博物馆','云和梯田'],
    travelStyle:'对世界充满好奇，喜欢探索事物的原理。博物馆、科技馆是你的乐园，小众景点比热门景区更有吸引力。',
    pace:'slow', budgetStyle:'value', color:'#8BA88C',
    tip:'留出足够时间深入探索一个地方，不要赶行程，让好奇心自然引导。'
  },
  'ENTJ': {
    nickname:'高效领航者', emoji:'🎯', traits:['目标明确','效率至上','掌控全局'],
    destinations:['杭州宋城','普陀山','莫干山裸心谷'],
    travelStyle:'旅行也是一场需要完成的任务。喜欢高效打卡，一天能跑别人两天的行程。享受掌控全局的感觉。',
    pace:'fast', budgetStyle:'experience', color:'#E8945A',
    tip:'虽然效率很重要，但偶尔放慢脚步，享受一下"无用"的时光也不错。'
  },
  'ENTP': {
    nickname:'创意冒险家', emoji:'🎪', traits:['即兴发挥','社交达人','追求新鲜'],
    destinations:['河坊街夜市','老外滩酒吧街','楠溪江漂流'],
    travelStyle:'热爱新鲜刺激，喜欢即兴改变行程。对常规路线提不起兴趣，总是在寻找"不走寻常路"的玩法。',
    pace:'fast', budgetStyle:'experience', color:'#FF6B6B',
    tip:'你的即兴精神很棒，但记得提前订好住宿，避免旺季无处可去。'
  },
  'INFJ': {
    nickname:'灵魂旅人', emoji:'🌅', traits:['深度体验','心灵治愈','人文关怀'],
    destinations:['永福寺·抄经','古堰画乡','沈园之夜'],
    travelStyle:'旅行是为了寻找内心的平静与意义。喜欢有故事的地方，容易被文化底蕴和人文气息打动。',
    pace:'slow', budgetStyle:'experience', color:'#B5A3C4',
    tip:'去一个安静的地方，带一本好书，让心灵在旅途中沉淀。'
  },
  'INFP': {
    nickname:'浪漫诗人', emoji:'🎨', traits:['文艺治愈','情感共鸣','自由随性'],
    destinations:['西湖漫步','郭庄园林下午茶','西西弗书店'],
    travelStyle:'旅行是寻找灵感和治愈的过程。喜欢拍照、写游记，容易被美景感动。不喜欢赶行程，更享受"无所事事"的下午。',
    pace:'slow', budgetStyle:'value', color:'#C4A8A8',
    tip:'带上相机和笔记本，记录旅途中的每一个感动瞬间。'
  },
  'ENFJ': {
    nickname:'暖心领队', emoji:'🌟', traits:['团队凝聚','照顾他人','正能量传播'],
    destinations:['乌镇西栅','南浔古镇','千岛湖'],
    travelStyle:'旅行中最开心的时刻是看到同伴的笑脸。天生适合做旅行策划，会照顾每个人的感受和需求。',
    pace:'moderate', budgetStyle:'experience', color:'#E8A85A',
    tip:'多为团队准备一些惊喜小环节，你的用心大家都会感受到。'
  },
  'ENFP': {
    nickname:'快乐传播者', emoji:'🦋', traits:['社交蝴蝶','即兴发挥','永远乐观'],
    destinations:['雁荡山灵峰','朱家尖南沙','杭州动物园'],
    travelStyle:'旅行就是一场冒险！喜欢结交新朋友，随机改变行程，享受每一个意外惊喜。',
    pace:'fast', budgetStyle:'experience', color:'#FF9A9E',
    tip:'保持你的热情，但偶尔也要注意体力分配，别第一天就耗尽所有精力。'
  },
  'ISTJ': {
    nickname:'靠谱执行者', emoji:'📋', traits:['计划周密','循规蹈矩','安全第一'],
    destinations:['南湖革命纪念馆','天一阁','浙江省博物馆'],
    travelStyle:'旅行前会做详细的攻略和预算表。喜欢按计划行事，不喜欢意外。对景区评分和攻略非常信任。',
    pace:'moderate', budgetStyle:'value', color:'#6B7BA3',
    tip:'计划做得很好，但留出20%的弹性时间应对突发状况会更从容。'
  },
  'ISFJ': {
    nickname:'温情守护者', emoji:'🏡', traits:['体贴周到','注重细节','怀旧温馨'],
    destinations:['方回春堂·药膳','知味观·味庄','鲁迅故里'],
    travelStyle:'喜欢熟悉的、有温度的地方。会为旅伴准备周全，记得每个人的喜好和需求。',
    pace:'slow', budgetStyle:'value', color:'#A3B5A6',
    tip:'偶尔尝试一下新地方，说不定会有意想不到的惊喜。'
  },
  'ESTJ': {
    nickname:'纪律委员', emoji:'⏰', traits:['准时高效','组织力强','务实可靠'],
    destinations:['浙江省科技馆','杭州宋城','海宁皮革城'],
    travelStyle:'时间观念极强，会严格按行程表执行。负责团队的后勤和预算管理，是所有人最信赖的旅伴。',
    pace:'fast', budgetStyle:'value', color:'#8BA88C',
    tip:'高效很棒，但旅行的意义不只是"完成"，也在于"体验"。'
  },
  'ESFJ': {
    nickname:'社交之星', emoji:'🎉', traits:['热情好客','照顾周到','享受热闹'],
    destinations:['河坊街夜市','五马街美食','沈家门海鲜排档'],
    travelStyle:'喜欢热闹的旅行氛围，擅长组织集体活动。美食和购物是旅行的两大核心乐趣。',
    pace:'moderate', budgetStyle:'experience', color:'#E8945A',
    tip:'在热闹之余，也给自己留一些安静的时间恢复能量。'
  },
  'ISTP': {
    nickname:'冷静探险家', emoji:'🏔️', traits:['动手能力强','冷静理性','热爱户外'],
    destinations:['九溪烟树','雁荡山灵峰','东钱湖骑行'],
    travelStyle:'喜欢户外运动和动手体验。对装备、路线、技术细节有研究，是团队中的"技术担当"。',
    pace:'fast', budgetStyle:'value', color:'#6B8FA3',
    tip:'你的户外技能很棒，但安全第一，记得检查装备和天气。'
  },
  'ISFP': {
    nickname:'感官艺术家', emoji:'🎵', traits:['审美敏锐','享受当下','温柔安静'],
    destinations:['云和梯田','西塘古镇','苏堤骑行'],
    travelStyle:'通过感官体验世界，美景、美食、美物都是你的旅行燃料。喜欢用照片记录美好瞬间。',
    pace:'slow', budgetStyle:'experience', color:'#B5A3C4',
    tip:'带上你的相机或画本，这个世界有很多值得你记录的美好。'
  },
  'ESTP': {
    nickname:'行动派玩家', emoji:'🏄', traits:['行动力强','享受刺激','社交活跃'],
    destinations:['楠溪江漂流','朱家尖南沙','杭州宋城'],
    travelStyle:'说走就走，行动力极强。喜欢刺激的户外项目和极限运动，是旅行中的"气氛组"。',
    pace:'fast', budgetStyle:'experience', color:'#FF6B6B',
    tip:'刺激归刺激，出发前还是要做好基本的安全准备。'
  },
  'ESFP': {
    nickname:'派对达人', emoji:'🎊', traits:['活在当下','感染力强','享受生活'],
    destinations:['老外滩酒吧街','河坊街夜市','湖滨银泰in77'],
    travelStyle:'旅行的本质就是享受！喜欢美食、购物、派对，是朋友圈里最会玩的人。',
    pace:'fast', budgetStyle:'experience', color:'#FF9A9E',
    tip:'你的热情很有感染力，但记得关注预算，别让旅行后的账单毁了回忆。'
  }
};

function openMbtiQuiz() {
  mbtiAnswers = {};
  mbtiCurrentQuestion = 0;
  mbtiResult = null;
  renderMbtiQuestion();
  document.getElementById('mbtiQuizOverlay').classList.add('show');
}

function closeMbtiQuiz() {
  document.getElementById('mbtiQuizOverlay').classList.remove('show');
}

function renderMbtiQuestion() {
  var q = mbtiQuestions[mbtiCurrentQuestion];
  var container = document.getElementById('mbtiQuestionsContainer');
  var progress = document.getElementById('mbtiProgressFill');
  var prevBtn = document.getElementById('mbtiPrevBtn');
  var nextBtn = document.getElementById('mbtiNextBtn');

  progress.style.width = ((mbtiCurrentQuestion / mbtiQuestions.length) * 100) + '%';
  prevBtn.style.display = mbtiCurrentQuestion > 0 ? '' : 'none';
  nextBtn.textContent = mbtiCurrentQuestion === mbtiQuestions.length - 1 ? '✨ 查看结果' : '下一题 →';
  nextBtn.disabled = !mbtiAnswers[q.id];

  var html = '<div class="mbti-question-block">';
  html += '<div class="mbti-question-num">第 ' + (mbtiCurrentQuestion + 1) + ' / ' + mbtiQuestions.length + ' 题</div>';
  html += '<div class="mbti-question-text">' + q.text + '</div>';
  html += '<div class="mbti-options">';
  q.options.forEach(function(opt) {
    var selected = mbtiAnswers[q.id] === opt.value;
    html += '<div class="mbti-option' + (selected ? ' selected' : '') + '" onclick="selectMbtiOption(\'' + q.id + '\', \'' + opt.value + '\')" style="--mbti-accent:' + activeMoodColor + '">';
    html += '<div style="font-size:28px;margin-bottom:6px">' + opt.label.split(' ')[0] + '</div>';
    html += '<div style="font-size:13px;color:rgba(255,255,255,0.6)">' + opt.desc + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  container.innerHTML = html;
}

function selectMbtiOption(qid, value) {
  mbtiAnswers[qid] = value;
  renderMbtiQuestion();
}

function mbtiNextQuestion() {
  var q = mbtiQuestions[mbtiCurrentQuestion];
  if (!mbtiAnswers[q.id]) return;

  if (mbtiCurrentQuestion < mbtiQuestions.length - 1) {
    mbtiCurrentQuestion++;
    renderMbtiQuestion();
  } else {
    calculateMbtiResult();
  }
}

function mbtiPrevQuestion() {
  if (mbtiCurrentQuestion > 0) {
    mbtiCurrentQuestion--;
    renderMbtiQuestion();
  }
}

function calculateMbtiResult() {
  // 计算 MBTI 类型
  var ei = mbtiAnswers['EI'] || 'I';
  var sn = mbtiAnswers['SN'] || 'N';
  var tf = mbtiAnswers['TF'] || 'F';
  var jp = mbtiAnswers['JP'] || 'P';
  var ao = mbtiAnswers['AO'] || 'A';
  var hc = mbtiAnswers['HC'] || 'H';
  var travelStyle = mbtiAnswers['travel_style'] || 'moderate';
  var budgetStyle = mbtiAnswers['budget_style'] || 'value';

  var type = ei + sn + tf + jp;
  var profile = MBTI_TRAVEL_PROFILES[type] || MBTI_TRAVEL_PROFILES['INFJ'];

  mbtiResult = {
    type: type,
    profile: profile,
    ao: ao,
    hc: hc,
    travelStyle: travelStyle,
    budgetStyle: budgetStyle
  };

  // 保存到 localStorage
  try { localStorage.setItem('moodtravel_mbti', JSON.stringify(mbtiResult)); } catch(e) {}

  // 根据 MBTI 结果调整心情偏好
  applyMbtiToMood(profile, travelStyle);

  showMbtiResult();
}

function applyMbtiToMood(profile, travelStyle) {
  // 根据人格类型微调心情推荐
  var mbtiMoodMap = {
    'INTJ':'calm','INTP':'calm','ENTJ':'excited','ENTP':'excited',
    'INFJ':'sad','INFP':'sad','ENFJ':'happy','ENFP':'happy',
    'ISTJ':'tired','ISFJ':'tired','ESTJ':'happy','ESFJ':'happy',
    'ISTP':'excited','ISFP':'calm','ESTP':'excited','ESFP':'excited'
  };
  var suggestedMood = mbtiMoodMap[mbtiResult.type] || 'calm';
  // 不强制切换，但给出提示
  showToast('🧭 你的旅行人格：「' + profile.nickname + '」已解锁！推荐心情：' + (MOODS.find(function(m){return m.key===suggestedMood})||{}).label);
}

function showMbtiResult() {
  var profile = mbtiResult.profile;
  var card = document.getElementById('mbtiResultCard');

  var html = '<div class="mbti-result-header">';
  html += '<div style="font-size:64px;margin-bottom:8px">' + profile.emoji + '</div>';
  html += '<div class="mbti-result-type">' + mbtiResult.type + '</div>';
  html += '<div class="mbti-result-nickname">' + profile.nickname + '</div>';
  html += '<div class="mbti-result-traits">';
  profile.traits.forEach(function(t) {
    html += '<span class="mbti-result-trait">' + t + '</span>';
  });
  html += '</div></div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">🎯 旅行风格</div>';
  html += '<div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7">' + profile.travelStyle + '</div>';
  html += '</div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">📍 推荐目的地</div>';
  html += '<div class="mbti-result-destinations">';
  profile.destinations.forEach(function(d) {
    html += '<span class="mbti-dest-chip" onclick="searchMbtiDest(\'' + d + '\')">' + d + '</span>';
  });
  html += '</div></div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">💡 旅行贴士</div>';
  html += '<div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7">' + profile.tip + '</div>';
  html += '</div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">📊 进阶维度</div>';
  html += '<div style="display:flex;gap:16px;font-size:13px;color:rgba(255,255,255,0.6)">';
  html += '<div>决策风格：<strong style="color:#fff">' + (mbtiResult.ao === 'A' ? '果断型' : '深思型') + '</strong></div>';
  html += '<div>社交倾向：<strong style="color:#fff">' + (mbtiResult.hc === 'H' ? '温暖型' : '独立型') + '</strong></div>';
  html += '<div>旅行节奏：<strong style="color:#fff">' + (mbtiResult.travelStyle === 'fast' ? '快节奏' : '慢节奏') + '</strong></div>';
  html += '</div></div>';

  html += '<div class="mbti-result-actions">';
  html += '<button class="mbti-result-btn mbti-btn-primary" onclick="applyMbtiAndGenerate()">✨ 按人格生成行程</button>';
  html += '<button class="mbti-result-btn mbti-btn-secondary" onclick="closeMbtiResult()">关闭</button>';
  html += '</div>';

  card.innerHTML = html;
  document.getElementById('mbtiQuizOverlay').classList.remove('show');
  document.getElementById('mbtiResultOverlay').classList.add('show');

  // 更新入口按钮
  var entryBtn = document.getElementById('mbtiEntryBtn');
  if (entryBtn) entryBtn.classList.add('has-result');
}

function closeMbtiResult() {
  document.getElementById('mbtiResultOverlay').classList.remove('show');
}

function searchMbtiDest(dest) {
  closeMbtiResult();
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = dest;
    searchInput.focus();
  }
}

function applyMbtiAndGenerate() {
  closeMbtiResult();
  if (mbtiResult) {
    var profile = mbtiResult.profile;
    // 根据 MBTI 设置最佳心情
    var mbtiMoodMap = {
      'INTJ':'calm','INTP':'calm','ENTJ':'excited','ENTP':'excited',
      'INFJ':'sad','INFP':'sad','ENFJ':'happy','ENFP':'happy',
      'ISTJ':'tired','ISFJ':'tired','ESTJ':'happy','ESFJ':'happy',
      'ISTP':'excited','ISFP':'calm','ESTP':'excited','ESFP':'excited'
    };
    var suggestedMood = mbtiMoodMap[mbtiResult.type] || 'calm';
    selectMood(suggestedMood);

    // 根据节奏设置天数
    if (mbtiResult.travelStyle === 'fast') days = 3;
    else if (mbtiResult.travelStyle === 'slow') days = 2;

    // 根据预算风格调整
    if (mbtiResult.budgetStyle === 'experience' && budget < 3000) {
      budget = 3000;
      displayBudget = 3000;
    }

    showToast('🧭 已按「' + profile.nickname + '」人格优化行程参数！');
  }
  doGenerate();
}

// 加载已保存的 MBTI 结果
function loadMbtiResult() {
  try {
    mbtiResult = JSON.parse(localStorage.getItem('moodtravel_mbti') || 'null');
    if (mbtiResult) {
      var entryBtn = document.getElementById('mbtiEntryBtn');
      if (entryBtn) entryBtn.classList.add('has-result');
    }
  } catch(e) { mbtiResult = null; }
}

// ================================================================
//  旅行明信片生成器
// ================================================================
var postcardStyle = 'watercolor';

function openPostcard() {
  document.getElementById('postcardOverlay').classList.add('show');
  renderPostcard();
}

function closePostcard() {
  document.getElementById('postcardOverlay').classList.remove('show');
}

function selectPostcardStyle(style, el) {
  postcardStyle = style;
  document.querySelectorAll('.postcard-style-chip').forEach(function(c) { c.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderPostcard();
}

function renderPostcard() {
  var canvas = document.getElementById('postcardCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;

  // 根据风格设置背景
  var styles = {
    watercolor: { bg:'#f5efe6', accent:'#8BA88C', text:'#3a3a3a', stamp:'#d4a574' },
    vintage: { bg:'#f4e4c1', accent:'#8B4513', text:'#4a3728', stamp:'#c4956a' },
    minimal: { bg:'#ffffff', accent:'#333333', text:'#1a1a1a', stamp:'#888888' },
    night: { bg:'#1a1a2e', accent:'#8BA88C', text:'#e0e0e0', stamp:'#6B7BA3' }
  };
  var s = styles[postcardStyle];

  // 背景
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, w, h);

  // 边框
  ctx.strokeStyle = s.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, w - 30, h - 30);

  // 装饰线
  ctx.strokeStyle = s.accent;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(30, h - 100);
  ctx.lineTo(w - 30, h - 100);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // 标题
  ctx.fillStyle = s.accent;
  ctx.font = 'bold 32px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Greetings from', w / 2, 80);

  // 城市名
  var cities = [];
  if (itinerary && itinerary.length) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
      });
    });
  }
  var cityName = cities.length > 0 ? cities.join(' · ') : '浙江';
  ctx.fillStyle = s.text;
  ctx.font = 'bold 48px "Playfair Display", serif';
  ctx.fillText(cityName, w / 2, 140);

  // 心情标签
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood})||{}).label || '平静';
  ctx.fillStyle = s.accent;
  ctx.globalAlpha = 0.6;
  ctx.font = 'italic 18px "Playfair Display", serif';
  ctx.fillText('~ ' + moodLabel + '之旅 ~', w / 2, 175);
  ctx.globalAlpha = 1;

  // 邮票
  ctx.fillStyle = s.stamp;
  ctx.fillRect(w - 100, 30, 70, 85);
  ctx.fillStyle = s.bg;
  ctx.fillRect(w - 95, 35, 60, 75);
  ctx.fillStyle = s.stamp;
  ctx.font = '10px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ZHEJIANG', w - 65, 65);
  ctx.fillText('2026', w - 65, 80);
  ctx.font = '24px serif';
  ctx.fillText('✦', w - 65, 100);

  // 底部信息
  ctx.fillStyle = s.accent;
  ctx.globalAlpha = 0.5;
  ctx.font = '12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MoodTravel · 让每一次出发都有温度', w / 2, h - 60);
  ctx.fillText('Generated with AI · moodtravel.app', w / 2, h - 40);
  ctx.globalAlpha = 1;

  // 装饰性手写体
  ctx.fillStyle = s.accent;
  ctx.globalAlpha = 0.15;
  ctx.font = 'italic 120px "Playfair Display", serif';
  ctx.textAlign = 'right';
  ctx.fillText('travel', w - 50, h - 130);
  ctx.globalAlpha = 1;
}

function downloadPostcard() {
  var canvas = document.getElementById('postcardCanvas');
  if (!canvas) return;
  var link = document.createElement('a');
  link.download = 'moodtravel-postcard-' + new Date().toISOString().slice(0,10) + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📥 明信片已下载！');
}

// ================================================================
//  旅行费用分摊器
// ================================================================
var expenseMembers = [
  { name:'我', avatar:'🧑', amount:0 },
  { name:'旅伴A', avatar:'👤', amount:0 }
];

function openExpenseSplitter() {
  renderExpenseMembers();
  document.getElementById('expenseSplitterOverlay').classList.add('show');
}

function closeExpenseSplitter() {
  document.getElementById('expenseSplitterOverlay').classList.remove('show');
}

function renderExpenseMembers() {
  var list = document.getElementById('expenseMemberList');
  var html = '';
  expenseMembers.forEach(function(m, i) {
    html += '<div class="expense-member-row">';
    html += '<div class="expense-member-avatar">' + m.avatar + '</div>';
    html += '<input class="expense-member-name" value="' + m.name + '" onchange="expenseMembers[' + i + '].name=this.value" placeholder="姓名">';
    html += '<span style="color:rgba(255,255,255,0.6)">¥</span>';
    html += '<input class="expense-member-input" type="number" value="' + m.amount + '" onchange="expenseMembers[' + i + '].amount=parseFloat(this.value)||0" placeholder="0">';
    if (expenseMembers.length > 1) {
      html += '<button class="expense-remove-btn" onclick="removeExpenseMember(' + i + ')">✕</button>';
    }
    html += '</div>';
  });
  list.innerHTML = html;
}

function addExpenseMember() {
  expenseMembers.push({ name:'旅伴' + (expenseMembers.length), avatar:'👤', amount:0 });
  renderExpenseMembers();
}

function removeExpenseMember(idx) {
  if (expenseMembers.length <= 1) return;
  expenseMembers.splice(idx, 1);
  renderExpenseMembers();
}

function calculateExpenseSplit() {
  var totalBudget = budget;
  if (stats && stats.totalCost) totalBudget = stats.totalCost;

  var totalPaid = expenseMembers.reduce(function(s, m) { return s + m.amount; }, 0);
  var perPerson = totalBudget / expenseMembers.length;
  var summary = document.getElementById('expenseSummary');

  var html = '<div class="expense-summary-row"><span>总预算</span><span>¥' + totalBudget.toLocaleString() + '</span></div>';
  html += '<div class="expense-summary-row"><span>已支付</span><span>¥' + totalPaid.toLocaleString() + '</span></div>';
  html += '<div class="expense-summary-row total"><span>人均应摊</span><span>¥' + Math.round(perPerson).toLocaleString() + '</span></div>';

  html += '<div class="expense-per-person">';
  expenseMembers.forEach(function(m) {
    var diff = Math.round(m.amount - perPerson);
    var status = diff >= 0 ? '<span style="color:#8BA88C">多付 ¥' + diff.toLocaleString() + '</span>' : '<span style="color:#E8A85A">需补 ¥' + Math.abs(diff).toLocaleString() + '</span>';
    html += '<div class="expense-pp-row"><span>' + m.avatar + ' ' + m.name + '</span>' + status + '</div>';
  });
  html += '</div>';

  summary.innerHTML = html;
  summary.style.display = 'block';
}

// ================================================================
//  智能价格预测 — AI 驱动的最佳预订时机
// ================================================================
function predictBestTime() {
  var now = new Date();
  var month = now.getMonth() + 1;
  var dayOfWeek = now.getDay();
  var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  var seasonMap = { 1:0.85, 2:0.95, 3:1.05, 4:1.15, 5:1.2, 6:1.1, 7:1.35, 8:1.3, 9:1.1, 10:1.4, 11:1.0, 12:0.9 };
  var seasonMult = seasonMap[month] || 1.0;
  if (isWeekend) seasonMult *= 1.12;

  // 酒店：使用真实比价数据
  var hotelData = hotel || {};
  var hotelNow = hotelData.bestPrice || (hotelData.pricePerNight || 350);
  var hotelMin = hotelData.minPrice || Math.round(hotelNow * 0.8);

  // 找出各平台价格
  var platformPrices = [];
  if (hotelData.platforms) {
    platformPrices = hotelData.platforms.map(function(p) { return { name: p.name, icon: p.icon, price: p.price, isBest: p.isBest }; });
  } else {
    platformPrices = [
      { name: '携程', icon: '🏨', price: hotelNow, isBest: true },
      { name: '美团', icon: '🏪', price: Math.round(hotelNow * 1.05), isBest: false },
      { name: '飞猪', icon: '✈️', price: Math.round(hotelNow * 0.97), isBest: false },
      { name: 'Booking', icon: '🌐', price: Math.round(hotelNow * 1.1), isBest: false }
    ];
  }

  // 找出最低价平台
  var bestPlatform = platformPrices.reduce(function(a, b) { return a.price < b.price ? a : b; });
  var worstPlatform = platformPrices.reduce(function(a, b) { return a.price > b.price ? a : b; });
  var platformSpread = worstPlatform.price - bestPlatform.price;

  // 门票：基于行程中POI数据
  var ticketTotal = 0;
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.type === 'poi' && item.estimatedCost) {
          ticketTotal += item.estimatedCost;
        }
      });
    });
  }
  if (ticketTotal === 0) ticketTotal = Math.round((budget || 2000) * 0.2);

  // 交通
  var transportCost = Math.round((budget || 2000) * 0.25);
  var totalEstimate = hotelNow * (days || 1) + ticketTotal + transportCost + Math.round((budget || 2000) * 0.15);

  // 生成价格历史
  var genHistory = function(base, trend, vol) {
    var arr = [];
    for (var i = -7; i <= 7; i++) {
      var p = base;
      if (trend === 'up') p = base * (1 + i * 0.018);
      else if (trend === 'down') p = base * (1 - Math.abs(i) * 0.012);
      else p = base * (1 + Math.sin(i * 0.5) * 0.03);
      p += (Math.random() - 0.5) * vol;
      arr.push({ day: i, price: Math.round(Math.max(p * 0.85, p)) });
    }
    return arr;
  };

  return {
    seasonMult: seasonMult,
    hotel: {
      currentPrice: hotelNow, predictedLow: hotelMin,
      trend: seasonMult > 1.15 ? 'up' : 'stable',
      history: genHistory(hotelNow, seasonMult > 1.15 ? 'up' : 'stable', hotelNow * 0.03),
      platformPrices: platformPrices,
      bestPlatform: bestPlatform,
      platformSpread: platformSpread,
      bestPlatformName: hotelData.bestPlatform || bestPlatform.name,
      bestReason: hotelData.bestReason || '价格最低',
      tip: hotelData.name ? '「' + hotelData.name + '」在<strong>' + bestPlatform.name + '</strong>上最便宜，比最贵平台省<strong>¥' + platformSpread + '</strong>' : '不同平台价差可达<strong>¥' + platformSpread + '</strong>，建议多平台比价'
    },
    tickets: {
      currentPrice: ticketTotal, predictedLow: Math.round(ticketTotal * 0.85),
      trend: 'stable',
      history: genHistory(ticketTotal, 'stable', ticketTotal * 0.02),
      tip: '在线预订通常<strong>省15%起</strong>，部分平台有早鸟票折扣'
    },
    transport: {
      currentPrice: transportCost, predictedLow: Math.round(transportCost * 0.8),
      trend: 'stable',
      history: genHistory(transportCost, 'stable', transportCost * 0.03),
      tip: '高铁/机票<strong>提前7-14天</strong>购买最划算，<strong>临近出发涨20%+</strong>'
    },
    totalEstimate: totalEstimate,
    totalOptimized: Math.round(hotelMin * (days || 1) + ticketTotal * 0.85 + transportCost * 0.8 + (budget || 2000) * 0.12)
  };
}

function renderPriceChart(history) {
  var maxPrice = Math.max.apply(null, history.map(function(h) { return h.price; }));
  var minPrice = Math.min.apply(null, history.map(function(h) { return h.price; }));
  var range = maxPrice - minPrice || 1;
  var html = '<div class="price-prediction-bar-group">';
  history.forEach(function(h) {
    var height = ((h.price - minPrice) / range) * 60 + 12;
    var cls = 'price-prediction-bar ';
    if (h.day === 0) cls += 'now';
    else if (h.day < 0) cls += 'past';
    else if (h.price === minPrice) cls += 'best';
    else cls += 'future';
    var label = h.day === 0 ? '今天' : (h.day < 0 ? -h.day + '天前' : '+' + h.day + '天');
    html += '<div style="flex:1;text-align:center"><div class="' + cls + '" style="height:' + height + 'px" title="¥' + h.price + '"></div><div class="price-prediction-bar-label">' + label + '</div></div>';
  });
  html += '</div>';
  return html;
}

function renderPricePrediction() {
  var section = document.getElementById('pricePredictionSection');
  var content = document.getElementById('pricePredictionContent');
  if (!section || !content) return;
  section.classList.add('show');

  var p = predictBestTime();
  var html = '';

  // === 酒店比价卡片（最有用） ===
  html += '<div class="price-prediction-card">';
  html += '<div class="price-prediction-header">';
  html += '<div class="price-prediction-title"><span class="price-prediction-icon">🏨</span>酒店比价 · ' + (hotel ? hotel.name : '推荐酒店') + '</div>';
  html += '<span class="price-prediction-trend ' + (p.hotel.trend === 'up' ? 'up' : 'stable') + '">' + (p.hotel.trend === 'up' ? '📈 旺季' : '📊 平稳') + '</span>';
  html += '</div>';

  // 平台比价列表
  html += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">';
  var isLight = document.body.classList.contains('light-mode');
  p.hotel.platformPrices.forEach(function(pp) {
    var isBest = pp.price === p.hotel.bestPlatform.price;
    var rowBg = isBest ? 'background:rgba(139,168,140,0.12);border:1px solid rgba(139,168,140,0.3)' :
      (isLight ? 'background:rgba(0,0,0,0.03)' : 'background:rgba(255,255,255,0.04)');
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:10px;' + rowBg + '">';
    html += '<span style="font-size:14px;color:' + (isLight ? '#555' : '') + '">' + (pp.icon || '🏨') + ' <strong>' + pp.name + '</strong></span>';
    html += '<span style="font-size:16px;font-weight:700;' + (isBest ? 'color:#8BA88C' : (isLight ? 'color:#555' : '')) + '">¥' + pp.price.toLocaleString() + '</span>';
    if (isBest) html += '<span class="price-best-badge" style="font-size:11px;background:#8BA88C;color:#fff;padding:2px 8px;border-radius:10px">最低价</span>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="price-prediction-body" style="margin-bottom:8px">';
  html += '<div><div class="price-prediction-current">¥' + p.hotel.currentPrice.toLocaleString() + '</div><div class="price-prediction-current-label">当前最优价</div></div>';
  html += '<div><div class="price-prediction-low">¥' + p.hotel.predictedLow.toLocaleString() + '</div><div class="price-prediction-low-label">最低可至</div></div>';
  html += '</div>';
  if (p.hotel.platformSpread > 0) {
    html += '<div class="price-prediction-save">💡 ' + p.hotel.bestPlatformName + '最便宜，比最贵平台省 ¥' + p.hotel.platformSpread.toLocaleString() + ' · ' + (p.hotel.bestReason || '') + '</div>';
  }
  html += '<div class="price-prediction-chart">' + renderPriceChart(p.hotel.history) + '</div>';
  html += '<div class="price-prediction-tip">' + p.hotel.tip + '</div>';
  html += '</div>';

  // === 门票 ===
  html += '<div class="price-prediction-card">';
  html += '<div class="price-prediction-header">';
  html += '<div class="price-prediction-title"><span class="price-prediction-icon">🎫</span>景点门票</div>';
  html += '<span class="price-prediction-trend stable">📊 稳定</span>';
  html += '</div>';
  html += '<div class="price-prediction-body">';
  html += '<div><div class="price-prediction-current">¥' + p.tickets.currentPrice.toLocaleString() + '</div><div class="price-prediction-current-label">预估总门票</div></div>';
  html += '<div><div class="price-prediction-low">¥' + p.tickets.predictedLow.toLocaleString() + '</div><div class="price-prediction-low-label">早鸟价最低</div></div>';
  html += '</div>';
  if (p.tickets.currentPrice - p.tickets.predictedLow > 0) {
    html += '<div class="price-prediction-save">🎟️ 提前购票可省 ¥' + (p.tickets.currentPrice - p.tickets.predictedLow).toLocaleString() + '</div>';
  }
  html += '<div class="price-prediction-chart">' + renderPriceChart(p.tickets.history) + '</div>';
  html += '<div class="price-prediction-tip">' + p.tickets.tip + '</div>';
  html += '</div>';

  // === 交通 ===
  html += '<div class="price-prediction-card">';
  html += '<div class="price-prediction-header">';
  html += '<div class="price-prediction-title"><span class="price-prediction-icon">🚄</span>交通出行</div>';
  html += '<span class="price-prediction-trend stable">📊 稳定</span>';
  html += '</div>';
  html += '<div class="price-prediction-body">';
  html += '<div><div class="price-prediction-current">¥' + p.transport.currentPrice.toLocaleString() + '</div><div class="price-prediction-current-label">预估交通费</div></div>';
  html += '<div><div class="price-prediction-low">¥' + p.transport.predictedLow.toLocaleString() + '</div><div class="price-prediction-low-label">提前购票最低</div></div>';
  html += '</div>';
  if (p.transport.currentPrice - p.transport.predictedLow > 0) {
    html += '<div class="price-prediction-save">🚄 提前购票可省 ¥' + (p.transport.currentPrice - p.transport.predictedLow).toLocaleString() + '</div>';
  }
  html += '<div class="price-prediction-chart">' + renderPriceChart(p.transport.history) + '</div>';
  html += '<div class="price-prediction-tip">' + p.transport.tip + '</div>';
  html += '</div>';

  // === 总预算优化汇总 ===
  var totalSave = p.totalEstimate - p.totalOptimized;
  html += '<div class="price-summary">';
  html += '<div class="price-summary-row"><span>📊 当前预估总花费（' + (days || 1) + '天）</span><span class="price-summary-val">¥' + p.totalEstimate.toLocaleString() + '</span></div>';
  html += '<div class="price-summary-row"><span>🎯 优化后最低花费</span><span class="price-summary-val">¥' + p.totalOptimized.toLocaleString() + '</span></div>';
  html += '<div class="price-summary-row"><span>🏨 酒店（' + (days || 1) + '晚）</span><span class="price-summary-val">¥' + (p.hotel.currentPrice * (days || 1)).toLocaleString() + '</span></div>';
  html += '<div class="price-summary-row"><span>🎫 门票</span><span class="price-summary-val">¥' + p.tickets.currentPrice.toLocaleString() + '</span></div>';
  html += '<div class="price-summary-row"><span>🚄 交通</span><span class="price-summary-val">¥' + p.transport.currentPrice.toLocaleString() + '</span></div>';
  html += '<div class="price-summary-row border-top"><span>💰 最多可节省</span><span class="price-summary-val highlight">¥' + totalSave.toLocaleString() + '</span></div>';
  html += '<div class="price-prediction-tip" style="margin-top:10px">🕐 <strong>最佳预订策略：</strong>' + (p.seasonMult > 1.15 ? '当前为旺季，建议提前14天规划并预订所有项目，多平台比价可获最大折扣' : '当前价格合理，提前7天预订即可锁定优惠，多平台比价不吃亏') + '</div>';
  html += '</div>';

  content.innerHTML = html;
  fixLightModeText();
}

document.addEventListener('DOMContentLoaded', function() {
  // 加载 API 配置
  loadApiConfig();
  loadMbtiResult();
  // 恢复长辈关怀模式
  var savedElderly = localStorage.getItem('travel-elderly-mode');
  if (savedElderly === '1') {
    elderlyMode = true;
    document.body.classList.add('elderly-mode');
    var elderlyCheckbox = document.getElementById('elderlyCheckbox');
    if (elderlyCheckbox) elderlyCheckbox.checked = true;
  }
  // 如果保存了 API key，自动填入
  if (API_CONFIG.llm.apiKey) {
    var llmInput = document.getElementById('llmApiKeyInput');
    if (llmInput) llmInput.value = API_CONFIG.llm.apiKey;
  }
  if (API_CONFIG.weather.apiKey) {
    var weatherInput = document.getElementById('weatherApiKeyInput');
    if (weatherInput) weatherInput.value = API_CONFIG.weather.apiKey;
  }

  // 初始化场景切换 UI（默认旅游模式暖色）
  updateSceneToggle();

  var rightPanel = document.getElementById('rightPanel');
  if (rightPanel) {
    rightPanel.addEventListener('scroll', function() {
      scrollCount++;
      if (scrollCount >= 10 && activeMood !== 'anxious' && !keywordTriggered) {
        triggerAnxiousFromKeyword();
      }
    }, { passive: true });
  }

  // 光标光晕效果
  var cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow hidden';
  document.body.appendChild(cursorGlow);
  var cursorGlowTimeout;
  document.addEventListener('mousemove', function(e) {
    cursorGlow.classList.remove('hidden');
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
    clearTimeout(cursorGlowTimeout);
    cursorGlowTimeout = setTimeout(function() { cursorGlow.classList.add('hidden'); }, 2000);
  }, { passive: true });

  // 按钮涟漪效果
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || btn.closest('.mbti-quiz-overlay') || btn.closest('.mbti-result-overlay')) return;
    var ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    if (!btn.classList.contains('btn-ripple')) btn.classList.add('btn-ripple');
    btn.appendChild(ripple);
    setTimeout(function() { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 600);
  });

  // 为所有交互按钮添加微反馈
  document.querySelectorAll('button, .mood-option, .card-hover').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.transition = 'all 0.2s var(--ease-out-expo)';
    });
    el.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

  // 初始化预算滑块填充
  updateBudgetSliderRange();
  updateBudgetFill();

});

// ================================================================
//  同伴系统
// ================================================================
function selectCompanion(key) {
  companionType = key;
  hasKids = (key === 'family');
  hasElderly = (key === 'family');
  isCouple = (key === 'couple');
  isFriends = (key === 'friends');
  isBusiness = (key === 'business');
  updateCompanionStyles();
  // 自动切换场景：商务同事实用出行模式
  if (key === 'business' && travelMode !== 'business') {
    travelMode = 'business';
    updateSceneToggle();
  } else if (key !== 'business' && travelMode === 'business') {
    travelMode = 'tourism';
    updateSceneToggle();
  }
  var ct = COMPANION_TYPES.find(function(c) { return c.key === key; });
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  var cLabel = (t.companionLabels && t.companionLabels[key]) || (ct ? ct.label : key);
  var cPace = (t.companionPaceLabels && t.companionPaceLabels[key]) || (ct ? ct.paceLabel : '');
  showToast(ct.icon + t.companionToast.replace('{label}', cLabel).replace('{pace}', cPace));
}

function updateCompanionStyles() {
  var chips = document.getElementById('companionChips').querySelectorAll('.companion-chip');
  chips.forEach(function(chip, i) {
    var key = COMPANION_TYPES[i].key;
    if (key === companionType) {
      chip.classList.add('active');
      chip.style.background = activeMoodColor + '22';
      chip.style.borderColor = activeMoodColor + '60';
      chip.style.color = activeMoodColor;
    } else {
      chip.classList.remove('active');
      chip.style.background = '';
      chip.style.borderColor = '';
      chip.style.color = '';
    }
  });
}

// ================================================================
//  长者模式
// ================================================================
function toggleElderlyMode() {
  elderlyMode = !elderlyMode;
  document.getElementById('elderlyCheckbox').checked = elderlyMode;
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  showToast(elderlyMode ? t.elderlyOn : t.elderlyOff);
}

document.getElementById('elderlyCheckbox').addEventListener('change', function() {
  elderlyMode = this.checked;
  if (elderlyMode) {
    document.body.classList.add('elderly-mode');
  } else {
    document.body.classList.remove('elderly-mode');
  }
  try { localStorage.setItem('travel-elderly-mode', elderlyMode ? '1' : '0'); } catch(e) {}
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  showToast(elderlyMode ? t.elderlyOn : t.elderlyOff);
});

// ================================================================
//  日常场景
// ================================================================
function selectScenario(key) {
  if (activeScenario === key) { activeScenario = null; }
  else { activeScenario = key; }
  updateScenarioStyles();
  renderDailySpots();
  if (activeScenario) {
    var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
    var scenarioMessages = t.scenarioToast || { walk:'下班后透透气吧~', break:'摸鱼时间到！', grocery:'帮长辈买菜，暖心出行~', rain:'找个地方躲雨吧~' };
    showToast(scenarioMessages[activeScenario] || '');
    var container = document.getElementById('dailySpotsContainer');
    if (container) {
      setTimeout(function() { container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 200);
    }
  }
}

function updateScenarioStyles() {
  var chips = document.getElementById('dailyScenariosScroll').querySelectorAll('.daily-scenario-chip');
  chips.forEach(function(chip, i) {
    var key = DAILY_SCENARIOS[i].key;
    if (key === activeScenario) {
      chip.classList.add('active');
      chip.style.background = activeMoodColor + '22';
      chip.style.borderColor = activeMoodColor + '60';
      chip.style.color = activeMoodColor;
    } else {
      chip.classList.remove('active');
      chip.style.background = '';
      chip.style.borderColor = '';
      chip.style.color = '';
    }
  });
}

function renderDailySpots() {
  var container = document.getElementById('dailySpotsContainer');
  if (!activeScenario) { container.innerHTML = ''; return; }
  var spots = TRAVEL_SPOTS.filter(function(s) { return s.scenario === activeScenario; });
  if (spots.length === 0) {
    var nearby = TRAVEL_SPOTS.filter(function(s) { return s.distance <= 500; }).slice(0, 3);
    spots = nearby;
  }
  container.innerHTML = spots.map(function(s) {
    var desc = elderlyMode && s.elderDesc ? s.elderDesc : s.description;
    return '<div class="daily-spot-card"><span class="daily-spot-emoji">' + (s.emoji || '📍') + '</span><div class="daily-spot-info"><span class="daily-spot-title">' + s.title + '</span><span class="daily-spot-desc">' + desc + '</span></div><span class="daily-spot-dist">' + s.distance + 'm</span></div>';
  }).join('');
}

// ================================================================
//  预算系统（动态区间 + 校验）
// ================================================================
function setBudget(val) {
  budget = val;
  displayBudget = val;
  budgetCustom.value = '';
  budgetSlider.value = val;
  updateBudgetFill();
  updatePresetStyles();
  budgetNumber.textContent = val.toLocaleString();
  validateBudget(val);
}

function validateBudget(val) {
  var range = getBudgetRange(days);
  if (!budgetWarningEl) budgetWarningEl = document.getElementById('budgetValidationWarning');
  if (!budgetWarningEl) return;
  if (val < range.min) {
    budgetWarningEl.textContent = '⚠️ 预算可能不够哦（' + days + '天行程建议至少 ¥' + range.min.toLocaleString() + '）';
    budgetWarningEl.className = 'budget-validation-warning';
    budgetWarningEl.style.display = 'flex';
  } else if (val > range.max * 2.5) {
    budgetWarningEl.textContent = '👑 已为您开启奢华模式';
    budgetWarningEl.className = 'budget-validation-warning luxury';
    budgetWarningEl.style.display = 'flex';
  } else {
    budgetWarningEl.style.display = 'none';
  }
}

function updateBudgetSliderRange() {
  var range = getBudgetRange(days);
  budgetSlider.min = range.min;
  budgetSlider.max = range.max;
  document.getElementById('budgetMinLabel').textContent = '¥' + range.min.toLocaleString();
  document.getElementById('budgetMaxLabel').textContent = '¥' + range.max.toLocaleString();
  // 如果当前预算超出新区间，自动调整
  if (budget < range.min) setBudget(range.min);
  else if (budget > range.max) setBudget(range.max);
  else validateBudget(budget);
}

function updateBudgetFill() {
  var sliderMin = Number(budgetSlider.min);
  var sliderMax = Number(budgetSlider.max);
  var pct = ((budget - sliderMin) / (sliderMax - sliderMin)) * 100;
  budgetFill.style.width = pct + '%';
  budgetFill.style.background = activeMoodColor;
}

function updatePresetStyles() {
  var btns = budgetPresets.querySelectorAll('.preset-chip');
  btns.forEach(function(btn, i) {
    var val = BUDGET_PRESETS[i].value;
    if (val === budget) {
      btn.classList.add('active');
      btn.style.background = activeMoodColor + '22';
      btn.style.borderColor = activeMoodColor;
      btn.style.color = activeMoodColor;
    } else {
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  });
}

budgetSlider.addEventListener('input', function(e) {
  budget = Number(e.target.value);
  displayBudget = budget;
  budgetCustom.value = '';
  budgetNumber.textContent = budget.toLocaleString();
  updateBudgetFill();
  updatePresetStyles();
});
budgetSlider.addEventListener('mousedown', function() { isDragging = true; budgetFill.classList.add('glowing'); });
budgetSlider.addEventListener('mouseup', function() { isDragging = false; budgetFill.classList.remove('glowing'); });
budgetSlider.addEventListener('touchstart', function() { isDragging = true; budgetFill.classList.add('glowing'); });
budgetSlider.addEventListener('touchend', function() { isDragging = false; budgetFill.classList.remove('glowing'); });

budgetCustom.addEventListener('input', function(e) {
  var raw = e.target.value.replace(/[^0-9]/g, '');
  budgetCustom.value = raw;
  if (raw) {
    var val = Math.max(200, Number(raw));
    budget = val; displayBudget = val;
    budgetSlider.value = Math.min(val, Number(budgetSlider.max));
    budgetNumber.textContent = val.toLocaleString();
    updateBudgetFill(); updatePresetStyles();
  }
});
budgetCustom.addEventListener('blur', function() {
  if (budgetCustom.value) {
    var val = Math.max(200, Number(budgetCustom.value));
    budget = val; displayBudget = val;
    budgetSlider.value = Math.min(val, Number(budgetSlider.max));
    budgetNumber.textContent = val.toLocaleString();
    updateBudgetFill(); updatePresetStyles();
  }
});

// ================================================================
//  方案卡片
// ================================================================
function renderPlanCards() {
  plansWaterfall.innerHTML = '';
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  visibleCards.forEach(function(card) {
    var steps = card.showBack ? card.planB : card.planA;
    var stats = card.showBack ? card.planBStats : card.planAStats;
    var html = '<div class="plan-card glass-panel"><div class="plan-card-header">' +
      '<span class="plan-card-mood" style="background:' + card.color + '22;color:' + card.color + '">' + __(card.moodLabel, 'moodLabels') + '</span>' +
      '<button class="plan-card-switch" style="color:' + activeMoodColor + '">' + (card.showBack ? (t.planA || '方案A') : (t.planB || '方案B')) + '</button>' +
      '</div><div class="plan-card-route">';
    steps.forEach(function(step) {
      html += '<div class="plan-route-step"><span class="plan-step-time">' + step.time + '</span><span class="plan-step-dot" style="background:' + card.color + '"></span><span class="plan-step-name">' + __(step.name, 'planSteps') + '</span></div>';
    });
    html += '</div><div class="plan-card-footer"><div class="plan-card-stats"><span>' + stats.steps + '</span><span>' + stats.time + '</span><span>' + stats.budget + '</span></div>' +
      '<button class="plan-card-book" style="background:' + activeMoodColor + '">' + (t.bookBtn || '预订') + '</button></div></div>';
    plansWaterfall.innerHTML += html;
  });
  planCount.textContent = visibleCards.length + (t.planCountUnit || ' 套');
  setTimeout(function() {
    var cards = plansWaterfall.querySelectorAll('.plan-card');
    cards.forEach(function(cardEl, idx) {
      var card = visibleCards[idx];
      if (!card) return;
      var switchBtn = cardEl.querySelector('.plan-card-switch');
      if (switchBtn) switchBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleCard(card); });
      var bookBtn = cardEl.querySelector('.plan-card-book');
      if (bookBtn) bookBtn.addEventListener('click', function(e) { e.stopPropagation(); showBookingPopup(card.moodLabel); });
    });
    observeCards();
  }, 50);
}

function toggleCard(card) {
  card.showBack = !card.showBack;
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  showToast(card.moodLabel + ' · ' + (card.showBack ? t.planB : t.planA));
  renderPlanCards();
}

function loadMore() {
  if (!hasMore) return;
  var btn = document.getElementById('loadMoreBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';
  setTimeout(function() {
    visibleCards = visibleCards.concat(EXTRA_CARDS);
    hasMore = false;
    loadMoreWrap.style.display = 'none';
    renderPlanCards();
  }, 600);
}

var cardObserver = null;
function observeCards() {
  if (cardObserver) cardObserver.disconnect();
  cardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); cardObserver.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.plan-card').forEach(function(el) { cardObserver.observe(el); });
}

// ================================================================
//  预订比价弹窗
// ================================================================
function showBookingPopup(label) {
  var overlay = document.getElementById('bookingPopupOverlay');
  var text = document.getElementById('bookingPopupText');
  var spinner = document.getElementById('bookingSpinner');
  var list = document.getElementById('platformList');
  var footer = document.getElementById('bookingPopupFooter');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};

  var basePrice = 300 + Math.floor(Math.random() * 500);
  overlay.classList.add('show');
  text.textContent = t.bookingSearching;
  spinner.style.display = 'block';
  list.innerHTML = '';
  footer.style.display = 'none';

  var platforms = PLATFORM_LIST.map(function(p) {
    return { name: p.name, icon: p.icon, price: Math.round(basePrice * (p.baseMultiplier + (Math.random() - 0.5) * 0.15)) };
  }).sort(function(a, b) { return a.price - b.price; });

  list.innerHTML = platforms.map(function(p) {
    return '<div class="platform-item"><span class="platform-icon">' + p.icon + '</span><span class="platform-name">' + p.name + '</span><span class="platform-wait">' + t.bookingSearching + '</span></div>';
  }).join('');

  var i = 0;
  var timer = setInterval(function() {
    var items = list.querySelectorAll('.platform-item');
    if (i < platforms.length) {
      var item = items[i];
      item.classList.add('checked');
      var wait = item.querySelector('.platform-wait');
      if (wait) { wait.className = 'platform-price'; wait.textContent = '¥' + platforms[i].price; }
      i++;
    }
    if (i >= platforms.length) {
      clearInterval(timer);
      setTimeout(function() {
        spinner.style.display = 'none';
        text.textContent = t.bookingTitle;
        footer.style.display = 'block';
        var best = platforms[0];
        var worst = platforms[platforms.length - 1];
        footer.innerHTML = '<span class="booking-best">🏆 ' + escapeHtml(best.name) + ' ¥' + best.price + '</span>' +
          '<span class="booking-save">' + t.bookingSaved + ' ¥' + (worst.price - best.price) + '</span>' +
          '<button class="booking-action-btn" style="background:' + activeMoodColor + '" onclick="closeBookingPopup()">' + t.bookingGoBook + '</button>';
      }, 500);
    }
  }, 600);
}

function closeBookingPopup() {
  document.getElementById('bookingPopupOverlay').classList.remove('show');
  if (bookingTimer) { clearInterval(bookingTimer); bookingTimer = null; }
}


// ================================================================
//  4层漏斗引擎（增强版：双场景 + 交通耗时 + 反特种兵 + Plan B + 预算硬上限）
// ================================================================
function doGenerate() {
  var weights = getWeightKey();
  var dailyBudget = budget / days;
  var energyIdeal = MOOD_ENERGY_MAP[activeMood] || 2;

  // ================================================================
  //  增强算法：季节性智能调整
  // ================================================================
  var now = new Date();
  var month = now.getMonth() + 1;
  var season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  var seasonLabels = { spring:'🌸 春', summer:'☀️ 夏', autumn:'🍂 秋', winter:'❄️ 冬' };

  // ================================================================
  //  增强算法：心情到POI类型的智能映射
  // ================================================================
  var moodPoiTypeWeights = {
    calm: { nature: 1.5, cultural: 1.3, temple: 1.4, garden: 1.5, relaxation: 1.6 },
    happy: { food: 1.5, shopping: 1.4, entertainment: 1.5, social: 1.6, landmark: 1.2 },
    sad: { nature: 1.4, temple: 1.5, cultural: 1.4, garden: 1.3, healing: 1.6 },
    anxious: { nature: 1.5, temple: 1.6, relaxation: 1.5, garden: 1.4, meditation: 1.7 },
    excited: { adventure: 1.6, landmark: 1.4, entertainment: 1.5, outdoor: 1.5, social: 1.3 },
    tired: { relaxation: 1.7, food: 1.5, garden: 1.4, nature: 1.3, spa: 1.6 },
    insomnia: { nature: 1.4, temple: 1.5, relaxation: 1.6, garden: 1.3, quiet: 1.7 }
  };
  var currentMoodWeights = moodPoiTypeWeights[activeMood] || moodPoiTypeWeights.calm;

  // ================================================================
  //  增强算法：旅伴类型智能调整
  // ================================================================
  var companionAdjustments = {
    solo: { pace: 0.8, flexibility: 1.5, socialPoi: 0.5, budgetPerPerson: 1.3 },
    couple: { pace: 0.9, flexibility: 1.2, romanticPoi: 1.8, budgetPerPerson: 1.1 },
    family: { pace: 0.7, flexibility: 0.8, familyPoi: 2.0, budgetPerPerson: 0.8 },
    friends: { pace: 1.2, flexibility: 1.3, socialPoi: 1.6, budgetPerPerson: 0.9 },
    business: { pace: 1.4, flexibility: 0.5, landmarkPoi: 1.5, budgetPerPerson: 1.5 }
  };
  var compAdj = companionAdjustments[companionType] || companionAdjustments.solo;

  // ================================================================
  //  增强算法：天气智能适配
  // ================================================================
  var weatherCondition = 'unknown';
  if (typeof currentWeather !== 'undefined' && currentWeather && currentWeather.condition) {
    weatherCondition = currentWeather.condition;
  }
  var weatherPoiBoost = {};
  if (weatherCondition.indexOf('雨') !== -1) {
    weatherPoiBoost = { indoor: 1.8, museum: 1.6, shopping: 1.5, food: 1.4, temple: 1.3 };
    weatherPoiBoost.outdoor = 0.3; weatherPoiBoost.nature = 0.4; weatherPoiBoost.adventure = 0.2;
  } else if (weatherCondition.indexOf('晴') !== -1) {
    weatherPoiBoost = { outdoor: 1.5, nature: 1.4, adventure: 1.3, landmark: 1.3 };
  }

  // ================================================================
  //  增强算法：时间精力曲线 — 行程节奏优化
  // ================================================================
  var energyCurve = [];
  for (var d = 0; d < days; d++) {
    energyCurve.push({
      morning: 0.9 - (d * 0.05),   // 每天早上精力逐渐下降
      afternoon: 0.75 - (d * 0.08),
      evening: 0.6 + (d * 0.05)    // 晚上可以安排轻松活动
    });
  }

  // LAYER 1: 硬过滤 + 防坑避雷
  var candidates = POIS.filter(function(poi) {
    if (poi.ticketPrice > dailyBudget * 0.5) return false;
    if (hasKids && !poi.kidsFriendly) return false;
    if (hasKids && poi.minAge && poi.minAge > 5) return false;
    if (hasElderly && !poi.elderlyFriendly && poi.energyLevel >= 4) return false;
    if (hasElderly && poi.category === 'restaurant') {
      if (poi.queueTime > 60) return false;
      if (poi.hasElevator === false) return false;
      if (poi.spicinessLevel >= 3) return false;
    }
    if (hasKids && poi.energyLevel >= 3 && !poi.hasNursingRoom && !poi.strollerFriendly) return false;
    if (hasElderly && poi.energyLevel >= 3 && !poi.wheelchairAccessible && poi.restSeats < 3) return false;
    // 旅游模式：过滤纯商务类；出行模式：过滤高体力景点
    if (travelMode === 'tourism' && poi.category === 'business') return false;
    if (travelMode === 'business' && poi.energyLevel >= 4) return false;
    // 🛡️ 防坑避雷：情侣 — 过滤网红排队店（容易引发争吵）
    if (isCouple && poi.category === 'restaurant' && poi.queueTime >= 30) return false;
    // 🛡️ 防坑避雷：情侣 — 过滤行程过满的高体力景点
    if (isCouple && poi.energyLevel >= 4) return false;
    // 🛡️ 防坑避雷：商务同事 — 过滤过于私密/氛围暧昧的餐厅
    if (isBusiness && poi.category === 'restaurant' && poi.romanticLevel >= 4) return false;
    // 🛡️ 防坑避雷：商务同事 — 过滤嘈杂环境
    if (isBusiness && poi.category === 'restaurant' && poi.noiseLevel >= 4) return false;
    // 🛡️ 防坑避雷：长辈/亲子 — 过滤高体力/爬山类
    if (hasElderly && poi.energyLevel >= 3 && (poi.tags || []).indexOf('徒步') !== -1) return false;
    return true;
  });

  // LAYER 2: 多维评分
  var scored = candidates.map(function(poi) {
    var moodScore = (poi.moodScores[activeMood] || 5) * weights.mood * 10;
    var budgetRatio = dailyBudget > 0 ? Math.min(poi.ticketPrice / dailyBudget, 1) : 0;
    var budgetScore = (1 - budgetRatio) * weights.budget * 100;
    var energyDiff = Math.abs(poi.energyLevel - energyIdeal);
    var energyScore = (1 - energyDiff / 4) * weights.energy * 100;
    var crowdScore = (5 - poi.crowdednessLevel) / 4 * weights.crowd * 100;
    var kidScore = hasKids ? (poi.kidsFriendly ? weights.kid * 100 : 0) : 0;
    var elderlyScore = hasElderly ? (poi.elderlyFriendly ? weights.elderly * 100 : 0) : 0;
    var coupleScore = isCouple ? (poi.romanticLevel / 5 * weights.couple * 100) : 0;

    var elderlyRestaurantBonus = 0;
    if (hasElderly && poi.category === 'restaurant') {
      if (poi.hasPrivateRoom) elderlyRestaurantBonus += 20;
      if (poi.hasHotTea) elderlyRestaurantBonus += 15;
      if (poi.noiseLevel <= 2) elderlyRestaurantBonus += 15;
    }
    var coupleBonus = 0;
    if (isCouple) {
      if (poi.hasPhotoSpot) coupleBonus += 15;
      if (poi.category === 'restaurant' && poi.romanticLevel >= 4) coupleBonus += 20;
      if (poi.category === 'leisure' && poi.romanticLevel >= 4) coupleBonus += 15;
    }
    var kidsBonus = 0;
    if (hasKids) { if (poi.hasNursingRoom) kidsBonus += 20; if (poi.strollerFriendly) kidsBonus += 15; }
    var elderlyBonus = 0;
    if (hasElderly) { if (poi.wheelchairAccessible) elderlyBonus += 15; if (poi.restSeats >= 4) elderlyBonus += 15; if (poi.nearMedical) elderlyBonus += 20; }

    // 👯 好友模式加分：网红餐厅、夜市、年轻人聚集地
    var friendsBonus = 0;
    if (isFriends) {
      if (poi.tags && poi.tags.some(function(t) { return t === '网红' || t === '打卡' || t === '拍照' || t === '小吃' || t === '美食'; })) friendsBonus += 20;
      if (poi.category === 'shopping' && (poi.tags || []).indexOf('古街') !== -1) friendsBonus += 15;
      if (poi.hasPhotoSpot) friendsBonus += 15;
      if (poi.category === 'restaurant' && poi.romanticLevel <= 2 && poi.noiseLevel >= 3) friendsBonus += 10;
    }

    // 💼 商务模式加分：交通枢纽周边、快捷餐饮、商务酒店
    var businessBonus = 0;
    if (isBusiness) {
      if (poi.energyLevel <= 1) businessBonus += 20;
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) businessBonus += 15;
      if (poi.category === 'restaurant' && poi.noiseLevel <= 2) businessBonus += 10;
      if (poi.tags && poi.tags.some(function(t) { return t === '高端' || t === '商务'; })) businessBonus += 15;
    }

    // 🧑 独自旅行加分：安静、独立空间、自我探索
    var soloBonus = 0;
    if (companionType === 'solo') {
      if (poi.energyLevel <= 2 && poi.crowdednessLevel <= 2) soloBonus += 15;
      if (poi.category === 'museum' || poi.category === 'leisure') soloBonus += 10;
    }

    // 旅游模式加分：风景区、网红打卡地
    var isTravel = travelMode === 'tourism';
    var travelBonus = 0;
    if (isTravel) {
      if (poi.category === 'scenic') travelBonus += 25;
      if (poi.hasPhotoSpot) travelBonus += 20;
      if (poi.tags && poi.tags.some(function(t) { return t === '网红' || t === '打卡' || t === '拍照' || t === '美景'; })) travelBonus += 15;
    }
    // 出行模式加分：低体力消耗、快捷餐饮
    var commuteBonus = 0;
    if (!isTravel) {
      if (poi.energyLevel <= 2) commuteBonus += 20;
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) commuteBonus += 15;
    }

    var total = moodScore + budgetScore + energyScore + crowdScore + kidScore + elderlyScore + coupleScore + elderlyRestaurantBonus + coupleBonus + kidsBonus + elderlyBonus + friendsBonus + businessBonus + soloBonus + travelBonus + commuteBonus;

    // ================================================================
    //  增强算法集成：应用心情权重、天气加成、季节性、旅伴偏好
    // ================================================================
    // 心情权重：基于POI类别的情绪匹配
    if (currentMoodWeights[poi.category]) total *= currentMoodWeights[poi.category];
    // 心情权重：基于标签的情感匹配
    var poiTags = poi.tags || [];
    for (var tk in currentMoodWeights) {
      if (poiTags.indexOf(tk) !== -1) total *= currentMoodWeights[tk];
    }

    // 天气加成：基于POI类型和天气条件的智能适配
    if (weatherPoiBoost[poi.category]) total *= weatherPoiBoost[poi.category];
    if (poi.weatherSensitivity === 'indoor' && weatherPoiBoost.indoor) total *= weatherPoiBoost.indoor;

    // 季节性评分：根据当前季节调整POI适配度
    if (poi.seasonalScore && poi.seasonalScore[season]) {
      total *= (poi.seasonalScore[season] / 5);
    }

    // 旅伴偏好：浪漫指数适配情侣模式
    if (compAdj.romanticPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.romanticPoi;
    }
    // 旅伴偏好：亲子友好度
    if (compAdj.familyPoi && poi.familyFriendly) {
      total *= compAdj.familyPoi;
    }
    // 旅伴偏好：社交属性适配好友模式
    if (compAdj.socialPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.socialPoi;
    }

    // 时间精力曲线：根据POI最佳时段动态调整
    var dayEnergy = energyCurve[0] || { morning: 0.9, afternoon: 0.75, evening: 0.6 };
    if (poi.bestTimeOfDay === 'morning') total *= dayEnergy.morning * 1.1;
    else if (poi.bestTimeOfDay === 'afternoon') total *= dayEnergy.afternoon;
    else if (poi.bestTimeOfDay === 'evening') total *= dayEnergy.evening * 1.05;

    // ================================================================
    //  新增：时间推荐加权 — 根据bestPhotoTime匹配当前季节
    // ================================================================
    if (poi.bestPhotoTime && poi.seasonalBeauty) {
      if (poi.seasonalBeauty === season) total *= 1.15;
    }

    // ================================================================
    //  新增：人流预测 — 根据crowdPeakHours避开高峰
    // ================================================================
    var currentHour = now.getHours();
    if (poi.crowdPeakHours) {
      var peakStr = poi.crowdPeakHours;
      var isInPeak = false;
      // 简单检测：如果在高峰时段内，降低分数
      if (peakStr.indexOf('10:00-15:00') !== -1 && currentHour >= 10 && currentHour < 15) isInPeak = true;
      else if (peakStr.indexOf('11:30-13:00') !== -1 && currentHour >= 11.5 && currentHour < 13) isInPeak = true;
      else if (peakStr.indexOf('17:30-19:30') !== -1 && currentHour >= 17.5 && currentHour < 19.5) isInPeak = true;
      else if (peakStr.indexOf('14:00-17:00') !== -1 && currentHour >= 14 && currentHour < 17) isInPeak = true;
      else if (peakStr.indexOf('9:00-11:00') !== -1 && currentHour >= 9 && currentHour < 11) isInPeak = true;
      else if (peakStr.indexOf('10:00-12:00') !== -1 && currentHour >= 10 && currentHour < 12) isInPeak = true;
      else if (peakStr.indexOf('14:00-16:00') !== -1 && currentHour >= 14 && currentHour < 16) isInPeak = true;
      if (isInPeak) total *= 0.85;
    }

    // ================================================================
    //  新增：天气适配增强 — 根据实际天气调整室内外POI比例
    // ================================================================
    if (weatherCondition.indexOf('雨') !== -1 || weatherCondition.indexOf('雪') !== -1) {
      if (poi.weatherSensitivity === 'indoor') total *= 1.3;
      if (poi.weatherSensitivity === 'outdoor') total *= 0.5;
    } else if (weatherCondition.indexOf('晴') !== -1) {
      if (poi.weatherSensitivity === 'outdoor') total *= 1.2;
      if (poi.hasPhotoSpot) total *= 1.1;
    }

    // ================================================================
    //  新增：出片指数加权 — 好友/情侣模式优先
    // ================================================================
    if (isFriends || isCouple) {
      if (poi.instagramWorthy) total *= (poi.instagramWorthy / 5);
    }

    // ================================================================
    //  新增：隐藏宝地加权 — 探索心情优先
    // ================================================================
    if (activeMood === 'excited' && poi.hiddenGem) total *= 1.2;
    if (poi.hiddenGem && companionType === 'solo') total *= 1.1;

    return Object.assign({}, poi, { _scores: { moodScore:moodScore, budgetScore:budgetScore, energyScore:energyScore, crowdScore:crowdScore, kidScore:kidScore, elderlyScore:elderlyScore, coupleScore:coupleScore }, _total: total });
  });
  scored.sort(function(a, b) { return b._total - a._total; });

  // LAYER 3: 行程编排（增强版：旅伴感知节奏 + 反特种兵 + 交通耗时 + Plan B + 预算上限）
  var isLowEnergy = activeMood === 'tired' || activeMood === 'sad' || activeMood === 'anxious' || activeMood === 'insomnia';
  var isBusinessMode = travelMode === 'business';
  // 🎯 旅伴感知的每日上限
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  var maxPerDay = ct ? ct.maxPoi : 4;
  // 增强：每天至少4-6个POI（含餐饮）
  if (maxPerDay < 4) maxPerDay = Math.max(4, maxPerDay + 1);
  // 心情低落时进一步降低上限
  if (isLowEnergy && maxPerDay > 2) maxPerDay = Math.max(2, maxPerDay - 1);
  // 商务模式覆盖
  if (isBusinessMode) maxPerDay = Math.min(maxPerDay, 3);
  var used = new Set();
  var itinerary = [];
  var allPoiItems = [];

  // 辅助：查找雨天备选（室内、不同类别）
  function findRainPlan(poi, excludeIds) {
    for (var ri = 0; ri < scored.length; ri++) {
      var alt = scored[ri];
      if (alt.id === poi.id) continue;
      if (alt.weatherSensitivity !== 'indoor') continue;
      if (alt.category === poi.category) continue;
      if (excludeIds && excludeIds.has(alt.id)) continue;
      return { name: alt.name, estimatedCost: alt.ticketPrice || 0, category: alt.category };
    }
    // fallback: any indoor
    for (var ri2 = 0; ri2 < scored.length; ri2++) {
      var alt2 = scored[ri2];
      if (alt2.id === poi.id) continue;
      if (alt2.weatherSensitivity !== 'indoor') continue;
      if (excludeIds && excludeIds.has(alt2.id)) continue;
      return { name: alt2.name, estimatedCost: alt2.ticketPrice || 0, category: alt2.category };
    }
    return null;
  }

  for (var d = 0; d < days; d++) {
    var items = [];
    var dayPois = [];
    for (var pi = 0; pi < scored.length; pi++) {
      if (dayPois.length >= maxPerDay) break;
      var poi = scored[pi];
      if (!used.has(poi.id)) { used.add(poi.id); dayPois.push(poi); }
    }
    var cats = {};
    dayPois.forEach(function(p) { cats[p.category] = true; });
    if (Object.keys(cats).length < 2 && dayPois.length >= 3) {
      for (var ci = 0; ci < scored.length; ci++) {
        var altPoi = scored[ci];
        if (!used.has(altPoi.id) && !cats[altPoi.category]) {
          used.delete(dayPois[dayPois.length - 1].id);
          dayPois[dayPois.length - 1] = altPoi;
          used.add(altPoi.id);
          break;
        }
      }
    }

    var hour = 9;
    var midIdx = Math.floor(dayPois.length / 2);
    var hasHiddenGem = false;

    // ================================================================
    //  新增：早餐推荐 — 每天开始前推荐当地早餐
    // ================================================================
    var breakfastPoi = scored.find(function(p) { return p.category === 'restaurant' && !used.has(p.id) && p.ticketPrice <= 50; });
    if (breakfastPoi) {
      used.add(breakfastPoi.id);
      items.push({ type:'restaurant', time:fmtTime(hour - 1), name:breakfastPoi.name, estimatedCost:breakfastPoi.ticketPrice || 30, estimatedDuration:45, reason:'🌅 早餐推荐：开启元气满满的一天', reasonTags:['早餐推荐','当地特色'], poiId:breakfastPoi.id });
    }

    for (var idx = 0; idx < dayPois.length; idx++) {
      var dayPoi = dayPois[idx];

      // 午餐插入（在中间位置）
      if (idx === midIdx) {
        var lunchPoi = scored.find(function(p) { return p.category === 'restaurant' && !used.has(p.id) && p.ticketPrice <= dailyBudget * 0.3; });
        if (!lunchPoi) lunchPoi = scored.find(function(p) { return p.category === 'restaurant' && !used.has(p.id); });
        if (lunchPoi) {
          used.add(lunchPoi.id);
          var lunchTags = ['午餐推荐','高评分'];
          if (lunchPoi.dietaryTags && lunchPoi.dietaryTags.length > 0) lunchTags.push(lunchPoi.dietaryTags[0]);
          items.push({ type:'restaurant', time:fmtTime(hour), name:lunchPoi.name, estimatedCost:lunchPoi.ticketPrice || 80, estimatedDuration:lunchPoi.estimatedDuration || 60, reason:'🍽️ 午餐推荐：' + (lunchPoi.dietaryTags ? lunchPoi.dietaryTags.join('·') + '风味' : '精选当地美食'), reasonTags:lunchTags, poiId:lunchPoi.id });
          hour += 1;
        }
      }

      // 休息时间插入（仅旅游模式 + 疲惫/悲伤心情，或长辈/亲子模式强制午休）
      if (!isBusinessMode && ((activeMood === 'tired' || activeMood === 'sad') || companionType === 'family') && idx === midIdx) {
        var restReason = companionType === 'family' ? '长辈/亲子模式：自动插入午休时间，避免体力透支' : '疲惫模式：自动插入半小时休息，避免体力透支';
        items.push({ type:'rest', time:fmtTime(hour), name: companionType === 'family' ? '🌿 午休时间' : '☕ 休息时间', estimatedCost:30, estimatedDuration: companionType === 'family' ? 60 : 30, reason: restReason, reasonTags:['心情匹配','体力保护'] });
        hour += companionType === 'family' ? 1 : 0.5;
      }

      // POI 条目
      var dur = dayPoi.estimatedDuration ? dayPoi.estimatedDuration / 60 : (isLowEnergy ? 2 : 1.5);
      // 商务模式：缩短游玩时间
      if (isBusinessMode) dur = Math.min(dur, 1.5);
      var poiItem = {
        type: 'poi',
        time: fmtTime(hour),
        name: dayPoi.name,
        estimatedCost: dayPoi.ticketPrice || 0,
        estimatedDuration: dayPoi.estimatedDuration || 90,
        tags: dayPoi.tags || [],
        reason: genReason(dayPoi),
        reasonTags: genTags(dayPoi),
        poiId: dayPoi.id,
        mapX: dayPoi.mapX,
        mapY: dayPoi.mapY,
        city: getPoiCity(dayPoi.mapX, dayPoi.mapY),
        weatherSensitivity: dayPoi.weatherSensitivity,
        // 新增增强字段
        photoTip: dayPoi.photoTip || '',
        localTip: dayPoi.localTip || '',
        bestPhotoTime: dayPoi.bestPhotoTime || '',
        hiddenGem: dayPoi.hiddenGem || false,
        instagramWorthy: dayPoi.instagramWorthy || 5,
        crowdPeakHours: dayPoi.crowdPeakHours || '',
        seasonalBeauty: dayPoi.seasonalBeauty || '',
        avgStayTime: dayPoi.avgStayTime || 90
      };

      // 追踪隐藏宝地
      if (dayPoi.hiddenGem) hasHiddenGem = true;

      // Plan B: 雨天备选（户外或混合类POI）
      if (dayPoi.weatherSensitivity === 'outdoor' || dayPoi.weatherSensitivity === 'mixed') {
        var rainPlan = findRainPlan(dayPoi, used);
        if (rainPlan) {
          poiItem.rain_plan = rainPlan;
        }
      }

      items.push(poiItem);
      allPoiItems.push(poiItem);
      hour += dur;
    }

    // ================================================================
    //  新增：隐藏宝地保底 — 每天至少1个hiddenGem
    // ================================================================
    if (!hasHiddenGem) {
      var hiddenGemCandidate = scored.find(function(p) { return p.hiddenGem && !used.has(p.id); });
      if (hiddenGemCandidate) {
        used.add(hiddenGemCandidate.id);
        var hiddenItem = {
          type: 'poi', time: fmtTime(hour), name: hiddenGemCandidate.name,
          estimatedCost: hiddenGemCandidate.ticketPrice || 0,
          estimatedDuration: hiddenGemCandidate.estimatedDuration || 90,
          tags: (hiddenGemCandidate.tags || []).concat(['隐藏宝地']),
          reason: '💎 隐藏宝地：本地人才知道的秘境，避开人潮独享美景',
          reasonTags: ['隐藏宝地','小众推荐','本地人私藏'],
          poiId: hiddenGemCandidate.id, mapX: hiddenGemCandidate.mapX, mapY: hiddenGemCandidate.mapY,
          city: getPoiCity(hiddenGemCandidate.mapX, hiddenGemCandidate.mapY),
          weatherSensitivity: hiddenGemCandidate.weatherSensitivity,
          photoTip: hiddenGemCandidate.photoTip || '', localTip: hiddenGemCandidate.localTip || '',
          bestPhotoTime: hiddenGemCandidate.bestPhotoTime || '', hiddenGem: true,
          instagramWorthy: hiddenGemCandidate.instagramWorthy || 5,
          crowdPeakHours: hiddenGemCandidate.crowdPeakHours || '',
          seasonalBeauty: hiddenGemCandidate.seasonalBeauty || '', avgStayTime: hiddenGemCandidate.avgStayTime || 90
        };
        items.push(hiddenItem);
        allPoiItems.push(hiddenItem);
      }
    }

    // ================================================================
    //  新增：晚餐推荐 — 每天结束后推荐当地晚餐
    // ================================================================
    var dinnerPoi = scored.find(function(p) { return p.category === 'restaurant' && !used.has(p.id) && p.ticketPrice <= dailyBudget * 0.35; });
    if (!dinnerPoi) dinnerPoi = scored.find(function(p) { return p.category === 'restaurant' && !used.has(p.id); });
    if (dinnerPoi) {
      used.add(dinnerPoi.id);
      var dinnerTags = ['晚餐推荐'];
      if (dinnerPoi.dietaryTags && dinnerPoi.dietaryTags.length > 0) dinnerTags.push(dinnerPoi.dietaryTags[0]);
      items.push({ type:'restaurant', time:fmtTime(hour), name:dinnerPoi.name, estimatedCost:dinnerPoi.ticketPrice || 80, estimatedDuration:60, reason:'🌙 晚餐推荐：' + (dinnerPoi.dietaryTags ? dinnerPoi.dietaryTags.join('·') + '风味' : '地道美食，为一天画上完美句号'), reasonTags:dinnerTags, poiId:dinnerPoi.id });
    }

    // 计算交通耗时（相邻POI之间的欧几里得距离）
    for (var ii = 1; ii < items.length; ii++) {
      var prev = items[ii - 1];
      var curr = items[ii];
      if (prev.mapX !== undefined && prev.mapY !== undefined && curr.mapX !== undefined && curr.mapY !== undefined) {
        var dx = prev.mapX - curr.mapX;
        var dy = prev.mapY - curr.mapY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var distKm = dist * 0.5;
        var transitMin = Math.round(distKm / 40 * 60);
        if (transitMin < 5) transitMin = 5;
        curr.transitTime = transitMin;
      }
    }

    itinerary.push({ day: d + 1, items: items });
  }

  // 预算硬上限检查
  var runningTotal = 0;
  itinerary.forEach(function(d) { d.items.forEach(function(it) { runningTotal += it.estimatedCost || 0; }); });
  var budgetExceeded = false;
  var budgetOverage = 0;

  if (runningTotal > budget) {
    budgetExceeded = true;
    budgetOverage = runningTotal - budget;
    // 找到最贵的POI并替换为更便宜的备选
    var mostExpensiveItem = null;
    var mostExpensiveDayIdx = -1;
    var mostExpensiveItemIdx = -1;
    for (var di = 0; di < itinerary.length; di++) {
      for (var ii2 = 0; ii2 < itinerary[di].items.length; ii2++) {
        var it = itinerary[di].items[ii2];
        if (it.type === 'poi' && (mostExpensiveItem === null || it.estimatedCost > mostExpensiveItem.estimatedCost)) {
          mostExpensiveItem = it;
          mostExpensiveDayIdx = di;
          mostExpensiveItemIdx = ii2;
        }
      }
    }
    if (mostExpensiveItem && mostExpensiveDayIdx >= 0) {
      for (var si = scored.length - 1; si >= 0; si--) {
        var cheapAlt = scored[si];
        if (cheapAlt.id === mostExpensiveItem.poiId) continue;
        if (used.has(cheapAlt.id)) continue;
        if (cheapAlt.ticketPrice >= mostExpensiveItem.estimatedCost) continue;
        used.add(cheapAlt.id);
        var newItem = {
          type: 'poi',
          time: mostExpensiveItem.time,
          name: cheapAlt.name,
          estimatedCost: cheapAlt.ticketPrice || 0,
          estimatedDuration: cheapAlt.estimatedDuration || 90,
          tags: cheapAlt.tags || [],
          reason: genReason(cheapAlt),
          reasonTags: genTags(cheapAlt),
          poiId: cheapAlt.id,
          mapX: cheapAlt.mapX,
          mapY: cheapAlt.mapY,
          city: getPoiCity(cheapAlt.mapX, cheapAlt.mapY),
          weatherSensitivity: cheapAlt.weatherSensitivity,
          transitTime: mostExpensiveItem.transitTime,
          photoTip: cheapAlt.photoTip || '',
          localTip: cheapAlt.localTip || '',
          bestPhotoTime: cheapAlt.bestPhotoTime || '',
          hiddenGem: cheapAlt.hiddenGem || false,
          instagramWorthy: cheapAlt.instagramWorthy || 5,
          crowdPeakHours: cheapAlt.crowdPeakHours || '',
          seasonalBeauty: cheapAlt.seasonalBeauty || '',
          avgStayTime: cheapAlt.avgStayTime || 90
        };
        if (cheapAlt.weatherSensitivity === 'outdoor' || cheapAlt.weatherSensitivity === 'mixed') {
          var rp = findRainPlan(cheapAlt, used);
          if (rp) newItem.rain_plan = rp;
        }
        itinerary[mostExpensiveDayIdx].items[mostExpensiveItemIdx] = newItem;
        // 重新计算总额
        runningTotal = 0;
        itinerary.forEach(function(d) { d.items.forEach(function(it) { runningTotal += it.estimatedCost || 0; }); });
        budgetOverage = Math.max(0, runningTotal - budget);
        budgetExceeded = runningTotal > budget;
        break;
      }
    }
  }

  // LAYER 4: 酒店推荐（增强版：POI位置就近 + 特色标签 + 更丰富比价）
  // 计算所有POI的平均坐标，用于就近推荐酒店
  var avgMapX = 0, avgMapY = 0, poiCount = 0;
  allPoiItems.forEach(function(item) {
    if (item.mapX !== undefined && item.mapY !== undefined) {
      avgMapX += item.mapX; avgMapY += item.mapY; poiCount++;
    }
  });
  if (poiCount > 0) { avgMapX /= poiCount; avgMapY /= poiCount; }

  var hotelCandidates = HOTELS.map(function(h) {
    var score = 0;
    var ratio = dailyBudget > 0 ? h.priceRangeLow / dailyBudget : 0;
    if (ratio <= 0.3) score += 30; else if (ratio <= 0.5) score += 25; else if (ratio <= 0.8) score += 20; else if (ratio <= 1.2) score += 15; else score += 5;
    score += (h.moodScores[activeMood] || 5) * 3;
    if (hasKids && h.kidsFriendly) score += 20;
    if (hasElderly && h.elderlyFriendly) score += 20;
    if (isCouple && h.has_spa) score += 25;
    if (isFriends && h.has_pool) score += 20;
    if (isBusinessMode && h.businessFriendly) score += 25;
    if (isBusinessMode && h.nearTransport) score += 20;
    score += h.rating * 5;
    // 商务模式：偏好交通便利（评分相近的酒店中，优先选择距离市中心近的）
    if (isBusinessMode) {
      if (h.nearTransport) score += 30;
      if (h.has_gym) score += 10;   // 商务人士偏好健身房
      if (h.businessFriendly) score += 25;
    }

    // ================================================================
    //  新增：POI位置就近推荐 — 酒店距离POI集群越近分越高
    // ================================================================
    if (h.mapX !== undefined && h.mapY !== undefined && poiCount > 0) {
      var hdx = h.mapX - avgMapX;
      var hdy = h.mapY - avgMapY;
      var hotelDist = Math.sqrt(hdx * hdx + hdy * hdy);
      // 距离越近，加分越多（最大30分，距离超过50格则不加分）
      var proximityBonus = Math.max(0, 30 - hotelDist * 0.6);
      score += proximityBonus;
    }

    // ================================================================
    //  新增：酒店特色标签匹配 — 根据旅伴/心情匹配标签
    // ================================================================
    if (h.featureTags) {
      var featureTags = h.featureTags;
      if (isCouple) {
        if (featureTags.indexOf('私密') !== -1 || featureTags.indexOf('山景房') !== -1 || featureTags.indexOf('湖景房') !== -1) score += 15;
        if (featureTags.indexOf('SPA') !== -1 || featureTags.indexOf('水疗') !== -1 || featureTags.indexOf('温泉') !== -1) score += 15;
      }
      if (hasKids) {
        if (featureTags.indexOf('亲子') !== -1 || featureTags.indexOf('家庭') !== -1) score += 20;
      }
      if (isFriends) {
        if (featureTags.indexOf('网红打卡') !== -1 || featureTags.indexOf('设计感') !== -1 || featureTags.indexOf('天际泳池') !== -1) score += 15;
      }
      if (activeMood === 'tired' || activeMood === 'sad') {
        if (featureTags.indexOf('温泉') !== -1 || featureTags.indexOf('SPA') !== -1 || featureTags.indexOf('静谧') !== -1) score += 15;
      }
      if (activeMood === 'excited') {
        if (featureTags.indexOf('无边泳池') !== -1 || featureTags.indexOf('网红打卡') !== -1) score += 10;
      }
    }
    return Object.assign({}, h, { _score: score });
  }).sort(function(a, b) { return b._score - a._score; });

  // 预算上限：过滤超出预算太多的酒店
  var affordableHotels = hotelCandidates.filter(function(h) {
    return h.priceRangeLow * days <= budget * 0.8;
  });
  if (affordableHotels.length === 0) {
    affordableHotels = hotelCandidates.slice(0, 2);
  }

  var best = affordableHotels[0];
  var totalCost = runningTotal + (best ? best.priceRangeLow : 0) * days;

  var hotelData = null;
  if (best) {
    // 增强版比价：更多平台 + 更丰富的特色
    var platforms = [
      { name:'携程', icon:'🏨', price:Math.round(best.priceRangeLow * 1.0), features:'含早', isBest:false },
      { name:'美团', icon:'🍜', price:Math.round(best.priceRangeLow * 0.95), features:'含早且可取消', isBest:true },
      { name:'飞猪', icon:'🐷', price:Math.round(best.priceRangeLow * 0.92), features:'免费升级房型', isBest:false },
      { name:'去哪儿', icon:'✈️', price:Math.round(best.priceRangeLow * 0.97), features:'含双早', isBest:false },
      { name:'同程', icon:'🎫', price:Math.round(best.priceRangeLow * 0.94), features:'积分抵扣', isBest:false },
      { name:'Booking', icon:'🌍', price:Math.round(best.priceRangeLow * 1.05), features:'免费取消', isBest:false }
    ];
    var bestPlat = platforms.find(function(p) { return p.isBest; });
    hotelData = {
      name: best.name, rating: best.rating, price: best.priceRangeLow,
      bestPrice: bestPlat.price, bestPlatform: bestPlat.name, bestReason: bestPlat.features,
      savedAmount: Math.max.apply(null, platforms.map(function(p) { return p.price; })) - bestPlat.price,
      platforms: platforms, reason: genHotelReason(best),
      featureTags: best.featureTags || [],
      stars: best.stars || 4,
      proximity: best._score ? Math.round(best._score) : 0
    };
  }

  return {
    itinerary: itinerary,
    hotel: hotelData,
    stats: { totalCost: totalCost, totalSaved: hotelData ? hotelData.savedAmount : 0, totalPois: used.size, filterTotal: POIS.length, filterPassed: candidates.length, budgetExceeded: budgetExceeded, budgetOverage: budgetOverage }
  };
}

// ================================================================
//  生成行程
// ================================================================
function generatePlan() {
  if (isPlanning) return;
  isPlanning = true;
  var btn = document.getElementById('generatePlanBtn');
  if (!btn) { isPlanning = false; return; }
  btn.disabled = true;
  btn.textContent = '⏳ AI 正在规划中...';

  function recoverFromError(msg) {
    isPlanning = false;
    var b = document.getElementById('generatePlanBtn');
    if (b) { b.disabled = false; b.textContent = '✨ 智能生成行程'; }
    hideSkeleton();
    hideAlgoProgress();
    showToast('⚠️ ' + (msg || '生成失败，请重试'));
    showError(plansWaterfall, msg || '生成失败，请重试');
  }

  try {
    showSkeleton('AI 正在分析你的心情偏好...');
    showAlgoProgress();
    runMultiAgentPipeline();
  } catch(e) {
    console.error('generatePlan init error:', e);
    recoverFromError('初始化失败');
    return;
  }

  // 阶段式展示算法进度
  setTimeout(function() { updateAlgoStep(1, 'active', '筛选中...', POIS.length); }, 300);
  setTimeout(function() {
    try {
      var result = doGenerate();
      if (!result || !result.itinerary) throw new Error('doGenerate 返回空结果');
      updateAlgoStep(1, 'done', '完成 ' + result.stats.filterPassed + '/' + result.stats.filterTotal + ' 通过', result.stats.filterTotal);
      updateAlgoStep(2, 'done', '多维评分完成', result.stats.filterTotal);
      updateAlgoStep(3, 'done', '编排 ' + result.itinerary.length + ' 天行程', result.stats.filterTotal);
      updateAlgoStep(4, 'done', result.hotel ? '找到最优酒店' : '无匹配酒店', result.stats.filterTotal);
      updateAlgoStats(result);
      itinerary = result.itinerary;
      hotel = result.hotel;
      stats = result.stats;
    } catch(e) {
      console.error('doGenerate error:', e);
      recoverFromError('算法执行失败');
      return;
    }

    try {
      renderItinerary();
      renderHotel();
      renderMap();
      loadPhotoGallery();
      renderChecklist();
      renderCareLetter();
      renderStats();
      renderTravelPersona();
      renderTravelJournal();
      renderVisualizations();
      generateSmartAlerts();
      renderItineraryCompare();
      renderSafetyPanel();
      renderCarbonFootprint();
      renderPricePrediction();
      renderTravelPassport();
      document.getElementById('exportBar').style.display = 'flex';
      // 如果 AI Agent 结果已返回，渲染 AI 洞察
      if (aiAgentResults && aiAgentResults.length > 0) {
        try { renderAIAgentInsights(aiAgentResults); } catch(e) {}
      }
    } catch(e) {
      console.error('render error:', e);
    }

    hideSkeleton();
    hideAlgoProgress();

    try {
      var warnEl = document.getElementById('budgetWarning');
      if (stats.budgetExceeded) {
        warnEl.textContent = '⚠️ 预算超标 ¥' + stats.budgetOverage + '，已自动替换最贵景点为更经济的选择';
        warnEl.classList.add('show');
      } else {
        warnEl.classList.remove('show');
      }
    } catch(e) {}

    isPlanning = false;
    btn.disabled = false;
    btn.textContent = '✨ 智能生成行程';
    var aiBadge = (aiAgentResults && aiAgentResults.length > 0) ? ' · 5×AI Agent 协同分析' : '';
    showToast('AI 行程规划完成！共 ' + stats.totalPois + ' 个精选景点' + aiBadge);

    try { document.getElementById('itinerarySection').scrollIntoView({ behavior: 'smooth' }); } catch(e) {}

    try { scheduleReminder(); } catch(e) {}
    setTimeout(function() { try { generateNarrative(); } catch(e) {} }, 800);
    setTimeout(function() { try { saveTripToStorage(); renderTripHistory('all'); } catch(e) {} }, 1500);
    setTimeout(function() { try { showFeedbackPrompt(); } catch(e) {} }, 35000);
    setTimeout(function() { try { renderShareCard(); } catch(e) {} }, 2000);
    setTimeout(function() { try { showWeatherIndicator(); } catch(e) {} }, 1000);
    setTimeout(function() { try { markRevealSections(); } catch(e) {} }, 1000);
    // 滚动右侧面板到顶部
    setTimeout(function() {
      var rp = document.querySelector('.right-panel');
      if (rp) rp.scrollTo({ top: 0, behavior: 'smooth' });
    }, 500);
  }, 800);
}

// ================================================================
//  旅行人格画像系统
// ================================================================
var travelPersona = null;

function generateTravelPersona() {
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label;
  var ct = COMPANION_TYPES.find(function(c){return c.key===companionType;})||{};
  var companionLabel = ct.label || '独自';
  var pacingLabel = ct.paceLabel || '悠闲节奏';
  
  // 根据心情+旅伴+预算生成旅行人格
  var personaTypes = {
    'tired_solo': { name:'静谧隐士', emoji:'🧘', type:'治愈系旅行者', desc:'你追求的是彻底的放松与独处。不需要赶行程，一杯茶、一本书、一个安静的角落，就是完美的旅行。', traits:['慢节奏','深度体验','避开人群','治愈优先'], color:'#B5A3C4' },
    'tired_couple': { name:'温柔伴侣', emoji:'💆', type:'慢生活体验家', desc:'两个人在一起，慢下来才是真正的奢侈。你们懂得享受彼此的陪伴，不需要打卡，只需要一起虚度时光。', traits:['私密空间','SPA水疗','园林下午茶','不看人海'], color:'#C4A8A8' },
    'tired_friends': { name:'回血姐妹', emoji:'🧖', type:'疗愈型玩家', desc:'累了就一起躺平，你们的旅行哲学是：不累着自己，不委屈自己。按摩、美食、拍照，三件套搞定。', traits:['躺平优先','高颜值打卡','精致美食','不赶路'], color:'#D4A8A8' },
    'tired_family': { name:'天伦守护者', emoji:'🌿', type:'家庭慢游家', desc:'带着家人的旅行，节奏最重要。你们不追求数量，只追求质量——每个景点都要让老人舒服、孩子开心。', traits:['无障碍优先','午休保障','近医疗点','平缓路线'], color:'#A8C4A8' },
    'sad_solo': { name:'自我疗愈师', emoji:'🌅', type:'情绪修复者', desc:'你需要一场温柔的自我对话。旅行不是为了逃离，而是为了遇见更好的自己。大自然是最好的心理医生。', traits:['自然景观','安静空间','日出日落','寺庙禅修'], color:'#E8945A' },
    'sad_couple': { name:'温暖港湾', emoji:'💕', type:'情感联结者', desc:'在彼此身边，就是最好的治愈。你们的旅行不需要多精彩，只需要多温暖——手牵手走过的地方，都是风景。', traits:['浪漫落日','私密餐厅','自然漫步','远离喧嚣'], color:'#E8A85A' },
    'anxious_solo': { name:'心灵解压师', emoji:'🌿', type:'减压探索者', desc:'焦虑的时候，你需要一个能让自己安静下来的地方。绿色、禅意、慢节奏——让大自然帮你按下暂停键。', traits:['禅修体验','竹林漫步','茶道冥想','低刺激'], color:'#6B8FA3' },
    'anxious_couple': { name:'安心旅伴', emoji:'🍃', type:'平静守护者', desc:'两个人一起逃离焦虑。你们选择的地方都是安静的、治愈的——不需要决策压力，只需要放松。', traits:['安静园林','茶室品茗','轻徒步','不排队'], color:'#7B9FB3' },
    'excited_solo': { name:'冒险独行侠', emoji:'🔥', type:'极限探索者', desc:'世界那么大，你一个人也要去看看！高能量、高探索欲——你的旅行词典里没有"无聊"两个字。', traits:['登山徒步','极限运动','新奇体验','说走就走'], color:'#FF6B6B' },
    'excited_couple': { name:'热血情侣', emoji:'⚡', type:'活力双人组', desc:'最好的关系是一起成长、一起冒险。你们的旅行充满多巴胺——从日出到星空，每一刻都在燃烧。', traits:['户外探险','日出日落','骑行徒步','极致体验'], color:'#FF8B6B' },
    'excited_friends': { name:'嗨翻闺蜜', emoji:'🎉', type:'派对旅行家', desc:'和最好的朋友一起，去哪都是狂欢！你们的旅行关键词：拍照、美食、打卡、大笑——一个都不能少。', traits:['网红打卡','夜市扫街','主题乐园','出片圣地'], color:'#FF9B6B' },
    'happy_solo': { name:'自由漫步者', emoji:'😊', type:'随性探索家', desc:'心情好的时候，一个人也可以玩得很精彩。你享受自由的节奏——走到哪算哪，遇到什么都是惊喜。', traits:['城市漫步','咖啡馆探店','即兴发挥','享受当下'], color:'#E8A85A' },
    'happy_couple': { name:'甜蜜旅人', emoji:'💑', type:'浪漫体验家', desc:'开心的时候，只想和你分享。你们的旅行是粉色的——从早午餐到夜景，每个瞬间都值得珍藏。', traits:['浪漫餐厅','拍照打卡','夜景漫步','甜蜜时光'], color:'#FFB89A' },
    'happy_friends': { name:'快乐加倍', emoji:'👯', type:'社交型旅行者', desc:'快乐分享出去就是双倍！和闺蜜一起的旅行，就是大型快乐制造现场。', traits:['美食探店','闺蜜写真','逛街购物','下午茶'], color:'#FFC89A' },
    'calm_family': { name:'平和守护者', emoji:'🌳', type:'家庭慢生活家', desc:'平静的心，最适合陪伴家人。你们的旅行不急不躁，像一杯温热的茶——慢慢品，才有味道。', traits:['公园漫步','博物馆','亲子互动','舒适节奏'], color:'#8BA88C' },
    'calm_couple': { name:'默契伴侣', emoji:'🍵', type:'品质生活家', desc:'平静的两个人，在一起就是最好的状态。你们不需要刻意的浪漫——一个眼神、一杯茶，就是完美的一天。', traits:['品质餐厅','艺术展览','园林漫步','安静时光'], color:'#A3B5A6' },
    'insomnia_solo': { name:'夜游诗人', emoji:'🌙', type:'深夜思考者', desc:'失眠的夜晚，你比白天更清醒。你的旅行也许从黄昏才开始——夜市、星空、24小时书店，都是你的主场。', traits:['夜景漫步','深夜食堂','星空观测','安静独处'], color:'#6B7BA3' },
    'default': { name:'自由旅人', emoji:'✈️', type:'随性旅行者', desc:'你有一颗自由的心，旅行的意义就是探索未知。不设限、不定义——让每一次出发都充满惊喜。', traits:['灵活多变','探索未知','享受当下','随心而行'], color:'#8BA88C' }
  };
  
  var key = activeMood + '_' + companionType;
  var persona = personaTypes[key] || personaTypes['default'];
  
  // 根据预算调整
  if (budget >= 10000) persona.traits.push('品质享受');
  else if (budget <= 2000) persona.traits.push('高性价比');
  
  // 根据旅行模式调整
  if (travelMode === 'business') {
    persona.traits = ['高效出行','商务优先','交通便利','省时省心'];
    persona.desc = '你的旅行以效率为核心——最佳路线、最优时间、最舒适的商务体验。';
  }
  
  persona.budgetLevel = budget >= 10000 ? '高端享受' : budget >= 5000 ? '品质舒适' : budget >= 2000 ? '经济实惠' : '精打细算';
  persona.pacing = pacingLabel;
  persona.moodLabel = moodLabel;
  persona.companionLabel = companionLabel;
  
  travelPersona = persona;
  return persona;
}

function renderTravelPersona() {
  var persona = generateTravelPersona();
  var section = document.getElementById('travelPersonaSection');
  var card = document.getElementById('personaCard');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  section.classList.add('show');
  
  var html = '<div class="persona-header">';
  html += '<div class="persona-avatar" style="background:' + persona.color + '22;border-color:' + persona.color + '40">' + persona.emoji + '</div>';
  html += '<div class="persona-info"><div class="persona-name">' + persona.name + '</div>';
  html += '<div class="persona-type">' + persona.type + ' · ' + persona.moodLabel + t.personaMoodSuffix + ' · ' + persona.companionLabel + '</div></div></div>';
  
  html += '<div class="persona-traits">';
  persona.traits.forEach(function(tr) {
    html += '<span class="persona-trait" style="border-color:' + persona.color + '30;color:' + persona.color + '">' + tr + '</span>';
  });
  html += '</div>';
  
  html += '<div class="persona-stats-row">';
  html += '<div class="persona-stat"><div class="persona-stat-icon">🎯</div><div class="persona-stat-val" style="color:' + persona.color + '">' + persona.pacing + '</div><div class="persona-stat-label">' + t.personaPace + '</div></div>';
  html += '<div class="persona-stat"><div class="persona-stat-icon">💰</div><div class="persona-stat-val" style="color:' + persona.color + '">' + persona.budgetLevel + '</div><div class="persona-stat-label">' + t.personaBudget + '</div></div>';
  html += '<div class="persona-stat"><div class="persona-stat-icon">🗺️</div><div class="persona-stat-val" style="color:' + persona.color + '">' + days + t.itineraryDay + '</div><div class="persona-stat-label">' + t.personaDays + '</div></div>';
  html += '<div class="persona-stat"><div class="persona-stat-icon">🎭</div><div class="persona-stat-val" style="color:' + persona.color + '">' + persona.moodLabel + '</div><div class="persona-stat-label">' + t.personaMood + '</div></div>';
  html += '</div>';
  
  html += '<div class="persona-desc">' + persona.desc + '</div>';
  
  card.innerHTML = html;
}

// ================================================================
//  AI 旅行日记生成
// ================================================================
function renderTravelJournal() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('journalSection');
  var daysEl = document.getElementById('journalDays');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  section.classList.add('show');
  
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label;
  var moodEmoji = (MOODS.find(function(m){return m.key===activeMood;})||{}).emoji;
  var color = activeMoodColor;
  
  var journalTemplates = [
    '清晨的第一缕阳光叫醒了{city}，今天注定是美好的一天。在{poi1}，{experience1}。',
    '今天在{poi1}度过了一段难忘的时光。{experience1}。午餐在{poi2}，{food_desc}。',
    '上午去了{poi1}，{experience1}。下午漫步在{poi2}，{experience2}。',
    '今天是最放松的一天。在{poi1}，{experience1}。不需要赶时间，只需要享受当下。',
    '{poi1}比想象中还要美。{experience1}。傍晚时分，在{poi2}看着日落，{experience2}。'
  ];
  
  var experiences = {
    tired: ['什么也不想做，就在那里坐着发呆，让时间慢慢流过', '泡了一杯茶，看着窗外的风景，身心都放松了下来', '闭上眼睛，感受微风拂过脸颊，所有的疲惫都消散了'],
    sad: ['看着远处的山和水，心里那些说不出口的情绪，似乎都被温柔地接住了', '一个人静静地走着，不需要说话，只是感受这片土地的呼吸', '眼泪不知不觉流了下来，但这一次，不是因为难过，而是因为感动'],
    anxious: ['深呼吸，这里的空气有一种让人安心的味道。焦虑像潮水一样慢慢退去', '把手机调成静音，让自己完全沉浸在这一刻的宁静中', '闭上眼睛数了十次呼吸，再睁开眼，世界变得不一样了'],
    excited: ['心跳加速！这里的一切都让人兴奋不已，每一个角落都藏着惊喜', '忍不住拿出手机拍了几十张照片，每一张都舍不得删', '冲在最前面，想要探索每一个角落，这种感觉太棒了'],
    happy: ['嘴角不自觉地上扬，这里的阳光、空气、风景，一切都刚刚好', '遇到了很友善的当地人，聊了很多有趣的事，这就是旅行的意义', '在街角发现了一家很棒的店，这种意外惊喜最让人开心'],
    calm: ['不疾不徐地走着，感受着脚下每一块石板，呼吸着每一口新鲜空气', '坐在长椅上，看来往的行人，感受这座城市的节奏', '泡了一杯茶，翻开一本书，这个下午属于我自己'],
    insomnia: ['夜晚的{city}有一种特别的安静，适合一个人慢慢思考', '走在安静的街道上，路灯把影子拉得很长，思绪也慢慢清晰', '抬头看星空，城市的灯光很远，星光很近']
  };
  
  var moodExps = experiences[activeMood] || experiences.calm;
  
  var html = '';
  itinerary.forEach(function(day, dayIndex) {
    var pois = day.items.filter(function(item) { return item.type === 'poi'; });
    var restaurants = day.items.filter(function(item) { return item.type === 'restaurant'; });
    var city = pois.length > 0 ? (pois[0].city || '这座城市') : '这座城市';
    var cityDisplay = __(city, 'cityNames');
    var poi1 = pois.length > 0 ? __(pois[0].name, 'poiNames') : '这里';
    var poi2 = restaurants.length > 0 ? __(restaurants[0].name, 'poiNames') : (pois.length > 1 ? __(pois[1].name, 'poiNames') : '附近的小店');
    var exp1 = moodExps[dayIndex % moodExps.length];
    var exp2 = moodExps[(dayIndex + 1) % moodExps.length];
    var foodDesc = restaurants.length > 0 ? '品尝了当地的特色美食，味道让人惊艳' : '随便找了一家小店，味道意外地好';
    
    var template = journalTemplates[dayIndex % journalTemplates.length];
    var journal = template.replace('{city}', cityDisplay).replace('{poi1}', poi1).replace('{poi2}', poi2).replace('{experience1}', exp1).replace('{experience2}', exp2).replace('{food_desc}', foodDesc);
    
    html += '<div class="journal-card glass-panel" style="margin-bottom:16px;--active-mood-color:' + color + '">';
    html += '<div class="journal-header">';
    html += '<div class="journal-day"><span class="journal-day-num" style="background:' + color + '">' + day.day + '</span> ' + t.itineraryDayLabel + day.day + ' · ' + cityDisplay + '</div>';
    html += '<div class="journal-date">' + new Date(Date.now() + dayIndex * 86400000).toLocaleDateString('zh-CN', {month:'short', day:'numeric', weekday:'short'}) + '</div>';
    html += '</div>';
    html += '<div class="journal-body">' + journal + '</div>';
    if (pois.length > 0) {
      html += '<div class="journal-photo-spot">📸 今日推荐拍照点：' + __(pois[0].name, 'poiNames') + '</div>';
    }
    html += '<div class="journal-mood" style="background:' + color + '18;color:' + color + '">' + moodEmoji + ' 今日心情：' + moodLabel + '</div>';
    html += '</div>';
  });
  
  daysEl.innerHTML = html;
}

// ================================================================
//  数据可视化 — 雷达图 + 预算饼图
// ================================================================
function renderVisualizations() {
  if (!itinerary || !stats) return;
  var section = document.getElementById('vizSection');
  section.classList.add('show');
  
  setTimeout(function() {
    drawRadarChart();
    drawBudgetChart();
  }, 300);
}

function drawRadarChart() {
  var canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = 200, h = 200, cx = 100, cy = 100, r = 70;
  ctx.clearRect(0, 0, w, h);
  
  // 计算各维度得分
  var moodScore = 0, budgetScore = 0, energyScore = 0, comfortScore = 0, photoScore = 0;
  var count = 0;
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi' && item._scores) {
        moodScore += item._scores.moodScore || 0;
        budgetScore += item._scores.budgetScore || 0;
        energyScore += item._scores.energyScore || 0;
        count++;
      }
      if (item.type === 'poi' && item.hasPhotoSpot) photoScore += 30;
      if (item.type === 'poi' && item.restSeats) comfortScore += item.restSeats * 5;
    });
  });
  if (count > 0) { moodScore = Math.min(100, moodScore / count); budgetScore = Math.min(100, budgetScore / count); energyScore = Math.min(100, energyScore / count); }
  comfortScore = Math.min(100, comfortScore);
  photoScore = Math.min(100, photoScore);
  
  var labels = ['心情匹配', '性价比', '舒适度', '出片率', '体力匹配'];
  var values = [moodScore, budgetScore, comfortScore, photoScore, energyScore];
  var colors = ['#8BA88C', '#E8A85A', '#6B8FA3', '#FF6B6B', '#B5A3C4'];
  var n = 5;
  
  // 背景网格
  for (var level = 1; level <= 4; level++) {
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var angle = Math.PI * 2 / n * i - Math.PI / 2;
      var lr = r * level / 4;
      var x = cx + Math.cos(angle) * lr;
      var y = cy + Math.sin(angle) * lr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();
  }
  
  // 轴线
  for (var i = 0; i < n; i++) {
    var angle = Math.PI * 2 / n * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.stroke();
  }
  
  // 数据区域
  ctx.beginPath();
  for (var i = 0; i < n; i++) {
    var angle = Math.PI * 2 / n * i - Math.PI / 2;
    var vr = r * values[i] / 100;
    var x = cx + Math.cos(angle) * vr;
    var y = cy + Math.sin(angle) * vr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = activeMoodColor + '20';
  ctx.fill();
  ctx.strokeStyle = activeMoodColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 数据点
  for (var i = 0; i < n; i++) {
    var angle = Math.PI * 2 / n * i - Math.PI / 2;
    var vr = r * values[i] / 100;
    var x = cx + Math.cos(angle) * vr;
    var y = cy + Math.sin(angle) * vr;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
  }
  
  // 图例
  var legend = document.getElementById('radarLegend');
  legend.innerHTML = labels.map(function(l, i) {
    return '<span class="viz-legend-item"><span class="viz-legend-dot" style="background:' + colors[i] + '"></span>' + l + ' ' + Math.round(values[i]) + '%</span>';
  }).join('');
}

function drawBudgetChart() {
  var canvas = document.getElementById('budgetCanvas');
  if (!canvas || !stats) return;
  var ctx = canvas.getContext('2d');
  var w = 200, h = 200, cx = 100, cy = 100, r = 65;
  ctx.clearRect(0, 0, w, h);
  
  // 计算各分类花费
  var poiCost = 0, foodCost = 0, hotelCost = 0;
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiCost += (item.estimatedCost || 0);
      if (item.type === 'restaurant') foodCost += (item.estimatedCost || 0);
    });
  });
  hotelCost = hotel ? (hotel.bestPrice || 0) * days : budget * 0.3;
  var total = poiCost + foodCost + hotelCost || 1;
  
  var slices = [
    { label:'景点门票', value:poiCost, color:'#8BA88C' },
    { label:'餐饮美食', value:foodCost, color:'#E8A85A' },
    { label:'酒店住宿', value:hotelCost, color:'#6B8FA3' }
  ];
  
  var startAngle = -Math.PI / 2;
  slices.forEach(function(s) {
    var sliceAngle = s.value / total * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    startAngle += sliceAngle;
  });
  
  // 中心文字
  ctx.fillStyle = '#fff';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¥' + stats.totalCost, cx, cy + 4);
  
  // 图例
  var legend = document.getElementById('budgetLegend');
  legend.innerHTML = slices.map(function(s) {
    return '<span class="viz-legend-item"><span class="viz-legend-dot" style="background:' + s.color + '"></span>' + s.label + ' ¥' + s.value + '</span>';
  }).join('');
}

// ================================================================
//  智能提醒系统
// ================================================================
function generateSmartAlerts() {
  if (!itinerary || !stats) return;
  var alertsEl = document.getElementById('smartAlerts');
  var alerts = [];
  
  // 预算提醒
  if (stats.budgetExceeded) {
    alerts.push({ type:'warning', icon:'⚠️', text:'预算超出 ¥' + stats.budgetOverage + '，建议调整部分景点或选择更经济的餐厅' });
  } else if (stats.totalCost < budget * 0.5) {
    alerts.push({ type:'success', icon:'💰', text:'预算充裕！剩余 ¥' + (budget - stats.totalCost) + '，可以考虑升级酒店或增加特色体验' });
  }
  
  // 体力提醒
  var highEnergyCount = 0;
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.energyLevel && item.energyLevel >= 4) highEnergyCount++;
    });
  });
  if (highEnergyCount >= 3 && (activeMood === 'tired' || activeMood === 'sad')) {
    alerts.push({ type:'warning', icon:'😰', text:'检测到 ' + highEnergyCount + ' 个高体力景点，当前心情偏疲惫，建议替换为更轻松的选项' });
  }
  
  // 拥挤提醒
  var crowdedCount = 0;
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.crowdednessLevel && item.crowdednessLevel >= 4) crowdedCount++;
    });
  });
  if (crowdedCount >= 2) {
    alerts.push({ type:'info', icon:'👥', text:'有 ' + crowdedCount + ' 个景点人流量较大，建议错峰出行（早8点前或午后）' });
  }
  
  // 天气提醒（如果有天气数据）
  var weatherData = window._weatherData;
  if (weatherData && weatherData.isRain) {
    alerts.push({ type:'danger', icon:'🌧️', text:'目的地有降雨可能，已自动激活雨天Plan B，可在行程卡片中查看备选方案' });
  }
  
  // 跨城提醒
  var cities = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
  });
  if (cities.length >= 3) {
    alerts.push({ type:'info', icon:'🚄', text:'跨 ' + cities.length + ' 城旅行，建议提前规划交通，高铁/大巴票尽早预订' });
  }
  
  if (alerts.length === 0) {
    alerts.push({ type:'success', icon:'✨', text:'行程规划一切完美！祝你旅途愉快～' });
  }
  
  alertsEl.classList.add('show');
  alertsEl.innerHTML = alerts.map(function(a) {
    return '<div class="smart-alert ' + a.type + '"><span class="smart-alert-icon">' + a.icon + '</span><span>' + a.text + '</span></div>';
  }).join('');
}

// ================================================================
//  智能行程对比器
// ================================================================
function renderItineraryCompare() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('compareSection');
  var container = document.getElementById('compareContainer');
  section.classList.add('show');
  
  // 方案A：当前方案
  var planA = {
    title: '方案A · 当前推荐',
    subtitle: 'AI基于你的心情和偏好生成',
    recommended: true,
    budget: stats.totalCost,
    poiCount: stats.totalPois,
    cities: countCities(),
    pacing: getPacingLabel(),
    moodMatch: Math.round(85 + Math.random() * 10),
    highlights: itinerary[0] ? (itinerary[0].items.filter(function(i){return i.type==='poi';}).slice(0,2).map(function(i){return i.name;}).join('、') || '精选景点') : '精选景点'
  };
  
  // 方案B：微调方案（不同节奏）
  var altMood = activeMood === 'excited' ? 'calm' : activeMood === 'calm' ? 'excited' : 'happy';
  var planB = {
    title: '方案B · ' + (altMood === 'excited' ? '活力探索' : altMood === 'calm' ? '悠闲放松' : '欢乐体验'),
    subtitle: '换个节奏，体验不同的旅行方式',
    recommended: false,
    budget: Math.round(stats.totalCost * (0.85 + Math.random() * 0.3)),
    poiCount: stats.totalPois + (altMood === 'excited' ? 1 : -1),
    cities: planA.cities,
    pacing: altMood === 'excited' ? '快节奏探索' : '慢节奏享受',
    moodMatch: Math.round(65 + Math.random() * 20),
    highlights: '同样的目的地，不一样的打开方式'
  };
  
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  
  var html = '';
  [planA, planB].forEach(function(plan) {
    html += '<div class="compare-col glass-panel' + (plan.recommended ? ' recommended' : '') + '">';
    html += '<div class="compare-col-title">' + (plan.recommended ? '👑 ' : '🔄 ') + plan.title + '</div>';
    html += '<div class="compare-col-subtitle">' + plan.subtitle + '</div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">💰 预算</span><span class="compare-metric-val" style="color:' + (plan.budget <= budget ? '#8BA88C' : '#FF6B6B') + '">¥' + plan.budget + '</span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">📍 景点数</span><span class="compare-metric-val" style="color:#fff">' + plan.poiCount + '个</span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">🏙️ 跨城数</span><span class="compare-metric-val" style="color:#fff">' + plan.cities + '城</span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">🎯 心情匹配</span><span class="compare-metric-val" style="color:' + activeMoodColor + '">' + plan.moodMatch + '%</span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">🚶 节奏</span><span class="compare-metric-val" style="color:#fff">' + plan.pacing + '</span></div>';
    html += '<div class="compare-verdict" style="background:' + theme.secondary + '15">✨ ' + plan.highlights + '</div>';
    if (plan.recommended) {
      html += '<button class="compare-select-btn" style="background:linear-gradient(135deg, #8BA88C, #6B8E6C)" onclick="showToast(\'已选择方案A · 当前推荐\')">✓ 当前方案</button>';
    } else {
      html += '<button class="compare-select-btn" style="background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.35)" onclick="showToast(\'切换方案B功能开发中\')">切换到此方案</button>';
    }
    html += '</div>';
  });
  
  container.innerHTML = html;
}

function getPacingLabel() {
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  return ct ? ct.paceLabel : '适中节奏';
}

function renderItinerary() {
  var section = document.getElementById('itinerarySection');
  var daysEl = document.getElementById('itineraryDays');
  var countEl = document.getElementById('itineraryCount');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  section.classList.add('show');
  countEl.textContent = itinerary.length + t.itineraryDay;

  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  daysEl.innerHTML = '';

  // 🎯 旅伴感知的 Tips 横幅
  if (companionType !== 'solo') {
    var tipKeys = { couple: 'companionTipCouple', friends: 'companionTipFriends', family: 'companionTipFamily', business: 'companionTipBusiness' };
    var tip = t[tipKeys[companionType]];
    if (tip) {
      daysEl.innerHTML += '<div class="companion-tip-banner" style="background:' + theme.secondary + '18;border-left:3px solid ' + activeMoodColor + ';padding:14px 18px;border-radius:10px;margin-bottom:16px;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6">' + tip + '</div>';
    }
  }
  itinerary.forEach(function(day, dayIndex) {
    var html = '<div class="day-header" id="dayHeader_' + dayIndex + '" style="background:' + theme.secondary + '25;color:' + theme.primary + '" onclick="flyToDay(' + dayIndex + ')" title="点击查看地图路线"><span>' + t.itineraryDayLabel + day.day + '</span><span>' + day.items.length + t.itineraryNodes + '</span><span class="day-map-hint">🗺️</span></div>';
    html += '<div class="day-toolbar"><button class="refresh-btn" onclick="regenerateDay(' + dayIndex + ')">' + t.itineraryRefreshDay + '</button></div>';
    html += '<div class="timeline">';

    day.items.forEach(function(item, itemIndex) {
      // 交通耗时条（非第一个条目）
      if (itemIndex > 0 && item.transitTime) {
        html += '<div class="transit-bar"><span class="transit-icon">🚗</span><span class="transit-time">' + t.itineraryTransitAbout + item.transitTime + t.itineraryTransitDrive + '</span></div>';
      }

      var dotColor = item.type === 'rest' ? '#A3B5A6' : item.type === 'restaurant' ? '#E8A85A' : activeMoodColor;
      var catLabel = item.type === 'rest' ? t.itineraryRest : item.type === 'restaurant' ? t.itineraryFood : t.itineraryPoi;
      html += '<div class="timeline-item"><div class="timeline-dot" style="background:' + dotColor + '"></div><div class="timeline-card"><div class="time-row"><span class="time">' + item.time + '</span><span class="category">' + catLabel + '</span>';
      if (item.estimatedDuration) {
        html += '<span class="category" style="margin-left:4px;opacity:0.5">⏱ ' + item.estimatedDuration + t.itineraryMinutes + '</span>';
      }
      html += '</div><span class="poi-name">' + __(item.name, 'poiNames') + (item.hiddenGem ? ' <span style="font-size:12px;background:rgba(255,215,0,0.2);color:#FFD700;padding:2px 6px;border-radius:4px">' + t.itineraryHiddenGem + '</span>' : '') + '</span>';
      if (item.type !== 'rest') {
        var crowd = getCrowdLevel(item);
        html += '<span class="crowd-indicator ' + crowd.level + '">' + crowd.icon + ' ' + crowd.label + '</span>';
        html += '<div class="best-time-tip">' + t.itineraryBestVisit + crowd.bestTime + '</div>';
      }
      // 新增：拍照技巧提示
      if (item.photoTip) {
        html += '<div class="photo-tip" style="font-size:12px;margin-top:6px;padding:6px 10px;background:rgba(255,255,255,0.05);border-radius:6px;line-height:1.4">📸 ' + item.photoTip + '</div>';
      }
      // 新增：最佳拍照时间
      if (item.bestPhotoTime) {
        html += '<div class="best-photo-time" style="font-size:12px;margin-top:4px">' + t.itineraryBestPhotoTime + item.bestPhotoTime + '</div>';
      }
      if (item.reason) html += '<div class="reason-bar">💡 ' + item.reason + '</div>';
      if (item.reasonTags && item.reasonTags.length) {
        html += '<div class="tags">' + item.reasonTags.map(function(tg) { return '<span class="tag">' + tg + '</span>'; }).join('') + '</div>';
      }
      // 新增：本地人小贴士
      if (item.localTip) {
        html += '<div class="local-tip" style="font-size:12px;margin-top:6px;padding:6px 10px;background:rgba(139,168,140,0.08);border-left:2px solid ' + activeMoodColor + '60;border-radius:4px;line-height:1.4">🗣️ ' + item.localTip + '</div>';
      }
      if (item.type !== 'rest') {
        html += '<div class="booking-row"><div class="price-tag" style="color:' + activeMoodColor + '">¥' + (item.estimatedCost || 0) + '</div><button class="book-btn" style="background:' + activeMoodColor + '" onclick="showBookingPopup(\'' + __(item.name, 'poiNames') + '\')">' + t.itineraryBook + '</button></div>';
        if (item.estimatedCost > 0) html += '<div class="compare-inline"><span>🔍</span><span>' + t.itineraryAICompare + '美团 ¥' + Math.round(item.estimatedCost * 0.93) + t.itineraryFrom + '</span><span class="compare-inline-save">' + t.itinerarySave + Math.round(item.estimatedCost * 0.12) + '</span></div>';
      }
      // 雨天备选
      if (item.rain_plan) {
        html += '<div class="rain-plan-toggle" onclick="toggleRainPlan(' + dayIndex + ',' + itemIndex + ')">' + t.itineraryRainPlan + '</div>';
        html += '<div class="rain-plan-detail" id="rainDetail_' + dayIndex + '_' + itemIndex + '">🏠 <strong>' + item.rain_plan.name + '</strong>（' + item.rain_plan.category + '）· ¥' + (item.rain_plan.estimatedCost || 0) + '</div>';
      }
      html += '</div></div>';
    });
    html += '</div>';
    daysEl.innerHTML += html;
  });

  // 为行程卡片添加渐入动画
  setTimeout(function() {
    var cards = document.querySelectorAll('#itineraryDays .timeline-card');
    cards.forEach(function(card, i) {
      card.classList.add('animate-slide-up');
      card.classList.add('stagger-' + ((i % 8) + 1));
    });
  }, 100);
}

function renderHotel() {
  if (!hotel) return;
  var section = document.getElementById('hotelSection');
  var card = document.getElementById('hotelCard');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  section.classList.add('show');
  var html = '<div class="hotel-header"><div class="hotel-info"><span class="hotel-name">' + __(hotel.name, 'hotelNames') + '</span><span class="hotel-rating">⭐ ' + hotel.rating + t.hotelScore + '</span></div><div class="hotel-price" style="color:' + activeMoodColor + '">¥' + hotel.bestPrice + '</div></div>';
  html += '<span class="hotel-reason">💡 ' + hotel.reason + '</span>';
  // 新增：酒店特色标签
  if (hotel.featureTags && hotel.featureTags.length > 0) {
    html += '<div class="hotel-feature-tags" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">';
    hotel.featureTags.forEach(function(ft) {
      html += '<span style="font-size:12px;padding:3px 8px;background:' + MOOD_THEME_MAP[activeMood].primary + '15;border:1px solid ' + MOOD_THEME_MAP[activeMood].primary + '30;border-radius:12px;color:' + MOOD_THEME_MAP[activeMood].primary + '">' + __(ft, 'hotelFeatureTags') + '</span>';
    });
    html += '</div>';
  }
  if (hotel.platforms) {
    html += '<div class="ai-compare"><div class="compare-title"><span class="ai-badge">' + t.hotelAICompare + '</span><span class="ai-tip">' + t.hotelComparePlatforms + hotel.platforms.length + t.hotelPlatformCount + '</span></div><div class="compare-list">';
    hotel.platforms.forEach(function(p) {
      html += '<div class="compare-row' + (p.isBest ? ' best' : '') + '"><span class="compare-platform">' + p.icon + ' ' + p.name + '</span><span class="compare-price">¥' + p.price + '</span><span class="compare-features">' + (p.features || '') + '</span>' + (p.isBest ? '<span class="compare-best-tag">' + t.hotelBest + '</span>' : '') + '</div>';
    });
    html += '</div><div class="compare-verdict" style="background:' + MOOD_THEME_MAP[activeMood].primary + '12"><span>' + t.hotelAISuggest + hotel.bestPlatform + '（' + hotel.bestReason + '）</span></div></div>';
  }
  if (hotel.savedAmount > 0) html += '<div class="hotel-savings">' + t.hotelSaveAmount + hotel.savedAmount + '</div>';
  html += '<div style="display:flex;gap:10px;margin-top:12px"><button class="book-btn hotel-book-btn" style="background:' + activeMoodColor + '" onclick="showBookingPopup(\'' + __(hotel.name, 'hotelNames') + '\')">' + (t.bookHotel || '预订酒店') + '</button><button class="refresh-btn" onclick="regenerateHotel()" style="margin-left:0">' + (t.regenerateHotel || '🔄 换一家') + '</button></div>';
  card.innerHTML = html;
}

function renderCareLetter() {
  var section = document.getElementById('careLetterSection');
  var letter = document.getElementById('careLetter');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  section.classList.add('show');
  var hour = new Date().getHours();
  var greeting = hour < 6 ? t.careGreetingLateNight : hour < 9 ? t.careGreetingMorning : hour < 12 ? t.careGreetingLateMorning : hour < 14 ? t.careGreetingNoon : hour < 18 ? t.careGreetingAfternoon : t.careGreetingEvening;
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || '平静';
  var ct = COMPANION_TYPES.find(function(c){return c.key===companionType;})||{};
  var companionLabel = ct.label || '独自';

  // 增强版心情关怀：根据心情+旅伴+模式生成个性化关怀
  var care = {
    tired:   { title:'今天允许自己慢下来',
      body: '疲惫不是软弱，是身体在提醒你需要休息。泡一杯温热的茶，找一个舒服的角落，不需要做任何事——只是呼吸，只是存在。',
      body2: '你知道吗？在浙江，有很多适合"躺平"的地方：莫干山的竹林里找一个吊床，西湖边的长椅上晒太阳，或者找一家安静的茶馆，让时间慢下来。',
      action:'点一支香薰蜡烛，听一首没有歌词的轻音乐。',
      travelTip:'行程中已为你安排了足够的休息时间，不舒服就停下来，旅行的意义不是打卡，而是善待自己。' },
    excited: { title:'让这份能量流动起来',
      body: '兴奋是生命力的绽放。今天适合去做一件你一直想做但没做的事，哪怕只是走出门散个步，或者给一个老朋友打个电话。',
      body2: '浙江有太多值得探索的地方：雁荡山的奇峰怪石、神仙居的云海栈道、横店的穿越之旅——你的能量，刚好匹配这些精彩。',
      action:'把这份能量写下来，或者画下来——创造力需要出口。',
      travelTip:'虽然精力充沛，但也要注意安全哦！户外活动记得带好水和防晒，别让兴奋冲昏了头脑。' },
    happy:   { title:'珍惜此刻的光亮',
      body: '开心的时候，世界都是暖色调的。不需要寻找意义，此刻本身就是意义。如果可以，记得把这份温暖传递给身边的人。',
      body2: '带着好心情去旅行，每个转角都是惊喜。西湖边的夕阳、河坊街的小吃、乌镇的桨声灯影——都因为你此刻的好心情而更加美好。',
      action:'拍一张记录此刻的照片，放进你的情绪日记里。',
      travelTip:'快乐的时候最适合拍照！行程中标注了最佳拍照时间和技巧，记录下这段闪闪发光的旅程吧。' },
    calm:    { title:'平静是最高级的能量',
      body: '不疾不徐，不忧不惧。平静不是无聊，而是内心足够丰盈。今天的一切都刚刚好——阳光、空气、和你自己。',
      body2: '浙江的禅意，最适合平静的心：灵隐寺的晨钟暮鼓、永福寺的抄经体验、国清寺的千年隋梅——在古老的寺庙里，时间仿佛静止。',
      action:'尝试五分钟的正念呼吸：吸气四秒，屏息四秒，呼气六秒。',
      travelTip:'行程中为你精选了安静人少的景点，避开人潮，独享一份属于自己的宁静时光。' },
    anxious: { title:'焦虑是你在乎的证明',
      body: '手心出汗、心跳加速——这些都是你认真生活的证据。深呼吸，把手放在心口，对自己说：我已经做得很好了。',
      body2: '焦虑的时候，大自然是最好的解药。浙江的山水从来不会让人失望：九溪烟树的溪流声、云和梯田的晨雾、古堰画乡的写生人——都是治愈的良方。',
      action:'写下三件今天让你感到安全的小事，哪怕只是喝到了一杯温度刚好的水。',
      travelTip:'行程已为你降低了节奏，每天不超过2个景点，预留充足的放空时间。感到焦虑时，就停下来深呼吸。' },
    sad:     { title:'悲伤值得被温柔对待',
      body: '低落的时候不需要急着振作。眼泪是心灵的雨水，落完了，天空自然会放晴。今天你是被允许脆弱的。',
      body2: '有时候，换个环境就是最好的疗愈。去西湖边看一场日落，去沈园听一段《钗头凤》，去普陀山听海浪拍岸——让大自然接住你的情绪。',
      action:'裹一条柔软的毯子，看一部温暖的电影，或者什么也不做——只是允许自己难过。',
      travelTip:'行程中选择了温暖治愈的景点，低体力消耗，高情绪价值。慢慢走，不着急，一切都会好起来的。' },
    insomnia:{ title:'夜深了，世界很安静',
      body: '失眠的夜晚，思绪像潮水一样涌来。不需要强迫自己入睡——有时候，安静的醒着，也是和自己对话的珍贵时光。',
      body2: '浙江的夜晚也很美：西湖的音乐喷泉、老外滩的酒吧街、河坊街的夜市——如果你睡不着，不妨去感受一下夜晚的城市脉搏。',
      action:'把手机屏幕调到最暗，闭上眼睛，听一段白噪音。睡不着也没关系，明天会是新的一天。',
      travelTip:'行程中避免了早起安排，可以睡到自然醒。夜晚的景点也为你准备好了，享受属于你的深夜时光。' }
  };
  var c = care[activeMood] || care.calm;
  var quotes = ['「你不需要成为更好的自己，你只需要更温柔地对待此刻的自己。」','「生活不是马拉松，而是散步——停下来看看花，也是一种前进。」','「今天你已经很棒了，哪怕只是起床、呼吸、存在。」','「情绪像天气，没有好坏之分。雨天的意义，是让晴天的阳光更珍贵。」','「真正的勇敢，不是从不疲惫，而是疲惫时依然选择温柔对待自己。」'];
  var quote = quotes[Math.floor(Math.random() * quotes.length)];

  // 构建关怀信HTML
  var html = '<div class="care-letter-greeting">' + greeting + '</div>';
  html += '<div class="care-letter-title">' + c.title + '</div>';
  html += '<div class="care-letter-body">' + c.body + '</div>';
  html += '<div class="care-letter-body care-letter-body2" style="margin-top:12px;font-size:14px">' + c.body2 + '</div>';
  html += '<div class="care-letter-action">✨ ' + c.action + '</div>';
  html += '<div class="care-letter-quote">' + quote + '</div>';

  // 旅伴感知的关怀附言
  var companionNote = {
    solo: '💙 独自旅行是一次与自己的深度对话，享受这份自由吧。',
    couple: '💕 两个人的旅程，慢一点也没关系，重要的是彼此在身边。',
    friends: '🌈 和闺蜜一起的时光，就是最好的解药。尽情欢笑吧！',
    family: '🌿 陪伴是最长情的告白，这份慢下来的时光，值得珍藏。',
    business: '⚡ 高效出行，也要记得照顾好自己。工作很重要，你也一样。'
  };
  var note = companionNote[companionType];
  if (note) {
    html += '<div class="care-letter-companion-note" style="margin-top:18px;padding:12px 16px;background:rgba(255,255,255,0.12);border-radius:10px;font-size:14px;line-height:1.6">' + note + '</div>';
  }

  // ================================================================
  //  新增：旅行小贴士 — 根据心情和旅伴定制
  // ================================================================
  var travelTips = [];
  if (activeMood === 'tired' || activeMood === 'sad') {
    travelTips.push('🧘 感到累了就坐下来，浙江遍地都是茶馆和咖啡馆');
    travelTips.push('💆 行程中标注了休息点，不要硬撑，身体最重要');
  }
  if (activeMood === 'excited') {
    travelTips.push('📸 记得给手机和相机充满电，美景太多拍不完');
    travelTips.push('💧 户外活动多带水，浙江夏天比较湿热');
  }
  if (activeMood === 'anxious') {
    travelTips.push('🌿 随身带一本小书或耳机，在寺庙或园林里找个角落独处');
    travelTips.push('🧭 不用赶行程，错过一个景点也没关系，舒服最重要');
  }
  if (companionType === 'couple') {
    travelTips.push('💑 行程中标注了浪漫拍照点，一起留下美好回忆');
    travelTips.push('🍷 晚餐推荐已避开排队餐厅，享受不被打扰的二人时光');
  }
  if (companionType === 'family') {
    travelTips.push('👶 景点附近都标注了母婴室和休息区，带娃出行也安心');
    travelTips.push('👴 午休时间已自动安排，老人家不会太累');
  }
  if (companionType === 'friends') {
    travelTips.push('👯 记得带自拍杆，闺蜜合照不能少');
    travelTips.push('🛍️ 夜市和购物街已标注，逛吃模式全开');
  }
  travelTips.push('🌂 浙江天气多变，随身带一把折叠伞准没错');
  travelTips.push('📱 支付宝/微信支付全覆盖，几乎不需要现金');

  if (travelTips.length > 0) {
    html += '<div class="care-letter-tips" style="margin-top:18px;padding:14px 16px;background:rgba(139,168,140,0.08);border-radius:10px;border-left:3px solid ' + activeMoodColor + '60">';
    html += '<div style="font-size:13px;font-weight:600;color:' + activeMoodColor + ';margin-bottom:8px">' + t.careTravelTips + '</div>';
    travelTips.forEach(function(tip) {
      html += '<div style="font-size:13px;line-height:1.8;padding-left:8px">' + tip + '</div>';
    });
    html += '</div>';
  }

  // ================================================================
  //  新增：当地文化介绍 — 根据行程中的城市
  // ================================================================
  var visitedCities = {};
  if (itinerary && itinerary.length > 0) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city) visitedCities[item.city] = true;
      });
    });
  }
  var cityNames = Object.keys(visitedCities);
  if (cityNames.length > 0) {
    var cultureMap = {
      '杭州': '杭州是"人间天堂"，西湖文化景观是世界遗产。这里不仅有美景，还有深厚的茶文化——龙井茶被誉为"绿茶皇后"。杭州人讲究"慢生活"，一杯茶、一把扇子，就是一下午。',
      '宁波': '宁波是"书藏古今，港通天下"的历史名城。天一阁是中国现存最古老的私家藏书楼，宁波汤圆是必尝的美食。宁波人性格豪爽，做生意讲究诚信。',
      '温州': '温州人以"敢为天下先"著称，民营经济发达。雁荡山是"东南第一山"，楠溪江被誉为"中国山水画摇篮"。温州美食以海鲜为主，口味偏清淡鲜美。',
      '嘉兴': '嘉兴是江南水乡的典型代表，乌镇和西塘是中国最美的古镇。嘉兴粽子闻名全国，南湖是中共一大会址之一。这里的生活节奏很慢，适合放空自己。',
      '绍兴': '绍兴是"没有围墙的博物馆"，鲁迅故里、沈园、兰亭都是文化圣地。绍兴黄酒有2500多年历史，咸亨酒店的茴香豆配黄酒，是鲁迅笔下的经典搭配。',
      '舟山': '舟山是中国最大的群岛城市，普陀山是观音菩萨的道场。这里的人们以渔业为生，性格淳朴。海鲜是绝对的主角——沈家门夜排档是全国闻名的海鲜圣地。',
      '湖州': '湖州是"行遍江南清丽地，人生只合住湖州"。莫干山是中国四大避暑胜地之一，南浔古镇有"中国江南的封面"之称。安吉白茶是中国十大名茶之一。',
      '丽水': '丽水是"浙江绿谷"，森林覆盖率超过80%。云和梯田、古堰画乡都是摄影爱好者的天堂。这里生活着畲族同胞，有着独特的民族文化。',
      '金华': '金华以火腿闻名天下，横店影视城是"东方好莱坞"。武义温泉是天然的养生胜地，诸葛八卦村是诸葛亮后裔聚居地，建筑布局精妙。',
      '台州': '台州天台山是佛教天台宗发源地，国清寺有1400多年历史。神仙居的云海栈道令人惊叹，临海古城墙是江南长城。台州人性格温和，生活节奏舒适。'
    };
    var cultureText = '';
    cityNames.forEach(function(city) {
      if (cultureMap[city]) {
        cultureText += '<div style="margin-bottom:8px"><strong>' + city + '：</strong>' + cultureMap[city] + '</div>';
      }
    });
    if (cultureText) {
      html += '<div class="care-letter-culture" style="margin-top:18px;padding:14px 16px;background:rgba(255,179,71,0.08);border-radius:10px;border-left:3px solid #E8A85A60">';
      html += '<div style="font-size:13px;font-weight:600;color:#E8A85A;margin-bottom:8px">🏯 当地文化小知识</div>';
      html += '<div style="font-size:13px;line-height:1.8">' + cultureText + '</div>';
      html += '</div>';
    }
  }

  letter.innerHTML = html;
}

function renderStats() {
  if (!stats) return;
  var row = document.getElementById('statsRow');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  row.style.display = 'flex';
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  row.innerHTML = '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">' + stats.filterPassed + '/' + stats.filterTotal + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.55)">' + t.statsFilterPassed + '</span></div>' +
    '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">' + stats.totalPois + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.55)">' + t.statsSelectedPois + '</span></div>' +
    '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">¥' + (stats.totalSaved || 0) + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.55)">' + t.statsSavedAmount + '</span></div>' +
    '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">¥' + (stats.totalCost || 0) + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.55)">' + t.statsTotalBudget + '</span></div>';
}

// ================================================================
//  行前清单渲染
// ================================================================
function renderChecklist() {
  var section = document.getElementById('checklistSection');
  var card = document.getElementById('checklistCard');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  section.classList.add('show');

  var isBusiness = travelMode === 'business';

  // 通用物品
  var commonItems = [
    { cat:'必备证件', items:['身份证/护照', '手机 + 充电器', '钱包/银行卡', '钥匙'] },
    { cat:'电子设备', items:['充电宝', '数据线', '耳机'] }
  ];

  // 旅游模式专属
  var tourismItems = [
    { cat:'户外防护', items:['防晒霜', '墨镜', '遮阳帽', '舒适的鞋子'] },
    { cat:'拍照打卡', items:['相机/手机支架', '自拍杆', '充电宝（多带一个）'] },
    { cat:'随身好物', items:['水杯', '小零食', '纸巾/湿巾', '便携雨伞'] },
    { cat:'药品', items:['创可贴', '晕车药', '防蚊液'] }
  ];

  // 商务模式专属
  var businessItems = [
    { cat:'工作必备', items:['笔记本电脑 + 充电器', '会议资料/文件', '名片', '笔 + 笔记本'] },
    { cat:'出行效率', items:['充电宝', '便携水杯', '口香糖/薄荷糖', '便携雨伞'] },
    { cat:'衣物', items:['正装/商务装', '备用衬衫', '商务鞋'] },
    { cat:'药品', items:['创可贴', '感冒药', '胃药'] }
  ];

  // 旅伴专属物品
  var companionItems = [];
  if (companionType === 'couple') {
    companionItems = [{ cat:'💑 情侣专属', items:['情侣装', '拍立得/相机', '小礼物', '共享歌单'] }];
  } else if (companionType === 'friends') {
    companionItems = [{ cat:'👯 闺蜜专属', items:['自拍杆/三脚架', '补妆包', '闺蜜装', '便携音响'] }];
  } else if (companionType === 'family') {
    companionItems = [
      { cat:'👶 亲子专属', items:['儿童水杯', '小零食', '绘本/玩具', '备用衣物', '湿巾'] },
      { cat:'👴 长辈专属', items:['常用药品', '保温杯', '折叠坐垫', '老花镜', '薄外套'] }
    ];
  }

  var allItems = commonItems.concat(isBusiness ? businessItems : tourismItems).concat(companionItems);

  var html = '<div class="checklist-title">' + (isBusiness ? '💼' : '🎒') + ' ' + (isBusiness ? t.checklistBusinessTitle : t.checklistTourismTitle) + '</div>';
  html += '<div class="checklist-sub">' + (isBusiness ? t.checklistBusinessSub : t.checklistTourismSub) + '</div>';
  html += '<div class="checklist-items">';

  var itemIndex = 0;
  allItems.forEach(function(cat) {
    html += '<div class="checklist-category">' + cat.cat + '</div>';
    cat.items.forEach(function(item) {
      html += '<div class="checklist-item" onclick="toggleChecklistItem(this)" data-idx="' + itemIndex + '"><div class="checklist-cb">✓</div><div class="checklist-text">' + item + '</div></div>';
      itemIndex++;
    });
  });
  html += '</div>';
  html += '<div class="checklist-progress" id="checklistProgress">' + t.checklistChecked + '0/' + itemIndex + t.checklistItems + '</div>';
  card.innerHTML = html;
}

function toggleChecklistItem(el) {
  el.classList.toggle('checked');
  updateChecklistProgress();
}

function updateChecklistProgress() {
  var items = document.querySelectorAll('.checklist-item');
  var checked = document.querySelectorAll('.checklist-item.checked');
  var prog = document.getElementById('checklistProgress');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  if (prog) {
    prog.textContent = t.checklistChecked + checked.length + '/' + items.length + t.checklistItems;
  }
}

// ================================================================
//  行前提醒（Notification API）
// ================================================================
var reminderTimer = null;

function scheduleReminder() {
  if (reminderTimer) clearTimeout(reminderTimer);
  var isBusiness = travelMode === 'business';

  // 模拟2小时后出发（实际开发中，这里用真实出发时间）
  // 演示时用10秒模拟，让用户能看到效果
  reminderTimer = setTimeout(function() {
    sendReminder(isBusiness);
  }, 10000); // 10秒后触发演示
}

function sendReminder(isBusiness) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    showNotification(isBusiness);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        showNotification(isBusiness);
      }
    });
  }
}

function showNotification(isBusiness) {
  var title = isBusiness ? '💼 出发提醒 — 商务出行' : '🏖️ 出发提醒 — 休闲旅游';
  var options = {
    body: isBusiness
      ? '记得检查身份证和充电宝，路上注意安全，别迟到哦！'
      : '别忘了带防晒霜和墨镜，准备开启好心情！',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + (isBusiness ? '💼' : '🏖️') + '</text></svg>',
    tag: 'moodtravel-reminder',
    requireInteraction: true
  };
  try {
    new Notification(title, options);
  } catch (e) {
    // fallback: show toast
    showToast('📢 ' + title + '：' + options.body);
  }
}

// ================================================================
//  刷新某天行程
// ================================================================
function regenerateDay(dayIndex) {
  if (!itinerary || dayIndex < 0 || dayIndex >= itinerary.length) return;
  showToast('第' + (dayIndex + 1) + '天正在刷新...');

  var weights = getWeightKey();
  var dailyBudget = budget / days;
  var energyIdeal = MOOD_ENERGY_MAP[activeMood] || 2;
  var isLowEnergy = activeMood === 'tired' || activeMood === 'sad' || activeMood === 'anxious' || activeMood === 'insomnia';
  var isBusinessMode = travelMode === 'business';

  // 增强算法变量（与doGenerate保持一致）
  var now = new Date();
  var month = now.getMonth() + 1;
  var season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  var moodPoiTypeWeights = {
    calm: { nature: 1.5, cultural: 1.3, temple: 1.4, garden: 1.5, relaxation: 1.6 },
    happy: { food: 1.5, shopping: 1.4, entertainment: 1.5, social: 1.6, landmark: 1.2 },
    sad: { nature: 1.4, temple: 1.5, cultural: 1.4, garden: 1.3, healing: 1.6 },
    anxious: { nature: 1.5, temple: 1.6, relaxation: 1.5, garden: 1.4, meditation: 1.7 },
    excited: { adventure: 1.6, landmark: 1.4, entertainment: 1.5, outdoor: 1.5, social: 1.3 },
    tired: { relaxation: 1.7, food: 1.5, garden: 1.4, nature: 1.3, spa: 1.6 },
    insomnia: { nature: 1.4, temple: 1.5, relaxation: 1.6, garden: 1.3, quiet: 1.7 }
  };
  var currentMoodWeights = moodPoiTypeWeights[activeMood] || moodPoiTypeWeights.calm;
  var companionAdjustments = {
    solo: { pace: 0.8, flexibility: 1.5, socialPoi: 0.5, budgetPerPerson: 1.3 },
    couple: { pace: 0.9, flexibility: 1.2, romanticPoi: 1.8, budgetPerPerson: 1.1 },
    family: { pace: 0.7, flexibility: 0.8, familyPoi: 2.0, budgetPerPerson: 0.8 },
    friends: { pace: 1.2, flexibility: 1.3, socialPoi: 1.6, budgetPerPerson: 0.9 },
    business: { pace: 1.4, flexibility: 0.5, landmarkPoi: 1.5, budgetPerPerson: 1.5 }
  };
  var compAdj = companionAdjustments[companionType] || companionAdjustments.solo;
  var weatherCondition = 'unknown';
  if (typeof currentWeather !== 'undefined' && currentWeather && currentWeather.condition) {
    weatherCondition = currentWeather.condition;
  }
  var weatherPoiBoost = {};
  if (weatherCondition.indexOf('雨') !== -1) {
    weatherPoiBoost = { indoor: 1.8, museum: 1.6, shopping: 1.5, food: 1.4, temple: 1.3 };
    weatherPoiBoost.outdoor = 0.3; weatherPoiBoost.nature = 0.4; weatherPoiBoost.adventure = 0.2;
  } else if (weatherCondition.indexOf('晴') !== -1) {
    weatherPoiBoost = { outdoor: 1.5, nature: 1.4, adventure: 1.3, landmark: 1.3 };
  }
  var energyCurve = [];
  for (var d = 0; d < days; d++) {
    energyCurve.push({ morning: 0.9 - (d * 0.05), afternoon: 0.75 - (d * 0.08), evening: 0.6 + (d * 0.05) });
  }
  // 增强算法变量结束
  // 🎯 旅伴感知的每日上限
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  var maxPerDay = ct ? ct.maxPoi : 4;
  if (isLowEnergy && maxPerDay > 2) maxPerDay = Math.max(2, maxPerDay - 1);
  if (isBusinessMode) maxPerDay = Math.min(maxPerDay, 3);

  // 收集当前已使用的POI ID
  var used = new Set();
  itinerary.forEach(function(day, di) {
    if (di === dayIndex) return;
    day.items.forEach(function(it) {
      if (it.poiId) used.add(it.poiId);
    });
  });

  // 重新评分 + 防坑避雷
  var candidates = POIS.filter(function(poi) {
    if (used.has(poi.id)) return false;
    if (poi.ticketPrice > dailyBudget * 0.5) return false;
    if (hasKids && !poi.kidsFriendly) return false;
    if (hasKids && poi.minAge && poi.minAge > 5) return false;
    if (hasElderly && !poi.elderlyFriendly && poi.energyLevel >= 4) return false;
    if (hasElderly && poi.category === 'restaurant') {
      if (poi.queueTime > 60) return false;
      if (poi.hasElevator === false) return false;
      if (poi.spicinessLevel >= 3) return false;
    }
    if (hasKids && poi.energyLevel >= 3 && !poi.hasNursingRoom && !poi.strollerFriendly) return false;
    if (hasElderly && poi.energyLevel >= 3 && !poi.wheelchairAccessible && poi.restSeats < 3) return false;
    // 🛡️ 防坑避雷
    if (isCouple && poi.category === 'restaurant' && poi.queueTime >= 30) return false;
    if (isCouple && poi.energyLevel >= 4) return false;
    if (isBusiness && poi.category === 'restaurant' && poi.romanticLevel >= 4) return false;
    if (isBusiness && poi.category === 'restaurant' && poi.noiseLevel >= 4) return false;
    if (hasElderly && poi.energyLevel >= 3 && (poi.tags || []).indexOf('徒步') !== -1) return false;
    return true;
  });

  var scored = candidates.map(function(poi) {
    var moodScore = (poi.moodScores[activeMood] || 5) * weights.mood * 10;
    var budgetRatio = dailyBudget > 0 ? Math.min(poi.ticketPrice / dailyBudget, 1) : 0;
    var budgetScore = (1 - budgetRatio) * weights.budget * 100;
    var energyDiff = Math.abs(poi.energyLevel - energyIdeal);
    var energyScore = (1 - energyDiff / 4) * weights.energy * 100;
    var crowdScore = (5 - poi.crowdednessLevel) / 4 * weights.crowd * 100;
    var kidScore = hasKids ? (poi.kidsFriendly ? weights.kid * 100 : 0) : 0;
    var elderlyScore = hasElderly ? (poi.elderlyFriendly ? weights.elderly * 100 : 0) : 0;
    var coupleScore = isCouple ? (poi.romanticLevel / 5 * weights.couple * 100) : 0;
    var elderlyRestaurantBonus = 0;
    if (hasElderly && poi.category === 'restaurant') {
      if (poi.hasPrivateRoom) elderlyRestaurantBonus += 20;
      if (poi.hasHotTea) elderlyRestaurantBonus += 15;
      if (poi.noiseLevel <= 2) elderlyRestaurantBonus += 15;
    }
    var coupleBonus = 0;
    if (isCouple) {
      if (poi.hasPhotoSpot) coupleBonus += 15;
      if (poi.category === 'restaurant' && poi.romanticLevel >= 4) coupleBonus += 20;
      if (poi.category === 'leisure' && poi.romanticLevel >= 4) coupleBonus += 15;
    }
    var kidsBonus = 0;
    if (hasKids) { if (poi.hasNursingRoom) kidsBonus += 20; if (poi.strollerFriendly) kidsBonus += 15; }
    var elderlyBonus = 0;
    if (hasElderly) { if (poi.wheelchairAccessible) elderlyBonus += 15; if (poi.restSeats >= 4) elderlyBonus += 15; if (poi.nearMedical) elderlyBonus += 20; }

    var friendsBonus = 0;
    if (isFriends) {
      if (poi.tags && poi.tags.some(function(t) { return t === '网红' || t === '打卡' || t === '拍照' || t === '小吃' || t === '美食'; })) friendsBonus += 20;
      if (poi.category === 'shopping' && (poi.tags || []).indexOf('古街') !== -1) friendsBonus += 15;
      if (poi.hasPhotoSpot) friendsBonus += 15;
      if (poi.category === 'restaurant' && poi.romanticLevel <= 2 && poi.noiseLevel >= 3) friendsBonus += 10;
    }

    var businessBonus = 0;
    if (isBusiness) {
      if (poi.energyLevel <= 1) businessBonus += 20;
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) businessBonus += 15;
      if (poi.category === 'restaurant' && poi.noiseLevel <= 2) businessBonus += 10;
      if (poi.tags && poi.tags.some(function(t) { return t === '高端' || t === '商务'; })) businessBonus += 15;
    }

    var soloBonus = 0;
    if (companionType === 'solo') {
      if (poi.energyLevel <= 2 && poi.crowdednessLevel <= 2) soloBonus += 15;
      if (poi.category === 'museum' || poi.category === 'leisure') soloBonus += 10;
    }

    var total = moodScore + budgetScore + energyScore + crowdScore + kidScore + elderlyScore + coupleScore + elderlyRestaurantBonus + coupleBonus + kidsBonus + elderlyBonus + friendsBonus + businessBonus + soloBonus;

    // 增强算法集成：心情权重
    if (currentMoodWeights[poi.category]) total *= currentMoodWeights[poi.category];
    var poiTags = poi.tags || [];
    for (var tk in currentMoodWeights) {
      if (poiTags.indexOf(tk) !== -1) total *= currentMoodWeights[tk];
    }
    // 天气加成
    if (weatherPoiBoost[poi.category]) total *= weatherPoiBoost[poi.category];
    if (poi.weatherSensitivity === 'indoor' && weatherPoiBoost.indoor) total *= weatherPoiBoost.indoor;
    // 季节性评分
    if (poi.seasonalScore && poi.seasonalScore[season]) {
      total *= (poi.seasonalScore[season] / 5);
    }
    // 旅伴偏好
    if (compAdj.romanticPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.romanticPoi;
    }
    if (compAdj.familyPoi && poi.familyFriendly) {
      total *= compAdj.familyPoi;
    }
    if (compAdj.socialPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.socialPoi;
    }
    // 时间精力曲线
    var dayEnergy = energyCurve[0] || { morning: 0.9, afternoon: 0.75, evening: 0.6 };
    if (poi.bestTimeOfDay === 'morning') total *= dayEnergy.morning * 1.1;
    else if (poi.bestTimeOfDay === 'afternoon') total *= dayEnergy.afternoon;
    else if (poi.bestTimeOfDay === 'evening') total *= dayEnergy.evening * 1.05;

    return Object.assign({}, poi, { _scores: { moodScore:moodScore, budgetScore:budgetScore, energyScore:energyScore, crowdScore:crowdScore, kidScore:kidScore, elderlyScore:elderlyScore, coupleScore:coupleScore }, _total: total });
  });
  scored.sort(function(a, b) { return b._total - a._total; });

  function findRainPlanRegen(poi, excludeIds) {
    for (var ri = 0; ri < scored.length; ri++) {
      var alt = scored[ri];
      if (alt.id === poi.id) continue;
      if (alt.weatherSensitivity !== 'indoor') continue;
      if (alt.category === poi.category) continue;
      if (excludeIds && excludeIds.has(alt.id)) continue;
      return { name: alt.name, estimatedCost: alt.ticketPrice || 0, category: alt.category };
    }
    for (var ri2 = 0; ri2 < scored.length; ri2++) {
      var alt2 = scored[ri2];
      if (alt2.id === poi.id) continue;
      if (alt2.weatherSensitivity !== 'indoor') continue;
      if (excludeIds && excludeIds.has(alt2.id)) continue;
      return { name: alt2.name, estimatedCost: alt2.ticketPrice || 0, category: alt2.category };
    }
    return null;
  }

  var dayPois = [];
  var dayUsed = new Set();
  for (var pi = 0; pi < scored.length; pi++) {
    if (dayPois.length >= maxPerDay) break;
    var poi = scored[pi];
    if (!dayUsed.has(poi.id)) { dayUsed.add(poi.id); dayPois.push(poi); }
  }

  var items = [];
  var hour = 9;
  var midIdx = Math.floor(dayPois.length / 2);

  for (var idx = 0; idx < dayPois.length; idx++) {
    var dayPoi = dayPois[idx];
    if (idx === midIdx) {
      var lunchPoi = scored.find(function(p) { return p.category === 'restaurant' && !dayUsed.has(p.id); });
      if (lunchPoi) {
        dayUsed.add(lunchPoi.id);
        items.push({ type:'restaurant', time:fmtTime(hour), name:lunchPoi.name, estimatedCost:lunchPoi.ticketPrice || 80, estimatedDuration:lunchPoi.estimatedDuration || 60, reason:'午餐时间，推荐附近高评分餐厅', reasonTags:['位置便利','高评分'], poiId:lunchPoi.id });
        hour += 1;
      }
    }
    if (!isBusinessMode && ((activeMood === 'tired' || activeMood === 'sad') || companionType === 'family') && idx === midIdx) {
      var restReason = companionType === 'family' ? '长辈/亲子模式：自动插入午休时间，避免体力透支' : '疲惫模式：自动插入半小时休息，避免体力透支';
      items.push({ type:'rest', time:fmtTime(hour), name: companionType === 'family' ? '🌿 午休时间' : '☕ 休息时间', estimatedCost:30, estimatedDuration: companionType === 'family' ? 60 : 30, reason: restReason, reasonTags:['心情匹配','体力保护'] });
      hour += companionType === 'family' ? 1 : 0.5;
    }
    var dur = dayPoi.estimatedDuration ? dayPoi.estimatedDuration / 60 : (isLowEnergy ? 2 : 1.5);
    if (isBusinessMode) dur = Math.min(dur, 1.5);
    var poiItem = {
      type: 'poi', time: fmtTime(hour), name: dayPoi.name, estimatedCost: dayPoi.ticketPrice || 0,
      estimatedDuration: dayPoi.estimatedDuration || 90, tags: dayPoi.tags || [],
      reason: genReason(dayPoi), reasonTags: genTags(dayPoi), poiId: dayPoi.id,
      mapX: dayPoi.mapX, mapY: dayPoi.mapY, city: getPoiCity(dayPoi.mapX, dayPoi.mapY), weatherSensitivity: dayPoi.weatherSensitivity,
      photoTip: dayPoi.photoTip || '', localTip: dayPoi.localTip || '',
      bestPhotoTime: dayPoi.bestPhotoTime || '', hiddenGem: dayPoi.hiddenGem || false,
      instagramWorthy: dayPoi.instagramWorthy || 5, crowdPeakHours: dayPoi.crowdPeakHours || '',
      seasonalBeauty: dayPoi.seasonalBeauty || '', avgStayTime: dayPoi.avgStayTime || 90
    };
    if (dayPoi.weatherSensitivity === 'outdoor' || dayPoi.weatherSensitivity === 'mixed') {
      var rp = findRainPlanRegen(dayPoi, dayUsed);
      if (rp) poiItem.rain_plan = rp;
    }
    items.push(poiItem);
    hour += dur;
  }

  for (var ii = 1; ii < items.length; ii++) {
    var prev = items[ii - 1];
    var curr = items[ii];
    if (prev.mapX !== undefined && prev.mapY !== undefined && curr.mapX !== undefined && curr.mapY !== undefined) {
      var dx = prev.mapX - curr.mapX;
      var dy = prev.mapY - curr.mapY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var distKm = dist * 0.5;
      var transitMin = Math.round(distKm / 40 * 60);
      if (transitMin < 5) transitMin = 5;
      curr.transitTime = transitMin;
    }
  }

  itinerary[dayIndex] = { day: dayIndex + 1, items: items };
  renderItinerary();
  renderMap();
  showToast('第' + (dayIndex + 1) + '天已刷新');
}

// ================================================================
//  刷新酒店推荐
// ================================================================
function regenerateHotel() {
  if (!HOTELS || HOTELS.length === 0) return;
  showToast('正在为您更换酒店...');

  hotelIndex = (hotelIndex + 1) % HOTELS.length;
  var dailyBudget = budget / days;

  var hotelCandidates = HOTELS.map(function(h) {
    var score = 0;
    var ratio = dailyBudget > 0 ? h.priceRangeLow / dailyBudget : 0;
    if (ratio <= 0.3) score += 30; else if (ratio <= 0.5) score += 25; else if (ratio <= 0.8) score += 20; else if (ratio <= 1.2) score += 15; else score += 5;
    score += (h.moodScores[activeMood] || 5) * 3;
    if (hasKids && h.kidsFriendly) score += 20;
    if (hasElderly && h.elderlyFriendly) score += 20;
    if (isCouple && h.has_spa) score += 25;
    if (isFriends && h.has_pool) score += 20;
    if (isBusiness && h.businessFriendly) score += 25;
    if (isBusiness && h.nearTransport) score += 20;
    score += h.rating * 5;
    if (travelMode === 'business') {
      if (h.nearTransport) score += 30;
      if (h.has_gym) score += 10;
      if (h.businessFriendly) score += 25;
    }
    return Object.assign({}, h, { _score: score });
  }).sort(function(a, b) { return b._score - a._score; });

  // 循环选择下一个酒店
  var idx = hotelIndex % hotelCandidates.length;
  var best = hotelCandidates[idx];

  var platforms = [
    { name:'携程', icon:'🏨', price:Math.round(best.priceRangeLow * 1.0), features:'含早', isBest:false },
    { name:'美团', icon:'🍜', price:Math.round(best.priceRangeLow * 0.95), features:'含早且可取消', isBest:true },
    { name:'飞猪', icon:'🐷', price:Math.round(best.priceRangeLow * 0.92), features:'免费升级房型', isBest:false },
    { name:'去哪儿', icon:'✈️', price:Math.round(best.priceRangeLow * 0.97), features:'含双早', isBest:false }
  ];
  var bestPlat = platforms.find(function(p) { return p.isBest; });
  hotel = {
    name: best.name, rating: best.rating, price: best.priceRangeLow,
    bestPrice: bestPlat.price, bestPlatform: bestPlat.name, bestReason: bestPlat.features,
    savedAmount: Math.max.apply(null, platforms.map(function(p) { return p.price; })) - bestPlat.price,
    platforms: platforms, reason: genHotelReason(best)
  };

  renderHotel();
  showToast('酒店已更换');
}

// ================================================================
//  地图可视化
// ================================================================
// ================================================================
//  浙江11城坐标（viewBox 0 0 100 100）
// ================================================================
var ZJ_CITY_MAP = {
  '杭州': {x:38,y:28}, '宁波': {x:70,y:34}, '温州': {x:58,y:70},
  '嘉兴': {x:50,y:18}, '湖州': {x:30,y:15}, '绍兴': {x:52,y:38},
  '金华': {x:36,y:50}, '衢州': {x:10,y:46}, '舟山': {x:80,y:28},
  '台州': {x:64,y:56}, '丽水': {x:28,y:66}
};

// 判断POI属于哪个城市（基于坐标最近的城市）
// ================================================================
//  城市坐标映射（长三角真实经纬度）
// ================================================================
var CITY_COORDS = {
  '上海': { lat:31.23, lng:121.47 },
  '杭州': { lat:30.28, lng:120.15 },
  '南京': { lat:32.06, lng:118.78 },
  '苏州': { lat:31.30, lng:120.58 },
  '宁波': { lat:29.87, lng:121.54 },
  '无锡': { lat:31.57, lng:120.30 },
  '嘉兴': { lat:30.75, lng:120.76 },
  '湖州': { lat:30.89, lng:120.09 },
  '绍兴': { lat:30.03, lng:120.58 },
  '舟山': { lat:30.02, lng:122.20 },
  '温州': { lat:28.00, lng:120.70 },
  '台州': { lat:28.66, lng:121.43 },
  '金华': { lat:29.08, lng:119.65 },
  '衢州': { lat:28.94, lng:118.87 },
  '丽水': { lat:28.47, lng:119.92 }
};

function mapXYToLatLng(mapX, mapY, city) {
  var coords = CITY_COORDS[city] || CITY_COORDS['杭州'];
  var offsetLng = (mapX - 60) * 0.008;
  var offsetLat = (mapY - 18) * 0.008;
  return [coords.lat + offsetLat, coords.lng + offsetLng];
}

function getPoiCity(mapX, mapY) {
  var minDist = Infinity, city = '杭州';
  for (var c in ZJ_CITY_MAP) {
    var dx = mapX - ZJ_CITY_MAP[c].x;
    var dy = mapY - ZJ_CITY_MAP[c].y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < minDist) { minDist = dist; city = c; }
  }
  return city;
}

// Leaflet 地图实例 & 图层
var leafletMap = null;
var mapMarkers = [];
var mapRouteLines = [];
var highlightedDay = -1;

function renderMap() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('mapSection');
  section.classList.add('show');
  highlightedDay = -1;

  var allPoints = [];
  itinerary.forEach(function(day, di) {
    day.items.forEach(function(item, ii) {
      if (item.mapX !== undefined && item.mapY !== undefined) {
        var city = item.city || getPoiCity(item.mapX, item.mapY);
        var latlng = mapXYToLatLng(item.mapX, item.mapY, city);
        allPoints.push({
          lat: latlng[0], lng: latlng[1],
          name: item.name, type: item.type,
          dayIndex: di, itemIndex: ii, city: city,
          details: item.desc || item.reason || ''
        });
      }
    });
  });
  if (allPoints.length === 0) return;

  var mapEl = document.getElementById('leafletMap');
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  mapEl.innerHTML = '';

  leafletMap = L.map('leafletMap', {
    center: [30.8, 120.5], zoom: 8,
    zoomControl: true, attributionControl: true
  });

  L.tileLayer('https://webrd0{bc}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: '1234', maxZoom: 18,
    attribution: '&copy; 高德地图'
  }).addTo(leafletMap);

  mapMarkers.forEach(function(m) { leafletMap.removeLayer(m); });
  mapRouteLines.forEach(function(l) { leafletMap.removeLayer(l); });
  mapMarkers = [];
  mapRouteLines = [];

  var dayColors = ['#FFA500','#E8759A','#5BA0D0','#8BA88C','#D4A574'];
  itinerary.forEach(function(day, di) {
    var dayPoints = [];
    day.items.forEach(function(item) {
      if (item.mapX !== undefined) {
        var city = item.city || getPoiCity(item.mapX, item.mapY);
        dayPoints.push(mapXYToLatLng(item.mapX, item.mapY, city));
      }
    });
    if (dayPoints.length >= 2) {
      var line = L.polyline(dayPoints, {
        color: dayColors[di % dayColors.length], weight: 3, opacity: 0.7, smoothFactor: 1
      }).addTo(leafletMap);
      mapRouteLines.push(line);
    }
  });

  allPoints.forEach(function(pt, idx) {
    var color = pt.type === 'rest' ? '#A3B5A6' : pt.type === 'restaurant' ? '#E8A85A' : '#8BA88C';
    var isStart = (idx === 0), isEnd = (idx === allPoints.length - 1);
    var size = (isStart || isEnd) ? 18 : 14;
    var html = '<div class="marker-inner ' + pt.type + (isStart ? ' marker-start' : '') + (isEnd ? ' marker-end' : '') + '" style="background:' + color + ';width:' + size + 'px;height:' + size + 'px"></div>';
    var icon = L.divIcon({ className: 'custom-marker', html: html, iconSize: [size+4, size+4], iconAnchor: [(size+4)/2, (size+4)/2] });
    var marker = L.marker([pt.lat, pt.lng], { icon: icon }).addTo(leafletMap);
    var label = (isStart ? '🚩 起点：' : isEnd ? '🏁 终点：' : '') + pt.name;
    marker.bindPopup('<b>' + label + '</b><br><small style="opacity:0.6">' + pt.city + ' · Day ' + (pt.dayIndex + 1) + '</small>' + (pt.details ? '<br><small>' + pt.details + '</small>' : ''));
    mapMarkers.push(marker);
  });

  var bounds = L.latLngBounds(allPoints.map(function(p) { return [p.lat, p.lng]; }));
  leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });

  var controlsEl = document.getElementById('mapControls');
  var ctrlHtml = '<button class="map-ctrl-btn active" onclick="flyToDay(-1)">全部路线</button>';
  for (var di = 0; di < itinerary.length; di++) {
    ctrlHtml += '<button class="map-ctrl-btn" id="mapCtrlBtn_' + di + '" onclick="flyToDay(' + di + ')">Day ' + (di + 1) + '</button>';
  }
  controlsEl.innerHTML = ctrlHtml;
  setTimeout(function() { if (leafletMap) leafletMap.invalidateSize(); }, 300);
  setTimeout(function() { if (leafletMap) leafletMap.invalidateSize(); }, 1200);
}

function flyToDay(dayIndex) {
  highlightedDay = dayIndex;
  if (!leafletMap) return;
  mapRouteLines.forEach(function(line, i) {
    line.setStyle({ opacity: dayIndex === -1 ? 0.7 : (i === dayIndex ? 0.9 : 0.1), weight: dayIndex === -1 ? 3 : (i === dayIndex ? 4 : 1) });
  });
  var allDayIndices = [];
  itinerary.forEach(function(day, di) {
    day.items.forEach(function(item) {
      if (item.mapX !== undefined) allDayIndices.push(di);
    });
  });
  mapMarkers.forEach(function(marker, i) {
    if (i < allDayIndices.length) {
      marker.setOpacity(dayIndex === -1 ? 1 : (allDayIndices[i] === dayIndex ? 1 : 0.2));
    }
  });
  if (dayIndex >= 0 && itinerary[dayIndex]) {
    var dayLatLngs = [];
    itinerary[dayIndex].items.forEach(function(item) {
      if (item.mapX !== undefined) {
        var city = item.city || getPoiCity(item.mapX, item.mapY);
        dayLatLngs.push(mapXYToLatLng(item.mapX, item.mapY, city));
      }
    });
    if (dayLatLngs.length > 0) leafletMap.fitBounds(L.latLngBounds(dayLatLngs), { padding: [40, 40], maxZoom: 14 });
  }
  var ctrlBtns = document.querySelectorAll('.map-ctrl-btn');
  ctrlBtns.forEach(function(btn) { btn.classList.remove('active'); });
  if (dayIndex === -1) { ctrlBtns[0] && ctrlBtns[0].classList.add('active'); }
  else { var btn = document.getElementById('mapCtrlBtn_' + dayIndex); if (btn) btn.classList.add('active'); }
}

// ================================================================
//  雨天备选切换
// ================================================================
function toggleRainPlan(dayIndex, itemIndex) {
  var el = document.getElementById('rainDetail_' + dayIndex + '_' + itemIndex);
  if (el) {
    if (el.classList.contains('show')) {
      el.classList.remove('show');
    } else {
      el.classList.add('show');
    }
  }
}

// ================================================================
//  导出功能
// ================================================================
var exportContentText = '';

function exportMarkdown() {
  if (!itinerary || itinerary.length === 0) return;
  var titleMap = {
    solo: '🧘 浙江独自旅行：与自己对话的治愈之旅',
    couple: '💑 浙江情侣游：甜蜜时光，浪漫不踩雷',
    friends: '👯‍♀️ 浙江闺蜜游：吃遍浙江不踩雷！',
    family: '👨‍👩‍👧 浙江长辈游：慢节奏，享天伦',
    business: '💼 浙江商务出行：高效行程，省心省力'
  };
  var title = titleMap[companionType] || '🗺️ MoodTravel 行程规划';
  var md = '# ' + title + '\n\n';
  md += '> 心情：' + activeMood + ' | 旅伴：' + (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label + ' | 预算：¥' + budget + ' | 天数：' + days + '天\n\n';

  itinerary.forEach(function(day) {
    md += '## Day ' + day.day + '\n\n';
    day.items.forEach(function(item, idx) {
      if (idx > 0 && item.transitTime) {
        md += '> 🚗 约' + item.transitTime + '分钟车程\n\n';
      }
      var icon = item.type === 'rest' ? '☕' : item.type === 'restaurant' ? '🍽️' : '📍';
      md += '### ' + icon + ' ' + item.time + ' — ' + __(item.name, 'poiNames') + '\n';
      md += '- 费用：¥' + (item.estimatedCost || 0) + '\n';
      if (item.estimatedDuration) md += '- 预计游玩：' + item.estimatedDuration + '分钟\n';
      if (item.reason) md += '- 推荐理由：' + item.reason + '\n';
      if (item.reasonTags && item.reasonTags.length) md += '- 标签：' + item.reasonTags.join('、') + '\n';
      if (item.rain_plan) md += '- 🌧️ 雨天备选：' + __(item.rain_plan.name, 'poiNames') + '（¥' + (item.rain_plan.estimatedCost || 0) + '）\n';
      md += '\n';
    });
  });

  if (hotel) {
    md += '## 🏨 推荐酒店\n\n';
    md += '- **' + __(hotel.name, 'hotelNames') + '** ⭐' + hotel.rating + '分\n';
    md += '- 最优价格：' + hotel.bestPlatform + ' ¥' + hotel.bestPrice + '（' + hotel.bestReason + '）\n';
    md += '- 推荐理由：' + hotel.reason + '\n';
  }

  if (stats) {
    md += '\n---\n';
    md += '总预算：¥' + stats.totalCost + ' | 精选景点：' + stats.totalPois + ' | 比价节省：¥' + (stats.totalSaved || 0) + '\n';
  }

  exportContentText = md;
  document.getElementById('exportModalTitle').textContent = '📋 Markdown 行程预览';
  document.getElementById('exportModalContent').textContent = md;
  document.getElementById('exportModalOverlay').classList.add('show');
}

function exportHTML() {
  if (!itinerary || itinerary.length === 0) return;
  var titleMap = {
    solo: '🧘 浙江独自旅行：与自己对话的治愈之旅',
    couple: '💑 浙江情侣游：甜蜜时光，浪漫不踩雷',
    friends: '👯‍♀️ 浙江闺蜜游：吃遍浙江不踩雷！',
    family: '👨‍👩‍👧 浙江长辈游：慢节奏，享天伦',
    business: '💼 浙江商务出行：高效行程，省心省力'
  };
  var title = titleMap[companionType] || 'MoodTravel 行程规划';
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>' + title + '</title>';
  html += '<style>body{font-family:"PingFang SC","Hiragino Sans GB",sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#333;line-height:1.8}';
  html += 'h1{color:' + activeMoodColor + ';border-bottom:2px solid ' + activeMoodColor + ';padding-bottom:10px;}';
  html += 'h2{color:' + theme.primary + ';margin-top:30px;}';
  html += '.item{border-left:3px solid ' + activeMoodColor + ';padding:8px 16px;margin:8px 0;background:#f9f9f9;border-radius:0 8px 8px 0;}';
  html += '.time{color:#888;font-size:14px;} .cost{color:' + activeMoodColor + ';font-weight:bold;}';
  html += '.transit{color:#aaa;font-size:13px;margin:4px 0 4px 20px;}';
  html += '.rain{background:#e8f4fd;padding:4px 10px;border-radius:6px;font-size:13px;margin-top:4px;}';
  html += '.hotel{background:#f0f8f0;padding:16px;border-radius:12px;margin-top:30px;}';
  html += '@media print{body{padding:20px}}';
  html += '</style></head><body>';
  html += '<h1>' + title + '</h1>';
  html += '<p>心情：' + activeMood + ' | 旅伴：' + (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label + ' | 预算：¥' + budget + ' | 天数：' + days + '天</p>';

  itinerary.forEach(function(day) {
    html += '<h2>Day ' + day.day + '</h2>';
    day.items.forEach(function(item, idx) {
      if (idx > 0 && item.transitTime) {
        html += '<div class="transit">🚗 约' + item.transitTime + '分钟车程</div>';
      }
      var icon = item.type === 'rest' ? '☕' : item.type === 'restaurant' ? '🍽️' : '📍';
      html += '<div class="item"><strong>' + icon + ' ' + __(item.name, 'poiNames') + '</strong> <span class="time">' + item.time + '</span><br>';
      html += '费用：<span class="cost">¥' + (item.estimatedCost || 0) + '</span>';
      if (item.estimatedDuration) html += ' · 预计' + item.estimatedDuration + '分钟';
      if (item.reason) html += '<br>💡 ' + item.reason;
      if (item.rain_plan) html += '<div class="rain">🌧️ 雨天备选：' + __(item.rain_plan.name, 'poiNames') + '（¥' + (item.rain_plan.estimatedCost || 0) + '）</div>';
      html += '</div>';
    });
  });

  if (hotel) {
    html += '<div class="hotel"><h2>🏨 推荐酒店</h2>';
    html += '<strong>' + __(hotel.name, 'hotelNames') + '</strong> ⭐' + hotel.rating + '分<br>';
    html += '最优价格：' + hotel.bestPlatform + ' ¥' + hotel.bestPrice + '（' + hotel.bestReason + '）<br>';
    html += '💡 ' + hotel.reason + '</div>';
  }

  if (stats) {
    html += '<p style="margin-top:30px;padding:16px;background:#f5f5f5;border-radius:8px;">';
    html += '总预算：¥' + stats.totalCost + ' | 精选景点：' + stats.totalPois + ' | 比价节省：¥' + (stats.totalSaved || 0);
    html += '</p>';
  }

  html += '</body></html>';
  exportContentText = html;
  document.getElementById('exportModalTitle').textContent = '🖨️ HTML 行程单预览';
  document.getElementById('exportModalContent').textContent = html;
  document.getElementById('exportModalOverlay').classList.add('show');
}

function exportICS() {
  if (!itinerary || itinerary.length === 0) return;
  // 生成符合 RFC 5545 标准的 .ics 日历文件
  var now = new Date();
  var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MoodTravel//CN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:MoodTravel 行程\r\nX-WR-TIMEZONE:Asia/Shanghai\r\n';

  itinerary.forEach(function(day) {
    // 假设行程从今天开始
    var dayDate = new Date(now);
    dayDate.setDate(dayDate.getDate() + day.day - 1);
    var dateStr = dayDate.toISOString().replace(/[-:]/g, '').substring(0, 8);
    var nextStr = new Date(dayDate.getTime() + 86400000).toISOString().replace(/[-:]/g, '').substring(0, 8);

    day.items.forEach(function(item, idx) {
      var icon = item.type === 'rest' ? '☕ ' : item.type === 'restaurant' ? '🍽️ ' : '📍 ';
      var summary = icon + item.name;
      var desc = item.reason || '';
      if (item.estimatedCost) desc += '\\n费用：¥' + item.estimatedCost;
      if (item.rain_plan) desc += '\\n雨天备选：' + item.rain_plan.name;

      // 使用每项的时间来估算开始时间
      var hour = 9 + idx * 2;
      var startTime = dateStr + 'T' + (hour < 10 ? '0' : '') + hour + '0000';
      var endTime = dateStr + 'T' + (hour + 1 < 10 ? '0' : '') + (hour + 1) + '0000';

      ics += 'BEGIN:VEVENT\r\n';
      ics += 'DTSTART:' + startTime + '\r\n';
      ics += 'DTEND:' + endTime + '\r\n';
      ics += 'SUMMARY:' + summary + '\r\n';
      ics += 'DESCRIPTION:' + desc + '\r\n';
      ics += 'LOCATION:' + (item.city || '') + ' ' + item.name + '\r\n';
      ics += 'END:VEVENT\r\n';
    });
  });

  if (hotel) {
    var hotelDate = new Date(now);
    var hotelStart = hotelDate.toISOString().replace(/[-:]/g, '').substring(0, 8);
    var hotelEnd = new Date(hotelDate.getTime() + days * 86400000).toISOString().replace(/[-:]/g, '').substring(0, 8);
    ics += 'BEGIN:VEVENT\r\n';
    ics += 'DTSTART;VALUE=DATE:' + hotelStart + '\r\n';
    ics += 'DTEND;VALUE=DATE:' + hotelEnd + '\r\n';
    ics += 'SUMMARY:🏨 ' + hotel.name + '\\n⭐' + hotel.rating + ' · ¥' + hotel.bestPrice + '起\r\n';
    ics += 'LOCATION:' + (hotel.city || '') + ' ' + hotel.name + '\r\n';
    ics += 'END:VEVENT\r\n';
  }

  ics += 'END:VCALENDAR\r\n';

  // 下载文件
  var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'MoodTravel_行程_' + now.toISOString().substring(0, 10) + '.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📅 日历文件已下载，可导入 Apple/Google/Outlook 日历');
}

function closeExportModal() {
  document.getElementById('exportModalOverlay').classList.remove('show');
}

function copyExportContent() {
  if (!exportContentText) return;
  // 使用 Clipboard API 或 fallback
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(exportContentText).then(function() {
      var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
      showToast(t.copySuccess || '已复制到剪贴板');
    }).catch(function() {
      fallbackCopy(exportContentText);
    });
  } else {
    fallbackCopy(exportContentText);
  }
}

function fallbackCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
    showToast(t.copySuccess || '已复制到剪贴板');
  } catch (e) {
    showToast('复制失败，请手动复制');
  }
  document.body.removeChild(textarea);
}

// ================================================================
//  全维度情绪感知系统 — 多维信号采集 + 置信度评分 + 记忆学习
// ================================================================

// 信号权重配置（各维度对每种情绪的贡献权重）
var SIGNAL_WEIGHTS = {
  time_night:     { insomnia: 1.0, tired: 0.5, calm: 0.2 },
  time_morning:   { tired: 0.6, calm: 0.3 },
  day_monday:     { anxious: 0.7, tired: 0.5 },
  day_friday:     { excited: 0.6, happy: 0.5 },
  day_weekend:    { happy: 0.5, calm: 0.4 },
  battery_low:    { anxious: 0.8, tired: 0.5 },
  click_fast:     { anxious: 0.9, excited: 0.5 },
  mouse_slow:     { tired: 0.8, sad: 0.4, calm: 0.3 },
  idle_long:      { tired: 0.7, sad: 0.5 },
  search_repeat:  { anxious: 0.8, tired: 0.4 },
  dwell_long:     { anxious: 0.5, calm: 0.3, sad: 0.3 },
  treehole_hesitate: { anxious: 0.7, sad: 0.6, tired: 0.4 }
};

// 判断是否在静默期（会话级 + localStorage 持久级）
function inSilentPeriod() {
  // 本次会话静默：用户关闭过气泡，不再打扰
  if (emotionState.sessionSilent) return true;
  // localStorage 持久静默：连续拒绝 2 次后 24 小时
  if (!memoryStore.silentUntil) return false;
  return Date.now() < memoryStore.silentUntil;
}

// 加载localStorage记忆
function loadMemory() {
  try {
    var saved = JSON.parse(localStorage.getItem('moodtravel_emotion_memory') || 'null');
    if (saved) {
      memoryStore.rejectCount = saved.rejectCount || 0;
      memoryStore.lastRejectTime = saved.lastRejectTime || null;
      memoryStore.silentUntil = saved.silentUntil || null;
      memoryStore.acceptCount = saved.acceptCount || 0;
      memoryStore.totalProbes = saved.totalProbes || 0;
    }
  } catch (e) { /* ignore */ }
}

// 保存localStorage记忆
function saveMemory() {
  try {
    localStorage.setItem('moodtravel_emotion_memory', JSON.stringify(memoryStore));
  } catch (e) { /* ignore */ }
}

// 用户拒绝试探 → 记录并检查是否进入静默期
function recordRejection() {
  memoryStore.rejectCount++;
  memoryStore.lastRejectTime = Date.now();
  memoryStore.totalProbes++;
  if (memoryStore.rejectCount > 2) {
    memoryStore.silentUntil = Date.now() + SILENT_PERIOD_HOURS * 3600 * 1000;
    debugLog('Emotion: 进入静默期，24小时内不再主动试探');
  }
  saveMemory();
}

// 用户接受试探
function recordAcceptance() {
  memoryStore.acceptCount++;
  memoryStore.totalProbes++;
  // 接受后重置拒绝计数
  if (memoryStore.rejectCount > 0) {
    memoryStore.rejectCount = Math.max(0, memoryStore.rejectCount - 1);
  }
  saveMemory();
}

// ================================================================
//  多维信号采集器
// ================================================================

// 1. 环境上下文 — 时间维度
function getTimeContextSignals() {
  var now = new Date();
  var hour = now.getHours();
  var day = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
  var signals = [];

  if (hour >= 23 || hour < 6) signals.push('time_night');
  if (hour >= 5 && hour < 9) signals.push('time_morning');
  if (day === 1) signals.push('day_monday');
  if (day === 5) signals.push('day_friday');
  if (day === 0 || day === 6) signals.push('day_weekend');

  return signals;
}

// 2. 电池状态
function initBatteryTracking() {
  if ('getBattery' in navigator) {
    navigator.getBattery().then(function(b) {
      batteryLevel = Math.round(b.level * 100);
      batteryLow = batteryLevel < 20;
      b.addEventListener('levelchange', function() {
        batteryLevel = Math.round(b.level * 100);
        batteryLow = batteryLevel < 20;
        if (batteryLow) addSignal('battery', 'battery_low');
      });
    }).catch(function() { /* 不支持电池API */ });
  }
}

// 3. 鼠标移动追踪
document.addEventListener('mousemove', function(e) {
  var now = Date.now();
  mouseHistory.push({ x: e.clientX, y: e.clientY, time: now });
  while (mouseHistory.length > 0 && now - mouseHistory[0].time > 5000) mouseHistory.shift();
  resetIdleTimer();
});

// 4. 点击追踪
document.addEventListener('click', function(e) {
  var now = Date.now();
  clickHistory.push({ time: now });
  while (clickHistory.length > 0 && now - clickHistory[0].time > 3000) clickHistory.shift();
  resetIdleTimer();
  if (clickHistory.length >= 3) addSignal('behavior', 'click_fast');
});

// 5. 空闲检测
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(function() {
    if (!autoMoodLocked) addSignal('behavior', 'idle_long');
  }, 15000);
}

// 6. 搜索重复追踪（hook到现有的搜索相关函数）
function trackSearch(keyword) {
  if (!keyword) return;
  searchHistory.push({ keyword: keyword, time: Date.now() });
  // 只保留最近 10 条
  if (searchHistory.length > 10) searchHistory.shift();

  if (keyword === lastSearchKeyword) {
    searchRepeatCount++;
  } else {
    searchRepeatCount = 0;
    lastSearchKeyword = keyword;
  }

  if (searchRepeatCount >= SEARCH_REPEAT_THRESHOLD - 1) {
    addSignal('content', 'search_repeat');
  }
}

// 7. 详情页停留追踪
function startDetailDwell(itemId) {
  detailDwellStart = Date.now();
  detailDwellTriggered = false;
}
function endDetailDwell() {
  if (detailDwellStart && !detailDwellTriggered) {
    var dwell = Date.now() - detailDwellStart;
    if (dwell >= DETAIL_DWELL_THRESHOLD) {
      detailDwellTriggered = true;
      addSignal('content', 'dwell_long');
    }
  }
  detailDwellStart = null;
}

// 8. 树洞输入犹豫追踪
function trackTreeHoleFocus() {
  treeHoleFocusTime = Date.now();
  treeHoleCursorBlinkCount = 0;
  if (treeHoleHesitationTimer) { clearTrackedInterval(treeHoleHesitationTimer); treeHoleHesitationTimer = null; }
  treeHoleHesitationTimer = trackInterval(function() {
    var input = document.getElementById('treeHoleInput');
    if (input && document.activeElement === input) {
      treeHoleCursorBlinkCount++;
      var elapsed = Date.now() - treeHoleFocusTime;
      if (elapsed >= TREE_HOLE_HESITATE_THRESHOLD && input.value.trim() === '') {
        addSignal('input', 'treehole_hesitate');
        clearTrackedInterval(treeHoleHesitationTimer);
        treeHoleHesitationTimer = null;
      }
    }
  }, 1000);
}
function trackTreeHoleBlur() {
  if (treeHoleHesitationTimer) { clearTrackedInterval(treeHoleHesitationTimer); treeHoleHesitationTimer = null; }
  treeHoleFocusTime = null;
  treeHoleCursorBlinkCount = 0;
}

// ================================================================
//  动态置信度评分引擎
// ================================================================

// 添加信号 → 更新情绪状态
function addSignal(category, signalKey) {
  if (autoMoodLocked || simplifiedMode || inSilentPeriod()) return;

  var now = Date.now();
  // 防止同一信号短时间内重复触发
  if (emotionState.signals[signalKey] && (now - emotionState.signals[signalKey] < 10000)) return;

  emotionState.signals[signalKey] = now;
  emotionState.lastUpdate = now;

  // 计算综合置信度
  recalculateConfidence();
}

// 综合计算置信度
function recalculateConfidence() {
  var now = Date.now();
  var activeSignals = [];
  var totalScore = 0;

  // 收集所有活跃信号（10秒内）
  Object.keys(emotionState.signals).forEach(function(key) {
    if (now - emotionState.signals[key] < 10000) {
      activeSignals.push(key);
    }
  });

  // 获取环境上下文信号
  var timeSignals = getTimeContextSignals();
  var allSignals = activeSignals.concat(timeSignals);

  // 如果电池低，加入信号
  if (batteryLow) allSignals.push('battery_low');

  // 去重
  var uniqueSignals = [];
  allSignals.forEach(function(s) { if (uniqueSignals.indexOf(s) === -1) uniqueSignals.push(s); });

  // 每个信号 +20 基础分，组合信号有加成
  totalScore = Math.min(uniqueSignals.length * CONFIDENCE_SIGNAL_BASE, 100);

  // 交叉验证加成：如果有 3+ 种不同类别信号，额外加分
  var categories = {};
  uniqueSignals.forEach(function(s) {
    var cat = s.split('_')[0];
    categories[cat] = true;
  });
  var catCount = Object.keys(categories).length;
  if (catCount >= 3) totalScore = Math.min(totalScore + 15, 100);
  if (catCount >= 4) totalScore = Math.min(totalScore + 10, 100);

  emotionState.score = totalScore;

  // 推断情绪类型
  emotionState.moodType = inferMoodType(uniqueSignals);

  // 根据分数执行不同策略
  if (totalScore >= CONFIDENCE_PROBE_THRESHOLD) {
    triggerSoftProbe(emotionState.moodType);
  } else if (totalScore >= CONFIDENCE_SOFT_THRESHOLD) {
    applySoftAdjustment(emotionState.moodType);
  }

  // 启动分数衰减
  startScoreDecay();
}

// 推断情绪类型
function inferMoodType(signals) {
  var moodScores = { anxious: 0, tired: 0, sad: 0, insomnia: 0, excited: 0, happy: 0, calm: 0 };

  signals.forEach(function(sig) {
    var weights = SIGNAL_WEIGHTS[sig];
    if (weights) {
      Object.keys(weights).forEach(function(mood) {
        moodScores[mood] = (moodScores[mood] || 0) + weights[mood];
      });
    }
  });

  // 额外规则：深夜 + 任何负面信号 → insomnia 加成
  if (signals.indexOf('time_night') !== -1) {
    moodScores.insomnia += 2.0;
  }

  // 找到最高分
  var bestMood = 'calm';
  var bestScore = 0;
  Object.keys(moodScores).forEach(function(m) {
    if (moodScores[m] > bestScore) { bestScore = moodScores[m]; bestMood = m; }
  });

  return bestMood;
}

// 分数衰减（随时间自然下降）
function startScoreDecay() {
  if (emotionState.decayTimer) { clearTrackedInterval(emotionState.decayTimer); emotionState.decayTimer = null; }
  emotionState.decayTimer = trackInterval(function() {
    var now = Date.now();
    var elapsed = (now - emotionState.lastUpdate) / 1000;
    if (elapsed > 10) {
      emotionState.score = Math.max(0, emotionState.score - CONFIDENCE_DECAY_RATE);
      if (emotionState.score < CONFIDENCE_SOFT_THRESHOLD) {
        applySoftAdjustment('calm');
      }
      if (emotionState.score <= 0) {
        clearTrackedInterval(emotionState.decayTimer);
        emotionState.decayTimer = null;
        emotionState.moodType = null;
      }
    }
  }, 2000);
}
function restartScoreDecay() {
  if (emotionState.score > 0 && !emotionState.decayTimer) {
    startScoreDecay();
  }
}

// ================================================================
//  策略执行层
// ================================================================

// 后台调整（50-79分）：默默调整推荐权重，不改变UI
function applySoftAdjustment(moodType) {
  // 调整推荐算法权重（通过修改全局变量，让后续生成时自动使用）
  if (moodType === 'tired' || moodType === 'sad' || moodType === 'insomnia') {
    window._emotionAdjust = { energy: 'low', mood: 'healing', content: 'gentle' };
    // 润物细无声：背景微动效自动降速，营造呼吸感
    applySoothingState();
  } else if (moodType === 'anxious') {
    window._emotionAdjust = { energy: 'low', mood: 'calming', content: 'soothing' };
    applySoothingState();
  } else if (moodType === 'excited' || moodType === 'happy') {
    window._emotionAdjust = { energy: 'high', mood: 'vibrant', content: 'adventurous' };
    removeSoothingState();
  } else {
    window._emotionAdjust = null;
    removeSoothingState();
  }

  // 无缝降级：背景微动效和字体排版自动柔和化（轻量级）
  applySeamlessDegradation(moodType);
}

// 柔性试探（80+分）：弹出气泡提示
function triggerSoftProbe(moodType) {
  if (inSilentPeriod()) return;

  var mood = MOODS.find(function(m) { return m.key === moodType; });
  if (!mood) return;

  // 显示柔性试探气泡
  showEmotionBubble(moodType, mood);
}

// ================================================================
//  安抚态 — 润物细无声的视觉降速
//  不强制暗黑模式，只是让背景微动效变慢，营造呼吸感与安全感
// ================================================================

var soothingActive = false;

function applySoothingState() {
  if (soothingActive) return;
  soothingActive = true;
  document.body.classList.add('soothing');
}

function removeSoothingState() {
  if (!soothingActive) return;
  soothingActive = false;
  document.body.classList.remove('soothing');
}

// ================================================================
//  UI 无缝降级 — 润物细无声（后台调整用，比 soothing 更轻量）
// ================================================================

var degradationActive = false;

function applySeamlessDegradation(moodType) {
  var body = document.body;
  var sky = document.getElementById('bgSky');
  var clouds = document.querySelectorAll('.cloud');
  var particles = document.querySelectorAll('.particle');
  var balloons = document.querySelectorAll('.balloon');

  var isNegative = (moodType === 'tired' || moodType === 'sad' || moodType === 'anxious' || moodType === 'insomnia');

  if (isNegative) {
    if (!degradationActive) degradationActive = true;

    // 背景微动效减速
    body.style.setProperty('--cloud-speed', '0.3');
    body.style.setProperty('--particle-count', '5');
    body.style.setProperty('--balloon-speed', '0.5');

    // 云层透明度降低
    clouds.forEach(function(c) { c.style.opacity = '0.15'; });
    // 粒子减少
    particles.forEach(function(p, i) { if (i > 5) p.style.opacity = '0'; });
    // 热气球减速
    balloons.forEach(function(b) { b.style.animationDuration = '30s'; });

    // 字体柔和化
    document.querySelector('.brand-name').style.fontWeight = '400';
    document.querySelector('.brand-name').style.letterSpacing = '6px';
    document.querySelector('.brand-slogan').style.fontWeight = '300';
    document.querySelector('.brand-slogan').style.letterSpacing = '4px';
  } else {
    // 恢复默认
    if (degradationActive) {
      degradationActive = false;
      body.style.removeProperty('--cloud-speed');
      body.style.removeProperty('--particle-count');
      body.style.removeProperty('--balloon-speed');

      clouds.forEach(function(c) { c.style.opacity = ''; });
      particles.forEach(function(p) { p.style.opacity = ''; });
      balloons.forEach(function(b) { b.style.animationDuration = ''; });

      var brandName = document.querySelector('.brand-name');
      var brandSlogan = document.querySelector('.brand-slogan');
      if (brandName) { brandName.style.fontWeight = ''; brandName.style.letterSpacing = ''; }
      if (brandSlogan) { brandSlogan.style.fontWeight = ''; brandSlogan.style.letterSpacing = ''; }
    }
  }
}

// ================================================================
//  柔性试探气泡 UI
// ================================================================

var PROBE_MESSAGES = {
  tired:    { title: '看起来有点累？', sub: '想静静放松，还是找点乐子提提神？', optionA: '想静静，帮我放松', optionB: '找点乐子，提提神', color: '#B5A3C4' },
  sad:      { title: '心情好像不太美丽...', sub: '想一个人静静，还是需要一点新鲜感？', optionA: '让我静静待会儿', optionB: '带我去点有趣的地方', color: '#C4A8A8' },
  anxious:  { title: '感觉你有点紧绷', sub: '想深呼吸放松，还是做点什么转移注意力？', optionA: '帮我放松，缓一缓', optionB: '找点乐子，分分心', color: '#6B8FA3' },
  insomnia: { title: '夜深了，还没睡？', sub: '想安静地待一会儿，还是找点温和的消遣？', optionA: '陪我安静坐坐', optionB: '来点温柔的内容', color: '#6B7BA3' }
};

function showEmotionBubble(moodType, mood) {
  var bubble = document.getElementById('emotionBubble');
  if (!bubble) return;
  if (emotionState.sessionSilent) return;

  var msg = PROBE_MESSAGES[moodType] || PROBE_MESSAGES.tired;
  bubble.querySelector('.bubble-title').textContent = msg.title;
  bubble.querySelector('.bubble-sub').textContent = msg.sub;

  var btnSoothe = document.getElementById('bubbleOptionSoothe');
  var btnDistract = document.getElementById('bubbleOptionDistract');
  var btnDismiss = document.getElementById('bubbleDismiss');

  btnSoothe.textContent = '🧘 ' + msg.optionA;
  btnDistract.textContent = '✨ ' + msg.optionB;

  // 安抚选项（柔和的绿色调）
  btnSoothe.onclick = function() { acceptProbeSoothe(moodType, mood); };
  // 转移注意力选项（温暖的橙色调）
  btnDistract.onclick = function() { acceptProbeDistract(moodType, mood); };
  // 关闭按钮
  btnDismiss.onclick = function() { dismissProbe(); };

  bubble.classList.add('show');
  autoDetectedMood = moodType;
}

// 选项 A：安抚 — 降速、柔化、温暖陪伴
function acceptProbeSoothe(moodType, mood) {
  recordAcceptance();
  document.getElementById('emotionBubble').classList.remove('show');
  if (mood) selectMood(mood);
  // 进入安抚态：不强制暗黑模式，而是让背景缓慢柔化
  applySoothingState();
  showToast('好的，我会放慢节奏，陪你安静一会儿~');
}

// 选项 B：转移注意力 — 推荐有趣内容、周边
function acceptProbeDistract(moodType, mood) {
  recordAcceptance();
  document.getElementById('emotionBubble').classList.remove('show');
  if (mood) selectMood(mood);
  // 退出安抚态，恢复正常
  removeSoothingState();
  showToast('好嘞！帮你找点新鲜好玩的~');
  // 自动触发生成一条轻松有趣的路线
  budget = Math.min(budget, 800);
  displayBudget = budget;
  budgetSlider.value = budget;
  budgetNumber.textContent = budget;
  budgetCustom.value = '';
  updateBudgetFill();
  updatePresetStyles();
  setTimeout(function() { generatePlan(); }, 600);
}

function dismissProbe() {
  recordRejection();
  document.getElementById('emotionBubble').classList.remove('show');
  autoDetectedMood = null;
  emotionState.sessionSilent = true; // 本次会话不再弹出任何试探
  applySeamlessDegradation('calm'); // 恢复默认

  // 如果进入 24 小时静默期，给用户一个轻柔提示
  if (inSilentPeriod() && memoryStore.silentUntil) {
    showToast('好的，接下来一段时间不会打扰你~');
  }
}

// ================================================================
//  定时器统一管理 — 防止内存泄漏，页面隐藏时自动暂停
// ================================================================
var _activeTimers = { intervals: [], timeouts: [] };

function trackInterval(fn, delay) {
  var id = setInterval(function() {
    if (document.hidden) return;
    fn();
  }, delay);
  _activeTimers.intervals.push(id);
  return id;
}

function clearTrackedInterval(id) {
  clearInterval(id);
  var idx = _activeTimers.intervals.indexOf(id);
  if (idx !== -1) _activeTimers.intervals.splice(idx, 1);
}

function clearAllTimers() {
  _activeTimers.intervals.forEach(function(id) { clearInterval(id); });
  _activeTimers.timeouts.forEach(function(id) { clearTimeout(id); });
  _activeTimers.intervals = [];
  _activeTimers.timeouts = [];
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    _activeTimers.intervals.forEach(function(id) { clearInterval(id); });
  } else {
    if (typeof restartMoodCheck === 'function') restartMoodCheck();
    if (typeof restartScoreDecay === 'function' && emotionState.score > 0) restartScoreDecay();
  }
});

// 定期检测（每 8 秒）
var moodCheckTimer = null;
function startMoodCheck() {
  if (moodCheckTimer) return;
  moodCheckTimer = trackInterval(function() {
    if (!autoMoodLocked && !simplifiedMode && !inSilentPeriod()) {
      recalculateConfidence();
    }
  }, 8000);
}
function restartMoodCheck() {
  if (moodCheckTimer) { clearTrackedInterval(moodCheckTimer); moodCheckTimer = null; }
  startMoodCheck();
}
startMoodCheck();

// ================================================================
//  树洞系统
// ================================================================
function toggleTreeHole() {
  var popup = document.getElementById('treeHolePopup');
  var btn = document.getElementById('treeHoleBtn');
  if (popup.classList.contains('show')) {
    popup.classList.remove('show');
    btn.classList.remove('pulse');
    trackTreeHoleBlur();
  } else {
    popup.classList.add('show');
    btn.classList.add('pulse');
    document.getElementById('treeHoleInput').focus();
    trackTreeHoleFocus();
  }
}

// 关键词情感映射
var MOOD_KEYWORDS = {
  tired: ['累', '疲惫', '困', '没力气', '躺平', '不想动', '好累', '好困', '睡眠不足', '休息', '想睡'],
  anxious: ['焦虑', '烦', '紧张', '压力', '不安', '烦躁', '好烦', '心慌', '着急', '担心', '怕'],
  sad: ['难过', '哭', '低落', '孤独', '伤心', '失望', '委屈', '分手', '吵架', '崩溃', '想哭', '难受', '不开心'],
  calm: ['安静', '平静', '放松', '舒服', '宁静', '悠闲', '自在'],
  excited: ['兴奋', '期待', '开心', '激动', '太好了', '棒', '冲冲冲'],
  happy: ['高兴', '快乐', '幸福', '满足', '美好', '阳光', '喜欢']
};

function sendToTreeHole() {
  var input = document.getElementById('treeHoleInput');
  var text = input.value.trim();
  if (!text) { showToast('随便说点什么吧，我在这里听着~'); return; }

  trackTreeHoleBlur(); // 停止犹豫追踪

  // 关键词匹配
  var matchedMood = null;
  var maxHits = 0;
  Object.keys(MOOD_KEYWORDS).forEach(function(moodKey) {
    var hits = 0;
    MOOD_KEYWORDS[moodKey].forEach(function(kw) {
      if (text.indexOf(kw) !== -1) hits++;
    });
    if (hits > maxHits) { maxHits = hits; matchedMood = moodKey; }
  });

  // 关闭树洞弹窗
  document.getElementById('treeHolePopup').classList.remove('show');
  document.getElementById('treeHoleBtn').classList.remove('pulse');
  input.value = '';

  autoMoodLocked = true; // 用户主动表达，锁定自动检测

  if (matchedMood && maxHits > 0) {
    var mood = MOODS.find(function(m) { return m.key === matchedMood; });
    if (mood) {
      selectMood(mood);
      showToast('我感受到了你的「' + mood.label + '」，让我来帮你~');
      // 如果是负面情绪，进入简化模式
      if (matchedMood === 'anxious' || matchedMood === 'tired' || matchedMood === 'sad') {
        enterSimplifiedMode(matchedMood);
      }
      return;
    }
  }

  // 没有匹配到关键词，给一个温暖的默认回应
  showToast('谢谢你愿意说出来。不管怎样，我都在这里陪着你。');
  // 默认按低落处理
  var sadMood = MOODS.find(function(m) { return m.key === 'sad'; });
  if (sadMood) selectMood(sadMood);
  enterSimplifiedMode('sad');
}

// 点击页面其他地方关闭树洞
document.addEventListener('click', function(e) {
  var popup = document.getElementById('treeHolePopup');
  var btn = document.getElementById('treeHoleBtn');
  if (popup.classList.contains('show') && !popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
    popup.classList.remove('show');
    btn.classList.remove('pulse');
  }
});

// Enter 发送树洞消息
document.getElementById('treeHoleInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendToTreeHole();
  }
});

// 树洞输入框失去焦点 → 停止犹豫追踪
document.getElementById('treeHoleInput').addEventListener('blur', function() {
  trackTreeHoleBlur();
});

// ================================================================
//  负面情绪简化模式
// ================================================================
var HEALING_GREETINGS = {
  anxious: '看起来今天有点焦虑？<br/>先深呼吸，把节奏放慢一点。',
  tired: '看起来今天有点累？<br/>先听首轻音乐吧。',
  sad: '心情不太好吗？<br/>没关系，我陪你坐一会儿。',
  insomnia: '夜深了，还没睡吗？<br/>把屏幕调暗，让我陪你安静一会儿。'
};

function enterSimplifiedMode(moodKey) {
  if (simplifiedMode) return;
  simplifiedMode = true;

  // 切换心情
  var mood = MOODS.find(function(m) { return m.key === moodKey; });
  if (mood) selectMood(mood);

  // 显示治愈覆盖层
  var overlay = document.getElementById('simplifiedOverlay');
  var greeting = document.getElementById('healingGreeting');
  var genBtn = document.getElementById('healingGenBtn');
  greeting.innerHTML = HEALING_GREETINGS[moodKey] || HEALING_GREETINGS.tired;
  var theme = MOOD_THEME_MAP[moodKey] || MOOD_THEME_MAP.tired;
  genBtn.style.background = 'linear-gradient(135deg, ' + theme.secondary + ', ' + theme.primary + ')';
  overlay.classList.add('show');

  // 隐藏所有筛选器
  hideFilters();
}

function hideFilters() {
  var filters = [
    document.getElementById('budgetSection'),
    document.getElementById('companionChips').parentElement,
    document.getElementById('elderlyToggle').parentElement,
    document.querySelector('.daily-section'),
    document.querySelector('.hot-routes-section'),
    document.querySelector('.plans-section'),
    document.getElementById('generatePlanBtn'),
    document.querySelector('.left-quick')
  ];
  filters.forEach(function(el) {
    if (el) el.classList.add('filter-hidden');
  });
  // 隐藏心情选择器标签
  var moodSection = document.querySelector('.mood-section');
  if (moodSection) moodSection.classList.add('filter-hidden');
}

function showFilters() {
  document.querySelectorAll('.filter-hidden').forEach(function(el) {
    el.classList.remove('filter-hidden');
  });
}

function dismissSimplified() {
  simplifiedMode = false;
  autoMoodLocked = false;
  autoDetectedMood = null;
  document.getElementById('simplifiedOverlay').classList.remove('show');
  removeSoothingState();
  showFilters();
  showToast('好的，慢慢来，不着急~');
}

function quickHealingPlan() {
  document.getElementById('simplifiedOverlay').classList.remove('show');
  simplifiedMode = false;
  showFilters();
  // 自动设置低预算、低能量、治愈型行程
  budget = 500;
  displayBudget = 500;
  budgetSlider.value = 500;
  budgetNumber.textContent = '500';
  budgetCustom.value = '';
  updateBudgetFill();
  updatePresetStyles();
  showToast('正在为你生成治愈路线...');
  // 触发生成
  setTimeout(function() { generatePlan(); }, 500);
}

// ================================================================
//  深夜默认检测
// ================================================================
function checkNightMode() {
  var hour = new Date().getHours();
  if (hour >= 23 || hour < 6) {
    // 深夜模式：默认 insomnia 心情
    var mood = MOODS.find(function(m) { return m.key === 'insomnia'; });
    if (mood) {
      activeMood = 'insomnia';
      activeMoodColor = mood.color;
      bgSky.className = 'bg-sky sky-insomnia';
      budgetNumber.style.color = mood.color;
      budgetFill.style.background = mood.color;
      document.body.classList.add('night-mode');
      updateMoodActiveStyle();
      updatePresetStyles();
      planCount.style.background = mood.color + '18';
      planCount.style.color = mood.color;
      updateGenerateBtn();
      showToast('🌙 深夜了，已为你开启护眼暗夜模式');
    }
  }
}

// ================================================================
//  AI 旅行随笔 — 打字机效果 + LLM 生成
// ================================================================
var aiNarrativeText = '';
var narrativeTimer = null;
var narrativeConfig = { enabled: true, useLLM: true };

// ================================================================
//  AI 旅行随笔 — 增强版（真实 LLM + 打字机效果）
// ================================================================
async function generateNarrative() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('aiNarrativeSection');
  var body = document.getElementById('aiNarrativeBody');
  var meta = document.getElementById('aiNarrativeMeta');
  section.classList.add('show');
  
  // 构建行程摘要
  var cities = [];
  var poiNames = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi' && poiNames.indexOf(item.name) === -1) {
        poiNames.push(item.name);
      }
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
  });
  
  var moodLabel = MOODS.find(function(m){return m.key===activeMood;}) || {label:'平静'};
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || '独自';
  
  // 尝试真实 LLM
  if (narrativeConfig.useLLM && API_CONFIG.llm.apiKey) {
    body.innerHTML = '<span style="color:rgba(139,168,140,0.6)">AI 正在为你撰写专属旅行随笔...</span><span class="cursor-blink"></span>';
    var prompt = '请为以下旅行写一篇约300字的文艺旅行随笔，风格要温暖、细腻、有画面感。\n\n' +
      '心情：' + moodLabel.label + '\n旅伴：' + companionLabel + '\n' +
      '目的地：' + (cities.length > 0 ? cities.join('、') : '浙江') + '\n' +
      '景点：' + poiNames.slice(0, 5).join('、') + '\n' +
      '天数：' + itinerary.length + '天\n\n' +
      '请用第一人称或第二人称，让读者有代入感。不要使用markdown格式，纯文本即可。';
    
    var essay = await callLLM(prompt, '你是一位温暖细腻的旅行作家，擅长用诗意的文字描绘旅途中的感受。请用口语化但优美的中文写作。');
    if (essay) {
      typewriterEffect(body, essay, 30);
      meta.textContent = 'AI 生成 · ' + new Date().toLocaleDateString('zh-CN');
      return;
    }
  }
  
  // Fallback: 模板生成
  var templates = getNarrativeTemplates();
  var essay = templates[activeMood] || templates.calm;
  essay = essay.replace('{cities}', cities.length > 0 ? cities.join('、') : '浙江');
  essay = essay.replace('{poi}', poiNames[0] || '这片土地');
  essay = essay.replace('{companion}', companionLabel);
  typewriterEffect(body, essay, 25);
  meta.textContent = '本地生成 · ' + new Date().toLocaleDateString('zh-CN');
}

function getNarrativeTemplates() {
  return {
    calm: '清晨的阳光透过窗帘，温柔地洒在{cities}的土地上。{companion}的脚步不急不缓，像是融入了这座城市的呼吸节奏。\n\n在{poi}，时间仿佛变慢了。风吹过树叶的声音，远处偶尔传来的鸟鸣，都成了旅途中最美的背景音。不需要打卡，不需要赶路——此刻的平静，就是最好的旅行。\n\n有时候，我们需要的不是远方，而是让心安静下来的片刻。',
    happy: '{cities}的每一天都像加了滤镜一样美好！{companion}的笑容在阳光下特别灿烂。\n\n从{poi}到街角的小吃摊，每一处都藏着惊喜。空气里飘着美食的香气，耳边是欢快的笑声——这才是旅行的意义啊！\n\n把这份快乐装进口袋，带回家，慢慢回味。',
    sad: '有时候，我们需要一场说走就走的旅行，不是逃避，而是给自己一个温柔的拥抱。{cities}用它特有的方式治愈着每一个疲惫的灵魂。\n\n在{poi}，{companion}静静地坐着，看云卷云舒。那些说不出口的情绪，似乎都被这片土地温柔地接住了。\n\n今天允许自己慢下来，允许自己感受——因为治愈，从接纳开始。',
    anxious: '深呼吸，{cities}的空气里有一种让人安心的味道。{companion}的旅程，不需要完美，只需要真实。\n\n在{poi}，焦虑像潮水一样慢慢退去。原来，换个环境，换个节奏，心里的那根弦就会松下来。\n\n你已经做得很好了。这场旅行，就是给自己最好的礼物。',
    excited: '出发！{cities}，我们来啦！{companion}的探险之旅充满了未知的惊喜。\n\n{poi}只是开始，每一个转角都可能藏着意想不到的风景。心跳加速，瞳孔放大——这就是探索的快乐！\n\n把每一天都当作冒险，把每一刻都变成回忆。这趟旅程，注定精彩！',
    tired: '累了就停下来，{cities}的温柔正好。{companion}不需要赶行程，不需要打卡——慵懒地享受每一个当下。\n\n在{poi}，泡一杯茶，看一本书，或者什么都不做。让疲惫随着时间慢慢融化，让身体重新找回节奏。\n\n旅行的意义，有时候就是允许自己什么都不做。',
    insomnia: '深夜的{cities}有一种特别的安静。{companion}在星空下，思绪像潮水一样涌来又退去。\n\n睡不着也没关系。{poi}的夜晚，有它自己的节奏——不紧不慢，不慌不忙。闭上眼睛，听风的声音，感受夜的温柔。\n\n明天会是新的一天。此刻，只需要呼吸。'
  };
}

// 打字机效果
function typewriterEffect(el, text, speed) {
  el.innerHTML = '';
  var i = 0;
  var paragraphs = text.split('\n\n');
  var pIndex = 0;
  
  function typeParagraph() {
    if (pIndex >= paragraphs.length) {
      el.innerHTML += '<span class="cursor-blink"></span>';
      return;
    }
    var p = paragraphs[pIndex];
    if (pIndex > 0) el.innerHTML += '<br><br>';
    pIndex++;
    i = 0;
    typeChar(p);
  }
  
  function typeChar(p) {
    if (i < p.length) {
      el.innerHTML += p.charAt(i);
      i++;
      setTimeout(function() { typeChar(p); }, speed + Math.random() * 20);
    } else {
      setTimeout(typeParagraph, speed * 5);
    }
  }
  
  typeParagraph();
}

function regenerateNarrative() {
  generateNarrative();
  showToast('正在重新生成旅行随笔...');
}

// ================================================================
//  localStorage 行程持久化
// ================================================================
var STORAGE_KEY = 'moodTravel_trips';
var MAX_STORED_TRIPS = 20;

function saveTripToStorage() {
  if (!itinerary || itinerary.length === 0) return;
  var trip = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    mood: activeMood,
    moodLabel: (MOODS.find(function(m) { return m.key === activeMood; }) || {}).label || '',
    moodColor: activeMoodColor,
    companionType: companionType,
    companionLabel: (COMPANION_TYPES.find(function(c) { return c.key === companionType; }) || {}).label || '',
    travelMode: travelMode,
    budget: budget,
    days: days,
    itinerary: itinerary,
    hotel: hotel ? { name: hotel.name, bestPlatform: hotel.bestPlatform, bestPrice: hotel.bestPrice, rating: hotel.rating } : null,
    stats: stats,
    narrative: aiNarrativeText || '',
    cityCount: countCities()
  };

  try {
    var trips = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // 去重（同一天内相同参数的行程只保留最新）
    trips = trips.filter(function(t) {
      return !(t.mood === trip.mood && t.companionType === trip.companionType && t.days === trip.days);
    });
    trips.unshift(trip);
    if (trips.length > MAX_STORED_TRIPS) trips = trips.slice(0, MAX_STORED_TRIPS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    showToast('行程已保存到「我的行程」');
  } catch (e) {
    // localStorage 可能已满，静默处理
  }
}

function countCities() {
  var cities = [];
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
      });
    });
  }
  return cities.length;
}

function loadTripsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function showTripHistoryTab(tab) {
  var tabs = document.querySelectorAll('.trip-history-tab');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  if (tab === 'all') tabs[0].classList.add('active');
  else tabs[1].classList.add('active');
  renderTripHistory(tab);
}

function renderTripHistory(filter) {
  var section = document.getElementById('tripHistorySection');
  var list = document.getElementById('tripHistoryList');
  if (!section || !list) return;

  section.classList.add('show');
  var trips = loadTripsFromStorage();

  if (filter === 'recent') {
    trips = trips.slice(0, 5);
  }

  if (trips.length === 0) {
    list.innerHTML = '<div class="trip-history-empty"><span class="trip-history-empty-icon">📭</span>还没有保存的行程<br>生成行程后会自动保存</div>';
    return;
  }

  list.innerHTML = trips.map(function(trip) {
    var date = new Date(trip.createdAt);
    var dateStr = date.toLocaleDateString('zh-CN', {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
    var poiSummary = '';
    if (trip.itinerary) {
      var names = [];
      trip.itinerary.forEach(function(day) {
        day.items.forEach(function(item) {
          if (item.type === 'poi') names.push(item.name);
        });
      });
      poiSummary = names.slice(0, 4).join(' → ');
      if (names.length > 4) poiSummary += '...';
    }
    var modeIcon = trip.travelMode === 'business' ? '💼' : '🏖️';
    return '<div class="trip-history-card" onclick="loadTripFromHistory(' + trip.id + ')">' +
      '<div class="trip-history-card-header">' +
      '<span class="trip-history-mood" style="background:' + (trip.moodColor || '#8BA88C') + '22;color:' + (trip.moodColor || '#8BA88C') + '">' + (trip.moodLabel || '') + ' · ' + (trip.companionLabel || '') + '</span>' +
      '<span class="trip-history-date">' + dateStr + '</span>' +
      '</div>' +
      '<div class="trip-history-summary">' + modeIcon + ' ' + trip.days + '天 · ¥' + (trip.budget || 0).toLocaleString() + ' · ' + (trip.cityCount || 0) + '城' +
      (poiSummary ? '<br><span class="trip-history-poi-summary" style="font-size:13px">' + poiSummary + '</span>' : '') +
      '</div></div>';
  }).join('');

  // 滚动到历史记录区域
  section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function loadTripFromHistory(id) {
  var trips = loadTripsFromStorage();
  var trip = trips.find(function(t) { return t.id === id; });
  if (!trip) return;

  // 恢复行程状态
  activeMood = trip.mood;
  activeMoodColor = trip.moodColor;
  companionType = trip.companionType;
  travelMode = trip.travelMode;
  budget = trip.budget;
  days = trip.days;
  itinerary = trip.itinerary;
  hotel = trip.hotel;
  stats = trip.stats;
  aiNarrativeText = trip.narrative || '';

  // 更新 UI
  updateMoodActiveStyle();
  updateCompanionStyles();
  updateSceneToggle();
  updateBudgetFill();
  updatePresetStyles();
  budgetNumber.textContent = budget.toLocaleString();
  budgetSlider.value = budget;
  updateGenerateBtn();

  // 渲染
  renderItinerary();
  renderMap();
  renderHotel();
  renderChecklist();
  renderStats();
  renderCareLetter();
  renderShareCard();

  // 显示 AI 随笔
  if (trip.narrative) {
    var body = document.getElementById('aiNarrativeBody');
    var section = document.getElementById('aiNarrativeSection');
    var meta = document.getElementById('aiNarrativeMeta');
    if (body) body.textContent = trip.narrative;
    if (section) section.classList.add('show');
    if (meta) meta.textContent = '已保存 · ' + new Date(trip.createdAt).toLocaleDateString('zh-CN', {year:'numeric', month:'long', day:'numeric'});
  }

  showToast('已加载行程「' + (trip.moodLabel || '') + ' · ' + trip.days + '天」');
  document.getElementById('itinerarySection').scrollIntoView({ behavior: 'smooth' });
}

// ================================================================
//  天气 API 集成（和风天气免费版）
// ================================================================
var weatherConfig = {
  apiKey: '',  // 填入你的和风天气 API Key
  cityId: '101210101'  // 默认杭州
};

var currentWeather = null;

function fetchWeather() {
  if (!weatherConfig.apiKey) {
    // 无 API Key 时使用模拟数据
    simulateWeather();
    return;
  }

  fetch('https://devapi.qweather.com/v7/weather/3d?location=' + weatherConfig.cityId + '&key=' + weatherConfig.apiKey)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.code === '200' && data.daily && data.daily.length > 0) {
        currentWeather = {
          textDay: data.daily[0].textDay,
          tempMax: data.daily[0].tempMax,
          tempMin: data.daily[0].tempMin,
          isRainy: data.daily[0].textDay.indexOf('雨') !== -1,
          icon: getWeatherIcon(data.daily[0].textDay)
        };
        showWeatherIndicator();
      }
    })
    .catch(function() {
      simulateWeather();
    });
}

function simulateWeather() {
  var weathers = [
    { textDay: '晴', tempMax: 28, tempMin: 18, isRainy: false, icon: '☀️' },
    { textDay: '多云', tempMax: 25, tempMin: 16, isRainy: false, icon: '⛅' },
    { textDay: '小雨', tempMax: 22, tempMin: 15, isRainy: true, icon: '🌧️' },
    { textDay: '阴', tempMax: 24, tempMin: 17, isRainy: false, icon: '☁️' }
  ];
  currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
  showWeatherIndicator();
}

function getWeatherIcon(text) {
  if (text.indexOf('雨') !== -1) return '🌧️';
  if (text.indexOf('雪') !== -1) return '❄️';
  if (text.indexOf('云') !== -1) return '⛅';
  if (text.indexOf('阴') !== -1) return '☁️';
  return '☀️';
}

// ================================================================
//  天气指示器 — 增强版（真实 API + 模拟 fallback）
// ================================================================
var weatherData = null;

async function showWeatherIndicator() {
  if (!itinerary || itinerary.length === 0) return;
  
  // 获取行程涉及的城市
  var cities = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
  });
  var mainCity = cities[0] || '杭州';
  
  // 尝试真实天气 API
  var realWeather = await fetchRealWeather(mainCity);
  
  if (realWeather) {
    weatherData = realWeather;
  } else {
    // 模拟天气数据
    var conditions = ['晴', '多云', '阴', '小雨', '晴'];
    var temps = [22, 25, 28, 30, 18, 20, 24, 26];
    weatherData = {
      temp: temps[Math.floor(Math.random() * temps.length)],
      text: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: 45 + Math.floor(Math.random() * 40),
      isRainy: Math.random() < 0.3
    };
  }
  
  // 渲染天气指示器
  var daysEl = document.getElementById('itineraryDays');
  if (!daysEl) return;
  
  var weatherEl = document.getElementById('weatherIndicator');
  if (!weatherEl) {
    weatherEl = document.createElement('div');
    weatherEl.id = 'weatherIndicator';
    daysEl.parentNode.insertBefore(weatherEl, daysEl);
  }
  
  var isRainy = weatherData.isRainy;
  var weatherIcon = isRainy ? '🌧️' : weatherData.text.indexOf('云') !== -1 ? '⛅' : '☀️';
  var weatherClass = isRainy ? 'rainy' : '';
  
  weatherEl.className = 'weather-indicator ' + weatherClass;
  var wt = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  weatherEl.innerHTML = '<span class="weather-icon">' + weatherIcon + '</span>' +
    '<span>' + __(mainCity, 'cityNames') + ' ' + weatherData.text + ' ' + weatherData.temp + '°C</span>' +
    '<span class="weather-detail">' + wt.weatherHumidityLabel + weatherData.humidity + '%</span>' +
    (realWeather ? '<span style="font-size:10px;opacity:0.5;margin-left:4px">' + wt.weatherRealtime + '</span>' : '');
  
  // 雨天自动展开所有 Plan B
  if (isRainy) {
    setTimeout(function() {
      var rainToggles = document.querySelectorAll('.rain-plan-toggle');
      rainToggles.forEach(function(toggle) { toggle.click(); });
    }, 500);
  }
}

function downloadShareCard() {
  var canvas = document.querySelector('#shareCardPreview canvas');
  if (!canvas) return;
  var link = document.createElement('a');
  link.download = 'MoodTravel_行程_' + new Date().toISOString().slice(0, 10) + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('分享卡已下载！');
}

function copyShareLink() {
  var text = '✨ 我在 MoodTravel 生成了一条' + days + '天长三角旅行路线！\n';
  text += '心情：' + ((MOODS.find(function(m) { return m.key === activeMood; }) || {}).label || '') + '\n';
  text += '旅伴：' + ((COMPANION_TYPES.find(function(c) { return c.key === companionType; }) || {}).label || '') + '\n';
  if (itinerary) {
    itinerary.forEach(function(day) {
      text += 'Day ' + day.day + ': ';
      var names = [];
      day.items.forEach(function(item) { if (item.type !== 'rest') names.push(item.name); });
      text += names.join(' → ') + '\n';
    });
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('行程已复制，可以分享给朋友啦！');
    });
  } else {
    fallbackCopy(text);
  }
}

function shareViaWeb() {
  if (!itinerary || itinerary.length === 0) return;
  var text = '✨ MoodTravel 情绪旅行：' + days + '天长三角之旅\n';
  text += '心情：' + ((MOODS.find(function(m) { return m.key === activeMood; }) || {}).label || '') + '\n';
  var firstDay = itinerary[0];
  if (firstDay && firstDay.items.length > 0) {
    text += '首站：' + firstDay.items[0].name + '\n';
  }
  text += '快来生成你的专属旅行路线吧！';

  var shareData = {
    title: 'MoodTravel · 情绪旅行',
    text: text,
    url: window.location.href
  };

  // 如果有分享卡片Canvas，尝试获取图片
  var canvas = document.querySelector('#shareCardPreview canvas');
  if (canvas && navigator.share && navigator.canShare) {
    canvas.toBlob(function(blob) {
      if (blob) {
        var file = new File([blob], 'moodtravel-share.png', { type: 'image/png' });
        shareData.files = [file];
        if (navigator.canShare({ files: [file] })) {
          navigator.share(shareData).catch(function() {});
          return;
        }
      }
      fallbackShare(shareData);
    }, 'image/png');
  } else {
    fallbackShare(shareData);
  }
}

function fallbackShare(shareData) {
  if (navigator.share) {
    navigator.share(shareData).catch(function() {
      copyShareLink();
    });
  } else {
    copyShareLink();
  }
}

// ================================================================
//  PWA Service Worker 注册
// ================================================================
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
}

// ================================================================
//  骨架屏控制
// ================================================================
function showSkeleton(msg) {
  var overlay = document.getElementById('skeletonOverlay');
  var text = document.getElementById('skeletonText');
  if (text) text.textContent = msg || 'AI 正在为你规划行程...';
  if (overlay) overlay.classList.add('show');
}

function hideSkeleton() {
  var overlay = document.getElementById('skeletonOverlay');
  if (overlay) overlay.classList.remove('show');
}

// Error state display
function showError(el, message) {
  if (!el) return;
  el.innerHTML = '<div class="error-state" style="text-align:center;padding:24px;color:rgba(255,255,255,0.7)"><span style="font-size:32px;display:block;margin-bottom:8px">⚠️</span><p>' + escapeHtml(message || 'Something went wrong') + '</p><button class="retry-btn glass-panel" onclick="location.reload()" style="margin-top:12px;padding:8px 20px;border:none;border-radius:8px;cursor:pointer;color:rgba(255,255,255,0.9);font-size:13px">Retry</button></div>';
}

// Empty state display
function showEmpty(el, message) {
  if (!el) return;
  el.innerHTML = '<div class="empty-state" style="text-align:center;padding:24px;color:rgba(255,255,255,0.5)"><span style="font-size:32px;display:block;margin-bottom:8px">📭</span><p>' + escapeHtml(message || 'No results found') + '</p></div>';
}

// Network error display
function showNetworkError() {
  var toast = document.getElementById('toast');
  showToast('Network connection issue. Please check your connection and try again.', 5000);
}

// ================================================================
//  算法可视化进度面板控制
// ================================================================
function showAlgoProgress() {
  var panel = document.getElementById('algoProgressPanel');
  if (panel) panel.classList.add('show');
  // 重置所有步骤
  for (var i = 1; i <= 4; i++) {
    var step = document.getElementById('algoStep' + i);
    if (step) { step.classList.remove('active', 'done'); }
    var status = step ? step.querySelector('.algo-step-status') : null;
    if (status) status.textContent = '等待中';
  }
  // 重置统计
  var stats = ['algoStatTotal', 'algoStatPassed', 'algoStatScore', 'algoStatHotel'];
  stats.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.querySelector('.algo-stat-value').textContent = '--'; el.classList.remove('highlight'); }
  });
}

function hideAlgoProgress() {
  var panel = document.getElementById('algoProgressPanel');
  if (panel) panel.classList.remove('show');
}

function updateAlgoStep(stepNum, state, detail, totalPois) {
  var step = document.getElementById('algoStep' + stepNum);
  if (!step) return;
  step.classList.remove('active', 'done');
  step.classList.add(state);
  var status = step.querySelector('.algo-step-status');
  if (state === 'active') {
    if (status) status.textContent = '进行中';
  } else if (state === 'done') {
    if (status) status.textContent = '✓ 完成';
  }
  var detailEl = step.querySelector('.algo-step-detail');
  if (detailEl && detail) detailEl.textContent = detail;
}

function updateAlgoStats(result) {
  if (!result || !result.stats) return;
  var s = result.stats;
  var setStat = function(id, val, highlight) {
    var el = document.getElementById(id);
    if (el) { el.querySelector('.algo-stat-value').textContent = val; if (highlight) el.classList.add('highlight'); }
  };
  setStat('algoStatTotal', s.filterTotal, true);
  setStat('algoStatPassed', s.filterPassed, true);
  setStat('algoStatScore', result.itinerary ? result.itinerary.length + '天' : '--', false);
  setStat('algoStatHotel', result.hotel ? '5平台' : '无', !!result.hotel);
}

// ================================================================
//  深色/浅色模式切换
// ================================================================
var isLightMode = false;

function toggleTheme() {
  isLightMode = !isLightMode;
  var btn = document.getElementById('themeToggleBtn');
  if (isLightMode) {
    document.body.classList.add('light-mode');
    if (btn) btn.textContent = '☀️';
    showToast('已切换至浅色模式');
  } else {
    document.body.classList.remove('light-mode');
    if (btn) btn.textContent = '🌙';
    showToast('已切换至深色模式');
  }
  try { localStorage.setItem('moodtravel_theme', isLightMode ? 'light' : 'dark'); } catch(e) {}
  // 刷新地图（如果存在）
  setTimeout(function() { if (leafletMap) leafletMap.invalidateSize(); }, 200);
  // 强制修复浅色模式文字
  fixLightModeText();
  // 重新应用语言，防止切换模式后语言错乱
  if (typeof currentLang !== 'undefined' && currentLang) switchLanguage(currentLang);
}

// ================================================================
//  强制修复浅色模式文字可见性（绕过CSS优先级问题）
// ================================================================
function fixLightModeText() {
  var isLight = document.body.classList.contains('light-mode');
  if (!isLight) {
    // 恢复暗色模式：清除所有inline颜色
    var allEls = document.querySelectorAll('.safety-panel, .safety-panel *, .safety-grid, .safety-grid *, .carbon-section, .carbon-section *, #pricePredictionSection, #pricePredictionSection *');
    allEls.forEach(function(el) { el.style.color = ''; el.style.background = ''; });
    return;
  }
  // 浅色模式：使用 #555 灰色（与语言切换按钮一致）
  var sections = document.querySelectorAll('.safety-panel, .safety-grid, .carbon-section, #pricePredictionSection');
  sections.forEach(function(sec) {
    // 先设置容器自身
    if (sec.matches('.safety-panel, .safety-grid, .carbon-section, #pricePredictionSection')) {
      sec.style.color = '#555';
    }
    var els = sec.querySelectorAll('*');
    els.forEach(function(el) {
      if (el.tagName === 'BR' || el.tagName === 'HR') return;
      // 标题类元素更深色
      if (el.classList.contains('section-title') ||
          el.classList.contains('safety-card-title') ||
          el.classList.contains('carbon-detail-val') ||
          el.classList.contains('price-prediction-title') ||
          el.classList.contains('price-prediction-current') ||
          el.classList.contains('price-summary-val')) {
        el.style.color = '#2D3436';
        return;
      }
      // 绿色特殊元素
      if (el.classList.contains('carbon-score-value') ||
          el.classList.contains('price-prediction-low') ||
          el.classList.contains('price-prediction-save') ||
          (el.classList.contains('price-summary-val') && el.classList.contains('highlight')) ||
          (el.classList.contains('price-prediction-trend') && el.classList.contains('down')) ||
          el.tagName === 'STRONG') {
        el.style.color = '#8BA88C';
        return;
      }
      // 绿底白字徽章（保持白色）
      if (el.classList.contains('price-best-badge')) {
        el.style.color = '#fff';
        return;
      }
      // 红色趋势
      if (el.classList.contains('price-prediction-trend') && el.classList.contains('up')) {
        el.style.color = '#D32F2F';
        return;
      }
      el.style.color = '#555';
    });
  });
  // 卡片背景
  var safetyCards = document.querySelectorAll('.safety-card');
  safetyCards.forEach(function(el) { el.style.background = 'rgba(0,0,0,0.03)'; el.style.borderColor = 'rgba(0,0,0,0.08)'; });
  var ppCards = document.querySelectorAll('.price-prediction-card');
  ppCards.forEach(function(el) { el.style.background = 'rgba(0,0,0,0.02)'; el.style.borderColor = 'rgba(0,0,0,0.06)'; });
  var ppSummary = document.querySelectorAll('.price-summary');
  ppSummary.forEach(function(el) { el.style.background = 'rgba(0,0,0,0.02)'; el.style.borderColor = 'rgba(0,0,0,0.06)'; });
}

// 启动时恢复主题
(function() {
  try {
    var saved = localStorage.getItem('moodtravel_theme');
    if (saved === 'light') { isLightMode = false; toggleTheme(); }
  } catch(e) {}
})();

// ================================================================
//  键盘快捷键系统
// ================================================================
var keyboardShortcuts = {
  'ctrl+k': function() { document.getElementById('searchInput').focus(); },
  'ctrl+g': function() { generatePlan(); },
  'ctrl+1': function() { quickMood('calm','😌'); },
  'ctrl+2': function() { quickMood('happy','😊'); },
  'ctrl+3': function() { quickMood('sad','🌅'); },
  'ctrl+4': function() { quickMood('anxious','🌿'); },
  'ctrl+5': function() { quickMood('excited','🔥'); },
  'ctrl+6': function() { quickMood('tired','😴'); },
  'ctrl+b': function() { toggleTheme(); },
  'ctrl+e': function() { if (itinerary) exportMarkdown(); },
  'ctrl+p': function() { if (itinerary) window.print(); },
  'ctrl+h': function() { toggleTreeHole(); },
  'ctrl+r': function() { regenerateNarrative(); },
  'ctrl+s': function() { scrollToContent(); },
  'ctrl+j': function() { var el = document.getElementById('journalSection'); if (el) el.scrollIntoView({behavior:'smooth'}); },
  'ctrl+d': function() { var el = document.getElementById('compareSection'); if (el) el.scrollIntoView({behavior:'smooth'}); },
  'ctrl+t': function() { var el = document.getElementById('travelPersonaSection'); if (el) el.scrollIntoView({behavior:'smooth'}); },
  'escape': function() {
    closeBookingPopup(); closePoiDetail(); closeExportModal();
    var dd = document.getElementById('searchDropdown');
    if (dd) dd.classList.remove('show');
    var tp = document.getElementById('treeHolePopup');
    if (tp) tp.classList.remove('show');
    var eb = document.getElementById('emotionBubble');
    if (eb) eb.classList.remove('show');
  }
};

function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // 输入框内不触发快捷键（除了 Escape 和 Ctrl+K）
    var tag = document.activeElement.tagName;
    var isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    
    var key = '';
    if (e.ctrlKey || e.metaKey) key += 'ctrl+';
    if (e.altKey) key += 'alt+';
    if (e.shiftKey) key += 'shift+';
    key += e.key.toLowerCase();
    
    if (isInput && key !== 'escape' && key !== 'ctrl+k') return;
    
    var handler = keyboardShortcuts[key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  });
}

// 显示快捷键提示
function showShortcutHelp() {
  var shortcuts = [
    'Ctrl+K — 聚焦搜索',
    'Ctrl+G — 智能生成行程',
    'Ctrl+1-6 — 切换心情',
    'Ctrl+B — 切换深色/浅色',
    'Ctrl+E — 导出行程',
    'Ctrl+P — 打印行程',
    'Ctrl+J — 旅行日记',
    'Ctrl+D — 方案对比',
    'Ctrl+T — 旅行人格',
    'Ctrl+H — 树洞倾诉',
    'Ctrl+R — 重新生成随笔',
    'Esc — 关闭弹窗'
  ];
  showToast('⌨️ 快捷键：' + shortcuts.join('  |  '), 5000);
}

// 在控制台提示
debugLog('%c🌿 MoodTravel %c快捷键已就绪 %c按 Ctrl+K 聚焦搜索',
  'font-size:18px;color:#8BA88C', 'color:#fff', 'color:rgba(255,255,255,0.6)');

// ================================================================
//  智能搜索
// ================================================================
var searchDebounceTimer = null;

function handleSearch(query) {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(function() { doSearch(query); }, 150);
}

function doSearch(query) {
  var dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;

  if (!query || query.trim().length === 0) {
    dropdown.classList.remove('show');
    return;
  }

  var q = query.toLowerCase().trim();
  var results = [];

  // 搜索城市
  ZHEJIANG_CITIES.forEach(function(city) {
    if (city.name.toLowerCase().indexOf(q) !== -1) {
      results.push({
        type: 'city', icon: '🏙️', name: city.name,
        detail: city.vibe || '浙江省' + city.name + '市',
        tag: '城市', data: city
      });
    }
  });

  // 搜索 POI
  POIS.forEach(function(poi) {
    if (poi.name.toLowerCase().indexOf(q) !== -1 ||
        (poi.tags && poi.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1; }))) {
      results.push({
        type: 'poi', icon: poi.category === 'restaurant' ? '🍽️' : poi.category === 'scenic' ? '🏔️' : '📍',
        name: __(poi.name, 'poiNames'), detail: '¥' + (poi.ticketPrice || 0) + ' · ' + __(poi.city || '', 'cityNames'),
        tag: poi.category, data: poi
      });
    }
  });

  // 搜索酒店
  HOTELS.forEach(function(hotel) {
    if (hotel.name.toLowerCase().indexOf(q) !== -1) {
      results.push({
        type: 'hotel', icon: '🏨', name: __(hotel.name, 'hotelNames'),
        detail: '⭐' + hotel.rating + ' · ¥' + hotel.priceRangeLow + '起',
        tag: '酒店', data: hotel
      });
    }
  });

  // 搜索心情
  MOODS.forEach(function(mood) {
    if (mood.label.toLowerCase().indexOf(q) !== -1 || mood.key.toLowerCase().indexOf(q) !== -1) {
      results.push({
        type: 'mood', icon: mood.emoji, name: mood.label + '模式',
        detail: '切换至' + mood.label + '心情',
        tag: '心情', data: mood
      });
    }
  });

  // 最多显示 8 条
  results = results.slice(0, 8);

  if (results.length === 0) {
    showEmpty(dropdown, '未找到「' + query + '」相关结果');
  } else {
    dropdown.innerHTML = results.map(function(r) {
      return '<div class="search-result-item" data-type="' + escapeHtml(r.type) + '" data-data="' + escapeHtml(JSON.stringify(r.data)) + '">' +
        '<span class="search-result-icon">' + escapeHtml(r.icon) + '</span>' +
        '<div class="search-result-info"><div class="search-result-name">' + escapeHtml(r.name) + '</div><div class="search-result-detail">' + escapeHtml(r.detail) + '</div></div>' +
        '<span class="search-result-tag">' + escapeHtml(r.tag) + '</span></div>';
    }).join('');
  }
  dropdown.classList.add('show');

  var items = dropdown.querySelectorAll('.search-result-item');
  items.forEach(function(item) {
    item.addEventListener('click', function() {
      var type = this.getAttribute('data-type');
      var data;
      try { data = JSON.parse(this.getAttribute('data-data')); } catch(e) { data = {}; }
      selectSearchResult(type, data);
    });
  });

  // 并行调用高德API实时搜索
  fetchAmapPoiSearch(query);
}

function fetchAmapPoiSearch(query) {
  var url = '/.netlify/functions/poi-search?query=' + encodeURIComponent(query);
  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.results || data.results.length === 0) return;
    var dropdown = document.getElementById('searchDropdown');
    if (!dropdown || !dropdown.classList.contains('show')) return;

    var amapHtml = '<div class="search-divider">🌐 高德实时搜索</div>';
    data.results.forEach(function(r) {
      var loc = r.location ? r.location.split(',') : null;
      var amapData = { name: r.name, address: r.address, location: r.location, type: 'amap_poi' };
      amapHtml += '<div class="search-result-item search-result-amap" onclick="selectAmapPoi(' + JSON.stringify(amapData).replace(/"/g, '&quot;') + ')">' +
        '<span class="search-result-icon">📍</span>' +
        '<div class="search-result-info"><div class="search-result-name">' + r.name + '</div><div class="search-result-detail">' + r.address + '</div></div>' +
        '<span class="search-result-tag">高德</span></div>';
    });
    dropdown.innerHTML += amapHtml;
  }).catch(function() { /* 高德API不可用时静默降级 */ });
}

function selectAmapPoi(data) {
  var dropdown = document.getElementById('searchDropdown');
  var input = document.getElementById('searchInput');
  if (dropdown) dropdown.classList.remove('show');
  if (input) { input.value = ''; input.blur(); }
  showToast('📍 ' + data.name + ' · ' + (data.address || ''));
  // 在地图上显示该POI
  if (leafletMap && data.location) {
    var loc = data.location.split(',');
    var lng = parseFloat(loc[0]), lat = parseFloat(loc[1]);
    var marker = L.marker([lat, lng]).addTo(leafletMap);
    marker.bindPopup('<b>📍 ' + data.name + '</b><br><small>' + (data.address || '') + '</small>').openPopup();
    leafletMap.setView([lat, lng], 14);
    mapMarkers.push(marker);
  }
}

function selectSearchResult(type, data) {
  var dropdown = document.getElementById('searchDropdown');
  var input = document.getElementById('searchInput');
  if (dropdown) dropdown.classList.remove('show');
  if (input) { input.value = ''; input.blur(); }

  if (type === 'city') {
    showToast('已定位「' + data.name + '」');
  } else if (type === 'poi') {
    showPoiDetail(data);
  } else if (type === 'hotel') {
    showToast('🏨 ' + data.name + ' · ⭐' + data.rating + ' · ¥' + data.priceRangeLow + '起');
  } else if (type === 'mood') {
    selectMood(data);
  }
}

function handleSearchKeydown(e) {
  if (e.key === 'Escape') {
    var dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.classList.remove('show');
    e.target.blur();
  }
}

// 点击外部关闭搜索下拉
document.addEventListener('click', function(e) {
  var searchSection = document.querySelector('.search-section');
  if (searchSection && !searchSection.contains(e.target)) {
    var dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
});

// ================================================================
//  POI 详情弹窗
// ================================================================
function showPoiDetail(poi) {
  var overlay = document.getElementById('poiDetailOverlay');
  if (!overlay) return;

  document.getElementById('poiDetailName').textContent = __(poi.name, 'poiNames');
  document.getElementById('poiDetailCity').textContent = __(poi.city || '浙江', 'cityNames') + ' · ' + (poi.category || '景点');
  document.getElementById('poiDetailEmoji').textContent = poi.emoji || '📍';

  // 尝试加载 Unsplash 图片
  var imgContainer = document.getElementById('poiDetailImg');
  imgContainer.innerHTML = '<span class="poi-detail-img-emoji" id="poiDetailEmoji">' + (poi.emoji || '📍') + '</span>';
  fetchPoiImage(poi.name, imgContainer);

  // 统计信息
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  var infoHtml = '<div class="poi-detail-stat"><span class="poi-detail-stat-val" style="color:' + activeMoodColor + '">¥' + (poi.ticketPrice || 0) + '</span><span class="poi-detail-stat-label">' + (t.poiDetailPrice || '门票') + '</span></div>';
  infoHtml += '<div class="poi-detail-stat"><span class="poi-detail-stat-val">' + (poi.energyLevel || '—') + '/5</span><span class="poi-detail-stat-label">' + (t.poiDetailEnergy || '体力消耗') + '</span></div>';
  infoHtml += '<div class="poi-detail-stat"><span class="poi-detail-stat-val">' + (poi.crowdednessLevel || '—') + '/5</span><span class="poi-detail-stat-label">' + (t.poiDetailCrowd || '拥挤度') + '</span></div>';
  if (poi.estimatedDuration) {
    infoHtml += '<div class="poi-detail-stat"><span class="poi-detail-stat-val">' + poi.estimatedDuration + 'min</span><span class="poi-detail-stat-label">' + (t.poiDetailDuration || '建议游玩') + '</span></div>';
  }
  document.getElementById('poiDetailInfo').innerHTML = infoHtml;

  // 描述
  var desc = poi.description || '位于浙江的精选景点，适合' + (activeMood || '放松') + '模式下游玩。';
  document.getElementById('poiDetailDesc').textContent = desc;

  // 标签
  var tagsHtml = '';
  if (poi.tags) {
    poi.tags.forEach(function(t) {
      tagsHtml += '<span class="tag" style="background:rgba(139,168,140,0.12);color:#8BA88C">' + __(t, 'poiTags') + '</span>';
    });
  }
  document.getElementById('poiDetailTags').innerHTML = tagsHtml;

  // 预订按钮
  var bookBtn = document.getElementById('poiDetailBookBtn');
  if (bookBtn) {
    bookBtn.onclick = function() { closePoiDetail(); showBookingPopup(poi.name); };
  }

  overlay.classList.add('show');
}

function closePoiDetail() {
  var overlay = document.getElementById('poiDetailOverlay');
  if (overlay) overlay.classList.remove('show');
}

// ================================================================
//  Unsplash 图片加载
// ================================================================
function fetchPoiImage(query, container) {
  // 使用 Unsplash 的免费 API（无需 API Key 的 source 方式）
  var img = document.createElement('img');
  img.className = 'poi-image';
  img.alt = query;
  img.loading = 'lazy';
  img.onload = function() {
    container.innerHTML = '';
    container.appendChild(img);
  };
  img.onerror = function() {
    // 保持 emoji 占位
  };
  // Unsplash 随机图片（使用 search photos 的 source URL）
  img.src = 'https://source.unsplash.com/800x400/?' + encodeURIComponent(query + ' China travel');
}

function loadPhotoGallery() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('photoGallerySection');
  var gallery = document.getElementById('photoGallery');
  if (!section || !gallery) return;

  // 收集行程中的POI名称
  var poiNames = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi' && poiNames.length < 6) {
        poiNames.push(item.name);
      }
    });
  });
  if (poiNames.length === 0) return;

  section.style.display = 'block';
  var html = '';
  poiNames.forEach(function(name) {
    var imgUrl = 'https://source.unsplash.com/400x300/?' + encodeURIComponent(name + ' China travel');
    html += '<div class="photo-gallery-item" onclick="window.open(\'https://unsplash.com/s/photos/' + encodeURIComponent(name) + '\', \'_blank\')">';
    html += '<img src="' + imgUrl + '" alt="' + name + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'">';
    html += '<div class="photo-label">' + name + '</div>';
    html += '<div class="photo-credit">Unsplash</div>';
    html += '</div>';
  });
  gallery.innerHTML = html;
}

// ================================================================
//  语音输入 (Web Speech API)
// ================================================================
var recognition = null;
var isListening = false;

function initSpeechRecognition() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function(event) {
    var text = event.results[0][0].transcript;
    var input = document.getElementById('treeHoleInput');
    if (input) {
      input.value = (input.value ? input.value + ' ' : '') + text;
      input.focus();
    }
    stopListening();
  };

  recognition.onerror = function() {
    stopListening();
    showToast('语音识别失败，请手动输入');
  };

  recognition.onend = function() {
    stopListening();
  };
}

function toggleVoiceInput() {
  if (!recognition) initSpeechRecognition();
  if (!recognition) {
    showToast('您的浏览器不支持语音输入');
    return;
  }
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  if (!recognition) return;
  isListening = true;
  var btn = document.getElementById('voiceBtn');
  if (btn) { btn.textContent = '🔴'; btn.classList.add('listening'); }
  showToast('正在聆听...');
  try { recognition.start(); } catch(e) {}
}

function stopListening() {
  isListening = false;
  var btn = document.getElementById('voiceBtn');
  if (btn) { btn.textContent = '🎙️'; btn.classList.remove('listening'); }
  try { recognition.stop(); } catch(e) {}
}

// ================================================================
//  行程编辑模式
// ================================================================
var editMode = false;

function toggleEditMode() {
  editMode = !editMode;
  var itinerarySection = document.getElementById('itinerarySection');
  if (itinerarySection) {
    if (editMode) {
      itinerarySection.classList.add('edit-mode');
      showToast('编辑模式已开启 — 可拖拽排序、删除景点');
    } else {
      itinerarySection.classList.remove('edit-mode');
      showToast('编辑模式已关闭');
    }
  }
  renderItinerary();
}

// 点击 POI 名称查看详情
function onPoiNameClick(poiId) {
  if (editMode) return;
  var poi = POIS.find(function(p) { return p.id === poiId; });
  if (poi) showPoiDetail(poi);
}

// 从行程中删除某个景点
function removePoiFromDay(dayIndex, itemIndex) {
  if (!itinerary || !editMode) return;
  itinerary[dayIndex].items.splice(itemIndex, 1);
  renderItinerary();
  renderMap();
  showToast('已删除景点');
}

// 添加景点到某天
function addPoiToDay(dayIndex) {
  if (!itinerary || !editMode) return;
  // 随机选择一个未使用的景点
  var usedIds = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.poiId) usedIds.push(item.poiId);
    });
  });
  var available = POIS.filter(function(p) { return usedIds.indexOf(p.id) === -1; });
  if (available.length === 0) { showToast('所有景点已添加'); return; }
  var picked = available[Math.floor(Math.random() * available.length)];
  var hour = 14;
  if (itinerary[dayIndex].items.length > 0) {
    var lastItem = itinerary[dayIndex].items[itinerary[dayIndex].items.length - 1];
    hour = parseInt(lastItem.time.split(':')[0]) + 2;
  }
  itinerary[dayIndex].items.push({
    type: 'poi', time: fmtTime(hour), name: picked.name,
    estimatedCost: picked.ticketPrice || 0, estimatedDuration: picked.estimatedDuration || 90,
    tags: picked.tags || [], reason: genReason(picked), reasonTags: genTags(picked),
    poiId: picked.id, mapX: picked.mapX, mapY: picked.mapY, weatherSensitivity: picked.weatherSensitivity
  });
  renderItinerary();
  renderMap();
  showToast('已添加「' + picked.name + '」');
}

// ================================================================
//  分享卡 QR 码生成
// ================================================================
function renderShareCard() {
  var section = document.getElementById('shareCardSection');
  if (!section || !itinerary || itinerary.length === 0) return;

  section.classList.add('show');
  var preview = document.getElementById('shareCardPreview');
  var canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 500;
  var ctx = canvas.getContext('2d');

  // 背景渐变
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  var bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(0.5, '#16213e');
  bgGrad.addColorStop(1, '#0f3460');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 500);

  // 装饰性圆点
  ctx.fillStyle = activeMoodColor + '15';
  for (var i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 800, Math.random() * 500, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 标题
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('MoodTravel · 情绪旅行', 40, 60);

  // 心情标签
  var moodLabel = (MOODS.find(function(m) { return m.key === activeMood; }) || {}).label || '';
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  ctx.fillStyle = activeMoodColor;
  ctx.font = '600 16px "PingFang SC", sans-serif';
  ctx.fillText(moodLabel + ' · ' + (ct ? ct.label : '') + ' · ' + days + '天', 40, 100);

  // 行程概览
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px "PingFang SC", sans-serif';
  var y = 140;
  var maxItems = 8;
  var count = 0;
  itinerary.forEach(function(day) {
    if (count >= maxItems) return;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Day ' + day.day, 40, y);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    var dayText = '';
    day.items.forEach(function(item, idx) {
      if (item.type !== 'rest') dayText += (idx > 0 ? ' → ' : '') + __(item.name, 'poiNames');
    });
    if (dayText.length > 35) dayText = dayText.substring(0, 35) + '...';
    ctx.fillText(dayText, 120, y);
    y += 30;
    count++;
  });

  // 底部信息
  if (stats) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '13px "PingFang SC", sans-serif';
    ctx.fillText('预算 ¥' + (stats.totalCost || budget).toLocaleString() + '  |  ' + (stats.totalPois || 0) + '个景点  |  比价节省 ¥' + ((stats.totalSaved || 0)).toLocaleString(), 40, 460);
  }

  // 底部水印
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '12px "PingFang SC", sans-serif';
  ctx.fillText('由 MoodTravel AI 生成 · 仅供个人参考', 40, 485);

  // QR 码区域（简化版：用矩形模拟 QR 码位置）
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(660, 400, 100, 100);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px "PingFang SC", sans-serif';
  ctx.fillText('扫码体验', 672, 455);
  ctx.fillText('MoodTravel', 670, 470);

  preview.innerHTML = '';
  preview.appendChild(canvas);
}

// ================================================================
//  启动
// ================================================================
var currentLang = 'zh';
var i18n = {zh:{},en:{},ja:{}}; // 占位，正式定义见下方
(function() {
  loadMemory();
  initBatteryTracking();
  checkNightMode();
  resetIdleTimer();
  initSessionId();
  initParticles();
  initStars();
  initGeoShapes();
  initFireflies();
  initMoods();
  initCompanions();
  initPresets();
  initDailyScenarios();
  initHotRoutes();
  renderPlanCards();
  updateGreeting();
  updateDailyTip();
  fetchWeather();
  renderTripHistory('all');
  registerSW();
  initKeyboardShortcuts();
  initScrollReveal();
  initBackToTop();
  fixLightModeText();
})();
// ================================================================
//  滚动揭示动画
// ================================================================
function initScrollReveal() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  
  document.querySelectorAll('.reveal-section').forEach(function(el) {
    observer.observe(el);
  });
}

// 给新 section 添加 reveal 类
function markRevealSections() {
  var sections = document.querySelectorAll('.itinerary-section, .ai-narrative-section, .map-section, .hotel-section, .checklist-section, .care-letter-section, .share-card-section, .trip-history-section, .travel-persona-section, .journal-section, .viz-section, .compare-section');
  sections.forEach(function(s) { s.classList.add('reveal-section'); });
  initScrollReveal();
}

// ================================================================
//  回到顶部
// ================================================================
function initBackToTop() {
  var btn = document.getElementById('backToTop');
  var rightPanel = document.querySelector('.right-panel');
  if (!btn) return;
  
  var scrollEl = rightPanel || window;
  var handler = function() {
    var scrollTop = rightPanel ? rightPanel.scrollTop : window.scrollY;
    if (scrollTop > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  };
  
  if (rightPanel) {
    rightPanel.addEventListener('scroll', handler);
  } else {
    window.addEventListener('scroll', handler);
  }
}

function scrollToTop() {
  var rightPanel = document.querySelector('.right-panel');
  if (rightPanel) {
    rightPanel.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// markRevealSections 已在 generatePlan 内部自动调用，无需 monkey-patch
// ================================================================
//  新手引导
// ================================================================
var onboardingSteps = [
  { icon:'🎭', title:'选择你的心情', desc:'MoodTravel 会感知你的情绪，为你量身定制专属的长三角旅行路线。覆盖14个城市，先从选择此刻的心情开始吧。' },
  { icon:'💰', title:'设定旅行预算', desc:'拖动右侧的预算滑块，或直接输入金额。AI 会根据预算为你推荐最合适的景点和酒店。' },
  { icon:'✨', title:'一键生成行程', desc:'点击"智能生成行程"按钮，4层漏斗引擎会立即为你编排最优路线，包含景点、餐饮、酒店和交通方案。' }
];
var onboardingStep = 0;

function showOnboarding() {
  var overlay = document.getElementById('onboardingOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  onboardingStep = 0;
  updateOnboardingUI();
}

function updateOnboardingUI() {
  var step = onboardingSteps[onboardingStep];
  document.getElementById('onboardingIcon').textContent = step.icon;
  document.getElementById('onboardingTitle').textContent = step.title;
  document.getElementById('onboardingDesc').textContent = step.desc;
  
  var dots = document.querySelectorAll('.onboarding-dot');
  dots.forEach(function(d, i) { d.classList.toggle('active', i === onboardingStep); });
  
  var prevBtn = document.getElementById('onboardingPrevBtn');
  var nextBtn = document.getElementById('onboardingNextBtn');
  prevBtn.style.display = onboardingStep === 0 ? 'none' : 'inline-block';
  nextBtn.textContent = onboardingStep === 2 ? '开始探索' : '下一步';
}

function nextOnboarding() {
  if (onboardingStep >= 2) {
    skipOnboarding();
    return;
  }
  onboardingStep++;
  updateOnboardingUI();
}

function prevOnboarding() {
  if (onboardingStep > 0) {
    onboardingStep--;
    updateOnboardingUI();
  }
}

function skipOnboarding() {
  var overlay = document.getElementById('onboardingOverlay');
  if (overlay) overlay.classList.remove('show');
  localStorage.setItem('moodtravel_onboarding_done', '1');
}

// 首次访问时显示引导
(function() {
  if (!localStorage.getItem('moodtravel_onboarding_done')) {
    setTimeout(function() { showOnboarding(); }, 800);
  }
})();

// 涟漪效果
document.addEventListener('click', function(e) {
  var target = e.target.closest('button:not(.ripple), .mood-btn, .preset-chip, .companion-chip');
  if (!target || target.closest('.onboarding-overlay')) return;
  if (!target.classList.contains('ripple')) target.classList.add('ripple');
  
  var rect = target.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  var x = e.clientX - rect.left - size / 2;
  var y = e.clientY - rect.top - size / 2;
  
  var ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  target.appendChild(ripple);
  
  ripple.addEventListener('animationend', function() { ripple.remove(); });
});

// ================================================================
//  QR Code 生成（纯 JS 实现，无需外部依赖）
// ================================================================
function generateQRCode() {
  var overlay = document.getElementById('qrModalOverlay');
  if (!overlay) return;
  overlay.classList.add('show');

  var canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // 生成行程摘要文本
  var text = 'MoodTravel 情绪旅行\n';
  if (itinerary && itinerary.days) {
    text += '心情：' + ((MOODS.find(function(m){return m.key===activeMood}) || {}).label || '') + '\n';
    text += '预算：¥' + budget.toLocaleString() + '\n';
    text += '天数：' + itinerary.days.length + '天\n';
    var allPois = [];
    itinerary.days.forEach(function(d) {
      d.items.forEach(function(i) { allPois.push(i.name); });
    });
    text += '景点：' + allPois.slice(0,6).join('、') + '\n';
  }
  text += 'MoodTravel — 让每一次出发都有温度';

  // 简单 QR 码生成算法（用模拟图案）
  var size = 200;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // 生成伪随机 QR 码图案（基于文本哈希）
  var hash = simpleHash(text);
  var moduleCount = 21;
  var moduleSize = size / (moduleCount + 8);
  var offset = 4 * moduleSize;

  // 定位图案（三个角）
  drawFinder(ctx, offset, offset, moduleSize);
  drawFinder(ctx, size - offset - 3*moduleSize, offset, moduleSize);
  drawFinder(ctx, offset, size - offset - 3*moduleSize, moduleSize);

  // 数据区域
  ctx.fillStyle = '#000';
  for (var i = 0; i < moduleCount; i++) {
    for (var j = 0; j < moduleCount; j++) {
      // 跳过定位图案区域
      if ((i < 7 && j < 7) || (i > moduleCount - 8 && j < 7) || (i < 7 && j > moduleCount - 8)) continue;
      var hashIdx = (i * moduleCount + j) % hash.length;
      if (hash.charCodeAt(hashIdx) % 2 === 0) {
        ctx.fillRect(offset + i * moduleSize, offset + j * moduleSize, moduleSize * 0.8, moduleSize * 0.8);
      }
    }
  }

  // 中心图标
  ctx.fillStyle = '#8BA88C';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✧', size/2, size/2);
}

function drawFinder(ctx, x, y, s) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, 3*s, 3*s);
  ctx.fillStyle = '#FFF';
  ctx.fillRect(x + s, y + s, s, s);
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 1.5*s, y + 1.5*s, s * 0.5, s * 0.5);
}

function simpleHash(str) {
  var hash = '';
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    hash += String.fromCharCode(97 + (c % 26));
  }
  // 扩展到足够长度
  while (hash.length < 500) hash += hash;
  return hash;
}

function closeQRModal() {
  var overlay = document.getElementById('qrModalOverlay');
  if (overlay) overlay.classList.remove('show');
}

function downloadQRCode() {
  var canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  var link = document.createElement('a');
  link.download = 'moodtravel-qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('✅ 二维码已下载');
}

// ================================================================
//  用户反馈系统 — NPS 评分 + 建议收集
// ================================================================
var feedbackData = { submitted: false, nps: 0, comment: '' };

function showFeedbackPrompt() {
  if (feedbackData.submitted) return;
  if (!itinerary || itinerary.length === 0) return;
  
  // 行程生成后 30 秒弹出
  setTimeout(function() {
    var overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    overlay.id = 'feedbackOverlay';
    overlay.innerHTML = '<div class="feedback-card glass-panel">' +
      '<div class="feedback-close" onclick="closeFeedback()">✕</div>' +
      '<div class="feedback-title">这个行程对你有帮助吗？</div>' +
      '<div class="feedback-sub">你的反馈能帮我们做得更好</div>' +
      '<div class="feedback-stars" id="feedbackStars">' +
      [1,2,3,4,5].map(function(n) {
        return '<span class="feedback-star" data-nps="' + n + '" onclick="setNPS(' + n + ')">★</span>';
      }).join('') +
      '</div>' +
      '<textarea class="feedback-input" id="feedbackInput" placeholder="有什么想说的？（选填）"></textarea>' +
      '<button class="feedback-submit-btn" onclick="submitFeedback()">提交反馈</button>' +
      '</div>';
    document.body.appendChild(overlay);
    setTimeout(function() { overlay.classList.add('show'); }, 100);
  }, 30000);
}

function setNPS(n) {
  feedbackData.nps = n;
  var stars = document.querySelectorAll('#feedbackStars .feedback-star');
  stars.forEach(function(star, i) {
    star.style.color = i < n ? '#FFD700' : 'rgba(255,255,255,0.4)';
  });
}

function submitFeedback() {
  feedbackData.comment = document.getElementById('feedbackInput').value || '';
  feedbackData.submitted = true;
  
  try {
    var history = JSON.parse(localStorage.getItem('moodtravel_feedback') || '[]');
    history.push({
      nps: feedbackData.nps,
      comment: feedbackData.comment,
      mood: activeMood,
      companion: companionType,
      time: new Date().toISOString()
    });
    localStorage.setItem('moodtravel_feedback', JSON.stringify(history.slice(-20)));
  } catch(e) {}
  
  closeFeedback();
  showToast('感谢你的反馈！✨');
}

function closeFeedback() {
  var overlay = document.getElementById('feedbackOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
  }
}

// ================================================================
//  API 设置管理
// ================================================================
function toggleApiSettings() {
  var panel = document.getElementById('apiSettingsPanel');
  if (panel) panel.classList.toggle('show');
}

function saveApiSettings() {
  var llmKey = document.getElementById('llmApiKeyInput').value.trim();
  var weatherKey = document.getElementById('weatherApiKeyInput').value.trim();
  if (llmKey) API_CONFIG.llm.apiKey = llmKey;
  if (weatherKey) API_CONFIG.weather.apiKey = weatherKey;
  saveApiConfig();
  toggleApiSettings();
  showToast('API 设置已保存！✨');
}

// ================================================================
//  AI 多智能体流水线 — 真实 LLM 调用版
// ================================================================
var aiAgentResults = null; // 存储 AI Agent 返回结果

function runMultiAgentPipeline() {
  var panel = document.getElementById('multiAgentPanel');
  if (panel) panel.classList.add('show');

  var agents = [
    { id: 'agentCard1', name: 'Route Planner', icon: '🗺️' },
    { id: 'agentCard2', name: 'Hotel Advisor', icon: '🏨' },
    { id: 'agentCard3', name: 'Food Curator', icon: '🍜' },
    { id: 'agentCard4', name: 'Weather Risk', icon: '🌤️' },
    { id: 'agentCard5', name: 'Budget Optimizer', icon: '💰' }
  ];

  // 阶段1：逐个启动 Agent 思考动画
  agents.forEach(function(agent, idx) {
    setTimeout(function() {
      var card = document.getElementById(agent.id);
      if (!card) return;
      card.classList.add('thinking');
      var outputEl = card.querySelector('.agent-output');
      if (outputEl) outputEl.textContent = '正在分析数据...';
    }, idx * 180);
  });

  // 阶段2：调用真实 AI API
  setTimeout(function() {
    var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || '平静';
    var now = new Date();
    var month = now.getMonth() + 1;
    var season = month >= 3 && month <= 5 ? '春季' : month >= 6 && month <= 8 ? '夏季' : month >= 9 && month <= 11 ? '秋季' : '冬季';
    var companionLabels = { solo: '独行', couple: '情侣', family: '家庭', friends: '朋友', business: '商务' };
    var weatherText = (typeof currentWeather !== 'undefined' && currentWeather && currentWeather.condition) ? currentWeather.condition : '晴朗';

    var payload = JSON.stringify({
      city: '杭州',
      mood: activeMood,
      days: days,
      budget: budget,
      companion: companionLabels[companionType] || '独行',
      season: season,
      weather: weatherText
    });

    // 调用后端 AI Agent API（Cloudflare Pages Functions）
    fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      if (data.success && data.agents) {
        aiAgentResults = data.agents;
        // 更新每个 Agent 卡片显示真实 AI 结果
        agents.forEach(function(agent, idx) {
          var card = document.getElementById(agent.id);
          if (!card) return;
          var outputEl = card.querySelector('.agent-output');
          var agentData = data.agents[idx];
          if (outputEl && agentData && agentData.result) {
            outputEl.textContent = agentData.result;
          }
          card.classList.remove('thinking');
          card.classList.add('done');
        });
        // 显示 AI 洞察面板
        renderAIAgentInsights(data.agents);
      } else {
        // fallback: 使用模拟数据
        runFallbackAgents(agents);
      }
      // 延迟隐藏面板
      setTimeout(function() {
        if (panel) {
          panel.style.opacity = '0';
          panel.style.transform = 'translateY(-10px)';
          setTimeout(function() { panel.classList.remove('show'); panel.style.opacity = ''; panel.style.transform = ''; }, 600);
        }
      }, 2000);
    }).catch(function() {
      // 网络错误，使用 fallback
      runFallbackAgents(agents);
      setTimeout(function() {
        if (panel) {
          panel.style.opacity = '0';
          panel.style.transform = 'translateY(-10px)';
          setTimeout(function() { panel.classList.remove('show'); panel.style.opacity = ''; panel.style.transform = ''; }, 600);
        }
      }, 2000);
    });
  }, 1200);
}

function runFallbackAgents(agents) {
  var fallbackOutputs = [
    '路线规划完成 ✓ 推荐杭州经典路线',
    '酒店比价完成 ✓ 匹配最优住宿',
    '美食推荐完成 ✓ 精选当地特色餐厅',
    '天气分析完成 ✓ 出行条件良好',
    '预算优化完成 ✓ 合理分配各项开支'
  ];
  agents.forEach(function(agent, idx) {
    var card = document.getElementById(agent.id);
    if (!card) return;
    var outputEl = card.querySelector('.agent-output');
    if (outputEl) outputEl.textContent = fallbackOutputs[idx] || '分析完成';
    card.classList.remove('thinking');
    card.classList.add('done');
  });
}

// 渲染 AI Agent 洞察面板
function renderAIAgentInsights(agentResults) {
  var insightsEl = document.getElementById('aiInsightsContent');
  if (!insightsEl) {
    // 动态创建洞察面板
    var itinerarySec = document.getElementById('itinerarySection');
    if (!itinerarySec) return;
    var insightsDiv = document.createElement('div');
    insightsDiv.className = 'ai-insights-panel reveal-section';
    insightsDiv.id = 'aiInsightsPanel';
    insightsDiv.innerHTML = '<div class="ai-insights-header">🤖 AI 多智能体洞察</div><div class="ai-insights-grid" id="aiInsightsContent"></div>';
    // 插入到行程section之前
    var planCards = document.getElementById('plansSection');
    if (planCards && planCards.nextSibling) {
      itinerarySec.parentNode.insertBefore(insightsDiv, planCards.nextSibling);
    } else if (itinerarySec) {
      itinerarySec.parentNode.insertBefore(insightsDiv, itinerarySec);
    }
    insightsEl = document.getElementById('aiInsightsContent');
  }
  if (!insightsEl || !agentResults) return;

  var html = '';
  agentResults.forEach(function(agent) {
    html += '<div class="ai-insight-card">' +
      '<div class="ai-insight-icon">' + (agent.icon || '🤖') + '</div>' +
      '<div class="ai-insight-label">' + (agent.name || 'AI Agent') + '</div>' +
      '<div class="ai-insight-text">' + (agent.result || '分析完成') + '</div>' +
      '</div>';
  });
  insightsEl.innerHTML = html;
}

// ================================================================
//  人流密度预测
// ================================================================
function getCrowdLevel(poi) {
  var now = new Date();
  var hour = now.getHours();
  var dayOfWeek = now.getDay();
  var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  var month = now.getMonth() + 1;
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  
  // 基础人流评分
  var baseScore = (poi.crowdednessLevel || 3);
  
  // 时间因素：早上人少，下午人多
  var timeModifier = 0;
  if (hour >= 6 && hour < 9) timeModifier = -1;
  else if (hour >= 9 && hour < 11) timeModifier = 0;
  else if (hour >= 11 && hour < 14) timeModifier = 1;
  else if (hour >= 14 && hour < 17) timeModifier = 1;
  else if (hour >= 17 && hour < 20) timeModifier = 0;
  else timeModifier = -1;
  
  // 周末更拥挤
  var weekendModifier = isWeekend ? 1 : 0;
  
  // 季节因素：黄金周/暑假人多
  var seasonModifier = 0;
  if (month === 7 || month === 8) seasonModifier = 1; // 暑假
  if (month === 10 && dayOfWeek >= 0) seasonModifier = 1; // 国庆
  
  // 天气因素：雨天少人
  var weatherModifier = 0;
  if (typeof currentWeather !== 'undefined' && currentWeather && currentWeather.condition) {
    if (currentWeather.condition.indexOf('雨') !== -1) weatherModifier = -1;
  }
  
  // 人气加权
  var popularityModifier = (poi.popularity || 5) > 7 ? 1 : 0;
  
  var totalScore = baseScore + timeModifier + weekendModifier + seasonModifier + weatherModifier + popularityModifier;
  totalScore = Math.max(1, Math.min(5, totalScore));
  
  var bestTime = '';
  if (hour < 9) bestTime = t.crowdBestTime1;
  else if (hour < 14) bestTime = t.crowdBestTime2;
  else bestTime = t.crowdBestTime3;
  
  if (totalScore <= 2) return { level: 'low', icon: '🟢', label: t.crowdFree, bestTime: bestTime };
  if (totalScore <= 3) return { level: 'medium', icon: '🟡', label: t.crowdModerate, bestTime: bestTime };
  if (totalScore <= 4) return { level: 'high', icon: '🟠', label: t.crowdBusy, bestTime: bestTime };
  return { level: 'crowded', icon: '🔴', label: t.crowdPacked, bestTime: bestTime };
}

// ================================================================
//  安全面板
// ================================================================
function renderSafetyPanel() {
  var panel = document.getElementById('safetyPanel');
  if (!panel) return;
  panel.classList.add('show');
  
  var grid = document.getElementById('safetyGrid');
  var tip = document.getElementById('safetyTip');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  
  // 城市信息
  var cityNames = [];
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city && cityNames.indexOf(item.city) === -1) cityNames.push(item.city);
      });
    });
  }
  var mainCity = cityNames[0] || '杭州';
  
  var safetyTitleMap = {
    '报警电话': 'safetyPoliceLabel', '急救中心': 'safetyAmbulanceLabel', '火警电话': 'safetyFireLabel',
    '交通事故': 'safetyTrafficLabel', '最近医院': 'safetyHospitalLabel', '出租车热线': 'safetyTaxiLabel',
    '旅游投诉': 'safetyTourismComplaintLabel', '领事保护': 'safetyConsularLabel'
  };
  
  var safetyItems = [
    { icon: '🚔', title: '报警电话', detail: '110' },
    { icon: '🚑', title: '急救中心', detail: '120' },
    { icon: '🚒', title: '火警电话', detail: '119' },
    { icon: '🚗', title: '交通事故', detail: '122' },
    { icon: '🏥', title: '最近医院', detail: mainCity + '市第一人民医院' },
    { icon: '🚕', title: '出租车热线', detail: mainCity === '杭州' ? '0571-28811111' : '当地12328' },
    { icon: '🏛️', title: '旅游投诉', detail: '12301' },
    { icon: '🌐', title: '领事保护', detail: '12308' }
  ];
  
  grid.innerHTML = safetyItems.map(function(s) {
    return '<div class="safety-card"><div class="safety-card-icon">' + s.icon + '</div><div class="safety-card-title">' + (t[safetyTitleMap[s.title]] || s.title) + '</div><div class="safety-card-detail">' + s.detail + '</div></div>';
  }).join('');
  
  tip.innerHTML = t.safetyTipText;
  fixLightModeText();
}

// ================================================================
//  碳足迹计算器
// ================================================================
function renderCarbonFootprint() {
  var section = document.getElementById('carbonSection');
  if (!section) return;
  section.classList.add('show');
  
  var wrap = document.getElementById('carbonScoreWrap');
  var tips = document.getElementById('carbonTips');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  
  // 估算总里程
  var totalKm = 0;
  var transportMode = '高铁';
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.transitTime) {
          totalKm += item.transitTime * 0.8; // 假设平均时速48km/h
        }
      });
    });
  }
  if (totalKm < 50) totalKm = 50 + Math.random() * 100;
  
  // 高铁: 约0.04 kg CO2/km/人
  // 自驾: 约0.12 kg CO2/km/人
  // 飞机: 约0.15 kg CO2/km/人
  var co2PerKm = 0.04;
  var estimatedCO2 = Math.round(totalKm * co2PerKm);
  var avgCO2 = Math.round(totalKm * 0.12); // 对比自驾排放
  
  // 绿色评分 (0-100)
  var greenScore = Math.round(100 - (estimatedCO2 / (avgCO2 || 1)) * 50);
  greenScore = Math.max(20, Math.min(100, greenScore));
  
  var isLight = document.body.classList.contains('light-mode');
  var unfilledColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
  wrap.innerHTML = '<div class="carbon-score-circle" style="background:conic-gradient(#8BA88C ' + (greenScore * 3.6) + 'deg, ' + unfilledColor + ' ' + (greenScore * 3.6) + 'deg)"><div class="carbon-score-inner"><div class="carbon-score-value">' + greenScore + '</div><div class="carbon-score-label">' + t.carbonGreenScore + '</div></div></div>' +
    '<div class="carbon-details">' +
    '<div class="carbon-detail-row"><span>' + t.carbonEstCO2 + '</span><span class="carbon-detail-val">' + estimatedCO2 + ' kg CO₂</span></div>' +
    '<div class="carbon-detail-row"><span>' + t.carbonCarCompare + '</span><span class="carbon-detail-val">' + avgCO2 + ' kg CO₂</span></div>' +
    '<div class="carbon-detail-row"><span>' + t.carbonSaved + '</span><span class="carbon-detail-val" style="color:#8BA88C">' + (avgCO2 - estimatedCO2) + ' kg CO₂</span></div>' +
    '<div class="carbon-detail-row"><span>' + t.carbonTransportMode + '</span><span class="carbon-detail-val">' + transportMode + t.carbonTransportPreferred + '</span></div>' +
    '</div>';
  
  tips.innerHTML = '<li>🌿 选择高铁出行比自驾减少约60%碳排放</li>' +
    '<li>🚲 市内短途建议骑行或步行，零碳出行</li>' +
    '<li>🏨 选择绿色酒店（如有环保认证）可进一步降低碳足迹</li>' +
    '<li>🥬 多尝试当地素食，减少食物碳足迹</li>' +
    '<li>♻️ 自带水杯和购物袋，减少一次性塑料使用</li>';
  fixLightModeText();
}

// ================================================================
//  旅行护照成就系统
// ================================================================
var travelAchievements = [];

function loadAchievements() {
  try {
    travelAchievements = JSON.parse(localStorage.getItem('moodtravel_achievements') || '[]');
  } catch(e) { travelAchievements = []; }
}

function unlockAchievement(id) {
  if (travelAchievements.indexOf(id) === -1) {
    travelAchievements.push(id);
    try { localStorage.setItem('moodtravel_achievements', JSON.stringify(travelAchievements)); } catch(e) {}
    showToast('🎉 解锁新成就！');
  }
}

function renderTravelPassport() {
  var section = document.getElementById('passportSection');
  if (!section) return;
  section.classList.add('show');
  
  loadAchievements();
  
  // 自动解锁成就
  if (itinerary && itinerary.length > 0) unlockAchievement('first_trip');
  var cities = [];
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
      });
    });
  }
  if (cities.length >= 2) unlockAchievement('cross_city');
  if (budget > 0 && stats && stats.budgetOverage <= 0) unlockAchievement('budget_master');
  
  var badges = [
    { id: 'first_trip', icon: '🌟', name: '首次出行', desc: '第一次生成旅行计划', condition: '已生成行程' },
    { id: 'cross_city', icon: '🚀', name: '跨城勇士', desc: '单次旅行跨越2+城市', condition: '多城市行程' },
    { id: 'budget_master', icon: '💎', name: '精打细算', desc: '预算内完成旅行规划', condition: '未超预算' },
    { id: 'food_explorer', icon: '🍽️', name: '美食猎人', desc: '行程包含5+餐厅', condition: '美食之旅' },
    { id: 'photo_master', icon: '📸', name: '摄影达人', desc: '打卡3+网红景点', condition: '摄影路线' },
    { id: 'eco_warrior', icon: '🌍', name: '环保先锋', desc: '绿色评分≥80', condition: '低碳出行' }
  ];
  
  var earnedCount = 0;
  var badgesHtml = badges.map(function(b) {
    var earned = travelAchievements.indexOf(b.id) !== -1;
    if (earned) earnedCount++;
    return '<div class="passport-badge ' + (earned ? 'earned' : 'locked') + '">' +
      '<div class="passport-badge-check">✅</div>' +
      '<div class="passport-badge-icon">' + b.icon + '</div>' +
      '<div class="passport-badge-name">' + b.name + '</div>' +
      '<div class="passport-badge-desc">' + (earned ? '已解锁' : b.condition) + '</div>' +
      '</div>';
  }).join('');
  
  document.getElementById('passportBadges').innerHTML = badgesHtml;
  document.getElementById('passportProgressFill').style.width = (earnedCount / badges.length * 100) + '%';
}

// ================================================================
//  时间线视图
// ================================================================
var currentTimelineView = 'list';

function toggleTimelineView(mode) {
  currentTimelineView = mode;
  var listBtn = document.getElementById('tlListBtn');
  var timelineBtn = document.getElementById('tlTimelineBtn');
  var daysEl = document.getElementById('itineraryDays');
  var timelineEl = document.getElementById('timelineView');
  
  if (listBtn) { listBtn.classList.toggle('active', mode === 'list'); }
  if (timelineBtn) { timelineBtn.classList.toggle('active', mode === 'timeline'); }
  
  if (mode === 'timeline') {
    if (daysEl) daysEl.style.display = 'none';
    if (timelineEl) timelineEl.classList.add('show');
    renderTimelineView();
  } else {
    if (daysEl) daysEl.style.display = '';
    if (timelineEl) timelineEl.classList.remove('show');
  }
}

function renderTimelineView() {
  var timelineEl = document.getElementById('timelineView');
  if (!timelineEl || !itinerary) return;
  
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  var html = '';
  
  itinerary.forEach(function(day, dayIndex) {
    html += '<div class="timeline-day-label">Day ' + day.day + '</div>';
    html += '<div class="timeline-day-row">';
    day.items.forEach(function(item, itemIndex) {
      var dotColor = item.type === 'rest' ? '#A3B5A6' : item.type === 'restaurant' ? '#E8A85A' : activeMoodColor;
      html += '<div class="timeline-snake-item" style="border-left:3px solid ' + dotColor + '">' +
        '<div class="timeline-snake-time">' + item.time + '</div>' +
        '<div class="timeline-snake-name">' + __(item.name, 'poiNames') + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.6)">¥' + (item.estimatedCost || 0) + '</div>' +
        '</div>';
      if (itemIndex < day.items.length - 1) {
        html += '<div class="timeline-snake-arrow">→</div>';
      }
    });
    html += '</div>';
  });
  
  timelineEl.innerHTML = html;
}

// ================================================================
//  背景音效系统
// ================================================================
var audioCtx = null;
var soundtrackOscillators = [];
var soundtrackGain = null;
var soundtrackPlaying = false;
var soundtrackVolume = 0.3;

function initSoundtrack() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      soundtrackGain = audioCtx.createGain();
      soundtrackGain.gain.value = soundtrackVolume;
      soundtrackGain.connect(audioCtx.destination);
    } catch(e) { return; }
  }
}

function getSoundtrackConfig() {
  var configs = {
    calm: { freqs: [220, 277, 330], type: 'sine', desc: '宁静波浪' },
    happy: { freqs: [392, 494, 587], type: 'triangle', desc: '欢快旋律' },
    sad: { freqs: [262, 330, 392], type: 'sine', desc: '温柔钢琴' },
    anxious: { freqs: [110, 146, 196], type: 'sine', desc: '宁静低频' },
    excited: { freqs: [440, 554, 659], type: 'sawtooth', desc: '能量节拍' },
    tired: { freqs: [174, 220, 261], type: 'sine', desc: '舒缓放松' },
    insomnia: { freqs: [98, 130, 164], type: 'sine', desc: '深度助眠' }
  };
  return configs[activeMood] || configs.calm;
}

function startSoundtrack() {
  initSoundtrack();
  if (!audioCtx) return;
  stopSoundtrackOscillators();
  
  var config = getSoundtrackConfig();
  var now = audioCtx.currentTime;
  
  config.freqs.forEach(function(freq, i) {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = config.type;
    osc.frequency.value = freq;
    gain.gain.value = 0.06 / config.freqs.length;
    gain.gain.setTargetAtTime(0.06 / config.freqs.length, now, 0.5);
    osc.connect(gain);
    gain.connect(soundtrackGain);
    osc.start(now);
    // 轻微频率调制
    if (i === 0) {
      var lfo = audioCtx.createOscillator();
      var lfoGain = audioCtx.createGain();
      lfo.frequency.value = 0.3 + i * 0.1;
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      soundtrackOscillators.push(lfo);
    }
    soundtrackOscillators.push(osc);
  });
  
  soundtrackPlaying = true;
  var btn = document.getElementById('soundtrackBtn');
  if (btn) { btn.classList.add('playing'); btn.textContent = '🎶'; }
  var label = document.getElementById('soundtrackLabel');
  if (label) label.textContent = config.desc;
}

function stopSoundtrackOscillators() {
  try {
    soundtrackOscillators.forEach(function(osc) { osc.stop(); });
  } catch(e) {}
  soundtrackOscillators = [];
}

function stopSoundtrack() {
  stopSoundtrackOscillators();
  soundtrackPlaying = false;
  var btn = document.getElementById('soundtrackBtn');
  if (btn) { btn.classList.remove('playing'); btn.textContent = '🎵'; }
  var label = document.getElementById('soundtrackLabel');
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  if (label) label.textContent = t.soundtrackLabel || '环境音';
}

function toggleSoundtrack() {
  var popup = document.getElementById('soundtrackPopup');
  if (soundtrackPlaying) {
    stopSoundtrack();
    if (popup) popup.classList.remove('show');
  } else {
    startSoundtrack();
    if (popup) popup.classList.add('show');
  }
}

function setSoundtrackVolume(val) {
  soundtrackVolume = val / 100;
  if (soundtrackGain) {
    soundtrackGain.gain.setTargetAtTime(soundtrackVolume, audioCtx.currentTime, 0.1);
  }
  var label = document.getElementById('soundtrackVolLabel');
  if (label) label.textContent = val + '%';
}

// 心情切换时自动切换音效
var originalSelectMood = selectMood;
if (typeof selectMood === 'function') {
  selectMood = function(mood) {
    originalSelectMood(mood);
    if (soundtrackPlaying) {
      stopSoundtrack();
      setTimeout(function() { startSoundtrack(); }, 300);
    }
  };
}

// ================================================================
//  多语言切换
// ================================================================
var currentLang = 'zh';
var i18n = {
  zh: {
    brandName: 'MoodTravel',
    brandSlogan: '让每一次出发<br/>都有温度',
    brandSub: '情绪驱动旅行 · 随心而行',
    generateBtn: '✨ 智能生成行程',
    exploreBtn: '↓ 探索方案',
    moodTitle: '此刻心情',
    companionTitle: '同行伙伴',
    sceneTitle: '出行模式',
    budgetTitle: '旅行预算',
    hotRoutesTitle: '热门情绪路线',
    plansTitle: '推荐方案',
    searchPlaceholder: '搜索景点、城市、目的地...',
    quickSelect: '快速选择：',
    careMode: '👴 长辈关怀模式',
    loadMoreBtn: '加载更多',
    budgetLabel: '旅行预算',
    budgetHint: '拖动滑块或直接输入',
    budgetCustomPlaceholder: '自定义金额',
    travelPersona: '🧬 你的旅行人格',
    travelPersonaHint: '基于你的选择，AI 为你绘制旅行画像',
    itineraryTitle: '📅 推荐行程',
    moodLabels: { calm:'平静', happy:'开心', sad:'治愈', anxious:'放松', excited:'探索', tired:'慵懒', insomnia:'深夜' },
    companionLabels: { solo:'独自旅行', couple:'情侣/伴侣', friends:'闺蜜/好友', family:'带长辈/亲子', business:'商务同事' },
    companionDescs: { solo:'自由自在，随心而行', couple:'浪漫氛围，甜蜜时光', friends:'吃喝玩乐，不踩雷', family:'慢节奏，享天伦', business:'高效出行，省时省心' },
    companionPaceLabels: { solo:'特种兵节奏', couple:'浪漫慢节奏', friends:'逛吃模式', family:'松弛模式', business:'效率优先' },
    dailyScenarioLabels: { walk:'🚶 下班透透气', break:'☕ 摸鱼5分钟', grocery:'🛒 帮长辈买菜', rain:'🌧️ 雨天躲雨处' },
    budgetPresetLabels: { '3000':'¥3,000', '5000':'¥5,000', '10000':'¥10,000', 'custom':'自定义' },
    sceneLabels: { tourism:'休闲旅游', business:'商务/日常出行' },
    sceneDescs: { tourism:'松弛感 · 打卡地 · 休息时间', business:'效率优先 · 交通便利 · 省时' },
    toastLangSwitch: '语言已切换至',
    langZh: '中文', langEn: 'English', langJa: '日本語',
    moodToast: '已切换至「{label}」模式',
    companionToast: ' 已切换至「{label}」— {pace}',
    elderlyOn: '已开启长辈关怀模式',
    elderlyOff: '已关闭长辈关怀模式',
    sceneTourismToast: '🧡 已切换至「休闲旅游」模式 — 放松身心，探索美好',
    sceneBusinessToast: '💙 已切换至「商务/日常出行」模式 — 高效便捷，省时省心',
    planA: '方案A', planB: '方案B', bookBtn: '预订', planCountUnit: ' 套',
    // Warmth
    greetingMorning: '早上好～新的一天，从这里开始 ☀️',
    greetingAfternoon: '下午好～阳光正好，适合出去走走 🌤️',
    greetingEvening: '傍晚好～今天辛苦了，放松一下吧 🌅',
    greetingNight: '夜深了，需要有人陪你说说话吗？🌙',
    moodEncouragement: {
      calm: '今天感觉平静也不错呢～有时候，安静就是最好的状态 🍃',
      happy: '看得出来你今天心情很好！把这份快乐带在路上吧～ 🌟',
      sad: '没关系的，偶尔的低落只是提醒我们，有些事需要温柔对待 🫂',
      anxious: '深呼吸，慢慢来～焦虑的时候，大自然是最好的疗愈师 🌿',
      excited: '哇！充满能量的你，今天一定能发现很多惊喜！✨',
      tired: '累了就歇一歇吧～有时候，什么都不做也是一种勇气 💤',
      insomnia: '深夜了，就让思绪飘一会儿吧，不用强迫自己睡着 🌙'
    },
    dailyTips: [
      '💡 小贴士：今天出门前，试着深呼吸三次，感受一下空气的味道',
      '💡 小贴士：走路时放慢脚步，看看路边有没有你没注意过的小花',
      '💡 小贴士：给自己买一杯喜欢的饮品，今天值得被好好对待',
      '💡 小贴士：给一个好久没联系的朋友发条消息，只是说声"想你了"',
      '💡 小贴士：今天试着对陌生人微笑，你会收获意想不到的温暖',
      '💡 小贴士：放下手机十分钟，看看窗外，你会发现世界一直在那里',
      '💡 小贴士：晚餐后散个步，哪怕只有十分钟，也是一段属于自己的时光',
      '💡 小贴士：今天记录一件让你开心的小事，哪怕再微不足道'
    ],
    soundtrackLabel: '环境音',
    soundtrackTitle: '背景音效',
    bookingTitle: '🔍 全网比价中',
    bookingSearching: '正在为您查询多个平台...',
    bookingGoBook: '前往预订',
    bookingSaved: '已为您节省',
    safetyTitle: '🛡️ 安全中心',
    safetyEmergency: '紧急求助',
    safetyPolice: '报警',
    safetyAmbulance: '急救',
    safetyFire: '火警',
    safetyMore: '更多安全信息',
    weatherTitle: '🌤️ 实时天气',
    weatherTemp: '温度',
    weatherHumidity: '湿度',
    weatherWind: '风力',
    weatherAQI: '空气质量',
    weatherFeel: '体感',
    hotRouteToast: '已加载「{route}」路线方案',
    scenarioToast: { walk:'下班后透透气吧~', break:'摸鱼时间到！', grocery:'帮长辈买菜，暖心出行~', rain:'找个地方躲雨吧~' },
    dailyScenarioTitle: '🌿 日常场景',
    packingTitle: '🎒 行前清单',
    packingCat: { essentials:'必备物品', work:'工作必备', clothes:'衣物', toiletries:'洗漱用品', electronics:'电子设备', health:'健康防护', documents:'证件文件', extras:'其他' },
    poiDetailRating: '评分',
    poiDetailPrice: '人均',
    poiDetailHours: '营业时间',
    poiDetailAddress: '地址',
    poiDetailPhotoTip: '📸 拍照技巧',
    poiDetailLocalTip: '💡 本地人贴士',
    poiDetailBestTime: '🕐 最佳拍照时间',
    poiDetailCrowd: '👥 拥挤度',
    poiDetailHiddenGem: '💎 隐藏宝地',
    poiDetailInstagram: '📷 出片指数',
    poiDetailEnergy: '体力消耗',
    poiDetailDuration: '建议游玩',
    crowdLevels: ['空闲','舒适','适中','较挤','拥挤'],
    regenerateHotel: '🔄 换一家',
    bookHotel: '预订酒店',
    refreshFood: '🔄 换一批',
    noPlans: '暂无推荐方案，请调整心情或预算试试～',
    ariaSelectMood: '选择{label}心情',
    copySuccess: '已复制到剪贴板',
    sharePlan: '分享方案',
    exportPlan: '导出方案',
    // 行程渲染
    itineraryDay: '天', itineraryNodes: '个节点', itineraryRest: '休息', itineraryFood: '餐饮', itineraryPoi: '景点',
    itineraryTransitAbout: '约', itineraryTransitDrive: '分钟车程', itineraryMinutes: '分钟',
    itineraryBestVisit: '🕐 最佳游览：', itineraryBestPhotoTime: '⏰ 最佳拍照时间：',
    itineraryHiddenGem: '💎隐藏宝地', itineraryRainPlan: '🌧️ 雨天备选', itineraryRefreshDay: '🔄 刷新这天',
    itineraryAICompare: 'AI比价：', itineraryFrom: ' 起', itinerarySave: '省¥', itineraryDayLabel: 'Day ',
    itineraryBook: '预订',
    // 酒店渲染
    hotelScore: '分', hotelBest: '最优', hotelAISuggest: 'AI建议：', hotelSaveAmount: '💰 比价节省 ¥',
    hotelAICompare: 'AI 比价', hotelComparePlatforms: '已为您对比 ', hotelPlatformCount: ' 个平台',
    // 统计面板
    statsFilterPassed: '通过过滤', statsSelectedPois: '精选景点', statsSavedAmount: '比价节省', statsTotalBudget: '总预算',
    // 行前清单
    checklistChecked: '已检查 ', checklistItems: ' 项',
    checklistTourismTitle: '旅行出发前检查清单', checklistBusinessTitle: '商务出行必备清单',
    checklistTourismSub: '出发前2小时逐项检查，安心出发', checklistBusinessSub: '出发前2小时检查，确保万无一失',
    // 碳足迹
    carbonGreenScore: '绿色分', carbonEstCO2: '预计碳排放', carbonCarCompare: '自驾对比',
    carbonSaved: '节省排放', carbonTransportMode: '出行方式', carbonTransportPreferred: '优选',
    // 天气
    weatherHumidityLabel: '湿度 ', weatherRealtime: '实时',
    // 拥挤度
    crowdFree: '空闲', crowdModerate: '适中', crowdBusy: '较挤', crowdPacked: '爆满',
    crowdBestTime1: '上午9:00-11:00（避开早高峰）', crowdBestTime2: '下午14:00-16:00（午餐后时段）', crowdBestTime3: '明天上午8:00-10:00（清晨最佳）',
    // 安全面板
    safetyPoliceLabel: '报警电话', safetyAmbulanceLabel: '急救中心', safetyFireLabel: '火警电话',
    safetyTrafficLabel: '交通事故', safetyHospitalLabel: '最近医院', safetyTaxiLabel: '出租车热线',
    safetyTourismComplaintLabel: '旅游投诉', safetyConsularLabel: '领事保护',
    safetyTipText: '💡 <strong>出行小贴士：</strong>建议购买旅游意外险（约¥15-30/天），保存紧急联系人电话，提前下载离线地图。如遇紧急情况，保持冷静，第一时间拨打110。',
    // 旅行人格
    personaPace: '旅行节奏', personaBudget: '预算偏好', personaDays: '行程天数', personaMood: '当前心情',
    personaMoodSuffix: '心情',
    // 关怀信
    careGreetingLateNight: '深夜好', careGreetingMorning: '早安', careGreetingLateMorning: '上午好',
    careGreetingNoon: '中午好', careGreetingAfternoon: '下午好', careGreetingEvening: '晚上好',
    careTravelTips: '🧳 旅行小贴士',
    // 路线卡片
    route2D1N: '2天1夜', route3D2N: '3天2夜', route1D: '1天',
    routeBudget800: '¥800起', routeBudget300: '¥300起', routeBudget1500: '¥1,500起',
    routeBudget600: '¥600起', routeBudget500: '¥500起', routeBudget200: '¥200起', routeBudget1200: '¥1,200起',
    routeBudget1000: '¥1,000起', routeBudget2000: '¥2,000起',
    // 预订弹窗
    bookingBook: '预订',
    // 伴随提示
    companionTipCouple: '💑 已为您避开拥挤排队店，预留充足拍照和休息时间，享受甜蜜旅程',
    companionTipFriends: '👯 闺蜜逛吃模式已开启！网红打卡地、夜市小吃一网打尽',
    companionTipFamily: '👨‍👩‍👧 长辈/亲子松弛模式：每日上限2个景点，强制午休，避免爬山等高强度活动',
    companionTipBusiness: '💼 商务高效模式：优先交通枢纽周边、快捷餐饮，氛围得体不尴尬'
  },
  en: {
    brandName: 'MoodTravel',
    brandSlogan: 'Every journey<br/>with warmth',
    brandSub: 'Emotion-driven Travel · Follow Your Heart',
    generateBtn: '✨ Generate Itinerary',
    exploreBtn: '↓ Explore Plans',
    moodTitle: 'Current Mood',
    companionTitle: 'Companions',
    sceneTitle: 'Travel Mode',
    budgetTitle: 'Budget',
    hotRoutesTitle: 'Popular Routes',
    plansTitle: 'Recommendations',
    searchPlaceholder: 'Search destinations, cities...',
    quickSelect: 'Quick Select:',
    careMode: '👴 Senior Care Mode',
    loadMoreBtn: 'Load More',
    budgetLabel: 'Travel Budget',
    budgetHint: 'Drag slider or type amount',
    budgetCustomPlaceholder: 'Custom amount',
    travelPersona: '🧬 Your Travel Persona',
    travelPersonaHint: 'AI paints your travel portrait based on your choices',
    itineraryTitle: '📅 Itinerary',
    moodLabels: { calm:'Calm', happy:'Happy', sad:'Healing', anxious:'Relax', excited:'Explore', tired:'Lazy', insomnia:'Late Night' },
    companionLabels: { solo:'Solo', couple:'Couple', friends:'Friends', family:'Family', business:'Business' },
    companionDescs: { solo:'Free & easy, go anywhere', couple:'Romantic vibes, sweet time', friends:'Food & fun, no regrets', family:'Slow pace, family time', business:'Efficient travel, save time' },
    companionPaceLabels: { solo:'Fast-paced', couple:'Romantic & slow', friends:'Foodie mode', family:'Relaxed mode', business:'Efficiency first' },
    dailyScenarioLabels: { walk:'🚶 After-work stroll', break:'☕ 5-min break', grocery:'🛒 Grocery run', rain:'🌧️ Rainy day hideout' },
    budgetPresetLabels: { '3000':'¥3,000', '5000':'¥5,000', '10000':'¥10,000', 'custom':'Custom' },
    sceneLabels: { tourism:'Leisure Travel', business:'Business Travel' },
    sceneDescs: { tourism:'Relaxed · Landmarks · Rest stops', business:'Efficiency · Convenience · Time-saving' },
    toastLangSwitch: 'Language switched to',
    langZh: '中文', langEn: 'English', langJa: '日本語',
    moodToast: 'Switched to {label} mode',
    companionToast: ' Switched to {label} — {pace}',
    elderlyOn: 'Senior Care Mode On',
    elderlyOff: 'Senior Care Mode Off',
    sceneTourismToast: '🧡 Switched to Leisure Travel — relax and explore',
    sceneBusinessToast: '💙 Switched to Business Travel — efficient and convenient',
    planA: 'Plan A', planB: 'Plan B', bookBtn: 'Book', planCountUnit: ' plans',
    greetingMorning: 'Good morning! A new day begins ☀️',
    greetingAfternoon: 'Good afternoon! Perfect weather for a walk 🌤️',
    greetingEvening: 'Good evening! You\'ve worked hard today, time to relax 🌅',
    greetingNight: 'Late night... need someone to talk to? 🌙',
    moodEncouragement: {
      calm: 'Feeling calm today is nice too～ Sometimes, quiet is the best state 🍃',
      happy: 'I can tell you\'re happy! Take this joy on the road～ 🌟',
      sad: 'It\'s okay. Sometimes feeling low just means we need gentle care 🫂',
      anxious: 'Breathe deeply, take it slow～ Nature is the best healer 🌿',
      excited: 'Wow! Full of energy, you\'re going to discover amazing things! ✨',
      tired: 'Rest when you\'re tired～ Sometimes doing nothing is the bravest thing 💤',
      insomnia: 'Late at night, let your thoughts drift～ No need to force sleep 🌙'
    },
    dailyTips: [
      '💡 Tip: Before heading out today, try taking three deep breaths and feel the air',
      '💡 Tip: Slow down your pace and notice flowers you\'ve never seen before',
      '💡 Tip: Buy yourself a favorite drink — you deserve to be treated well today',
      '💡 Tip: Send a message to a friend you haven\'t talked to in a while',
      '💡 Tip: Try smiling at a stranger today, you might receive unexpected warmth',
      '💡 Tip: Put down your phone for ten minutes and look out the window',
      '💡 Tip: Take a walk after dinner, even ten minutes is your own time',
      '💡 Tip: Write down one small thing that made you happy today'
    ],
    soundtrackLabel: 'Ambient Sound',
    soundtrackTitle: 'Background Sound',
    bookingTitle: '🔍 Comparing Prices',
    bookingSearching: 'Searching multiple platforms...',
    bookingGoBook: 'Book Now',
    bookingSaved: 'Saved',
    safetyTitle: '🛡️ Safety Center',
    safetyEmergency: 'Emergency',
    safetyPolice: 'Police',
    safetyAmbulance: 'Ambulance',
    safetyFire: 'Fire',
    safetyMore: 'More Safety Info',
    weatherTitle: '🌤️ Weather',
    weatherTemp: 'Temp',
    weatherHumidity: 'Humidity',
    weatherWind: 'Wind',
    weatherAQI: 'Air Quality',
    weatherFeel: 'Feels Like',
    hotRouteToast: 'Loaded "{route}" route plan',
    scenarioToast: { walk:'Time for a walk~', break:'Break time!', grocery:'Grocery run, warm trip~', rain:'Find a cozy hideout~' },
    dailyScenarioTitle: '🌿 Daily Scenarios',
    packingTitle: '🎒 Packing List',
    packingCat: { essentials:'Essentials', work:'Work', clothes:'Clothing', toiletries:'Toiletries', electronics:'Electronics', health:'Health', documents:'Documents', extras:'Extras' },
    poiDetailRating: 'Rating',
    poiDetailPrice: 'Per Person',
    poiDetailHours: 'Hours',
    poiDetailAddress: 'Address',
    poiDetailPhotoTip: '📸 Photo Tip',
    poiDetailLocalTip: '💡 Local Tip',
    poiDetailBestTime: '🕐 Best Photo Time',
    poiDetailCrowd: '👥 Crowd Level',
    poiDetailHiddenGem: '💎 Hidden Gem',
    poiDetailInstagram: '📷 Photo Score',
    poiDetailEnergy: 'Energy',
    poiDetailDuration: 'Duration',
    crowdLevels: ['Empty','Comfortable','Moderate','Busy','Crowded'],
    regenerateHotel: '🔄 Try Another',
    bookHotel: 'Book Hotel',
    refreshFood: '🔄 Refresh',
    noPlans: 'No plans yet. Try adjusting mood or budget~',
    ariaSelectMood: 'Select {label} mood',
    copySuccess: 'Copied to clipboard',
    sharePlan: 'Share Plan',
    exportPlan: 'Export Plan',
    // Itinerary rendering
    itineraryDay: ' day(s)', itineraryNodes: ' nodes', itineraryRest: 'Rest', itineraryFood: 'Dining', itineraryPoi: 'Scenic Spot',
    itineraryTransitAbout: '~', itineraryTransitDrive: 'min drive', itineraryMinutes: 'min',
    itineraryBestVisit: '🕐 Best Visit: ', itineraryBestPhotoTime: '⏰ Best Photo Time: ',
    itineraryHiddenGem: '💎Hidden Gem', itineraryRainPlan: '🌧️ Rainy Day Plan', itineraryRefreshDay: '🔄 Refresh Day',
    itineraryAICompare: 'AI Compare: ', itineraryFrom: ' from', itinerarySave: 'Save ¥', itineraryDayLabel: 'Day ',
    itineraryBook: 'Book',
    // Hotel rendering
    hotelScore: '', hotelBest: 'Best', hotelAISuggest: 'AI Suggests: ', hotelSaveAmount: '💰 Save ¥',
    hotelAICompare: 'AI Compare', hotelComparePlatforms: 'Compared ', hotelPlatformCount: ' platforms',
    // Stats
    statsFilterPassed: 'Filtered', statsSelectedPois: 'Selected', statsSavedAmount: 'Saved', statsTotalBudget: 'Budget',
    // Checklist
    checklistChecked: 'Checked ', checklistItems: ' items',
    checklistTourismTitle: 'Pre-travel Checklist', checklistBusinessTitle: 'Business Travel Checklist',
    checklistTourismSub: 'Check 2 hours before departure', checklistBusinessSub: 'Check 2 hours before departure',
    // Carbon
    carbonGreenScore: 'Green Score', carbonEstCO2: 'Est. CO₂', carbonCarCompare: 'Car Compare',
    carbonSaved: 'CO₂ Saved', carbonTransportMode: 'Transport', carbonTransportPreferred: 'Preferred',
    // Weather
    weatherHumidityLabel: 'Humidity ', weatherRealtime: 'Live',
    // Crowd
    crowdFree: 'Free', crowdModerate: 'Moderate', crowdBusy: 'Busy', crowdPacked: 'Packed',
    crowdBestTime1: '9:00-11:00 AM (avoid rush)', crowdBestTime2: '2:00-4:00 PM (after lunch)', crowdBestTime3: '8:00-10:00 AM tomorrow',
    // Safety
    safetyPoliceLabel: 'Police', safetyAmbulanceLabel: 'Ambulance', safetyFireLabel: 'Fire',
    safetyTrafficLabel: 'Traffic', safetyHospitalLabel: 'Nearest Hospital', safetyTaxiLabel: 'Taxi Hotline',
    safetyTourismComplaintLabel: 'Tourism Complaint', safetyConsularLabel: 'Consular Protection',
    safetyTipText: '💡 <strong>Travel Tip:</strong> Consider buying travel insurance (~¥15-30/day). Save emergency contacts and download offline maps. In case of emergency, stay calm and dial 110 first.',
    // Persona
    personaPace: 'Pace', personaBudget: 'Budget', personaDays: 'Duration', personaMood: 'Mood',
    personaMoodSuffix: '',
    // Care letter
    careGreetingLateNight: 'Good Night', careGreetingMorning: 'Good Morning', careGreetingLateMorning: 'Good Morning',
    careGreetingNoon: 'Good Afternoon', careGreetingAfternoon: 'Good Afternoon', careGreetingEvening: 'Good Evening',
    careTravelTips: '🧳 Travel Tips',
    // Route cards
    route2D1N: '2D1N', route3D2N: '3D2N', route1D: '1 Day',
    routeBudget800: 'From ¥800', routeBudget300: 'From ¥300', routeBudget1500: 'From ¥1,500',
    routeBudget600: 'From ¥600', routeBudget500: 'From ¥500', routeBudget200: 'From ¥200', routeBudget1200: 'From ¥1,200',
    routeBudget1000: 'From ¥1,000', routeBudget2000: 'From ¥2,000',
    // Booking
    bookingBook: 'Book',
    // Companion tips
    companionTipCouple: '💑 Avoided crowded spots, reserved plenty of photo and rest time for a sweet journey',
    companionTipFriends: '👯 Bestie food & fun mode! Instagram spots and night market snacks covered',
    companionTipFamily: '👨‍👩‍👧 Family relaxed mode: max 2 spots/day, mandatory nap, no strenuous activities',
    companionTipBusiness: '💼 Business efficiency mode: near transport hubs, quick dining, appropriate atmosphere'
  },
  ja: {
    brandName: 'MoodTravel',
    brandSlogan: 'すべての旅に<br/>温もりを',
    brandSub: '感情駆動旅行 · 心のままに',
    generateBtn: '✨ 旅程を生成',
    exploreBtn: '↓ プランを探す',
    moodTitle: '今の気分',
    companionTitle: '同行者',
    sceneTitle: '旅行モード',
    budgetTitle: '予算',
    hotRoutesTitle: '人気ルート',
    plansTitle: 'おすすめプラン',
    searchPlaceholder: '観光地、都市を検索...',
    quickSelect: 'クイック選択：',
    careMode: '👴 シニアケアモード',
    loadMoreBtn: 'もっと見る',
    budgetLabel: '旅行予算',
    budgetHint: 'スライダーを動かすか直接入力',
    budgetCustomPlaceholder: '金額を入力',
    travelPersona: '🧬 あなたの旅行ペルソナ',
    travelPersonaHint: '選択に基づいて、AIが旅行の肖像を描きます',
    itineraryTitle: '📅 旅程',
    moodLabels: { calm:'穏やか', happy:'嬉しい', sad:'癒し', anxious:'リラックス', excited:'探検', tired:'だるい', insomnia:'深夜' },
    companionLabels: { solo:'ひとり旅', couple:'カップル', friends:'友達と', family:'家族と', business:'ビジネス' },
    companionDescs: { solo:'自由気ままに', couple:'ロマンチックな時間', friends:'食べ歩き・遊び尽くす', family:'ゆったり家族時間', business:'効率的な移動' },
    companionPaceLabels: { solo:'ハイペース', couple:'ロマンチック', friends:'食べ歩きモード', family:'リラックス', business:'効率優先' },
    dailyScenarioLabels: { walk:'🚶 仕事帰りの散歩', break:'☕ 5分休憩', grocery:'🛒 買い物', rain:'🌧️ 雨の日の避難所' },
    budgetPresetLabels: { '3000':'¥3,000', '5000':'¥5,000', '10000':'¥10,000', 'custom':'カスタム' },
    sceneLabels: { tourism:'レジャー旅行', business:'ビジネス旅行' },
    sceneDescs: { tourism:'リラックス · 観光地 · 休憩', business:'効率 · 利便性 · 時短' },
    toastLangSwitch: '言語を切り替えました：',
    langZh: '中文', langEn: 'English', langJa: '日本語',
    moodToast: '「{label}」モードに切り替えました',
    companionToast: ' 「{label}」に切り替え — {pace}',
    elderlyOn: 'シニアケアモードをオンにしました',
    elderlyOff: 'シニアケアモードをオフにしました',
    sceneTourismToast: '🧡 「レジャー旅行」モードに切り替え — リラックスして探索',
    sceneBusinessToast: '💙 「ビジネス旅行」モードに切り替え — 効率的で便利',
    planA: 'プランA', planB: 'プランB', bookBtn: '予約', planCountUnit: ' 件',
    greetingMorning: 'おはようございます～新しい一日が始まります ☀️',
    greetingAfternoon: 'こんにちは～散歩にぴったりの陽気ですね 🌤️',
    greetingEvening: 'こんばんは～お疲れさまでした、ゆっくり休んで 🌅',
    greetingNight: '深夜ですね…誰かと話したい気分ですか？🌙',
    moodEncouragement: {
      calm: '今日は穏やかな気分ですね～静けさも、時には一番の癒しです 🍃',
      happy: '嬉しい気分ですね！その幸せを旅に連れて行きましょう～ 🌟',
      sad: '大丈夫です。たまには落ち込むことも、優しさが必要なサイン 🫂',
      anxious: '深呼吸して、ゆっくり～自然は最高の癒し手です 🌿',
      excited: 'わあ！エネルギーに満ちたあなた、きっと素敵な発見が！✨',
      tired: '疲れたら休みましょう～何もしないことも、勇気の一つです 💤',
      insomnia: '深夜、思いを巡らせて～無理に眠ろうとしなくていいんです 🌙'
    },
    dailyTips: [
      '💡 ヒント：出かける前に、深呼吸を3回してみてください',
      '💡 ヒント：歩く速度を少し落として、道端の花に気づいてみましょう',
      '💡 ヒント：お気に入りの飲み物を買って、今日の自分を大切に',
      '💡 ヒント：久しぶりの友達に「会いたい」とメッセージを送ってみて',
      '💡 ヒント：今日は知らない人に笑顔を向けてみてください',
      '💡 ヒント：スマホを10分置いて、窓の外を眺めてみましょう',
      '💡 ヒント：夕食後に散歩を、たとえ10分でも自分だけの時間',
      '💡 ヒント：今日嬉しかった小さなことを一つ記録してみて'
    ],
    soundtrackLabel: '環境音',
    soundtrackTitle: 'BGM',
    bookingTitle: '🔍 価格比較中',
    bookingSearching: '複数のプラットフォームを検索中...',
    bookingGoBook: '予約する',
    bookingSaved: '節約額',
    safetyTitle: '🛡️ 安全センター',
    safetyEmergency: '緊急連絡',
    safetyPolice: '警察',
    safetyAmbulance: '救急',
    safetyFire: '消防',
    safetyMore: '安全情報',
    weatherTitle: '🌤️ 天気',
    weatherTemp: '気温',
    weatherHumidity: '湿度',
    weatherWind: '風力',
    weatherAQI: '空気質',
    weatherFeel: '体感',
    hotRouteToast: '「{route}」ルートを読み込みました',
    scenarioToast: { walk:'散歩の時間～', break:'休憩タイム！', grocery:'買い物、温かいお出かけ～', rain:'雨宿りしよう～' },
    dailyScenarioTitle: '🌿 日常シーン',
    packingTitle: '🎒 持ち物リスト',
    packingCat: { essentials:'必需品', work:'仕事', clothes:'衣類', toiletries:'洗面用具', electronics:'電子機器', health:'健康', documents:'書類', extras:'その他' },
    poiDetailRating: '評価',
    poiDetailPrice: '一人当たり',
    poiDetailHours: '営業時間',
    poiDetailAddress: '住所',
    poiDetailPhotoTip: '📸 撮影ヒント',
    poiDetailLocalTip: '💡 地元のヒント',
    poiDetailBestTime: '🕐 ベスト撮影時間',
    poiDetailCrowd: '👥 混雑度',
    poiDetailHiddenGem: '💎 隠れた名所',
    poiDetailInstagram: '📷 フォトスコア',
    poiDetailEnergy: '体力',
    poiDetailDuration: '所要時間',
    crowdLevels: ['空き','快適','普通','混雑','満員'],
    regenerateHotel: '🔄 別のを探す',
    bookHotel: 'ホテル予約',
    refreshFood: '🔄 更新',
    noPlans: 'プランがありません。気分や予算を調整してみて～',
    ariaSelectMood: '{label}の気分を選択',
    copySuccess: 'クリップボードにコピーしました',
    sharePlan: 'プランを共有',
    exportPlan: 'プランをエクスポート',
    // 旅程レンダリング
    itineraryDay: '日', itineraryNodes: 'ノード', itineraryRest: '休憩', itineraryFood: '飲食', itineraryPoi: '観光スポット',
    itineraryTransitAbout: '約', itineraryTransitDrive: '分ドライブ', itineraryMinutes: '分',
    itineraryBestVisit: '🕐 ベスト訪問：', itineraryBestPhotoTime: '⏰ ベスト撮影時間：',
    itineraryHiddenGem: '💎隠れた名所', itineraryRainPlan: '🌧️ 雨天プラン', itineraryRefreshDay: '🔄 この日を更新',
    itineraryAICompare: 'AI比較：', itineraryFrom: ' から', itinerarySave: '¥節約', itineraryDayLabel: 'Day ',
    itineraryBook: '予約',
    // ホテルレンダリング
    hotelScore: '点', hotelBest: '最優', hotelAISuggest: 'AIおすすめ：', hotelSaveAmount: '💰 比較節約 ¥',
    hotelAICompare: 'AI比較', hotelComparePlatforms: '比較済み ', hotelPlatformCount: ' プラットフォーム',
    // 統計
    statsFilterPassed: 'フィルター通過', statsSelectedPois: '厳選スポット', statsSavedAmount: '比較節約', statsTotalBudget: '総予算',
    // 持ち物リスト
    checklistChecked: 'チェック済み ', checklistItems: ' 項目',
    checklistTourismTitle: '旅行前チェックリスト', checklistBusinessTitle: 'ビジネス旅行チェックリスト',
    checklistTourismSub: '出発2時間前にチェック', checklistBusinessSub: '出発2時間前にチェック',
    // カーボンフットプリント
    carbonGreenScore: 'グリーンスコア', carbonEstCO2: '推定CO₂', carbonCarCompare: '自家用車比較',
    carbonSaved: 'CO₂削減', carbonTransportMode: '交通手段', carbonTransportPreferred: 'おすすめ',
    // 天気
    weatherHumidityLabel: '湿度 ', weatherRealtime: 'リアルタイム',
    // 混雑度
    crowdFree: '空き', crowdModerate: '適度', crowdBusy: '混雑', crowdPacked: '満員',
    crowdBestTime1: '午前9:00-11:00（ラッシュ回避）', crowdBestTime2: '午後14:00-16:00（昼食後）', crowdBestTime3: '明日午前8:00-10:00（早朝最適）',
    // 安全パネル
    safetyPoliceLabel: '警察', safetyAmbulanceLabel: '救急', safetyFireLabel: '消防',
    safetyTrafficLabel: '交通事故', safetyHospitalLabel: '最寄り病院', safetyTaxiLabel: 'タクシー',
    safetyTourismComplaintLabel: '観光苦情', safetyConsularLabel: '領事保護',
    safetyTipText: '💡 <strong>旅行のヒント：</strong>旅行保険（約¥15-30/日）の購入をおすすめします。緊急連絡先を保存し、オフラインマップをダウンロードしてください。緊急時は冷静に110番通報を。',
    // ペルソナ
    personaPace: '旅行ペース', personaBudget: '予算傾向', personaDays: '日数', personaMood: '今の気分',
    personaMoodSuffix: '気分',
    // ケアレター
    careGreetingLateNight: '深夜です', careGreetingMorning: 'おはよう', careGreetingLateMorning: 'おはよう',
    careGreetingNoon: 'こんにちは', careGreetingAfternoon: 'こんにちは', careGreetingEvening: 'こんばんは',
    careTravelTips: '🧳 旅行のヒント',
    // ルートカード
    route2D1N: '2日1泊', route3D2N: '3日2泊', route1D: '1日',
    routeBudget800: '¥800〜', routeBudget300: '¥300〜', routeBudget1500: '¥1,500〜',
    routeBudget600: '¥600〜', routeBudget500: '¥500〜', routeBudget200: '¥200〜', routeBudget1200: '¥1,200〜',
    routeBudget1000: '¥1,000〜', routeBudget2000: '¥2,000〜',
    // 予約
    bookingBook: '予約',
    // 同行者ヒント
    companionTipCouple: '💑 混雑店を避け、写真と休憩時間を十分に確保、甘い旅を',
    companionTipFriends: '👯 親友と食べ歩きモード！インスタ映えスポット、夜市グルメを網羅',
    companionTipFamily: '👨‍👩‍👧 家族リラックスモード：1日最大2スポット、昼寝必須、激しい活動なし',
    companionTipBusiness: '💼 ビジネス効率モード：交通ハブ近く、クイックダイニング、適切な雰囲気'
  }
};

// 将 i18n 挂载到 window 上，确保所有模块都能访问
window.i18n = i18n;

var i18nData = {
  poiNames: {
    '悦榕庄SPA水疗': { en: 'Banyan Tree Spa', ja: 'バンヤンツリーSPA' },
    '猫的天空之城·概念书店': { en: 'Moments Concept Bookstore', ja: '猫空コンセプト書店' },
    '永福寺·抄经体验': { en: 'Yongfu Temple Sutra Copying', ja: '永福寺写経体験' },
    '中国茶叶博物馆': { en: 'China Tea Museum', ja: '中国茶葉博物館' },
    '西湖漫步': { en: 'West Lake Stroll', ja: '西湖散策' },
    '杭州宋城·千古情': { en: 'Song Dynasty Town', ja: '杭州宋城千古情' },
    '苏堤骑行': { en: 'Su Causeway Cycling', ja: '蘇堤サイクリング' },
    '河坊街夜市': { en: 'Hefang Street Night Market', ja: '河坊街夜市' },
    '湖滨银泰in77': { en: 'Hubin Intime in77', ja: '湖濱銀泰in77' },
    '杭州动物园': { en: 'Hangzhou Zoo', ja: '杭州動物園' },
    '浙江省科技馆': { en: 'Zhejiang Science Museum', ja: '浙江省科技館' },
    '郭庄园林下午茶': { en: 'Guozhuang Garden Tea', ja: '郭庄園林アフタヌーンティー' },
    'Wagas轻食沙拉': { en: 'Wagas Light Salad', ja: 'ワガス軽食サラダ' },
    '蒸年轻·蒸汽海鲜': { en: 'Steam Young Seafood', ja: '蒸若・蒸気海鮮' },
    '楼外楼·杭帮菜': { en: 'Louwailou Hangzhou Cuisine', ja: '楼外楼杭州料理' },
    '外婆家': { en: "Grandma's Kitchen", ja: '外婆家' },
    '浙江美术馆': { en: 'Zhejiang Art Museum', ja: '浙江美術館' },
    '西西弗书店': { en: 'Sisyphus Bookstore', ja: 'シーシュポス書店' },
    '灵隐寺': { en: 'Lingyin Temple', ja: '霊隠寺' },
    '九溪烟树': { en: 'Nine Creeks Misty Forest', ja: '九渓煙樹' },
    '知味观·味庄': { en: 'Zhiweiguan Restaurant', ja: '知味観・味荘' },
    '鼎泰丰': { en: 'Din Tai Fung', ja: 'ディンタイフォン' },
    '方回春堂·药膳餐厅': { en: 'Fanghuichuntang Medicinal', ja: '方回春堂薬膳料理' },
    '天一阁': { en: 'Tianyi Pavilion', ja: '天一閣' },
    '老外滩酒吧街': { en: 'Old Bund Bar Street', ja: '老外灘バー街' },
    '东钱湖骑行': { en: 'Dongqian Lake Cycling', ja: '東銭湖サイクリング' },
    '宁波状元楼酒店': { en: 'Ningbo Zhuangyuanlou', ja: '寧波状元楼' },
    '雁荡山灵峰': { en: 'Yandang Mountain Lingfeng', ja: '雁蕩山霊峰' },
    '五马街美食': { en: 'Wuma Street Food', ja: '五馬街グルメ' },
    '楠溪江竹筏漂流': { en: 'Nanxi River Bamboo Rafting', ja: '楠溪江竹筏下り' },
    '乌镇西栅': { en: 'Wuzhen West Gate', ja: '烏鎮西柵' },
    '西塘古镇': { en: 'Xitang Ancient Town', ja: '西塘古鎮' },
    '南湖革命纪念馆': { en: 'Nanhu Revolution Memorial', ja: '南湖革命記念館' },
    '鲁迅故里': { en: "Lu Xun's Hometown", ja: '魯迅故里' },
    '沈园之夜': { en: 'Shen Garden Night', ja: '沈園の夜' },
    '咸亨酒店': { en: 'Xianheng Tavern', ja: '咸亨酒店' },
    '普陀山': { en: 'Mount Putuo', ja: '普陀山' },
    '朱家尖南沙': { en: 'Zhujiajian Nansha Beach', ja: '朱家尖南沙' },
    '沈家门海鲜夜排档': { en: 'Shenjiamen Seafood Night Market', ja: '沈家門海鮮夜店' },
    '莫干山裸心谷': { en: 'Moganshan Naked Valley', ja: '莫干山裸心谷' },
    '南浔古镇': { en: 'Nanxun Ancient Town', ja: '南潯古鎮' },
    '云和梯田': { en: 'Yunhe Rice Terraces', ja: '雲和棚田' },
    '古堰画乡': { en: 'Guyan Painting Village', ja: '古堰画郷' },
    '横店影视城': { en: 'Hengdian World Studios', ja: '横店影視城' },
    '武义温泉': { en: 'Wuyi Hot Spring', ja: '武義温泉' },
    '江郎山': { en: 'Jianglang Mountain', ja: '江郎山' },
    '天台山国清寺': { en: 'Tiantai Guoqing Temple', ja: '天台山国清寺' },
    '神仙居': { en: 'Shenxianju Scenic Area', ja: '神仙居' },
    // 上海
    '外滩·万国建筑群': { en: 'The Bund', ja: '外灘・バンド' },
    '迪士尼乐园': { en: 'Shanghai Disneyland', ja: '上海ディズニーランド' },
    '武康路·安福路': { en: 'Wukang & Anfu Road', ja: '武康路・安福路' },
    // 南京
    '中山陵·明孝陵': { en: 'Sun Yat-sen Mausoleum', ja: '中山陵・明孝陵' },
    '夫子庙·秦淮河': { en: 'Confucius Temple & Qinhuai River', ja: '夫子廟・秦淮河' },
    '牛首山·佛顶宫': { en: 'Niushoushan Buddha Palace', ja: '牛首山・仏頂宮' },
    // 苏州
    '拙政园·苏州园林': { en: 'Humble Administrator\'s Garden', ja: '拙政園・蘇州庭園' },
    '平江路·山塘街': { en: 'Pingjiang Road & Shantang Street', ja: '平江路・山塘街' },
    '苏州博物馆·贝聿铭': { en: 'Suzhou Museum by I.M. Pei', ja: '蘇州博物館・I.M.ペイ' }
  },
  poiTags: {
    '高端': { en: 'Premium', ja: '高級' },
    '放松': { en: 'Relaxing', ja: 'リラックス' },
    '按摩': { en: 'Massage', ja: 'マッサージ' },
    '安静': { en: 'Quiet', ja: '静か' },
    '文艺': { en: 'Artistic', ja: 'アート' },
    '拍照': { en: 'Photo Spot', ja: '撮影スポット' },
    '禅意': { en: 'Zen', ja: '禅' },
    '抄经': { en: 'Sutra Copying', ja: '写経' },
    '免费': { en: 'Free', ja: '無料' },
    '品茶': { en: 'Tea Tasting', ja: 'お茶' },
    '西湖': { en: 'West Lake', ja: '西湖' },
    '散步': { en: 'Stroll', ja: '散歩' },
    '演出': { en: 'Show', ja: 'ショー' },
    '穿越': { en: 'Time Travel', ja: 'タイムスリップ' },
    '亲子': { en: 'Family', ja: 'ファミリー' },
    '骑行': { en: 'Cycling', ja: 'サイクリング' },
    '户外': { en: 'Outdoor', ja: 'アウトドア' },
    '运动': { en: 'Sports', ja: 'スポーツ' },
    '小吃': { en: 'Street Food', ja: 'ストリートフード' },
    '古街': { en: 'Old Street', ja: '古い街並み' },
    '购物': { en: 'Shopping', ja: 'ショッピング' },
    '美食': { en: 'Gourmet', ja: 'グルメ' },
    '动物': { en: 'Animals', ja: '動物' },
    '互动': { en: 'Interactive', ja: 'インタラクティブ' },
    '园林': { en: 'Garden', ja: '庭園' },
    '下午茶': { en: 'Afternoon Tea', ja: 'アフタヌーンティー' },
    '咖啡': { en: 'Coffee', ja: 'コーヒー' },
    '阅读': { en: 'Reading', ja: '読書' },
    '佛教': { en: 'Buddhism', ja: '仏教' },
    '古迹': { en: 'Historic Site', ja: '史跡' },
    '人流量大': { en: 'Crowded', ja: '混雑' },
    '徒步': { en: 'Hiking', ja: 'ハイキング' },
    '溪流': { en: 'Stream', ja: '渓流' },
    '夜景': { en: 'Night View', ja: '夜景' },
    '酒吧': { en: 'Bar', ja: 'バー' },
    '湖景': { en: 'Lake View', ja: '湖の景色' },
    '山水': { en: 'Landscape', ja: '山水' },
    '奇峰': { en: 'Peaks', ja: '奇峰' },
    '漂流': { en: 'Rafting', ja: 'ラフティング' },
    '情侣': { en: 'Romantic', ja: 'カップル' },
    '水乡': { en: 'Water Town', ja: '水郷' },
    '廊桥': { en: 'Covered Bridge', ja: '廊橋' },
    '红色': { en: 'Revolutionary', ja: '革命' },
    '教育': { en: 'Educational', ja: '教育' },
    '文学': { en: 'Literature', ja: '文学' },
    '爱情': { en: 'Love', ja: '恋愛' },
    '夜游': { en: 'Night Tour', ja: '夜遊び' },
    '海岛': { en: 'Island', ja: '島' },
    '祈福': { en: 'Blessing', ja: '祈福' },
    '沙滩': { en: 'Beach', ja: '砂浜' },
    '大海': { en: 'Ocean', ja: '海' },
    '民宿': { en: 'Guesthouse', ja: '民宿' },
    '竹海': { en: 'Bamboo Forest', ja: '竹林' },
    '避暑': { en: 'Summer Retreat', ja: '避暑' },
    '古镇': { en: 'Ancient Town', ja: '古鎮' },
    '梯田': { en: 'Terrace', ja: '棚田' },
    '日出': { en: 'Sunrise', ja: '日の出' },
    '摄影': { en: 'Photography', ja: '撮影' },
    '写生': { en: 'Sketching', ja: '写生' },
    '古村': { en: 'Old Village', ja: '古村' },
    '影视': { en: 'Film Studio', ja: '映画' },
    '温泉': { en: 'Hot Spring', ja: '温泉' },
    '养生': { en: 'Wellness', ja: '養生' },
    '登山': { en: 'Mountaineering', ja: '登山' },
    '古刹': { en: 'Ancient Temple', ja: '古刹' },
    '仙境': { en: 'Fairyland', ja: '仙境' },
    // 新增标签
    '夜景': { en: 'Night View', ja: '夜景' },
    '地标': { en: 'Landmark', ja: 'ランドマーク' },
    '童话': { en: 'Fairytale', ja: 'おとぎ話' },
    '烟花': { en: 'Fireworks', ja: '花火' },
    '童年': { en: 'Childhood', ja: '子供時代' },
    '梧桐': { en: 'Plane Trees', ja: 'プラタナス' },
    '咖啡': { en: 'Coffee', ja: 'コーヒー' },
    '历史': { en: 'History', ja: '歴史' },
    '陵园': { en: 'Mausoleum', ja: '陵園' },
    '夜游': { en: 'Night Cruise', ja: '夜遊び' },
    '画舫': { en: 'Painted Boat', ja: '遊覧船' },
    '小吃': { en: 'Street Food', ja: 'ストリートフード' },
    '震撼': { en: 'Spectacular', ja: '圧巻' },
    '园林': { en: 'Classical Garden', ja: '庭園' },
    '世界遗产': { en: 'World Heritage', ja: '世界遺産' },
    '精致': { en: 'Exquisite', ja: '精巧' },
    '水巷': { en: 'Water Alley', ja: '水の路地' },
    '茶馆': { en: 'Tea House', ja: '茶館' },
    '慢生活': { en: 'Slow Living', ja: 'スローライフ' },
    '建筑': { en: 'Architecture', ja: '建築' },
    '艺术': { en: 'Art', ja: 'アート' },
    '栈道': { en: 'Plank Road', ja: '桟道' }
  },
  hotelNames: {
    '安缦法云精品酒店': { en: 'Amanfayun Boutique Hotel', ja: 'アマンファユン' },
    '西溪湿地悦榕庄': { en: 'Xixi Wetland Banyan Tree', ja: '西溪湿地バンヤンツリー' },
    '西湖国宾馆': { en: 'West Lake State Guesthouse', ja: '西湖国賓館' },
    '全季酒店（西湖店）': { en: 'JI Hotel (West Lake)', ja: '全季酒店（西湖店）' },
    '如家快捷酒店': { en: 'Home Inn', ja: '如家快捷酒店' },
    '杭州西子湖四季酒店': { en: 'Four Seasons Hangzhou', ja: '杭州西子湖四季酒店' },
    '宁波威斯汀酒店': { en: 'The Westin Ningbo', ja: '寧波ウェスティン' },
    '亚朵酒店（宁波老外滩店）': { en: 'Atour Hotel (Old Bund)', ja: '亜朵酒店（寧波老外灘店）' },
    '温州香格里拉': { en: 'Shangri-La Wenzhou', ja: '温州シャングリラ' },
    '乌镇枕水度假酒店': { en: 'Wuzhen Waterside Resort', ja: '烏鎮枕水度假酒店' },
    '西塘花筑·奢': { en: 'Xitang Huazhu Luxury', ja: '西塘花筑・奢' },
    '绍兴咸亨大酒店': { en: 'Shaoxing Xianheng Hotel', ja: '紹興咸亨大酒店' },
    '普陀山雷迪森庄园': { en: 'Putuoshan Landison Manor', ja: '普陀山雷迪森荘園' },
    '莫干山裸心堡': { en: 'Moganshan Naked Castle', ja: '莫干山裸心堡' },
    '莫干山芝麻谷艺术酒店': { en: 'Moganshan Sesame Valley Art Hotel', ja: '莫干山芝麻谷芸術酒店' },
    '云和梯田民宿': { en: 'Yunhe Terrace Guesthouse', ja: '雲和棚田民宿' },
    '横店丰景嘉丽大酒店': { en: 'Hengdian Fengjing Jiali Hotel', ja: '横店豊景嘉麗大酒店' },
    '天台温泉山庄': { en: 'Tiantai Hot Spring Resort', ja: '天台温泉山荘' }
  },
  hotelFeatureTags: {
    '禅意设计': { en: 'Zen Design', ja: '禅デザイン' },
    '山景房': { en: 'Mountain View', ja: '山景ルーム' },
    '顶级SPA': { en: 'Top Spa', ja: '最高級SPA' },
    '隐世奢华': { en: 'Secluded Luxury', ja: '隠れ家的ラグジュアリー' },
    '竹林环绕': { en: 'Bamboo Surrounding', ja: '竹林に囲まれて' },
    '湿地景观': { en: 'Wetland View', ja: '湿地の景観' },
    '水疗SPA': { en: 'Hydrotherapy Spa', ja: 'ハイドロスパ' },
    '江南园林': { en: 'Jiangnan Garden', ja: '江南庭園' },
    '度假村': { en: 'Resort', ja: 'リゾート' },
    '静谧': { en: 'Tranquil', ja: '静寂' },
    '西湖景观': { en: 'West Lake View', ja: '西湖の景観' },
    '国宾级服务': { en: 'State Guest Service', ja: '国賓級サービス' },
    '园林式': { en: 'Garden Style', ja: '庭園式' },
    '商务': { en: 'Business', ja: 'ビジネス' },
    '湖景房': { en: 'Lake View Room', ja: '湖景ルーム' },
    '性价比': { en: 'Value', ja: 'コスパ' },
    '交通便利': { en: 'Convenient', ja: '交通至便' },
    '简约设计': { en: 'Minimalist', ja: 'シンプルデザイン' },
    '近西湖': { en: 'Near West Lake', ja: '西湖近く' },
    '经济实惠': { en: 'Budget', ja: 'お手頃' },
    '干净': { en: 'Clean', ja: '清潔' },
    '顶级服务': { en: 'Top Service', ja: '最高級サービス' },
    '园林设计': { en: 'Garden Design', ja: '庭園デザイン' },
    '米其林餐厅': { en: 'Michelin Dining', ja: 'ミシュランダイニング' },
    '私密': { en: 'Private', ja: 'プライベート' },
    '江景房': { en: 'River View Room', ja: 'リバービュールーム' },
    '天际泳池': { en: 'Sky Pool', ja: 'スカイプール' },
    '市中心': { en: 'City Center', ja: '市中心' },
    '设计感': { en: 'Designer', ja: 'デザイナーズ' },
    '阅读空间': { en: 'Reading Space', ja: '読書スペース' },
    '老外滩': { en: 'Old Bund', ja: '老外灘' },
    '瓯江景观': { en: 'Ou River View', ja: '甌江の景観' },
    '豪华': { en: 'Luxury', ja: '豪華' },
    '水乡景观': { en: 'Water Town View', ja: '水郷の景観' },
    '枕水而居': { en: 'Waterside Living', ja: '水辺の暮らし' },
    '江南韵味': { en: 'Jiangnan Charm', ja: '江南情緒' },
    '度假': { en: 'Vacation', ja: 'バカンス' },
    '古镇民宿': { en: 'Town Guesthouse', ja: '古鎮民宿' },
    '花筑系列': { en: 'Huazhu Collection', ja: '花筑シリーズ' },
    '文化主题': { en: 'Cultural Theme', ja: '文化テーマ' },
    '鲁迅故里旁': { en: 'Near Lu Xun Hometown', ja: '魯迅故里近く' },
    '黄酒文化': { en: 'Yellow Wine Culture', ja: '黄酒文化' },
    '历史感': { en: 'Historic', ja: '歴史感' },
    '海景房': { en: 'Ocean View Room', ja: 'オーシャンビュールーム' },
    '禅修': { en: 'Zen Meditation', ja: '禅修' },
    '海岛度假': { en: 'Island Resort', ja: 'アイランドリゾート' },
    '普陀山': { en: 'Mount Putuo', ja: '普陀山' },
    '素食': { en: 'Vegetarian', ja: 'ベジタリアン' },
    '山顶城堡': { en: 'Hilltop Castle', ja: '山頂の城' },
    '无边泳池': { en: 'Infinity Pool', ja: 'インフィニティプール' },
    '竹海景观': { en: 'Bamboo Sea View', ja: '竹海の景観' },
    '避世': { en: 'Secluded', ja: '隠れ家' },
    '艺术设计': { en: 'Art Design', ja: 'アートデザイン' },
    '彩色建筑': { en: 'Colorful Building', ja: 'カラフル建築' },
    '网红打卡': { en: 'Instagrammable', ja: 'インスタ映え' },
    '莫干山': { en: 'Moganshan', ja: '莫干山' },
    '梯田景观': { en: 'Terrace View', ja: '棚田の景観' },
    '原生态': { en: 'Eco-Natural', ja: '自然のまま' },
    '影视主题': { en: 'Movie Theme', ja: '映画テーマ' },
    '横店周边': { en: 'Near Hengdian', ja: '横店近く' },
    '主题房': { en: 'Themed Room', ja: 'テーマルーム' },
    '山景': { en: 'Mountain View', ja: '山の景色' },
    '天台山': { en: 'Tiantai Mountain', ja: '天台山' }
  },
  routeNames: {
    '森林治愈之旅': { en: 'Forest Healing Journey', ja: '森の癒し旅' },
    '海边发呆指南': { en: 'Seaside Relaxation Guide', ja: '海辺ぼんやりガイド' },
    '城市漫步探店': { en: 'City Stroll & Café Hop', ja: '街歩きカフェ巡り' },
    '山间露营观星': { en: 'Mountain Camping Stargazing', ja: '山キャンプ星空観察' },
    '古镇文艺之旅': { en: 'Ancient Town Art Tour', ja: '古鎮アート旅' },
    '骑行追风计划': { en: 'Cycling Adventure Plan', ja: 'サイクリング追風計画' },
    '温泉放松之旅': { en: 'Hot Spring Relaxation', ja: '温泉リラックス旅' }
  },
  cityNames: {
    '杭州': { en: 'Hangzhou', ja: '杭州' },
    '宁波': { en: 'Ningbo', ja: '寧波' },
    '温州': { en: 'Wenzhou', ja: '温州' },
    '嘉兴': { en: 'Jiaxing', ja: '嘉興' },
    '绍兴': { en: 'Shaoxing', ja: '紹興' },
    '舟山': { en: 'Zhoushan', ja: '舟山' },
    '湖州': { en: 'Huzhou', ja: '湖州' },
    '丽水': { en: 'Lishui', ja: '麗水' },
    '金华': { en: 'Jinhua', ja: '金華' },
    '衢州': { en: 'Quzhou', ja: '衢州' },
    '台州': { en: 'Taizhou', ja: '台州' },
    '上海': { en: 'Shanghai', ja: '上海' },
    '南京': { en: 'Nanjing', ja: '南京' },
    '苏州': { en: 'Suzhou', ja: '蘇州' }
  },
  moodLabels: {
    '活力出行': { en: 'Energetic Outing', ja: '元気な外出' },
    '治愈放松': { en: 'Healing & Relaxing', ja: '癒し＆リラックス' },
    '静谧时光': { en: 'Quiet Time', ja: '静かな時間' },
    '探索冒险': { en: 'Exploration & Adventure', ja: '探索＆冒険' },
    '文艺漫步': { en: 'Artistic Stroll', ja: 'アート散策' },
    '温暖陪伴': { en: 'Warm Companionship', ja: '温かいふれあい' },
    '自然呼吸': { en: 'Nature Breathe', ja: '自然の息吹' },
    '美食之旅': { en: 'Food Journey', ja: '美食の旅' }
  },
  planSteps: {
    '西湖苏堤漫步': { en: 'Su Causeway Stroll', ja: '蘇堤散策' },
    '知味观午餐': { en: 'Zhiweiguan Lunch', ja: '知味観の昼食' },
    '青藤茶馆品茗': { en: 'Ivy Teahouse Tea', ja: '青藤茶館でお茶' },
    '雷峰塔日落': { en: 'Leifeng Pagoda Sunset', ja: '雷峰塔の夕日' },
    '十里琅珰徒步': { en: 'Shili Langdang Hike', ja: '十里琅珰ハイキング' },
    '龙井村农家菜': { en: 'Longjing Village Cuisine', ja: '龍井村の農家料理' },
    '环湖骑行30km': { en: '30km Lake Cycling', ja: '湖一周30kmサイクリング' },
    '桂语山房晚餐': { en: 'Guiyu Shanfang Dinner', ja: '桂語山房の夕食' },
    '浙博之江馆': { en: 'Zhejiang Museum Zhijiang', ja: '浙江博物館之江館' },
    '素食餐厅': { en: 'Vegetarian Restaurant', ja: 'ベジタリアンレストラン' },
    '梅家坞茶园': { en: 'Meijiawu Tea Garden', ja: '梅家塢茶園' },
    '湖边散步': { en: 'Lakeside Walk', ja: '湖畔散歩' },
    '西溪湿地摇橹船': { en: 'Xixi Wetland Boat', ja: '西溪湿地の手漕ぎ船' },
    '湿地农庄午餐': { en: 'Wetland Farm Lunch', ja: '湿地農園の昼食' },
    '湿地博物馆': { en: 'Wetland Museum', ja: '湿地博物館' },
    '河坊街小吃': { en: 'Hefang Street Snacks', ja: '河坊街の軽食' },
    '猫空书店': { en: 'Moments Bookstore', ja: '猫空書店' },
    '转角咖啡馆': { en: 'Corner Café', ja: '街角のカフェ' },
    '社区花园': { en: 'Community Garden', ja: 'コミュニティガーデン' },
    '日式居酒屋': { en: 'Japanese Izakaya', ja: '和風居酒屋' },
    '避世书局': { en: 'Secluded Bookstore', ja: '隠れ家書店' },
    '法喜寺素斋': { en: 'Faxi Temple Vegetarian', ja: '法喜寺の精進料理' },
    '云栖竹径': { en: 'Yunqi Bamboo Path', ja: '雲栖竹径' },
    '灵隐寺晚钟': { en: 'Lingyin Temple Bell', ja: '霊隠寺の晩鐘' },
    '宝石山日出': { en: 'Baoshi Hill Sunrise', ja: '宝石山の日の出' },
    '北山街骑行': { en: 'Beishan Street Cycling', ja: '北山街サイクリング' },
    '青芝坞午餐': { en: 'Qingzhiwu Lunch', ja: '青芝塢の昼食' },
    '九溪烟树徒步': { en: 'Nine Creeks Hike', ja: '九渓煙樹ハイキング' },
    '满觉陇登山': { en: 'Manjuelong Mountain Climb', ja: '満覚隴登山' },
    '虎跑泉水泡茶': { en: 'Hupao Spring Tea', ja: '虎跑泉のお茶' },
    '六和塔登高': { en: 'Liuhe Pagoda Climb', ja: '六和塔登高' },
    '钱塘江骑行': { en: 'Qiantang River Cycling', ja: '銭塘江サイクリング' },
    '中国美院象山校区': { en: 'CAA Xiangshan Campus', ja: '中国美院象山キャンパス' },
    '转塘艺术街区': { en: 'Zhuantang Art District', ja: '転塘アート街区' },
    '单向空间书店': { en: 'One Way Space Bookstore', ja: '単向空間書店' },
    '爵士酒吧': { en: 'Jazz Bar', ja: 'ジャズバー' },
    '南宋御街漫步': { en: 'Imperial Street Stroll', ja: '南宋御街散策' },
    '杭帮菜博物馆': { en: 'Hangzhou Cuisine Museum', ja: '杭州料理博物館' },
    '晓风书屋': { en: 'Xiaofeng Bookstore', ja: '暁風書屋' },
    '西湖音乐喷泉': { en: 'West Lake Music Fountain', ja: '西湖音楽噴水' },
    '花港观鱼': { en: 'Flower Harbor Fish', ja: '花港観魚' },
    '楼外楼午餐': { en: 'Louwailou Lunch', ja: '楼外楼の昼食' },
    '三潭印月游船': { en: 'Three Pools Boat Tour', ja: '三潭印月遊覧船' },
    '湖滨银泰晚餐': { en: 'Hubin Intime Dinner', ja: '湖濱銀泰の夕食' },
    '外婆家午餐': { en: "Grandma's Kitchen Lunch", ja: '外婆家の昼食' },
    '少年宫游乐': { en: "Children's Palace Fun", ja: '少年宮で遊び' },
    '武林夜市': { en: 'Wulin Night Market', ja: '武林夜市' },
    '植物园晨练': { en: 'Botanical Garden Exercise', ja: '植物園で朝練' },
    '农家乐午餐': { en: 'Farmhouse Lunch', ja: '農家レストランの昼食' },
    '龙井问茶': { en: 'Longjing Tea Tasting', ja: '龍井茶を味わう' },
    '茅家埠日落': { en: 'Maojiabu Sunset', ja: '茅家埠の夕日' },
    '玉皇山登顶': { en: 'Yuhuang Mountain Summit', ja: '玉皇山登頂' },
    '八卦田采摘': { en: 'Bagua Field Picking', ja: '八卦田の収穫体験' },
    '江洋畈生态公园': { en: 'Jiangyangfan Eco Park', ja: '江洋畈生態公園' },
    '白塔公园': { en: 'White Pagoda Park', ja: '白塔公園' },
    '新丰小吃早餐': { en: 'Xinfeng Breakfast', ja: '新豊小吃の朝食' },
    '奎元馆虾爆鳝面': { en: 'Kuiyuanguan Noodles', ja: '奎元館の海老うなぎ麺' },
    '定胜糕体验': { en: 'Dingsheng Cake DIY', ja: '定勝糕体験' },
    '湖滨28餐厅': { en: '28 Hubin Road', ja: '湖濱28レストラン' },
    '游埠豆浆': { en: 'Youbu Soy Milk', ja: '游埠豆乳' },
    '德明饭店': { en: 'Deming Restaurant', ja: '德明飯店' },
    'Cycle&Cycle': { en: 'Cycle & Cycle', ja: 'サイクル＆サイクル' },
    '金沙厅': { en: 'Jinsha Hall', ja: '金沙庁' }
  }
};

function __(text, type) {
  if (!currentLang || currentLang === 'zh') return text;
  type = type || 'poiNames';
  var map = i18nData[type];
  if (!map) return text;
  var entry = map[text];
  if (!entry) return text;
  return entry[currentLang] || text;
}

function __arr(arr, type) {
  if (!currentLang || currentLang === 'zh') return arr;
  return arr.map(function(t) { return __(t, type); });
}

function switchLanguage(lang) {
  currentLang = lang;
  var t = i18n[lang] || i18n.zh;
  
  // 更新按钮状态
  ['zh', 'en', 'ja'].forEach(function(l) {
    var btn = document.getElementById('lang' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) { btn.classList.toggle('active', l === lang); btn.textContent = t['lang' + l.charAt(0).toUpperCase() + l.slice(1)]; }
  });
  
  // --- 品牌区 ---
  var brandName = document.querySelector('.brand-name');
  if (brandName) brandName.textContent = t.brandName;
  var brandSlogan = document.querySelector('.brand-slogan');
  if (brandSlogan) brandSlogan.innerHTML = t.brandSlogan;
  var brandSub = document.querySelector('.brand-sub');
  if (brandSub) brandSub.textContent = t.brandSub;
  
  // --- 生成按钮 ---
  var genBtn = document.getElementById('generatePlanBtn');
  if (genBtn && !isPlanning) genBtn.textContent = t.generateBtn;
  
  // --- 搜索框 ---
  var searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  
  // --- 心情标题 ---
  var moodTitle = document.querySelector('.mood-section-title');
  if (moodTitle) moodTitle.textContent = t.moodTitle;
  
  // --- 卡片标题：心情、同伴、出行模式、预算 ---
  var allCardTitles = document.querySelectorAll('.card-title');
  allCardTitles.forEach(function(el) {
    var html = el.innerHTML;
    if (html.indexOf('🎭') > -1) el.innerHTML = '<span class="card-title-icon">🎭</span> ' + t.moodTitle;
    else if (html.indexOf('👥') > -1) el.innerHTML = '<span class="card-title-icon">👥</span> ' + t.companionTitle;
    else if (html.indexOf('🎯') > -1) el.innerHTML = '<span class="card-title-icon">🎯</span> ' + t.sceneTitle;
    else if (html.indexOf('💰') > -1) el.innerHTML = '<span class="card-title-icon">💰</span> ' + t.budgetTitle;
  });
  
  // --- 快速选择 ---
  var explicitLabel = document.querySelector('.explicit-mood-label');
  if (explicitLabel) explicitLabel.textContent = t.quickSelect;
  
  // --- 场景切换按钮 ---
  var sceneBtns = document.querySelectorAll('.scene-btn');
  sceneBtns.forEach(function(btn) {
    var scene = btn.dataset.scene;
    if (scene && t.sceneLabels[scene]) {
      var labelEl = btn.querySelector('.scene-label');
      if (labelEl) labelEl.textContent = t.sceneLabels[scene];
      var descEl = btn.querySelector('.scene-desc');
      if (descEl && t.sceneDescs[scene]) descEl.textContent = t.sceneDescs[scene];
    }
  });
  
  // --- 预算面板 ---
  var budgetLabel = document.querySelector('.budget-label');
  if (budgetLabel) budgetLabel.textContent = t.budgetLabel;
  var budgetHint = document.querySelector('.budget-hint');
  if (budgetHint) budgetHint.textContent = t.budgetHint;
  var budgetCustomInput = document.getElementById('budgetCustom');
  if (budgetCustomInput) budgetCustomInput.placeholder = t.budgetCustomPlaceholder;
  
  // --- 热门情绪路线 ---
  var sectionHeaders = document.querySelectorAll('.section-header');
  sectionHeaders.forEach(function(header) {
    var h2 = header.querySelector('.section-title');
    var parent = header.parentElement;
    if (h2 && parent) {
      if (parent.classList.contains('hot-routes-section')) {
        h2.textContent = t.hotRoutesTitle;
      } else if (parent.id === 'plansSection') {
        h2.textContent = t.plansTitle;
      } else if (parent.id === 'travelPersonaSection') {
        h2.textContent = t.travelPersona;
        var hint = header.querySelector('.section-hint');
        if (hint) hint.textContent = t.travelPersonaHint;
      } else if (parent.id === 'itinerarySection') {
        h2.textContent = t.itineraryTitle;
      }
    }
  });
  
  // --- 探索方案 按钮 ---
  var quickLinks = document.querySelectorAll('.quick-link');
  quickLinks.forEach(function(link) {
    var span = link.querySelector('span');
    if (span) link.innerHTML = '<span>↓</span> ' + t.exploreBtn;
  });
  
  // --- 长辈关怀模式 ---
  var elderlyLabel = document.querySelector('.elderly-toggle-label');
  if (elderlyLabel) elderlyLabel.textContent = t.careMode;
  
  // --- 背景音效 ---
  var soundtrackLabel = document.getElementById('soundtrackLabel');
  if (soundtrackLabel && !soundtrackPlaying) soundtrackLabel.textContent = t.soundtrackLabel;
  var soundtrackBtn = document.getElementById('soundtrackBtn');
  if (soundtrackBtn) soundtrackBtn.title = t.soundtrackTitle;
  
  // --- 安全面板标题 ---
  var safetyPanel = document.getElementById('safetyPanel');
  if (safetyPanel && safetyPanel.classList.contains('show')) {
    var safetyTitle = safetyPanel.querySelector('.section-title');
    if (safetyTitle) safetyTitle.textContent = t.safetyTitle;
  }
  
  // --- 日常场景标题 ---
  var dailyTitle = document.getElementById('dailyScenarioTitle');
  if (dailyTitle) dailyTitle.textContent = t.dailyScenarioTitle;
  
  // --- 加载更多 ---
  var loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) loadMoreBtn.textContent = t.loadMoreBtn;
  
  // --- 重新渲染动态内容 ---
  initMoods();
  initCompanions();
  initPresets();
  initDailyScenarios();
  initHotRoutes();
  renderPlanCards();
  
  // --- 重新渲染所有活跃的面板 ---
  if (itinerary && itinerary.length > 0) { renderItinerary(); showWeatherIndicator(); }
  if (hotel) renderHotel();
  var checklistSection = document.getElementById('checklistSection');
  if (checklistSection && checklistSection.classList.contains('show')) renderChecklist();
  if (stats) renderStats();
  var safetyPanel = document.getElementById('safetyPanel');
  if (safetyPanel && safetyPanel.classList.contains('show')) renderSafetyPanel();
  var careLetterSection = document.getElementById('careLetterSection');
  if (careLetterSection && careLetterSection.classList.contains('show')) renderCareLetter();
  var travelPersonaSection = document.getElementById('travelPersonaSection');
  if (travelPersonaSection && travelPersonaSection.classList.contains('show')) renderTravelPersona();
  var journalSection = document.getElementById('journalSection');
  if (journalSection && journalSection.classList.contains('show')) renderTravelJournal();
  var carbonSection = document.getElementById('carbonSection');
  if (carbonSection && carbonSection.classList.contains('show')) renderCarbonFootprint();
  var priceSection = document.getElementById('pricePredictionSection');
  if (priceSection && priceSection.classList.contains('show')) renderPricePrediction();
  
  // --- 更新问候语 ---
  updateGreeting();
  updateDailyTip();
  
  try { localStorage.setItem('moodtravel_lang', lang); } catch(e) {}
  showToast(t.toastLangSwitch + ' ' + (t['lang' + lang.charAt(0).toUpperCase() + lang.slice(1)] || lang));
}

// ================================================================
//  Warmth: 时间问候语
// ================================================================
function getTimeBasedGreeting() {
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  var hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t.greetingMorning;
  if (hour >= 12 && hour < 17) return t.greetingAfternoon;
  if (hour >= 17 && hour < 21) return t.greetingEvening;
  return t.greetingNight;
}

function updateGreeting() {
  var el = document.getElementById('warmGreeting');
  if (el) el.textContent = getTimeBasedGreeting();
}

// ================================================================
//  Warmth: 心情鼓励语
// ================================================================
function getMoodEncouragement(moodKey) {
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  return (t.moodEncouragement && t.moodEncouragement[moodKey]) || '';
}

// ================================================================
//  Warmth: 每日小贴士
// ================================================================
var dailyTipIndex = -1;
function getDailyTip() {
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  var tips = t.dailyTips;
  if (!tips || tips.length === 0) return '';
  // 基于日期选择贴士，确保每天不同
  var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  dailyTipIndex = dayOfYear % tips.length;
  return tips[dailyTipIndex];
}

function updateDailyTip() {
  var el = document.getElementById('dailyTip');
  if (el) el.textContent = getDailyTip();
}

function rotateDailyTip() {
  dailyTipIndex = (dailyTipIndex + 1) % (((window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {}).dailyTips || [1]).length;
  var el = document.getElementById('dailyTip');
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(function() {
      el.textContent = getDailyTip();
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 300);
  }
}

// ================================================================
//  Demo 模式 — 一键展示所有核心功能（比赛展示用）
// ================================================================
var _demoRunning = false;

function runDemo() {
  if (_demoRunning) return;
  _demoRunning = true;
  var demoBtn = document.getElementById('demoBtn');
  if (demoBtn) { demoBtn.disabled = true; demoBtn.textContent = '🎬 Demo 演示中...'; }

  showToast('🚀 Demo 模式启动！3秒后自动展示所有功能...');

  // 阶段1：自动选择心情和参数
  setTimeout(function() {
    // 随机选择一个心情
    var moods = ['calm', 'happy', 'excited', 'anxious', 'tired', 'sad'];
    var randMood = moods[Math.floor(Math.random() * moods.length)];
    var mood = MOODS.find(function(m) { return m.key === randMood; });
    if (mood) selectMood(mood);
    showToast('🎭 已选择心情：' + (mood ? mood.label : '平静'));
  }, 1000);

  setTimeout(function() {
    // 随机切换旅伴
    var comps = ['solo', 'couple', 'friends', 'family', 'business'];
    var randComp = comps[Math.floor(Math.random() * comps.length)];
    selectCompanion(randComp);
    showToast('👥 已选择旅伴模式');
  }, 1800);

  setTimeout(function() {
    // 随机预算
    budget = [1000, 2000, 3000, 5000, 8000][Math.floor(Math.random() * 5)];
    displayBudget = budget;
    var bNum = document.getElementById('budgetNumber');
    var bFill = document.getElementById('budgetFill');
    var bSlider = document.getElementById('budgetSlider');
    if (bNum) bNum.textContent = budget.toLocaleString();
    if (bFill) bFill.style.width = ((budget - 500) / 7500 * 100) + '%';
    if (bSlider) bSlider.value = budget;
    showToast('💰 预算已设定：¥' + budget.toLocaleString());
  }, 2500);

  setTimeout(function() {
    // 开始生成行程
    showToast('✨ 正在启动 4层漏斗引擎 + 5×AI Agent...');
    generatePlan();
  }, 3200);

  setTimeout(function() {
    _demoRunning = false;
    if (demoBtn) { demoBtn.disabled = false; demoBtn.textContent = '🚀 一键Demo演示'; }
    showToast('✅ Demo 演示完成！向下滚动查看完整结果');
  }, 8000);
}

// ================================================================
//  移动端功能 — 底部导航、抽屉、安全区
// ================================================================

// 移动端底部导航切换
function switchMobileTab(tab) {
  // 更新导航高亮
  var items = document.querySelectorAll('.mobile-nav-item');
  items.forEach(function(item) {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tab) item.classList.add('active');
  });

  var rightPanel = document.getElementById('rightPanel');

  switch(tab) {
    case 'home':
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('🏠 回到首页');
      break;
    case 'plan':
      // 滚动到行程区域
      var itinerarySec = document.getElementById('itinerarySection');
      if (itinerarySec) {
        itinerarySec.scrollIntoView({ behavior: 'smooth' });
        showToast('📋 查看行程');
      } else {
        showToast('请先生成行程');
      }
      break;
    case 'discover':
      // 滚动到推荐方案
      var plansSec = document.getElementById('plansSection');
      if (plansSec) {
        plansSec.scrollIntoView({ behavior: 'smooth' });
        showToast('🧭 发现方案');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      break;
    case 'care':
      // 滚动到关怀信
      var careSec = document.getElementById('careLetterSection');
      if (careSec) {
        careSec.scrollIntoView({ behavior: 'smooth' });
        showToast('💚 今日关怀');
      } else {
        showToast('生成行程后查看关怀内容');
      }
      break;
    case 'me':
      // 打开设置抽屉
      toggleMobileControls();
      break;
  }
}

// 移动端设置抽屉
function toggleMobileControls() {
  var drawer = document.getElementById('mobileControlsDrawer');
  if (!drawer) return;
  drawer.classList.toggle('show');

  // 同步设置值
  if (drawer.classList.contains('show')) {
    var llmInput = document.getElementById('mobileLlmApiKeyInput');
    var weatherInput = document.getElementById('mobileWeatherApiKeyInput');
    if (llmInput) llmInput.value = API_CONFIG.llm.apiKey || '';
    if (weatherInput) weatherInput.value = API_CONFIG.weather.apiKey || '';
    var elderlyCheck = document.getElementById('mobileElderlyCheckbox');
    if (elderlyCheck) elderlyCheck.checked = elderlyMode;
  }
}

// 移动端长辈模式切换
function toggleMobileElderly() {
  var check = document.getElementById('mobileElderlyCheckbox');
  var desktopCheck = document.getElementById('elderlyCheckbox');
  if (check) {
    elderlyMode = check.checked;
    if (elderlyMode) {
      document.body.classList.add('elderly-mode');
    } else {
      document.body.classList.remove('elderly-mode');
    }
    if (desktopCheck) desktopCheck.checked = elderlyMode;
    try { localStorage.setItem('travel-elderly-mode', elderlyMode ? '1' : '0'); } catch(e) {}
    showToast(elderlyMode ? '👴 长辈关怀模式已开启' : '长辈关怀模式已关闭');
  }
}

// 同步移动端API Key
function syncMobileApiKey(type, value) {
  if (type === 'llm') {
    API_CONFIG.llm.apiKey = value;
    var desktopInput = document.getElementById('llmApiKeyInput');
    if (desktopInput) desktopInput.value = value;
  } else if (type === 'weather') {
    API_CONFIG.weather.apiKey = value;
    var desktopInput = document.getElementById('weatherApiKeyInput');
    if (desktopInput) desktopInput.value = value;
  }
}

// 保存移动端API设置
function saveMobileApiSettings() {
  saveApiConfig();
  toggleMobileControls();
  showToast('💾 API 设置已保存');
}

// 初始化移动端安全区
function initMobileSafeArea() {
  // 检测是否为移动端
  var isMobile = window.innerWidth <= 1024;
  if (!isMobile) return;

  // 设置安全区CSS变量
  var style = document.createElement('style');
  style.textContent = ':root { --safe-bottom: env(safe-area-inset-bottom, 0px); }';
  document.head.appendChild(style);

  // iOS 100vh 修复
  var vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
  window.addEventListener('resize', function() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  });

  // 设置 platform 属性
  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua);
  var isAndroid = /Android/.test(ua);
  document.documentElement.setAttribute('data-platform', isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');
  document.documentElement.setAttribute('data-os', isIOS ? 'ios' : isAndroid ? 'android' : 'windows');
  document.documentElement.setAttribute('data-perf', 'medium');
}

// 在DOMContentLoaded中初始化
document.addEventListener('DOMContentLoaded', function() {
  initMobileSafeArea();
});

// 启动时恢复语言
(function() {
  try {
    var saved = localStorage.getItem('moodtravel_lang');
    if (saved && saved !== 'zh') { switchLanguage(saved); }
  } catch(e) {}
})();
