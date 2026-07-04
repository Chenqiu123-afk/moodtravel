
'use strict';

// ================================================================
//  API éç½® ï¿½?çå® LLM + å¤©æ°æ¥å£
// ================================================================
var API_CONFIG = {
  llm: {
    enabled: true,
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: '',
    model: 'deepseek-chat',
    maxTokens: 2048,
    temperature: 0.8
  },
  weather: {
    enabled: true,
    endpoint: 'https://devapi.qweather.com/v7/weather/now',
    apiKey: '',
    cityId: '101210101'
  }
};

// ï¿½?localStorage å è½½ API éç½®
function loadApiConfig() {
  try {
    var saved = JSON.parse(localStorage.getItem('moodtravel_api_config') || 'null');
    if (saved) {
      if (saved.llmApiKey) API_CONFIG.llm.apiKey = saved.llmApiKey;
      if (saved.weatherApiKey) API_CONFIG.weather.apiKey = saved.weatherApiKey;
    }
  } catch(e) {}
}

// ä¿å­ API éç½®
function saveApiConfig() {
  try {
    localStorage.setItem('moodtravel_api_config', JSON.stringify({
      llmApiKey: API_CONFIG.llm.apiKey,
      weatherApiKey: API_CONFIG.weather.apiKey
    }));
  } catch(e) {}
}

// çå® LLM è°ç¨
async function callLLM(prompt, systemPrompt) {
  if (!API_CONFIG.llm.apiKey) {
    console.log('LLM: æªéç½® API Keyï¼ä½¿ç¨æ¨¡æ¿çæ');
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
          { role: 'system', content: systemPrompt || 'ä½ æ¯ä¸ä½æ¸©æçæè¡ä½å®¶ï¼æé¿ç¨ç»è»çæå­æç»æè¡ä½éª' },
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
    console.warn('LLM è°ç¨å¤±è´¥:', e.message);
    return null;
  }
}

// çå®å¤©æ° API è°ç¨
async function fetchRealWeather(cityName) {
  if (!API_CONFIG.weather.apiKey) {
    console.log('Weather: æªéï¿½?API Keyï¼ä½¿ç¨æ¨¡ææ°');
    return null;
  }
  var cityIdMap = {
    'æ­å·': '101210101', 'å®æ³¢': '101210401', 'æ¸©å·': '101210701',
    'åå´': '101210301', 'æ¹å·': '101210201', 'ç»å´': '101210501',
    'éå': '101210901', 'è¡¢å·': '101211001', 'èå±±': '101211101',
    'å°å·': '101210601', 'ä¸½æ°´': '101210801'
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
        isRainy: data.now.text.indexOf('') !== -1
      };
    }
  } catch(e) {
    console.warn('å¤©æ° API è°ç¨å¤±è´¥:', e.message);
  }
  return null;
}

// ================================================================
//  å¨å±éè¯¯å¤ç & ä¼ééçº§
// ================================================================
window.addEventListener('error', function(e) {
  console.warn('MoodTravel: å¨å±éè¯¯æè·', e.message);
  // éå³é®éè¯¯ä¸ä¸­æ­ç¨æ·ä½éª
  if (e.target && e.target.tagName === 'IMG') {
    e.target.style.display = 'none';
  }
  return false;
});

window.addEventListener('unhandledrejection', function(e) {
  console.warn('MoodTravel: æªå¤çç Promise æç»', e.reason);
  // éé»å¤çï¼ä¸ææ°ç¨æ·
});

// æ§è½çæ§
var perfMetrics = { pageLoad: 0, planGenTime: 0, interactionCount: 0 };
window.addEventListener('load', function() {
  perfMetrics.pageLoad = performance.now();
  console.log('MoodTravel: é¡µé¢å è½½å®æï¼èæ¶ ' + Math.round(perfMetrics.pageLoad) + 'ms');
});

// ================================================================
//  AI æè¡ä¼´ä¾£èå¤©ç³»ç»
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
  addChatMessage('typing', 'AI æ­£å¨æè...');
  
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
    context = 'å½åè¡ç¨' + itinerary.length + '' + (cities.length > 0 ? 'ï¼ç®çå°' + cities.join('') : '') + 'ï¼æ¯ç¹åæ¬ï¼' + pois.slice(0, 6).join('') + '\u2713';
  }
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || 'å¹³é';
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || 'ç¬èª';
  
  var systemPrompt = 'ä½ æ¯ãå°æãââMoodTravel ï¿½?AI æè¡ç®¡å®¶ï¼ä¸ä¸ªæ¸©æãåå­¦ãæåä½çæè¡ä¼´ä¾£ã\n\n' +
    'ä½ çæ§æ ¼ç¹ç¹ï¼\n' +
    '- æ¸©æäº²åï¼åèæåä¸æ ·èå¤©ï¼ä½ä¿æä¸ä¸\n' +
    '- åå­¦å¤è¯ï¼äºè§£æµæ±æ¯ä¸ä¸ªè§è½çç¾é£ãæ¯ç¹ãæå\n' +
    '- åå³ç¬ç¹ï¼ä¼æ¨èå°ä¼ä½é«åè´¨çéæ©\n' +
    '- åè§£äººæï¼è½æç¥ç¨æ·çæç»ªåéæ±\n\n' +
    'å½åç¨æ·ç¶æï¼å¿æ=' + moodLabel + 'ï¼é¢ï¿½?Â¥' + budget + 'ï¼å¤©ï¿½?' + days + 'å¤©ï¼åä¼´=' + companionType + '\n' +
    'åç­è¦æ±ï¼ç®æ´ãææ¸©åº¦ãå¸¦emojiãæ¯æ¬¡åç­ä¸è¶è¿3å¥è¯ï¼åæåèå¤©ä¸æ ·èªç¶';
  
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
  if (lower.indexOf('ç¹è²') !== -1 || lower.indexOf('äº®ç¹') !== -1) {
    return 'è¿ä¸ªè¡ç¨çç¹è²æ¯ãæç»ªé©±å¨ãââæ¯ä¸ªæ¯ç¹é½æ¯æ ¹æ®ä½ å½åçå¿æç²¾å¿æéçãä½ä½åæ¶èçæ¯ç¹éåæ¾æ¾ï¼é«é¢å¼æå¡å°éåæç§åäº«ãæ´ä¸ªè¡ç¨çèå¥ä¹æ ¹æ®ä½ çæä¼´ç±»ååäºè°æ´ï¼è®©ä½ ç©å¾èæä¸èµ¶è·¯';
  }
  if (lower.indexOf('ç¾é£') !== -1 || lower.indexOf('') !== -1) {
    return 'æµæ±ç¾é£å¤ªå¤äºï¼æ­å·çè¥¿æ¹éé±¼ãé¾äºè¾ä»ãä¸å¡èæ¯å¿åä¸ä»¶å¥ï¼å®æ³¢çæµ·é²æ°é²å®æ ï¼ç»å´çè­è±èåé»éå¼å¾ä¸è¯ï¼èå±±çæµ·é²å¤§ææ¡£æ´æ¯ä¸è½éè¿ãè¡ç¨ä¸­å·²ç»ä¸ºä½ æ¨èäºå½å°é«è¯åé¤åå¦ï¼';
  }
  if (lower.indexOf('æ³¨æ') !== -1 || lower.indexOf('åå¤') !== -1) {
    return 'å ä¸ªå°è´´å£«ï¼1ï¼æµæ±å¤å­£å¤é¨ï¼å»ºè®®å¸¦æä¼ï¼2ï¼é¨åæ¯ç¹éè¦æåé¢çº¦ï¼å¦çµéå¯ºãå®åï¼ï¿½?ï¼æ¯ä»å®/å¾®ä¿¡æ¯ä»éå¸¸æ®åï¼å ä¹ä¸éè¦ç°éï¼4ï¼ç©¿èéçéå­ï¼å¾å¤æ¯ç¹éè¦æ­¥è¡ãåºååè®°å¾æ¥çè¡åæ¸å';
  }
  if (lower.indexOf('ä¼å') !== -1 || lower.indexOf('èå¥') !== -1) {
    return 'å¥½çï¼æå·²ç»æ ¹æ®ä½ çå¿æåæä¼´ç±»åä¼åäºè¡ç¨èå¥ãå¦æä½ è§å¾å¤ªèµ¶ï¼å¯ä»¥ç¹å»ãæ´è½»æ¾ãæé®ï¼å¦æè§å¾å¤ªæ é²ï¼å¯ä»¥ç¹å»ãæ´åå®ããæèä½ ä¹å¯ä»¥ç´æ¥åè¯æå·ä½æ³è°æ´åªä¸å¤©ï¼';
  }
  return 'è°¢è°¢ä½ çé®é¢ï¼ä½ä¸ºAIæè¡ä¼´ä¾£ï¼æå¯ä»¥å¸®ä½ äºè§£è¡ç¨ç»èãæ¨èå½å°ç¾é£ãæä¾æ³¨æäºé¡¹ï¼æèå¸®ä½ ä¼åè¡ç¨èå¥ãä½ å·ä½æ³äºè§£ä»ä¹ï¼';
}

// ================================================================
//  AI å¢å¼ºè¡ç¨çæ ï¿½?ä½¿ç¨ LLM æºè½ç¼æ
// ================================================================
var aiItineraryEnabled = true;

async function generateAiItinerary() {
  if (!API_CONFIG.llm.apiKey || !aiItineraryEnabled) return null;
  
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || 'å¹³é';
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || 'ç¬èª';
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  var maxPerDay = ct ? ct.maxPoi : 4;
  var modeLabel = travelMode === 'business' ? 'åå¡åºè¡' : 'ä¼é²ææ¸¸';
  
  var poiSummary = POIS.slice(0, 40).map(function(p) {
    return p.name + '' + p.city + '' + (p.tags||[]).join('/') + 'ï¼Œ' + (p.ticketPrice||0) + '\u2713';
  }).join('');
  
  var prompt = 'ä½ æ¯æè¡è§åä¸å®¶ãè¯·æ ¹æ®ä»¥ä¸æ¡ä»¶ï¼ä¸ºç¨æ·çæä¸' + days + 'å¤©çæµæ±æè¡è¡ç¨ã\n\n' +
    'ç¨æ·ç¶æï¼å¿æ=' + moodLabel + 'ï¼æï¿½?' + companionLabel + 'ï¼æ¨¡ï¿½?' + modeLabel + 'ï¼é¢ï¿½?Â¥' + budget + '\n' +
    'çº¦æï¼æ¯å¤©æ' + maxPerDay + 'ä¸ªæ¯ç¹ï¼å¿é¡»åå«åé¤ï¼æ»è±è´¹ä¸è¶è¿é¢ç®\n' +
    'å¯éæ¯ç¹ï¼' + poiSummary + '\n\n' +
    'è¯·è¿åä¸¥æ ¼JSONæ ¼å¼ï¼ä¸è¦markdownï¼ä¸è¦è§£éï¼ï¼\n' +
    '{"days": [{"day": 1, "pois": ["æ¯ç¹ï¿½?", "æ¯ç¹ï¿½?", "æ¯ç¹ï¿½?"], "lunch": "é¤å"}]}\n' +
    'æ¯ç¹åå¿é¡»ä»å¯éæ¯ç¹ä¸­éåï¼æ¯å¤©è³ï¿½?ä¸ªæ¯ç¹ï¼è·¨åå¸æ¶æ³¨æå°çåçæ§';
  
  try {
    var resp = await callLLM(prompt, 'ä½ æ¯ä¸ä¸çæµæ±æè¡è§åå¸ï¼æé¿æ ¹æ®ç¨æ·å¿æååå¥½ç¼æè¡ç¨ãåªè¿åJSONï¼ä¸è¦å¶ä»åå®¹');
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
            items.push({ type:'restaurant', time:fmtTime(hour), name:lunchPoi.name, estimatedCost:lunchPoi.ticketPrice || 80, estimatedDuration:lunchPoi.estimatedDuration || 60, reason:'AIæ¨èåé¤', reasonTags:['AIæ¨è','é«è¯'], poiId:lunchPoi.id });
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
        reason: 'AI æ ¹æ®ä½ çå¿æååå¥½æºè½æ¨',
        reasonTags: ['AIæ¨è'].concat((poi.tags||[]).slice(0, 2)),
        poiId: poi.id, mapX: poi.mapX, mapY: poi.mapY,
        weatherSensitivity: poi.weatherSensitivity,
        city: poi.city
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
      { name:'æºç¨', icon:'ð¨', price:Math.round(best.priceRangeLow * 1.0), features:'å«æ©', isBest:false },
      { name:'ç¾å¢', icon:'ð', price:Math.round(best.priceRangeLow * 0.95), features:'å«æ©ä¸å¯åæ¶', isBest:true },
      { name:'é£çª', icon:'ð·', price:Math.round(best.priceRangeLow * 0.92), features:'åè´¹åçº§æ¿å', isBest:false }
    ];
    var bestPlat = platforms.find(function(p) { return p.isBest; });
    hotelData = {
      name: best.name, rating: best.rating, price: best.priceRangeLow,
      bestPrice: bestPlat.price, bestPlatform: bestPlat.name, bestReason: bestPlat.features,
      savedAmount: Math.max.apply(null, platforms.map(function(p) { return p.price; })) - bestPlat.price,
      platforms: platforms, reason: 'AI æ ¹æ®ä½ çé¢ç®ååå¥½æºè½æ¨'
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
//  AI è¡ç¨ä¼å ï¿½?æºè½è°æ´æé®
// ================================================================
async function aiRefineItinerary(type) {
  if (!itinerary || itinerary.length === 0) {
    showToast('è¯·åçæè¡ç¨');
    return;
  }
  
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label || 'å¹³é';
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || 'ç¬èª';
  
  var itineraryText = '';
  itinerary.forEach(function(day) {
    itineraryText += 'Day ' + day.day + ': ';
    day.items.forEach(function(item) {
      itineraryText += item.name + (item.type === 'restaurant' ? '(ï¿½?' : '') + ' ï¿½?';
    });
    itineraryText += '\n';
  });
  
  var refineTypeMap = {
    relax: 'è®©è¡ç¨æ´è½»æ¾æ é²ï¼åå°ä½åæ¶èå¤§çæ¯ç¹ï¼å¢å ä¼æ¯æ¶é´åè½»æ¾æ´»',
    enrich: 'è®©è¡ç¨æ´åå®ä¸°å¯ï¼å¢å ç¹è²æ¯ç¹åä½éªæ´»å¨',
    romantic: 'å¢å æµªæ¼«åç´ ï¼éåæä¾£çº¦ä¼',
    foodie: 'å¢å ç¾é£ä½éªï¼æ¿æ¢ä¸ºæ´å¼å¾å°è¯çé¤',
    photo: 'å¢å æç§æå¡ç¹ï¼ä¼åéæ©åºççé«çæ¯',
    budget: 'å¨ä¿æä½éªçåæä¸ï¼ä¼åé¢ç®ï¼æ¿æ¢ä¸ºæ´ç»æµçéæ©'
  };
  
  var instruction = refineTypeMap[type] || 'optimize itinerary';
  
  var prompt = '???????????????\n' + itineraryText + '\n????????????????????????????????????' + instruction + '\n????????????' + moodLabel + '????????????' + companionLabel + '???\n???????????????????????????JSON????????????{"days": [{"day": 1, "pois": ["??????1", "??????2"], "lunch": "??????"}]}???????????????JSON";
  
  showToast('AI is optimizing itinerary...');
  
  var resp = await callLLM(prompt, 'ä½ æ¯ä¸ä¸çæè¡è§åå¸ï¼æé¿æ ¹æ®ç¨æ·éæ±ä¼åè¡ç¨ãåªè¿åJSONæ ¼å¼');
  
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
        renderFood();
        renderShopping();
        renderMap();
        renderStats();
  showToast('AI is optimizing itinerary...');
        document.getElementById('itinerarySection').scrollIntoView({ behavior: 'smooth' });
        return;
      }
    } catch(e) {
      console.warn('AI refine parsing failed:', e.message);
    }
  }
  
  showToast('AI is optimizing itinerary...');
  var result = doGenerate();
  itinerary = result.itinerary;
  hotel = result.hotel;
  stats = result.stats;
  renderItinerary();
  renderHotel();
  renderFood();
  renderShopping();
  renderMap();
  renderStats();
}

// ================================================================
//  PWA Service Worker æ³¨å (first occurrence)
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log('SW registered:', reg.scope);
    }).catch(function(err) {
      console.log('SW registration failed:', err);
    });
  });
}

// ================================================================
//  æ°æ®'
//  æ¥æºï¼web-demo.vue + plan.vue + travel.js + travelData.js
// ================================================================

var MOODS = [
  { key: 'calm', label: 'å¹³é', emoji: 'ð', color: '#8BA88C' },
  { key: 'happy', label: 'å¼', emoji: 'ð', color: '#E8A85A' },
  { key: 'sad', label: 'æ²»æ', emoji: 'ð', color: '#E8945A' },
  { key: 'anxious', label: 'æ¾æ¾', emoji: 'ð¿', color: '#6B8FA3' },
  { key: 'excited', label: 'æ¢ç´¢', emoji: 'ð¥', color: '#FF6B6B' },
  { key: 'tired', label: 'æµæ', emoji: 'ð´', color: '#B5A3C4' },
  { key: 'insomnia', label: 'æ·±å¤', emoji: 'ð', color: '#6B7BA3' }
];

var MOOD_THEME_MAP = {
  calm: {
    primary: '#8BA88C', secondary: '#A3C4A3', accent: '#6B8F6B',
    bgGradient: 'linear-gradient(135deg, #0a1a0f 0%, #0d1f12 30%, #0a1510 60%, #07100a 100%)',
    cardBg: 'rgba(139,168,140,0.12)', cardBorder: 'rgba(139,168,140,0.25)',
    textColor: '#d4e8d4', highlightColor: '#8BA88C',
    animationSpeed: 'slow', particleColor: '#8BA88C',
    ambientGlow: '0 0 60px rgba(139,168,140,0.15)',
    bgPattern: 'forest', iconSet: 'nature',
    fontStyle: 'serif', label: 'å®é'
  },
  happy: {
    primary: '#FFB347', secondary: '#FFD89B', accent: '#E8945A',
    bgGradient: 'linear-gradient(135deg, #1a1208 0%, #1f180a 30%, #1a1008 60%, #150d05 100%)',
    cardBg: 'rgba(255,179,71,0.12)', cardBorder: 'rgba(255,179,71,0.25)',
    textColor: '#ffe8c8', highlightColor: '#FFB347',
    animationSpeed: 'fast', particleColor: '#FFB347',
    ambientGlow: '0 0 60px rgba(255,179,71,0.15)',
    bgPattern: 'sunburst', iconSet: 'celebration',
    fontStyle: 'sans-serif', label: 'å¼'
  },
  sad: {
    primary: '#7B9EC4', secondary: '#A3C4D6', accent: '#6B8FA3',
    bgGradient: 'linear-gradient(135deg, #0a0f1a 0%, #0d1320 30%, #0a0e18 60%, #070a12 100%)',
    cardBg: 'rgba(123,158,196,0.12)', cardBorder: 'rgba(123,158,196,0.25)',
    textColor: '#c8d8e8', highlightColor: '#7B9EC4',
    animationSpeed: 'slow', particleColor: '#7B9EC4',
    ambientGlow: '0 0 60px rgba(123,158,196,0.12)',
    bgPattern: 'rain', iconSet: 'gentle',
    fontStyle: 'serif', label: 'ä½è½'
  },
  anxious: {
    primary: '#B5A3C4', secondary: '#C4B5D6', accent: '#9B8AB4',
    bgGradient: 'linear-gradient(135deg, #120f1a 0%, #151220 30%, #100e18 60%, #0c0a12 100%)',
    cardBg: 'rgba(181,163,196,0.12)', cardBorder: 'rgba(181,163,196,0.25)',
    textColor: '#e0d4e8', highlightColor: '#B5A3C4',
    animationSpeed: 'medium', particleColor: '#B5A3C4',
    ambientGlow: '0 0 60px rgba(181,163,196,0.12)',
    bgPattern: 'ripple', iconSet: 'calming',
    fontStyle: 'sans-serif', label: 'ç¦è'
  },
  excited: {
    primary: '#FF6B6B', secondary: '#FF8E8E', accent: '#E85555',
    bgGradient: 'linear-gradient(135deg, #1a0808 0%, #200d0d 30%, #1a0808 60%, #150505 100%)',
    cardBg: 'rgba(255,107,107,0.12)', cardBorder: 'rgba(255,107,107,0.25)',
    textColor: '#ffd0d0', highlightColor: '#FF6B6B',
    animationSpeed: 'fast', particleColor: '#FF6B6B',
    ambientGlow: '0 0 60px rgba(255,107,107,0.15)',
    bgPattern: 'explosion', iconSet: 'energetic',
    fontStyle: 'sans-serif', label: 'å´å¥'
  },
  tired: {
    primary: '#C4A882', secondary: '#D4BCA0', accent: '#A89070',
    bgGradient: 'linear-gradient(135deg, #15100a 0%, #1a140d 30%, #121008 60%, #0d0c06 100%)',
    cardBg: 'rgba(196,168,130,0.12)', cardBorder: 'rgba(196,168,130,0.25)',
    textColor: '#e8d8c0', highlightColor: '#C4A882',
    animationSpeed: 'very-slow', particleColor: '#C4A882',
    ambientGlow: '0 0 40px rgba(196,168,130,0.1)',
    bgPattern: 'soft', iconSet: 'cozy',
    fontStyle: 'serif', label: 'ç²æ«'
  },
  insomnia: {
    primary: '#6B7BA3', secondary: '#8B9BC4', accent: '#4B5B83',
    bgGradient: 'linear-gradient(135deg, #080c18 0%, #0a0f20 30%, #080a15 60%, #050812 100%)',
    cardBg: 'rgba(107,123,163,0.12)', cardBorder: 'rgba(107,123,163,0.25)',
    textColor: '#c0c8e0', highlightColor: '#6B7BA3',
    animationSpeed: 'very-slow', particleColor: '#6B7BA3',
    ambientGlow: '0 0 30px rgba(107,123,163,0.08)',
    bgPattern: 'stars', iconSet: 'night',
    fontStyle: 'serif', label: 'å¤±ç '
  }
};

var COMPANION_TYPES = [
  { key:'solo', label:'ç¬èªæè¡', icon:'ð§', desc:'èªç±èªå¨ï¼éå¿èè¡', pacing:'fast', maxPoi:5, paceLabel:'ç¹ç§åµè' },
  { key:'couple', label:'æä¾£/ä¼´ä¾£', icon:'ð', desc:'æµªæ¼«æ°å´ï¼çèæ¶', pacing:'moderate', maxPoi:3, paceLabel:'æµªæ¼«æ¢è' },
  { key:'friends', label:'éºè/å¥½å', icon:'ð¯', desc:'ååç©ä¹ï¼ä¸è¸©é·', pacing:'fast', maxPoi:4, paceLabel:'éåæ¨¡å¼' },
  { key:'family', label:'å¸¦é¿ï¿½?äº²å­', icon:'ð¨âð©â', desc:'æ¢èå¥ï¼äº«å¤©', pacing:'slow', maxPoi:2, paceLabel:'æ¾å¼æ¨¡å¼' },
  { key:'business', label:'åå¡åäº', icon:'ð¼', desc:'é«æåºè¡ï¼çæ¶ç', pacing:'efficient', maxPoi:3, paceLabel:'æçä¼å' }
];

var DAILY_SCENARIOS = [
  { key:'walk', label:'ð¶ ä¸ç­ééæ°' },
  { key:'break', label:'ï¿½?æ¸é±¼5åé' },
  { key:'grocery', label:'ð å¸®é¿è¾ä¹°' },
  { key:'rain', label:'ð§ï¿½?é¨å¤©èº²é¨' },
  { key:'market', label:'ð¥¬ èå¸åºæ¢' },
  { key:'snack', label:'ð¢ ç¹è²å°å' },
  { key:'fresh', label:'ð¥© çé²è¶å¸' },
  { key:'shopping', label:'ðï¿½?å¨è¾¹è´­ç©' }
];

var TRAVEL_SPOTS = [
  { id:'spot-001', title:'é¿ä¸ä¹¦å±', tags:['èººå¹³','åè¡','å®é'], energyLevel:10, distance:280, scenario:'relax', description:'è¿éå¾å®éï¼éåä¸ä¸ªäººååï¼æç¦æ¼çå¨é¨å¤', elderDesc:'å®éçä¹¦åºï¼éåèäººæ¢æ¢', emoji:'ð' },
  { id:'spot-002', title:'äºç«¯è¶³ç', tags:['æ¾æ¾','åè¡','ææ©'], energyLevel:15, distance:420, scenario:'relax', description:'æç²æ«äº¤ç»ä¸ä¸çåæï¼è®©èº«ä½åäºä¸æ ·è½»ç', elderDesc:'ä¸ä¸çè¶³çææ©åº', emoji:'ð¦¶' },
  { id:'spot-006', title:'ç«ç©ºåå¡', tags:['æ²»æ','èå® ','åå¡'], energyLevel:40, distance:350, scenario:'relax', description:'ç«åªçå¼åå£°æ¯æå¥½çç½åªé³ï¼ä¸æ¯æ¿éå°±æ¯ä¸ä¸å', elderDesc:'å®éçç«åªåå¡é¦', emoji:'ð±' },
  { id:'spot-101', title:'ç¤¾åºå°å¬', tags:['æ£æ­¥','æ·å¤','æ¥å¸¸'], energyLevel:5, distance:120, scenario:'walk', description:'åºé¨å³è½¬å°±æ¯ï¼æé¿æ¤åæ è«ï¼æé¥­åæ£æ­¥çå¥½å»å¤', elderDesc:'éåèäººæ£æ­¥çå¬å­ï¼è·æ¨120', emoji:'ð³' },
  { id:'spot-102', title:'è½¬è§åå¡', tags:['åå¡','æ¸é±¼','ä¼é²'], energyLevel:8, distance:200, scenario:'break', description:'æå²åå¡å¾æ£ï¼WiFiåè´¹ï¼éåæ¸é±¼äºåé', elderDesc:'å®éçåå¡åºï¼è·ï¿½?00', emoji:'' },
  { id:'spot-103', title:'å¹¸ç¦èå¸', tags:['ä¹°è','æ¥å¸¸','æ°é²'], energyLevel:5, distance:200, scenario:'grocery', description:'æ©ä¸åè¿äºä¸æ¹æ°é²è¬èï¼è¥¿çº¢æ¿åé»çé½å¾æ°´çµ', elderDesc:'éè¿ä¾¿å®çèå¸åºï¼è·ï¿½?00', emoji:'ð¥¬', priceRange:'Â¥5-30', rating:4.3, openHours:'06:00-19:00', bestVisit:'ä¸å7:00-9:00' },
  { id:'spot-104', title:'è¡è§ä¾¿å©', tags:['æ¥å¸¸','ä¾¿å©','ä¹°è'], energyLevel:3, distance:80, scenario:'grocery', description:'24å°æ¶è¥ä¸ï¼çå¥¶é¢åé¸¡èé½æï¼æ¯èå¸åºå¹²å', elderDesc:'å°åºé¨å£çä¾¿å©åºï¼è·ï¿½?0', emoji:'ðª', priceRange:'Â¥3-50', rating:4.1, openHours:'24å°æ¶', bestVisit:'éæ¶' },
  { id:'spot-108', title:'èç¯®å­Â·çé²å¸', tags:['èå¸','æ¢åº','æ°é²','ææº'], energyLevel:8, distance:350, scenario:'market', description:'åä¸­æå¤§çåè´¸å¸åºï¼ææºè¬èåºãæ´»ç¦½åºãæµ·é²åºä¸åºä¿±å¨ï¼éä¸åå°±æ¯ä¸åºå³è§æè¡', elderDesc:'åç§é½å¨çå¤§èå¸åºï¼æµ·é²åºå¾æ°é²', emoji:'ð§º', priceRange:'Â¥10-200', rating:4.6, openHours:'05:30-18:00', bestVisit:'ä¸å6:00-8:00' },
  { id:'spot-109', title:'èå­å·é±', tags:['ç¹äº§','è°å³','æ¢åº','ç¾å¹´'], energyLevel:5, distance:280, scenario:'market', description:'å¼äºä¸ä»£äººçé±å­ï¼èªé¿é±æ²¹åè±ç£é±è¿è¿é»åï¼ä¹°ä¸ç¶åå»çèï¼å³éç«å»æå', elderDesc:'ç¾å¹´é±å­ï¼é±æ²¹åè±ç£é±å¾æ­£å®', emoji:'ð«', priceRange:'Â¥15-80', rating:4.7, openHours:'08:00-17:30', bestVisit:'ä¸å9:00-11:00' },
  { id:'spot-110', title:'åè´§å¤©å Â·å°å', tags:['å°å','ç¾é£','å¤å¸','å°é'], energyLevel:12, distance:450, scenario:'snack', description:'ä»è¡å¤´åå°è¡å°¾ï¼è±åæ¡§ãå®èç³ãçå¿å·ãå°ç¬¼åï¼æ¯ä¸å£é½æ¯æ­å·çå³é', elderDesc:'å°åä¸æ¡è¡ï¼åç±»æ­å·ç¹è²å°åé½', emoji:'ð', priceRange:'Â¥5-40', rating:4.5, openHours:'10:00-22:00', bestVisit:'ä¸å5:00-8:00' },
  { id:'spot-111', title:'æ·±å¤é£å Â·ç§ç¤', tags:['ç§ç¤','å¤å®µ','çç«'], energyLevel:15, distance:500, scenario:'snack', description:'æä¸ä¹ç¹æåºæçå¤«å¦»ç§ç¤ï¼ç­ç«ç¤çç¾èä¸²åé¸¡ç¿ï¼éä¸å°å¤éï¼æ¯æ·±å¤ææ¸©æçæ°è', elderDesc:'æ·±å¤ç§ç¤æï¼éåå¹´è½»', emoji:'ð', priceRange:'Â¥10-60', rating:4.4, openHours:'21:00-02:00', bestVisit:'æä¸10:00-12:00' },
  { id:'spot-112', title:'æ²³é©¬é²çÂ·ç²¾åè¶å¸', tags:['çé²','è¿å£','é«ç«¯','è¶å¸'], energyLevel:6, distance:300, scenario:'fresh', description:'è¿å£æ°´æãæ¾³æ´²çæãæ¥å¼åºèº«ï¼åè´¨ä¸è¾é«ç«¯é¤åï¼ä»·æ ¼å´äº²æ°å¾å¤ãæ¯æçº¿ä¸ä¸ï¿½?0åééè¾¾', elderDesc:'é«ç«¯è¶å¸ï¼è¿å£æ°´æåæµ·é²åç§ä¸°å¯', emoji:'ð¥©', priceRange:'Â¥20-500', rating:4.5, openHours:'08:00-22:00', bestVisit:'ä¸å10:00-12:00' },
  { id:'spot-113', title:'ææºååºç´é', tags:['ææº','å¥åº·','ååº','ç»¿è²'], energyLevel:6, distance:600, scenario:'fresh', description:'ç´æ¥ä»éåºååºç´ä¾çææºè¬èï¼æ©ä¸éæä¸åä¸æ¶ï¼è¿æèªäº§çåé¸¡èåèè', elderDesc:'ææºè¬èç´éåºï¼æ°é²å¥åº·', emoji:'ð¥', priceRange:'Â¥15-100', rating:4.8, openHours:'07:00-19:00', bestVisit:'ä¸å8:00-10:00' },
  { id:'spot-114', title:'è¥¿æ¹ç¹äº§Â·ä¼´æç¤¼åº', tags:['ç¹äº§','ä¼´æ','è´­ç©','ç¤¼å'], energyLevel:5, distance:350, scenario:'shopping', description:'é¾äºè¶ãä¸ç»¸ãèç²ãæ¡è±ç³ï¼ä¸ç«å¼ä¹°é½æ­å·ç¹äº§ï¼åè£ç²¾ç¾éåéç¤¼', elderDesc:'æ­å·ç¹äº§åºï¼é¾äºè¶åä¸ç»¸åè´¨', emoji:'ð', priceRange:'Â¥30-500', rating:4.3, openHours:'09:00-21:00', bestVisit:'ä¸å2:00-5:00' },
  { id:'spot-115', title:'æåéå¸Â·æä½å·¥å', tags:['æå','æä½','éå¸','æèº'], energyLevel:8, distance:420, scenario:'shopping', description:'æ¬å°è®¾è®¡å¸çæä½é¥°åãååæç»ãæå·¥ç®å·ï¼æ¯ä¸ä»¶é½æ¯ç¬ä¸æ äºçåå¸è®°å¿', elderDesc:'æåéå¸ï¼æå·¥èºåå¾æç¹', emoji:'ð¨', priceRange:'Â¥20-300', rating:4.6, openHours:'10:00-20:00', bestVisit:'ä¸å3:00-6:00' },
  { id:'spot-105', title:'é¿é¨é¿å»', tags:['ä¸é¨','èº²é¨','æ¥å¸¸'], energyLevel:2, distance:300, scenario:'rain', description:'æ²¿çæ²³è¾¹çé¿å»ä¸ç´èµ°ï¼å¨ç¨æé¡¶æ£ï¼ä¸é¨ä¹ä¸æ', elderDesc:'æ²³è¾¹æé¡¶æ£çé¿å»ï¼ä¸é¨ä¹è½æ£', emoji:'ð' },
  { id:'spot-106', title:'ç¤¾åºæ´»å¨ä¸­å¿', tags:['å®¤å','èº²é¨','æ¥å¸¸'], energyLevel:5, distance:250, scenario:'rain', description:'ææ£çå®¤åéè§å®¤ï¼ä¸é¨å¤©èäººä»¬é½å¨è¿', elderDesc:'å¯ä»¥ä¸æ£çæ¥çç¤¾åºæ´»å¨ä¸­', emoji:'ð²' },
  { id:'spot-107', title:'æ²³æ»¨æ­¥é', tags:['æ£æ­¥','æ·å¤','æ¥å¸¸'], energyLevel:10, distance:400, scenario:'walk', description:'å¹³å¦çæ­¥éï¼éåä¸ç­åééæ°ï¼çæ²³æ°´æ¢æ¢æµ', elderDesc:'å¹³å¦å¥½èµ°çæ²³è¾¹æ­¥éï¼è·æ¨400', emoji:'ð' }
];

var POIS = [
  { id:1, name:'æ¦æ¦åºSPAæ°´ç', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:680, kidsFriendly:false, elderlyFriendly:true, romanticLevel:5, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:10,anxious:8,sad:9,calm:8,excited:2,happy:5}, tags:['é«ç«¯','æ¾æ¾','ææ©'], estimatedDuration:120, mapX:15, mapY:55, city:'æ­å·' },
  { id:2, name:'ç«çå¤©ç©ºä¹åÂ·æ¦å¿µä¹¦åº', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:35, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:9,anxious:9,sad:10,calm:9,excited:3,happy:6}, tags:['å®é','æèº','æç§'], estimatedDuration:90, mapX:35, mapY:42, city:'æ­å·' },
  { id:4, name:'æ°¸ç¦å¯ºÂ·æç»ä½', category:'temple', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:45, kidsFriendly:true, elderlyFriendly:true, minAge:6, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:4, nearMedical:false, moodScores:{tired:8,anxious:10,sad:9,calm:9,excited:2,happy:5}, tags:['å®é','ç¦æ','æç»'], estimatedDuration:120, mapX:13, mapY:28, city:'æ­å·' },
  { id:5, name:'ä¸­å½è¶å¶åç©', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:3,happy:6}, tags:['åè´¹','å®é','åè¶'], estimatedDuration:90, mapX:22, mapY:38, city:'æ­å·' },
  { id:6, name:'è¥¿æ¹æ¼«æ­¥', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:6,anxious:5,sad:8,calm:8,excited:6,happy:8}, tags:['åè´¹','è¥¿æ¹','æ£æ­¥'], estimatedDuration:60, mapX:38, mapY:50, city:'æ­å·' },
  { id:7, name:'æ­å·å®åÂ·åå¤', category:'theme_park', energyLevel:4, crowdednessLevel:4, weatherSensitivity:'mixed', ticketPrice:320, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:2,anxious:2,sad:3,calm:5,excited:10,happy:9}, tags:['æ¼åº','ç©¿è¶','äº²å­'], estimatedDuration:240, mapX:18, mapY:68, city:'æ­å·' },
  { id:8, name:'èå ¤éªè¡', category:'sport', energyLevel:4, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:30, kidsFriendly:true, elderlyFriendly:false, minAge:8, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:2,anxious:4,sad:4,calm:6,excited:9,happy:9}, tags:['éªè¡','æ·å¤','è¿å¨'], estimatedDuration:120, mapX:30, mapY:46, city:'æ­å·' },
  { id:9, name:'æ²³åè¡å¤', category:'shopping', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:2, nearMedical:true, moodScores:{tired:3,anxious:2,sad:4,calm:5,excited:8,happy:9}, tags:['åè´¹','å°å','å¤è¡'], estimatedDuration:120, mapX:48, mapY:62, city:'æ­å·' },
  { id:10, name:'æ¹æ»¨é¶æ³°in77', category:'shopping', energyLevel:3, crowdednessLevel:4, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:4,anxious:3,sad:4,calm:6,excited:8,happy:9}, tags:['è´­ç©','ç¾é£','åè´¹'], estimatedDuration:150, mapX:52, mapY:52, city:'æ­å·' },
  { id:11, name:'æ­å·å¨ç©', category:'theme_park', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:20, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:4,anxious:5,sad:5,calm:7,excited:8,happy:9}, tags:['äº²å­','å¨ç©','æ·å¤'], estimatedDuration:180, mapX:20, mapY:60, city:'æ­å·' },
  { id:12, name:'æµæ±çç§æ', category:'museum', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:5,anxious:5,sad:5,calm:7,excited:8,happy:8}, tags:['åè´¹','äº²å­','äºå¨'], estimatedDuration:120, mapX:58, mapY:40, city:'æ­å·' },
  { id:15, name:'é­åºå­æä¸å', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'mixed', ticketPrice:68, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:false, restSeats:5, nearMedical:false, moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:5,happy:7}, tags:['å­æ','ä¸å','å®é'], estimatedDuration:90, mapX:25, mapY:42, city:'æ­å·' },
  { id:16, name:'Wagasè½»é£æ²æ', category:'restaurant', cuisineType:'è½»é£', signatureDish:'ð¥ çæ²¹æé¸¡èæ²', foodEmoji:'ð¥', localRating:4.2, businessHours:'08:00-21:30', peakHours:'12:00-13:30, 18:00-19:30', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:68, isDietFriendly:true, dietaryTags:['lowFat','highProtein'], avgCalories:350, queueTime:5, hasElevator:true, spicinessLevel:0, hasPrivateRoom:false, hasHotTea:false, noiseLevel:2, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:6,sad:6,calm:7,excited:5,happy:6}, estimatedDuration:60, mapX:55, mapY:48, city:'æ­å·' },
  { id:17, name:'è¸å¹´è½»Â·è¸æ±½æµ·', category:'restaurant', cuisineType:'æµ·é²', signatureDish:'ð¦ æ¸è¸æ³¢å£«é¡¿é¾', foodEmoji:'ð¦', localRating:4.5, businessHours:'11:00-14:00, 17:00-21:30', peakHours:'12:00-13:00, 18:30-19:30', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:90, isDietFriendly:true, dietaryTags:['lowFat','highProtein','lightFlavor'], avgCalories:400, queueTime:15, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:6,happy:7}, estimatedDuration:60, mapX:44, mapY:55, city:'æ­å·' },
  { id:18, name:'æ¥¼å¤æ¥¼Â·æ­å¸®è', category:'restaurant', cuisineType:'æ­å¸®', signatureDish:'ð è¥¿æ¹éé±¼', foodEmoji:'ð', localRating:4.6, businessHours:'11:00-14:00, 17:00-21:00', peakHours:'11:30-13:00, 18:00-19:30', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor', ticketPrice:120, isDietFriendly:false, dietaryTags:[], avgCalories:900, queueTime:45, hasElevator:false, spicinessLevel:1, hasPrivateRoom:true, hasHotTea:true, noiseLevel:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:3, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:4,sad:5,calm:6,excited:7,happy:8}, estimatedDuration:60, mapX:40, mapY:48, city:'æ­å·' },
  { id:19, name:'å¤å©', category:'restaurant', cuisineType:'æ­å¸®', signatureDish:'ð å¤å©çº¢ç§', foodEmoji:'ð', localRating:4.3, businessHours:'11:00-14:00, 16:30-21:00', peakHours:'12:00-13:00, 18:00-19:30', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor', ticketPrice:65, isDietFriendly:false, dietaryTags:[], avgCalories:750, queueTime:60, hasElevator:true, spicinessLevel:1, hasPrivateRoom:false, hasHotTea:true, noiseLevel:4, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:2, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:4,anxious:3,sad:4,calm:5,excited:6,happy:7}, estimatedDuration:60, mapX:50, mapY:58, city:'æ­å·' },
  { id:20, name:'æµæ±ç¾æ¯', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:8,excited:4,happy:6}, tags:['åè´¹','èºæ¯','å®é'], estimatedDuration:90, mapX:44, mapY:62, city:'æ­å·' },
  { id:21, name:'è¥¿è¥¿å¼ä¹¦', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:30, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:9,anxious:8,sad:9,calm:9,excited:3,happy:6}, tags:['å®é','åå¡','éè¯»'], estimatedDuration:90, mapX:54, mapY:44, city:'æ­å·' },
  { id:23, name:'çµé', category:'temple', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor', ticketPrice:75, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:4,anxious:4,sad:5,calm:6,excited:5,happy:6}, tags:['ä½æ','å¤è¿¹','äººæµéå¤§'], estimatedDuration:120, mapX:10, mapY:22, city:'æ­å·' },
  { id:24, name:'ä¹æºªçæ ', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:4,anxious:6,sad:7,calm:8,excited:7,happy:8}, tags:['åè´¹','å¾æ­¥','æºªæµ'], estimatedDuration:180, mapX:22, mapY:72, city:'æ­å·' },
  { id:25, name:'ç¥å³è§Â·å³', category:'restaurant', cuisineType:'æ­å¸®', signatureDish:'ð¥ é²èå°ç¬¼', foodEmoji:'ð¥', localRating:4.5, businessHours:'06:30-21:00', peakHours:'07:30-09:00, 11:30-13:00', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:85, isDietFriendly:true, dietaryTags:['lightFlavor','traditional'], avgCalories:500, queueTime:10, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:8,anxious:8,sad:8,calm:8,excited:5,happy:7}, estimatedDuration:60, mapX:42, mapY:52, city:'æ­å·' },
  { id:27, name:'é¼æ³°', category:'restaurant', cuisineType:'é¢é¦', signatureDish:'ð¥ è¹ç²å°ç¬¼', foodEmoji:'ð¥', localRating:4.7, businessHours:'11:00-14:30, 17:00-21:30', peakHours:'12:00-13:00, 18:30-19:30', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:110, isDietFriendly:true, dietaryTags:['lightFlavor','steamed'], avgCalories:420, queueTime:20, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:3, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, estimatedDuration:60, mapX:56, mapY:50, city:'æ­å·' },
  { id:28, name:'æ¹åæ¥å Â·è¯è³é¤å', category:'restaurant', cuisineType:'ç´ é£', signatureDish:'ð² å½å½é»èªçä¹', foodEmoji:'ð²', localRating:4.8, businessHours:'10:00-14:00, 16:30-20:00', peakHours:'12:00-13:00', energyLevel:1, crowdednessLevel:1, weatherSensitivity:'indoor', ticketPrice:75, isDietFriendly:true, dietaryTags:['medicinal','lightFlavor','warm'], avgCalories:380, queueTime:5, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:true, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:9,anxious:9,sad:9,calm:9,excited:3,happy:6}, estimatedDuration:60, mapX:46, mapY:60, city:'æ­å·' },
  // === å®æ³¢ ===
  { id:101, name:'å¤©ä¸', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:30, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:7,anxious:8,sad:7,calm:9,excited:4,happy:6}, tags:['å¤è¿¹','èä¹¦','å®é'], estimatedDuration:90, mapX:72, mapY:40, city:'å®æ³¢' },
  { id:102, name:'èå¤æ»©éå§è¡', category:'shopping', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:false, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:true, moodScores:{tired:3,anxious:3,sad:4,calm:5,excited:8,happy:9}, tags:['å¤æ¯','éå§','åè´¹'], estimatedDuration:120, mapX:74, mapY:42, city:'å®æ³¢' },
  { id:103, name:'ä¸é±æ¹éª', category:'sport', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:8, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:3,anxious:5,sad:5,calm:7,excited:9,happy:9}, tags:['éªè¡','æ¹æ¯','åè´¹'], estimatedDuration:180, mapX:70, mapY:44, city:'å®æ³¢' },
  { id:104, name:'å®æ³¢ç¶åæ¥¼é', category:'restaurant', cuisineType:'æµ·é²', signatureDish:'ð¦ å®æ³¢çº¢èåè¹', foodEmoji:'ð¦', localRating:4.6, businessHours:'11:00-14:00, 17:00-21:00', peakHours:'12:00-13:00, 18:00-19:30', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:120, isDietFriendly:true, dietaryTags:['seafood','traditional'], avgCalories:500, queueTime:15, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:2, romanticLevel:3, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:6,happy:8}, estimatedDuration:60, mapX:73, mapY:41, city:'å®æ³¢' },
  // === æ¸©å· ===
  { id:201, name:'éè¡å±±çµ', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:50, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:4,anxious:5,sad:6,calm:7,excited:9,happy:8}, tags:['å±±æ°´','å¾æ­¥','å¥å³°'], estimatedDuration:240, mapX:68, mapY:70, city:'æ¸©å·' },
  { id:202, name:'äºé©¬è¡ç¾', category:'shopping', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:true, moodScores:{tired:4,anxious:4,sad:5,calm:6,excited:8,happy:9}, tags:['ç¾é£','å¤è¡','åè´¹'], estimatedDuration:120, mapX:66, mapY:72, city:'æ¸©å·' },
  { id:203, name:'æ¥ æºªæ±ç«¹ç­æ¼', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:80, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:8,excited:8,happy:9}, tags:['æ¼æµ','å±±æ°´','æä¾£'], estimatedDuration:120, mapX:64, mapY:68, city:'æ¸©å·' },
  // === åå´ ===
  { id:301, name:'ä¹éè¥¿æ ', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:150, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:5,anxious:6,sad:6,calm:8,excited:8,happy:9}, tags:['æ°´ä¹¡','å¤æ¯','æç§'], estimatedDuration:300, mapX:50, mapY:30, city:'åå´' },
  { id:302, name:'è¥¿å¡å¤é', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:95, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:5,anxious:6,sad:6,calm:8,excited:7,happy:8}, tags:['å¤é','å»æ¡¥','æèº'], estimatedDuration:240, mapX:52, mapY:28, city:'åå´' },
  { id:303, name:'åæ¹é©å½çºªå¿µ', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:5,anxious:5,sad:5,calm:6,excited:4,happy:5}, tags:['çº¢è²','åè´¹','æè²'], estimatedDuration:90, mapX:54, mapY:32, city:'åå´' },
  // === ç»å´ ===
  { id:401, name:'é²è¿æé', category:'museum', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:8,excited:5,happy:7}, tags:['æå­¦','åè´¹','å¤è¿¹'], estimatedDuration:120, mapX:58, mapY:48, city:'ç»å´' },
  { id:402, name:'æ²å­ä¹å¤', category:'scenic', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:40, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:9,excited:5,happy:7}, tags:['å­æ','ç±æ','å¤æ¸¸'], estimatedDuration:90, mapX:56, mapY:46, city:'ç»å´' },
  { id:403, name:'å¸äº¨éåº', category:'restaurant', cuisineType:'å°å', signatureDish:'ð¶ è´é¦è±éé»é', foodEmoji:'ð¶', localRating:4.4, businessHours:'10:00-21:00', peakHours:'11:30-13:00, 17:30-19:00', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:60, isDietFriendly:false, dietaryTags:['traditional','huangjiu'], avgCalories:650, queueTime:20, hasElevator:false, spicinessLevel:1, hasPrivateRoom:true, hasHotTea:true, noiseLevel:3, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:false, restSeats:2, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:4,sad:5,calm:6,excited:6,happy:7}, estimatedDuration:60, mapX:57, mapY:47, city:'ç»å´' },
  // === èå±± ===
  { id:501, name:'æ®é', category:'temple', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:160, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:4,anxious:5,sad:6,calm:7,excited:6,happy:7}, tags:['ä½æ','æµ·å²','ç¥ç¦'], estimatedDuration:240, mapX:82, mapY:28, city:'èå±±' },
  { id:502, name:'æ±å®¶å°å', category:'scenic', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:75, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:5,anxious:5,sad:6,calm:7,excited:9,happy:9}, tags:['æ²æ»©','å¤§æµ·','äº²å­'], estimatedDuration:180, mapX:84, mapY:30, city:'èå±±' },
  { id:503, name:'æ²å®¶é¨æµ·é²å¤ææ¡£', category:'restaurant', cuisineType:'æµ·é²', signatureDish:'ð¦ è±æ²¹æµ·ç', foodEmoji:'ð¦', localRating:4.6, businessHours:'17:00-02:00', peakHours:'19:00-21:00', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'outdoor', ticketPrice:100, isDietFriendly:true, dietaryTags:['seafood','fresh'], avgCalories:450, queueTime:10, hasElevator:true, spicinessLevel:1, hasPrivateRoom:false, hasHotTea:true, noiseLevel:4, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:2, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:4,anxious:3,sad:5,calm:5,excited:8,happy:9}, estimatedDuration:60, mapX:80, mapY:32, city:'èå±±' },
  // === æ¹å· ===
  { id:601, name:'è«å¹²å±±è£¸å¿è°·', category:'leisure', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'mixed', ticketPrice:200, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:false, moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:6,happy:8}, tags:['æ°å®¿','ç«¹æµ·','é¿æ'], estimatedDuration:240, mapX:32, mapY:22, city:'æ¹å·' },
  { id:602, name:'åæµå¤é', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:100, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:8,excited:6,happy:7}, tags:['å¤é','æ°´ä¹¡','å®é'], estimatedDuration:180, mapX:36, mapY:24, city:'æ¹å·' },
  // === ä¸½æ°´ ===
  { id:701, name:'äºåæ¢¯ç°', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:80, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:4,anxious:6,sad:7,calm:8,excited:8,happy:8}, tags:['æ¢¯ç°','æ¥åº','æå½±'], estimatedDuration:180, mapX:40, mapY:80, city:'ä¸½æ°´' },
  { id:702, name:'å¤å °ç»ä¹¡', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:50, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:9,excited:6,happy:7}, tags:['åç','å¤æ','æèº'], estimatedDuration:150, mapX:38, mapY:78, city:'ä¸½æ°´' },
  // === éå ===
  { id:801, name:'æ¨ªåºå½±è§', category:'theme_park', energyLevel:4, crowdednessLevel:4, weatherSensitivity:'mixed', ticketPrice:280, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:2,anxious:2,sad:3,calm:5,excited:10,happy:9}, tags:['å½±è§','ç©¿è¶','äº²å­'], estimatedDuration:360, mapX:48, mapY:64, city:'éå' },
  { id:802, name:'æ­¦ä¹æ¸©æ³', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:150, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:4, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:false, moodScores:{tired:9,anxious:9,sad:9,calm:9,excited:5,happy:7}, tags:['æ¸©æ³','æ¾æ¾','å»ç'], estimatedDuration:180, mapX:44, mapY:66, city:'éå' },
  // === è¡¢å· ===
  { id:901, name:'æ±é', category:'scenic', energyLevel:4, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:100, kidsFriendly:false, elderlyFriendly:false, minAge:10, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:2,anxious:3,sad:4,calm:5,excited:10,happy:8}, tags:['ç»å±±','å¥å³°','æ·å¤'], estimatedDuration:300, mapX:30, mapY:60, city:'è¡¢å·' },
  // === å°å· ===
  { id:1001, name:'å¤©å°å±±å½æ¸å¯º', category:'temple', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:3, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:9,excited:5,happy:7}, tags:['ä½æ','åè´¹','å¤å¹'], estimatedDuration:120, mapX:60, mapY:60, city:'å°å·' },
  { id:1002, name:'ç¥ä»', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:110, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:3,anxious:4,sad:5,calm:6,excited:9,happy:8}, tags:['ä»å¢','æ é','æç§'], estimatedDuration:240, mapX:62, mapY:62, city:'å°å·' }
];

var SHOPPING_ITEMS = [
  { id:'shop-001', name:'è¥¿æ¹é¾äºÂ·æå', category:'ç¹äº§', emoji:'ðµ', priceRange:'Â¥80-580', rating:4.8, city:'æ­å·', description:'æ ¸å¿äº§åºæåé¾äºï¼è±é¦æµéï¼åçæä¹', recommendReason:'æ­å·å¿ä¹°ï¼éç¤¼é¦' },
  { id:'shop-002', name:'ä¸äºå©ä¸', category:'ç¹äº§', emoji:'ð§£', priceRange:'Â¥100-2000', rating:4.6, city:'æ­å·', description:'ç¾å¹´ä¸ç»¸åçï¼ä¸å·¾ãç¡è¡£ãæè¢åè´¨ä¸', recommendReason:'æ­å·åçï¼åè´¨ä¿' },
  { id:'shop-003', name:'èç²Â·æ¡è±', category:'æä¿¡', emoji:'ð°', priceRange:'Â¥15-80', rating:4.4, city:'æ­å·', description:'æ­å·ä¼ ç»ç³ç¹ï¼æ¸çä¸è»ï¼ç¤¼çè£ç²¾', recommendReason:'èå°çå®ï¼ä¼´æç¤¼é¦' },
  { id:'shop-004', name:'å¼ å°æ³åªå', category:'ç¹äº§', emoji:'âï¸', priceRange:'Â¥30-300', rating:4.7, city:'æ­å·', description:'ç¾å¹´èå­å·ï¼æå·¥é»é ï¼éå©èç¨', recommendReason:'å®ç¨èä¹çæ­å·ç¹' },
  { id:'shop-005', name:'åå®å¾¡è¡Â·æåå¸é', category:'æå', emoji:'ð¨', priceRange:'Â¥20-200', rating:4.5, city:'æ­å·', description:'æ­å·ç¹è²æåäº§åï¼æç»æä¿¡çãä¹¦æ³ææãè¥¿æ¹åæ¯ä¹¦', recommendReason:'æèºéå¹´çå®èå°' },
  { id:'shop-006', name:'ä¸­å½ä¸ç»¸åç©é¦å', category:'æå', emoji:'ð', priceRange:'Â¥50-500', rating:4.6, city:'æ­å·', description:'åç©é¦å®æ¹æåï¼ä¸ç»¸ä¸»é¢çä¸å·¾ãé¢å¸¦ãæ', recommendReason:'ææååºè´çç¤¼ç©' },
  { id:'shop-007', name:'æ±åå¸è¡£Â·å¥³è£', category:'æé¥°', emoji:'ð', priceRange:'Â¥200-2000', rating:4.3, city:'æ­å·', description:'æ­å·æ¬åè®¾è®¡å¸åçï¼èªç¶ç®çº¦é£', recommendReason:'æ¬å°åçï¼é£æ ¼ç¬' },
  { id:'shop-008', name:'å®æ³¢æ±¤åÂ·ç¼¸é¸­', category:'æä¿¡', emoji:'ð¡', priceRange:'Â¥25-100', rating:4.7, city:'å®æ³¢', description:'å®æ³¢èå­å·ï¼é»èéº»æ±¤åçèä¸', recommendReason:'å®æ³¢åå°åï¼éå»å¸¦å' },
  { id:'shop-009', name:'ç»å´é»éÂ·å¤è¶é¾å±±', category:'ç¹äº§', emoji:'ð¶', priceRange:'Â¥50-500', rating:4.8, city:'ç»å´', description:'å½å®´ç¨éï¼éå¹´è±ééåç»µ', recommendReason:'ç»å´çµé­ï¼è¶éè¶' },
  { id:'shop-010', name:'èå±±æµ·é²å¹²è´§', category:'ç¹äº§', emoji:'ð', priceRange:'Â¥30-300', rating:4.5, city:'èå±±', description:'é±¿é±¼ä¸ãç¤é±¼çãè¾ç®ï¼ç°ç¤ç°å', recommendReason:'æµ·çå³éå¸¦å' }
];

// ================================================================
//  POIæ°æ®å¢å¼ºï¼åºäºç°æå±æ§æºè½å¡«åæ°ç»´åº¦å±'
// ================================================================
(function enrichPOIs() {
  for (var i = 0; i < POIS.length; i++) {
    var p = POIS[i];
    var cat = p.category;
    var tags = p.tags || [];
    var isOutdoor = p.weatherSensitivity === 'outdoor' || p.weatherSensitivity === 'mixed';
    var isIndoor = p.weatherSensitivity === 'indoor';
    var isNature = cat === 'scenic' || cat === 'sport';
    var isCultural = cat === 'museum' || cat === 'temple';
    var isFood = cat === 'restaurant';
    var isShopping = cat === 'shopping';
    var isRelax = cat === 'leisure';
    var isTheme = cat === 'theme_park';

    // seasonalScore: è¯¥POIå¨åå­£èçééï¿½?(1-10)
    if (!p.seasonalScore) {
      if (isNature) {
        p.seasonalScore = { spring: 9, summer: isOutdoor ? 7 : 8, autumn: 9, winter: isOutdoor ? 4 : 6 };
      } else if (isCultural) {
        p.seasonalScore = { spring: 8, summer: 8, autumn: 9, winter: 7 };
      } else if (isFood || isShopping) {
        p.seasonalScore = { spring: 8, summer: 8, autumn: 8, winter: 8 };
      } else if (isRelax) {
        p.seasonalScore = { spring: 8, summer: isIndoor ? 9 : 7, autumn: 9, winter: isIndoor ? 9 : 5 };
      } else if (isTheme) {
        p.seasonalScore = { spring: 8, summer: 7, autumn: 8, winter: 6 };
      } else {
        p.seasonalScore = { spring: 7, summer: 7, autumn: 7, winter: 6 };
      }
      // ç¹æ®è°æ´ï¼æé¿ææ ç­¾çå¤å­£å '
      if (tags.indexOf('é¿æ') !== -1) p.seasonalScore.summer = 10;
      if (tags.indexOf('æ¸©æ³') !== -1) { p.seasonalScore.winter = 10; p.seasonalScore.summer = 4; }
      if (tags.indexOf('') !== -1 || tags.indexOf('æ»éª') !== -1) p.seasonalScore.winter = 10;
    }

    // weatherSensitivity å·²å­å¨ï¼è·³è¿

    // crowdProfile: å¸åäººç¾¤ç»å
    if (!p.crowdProfile) {
      var cLevel = p.crowdednessLevel || 3;
      if (cLevel <= 2) p.crowdProfile = 'å®éå°ä¼';
      else if (cLevel <= 3) p.crowdProfile = 'éä¸­';
      else if (cLevel <= 4) p.crowdProfile = 'è¾ç­';
      else p.crowdProfile = 'ç­é¨æå¡';
    }

    // bestTimeOfDay: æä½³æ¸¸è§æ¶'
    if (!p.bestTimeOfDay) {
      if (tags.indexOf('å¤æ¯') !== -1 || tags.indexOf('å¤æ¸¸') !== -1) {
        p.bestTimeOfDay = 'evening';
      } else if (tags.indexOf('æ¥åº') !== -1) {
        p.bestTimeOfDay = 'morning';
      } else if (isFood && tags.indexOf('å°å') !== -1) {
        p.bestTimeOfDay = 'evening';
      } else if (isOutdoor && p.energyLevel >= 3) {
        p.bestTimeOfDay = 'morning';
      } else if (isRelax) {
        p.bestTimeOfDay = 'afternoon';
      } else {
        p.bestTimeOfDay = 'afternoon';
      }
    }

    // photoScore: åºçææ° (1-10)
    if (!p.photoScore) {
      if (p.hasPhotoSpot) p.photoScore = Math.min(10, 6 + (p.romanticLevel || 3));
      else if (isNature) p.photoScore = Math.min(10, 5 + (p.romanticLevel || 3));
      else if (isCultural) p.photoScore = 5;
      else p.photoScore = 3;
    }

    // accessibility: å¯è¾¾'
    if (!p.accessibility) {
      if (p.wheelchairAccessible && p.energyLevel <= 2) p.accessibility = 'easy';
      else if (p.energyLevel >= 4) p.accessibility = 'difficult';
      else p.accessibility = 'moderate';
    }

    // familyFriendly: äº²å­åå¥½'
    if (p.familyFriendly === undefined) {
      p.familyFriendly = !!(p.kidsFriendly && p.elderlyFriendly && p.energyLevel <= 3 && (p.hasNursingRoom || p.strollerFriendly || p.restSeats >= 3));
    }

    // romanticScore: æµªæ¼«ææ° (1-10)
    if (!p.romanticScore) {
      p.romanticScore = Math.min(10, (p.romanticLevel || 1) * 2);
    }

    // adventureScore: åé©ææ° (1-10)
    if (!p.adventureScore) {
      if (tags.indexOf('æ·å¤') !== -1 || tags.indexOf('ç»å±±') !== -1 || tags.indexOf('å¾æ­¥') !== -1) p.adventureScore = 8;
      else if (isNature && p.energyLevel >= 3) p.adventureScore = 6;
      else if (tags.indexOf('éªè¡') !== -1) p.adventureScore = 7;
      else p.adventureScore = Math.max(1, p.energyLevel - 1);
    }

    // culturalScore: æåæ·±åº¦ (1-10)
    if (!p.culturalScore) {
      if (cat === 'museum') p.culturalScore = 9;
      else if (cat === 'temple') p.culturalScore = 8;
      else if (tags.indexOf('å¤è¿¹') !== -1 || tags.indexOf('ä½æ') !== -1 || tags.indexOf('æå­¦') !== -1) p.culturalScore = 8;
      else if (tags.indexOf('æèº') !== -1 || tags.indexOf('å¤è¡') !== -1) p.culturalScore = 6;
      else p.culturalScore = 3;
    }

    // relaxationScore: æ¾æ¾ææ° (1-10)
    if (!p.relaxationScore) {
      if (cat === 'leisure') p.relaxationScore = 9;
      else if (cat === 'temple') p.relaxationScore = 7;
      else if (p.energyLevel <= 1 && p.crowdednessLevel <= 2) p.relaxationScore = 8;
      else if (p.energyLevel <= 2) p.relaxationScore = 6;
      else p.relaxationScore = Math.max(1, 10 - p.energyLevel * 2);
      if (tags.indexOf('æ¸©æ³') !== -1) p.relaxationScore = 10;
      if (tags.indexOf('ææ©') !== -1) p.relaxationScore = 10;
    }
  }
})();

var HOTELS = [
  { id:1, name:'å®ç¼¦æ³äºç²¾åéåº', priceRangeLow:3800, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:10,anxious:9,sad:9,calm:10,excited:7,happy:8}, rating:4.9 },
  { id:2, name:'è¥¿æºªæ¹¿å°æ¦æ¦', priceRangeLow:2200, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:10,anxious:9,sad:9,calm:9,excited:8,happy:8}, rating:4.8 },
  { id:3, name:'è¥¿æ¹å½å®¾', priceRangeLow:1200, stars:5, has_spa:false, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:7}, rating:4.7 },
  { id:4, name:'å¨å­£éåºï¼è¥¿æ¹åº', priceRangeLow:350, stars:3, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:false, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:5,anxious:5,sad:5,calm:6,excited:5,happy:6}, rating:4.3 },
  { id:5, name:'å¦å®¶å¿«æ·éåº', priceRangeLow:180, stars:2, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:false, kidsFriendly:false, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:3,anxious:3,sad:3,calm:4,excited:3,happy:4}, rating:3.8 },
  { id:6, name:'æ­å·è¥¿å­æ¹åå­£é', priceRangeLow:2800, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:9,anxious:9,sad:9,calm:10,excited:8,happy:9}, rating:4.9, city:'æ­å·' },
  // === å®æ³¢ ===
  { id:101, name:'å®æ³¢å¨æ¯æ±éåº', priceRangeLow:680, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:6,happy:7}, rating:4.6, city:'å®æ³¢' },
  { id:102, name:'äºæµéåºï¼å®æ³¢èå¤æ»©åº', priceRangeLow:350, stars:4, has_spa:false, has_pool:false, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:5,happy:6}, rating:4.5, city:'å®æ³¢' },
  // === æ¸©å· ===
  { id:201, name:'æ¸©å·é¦æ ¼éæ', priceRangeLow:780, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:7,happy:8}, rating:4.7, city:'æ¸©å·' },
  // === åå´ ===
  { id:301, name:'ä¹éææ°´åº¦åéåº', priceRangeLow:880, stars:5, has_spa:true, has_pool:true, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:8}, rating:4.8, city:'åå´' },
  { id:302, name:'è¥¿å¡è±ç­Â·', priceRangeLow:420, stars:4, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, rating:4.5, city:'åå´' },
  // === ç»å´ ===
  { id:401, name:'ç»å´å¸äº¨å¤§é', priceRangeLow:380, stars:4, has_spa:false, has_pool:false, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:5,happy:6}, rating:4.4, city:'ç»å´' },
  // === èå±± ===
  { id:501, name:'æ®éå±±é·è¿ªæ£®åºå­', priceRangeLow:1200, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:8}, rating:4.7, city:'èå±±' },
  // === æ¹å· ===
  { id:601, name:'è«å¹²å±±è£¸å¿å ¡', priceRangeLow:2500, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:9,anxious:9,sad:9,calm:10,excited:7,happy:9}, rating:4.9, city:'æ¹å·' },
  { id:602, name:'è«å¹²å±±èéº»è°·èºæ¯éåº', priceRangeLow:680, stars:4, has_spa:false, has_pool:true, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:6,happy:8}, rating:4.6, city:'æ¹å·' },
  // === ä¸½æ°´ ===
  { id:701, name:'äºåæ¢¯ç°æ°å®¿', priceRangeLow:280, stars:3, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, rating:4.3, city:'ä¸½æ°´' },
  // === éå ===
  { id:801, name:'æ¨ªåºä¸°æ¯åä¸½å¤§é', priceRangeLow:480, stars:4, has_spa:false, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:7,happy:8}, rating:4.4, city:'éå' },
  // === å°å· ===
  { id:1001, name:'å¤©å°æ¸©æ³å±±åº', priceRangeLow:520, stars:4, has_spa:true, has_pool:true, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:5,happy:7}, rating:4.5, city:'å°å·' }
];

var WEIGHT_MATRIX = {
  'tired_solo':     { mood:0.35, budget:0.15, energy:0.30, crowd:0.15, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.05 },
  'tired_couple':   { mood:0.30, budget:0.10, energy:0.15, crowd:0.10, kid:0, elderly:0, couple:0.30, friends:0, business:0, diet:0.05 },
  'tired_friends':  { mood:0.25, budget:0.10, energy:0.10, crowd:0.10, kid:0, elderly:0, couple:0, friends:0.35, business:0, diet:0.10 },
  'tired_family':   { mood:0.25, budget:0.15, energy:0.30, crowd:0.15, kid:0.10, elderly:0.10, couple:0, friends:0, business:0, diet:0.05 },
  'tired_business': { mood:0.15, budget:0.15, energy:0.15, crowd:0.15, kid:0, elderly:0, couple:0, friends:0, business:0.35, diet:0.05 },
  'excited_solo':   { mood:0.20, budget:0.15, energy:0.10, crowd:0.05, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0 },
  'excited_couple': { mood:0.25, budget:0.10, energy:0.05, crowd:0.05, kid:0, elderly:0, couple:0.30, friends:0, business:0, diet:0.05 },
  'excited_friends':{ mood:0.20, budget:0.10, energy:0.05, crowd:0.05, kid:0, elderly:0, couple:0, friends:0.35, business:0, diet:0.10 },
  'excited_family': { mood:0.20, budget:0.15, energy:0.20, crowd:0.10, kid:0.15, elderly:0.10, couple:0, friends:0, business:0, diet:0.10 },
  'sad_solo':       { mood:0.35, budget:0.15, energy:0.20, crowd:0.20, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.10 },
  'sad_couple':     { mood:0.30, budget:0.10, energy:0.15, crowd:0.15, kid:0, elderly:0, couple:0.25, friends:0, business:0, diet:0.05 },
  'sad_friends':    { mood:0.25, budget:0.10, energy:0.15, crowd:0.15, kid:0, elderly:0, couple:0, friends:0.30, business:0, diet:0.05 },
  'sad_family':     { mood:0.30, budget:0.10, energy:0.15, crowd:0.20, kid:0.20, elderly:0.10, couple:0, friends:0, business:0, diet:0.05 },
  'anxious_solo':   { mood:0.30, budget:0.15, energy:0.20, crowd:0.25, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.10 },
  'anxious_couple': { mood:0.25, budget:0.10, energy:0.15, crowd:0.20, kid:0, elderly:0, couple:0.25, friends:0, business:0, diet:0.05 },
  'anxious_friends':{ mood:0.25, budget:0.10, energy:0.15, crowd:0.20, kid:0, elderly:0, couple:0, friends:0.25, business:0, diet:0.05 },
  'anxious_family': { mood:0.25, budget:0.15, energy:0.20, crowd:0.25, kid:0.10, elderly:0.10, couple:0, friends:0, business:0, diet:0.05 },
  'happy_couple':   { mood:0.15, budget:0.10, energy:0.10, crowd:0.05, kid:0, elderly:0, couple:0.35, friends:0, business:0, diet:0.05 },
  'happy_friends':  { mood:0.15, budget:0.15, energy:0.05, crowd:0.05, kid:0, elderly:0, couple:0, friends:0.35, business:0, diet:0.10 },
  'happy_budget':   { mood:0.15, budget:0.35, energy:0.10, crowd:0.05, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.05 },
  'calm_family':    { mood:0.20, budget:0.15, energy:0.15, crowd:0.15, kid:0.20, elderly:0, couple:0, friends:0, business:0, diet:0.15 },
  'calm_couple':    { mood:0.20, budget:0.10, energy:0.15, crowd:0.10, kid:0, elderly:0, couple:0.30, friends:0, business:0, diet:0.15 },
  'calm_friends':   { mood:0.20, budget:0.15, energy:0.10, crowd:0.10, kid:0, elderly:0, couple:0, friends:0.30, business:0, diet:0.15 },
  'default':        { mood:0.25, budget:0.20, energy:0.15, crowd:0.15, kid:0.10, elderly:0.05, couple:0, friends:0, business:0, diet:0.10 }
};

var MOOD_ENERGY_MAP = { tired:1, sad:1, anxious:2, calm:2, happy:3, excited:4, insomnia:1 };

var PLATFORM_LIST = [
  { name:'æºç¨', icon:'ð¨', baseMultiplier:1.0 },
  { name:'ç¾å¢', icon:'ð', baseMultiplier:0.95 },
  { name:'é£çª', icon:'ð·', baseMultiplier:0.92 },
  { name:'å»åª', icon:'âï¸', baseMultiplier:0.97 },
  { name:'åç¨', icon:'ð«', baseMultiplier:0.93 }
];

var BUDGET_PRESETS = [
  { label:'Â¥3,000', value:3000 },
  { label:'Â¥5,000', value:5000 },
  { label:'Â¥10,000', value:10000 },
  { label:'èªå®', value:'custom' }
];

var HOT_ROUTES = [
  { id:1, title:'æ£®ææ²»æä¹æ', emoji:'ð²', days:'2ï¿½?', budget:'Â¥800', bg:'linear-gradient(135deg, #a8d8a8, #6b9b6b)' },
  { id:2, title:'æµ·è¾¹ååæå', emoji:'ð', days:'3ï¿½?', budget:'Â¥1,500', bg:'linear-gradient(135deg, #89CFF0, #4A90D9)' },
  { id:3, title:'åå¸æ¼«æ­¥æ¢åº', emoji:'', days:'1', budget:'Â¥300', bg:'linear-gradient(135deg, #D4A574, #A67C52)' },
  { id:4, title:'å±±é´é²è¥è§æ', emoji:'ð', days:'2ï¿½?', budget:'Â¥600', bg:'linear-gradient(135deg, #7B8FB2, #4A5F7A)' },
  { id:5, title:'å¤éæèºä¹æ', emoji:'ð', days:'2ï¿½?', budget:'Â¥500', bg:'linear-gradient(135deg, #C4A8A8, #8B7070)' },
  { id:6, title:'éªè¡è¿½é£è®¡å', emoji:'ð´', days:'1', budget:'Â¥200', bg:'linear-gradient(135deg, #FFB347, #E8945A)' },
  { id:7, title:'æ¸©æ³æ¾æ¾ä¹æ', emoji:'â¨ï¸', days:'2ï¿½?', budget:'Â¥1,200', bg:'linear-gradient(135deg, #B5A3C4, #7B6B8A)' }
];

var PLAN_CARDS = [
  { id:1, color:'#FF6B6B', moodLabel:'æ´»ååºè¡', showBack:false, planA:[{time:'09:00',name:'è¥¿æ¹èå ¤æ¼«æ­¥'},{time:'12:00',name:'ç¥å³è§å'},{time:'14:00',name:'éè¤è¶é¦åè'},{time:'17:00',name:'é·å³°å¡æ¥'}], planAStats:{steps:'ð¶ 8k',time:'ï¿½?8h',budget:'ð° Â¥1,200'}, planB:[{time:'08:00',name:'åéçç°å¾æ­¥'},{time:'11:30',name:'é¾äºæåå®¶è'},{time:'14:00',name:'ç¯æ¹éªè¡30km'},{time:'18:00',name:'æ¡è¯­å±±æ¿æé¤'}], planBStats:{steps:'ð¶ 25k',time:'ï¿½?10h',budget:'ð° Â¥2,800'} },
  { id:2, color:'#8BA88C', moodLabel:'æ²»ææ¾æ¾', showBack:false, planA:[{time:'10:00',name:'æµåä¹æ±'},{time:'13:00',name:'ç´ é£é¤å'},{time:'15:00',name:'æ¢å®¶åè¶'},{time:'18:00',name:'æ¹è¾¹æ£æ­¥'}], planAStats:{steps:'ð¶ 5k',time:'ï¿½?6h',budget:'ð° Â¥800'}, planB:[{time:'09:00',name:'è¥¿æºªæ¹¿å°ææ©¹'},{time:'12:30',name:'æ¹¿å°ååºåé¤'},{time:'15:00',name:'æ¹¿å°åç©'},{time:'18:00',name:'æ²³åè¡å°'}], planBStats:{steps:'ð¶ 12k',time:'ï¿½?9h',budget:'ð° Â¥1,500'} },
  { id:3, color:'#6B8FA3', moodLabel:'éè°§æ¶å', showBack:false, planA:[{time:'11:00',name:'ç«ç©ºä¹¦åº'},{time:'13:30',name:'è½¬è§åå¡'},{time:'16:00',name:'ç¤¾åºè±å­'},{time:'19:00',name:'æ¥å¼å±é'}], planAStats:{steps:'ð¶ 3k',time:'ï¿½?5h',budget:'ð° Â¥500'}, planB:[{time:'10:00',name:'é¿ä¸ä¹¦å±'},{time:'13:00',name:'æ³åå¯ºç´ '},{time:'15:00',name:'äºæ ç«¹å¾'},{time:'18:00',name:'çµéå¯ºæ'}], planBStats:{steps:'ð¶ 8k',time:'ï¿½?8h',budget:'ð° Â¥1,000'} },
  { id:4, color:'#E8A85A', moodLabel:'æ¢ç´¢åé©', showBack:false, planA:[{time:'07:00',name:'å®ç³å±±æ¥'},{time:'10:00',name:'åå±±è¡éª'},{time:'13:00',name:'éèåå'},{time:'16:00',name:'ä¹æºªçæ å¾æ­¥'}], planAStats:{steps:'ð¶ 20k',time:'ï¿½?11h',budget:'ð° Â¥1,800'}, planB:[{time:'06:30',name:'æ»¡è§éç»'},{time:'11:00',name:'èè·æ³æ°´æ³¡è¶'},{time:'14:00',name:'å­åå¡ç»'},{time:'17:00',name:'é±å¡æ±éª'}], planBStats:{steps:'ð¶ 28k',time:'ï¿½?12h',budget:'ð° Â¥2,000'} },
  { id:5, color:'#B5A3C4', moodLabel:'æèºæ¼«æ­¥', showBack:false, planA:[{time:'10:00',name:'ä¸­å½ç¾é¢è±¡å±±æ ¡åº'},{time:'13:00',name:'è½¬å¡èºæ¯è¡åº'},{time:'15:00',name:'ååç©ºé´ä¹¦åº'},{time:'18:00',name:'çµå£«éå§'}], planAStats:{steps:'ð¶ 10k',time:'ï¿½?8h',budget:'ð° Â¥1,200'}, planB:[{time:'09:00',name:'åå®å¾¡è¡æ¼«æ­¥'},{time:'12:00',name:'æ­å¸®èåç©é¦'},{time:'14:30',name:'æé£ä¹¦å±'},{time:'17:00',name:'è¥¿æ¹é³ä¹å·æ³'}], planBStats:{steps:'ð¶ 15k',time:'ï¿½?9h',budget:'ð° Â¥1,600'} },
  { id:6, color:'#C4A8A8', moodLabel:'æ¸©æéªä¼´', showBack:false, planA:[{time:'09:30',name:'è±æ¸¯è§é±¼'},{time:'12:00',name:'æ¥¼å¤æ¥¼å'},{time:'14:00',name:'ä¸æ½­å°ææ¸¸è¹'},{time:'17:00',name:'æ¹æ»¨é¶æ³°æé¤'}], planAStats:{steps:'ð¶ 6k',time:'ï¿½?7h',budget:'ð° Â¥1,500'}, planB:[{time:'10:00',name:'æ­å·å¨ç©'},{time:'13:00',name:'å¤å©å®¶å'},{time:'15:00',name:'å°å¹´å®«æ¸¸'},{time:'18:00',name:'æ­¦æå¤å¸'}], planBStats:{steps:'ð¶ 10k',time:'ï¿½?8h',budget:'ð° Â¥1,800'} }
];

var EXTRA_CARDS = [
  { id:7, color:'#A3B5A6', moodLabel:'èªç¶å¼å¸', showBack:false, planA:[{time:'08:00',name:'æ¤ç©å­æ¨'},{time:'11:00',name:'åå®¶ä¹å'},{time:'14:00',name:'é¾äºé®è¶'},{time:'17:00',name:'èå®¶å æ¥'}], planAStats:{steps:'ð¶ 12k',time:'ï¿½?8h',budget:'ð° Â¥1,000'}, planB:[{time:'07:00',name:'ççå±±ç»'},{time:'11:00',name:'å«å¦ç°é'},{time:'14:00',name:'æ±æ´ççæå¬'},{time:'17:00',name:'ç½å¡å¬å­'}], planBStats:{steps:'ð¶ 18k',time:'ï¿½?10h',budget:'ð° Â¥1,400'} },
  { id:8, color:'#FFB347', moodLabel:'ç¾é£ä¹æ', showBack:false, planA:[{time:'09:00',name:'æ°ä¸°å°åæ©é¤'},{time:'12:00',name:'å¥åé¦è¾çé³'},{time:'15:00',name:'å®èç³ä½'},{time:'18:00',name:'æ¹æ»¨28é¤å'}], planAStats:{steps:'ð¶ 4k',time:'ï¿½?6h',budget:'ð° Â¥2,000'}, planB:[{time:'08:30',name:'æ¸¸å è±æµ'},{time:'12:00',name:'å¾·æé¥­åº'},{time:'15:00',name:'Cycle&Cycle'},{time:'18:00',name:'éæ²'}], planBStats:{steps:'ð¶ 6k',time:'ï¿½?7h',budget:'ð° Â¥3,500'} }
];

// ================================================================
//  æµæ±å¨åæµè¯æ°æ®å­å¸ï¿½?1 å°çº§å¸ï¼
// ================================================================
var ZHEJIANG_CITIES = [
  { name:'æ­å·', tags:['è¥¿æ¹','äººæ','è¶æ','äºè','æ¢ç'], vibe:'æ¸©å©æ±åï¼äººé´å¤©', poiKeywords:['è¥¿æ¹','çµé','é¾äº','è¥¿æºªæ¹¿å°','å®å','æ²³å'] },
  { name:'å®æ³¢', tags:['æ¸¯å£','æµ·é²','åå²','ç»æµ','ä¹¦é¦'], vibe:'ä¹¦èå¤ä»ï¼æ¸¯éå¤©', poiKeywords:['å¤©ä¸','èå¤','ä¸é±','è±¡å±±æµ·é²','å¥åæºªå£'] },
  { name:'æ¸©å·', tags:['å±±æ°´','åä¸','ç¾é£','æ´»å','æ°è¥'], vibe:'æ¢ä¸ºäººåçå±±æ°´ä¹', poiKeywords:['éè¡','æ¥ æºª','æ±å¿','äºé©¬','åéº'] },
  { name:'åå´', tags:['æ°´ä¹¡','å¤é','çº¢è²','ç²½å­','æ¬é'], vibe:'æ¢¦éæ°´ä¹¡ï¼çº¢è²èµ·', poiKeywords:['ä¹é','è¥¿å¡','åæ¹','ææ²³èè¡','çå®è§æ½®'] },
  { name:'æ¹å·', tags:['ç«¹æµ·','å¤ªæ¹','æ°å®¿','å®å','æ¸å¹½'], vibe:'è¡éæ±åæ¸ä¸½å°ï¼äººçåªåä½æ¹', poiKeywords:['è«å¹²','åæµå¤é','å®åç«¹æµ·','å¤ªæ¹ææ¸¸åº¦å','é¿å´é¶æ'] },
  { name:'ç»å´', tags:['é»é','é²è¿','æ°´ä¹¡','ä¹¦æ³','å¤éµ'], vibe:'æ²¡æå´å¢çåç©é¦', poiKeywords:['é²è¿æé','æ²å­','ä¸æ¹','å®æå¤é','å°äº­'] },
  { name:'éå', tags:['ç«è¿','æº¶æ´','å½±è§','æ¸©æ³','å¤æ'], vibe:'æ°´å¢¨éåï¼ä¸æ¹å¥½è±å', poiKeywords:['åé¾','æ¨ªåºå½±è§','è¯¸èå«å¦','æ­¦ä¹æ¸©æ³','ä¹ä¹å°ååå'] },
  { name:'è¡¢å·', tags:['ç¾é£','è¾£å³','å¤å','å±±æ°´','å´æ£'], vibe:'åå­å£å°ï¼è¡¢å·æ', poiKeywords:['æ±é','å»¿å«é½å¤','é¾æ¸¸ç³çª','çæ¯','æ°´äº­'] },
  { name:'èå±±', tags:['æµ·å²','æµ·é²','æ®é','æ²æ»©','æ¸æ¸¯'], vibe:'æµ·å¤©ä½å½ï¼æ¸é½æ¸¯', poiKeywords:['æ®é','æ±å®¶','åµæ³åå²','ä¸æ','æ²å®¶é¨æ¸'] },
  { name:'å°å·', tags:['å±±æµ·','ä½é','èæ©','å¤å','æµ·é²'], vibe:'å±±æµ·æ°´åï¼ååå£', poiKeywords:['å¤©å°','ç¥ä»','ä¸´æµ·å¤å','å¤§é','é¿å±¿ç¡å¤©'] },
  { name:'ä¸½æ°´', tags:['å¸æ°§','æ¢¯ç°','ç²æ','å¤å °','ç»ä¹¡'], vibe:'æµæ±ç»¿è°·ï¼å¤©ç¶æ°§', poiKeywords:['äºåæ¢¯ç°','å¤å °ç»ä¹¡','ç¼äºä»é½','åå°','é¾æ³éç·'] }
];

function getSanxinCity() {
  var escapeCities = ZHEJIANG_CITIES.filter(function(c) { return c.name !== 'æ­å·'; });
  return escapeCities[Math.floor(Math.random() * escapeCities.length)];
}

var ANXIOUS_KEYWORDS = ['å¥½ç´¯','ä¸æ³ä¸ç­','å¿ç¦','åå','ç¦è','æ³','æ£å¿','å¿ç´¯','å´©æº','åä¸','æ³å­','é¾è¿','ä¸æ³','æ²¡å','emo','æé','ç¦èº','æå±','æ³é','æ³ä¸ä¸ªäºº','æ³ç¦»å¼','å¤ªç´¯','æä¸'];

// ================================================================
//  é¢ç®å¨æåº'
// ================================================================
function getBudgetRange(d) {
  var ranges = { 1:{min:500,max:2000}, 2:{min:1000,max:4000}, 3:{min:1500,max:8000}, 4:{min:2000,max:12000}, 5:{min:2500,max:15000} };
  return ranges[Math.min(Math.max(d,1),5)] || ranges[3];
}

// ================================================================
//  ç¶'
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
var scrollCount = 0;       // é¡µé¢æ»å¨è®¡æ°
var keywordTriggered = false; // å³é®è¯å·²è§¦å
var budgetWarningEl = null;  // é¢ç®æ ¡éªæç¤ºåç´ 

// ================================================================
//  å¨ç»´åº¦æç»ªæç¥ç³»ï¿½?ï¿½?å¤ç»´ä¿¡å·äº¤åéªè¯ + å¨æç½®ä¿¡åº¦è¯å
// ================================================================

// æ ¸å¿æç»ªç¶ææº
var emotionState = {
  score: 0,             // ç½®ä¿¡ï¿½?0-100
  moodType: null,       // å½åå¤å®çæç»ªç±»'
  signals: {},          // åç»´åº¦ä¿¡å·è´¡ï¿½?{ mouse:0, click:0, time:0, battery:0, ... }
  lastUpdate: 0,        // æåæ´æ°æ¶é´æ³
  decayTimer: null,     // åæ°è¡°åè®¡æ¶'
  sessionSilent: false  // æ¬æ¬¡ä¼è¯éé»ï¼ç¨æ·å³é­æ°æ³¡åï¼æ¬æ¬¡ä¼è¯ä¸åå¼¹'
};

// æ§çå¼å®¹åéï¼ä¿çç» selectMood ç­ä½¿ç¨ï¼
var autoMoodLocked = false;
var simplifiedMode = false;
var autoDetectedMood = null;

// å¤ç»´ä¿¡å·éé'
var mouseHistory = [];
var clickHistory = [];
var idleTimer = null;
var moodCheckTimer = null;

// åå®¹äº¤äºè¿½è¸ª
var searchHistory = [];        // [{keyword, time}]
var lastSearchKeyword = '';
var searchRepeatCount = 0;
var detailDwellStart = null;   // è¯¦æé¡µåçå¼å§æ¶'
var detailDwellTriggered = false;

// æ æ´è¾å¥ç¹è±«è¿½è¸ª
var treeHoleFocusTime = null;
var treeHoleCursorBlinkCount = 0;
var treeHoleHesitationTimer = null;

// çµæ± ç¶'
var batteryLevel = 100;
var batteryLow = false;

// è®°å¿ä¸å­¦'
var memoryStore = {
  rejectCount: 0,
  lastRejectTime: null,
  silentUntil: null,       // éé»ææªæ­¢æ¶'
  acceptCount: 0,
  totalProbes: 0
};

// éå¼é'
var CONFIDENCE_SOFT_THRESHOLD = 50;   // åå°è°æ´æéçæä½å'
var CONFIDENCE_PROBE_THRESHOLD = 80;  // è§¦åUIè¯æ¢çå'
var CONFIDENCE_SIGNAL_BASE = 20;      // åä¸ä¿¡å·åºç¡'
var CONFIDENCE_DECAY_RATE = 3;        // æ¯ç§è¡°ååæ°
var DETAIL_DWELL_THRESHOLD = 30000;   // è¯¦æé¡µåï¿½?30 '
var TREE_HOLE_HESITATE_THRESHOLD = 5000; // åæ éªç 5 '
var SEARCH_REPEAT_THRESHOLD = 3;      // éå¤æç´¢ 3 '
var SILENT_PERIOD_HOURS = 24;         // éé»ï¿½?24 å°æ¶

// ================================================================
//  DOM å¼ç¨
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
//  åå§'
// ================================================================
function initParticles() {
  var html = '';
  for (var n = 1; n <= 20; n++) {
    var left = (n * 37 + 13) % 100;
    var delay = (n * 0.7) % 8;
    var dur = 6 + (n % 5) * 2;
    var size = 2 + (n % 3);
    html += '<span class="particle" style="left:' + left + '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's;width:' + size + 'px;height:' + size + 'px"></span>';
  }
  bgParticles.innerHTML = html;
}

function initMoods() {
  moodGrid.innerHTML = '';
  MOODS.forEach(function(mood, idx) {
    var btn = document.createElement('button');
    btn.className = 'mood-btn animate-scale-in stagger-' + (idx + 1) + (activeMood === mood.key ? ' active' : '');
    if (activeMood === mood.key) {
      btn.style.background = mood.color + '28';
      btn.style.borderColor = mood.color + '60';
      btn.style.color = mood.color;
      btn.style.boxShadow = '0 0 32px ' + mood.color + '30, inset 0 0 24px ' + mood.color + '10';
    }
    btn.setAttribute('aria-label', 'éæ©' + mood.label + 'å¿æ');
    btn.dataset.key = mood.key;
    btn.innerHTML = '<span class="mood-btn-emoji">' + mood.emoji + '</span><span class="mood-btn-label">' + mood.label + '</span>';
    btn.addEventListener('click', function() { selectMood(mood); });
    btn.addEventListener('mouseenter', function() { var e = btn.querySelector('.mood-btn-emoji'); if (e) e.classList.add('wiggle'); });
    btn.addEventListener('mouseleave', function() { var e = btn.querySelector('.mood-btn-emoji'); if (e) e.classList.remove('wiggle'); });
    moodGrid.appendChild(btn);
  });
}

function initCompanions() {
  var container = document.getElementById('companionChips');
  container.innerHTML = '';
  COMPANION_TYPES.forEach(function(ct) {
    var chip = document.createElement('button');
    chip.className = 'companion-chip' + (companionType === ct.key ? ' active' : '');
    if (companionType === ct.key) {
      chip.style.background = activeMoodColor + '22';
      chip.style.borderColor = activeMoodColor + '60';
      chip.style.color = activeMoodColor;
    }
    chip.innerHTML = '<span class="comp-icon">' + ct.icon + '</span><span class="comp-label">' + ct.label + '</span><span class="comp-desc">' + ct.desc + '</span>';
    chip.addEventListener('click', function() { selectCompanion(ct.key); });
    container.appendChild(chip);
  });
}

function initPresets() {
  budgetPresets.innerHTML = '';
  BUDGET_PRESETS.forEach(function(p) {
    var btn = document.createElement('button');
    btn.className = 'preset-chip' + (budget === p.value ? ' active' : '');
    if (budget === p.value) {
      btn.style.background = activeMoodColor + '22';
      btn.style.borderColor = activeMoodColor;
      btn.style.color = activeMoodColor;
    }
    btn.textContent = p.label;
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
  scroll.innerHTML = '';
  DAILY_SCENARIOS.forEach(function(sc) {
    var chip = document.createElement('button');
    chip.className = 'daily-scenario-chip' + (activeScenario === sc.key ? ' active' : '');
    if (activeScenario === sc.key) {
      chip.style.background = activeMoodColor + '22';
      chip.style.borderColor = activeMoodColor + '60';
      chip.style.color = activeMoodColor;
    }
    chip.textContent = sc.label;
    chip.addEventListener('click', function() { selectScenario(sc.key); });
    scroll.appendChild(chip);
  });
}

function initHotRoutes() {
  hotRoutesScroll.innerHTML = '';
  HOT_ROUTES.forEach(function(route) {
    var card = document.createElement('div');
    card.className = 'hot-route-card glass-panel';
    card.innerHTML = '<div class="hot-route-img" style="background:' + route.bg + '"><span class="hot-route-emoji">' + route.emoji + '</span></div><div class="hot-route-info"><span class="hot-route-title">' + route.title + '</span><span class="hot-route-meta">' + route.days + ' Â· ' + route.budget + '</span></div>';
    card.addEventListener('click', function() { showToast('æ¢ç´¢' + route.title + ''); });
    hotRoutesScroll.appendChild(card);
  });
}

// ================================================================
//  å¿æéæ©
// ================================================================
function selectMood(mood) {
  activeMood = mood.key;
  activeMoodColor = mood.color;
  bgSky.className = 'bg-sky sky-' + mood.key;
  budgetNumber.style.color = mood.color;
  budgetFill.style.background = mood.color;
  // ç¨æ·æå¨éæ©ï¼éå®èªå¨æ£'
  autoMoodLocked = true;
  // ï¿½?insomnia æ¶ç§»é¤æå¤æ¨¡'
  if (mood.key !== 'insomnia') document.body.classList.remove('night-mode');
  else document.body.classList.add('night-mode');
  // æ­£åå¿æï¼éåºå®æ'
  if (mood.key === 'happy' || mood.key === 'excited' || mood.key === 'calm') {
    removeSoothingState();
  }
  updateMoodActiveStyle();
  updatePresetStyles();
  planCount.style.background = mood.color + '18';
  planCount.style.color = mood.color;
  updateGenerateBtn();
  // æ³¨å¥å¿æä¸»é¢CSSåéï¼å®ç°è§è§å·®å¼å
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
    // å¨æèæ¯æ¸'
    document.body.style.background = theme.bgGradient;
    document.body.style.transition = 'background 1.5s var(--easing)';
  }
  // åæ¢bodyçå¿æclass
  document.body.className = document.body.className.replace(/mood-\w+/g, '');
  document.body.classList.add('mood-' + mood.key);
  showToast('å·²åæ¢è³' + mood.label + 'ãæ¨¡');
}

function updateMoodActiveStyle() {
  var btns = moodGrid.querySelectorAll('.mood-btn');
  btns.forEach(function(btn) {
    var key = btn.dataset.key;
    var mood = MOODS.find(function(m) { return m.key === key; });
    if (key === activeMood) {
      btn.classList.add('active');
      btn.style.background = mood.color + '28';
      btn.style.borderColor = mood.color + '60';
      btn.style.color = mood.color;
      btn.style.boxShadow = '0 0 32px ' + mood.color + '30, inset 0 0 24px ' + mood.color + '10';
    } else {
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.boxShadow = '';
    }
  });
  // åæ­¥æ´æ°æ¾æ§æç»ªéæ©'
  updateExplicitMoodStyles();
}

// ================================================================
//  æ¾æ§æç»ªéæ©å¨ï¼æç®ä¸æï¼
// ================================================================
function quickMood(label, emoji) {
  var moodMap = { calm: MOODS[0], excited: MOODS[4] };
  var mood = moodMap[label];
  if (mood) selectMood(mood);
}

function quickMoodAnxious() {
  // éæ© ð« ï¿½?ç«å³è§¦å anxious + æµæ±æ£å¿è·¯çº¿
  var anxiousMood = MOODS.find(function(m) { return m.key === 'anxious'; });
  if (anxiousMood) selectMood(anxiousMood);
  keywordTriggered = true;
  // åæ¢å°æè¡æ¨¡'
  if (travelMode !== 'tourism') {
    travelMode = 'tourism';
    updateSceneToggle();
  }
  // éæºéæ©ä¸ä¸ªæµæ±æ£å¿åå¸ï¼æé¤æ­å·'
  var city = getSanxinCity();
  showToast('ð¿ ä¸ºä½ æ¨è' + city.name + 'æ£å¿ä¹æãï¿½?' + city.vibe);
  // 3ç§åèªå¨çæè¡ç¨
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
//  éæ§æç»ªæ£æµï¼å³é®'+ ??????
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
  showToast('ð æå°äºä½ çç²æ«ï¼æ¨è' + city.name + 'æ£å¿ä¹æ');
}

// æ»å¨æ£'
var rightPanelScrollTimer = null;
// ================================================================
//  MBTI æè¡äººæ ¼ç³»ç» ï¿½?16åäºº'+ ??????????????????
//  åï¿½?16Personalities ç ç©¶ + 64åæ©ï¿½?(A/O + H/C)
// ================================================================
var mbtiQuestions = [
  { id:'EI', text:'æè¡æ¶ï¼ä½ æ´å¾åäºï¼', options:[
    { value:'E', label:'ð åæä¼´ç­çè®¨è®ºï¼åäº«è§é»', desc:'å¤å' },
    { value:'I', label:'ð¿ å®éè§å¯ï¼äº«åç¬å¤æ¶', desc:'åå' }
  ]},
  { id:'SN', text:'è§åè¡ç¨æ¶ï¼ä½ æ´çé', options:[
    { value:'S', label:'ð å·ä½çæ»ç¥ãè¯ååå®éä½éª', desc:'å®æ' },
    { value:'N', label:'ð¡ ç¬ç¹çåæãéèç©æ³åçµæ', desc:'ç´è§' }
  ]},
  { id:'TF', text:'éå°è¡ç¨å²çªæ¶ï¼ä½ ä¼', options:[
    { value:'T', label:'âï¸ çæ§åæå©å¼ï¼éæ©æä¼æ¹', desc:'æèå' },
    { value:'F', label:'ð ä¼åèèå¤§å®¶çæååæ°å´', desc:'ææ' }
  ]},
  { id:'JP', text:'åºååä¸å¤©ï¼ä½ éå¸¸', options:[
    { value:'J', label:'ð è¡ç¨å·²ç²¾ç¡®å°åéï¼è¡ææ´æ´é½', desc:'å¤æ­' },
    { value:'P', label:'ð² å¤§æ¦æä¸ªæ¹åå°±å¥½ï¼ééèå®', desc:'æç¥' }
  ]},
  { id:'AO', text:'é¢è®¢éåºæ¶ï¼ä½ ï¼', options:[
    { value:'A', label:'ï¿½?å¿«éå¯¹æ¯åææ­ä¸åï¼ç¸ä¿¡ç´', desc:'ææ­' },
    { value:'O', label:'ð åå¤æ¯è¾æ°åå®¶ï¼æå¿éè¿æ´å¥½', desc:'çº ç»' }
  ]},
  { id:'HC', text:'å¨éçåå¸è¿·è·¯æ¶ï¼ä½ ä¼ï¼', options:[
    { value:'H', label:'ð¤ ä¸»å¨é®è·¯äººæåºå®¶ï¼äº«åäº¤', desc:'æ¸©æ' },
    { value:'C', label:'ðºï¿½?æåºææºèªå·±å¯¼èªï¼ä¸æ³ææ°å«', desc:'é«å·' }
  ]},
  { id:'travel_style', text:'çæ³çæè¡èå¥æ¯', options:[
    { value:'fast', label:'ï¿½?ç¹ç§åµå¼æå¡ï¼ä¸ï¿½?ä¸ªæ¯', desc:'å¿«è' },
    { value:'slow', label:'ð ç¡å°èªç¶éï¼æ·±åº¦ä½éªä¸ä¸ªå°', desc:'æ¢è' }
  ]},
  { id:'budget_style', text:'æè¡æ¶è´¹è§ï¼', options:[
    { value:'value', label:'ð° ç²¾æç»ç®ï¼æ§ä»·æ¯ä¸º', desc:'æ§ä»·æ¯æ´¾' },
    { value:'experience', label:'ï¿½?ä½éªä¼åï¼è¯¥è±å°±', desc:'ä½éª' }
  ]}
];

var mbtiAnswers = {};
var mbtiCurrentQuestion = 0;
var mbtiResult = null;

// 16åäººæ ¼æè¡æ¡£'
var MBTI_TRAVEL_PROFILES = {
  'INTJ': {
    nickname:'æç¥è§å', emoji:'ðº', traits:['æ·±åº¦æ','ç¬ç«æ¢ç´¢','æåæ²æµ¸'],
    destinations:['æ­å·Â·çµé','ç»å´Â·é²è¿æé','å®æ³¢Â·å¤©ä¸'],
    travelStyle:'åå¥½ææ·±åº¦çæåä¹æï¼åæ¬¢ç¬èªæ¢ç´¢åå²å¤è¿¹ååç©é¦ï¼å¯¹ç½çº¢æå¡å°å´è¶£ä¸å¤§ãè¡ç¨ç²¾ç¡®ä½ä¸æ­»æ¿ï¼ä¼çåºæèç©ºé´',
    pace:'moderate', budgetStyle:'value', color:'#6B8FA3',
    tip:'å»ºè®®é¿å¼äººæµé«å³°ï¼éæ©æ¸æ¨æå·¥ä½æ¥åºè¡ï¼äº«åå®éçæèæ¶å'
  },
  'INTP': {
    nickname:'å¥½å¥æ¢ç´¢', emoji:'ð¬', traits:['ç¥è¯æ¸´æ±','çµæ´»åºå','å°ä¼çå¥'],
    destinations:['æµæ±çç§æ','ä¸­å½è¶å¶åç©','äºåæ¢¯ç°'],
    travelStyle:'å¯¹ä¸çåæ»¡å¥½å¥ï¼åæ¬¢æ¢ç´¢äºç©çåçãåç©é¦ãç§æé¦æ¯ä½ çä¹å­ï¼å°ä¼æ¯ç¹æ¯ç­é¨æ¯åºæ´æå¸å¼å',
    pace:'slow', budgetStyle:'value', color:'#8BA88C',
    tip:'çåºè¶³å¤æ¶é´æ·±å¥æ¢ç´¢ä¸ä¸ªå°æ¹ï¼ä¸è¦èµ¶è¡ç¨ï¼è®©å¥½å¥å¿èªç¶å¼å¯¼'
  },
  'ENTJ': {
    nickname:'é«æé¢èª', emoji:'ð¯', traits:['ç®æ æç¡®','æçè³ä¸','ææ§å¨å±'],
    destinations:['æ­å·å®å','æ®é','è«å¹²å±±è£¸å¿è°·'],
    travelStyle:'æè¡ä¹æ¯ä¸åºéè¦å®æçä»»å¡ãåæ¬¢é«ææå¡ï¼ä¸å¤©è½è·å«äººä¸¤å¤©çè¡ç¨ãäº«åææ§å¨å±çæè§',
    pace:'fast', budgetStyle:'experience', color:'#E8945A',
    tip:'???????????????????????????????????????????????????????????????????"??????????????????"
  },
  'ENTP': {
    nickname:'åæåé©', emoji:'ðª', traits:['å³å´åæ¥','ç¤¾äº¤è¾¾äºº','è¿½æ±æ°é²'],
    destinations:['æ²³åè¡å¤','èå¤æ»©éå§è¡','æ¥ æºªæ±æ¼'],
    travelStyle:'ç­ç±æ°é²åºæ¿ï¼åæ¬¢å³å´æ¹åè¡ç¨ãå¯¹å¸¸è§è·¯çº¿æä¸èµ·å´è¶£ï¼æ»æ¯å¨å¯»ï¿½?ä¸èµ°å¯»å¸¸ï¿½?çç©æ³',
    pace:'fast', budgetStyle:'experience', color:'#FF6B6B',
    tip:'ä½ çå³å´ç²¾ç¥å¾æ£ï¼ä½è®°å¾æåè®¢å¥½ä½å®¿ï¼é¿åæºå­£æ å¤å¯å»'
  },
  'INFJ': {
    nickname:'çµé­æäºº', emoji:'ð', traits:['æ·±åº¦ä½éª','å¿çµæ²»æ','äººæå³æ'],
    destinations:['æ°¸ç¦å¯ºÂ·æ','å¤å °ç»ä¹¡','æ²å­ä¹å¤'],
    travelStyle:'æè¡æ¯ä¸ºäºå¯»æ¾åå¿çå¹³éä¸æä¹ãåæ¬¢ææäºçå°æ¹ï¼å®¹æè¢«æååºè´åäººææ°æ¯æå¨',
    pace:'slow', budgetStyle:'experience', color:'#B5A3C4',
    tip:'å»ä¸ä¸ªå®éçå°æ¹ï¼å¸¦ä¸æ¬å¥½ä¹¦ï¼è®©å¿çµå¨æéä¸­æ²æ·'
  },
  'INFP': {
    nickname:'æµªæ¼«è¯äºº', emoji:'ð¨', traits:['æèºæ²»æ','ææå±é¸£','èªç±é'],
    destinations:['è¥¿æ¹æ¼«æ­¥','é­åºå­æä¸å','è¥¿è¥¿å¼ä¹¦'],
    travelStyle:'????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????"?????????",
    pace:'slow', budgetStyle:'value', color:'#C4A8A8',
    tip:'å¸¦ä¸ç¸æºåç¬è®°æ¬ï¼è®°å½æéä¸­çæ¯ä¸ä¸ªæå¨ç¬é´'
  },
  'ENFJ': {
    nickname:'æå¿é¢é', emoji:'ð', traits:['å¢éåè','ç§é¡¾ä»äºº','æ­£è½éä¼ '],
    destinations:['ä¹éè¥¿æ ','åæµå¤é','åå²'],
    travelStyle:'æè¡ä¸­æå¼å¿çæ¶å»æ¯çå°åä¼´çç¬è¸ãå¤©çéååæè¡ç­åï¼ä¼ç§é¡¾æ¯ä¸ªäººçæååéæ±',
    pace:'moderate', budgetStyle:'experience', color:'#E8A85A',
    tip:'å¤ä¸ºå¢éåå¤ä¸äºæåå°ç¯èï¼ä½ çç¨å¿å¤§å®¶é½ä¼æåå°'
  },
  'ENFP': {
    nickname:'å¿«ä¹ä¼ æ­', emoji:'ð¦', traits:['ç¤¾äº¤è´è¶','å³å´åæ¥','æ°¸è¿ä¹è§'],
    destinations:['éè¡å±±çµ','æ±å®¶å°å','æ­å·å¨ç©'],
    travelStyle:'æè¡å°±æ¯ä¸åºåé©ï¼åæ¬¢ç»äº¤æ°æåï¼éæºæ¹åè¡ç¨ï¼äº«åæ¯ä¸ä¸ªæå¤æå',
    pace:'fast', budgetStyle:'experience', color:'#FF9A9E',
    tip:'ä¿æä½ çç­æï¼ä½å¶å°ä¹è¦æ³¨æä½ååéï¼å«ç¬¬ä¸å¤©å°±èå°½ææç²¾å'
  },
  'ISTJ': {
    nickname:'é è°±æ§è¡', emoji:'ð', traits:['è®¡åå¨å¯','å¾ªè§è¹ç©','å®å¨ç¬¬ä¸'],
    destinations:['åæ¹é©å½çºªå¿µ','å¤©ä¸','æµæ±çåç©é¦'],
    travelStyle:'æè¡åä¼åè¯¦ç»çæ»ç¥åé¢ç®è¡¨ãåæ¬¢æè®¡åè¡äºï¼ä¸åæ¬¢æå¤ãå¯¹æ¯åºè¯ååæ»ç¥éå¸¸ä¿¡ä»»',
    pace:'moderate', budgetStyle:'value', color:'#6B7BA3',
    tip:'è®¡ååå¾å¾å¥½ï¼ä½çåº20%çå¼¹æ§æ¶é´åºå¯¹çªåç¶åµä¼æ´ä»å®¹'
  },
  'ISFJ': {
    nickname:'æ¸©æå®æ¤', emoji:'ð¡', traits:['ä½è´´å¨å°','æ³¨éç»è','ææ§æ¸©'],
    destinations:['æ¹åæ¥å Â·è¯è³','ç¥å³è§Â·å³','é²è¿æé'],
    travelStyle:'åæ¬¢çæçãææ¸©åº¦çå°æ¹ãä¼ä¸ºæä¼´åå¤å¨å¨ï¼è®°å¾æ¯ä¸ªäººçåå¥½åéæ±',
    pace:'slow', budgetStyle:'value', color:'#A3B5A6',
    tip:'å¶å°å°è¯ä¸ä¸æ°å°æ¹ï¼è¯´ä¸å®ä¼æææ³ä¸å°çæå'
  },
  'ESTJ': {
    nickname:'çºªå¾å§å', emoji:'', traits:['åæ¶é«æ','ç»ç»åå¼º','å¡å®å¯é '],
    destinations:['æµæ±çç§æ','æ­å·å®å','æµ·å®ç®é©'],
    travelStyle:'æ¶é´è§å¿µæå¼ºï¼ä¼ä¸¥æ ¼æè¡ç¨è¡¨æ§è¡ãè´è´£å¢éçåå¤åé¢ç®ç®¡çï¼æ¯ææäººæä¿¡èµçæä¼´',
    pace:'fast', budgetStyle:'value', color:'#8BA88C',
    tip:'??????????????????????????????????????????"??????"????????????"??????""
  },
  'ESFJ': {
    nickname:'ç¤¾äº¤ä¹æ', emoji:'ð', traits:['ç­æå¥½å®¢','ç§é¡¾å¨å°','äº«åç­é¹'],
    destinations:['æ²³åè¡å¤','äºé©¬è¡ç¾','æ²å®¶é¨æµ·é²æ'],
    travelStyle:'åæ¬¢ç­é¹çæè¡æ°å´ï¼æé¿ç»ç»éä½æ´»å¨ãç¾é£åè´­ç©æ¯æè¡çä¸¤å¤§æ ¸å¿ä¹è¶£',
    pace:'moderate', budgetStyle:'experience', color:'#E8945A',
    tip:'å¨ç­é¹ä¹ä½ï¼ä¹ç»èªå·±çä¸äºå®éçæ¶é´æ¢å¤è½é'
  },
  'ISTP': {
    nickname:'å·éæ¢é©', emoji:'ð', traits:['å¨æè½å','å·éç','ç­ç±æ·å¤'],
    destinations:['ä¹æºªçæ ','éè¡å±±çµ','ä¸é±æ¹éª'],
    travelStyle:'????????????????????????????????????????????????????????????????????????????????????????????????"?????????????",
    pace:'fast', budgetStyle:'value', color:'#6B8FA3',
    tip:'ä½ çæ·å¤æè½å¾æ£ï¼ä½å®å¨ç¬¬ä¸ï¼è®°å¾æ£æ¥è£å¤åå¤©æ°'
  },
  'ISFP': {
    nickname:'æå®èºæ¯', emoji:'ðµ', traits:['å®¡ç¾æé','äº«åå½ä¸','æ¸©æå®é'],
    destinations:['äºåæ¢¯ç°','è¥¿å¡å¤é','èå ¤éªè¡'],
    travelStyle:'éè¿æå®ä½éªä¸çï¼ç¾æ¯ãç¾é£ãç¾ç©é½æ¯ä½ çæè¡çæãåæ¬¢ç¨ç§çè®°å½ç¾å¥½ç¬é´',
    pace:'slow', budgetStyle:'experience', color:'#B5A3C4',
    tip:'å¸¦ä¸ä½ çç¸æºæç»æ¬ï¼è¿ä¸ªä¸çæå¾å¤å¼å¾ä½ è®°å½çç¾å¥½'
  },
  'ESTP': {
    nickname:'è¡å¨æ´¾ç©', emoji:'ð', traits:['è¡å¨åå¼º','äº«ååºæ¿','ç¤¾äº¤æ´»è·'],
    destinations:['æ¥ æºªæ±æ¼','æ±å®¶å°å','æ­å·å®å'],
    travelStyle:'?????????????????????????????????????????????????????????????????????????????????????????????"??????????",
    pace:'fast', budgetStyle:'experience', color:'#FF6B6B',
    tip:'åºæ¿å½åºæ¿ï¼åºååè¿æ¯è¦åå¥½åºæ¬çå®å¨åå¤'
  },
  'ESFP': {
    nickname:'æ´¾å¯¹è¾¾äºº', emoji:'ð', traits:['æ´»å¨å½ä¸','ææåå¼º','äº«åçæ´»'],
    destinations:['èå¤æ»©éå§è¡','æ²³åè¡å¤','æ¹æ»¨é¶æ³°in77'],
    travelStyle:'æè¡çæ¬è´¨å°±æ¯äº«åï¼åæ¬¢ç¾é£ãè´­ç©ãæ´¾å¯¹ï¼æ¯æååéæä¼ç©çäºº',
    pace:'fast', budgetStyle:'experience', color:'#FF9A9E',
    tip:'ä½ çç­æå¾æææåï¼ä½è®°å¾å³æ³¨é¢ç®ï¼å«è®©æè¡åçè´¦åæ¯äºåå¿'
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
  nextBtn.textContent = mbtiCurrentQuestion === mbtiQuestions.length - 1 ? 'ï¿½?æ¥çç»æ' : 'ä¸ä¸ï¿½?';
  nextBtn.disabled = !mbtiAnswers[q.id];

  var html = '<div class="mbti-question-block">';
  html += '<div class="mbti-question-num">????' + (mbtiCurrentQuestion + 1) + ' / ' + mbtiQuestions.length + ' '/div>';
  html += '<div class="mbti-question-text">' + q.text + '</div>';
  html += '<div class="mbti-options">';
  q.options.forEach(function(opt) {
    var selected = mbtiAnswers[q.id] === opt.value;
    html += '<div class="mbti-option' + (selected ? ' selected' : '') + '" onclick="selectMbtiOption(\'' + q.id + '\', \'' + opt.value + '\')" style="--mbti-accent:' + activeMoodColor + '">';
    html += '<div style="font-size:28px;margin-bottom:6px">' + opt.label.split(' ')[0] + '</div>';
    html += '<div style="font-size:13px;color:rgba(255,255,255,0.5)">' + opt.desc + '</div>';
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
  // è®¡ç® MBTI ç±»å
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

  // ä¿å­ï¿½?localStorage
  try { localStorage.setItem('moodtravel_mbti', JSON.stringify(mbtiResult)); } catch(e) {}

  // æ ¹æ® MBTI ç»æè°æ´å¿æåå¥½
  applyMbtiToMood(profile, travelStyle);

  showMbtiResult();
}

function applyMbtiToMood(profile, travelStyle) {
  // æ ¹æ®äººæ ¼ç±»åå¾®è°å¿ææ¨è
  var mbtiMoodMap = {
    'INTJ':'calm','INTP':'calm','ENTJ':'excited','ENTP':'excited',
    'INFJ':'sad','INFP':'sad','ENFJ':'happy','ENFP':'happy',
    'ISTJ':'tired','ISFJ':'tired','ESTJ':'happy','ESFJ':'happy',
    'ISTP':'excited','ISFP':'calm','ESTP':'excited','ESFP':'excited'
  };
  var suggestedMood = mbtiMoodMap[mbtiResult.type] || 'calm';
  // ä¸å¼ºå¶åæ¢ï¼ä½ç»åºæ'
  showToast('ð§­ ä½ çæè¡äººæ ¼ï¼' + profile.nickname + 'ãå·²è§£éï¼æ¨èå¿æï¼' + (MOODS.find(function(m){return m.key===suggestedMood})||{}).label);
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
  html += '<div class="mbti-result-section-title">ð¯ æè¡é£æ ¼</div>';
  html += '<div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7">' + profile.travelStyle + '</div>';
  html += '</div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">???? ????????????"/div>';
  html += '<div class="mbti-result-destinations">';
  profile.destinations.forEach(function(d) {
    html += '<span class="mbti-dest-chip" onclick="searchMbtiDest(\'' + d + '\')">' + d + '</span>';
  });
  html += '</div></div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">ð¡ æè¡è´´å£«</div>';
  html += '<div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7">' + profile.tip + '</div>';
  html += '</div>';

  html += '<div class="mbti-result-section">';
  html += '<div class="mbti-result-section-title">ð è¿é¶ç»´åº¦</div>';
  html += '<div style="display:flex;gap:16px;font-size:13px;color:rgba(255,255,255,0.6)">';
  html += '<div>å³ç­é£æ ¼ï¿½?strong style="color:#fff">' + (mbtiResult.ao === 'A' ? 'ææ­' : 'æ·±æå') + '</strong></div>';
  html += '<div>ç¤¾äº¤å¾åï¿½?strong style="color:#fff">' + (mbtiResult.hc === 'H' ? 'æ¸©æ' : 'ç¬ç«') + '</strong></div>';
  html += '<div>æè¡èå¥ï¿½?strong style="color:#fff">' + (mbtiResult.travelStyle === 'fast' ? 'å¿«è' : 'æ¢è') + '</strong></div>';
  html += '</div></div>';

  html += '<div class="mbti-result-actions">';
  html += '<button class="mbti-result-btn mbti-btn-primary" onclick="applyMbtiAndGenerate()">??????????????????????"/button>';
  html += '<button class="mbti-result-btn mbti-btn-secondary" onclick="closeMbtiResult()">å³é­</button>';
  html += '</div>';

  card.innerHTML = html;
  document.getElementById('mbtiQuizOverlay').classList.remove('show');
  document.getElementById('mbtiResultOverlay').classList.add('show');

  // æ´æ°å¥å£æé®
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
    // æ ¹æ® MBTI è®¾ç½®æä½³å¿'
    var mbtiMoodMap = {
      'INTJ':'calm','INTP':'calm','ENTJ':'excited','ENTP':'excited',
      'INFJ':'sad','INFP':'sad','ENFJ':'happy','ENFP':'happy',
      'ISTJ':'tired','ISFJ':'tired','ESTJ':'happy','ESFJ':'happy',
      'ISTP':'excited','ISFP':'calm','ESTP':'excited','ESFP':'excited'
    };
    var suggestedMood = mbtiMoodMap[mbtiResult.type] || 'calm';
    selectMood(suggestedMood);

    // æ ¹æ®èå¥è®¾ç½®å¤©æ°
    if (mbtiResult.travelStyle === 'fast') days = 3;
    else if (mbtiResult.travelStyle === 'slow') days = 2;

    // æ ¹æ®é¢ç®é£æ ¼è°æ´
    if (mbtiResult.budgetStyle === 'experience' && budget < 3000) {
      budget = 3000;
      displayBudget = 3000;
    }

    showToast('ð§­ å·²æ' + profile.nickname + 'ãäººæ ¼ä¼åè¡ç¨åæ°ï¼');
  }
  doGenerate();
}

// å è½½å·²ä¿å­ç MBTI ç»æ
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
//  æè¡æä¿¡ççæå¨
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

  // æ ¹æ®é£æ ¼è®¾ç½®èæ¯
  var styles = {
    watercolor: { bg:'#f5efe6', accent:'#8BA88C', text:'#3a3a3a', stamp:'#d4a574' },
    vintage: { bg:'#f4e4c1', accent:'#8B4513', text:'#4a3728', stamp:'#c4956a' },
    minimal: { bg:'#ffffff', accent:'#333333', text:'#1a1a1a', stamp:'#888888' },
    night: { bg:'#1a1a2e', accent:'#8BA88C', text:'#e0e0e0', stamp:'#6B7BA3' }
  };
  var s = styles[postcardStyle];

  // èæ¯
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, w, h);

  // è¾¹æ¡
  ctx.strokeStyle = s.accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, w - 30, h - 30);

  // è£é¥°'
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

  // æ é¢
  ctx.fillStyle = s.accent;
  ctx.font = 'bold 32px "Playfair Display", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Greetings from', w / 2, 80);

  // åå¸'
  var cities = [];
  if (itinerary && itinerary.length) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
      });
    });
  }
  var cityName = cities.length > 0 ? cities.join(' Â· ') : 'æµæ±';
  ctx.fillStyle = s.text;
  ctx.font = 'bold 48px "Playfair Display", serif';
  ctx.fillText(cityName, w / 2, 140);

  // å¿ææ ç­¾
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood})||{}).label || 'å¹³é';
  ctx.fillStyle = s.accent;
  ctx.globalAlpha = 0.6;
  ctx.font = 'italic 18px "Playfair Display", serif';
  ctx.fillText('~ ' + moodLabel + 'ä¹æ ~', w / 2, 175);
  ctx.globalAlpha = 1;

  // é®ç¥¨
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
  ctx.fillText('', w - 65, 100);

  // åºé¨ä¿¡æ¯
  ctx.fillStyle = s.accent;
  ctx.globalAlpha = 0.5;
  ctx.font = '12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MoodTravel Â· è®©æ¯ä¸æ¬¡åºåé½ææ¸©', w / 2, h - 60);
  ctx.fillText('Generated with AI Â· moodtravel.app', w / 2, h - 40);
  ctx.globalAlpha = 1;

  // è£é¥°æ§æåä½
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
  showToast('ð¥ æä¿¡çå·²ä¸è½½');
}

// ================================================================
//  æè¡è´¹ç¨åæ'
// ================================================================
var expenseMembers = [
  { name:'', avatar:'ð§', amount:0 },
  { name:'æä¼´A', avatar:'ð¤', amount:0 }
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
    html += '<input class="expense-member-name" value="' + m.name + '" onchange="expenseMembers[' + i + '].name=this.value" placeholder="å§å">';
    html += '<span style="color:rgba(255,255,255,0.5)">Â¥</span>';
    html += '<input class="expense-member-input" type="number" value="' + m.amount + '" onchange="expenseMembers[' + i + '].amount=parseFloat(this.value)||0" placeholder="0">';
    if (expenseMembers.length > 1) {
      html += '<button class="expense-remove-btn" onclick="removeExpenseMember(' + i + ')">"/button>';
    }
    html += '</div>';
  });
  list.innerHTML = html;
}

function addExpenseMember() {
  expenseMembers.push({ name:'æä¼´' + (expenseMembers.length), avatar:'ð¤', amount:0 });
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

  var html = '<div class="expense-summary-row"><span>??????"/span><span>??' + totalBudget.toLocaleString() + '</span></div>';
  html += '<div class="expense-summary-row"><span>??????"/span><span>??' + totalPaid.toLocaleString() + '</span></div>';
  html += '<div class="expense-summary-row total"><span>äººååºæ</span><span>Â¥' + Math.round(perPerson).toLocaleString() + '</span></div>';

  html += '<div class="expense-per-person">';
  expenseMembers.forEach(function(m) {
    var diff = Math.round(m.amount - perPerson);
    var status = diff >= 0 ? '<span style="color:#8BA88C">å¤ä» Â¥' + diff.toLocaleString() + '</span>' : '<span style="color:#E8A85A">éï¿½?Â¥' + Math.abs(diff).toLocaleString() + '</span>';
    html += '<div class="expense-pp-row"><span>' + m.avatar + ' ' + m.name + '</span>' + status + '</div>';
  });
  html += '</div>';

  summary.innerHTML = html;
  summary.style.display = 'block';
}

// ================================================================
//  æºè½ä»·æ ¼é¢æµ ï¿½?AI é©±å¨çæä½³é¢è®¢æ¶'
// ================================================================
function predictBestTime() {
  var now = new Date();
  var month = now.getMonth() + 1;
  var dayOfWeek = now.getDay();
  var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  var predictions = {
    hotel: { currentPrice: 0, predictedLow: 0, bestDay: '', trend: '', confidence: 0 },
    tickets: { currentPrice: 0, predictedLow: 0, bestDay: '', trend: '', confidence: 0 },
    transport: { currentPrice: 0, predictedLow: 0, bestDay: '', trend: '', confidence: 0 }
  };

  var hotelBase = hotel ? hotel.pricePerNight : 350;
  var hotelSeasonMultiplier = 1;
  if (month === 7 || month === 8) hotelSeasonMultiplier = 1.3;
  if (month === 10 && dayOfWeek >= 0) hotelSeasonMultiplier = 1.4;
  if (isWeekend) hotelSeasonMultiplier *= 1.15;

  predictions.hotel.currentPrice = Math.round(hotelBase * hotelSeasonMultiplier);
  predictions.hotel.predictedLow = Math.round(hotelBase * 0.85);
  predictions.hotel.bestDay = isWeekend ? 'ä¸å¨' : 'ä»å¤©';
  predictions.hotel.trend = hotelSeasonMultiplier > 1.2 ? 'ð æºå­£ä¸æ¶¨' : 'ð ä»·æ ¼å¹³ç¨³';
  predictions.hotel.confidence = 85;

  var ticketBase = stats ? (stats.totalCost / (days || 2)) * 0.3 : 200;
  predictions.tickets.currentPrice = Math.round(ticketBase);
  predictions.tickets.predictedLow = Math.round(ticketBase * 0.9);
  predictions.tickets.bestDay = 'æå3å¤©é¢';
  predictions.tickets.trend = 'ð ä»·æ ¼ç¨³å®';
  predictions.tickets.confidence = 72;

  predictions.transport.currentPrice = Math.round(budget * 0.25);
  predictions.transport.predictedLow = Math.round(budget * 0.2);
  predictions.transport.bestDay = 'æå7';
  predictions.transport.trend = 'ð ä¸´è¿åºåä¸æ¶¨';
  predictions.transport.confidence = 90;

  return predictions;
}

function renderPricePrediction() {
  var section = document.getElementById('pricePredictionSection');
  if (!section) return;
  section.classList.add('show');

  var predictions = predictBestTime();
  var cards = [
    { icon:'ð¨', label:'éåºä½å®¿', p: predictions.hotel },
    { icon:'ð«', label:'æ¯ç¹é¨ç¥¨', p: predictions.tickets },
    { icon:'ð', label:'äº¤éåº', p: predictions.transport }
  ];

  var html = '';
  cards.forEach(function(c) {
    var saving = c.p.currentPrice - c.p.predictedLow;
    html += '<div class="carbon-detail-row" style="padding:14px 0">';
    html += '<span>' + c.icon + ' ' + c.label + '</span>';
    html += '<span class="carbon-detail-val">' + c.p.trend + '</span>';
    html += '</div>';
    html += '<div class="carbon-detail-row" style="font-size:12px;color:rgba(255,255,255,0.4)">';
    html += '<span>æä½³é¢è®¢ï¼' + c.p.bestDay + '</span>';
    html += '<span style="color:#8BA88C">å¯ç Â¥' + saving.toLocaleString() + '</span>';
    html += '</div>';
  });

  document.getElementById('pricePredictionContent').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  // å è½½ API éç½®
  loadApiConfig();
  loadMbtiResult();
  // å¦æä¿å­ï¿½?API keyï¼èªå¨å¡«'
  if (API_CONFIG.llm.apiKey) {
    var llmInput = document.getElementById('llmApiKeyInput');
    if (llmInput) llmInput.value = API_CONFIG.llm.apiKey;
  }
  if (API_CONFIG.weather.apiKey) {
    var weatherInput = document.getElementById('weatherApiKeyInput');
    if (weatherInput) weatherInput.value = API_CONFIG.weather.apiKey;
  }

  // åå§ååºæ¯åï¿½?UIï¼é»è®¤ææ¸¸æ¨¡å¼æè²ï¼
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

  // åæ åæææ
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

  // æé®æ¶æ¼ªææ
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

  // ä¸ºææäº¤äºæé®æ·»å å¾®åé¦
  document.querySelectorAll('button, .mood-option, .card-hover').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.transition = 'all 0.2s var(--ease-out-expo)';
    });
    el.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

});

// ================================================================
//  åä¼´ç³»ç»
// ================================================================
function selectCompanion(key) {
  companionType = key;
  hasKids = (key === 'family');
  hasElderly = (key === 'family');
  isCouple = (key === 'couple');
  isFriends = (key === 'friends');
  isBusiness = (key === 'business');
  updateCompanionStyles();
  // èªå¨åæ¢åºæ¯ï¼åå¡åäºå®ç¨åºè¡æ¨¡'
  if (key === 'business' && travelMode !== 'business') {
    travelMode = 'business';
    updateSceneToggle();
  } else if (key !== 'business' && travelMode === 'business') {
    travelMode = 'tourism';
    updateSceneToggle();
  }
  var ct = COMPANION_TYPES.find(function(c) { return c.key === key; });
  showToast(ct.icon + ' å·²åæ¢è³' + ct.label + 'ãï¿½?' + ct.paceLabel);
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
//  é¿èæ¨¡'
// ================================================================
function toggleElderlyMode() {
  elderlyMode = !elderlyMode;
  document.getElementById('elderlyCheckbox').checked = elderlyMode;
  showToast(elderlyMode ? 'å·²å¼å¯é¿è¾å³ææ¨¡å¼' : 'å·²å³é­é¿è¾å³ææ¨¡å¼');
}

document.getElementById('elderlyCheckbox').addEventListener('change', function() {
  elderlyMode = this.checked;
  showToast(elderlyMode ? 'å·²å¼å¯é¿è¾å³ææ¨¡å¼' : 'å·²å³é­é¿è¾å³ææ¨¡å¼');
});

// ================================================================
//  æ¥å¸¸åºæ¯
// ================================================================
function selectScenario(key) {
  if (activeScenario === key) { activeScenario = null; }
  else { activeScenario = key; }
  updateScenarioStyles();
  renderDailySpots();
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
  var html = '';
  // ä»æ¥æ¨èå¡çï¼æ¯å¤©éæºéä¸ä¸ªï¼
  var allSpots = TRAVEL_SPOTS.filter(function(s) { return s.priceRange; });
  if (allSpots.length > 0) {
    var todaySeed = new Date().getDate() + new Date().getMonth() * 31;
    var rec = allSpots[todaySeed % allSpots.length];
    html += '<div class="daily-recommend-card"><div class="daily-recommend-badge">ð¥ ä»æ¥æ¨è</div><div class="daily-recommend-body"><span class="daily-recommend-emoji">' + (rec.emoji || 'ð') + '</span><div class="daily-recommend-info"><span class="daily-recommend-title">' + rec.title + '</span><span class="daily-recommend-desc">' + (elderlyMode && rec.elderDesc ? rec.elderDesc : rec.description) + '</span><div class="daily-recommend-meta"><span>ï¿½?' + (rec.rating || '4.0') + '</span><span>ð° ' + (rec.priceRange || 'å®æ ') + '</span><span>ð ' + (rec.openHours || 'å¨å¤©') + '</span><span>ð ' + rec.distance + 'm</span></div></div></div></div>';
  }
  html += spots.map(function(s) {
    var desc = elderlyMode && s.elderDesc ? s.elderDesc : s.description;
    var cardHtml = '<div class="daily-spot-card"><span class="daily-spot-emoji">' + (s.emoji || 'ð') + '</span><div class="daily-spot-info"><span class="daily-spot-title">' + s.title + '</span><span class="daily-spot-desc">' + desc + '</span>';
    if (s.priceRange || s.rating || s.openHours) {
      cardHtml += '<div class="daily-spot-meta">';
      if (s.rating) cardHtml += '<span class="daily-spot-meta-item">ï¿½?' + s.rating + '</span>';
      if (s.priceRange) cardHtml += '<span class="daily-spot-meta-item">ð° ' + s.priceRange + '</span>';
      if (s.openHours) cardHtml += '<span class="daily-spot-meta-item">ð ' + s.openHours + '</span>';
      if (s.bestVisit) cardHtml += '<span class="daily-spot-meta-item">ð æä½³ï¼' + s.bestVisit + '</span>';
      cardHtml += '</div>';
    }
    cardHtml += '</div><span class="daily-spot-dist">' + s.distance + 'm</span></div>';
    return cardHtml;
  }).join('');
  container.innerHTML = html;
}

// ================================================================
//  é¢ç®ç³»ç»ï¼å¨æåº'+ æ ¡éª'
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
    budgetWarningEl.textContent = 'â ï¸ é¢ç®å¯è½ä¸å¤å¦ï¼' + days + 'å¤©è¡ç¨å»ºè®®è³ï¿½?Â¥' + range.min.toLocaleString() + '\u2713';
    budgetWarningEl.className = 'budget-validation-warning';
    budgetWarningEl.style.display = 'flex';
  } else if (val > range.max * 2.5) {
    budgetWarningEl.textContent = 'ð å·²ä¸ºæ¨å¼å¯å¥¢åæ¨¡';
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
  document.getElementById('budgetMinLabel').textContent = 'Â¥' + range.min.toLocaleString();
  document.getElementById('budgetMaxLabel').textContent = 'Â¥' + range.max.toLocaleString();
  // å¦æå½åé¢ç®è¶åºæ°åºé´ï¼èªå¨è°æ´
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
//  æ¹æ¡å¡ç
// ================================================================
function renderPlanCards() {
  plansWaterfall.innerHTML = '';
  visibleCards.forEach(function(card) {
    var steps = card.showBack ? card.planB : card.planA;
    var stats = card.showBack ? card.planBStats : card.planAStats;
    var html = '<div class="plan-card glass-panel"><div class="plan-card-header">' +
      '<span class="plan-card-mood" style="background:' + card.color + '22;color:' + card.color + '">' + card.moodLabel + '</span>' +
      '<button class="plan-card-switch" style="color:' + activeMoodColor + '">' + (card.showBack ? 'æ¹æ¡A' : 'æ¹æ¡B') + '</button>' +
      '</div><div class="plan-card-route">';
    steps.forEach(function(step) {
      html += '<div class="plan-route-step"><span class="plan-step-time">' + step.time + '</span><span class="plan-step-dot" style="background:' + card.color + '"></span><span class="plan-step-name">' + step.name + '</span></div>';
    });
    html += '</div><div class="plan-card-footer"><div class="plan-card-stats"><span>' + stats.steps + '</span><span>' + stats.time + '</span><span>' + stats.budget + '</span></div>' +
      '<button class="plan-card-book" style="background:' + activeMoodColor + '">é¢è®¢</button></div></div>';
    plansWaterfall.innerHTML += html;
  });
  planCount.textContent = visibleCards.length + ' ';
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
  showToast(card.moodLabel + ' Â· ' + (card.showBack ? 'æ¹æ¡B' : 'æ¹æ¡A'));
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
//  é¢è®¢æ¯ä»·å¼¹çª
// ================================================================
function showBookingPopup(label) {
  var overlay = document.getElementById('bookingPopupOverlay');
  var text = document.getElementById('bookingPopupText');
  var spinner = document.getElementById('bookingSpinner');
  var list = document.getElementById('platformList');
  var footer = document.getElementById('bookingPopupFooter');

  var basePrice = 300 + Math.floor(Math.random() * 500);
  overlay.classList.add('show');
  text.textContent = '?????????????????? ' + PLATFORM_LIST.length + ' ??????'..';
  spinner.style.display = 'block';
  list.innerHTML = '';
  footer.style.display = 'none';

  var platforms = PLATFORM_LIST.map(function(p) {
    return { name: p.name, icon: p.icon, price: Math.round(basePrice * (p.baseMultiplier + (Math.random() - 0.5) * 0.15)) };
  }).sort(function(a, b) { return a.price - b.price; });

  list.innerHTML = platforms.map(function(p) {
    return '<div class="platform-item"><span class="platform-icon">' + p.icon + '</span><span class="platform-name">' + p.name + '</span><span class="platform-wait">??????"..</span></div>';
  }).join('');

  var i = 0;
  var timer = setInterval(function() {
    var items = list.querySelectorAll('.platform-item');
    if (i < platforms.length) {
      var item = items[i];
      item.classList.add('checked');
      var wait = item.querySelector('.platform-wait');
      if (wait) { wait.className = 'platform-price'; wait.textContent = 'Â¥' + platforms[i].price; }
      i++;
    }
    if (i >= platforms.length) {
      clearInterval(timer);
      setTimeout(function() {
        spinner.style.display = 'none';
        text.textContent = 'æ¯ä»·å®æ';
        footer.style.display = 'block';
        var best = platforms[0];
        var worst = platforms[platforms.length - 1];
        footer.innerHTML = '<span class="booking-best">ð ' + best.name + ' æä¼æ ï¼ä»é Â¥' + best.price + '</span>' +
          '<span class="booking-save">å·²ä¸ºæ¨èï¿½?Â¥' + (worst.price - best.price) + '</span>' +
          '<button class="booking-action-btn" style="background:' + activeMoodColor + '" onclick="closeBookingPopup()">åå¾é¢è®¢</button>';
      }, 500);
    }
  }, 600);
}

function closeBookingPopup() {
  document.getElementById('bookingPopupOverlay').classList.remove('show');
  if (bookingTimer) { clearInterval(bookingTimer); bookingTimer = null; }
}

// ================================================================
//  Toast
// ================================================================
function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

// ================================================================
//  è¾å©
// ================================================================
function scrollToContent() { var el = document.querySelector('.budget-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

function updateGenerateBtn() {
  var btn = document.getElementById('generatePlanBtn');
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  btn.style.background = 'linear-gradient(135deg, ' + theme.secondary + ', ' + theme.primary + ')';
  btn.style.boxShadow = '0 6px 20px ' + theme.primary + '40';
}

function getWeightKey() {
  var k = companionType; // solo, couple, friends, family, business
  var key = activeMood + '_' + k;
  return WEIGHT_MATRIX[key] || WEIGHT_MATRIX['default'];
}

function fmtTime(h) {
  var hh = Math.floor(h); var mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function genReason(poi) {
  var s = poi._scores; var reasons = [];
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label;
  
  // å¿æå¹é'
  if (s.moodScore > 25) reasons.push('ð¯ ' + moodLabel + 'å¿æé«åº¦å¹éï¼ä¸å±æ¨');
  else if (s.moodScore > 15) reasons.push('ï¿½?éåå½å' + moodLabel + 'å¿æç¶');
  
  // é¢ç®å¹é
  if (s.budgetScore > 20) reasons.push(poi.ticketPrice === 0 ? 'ð° åè´¹æ¯ç¹ï¼é¶é¢ç®åå' : 'ð° è¶é«æ§ä»·æ¯ä¹');
  else if (s.budgetScore > 15) reasons.push('ðµ ä»·æ ¼åçï¼é¢ç®å');
  
  // ä½åå¹é
  if (s.energyScore > 20) {
    if (activeMood === 'tired' || activeMood === 'sad') reasons.push('ðï¿½?ä½ä½åæ¶èï¼éåæ¾æ¾');
    else reasons.push('ï¿½?ä½åæ¶èéä¸­ï¼ååå¥½');
  }
  
  // æä¼´æç¥
  if (isCouple && s.coupleScore > 20) reasons.push('ð æä¾£æµªæ¼«ä¹éï¼ç§å¯æ°å´æ»¡å');
  if (isCouple && poi.romanticLevel >= 4) reasons.push('ð¹ å·²ä¸ºæ¨é¿å¼æ¥æ¤ï¼é¢çåè¶³äºäººæ¶');
  if (isFriends && poi.hasPhotoSpot) reasons.push('ð¸ éºèåºçå£å°ï¼éæä¸æé½æ¯å¤§');
  if (isFriends && poi.category === 'shopping') reasons.push('ðï¿½?éåéåï¼éºèå¿«ä¹æº');
  if (hasKids && s.kidScore > 15) reasons.push('ð¶ äº²å­åå¥½ï¼å¸¦å¨æ ');
  if (hasKids && poi.hasNursingRoom) reasons.push('ð¼ éå¤æ¯å©´å®¤ï¼å®å¦å®å¿');
  if (hasElderly && s.elderlyScore > 15) reasons.push('ð´ é¿è¾åå¥½ï¼èéå®');
  if (hasElderly && poi.wheelchairAccessible) reasons.push('ï¿½?æ éç¢ééï¼èäººåºè¡æ å¿§');
  if (isBusiness && poi.energyLevel <= 1) reasons.push('ð¼ é«æåå¡ä¹éï¼çæ¶çå¿');
  if (isBusiness && poi.noiseLevel <= 2) reasons.push('ð¤« å®éå¾ä½ï¼éååå¡ç¨é¤');
  
  // åºæ¯æç¥
  if (poi.weatherSensitivity === 'indoor' && window._weatherData && window._weatherData.isRain) {
    reasons.push('ð  å®¤åæ¯ç¹ï¼é¨å¤©æ ');
  }
  
  return reasons.join('') || 'ï¿½?ç»¼åå¹éæ¨èï¼å¼å¾ä½éª';
}

function genTags(poi) {
  var s = poi._scores; var tags = [];
  if (s.moodScore > 20) tags.push('å¿æå¹é');
  if (s.budgetScore > 15) tags.push(poi.ticketPrice === 0 ? 'åè´¹æ¯ç¹' : 'é«æ§ä»·');
  if (isCouple && poi.romanticLevel >= 4) tags.push('æµªæ¼«çº¦ä¼');
  if (isCouple && poi.hasPhotoSpot) tags.push('æç§æå¡');
  if (hasKids && poi.hasNursingRoom) tags.push('æ¯å©´');
  if (hasKids && poi.strollerFriendly) tags.push('æ¨è½¦åå¥½');
  if (hasElderly && poi.wheelchairAccessible) tags.push('æ é');
  if (hasElderly && poi.restSeats >= 4) tags.push('ä¼æ¯åè¶³');
  if (hasElderly && poi.nearMedical) tags.push('è¿å»çç¹');
  if (hasElderly && poi.hasPrivateRoom) tags.push('æå');
  if (isFriends && poi.hasPhotoSpot) tags.push('åºçå£å°');
  if (isFriends && poi.category === 'shopping') tags.push('éåéå');
  if (isBusiness && poi.energyLevel <= 1) tags.push('é«æåºè¡');
  if (isBusiness && poi.noiseLevel <= 2) tags.push('å®éå¾ä½');
  return tags;
}

function genHotelReason(h) {
  var reasons = [];
  if (h.moodScores[activeMood] >= 8) reasons.push('å½åå¿æé«åº¦å¹é');
  if (h.priceRangeLow <= budget * 0.3) reasons.push('é¢ç®åå¥½');
  if (h.rating >= 4.5) reasons.push('é«è¯åæ¨');
  if (isCouple) reasons.push('ç§å¯æ§å¥½ï¼éåæä¾£å¥ä½');
  if (hasKids && h.kidsFriendly) reasons.push('äº²å­åå¥½ï¼å¿ç«¥è®¾æ½é½');
  if (hasElderly && h.elderlyFriendly) reasons.push('èäººåå¥½ï¼æ éç¢è®¾æ½å®å');
  if (isFriends && h.has_pool) reasons.push('éºèæ³³æ± æ´¾å¯¹é¦');
  if (isBusiness && h.businessFriendly) reasons.push('åå¡åºè¡é¦éï¼äº¤éä¾¿');
  if (isBusiness && h.nearTransport) reasons.push('é è¿äº¤éæ¢çº½ï¼åºè¡é«æ');
  return reasons.join('') || 'ç»¼åæ¨è';
}

// ================================================================
//  åºæ¯åæ¢
// ================================================================
function switchScene(mode) {
  travelMode = mode;
  updateSceneToggle();
  if (mode === 'tourism') {
    showToast('ð§¡ å·²åæ¢è³ãä¼é²ææ¸¸ãæ¨¡ï¿½?ï¿½?æ¾æ¾èº«å¿ï¼æ¢ç´¢ç¾');
  } else {
    showToast('ð å·²åæ¢è³ãåï¿½?æ¥å¸¸åºè¡ãæ¨¡ï¿½?ï¿½?é«æä¾¿æ·ï¼çæ¶ç');
  }
}

function updateSceneToggle() {
  var toggle = document.getElementById('sceneToggle');
  var btns = document.querySelectorAll('.scene-btn');
  btns.forEach(function(btn) {
    if (btn.dataset.scene === travelMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  // æè²ï¿½?#FFA500ï¼ææ¸¸ï¼ vs å·è²ï¿½?#4682B4ï¼åºè¡ï¼
  if (travelMode === 'tourism') {
    toggle.classList.add('warm');
    toggle.classList.remove('cool');
    document.querySelector('.scene-btn[data-scene="tourism"] .scene-desc').textContent = 'æ¾æ¾èº«å¿ Â· æ¢ç´¢ç¾å¥½ Â· èªå¨æ¼«æ¸¸';
    document.querySelector('.scene-btn[data-scene="business"] .scene-desc').textContent = 'æçä¼å Â· äº¤éä¾¿ï¿½?Â· çæ¶';
  } else {
    toggle.classList.add('cool');
    toggle.classList.remove('warm');
    document.querySelector('.scene-btn[data-scene="tourism"] .scene-desc').textContent = 'æ¾å¼ï¿½?Â· æå¡ï¿½?Â· ä¼æ¯æ¶é´';
    document.querySelector('.scene-btn[data-scene="business"] .scene-desc').textContent = 'é«æåºè¡ Â· äº¤éæ¢ï¿½?Â· å¿«æ·é¤é¥®';
  }
}

// ================================================================
//  4å±æ¼æå¼æï¼å¢å¼ºçï¼ååº'+ ???????????? + ???????????? + Plan B + ??????????????????
// ================================================================
function doGenerate() {
  var weights = getWeightKey();
  var dailyBudget = budget / days;
  var energyIdeal = MOOD_ENERGY_MAP[activeMood] || 2;

  // ================================================================
  //  å¢å¼ºç®æ³ï¼å­£èæ§æºè½è°'
  // ================================================================
  var now = new Date();
  var month = now.getMonth() + 1;
  var season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  var seasonLabels = { spring:'ð¸ ', summer:'âï¿½?', autumn:'ð ', winter:'âï¸ ' };

  // ================================================================
  //  å¢å¼ºç®æ³ï¼å¿æå°POIç±»åçæºè½æ '
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
  //  å¢å¼ºç®æ³ï¼æä¼´ç±»åæºè½è°'
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
  //  å¢å¼ºç®æ³ï¼å¤©æ°æºè½éé
  // ================================================================
  var weatherCondition = 'unknown';
  if (typeof currentWeather !== 'undefined' && currentWeather && currentWeather.condition) {
    weatherCondition = currentWeather.condition;
  }
  var weatherPoiBoost = {};
  if (weatherCondition.indexOf('') !== -1) {
    weatherPoiBoost = { indoor: 1.8, museum: 1.6, shopping: 1.5, food: 1.4, temple: 1.3 };
    weatherPoiBoost.outdoor = 0.3; weatherPoiBoost.nature = 0.4; weatherPoiBoost.adventure = 0.2;
  } else if (weatherCondition.indexOf('') !== -1) {
    weatherPoiBoost = { outdoor: 1.5, nature: 1.4, adventure: 1.3, landmark: 1.3 };
  }

  // ================================================================
  //  å¢å¼ºç®æ³ï¼æ¶é´ç²¾åæ²ï¿½?ï¿½?è¡ç¨èå¥ä¼å
  // ================================================================
  var energyCurve = [];
  for (var d = 0; d < days; d++) {
    energyCurve.push({
      morning: 0.9 - (d * 0.05),   // æ¯å¤©æ©ä¸ç²¾åéæ¸ä¸é
      afternoon: 0.75 - (d * 0.08),
      evening: 0.6 + (d * 0.05)    // æä¸å¯ä»¥å®æè½»æ¾æ´»å¨
    });
  }

  // LAYER 1: ç¡¬è¿'+ ????????????
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
    // ææ¸¸æ¨¡å¼ï¼è¿æ»¤çº¯åå¡ç±»ï¼åºè¡æ¨¡å¼ï¼è¿æ»¤é«ä½åæ¯ç¹
    if (travelMode === 'tourism' && poi.category === 'business') return false;
    if (travelMode === 'business' && poi.energyLevel >= 4) return false;
    // ð¡ï¿½?é²åé¿é·ï¼æï¿½?ï¿½?è¿æ»¤ç½çº¢æéåºï¼å®¹æå¼åäºåµ'
    if (isCouple && poi.category === 'restaurant' && poi.queueTime >= 30) return false;
    // ð¡ï¿½?é²åé¿é·ï¼æï¿½?ï¿½?è¿æ»¤è¡ç¨è¿æ»¡çé«ä½åæ¯ç¹
    if (isCouple && poi.energyLevel >= 4) return false;
    // ð¡ï¿½?é²åé¿é·ï¼åå¡åï¿½?ï¿½?è¿æ»¤è¿äºç§å¯/æ°å´æ§æ§çé¤'
    if (isBusiness && poi.category === 'restaurant' && poi.romanticLevel >= 4) return false;
    // ð¡ï¿½?é²åé¿é·ï¼åå¡åï¿½?ï¿½?è¿æ»¤åæç¯å¢
    if (isBusiness && poi.category === 'restaurant' && poi.noiseLevel >= 4) return false;
    // ð¡ï¿½?é²åé¿é·ï¼é¿ï¿½?äº²å­ ï¿½?è¿æ»¤é«ä½ï¿½?ç¬å±±'
    if (hasElderly && poi.energyLevel >= 3 && (poi.tags || []).indexOf('å¾æ­¥') !== -1) return false;
    return true;
  });

  // LAYER 2: å¤ç»´è¯å
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

    // ð¯ å¥½åæ¨¡å¼å åï¼ç½çº¢é¤åãå¤å¸ãå¹´è½»äººèé'
    var friendsBonus = 0;
    if (isFriends) {
      if (poi.tags && poi.tags.some(function(t) { return t === 'ç½çº¢' || t === 'æå¡' || t === 'æç§' || t === 'å°å' || t === 'ç¾é£'; })) friendsBonus += 20;
      if (poi.category === 'shopping' && (poi.tags || []).indexOf('å¤è¡') !== -1) friendsBonus += 15;
      if (poi.hasPhotoSpot) friendsBonus += 15;
      if (poi.category === 'restaurant' && poi.romanticLevel <= 2 && poi.noiseLevel >= 3) friendsBonus += 10;
    }

    // ð¼ åå¡æ¨¡å¼å åï¼äº¤éæ¢çº½å¨è¾¹ãå¿«æ·é¤é¥®ãåå¡é'
    var businessBonus = 0;
    if (isBusiness) {
      if (poi.energyLevel <= 1) businessBonus += 20;
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) businessBonus += 15;
      if (poi.category === 'restaurant' && poi.noiseLevel <= 2) businessBonus += 10;
      if (poi.tags && poi.tags.some(function(t) { return t === 'é«ç«¯' || t === 'åå¡'; })) businessBonus += 15;
    }

    // ð§ ç¬èªæè¡å åï¼å®éãç¬ç«ç©ºé´ãèªææ¢'
    var soloBonus = 0;
    if (companionType === 'solo') {
      if (poi.energyLevel <= 2 && poi.crowdednessLevel <= 2) soloBonus += 15;
      if (poi.category === 'museum' || poi.category === 'leisure') soloBonus += 10;
    }

    // ææ¸¸æ¨¡å¼å åï¼é£æ¯åºãç½çº¢æå¡å°
    var isTravel = travelMode === 'tourism';
    var travelBonus = 0;
    if (isTravel) {
      if (poi.category === 'scenic') travelBonus += 25;
      if (poi.hasPhotoSpot) travelBonus += 20;
      if (poi.tags && poi.tags.some(function(t) { return t === 'ç½çº¢' || t === 'æå¡' || t === 'æç§' || t === 'ç¾æ¯'; })) travelBonus += 15;
    }
    // åºè¡æ¨¡å¼å åï¼ä½ä½åæ¶èãå¿«æ·é¤'
    var commuteBonus = 0;
    if (!isTravel) {
      if (poi.energyLevel <= 2) commuteBonus += 20;
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) commuteBonus += 15;
    }

    var total = moodScore + budgetScore + energyScore + crowdScore + kidScore + elderlyScore + coupleScore + elderlyRestaurantBonus + coupleBonus + kidsBonus + elderlyBonus + friendsBonus + businessBonus + soloBonus + travelBonus + commuteBonus;

    // ================================================================
    //  å¢å¼ºç®æ³éæï¼åºç¨å¿ææéãå¤©æ°å æãå­£èæ§ãæä¼´å'
    // ================================================================
    // å¿ææéï¼åºäºPOIç±»å«çæç»ªå¹'
    if (currentMoodWeights[poi.category]) total *= currentMoodWeights[poi.category];
    // å¿ææéï¼åºäºæ ç­¾çææå¹é
    var poiTags = poi.tags || [];
    for (var tk in currentMoodWeights) {
      if (poiTags.indexOf(tk) !== -1) total *= currentMoodWeights[tk];
    }

    // å¤©æ°å æï¼åºäºPOIç±»ååå¤©æ°æ¡ä»¶çæºè½éé
    if (weatherPoiBoost[poi.category]) total *= weatherPoiBoost[poi.category];
    if (poi.weatherSensitivity === 'indoor' && weatherPoiBoost.indoor) total *= weatherPoiBoost.indoor;

    // å­£èæ§è¯åï¼æ ¹æ®å½åå­£èè°æ´POIéé'
    if (poi.seasonalScore && poi.seasonalScore[season]) {
      total *= (poi.seasonalScore[season] / 5);
    }

    // æä¼´åå¥½ï¼æµªæ¼«ææ°ééæä¾£æ¨¡å¼
    if (compAdj.romanticPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.romanticPoi;
    }
    // æä¼´åå¥½ï¼äº²å­åå¥½åº¦
    if (compAdj.familyPoi && poi.familyFriendly) {
      total *= compAdj.familyPoi;
    }
    // æä¼´åå¥½ï¼ç¤¾äº¤å±æ§ééå¥½åæ¨¡å¼
    if (compAdj.socialPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.socialPoi;
    }

    // æ¶é´ç²¾åæ²çº¿ï¼æ ¹æ®POIæä½³æ¶æ®µå¨æè°'
    var dayEnergy = energyCurve[0] || { morning: 0.9, afternoon: 0.75, evening: 0.6 };
    if (poi.bestTimeOfDay === 'morning') total *= dayEnergy.morning * 1.1;
    else if (poi.bestTimeOfDay === 'afternoon') total *= dayEnergy.afternoon;
    else if (poi.bestTimeOfDay === 'evening') total *= dayEnergy.evening * 1.05;

    return Object.assign({}, poi, { _scores: { moodScore:moodScore, budgetScore:budgetScore, energyScore:energyScore, crowdScore:crowdScore, kidScore:kidScore, elderlyScore:elderlyScore, coupleScore:coupleScore }, _total: total });
  });
  scored.sort(function(a, b) { return b._total - a._total; });

  // LAYER 3: è¡ç¨ç¼æï¼å¢å¼ºçï¼æä¼´æç¥è'+ åç¹ç§åµ + äº¤éèæ¶ + Plan B + é¢ç®ä¸é'
  var isLowEnergy = activeMood === 'tired' || activeMood === 'sad' || activeMood === 'anxious' || activeMood === 'insomnia';
  var isBusinessMode = travelMode === 'business';
  // ð¯ æä¼´æç¥çæ¯æ¥ä¸'
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  var maxPerDay = ct ? ct.maxPoi : 4;
  // å¿æä½è½æ¶è¿ä¸æ­¥éä½ä¸'
  if (isLowEnergy && maxPerDay > 2) maxPerDay = Math.max(2, maxPerDay - 1);
  // åå¡æ¨¡å¼è¦ç
  if (isBusinessMode) maxPerDay = Math.min(maxPerDay, 3);
  var used = new Set();
  var itinerary = [];
  var allPoiItems = [];

  // è¾å©ï¼æ¥æ¾é¨å¤©å¤éï¼å®¤åãä¸åç±»å«ï¼
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

    for (var idx = 0; idx < dayPois.length; idx++) {
      var dayPoi = dayPois[idx];

      // åé¤æå¥ï¼å¨ä¸­é´ä½ç½®'
      if (idx === midIdx) {
        var lunchPoi = scored.find(function(p) { return p.category === 'restaurant' && !used.has(p.id); });
        if (lunchPoi) {
          used.add(lunchPoi.id);
          items.push({ type:'restaurant', time:fmtTime(hour), name:lunchPoi.name, estimatedCost:lunchPoi.ticketPrice || 80, estimatedDuration:lunchPoi.estimatedDuration || 60, reason:'åé¤æ¶é´ï¼æ¨èéè¿é«è¯åé¤å', reasonTags:['ä½ç½®ä¾¿å©','é«è¯'], poiId:lunchPoi.id });
          hour += 1;
        }
      }

      // ä¼æ¯æ¶é´æå¥ï¼ä»ææ¸¸æ¨¡å¼ + ç²æ«/æ²ä¼¤å¿æï¼æé¿è¾/äº²å­æ¨¡å¼å¼ºå¶åä¼'
      if (!isBusinessMode && ((activeMood === 'tired' || activeMood === 'sad') || companionType === 'family') && idx === midIdx) {
        var restReason = companionType === 'family' ? 'é¿è¾/äº²å­æ¨¡å¼ï¼èªå¨æå¥åä¼æ¶é´ï¼é¿åä½åéæ¯' : 'ç²æ«æ¨¡å¼ï¼èªå¨æå¥åå°æ¶ä¼æ¯ï¼é¿åä½åéæ¯';
        items.push({ type:'rest', time:fmtTime(hour), name: companionType === 'family' ? 'ð¿ åä¼æ¶é´' : 'ï¿½?ä¼æ¯æ¶é´', estimatedCost:30, estimatedDuration: companionType === 'family' ? 60 : 30, reason: restReason, reasonTags:['å¿æå¹é','ä½åä¿æ¤'] });
        hour += companionType === 'family' ? 1 : 0.5;
      }

      // POI æ¡ç®
      var dur = dayPoi.estimatedDuration ? dayPoi.estimatedDuration / 60 : (isLowEnergy ? 2 : 1.5);
      // åå¡æ¨¡å¼ï¼ç¼©ç­æ¸¸ç©æ¶'
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
        weatherSensitivity: dayPoi.weatherSensitivity
      };

      // Plan B: é¨å¤©å¤éï¼æ·å¤ææ··åç±»POI'
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

    // è®¡ç®äº¤éèæ¶ï¼ç¸é»POIä¹é´çæ¬§å éå¾è·ç¦»ï¼
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

  // é¢ç®ç¡¬ä¸éæ£'
  var runningTotal = 0;
  itinerary.forEach(function(d) { d.items.forEach(function(it) { runningTotal += it.estimatedCost || 0; }); });
  var budgetExceeded = false;
  var budgetOverage = 0;

  if (runningTotal > budget) {
    budgetExceeded = true;
    budgetOverage = runningTotal - budget;
    // æ¾å°æè´µçPOIå¹¶æ¿æ¢ä¸ºæ´ä¾¿å®çå¤'
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
          transitTime: mostExpensiveItem.transitTime
        };
        if (cheapAlt.weatherSensitivity === 'outdoor' || cheapAlt.weatherSensitivity === 'mixed') {
          var rp = findRainPlan(cheapAlt, used);
          if (rp) newItem.rain_plan = rp;
        }
        itinerary[mostExpensiveDayIdx].items[mostExpensiveItemIdx] = newItem;
        // éæ°è®¡ç®æ»é¢
        runningTotal = 0;
        itinerary.forEach(function(d) { d.items.forEach(function(it) { runningTotal += it.estimatedCost || 0; }); });
        budgetOverage = Math.max(0, runningTotal - budget);
        budgetExceeded = runningTotal > budget;
        break;
      }
    }
  }

  // LAYER 4: éåºæ¨èï¼å«é¢ç®ä¸é + åå¡æ¨¡å¼åå¥½'
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
    // åå¡æ¨¡å¼ï¼åå¥½äº¤éä¾¿å©ï¼è¯åç¸è¿çéåºä¸­ï¼ä¼åéæ©è·ç¦»å¸ä¸­å¿è¿çï¼
    if (isBusinessMode) {
      if (h.nearTransport) score += 30;
      if (h.has_gym) score += 10;   // åå¡äººå£«åå¥½å¥èº«'
      if (h.businessFriendly) score += 25;
    }
    return Object.assign({}, h, { _score: score });
  }).sort(function(a, b) { return b._score - a._score; });

  // é¢ç®ä¸éï¼è¿æ»¤è¶åºé¢ç®å¤ªå¤çéåº
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
    var platforms = [
      { name:'æºç¨', icon:'ð¨', price:Math.round(best.priceRangeLow * 1.0), features:'å«æ©', isBest:false },
      { name:'ç¾å¢', icon:'ð', price:Math.round(best.priceRangeLow * 0.95), features:'å«æ©ä¸å¯åæ¶', isBest:true },
      { name:'é£çª', icon:'ð·', price:Math.round(best.priceRangeLow * 0.92), features:'åè´¹åçº§æ¿å', isBest:false },
      { name:'å»åª', icon:'âï¸', price:Math.round(best.priceRangeLow * 0.97), features:'å«å', isBest:false }
    ];
    var bestPlat = platforms.find(function(p) { return p.isBest; });
    hotelData = {
      name: best.name, rating: best.rating, price: best.priceRangeLow,
      bestPrice: bestPlat.price, bestPlatform: bestPlat.name, bestReason: bestPlat.features,
      savedAmount: Math.max.apply(null, platforms.map(function(p) { return p.price; })) - bestPlat.price,
      platforms: platforms, reason: genHotelReason(best)
    };
  }

  return {
    itinerary: itinerary,
    hotel: hotelData,
    stats: { totalCost: totalCost, totalSaved: hotelData ? hotelData.savedAmount : 0, totalPois: used.size, filterTotal: POIS.length, filterPassed: candidates.length, budgetExceeded: budgetExceeded, budgetOverage: budgetOverage }
  };
}

// ================================================================
//  çæè¡ç¨
// ================================================================
function generatePlan() {
  if (isPlanning) return;
  isPlanning = true;
  var btn = document.getElementById('generatePlanBtn');
  btn.disabled = true;
  btn.textContent = '????AI ????????????'..';
  showSkeleton('AI æ­£å¨åæä½ çå¿æåå¥½...');
  showAlgoProgress();
  runMultiAgentPipeline();

  // é¶æ®µå¼å±ç¤ºç®æ³è¿'
  setTimeout(function() { updateAlgoStep(1, 'active', 'ç­éä¸­...', POIS.length); }, 300);
  setTimeout(function() {
    var result = doGenerate();
    // ï¿½?doGenerate ç»æåºæ¥åæ´æ°è¿'
    updateAlgoStep(1, 'done', 'å®æ ' + result.stats.filterPassed + '/' + result.stats.filterTotal + ' éè¿', result.stats.filterTotal);
    updateAlgoStep(2, 'done', 'å¤ç»´è¯åå®æ', result.stats.filterTotal);
    updateAlgoStep(3, 'done', 'ç¼æ ' + result.itinerary.length + ' å¤©è¡', result.stats.filterTotal);
    updateAlgoStep(4, 'done', result.hotel ? 'æ¾å°æä¼é' : 'æ å¹éé', result.stats.filterTotal);
    // æ´æ°ç»è®¡
    updateAlgoStats(result);
    itinerary = result.itinerary;
    hotel = result.hotel;
    stats = result.stats;
    renderItinerary();
    renderHotel();
    renderFood();
    renderShopping();
    renderMap();
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
    hideSkeleton();
    hideAlgoProgress();
    // é¢ç®è¶æ è­¦å
    var warnEl = document.getElementById('budgetWarning');
    if (stats.budgetExceeded) {
      warnEl.textContent = 'â ï¸ é¢ç®è¶æ  Â¥' + stats.budgetOverage + 'ï¼å·²èªå¨æ¿æ¢æè´µæ¯ç¹ä¸ºæ´ç»æµçéæ©';
      warnEl.classList.add('show');
    } else {
      warnEl.classList.remove('show');
    }
    isPlanning = false;
    btn.disabled = false;
    btn.textContent = 'ï¿½?æºè½çæè¡ç¨';
  showToast('AI is optimizing itinerary...');
    document.getElementById('itinerarySection').scrollIntoView({ behavior: 'smooth' });
    // è§¦åè¡åæéï¼æ¨¡ï¿½?å°æ¶ååºåï¼
    scheduleReminder();
    // æ°åè½ï¼çæ AI æè¡éç¬
    setTimeout(function() { generateNarrative(); }, 800);
    // æ°åè½ï¼ä¿å­ï¿½?localStorage
    setTimeout(function() { saveTripToStorage(); renderTripHistory('all'); }, 1500);
    // è§¦ååé¦æ¶é
    setTimeout(function() { showFeedbackPrompt(); }, 35000);
    // æ°åè½ï¼çæåäº«å¡ç
    setTimeout(function() { renderShareCard(); }, 2000);
    // æ°åè½ï¼æ¾ç¤ºå¤©æ°
    setTimeout(function() { showWeatherIndicator(); }, 1000);
  }, 800);
}

// ================================================================
//  æè¡äººæ ¼ç»åç³»ç»
// ================================================================
var travelPersona = null;

function generateTravelPersona() {
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label;
  var ct = COMPANION_TYPES.find(function(c){return c.key===companionType;})||{};
  var companionLabel = ct.label || 'ç¬èª';
  var pacingLabel = ct.paceLabel || 'æ é²èå¥';
  
  // æ ¹æ®å¿æ+æä¼´+é¢ç®çææè¡äººæ ¼
  var personaTypes = {
    'tired_solo': { name:'éè°§éå£«', emoji:'ð§', type:'æ²»æç³»æè¡', desc:'ä½ è¿½æ±çæ¯å½»åºçæ¾æ¾ä¸ç¬å¤ãä¸éè¦èµ¶è¡ç¨ï¼ä¸æ¯è¶ãä¸æ¬ä¹¦ãä¸ä¸ªå®éçè§è½ï¼å°±æ¯å®ç¾çæè¡', traits:['æ¢è','æ·±åº¦ä½éª','é¿å¼äººç¾¤','æ²»æä¼å'], color:'#B5A3C4' },
    'tired_couple': { name:'æ¸©æä¼´ä¾£', emoji:'ð', type:'æ¢çæ´»ä½éªå®¶', desc:'ä¸¤ä¸ªäººå¨ä¸èµ·ï¼æ¢ä¸æ¥ææ¯çæ­£çå¥¢ä¾ãä½ ä»¬æå¾äº«åå½¼æ­¤çéªä¼´ï¼ä¸éè¦æå¡ï¼åªéè¦ä¸èµ·èåº¦æ¶å', traits:['ç§å¯ç©ºé´','SPAæ°´ç','å­æä¸å','ä¸çäººæµ·'], color:'#C4A8A8' },
    'tired_friends': { name:'åè¡å§å¦¹', emoji:'ð§', type:'çæåç©', desc:'ç´¯äºå°±ä¸èµ·èººå¹³ï¼ä½ ä»¬çæè¡å²å­¦æ¯ï¼ä¸ç´¯çèªå·±ï¼ä¸å§å±èªå·±ãææ©ãç¾é£ãæç§ï¼ä¸ä»¶å¥æå®', traits:['èººå¹³ä¼å','é«é¢å¼æ','ç²¾è´ç¾é£','ä¸èµ¶'], color:'#D4A8A8' },
    'tired_family': { name:'å¤©ä¼¦å®æ¤', emoji:'ð¿', type:'å®¶åº­æ¢æ¸¸', desc:'å¸¦çå®¶äººçæè¡ï¼èå¥æéè¦ãä½ ä»¬ä¸è¿½æ±æ°éï¼åªè¿½æ±è´¨éââæ¯ä¸ªæ¯ç¹é½è¦è®©èäººèæãå­©å­å¼å¿', traits:['æ éç¢ä¼','åä¼ä¿é','è¿å»çç¹','å¹³ç¼è·¯çº¿'], color:'#A8C4A8' },
    'sad_solo': { name:'èªæçæ', emoji:'ð', type:'æç»ªä¿®å¤', desc:'ä½ éè¦ä¸åºæ¸©æçèªæå¯¹è¯ãæè¡ä¸æ¯ä¸ºäºéç¦»ï¼èæ¯ä¸ºäºéè§æ´å¥½çèªå·±ãå¤§èªç¶æ¯æå¥½çå¿çå»ç', traits:['èªç¶æ¯è§','å®éç©ºé´','æ¥åºæ¥è½','å¯ºåºç¦ä¿®'], color:'#E8945A' },
    'sad_couple': { name:'æ¸©ææ¸¯æ¹¾', emoji:'ð', type:'ææèç»', desc:'å¨å½¼æ­¤èº«è¾¹ï¼å°±æ¯æå¥½çæ²»æãä½ ä»¬çæè¡ä¸éè¦å¤ç²¾å½©ï¼åªéè¦å¤æ¸©æââæçµæèµ°è¿çå°æ¹ï¼é½æ¯é£æ¯', traits:['æµªæ¼«è½æ¥','ç§å¯é¤å','èªç¶æ¼«æ­¥','è¿ç¦»å§å£'], color:'#E8A85A' },
    'anxious_solo': { name:'å¿çµè§£å', emoji:'ð¿', type:'ååæ¢ç´¢', desc:'ç¦èçæ¶åï¼ä½ éè¦ä¸ä¸ªè½è®©èªå·±å®éä¸æ¥çå°æ¹ãç»¿è²ãç¦æãæ¢èå¥ââè®©å¤§èªç¶å¸®ä½ æä¸æåé®', traits:['ç¦ä¿®ä½éª','ç«¹ææ¼«æ­¥','è¶éå¥æ³','ä½åºæ¿'], color:'#6B8FA3' },
    'anxious_couple': { name:'å®å¿æä¼´', emoji:'ð', type:'å¹³éå®æ¤', desc:'ä¸¤ä¸ªäººä¸èµ·éç¦»ç¦èãä½ ä»¬éæ©çå°æ¹é½æ¯å®éçãæ²»æçââä¸éè¦å³ç­ååï¼åªéè¦æ¾æ¾', traits:['å®éå­æ','è¶å®¤åè','è½»å¾','ä¸æ'], color:'#7B9FB3' },
    'excited_solo': { name:'????????????', emoji:'????', type:'????????????', desc:'?????????????????????????????????????????????????????????????????????????????????????????????????????????"??????"?????????", traits:['ç»å±±å¾æ­¥','æéè¿å¨','æ°å¥ä½éª','è¯´èµ°å°±èµ°'], color:'#FF6B6B' },
    'excited_couple': { name:'ç­è¡æä¾£', emoji:'', type:'æ´»ååäºº', desc:'æå¥½çå³ç³»æ¯ä¸èµ·æé¿ãä¸èµ·åé©ãä½ ä»¬çæè¡åæ»¡å¤å·´èºââä»æ¥åºå°æç©ºï¼æ¯ä¸å»é½å¨çç§', traits:['æ·å¤æ¢é©','æ¥åºæ¥è½','éªè¡å¾æ­¥','æè´ä½éª'], color:'#FF8B6B' },
    'excited_friends': { name:'å¨ç¿»éºè', emoji:'ð', type:'æ´¾å¯¹æè¡', desc:'åæå¥½çæåä¸èµ·ï¼å»åªé½æ¯çæ¬¢ï¼ä½ ä»¬çæè¡å³é®è¯ï¼æç§ãç¾é£ãæå¡ãå¤§ç¬ââä¸ä¸ªé½ä¸è½å°', traits:['ç½çº¢æå¡','å¤å¸æ«è¡','ä¸»é¢ä¹å­','åºçå£å°'], color:'#FF9B6B' },
    'happy_solo': { name:'èªç±æ¼«æ­¥', emoji:'ð', type:'éæ§æ¢ç´¢å®¶', desc:'å¿æå¥½çæ¶åï¼ä¸ä¸ªäººä¹å¯ä»¥ç©å¾å¾ç²¾å½©ãä½ äº«åèªç±çèå¥ââèµ°å°åªç®åªï¼éå°ä»ä¹é½æ¯æå', traits:['åå¸æ¼«æ­¥','åå¡é¦æ¢','å³å´åæ¥','äº«åå½ä¸'], color:'#E8A85A' },
    'happy_couple': { name:'çèæäºº', emoji:'ð', type:'æµªæ¼«ä½éª', desc:'å¼å¿çæ¶åï¼åªæ³åä½ åäº«ãä½ ä»¬çæè¡æ¯ç²è²çââä»æ©åé¤å°å¤æ¯ï¼æ¯ä¸ªç¬é´é½å¼å¾çè', traits:['æµªæ¼«é¤å','æç§æå¡','å¤æ¯æ¼«æ­¥','çèæ¶å'], color:'#FFB89A' },
    'happy_friends': { name:'å¿«ä¹å ', emoji:'ð¯', type:'ç¤¾äº¤åæè¡', desc:'å¿«ä¹åäº«åºå»å°±æ¯ååï¼åéºèä¸èµ·çæè¡ï¼å°±æ¯å¤§åå¿«ä¹å¶é ç°åº', traits:['ç¾é£æ¢åº','éºèåç','éè¡è´­ç©','ä¸å'], color:'#FFC89A' },
    'calm_family': { name:'å¹³åå®æ¤', emoji:'ð³', type:'å®¶åº­æ¢çæ´»å®¶', desc:'å¹³éçå¿ï¼æéåéªä¼´å®¶äººãä½ ä»¬çæè¡ä¸æ¥ä¸èºï¼åä¸æ¯æ¸©ç­çè¶ââæ¢æ¢åï¼ææå³é', traits:['å¬å­æ¼«æ­¥','åç©','äº²å­äºå¨','èéè'], color:'#8BA88C' },
    'calm_couple': { name:'é»å¥ä¼´ä¾£', emoji:'ðµ', type:'åè´¨çæ´»', desc:'å¹³éçä¸¤ä¸ªäººï¼å¨ä¸èµ·å°±æ¯æå¥½çç¶æãä½ ä»¬ä¸éè¦å»æçæµªæ¼«ââä¸ä¸ªç¼ç¥ãä¸æ¯è¶ï¼å°±æ¯å®ç¾çä¸å¤©', traits:['åè´¨é¤å','èºæ¯å±è§','å­ææ¼«æ­¥','å®éæ¶å'], color:'#A3B5A6' },
    'insomnia_solo': { name:'å¤æ¸¸è¯äºº', emoji:'ð', type:'æ·±å¤æè', desc:'å¤±ç çå¤æï¼ä½ æ¯ç½å¤©æ´æ¸éãä½ çæè¡ä¹è®¸ä»é»ææå¼å§ââå¤å¸ãæç©ºï¿½?4å°æ¶ä¹¦åºï¼é½æ¯ä½ çä¸»åº', traits:['å¤æ¯æ¼«æ­¥','æ·±å¤é£å ','æç©ºè§æµ','å®éç¬å¤'], color:'#6B7BA3' },
    'default': { name:'èªç±æäºº', emoji:'âï¸', type:'éæ§æè¡', desc:'ä½ æä¸é¢èªç±çå¿ï¼æè¡çæä¹å°±æ¯æ¢ç´¢æªç¥ãä¸è®¾éãä¸å®ä¹ââè®©æ¯ä¸æ¬¡åºåé½åæ»¡æå', traits:['çµæ´»å¤å','æ¢ç´¢æªç¥','äº«åå½ä¸','éå¿èè¡'], color:'#8BA88C' }
  };
  
  var key = activeMood + '_' + companionType;
  var persona = personaTypes[key] || personaTypes['default'];
  
  // æ ¹æ®é¢ç®è°æ´
  if (budget >= 10000) persona.traits.push('åè´¨äº«å');
  else if (budget <= 2000) persona.traits.push('é«æ§ä»·');
  
  // æ ¹æ®æè¡æ¨¡å¼è°æ´
  if (travelMode === 'business') {
    persona.traits = ['é«æåºè¡','åå¡ä¼å','äº¤éä¾¿','çæ¶çå¿'];
    persona.desc = 'ä½ çæè¡ä»¥æçä¸ºæ ¸å¿ââæä½³è·¯çº¿ãæä¼æ¶é´ãæèéçåå¡ä½éª';
  }
  
  persona.budgetLevel = budget >= 10000 ? 'é«ç«¯äº«å' : budget >= 5000 ? 'åè´¨è' : budget >= 2000 ? 'ç»æµå®æ ' : 'ç²¾æç»ç®';
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
  section.classList.add('show');
  
  var html = '<div class="persona-header">';
  html += '<div class="persona-avatar" style="background:' + persona.color + '22;border-color:' + persona.color + '40">' + persona.emoji + '</div>';
  html += '<div class="persona-info"><div class="persona-name">' + persona.name + '</div>';
  html += '<div class="persona-type">' + persona.type + ' Â· ' + persona.moodLabel + 'å¿æ Â· ' + persona.companionLabel + '</div></div></div>';
  
  html += '<div class="persona-traits">';
  persona.traits.forEach(function(t) {
    html += '<span class="persona-trait" style="border-color:' + persona.color + '30;color:' + persona.color + '">' + t + '</span>';
  });
  html += '</div>';
  
  html += '<div class="persona-stats-row">';
  html += '<div class="persona-stat"><div class="persona-stat-icon">ð¯</div><div class="persona-stat-val" style="color:' + persona.color + '">' + persona.pacing + '</div><div class="persona-stat-label">æè¡èå¥</div></div>';
  html += '<div class="persona-stat"><div class="persona-stat-icon">ð°</div><div class="persona-stat-val" style="color:' + persona.color + '">' + persona.budgetLevel + '</div><div class="persona-stat-label">é¢ç®åå¥½</div></div>';
  html += '<div class="persona-stat"><div class="persona-stat-icon">????"/div><div class="persona-stat-val" style="color:' + persona.color + '">' + days + ''/div><div class="persona-stat-label">è¡ç¨å¤©æ°</div></div>';
  html += '<div class="persona-stat"><div class="persona-stat-icon">ð­</div><div class="persona-stat-val" style="color:' + persona.color + '">' + persona.moodLabel + '</div><div class="persona-stat-label">å½åå¿æ</div></div>';
  html += '</div>';
  
  html += '<div class="persona-desc">' + persona.desc + '</div>';
  
  card.innerHTML = html;
}

// ================================================================
//  AI æè¡æ¥è®°çæ
// ================================================================
function renderTravelJournal() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('journalSection');
  var daysEl = document.getElementById('journalDays');
  section.classList.add('show');
  
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label;
  var moodEmoji = (MOODS.find(function(m){return m.key===activeMood;})||{}).emoji;
  var color = activeMoodColor;
  
  var journalTemplates = [
    'æ¸æ¨çç¬¬ä¸ç¼é³åå«éäº{city}ï¼ä»å¤©æ³¨å®æ¯ç¾å¥½çä¸å¤©ãå¨{poi1}ï¼{experience1}',
    'ä»å¤©å¨{poi1}åº¦è¿äºä¸æ®µé¾å¿çæ¶åã{experience1}ãåé¤å¨{poi2}ï¼{food_desc}',
    'ä¸åå»äº{poi1}ï¼{experience1}ãä¸åæ¼«æ­¥å¨{poi2}ï¼{experience2}',
    'ä»å¤©æ¯ææ¾æ¾çä¸å¤©ãå¨{poi1}ï¼{experience1}ãä¸éè¦èµ¶æ¶é´ï¼åªéè¦äº«åå½ä¸',
    '{poi1}æ¯æ³è±¡ä¸­è¿è¦ç¾ã{experience1}ãåææ¶åï¼å¨{poi2}ççæ¥è½ï¼{experience2}'
  ];
  
  var experiences = {
    tired: ['ä»ä¹ä¹ä¸æ³åï¼å°±å¨é£éåçååï¼è®©æ¶é´æ¢æ¢æµè¿', 'æ³¡äºä¸æ¯è¶ï¼çççªå¤çé£æ¯ï¼èº«å¿é½æ¾æ¾äºä¸æ¥', 'é­ä¸ç¼çï¼æåå¾®é£æè¿è¸é¢ï¼ææçç²æ«é½æ¶æ£äº'],
    sad: ['ççè¿å¤çå±±åæ°´ï¼å¿éé£äºè¯´ä¸åºå£çæç»ªï¼ä¼¼ä¹é½è¢«æ¸©æå°æ¥ä½', 'ä¸ä¸ªäººééå°èµ°çï¼ä¸éè¦è¯´è¯ï¼åªæ¯æåè¿çåå°çå¼', 'ç¼æ³ªä¸ç¥ä¸è§æµäºä¸æ¥ï¼ä½è¿ä¸æ¬¡ï¼ä¸æ¯å ä¸ºé¾è¿ï¼èæ¯å ä¸ºæå¨'],
    anxious: ['æ·±å¼å¸ï¼è¿éçç©ºæ°æä¸ç§è®©äººå®å¿çå³éãç¦èåæ½®æ°´ä¸æ ·æ¢æ¢é', 'æææºè°æéé³ï¼è®©èªå·±å®å¨æ²æµ¸å¨è¿ä¸å»çå®é', 'é­ä¸ç¼çæ°äºåæ¬¡å¼å¸ï¼åçå¼ç¼ï¼ä¸çåå¾ä¸ä¸æ ·äº'],
    excited: ['å¿è·³å éï¼è¿éçä¸åé½è®©äººå´å¥ä¸å·²ï¼æ¯ä¸ä¸ªè§è½é½èçæå', 'å¿ä¸ä½æ¿åºææºæäºå åå¼ ç§çï¼æ¯ä¸å¼ é½èä¸å¾å ', 'å²å¨æåé¢ï¼æ³è¦æ¢ç´¢æ¯ä¸ä¸ªè§è½ï¼è¿ç§æè§å¤ªæ£'],
    happy: ['å´è§ä¸èªè§å°ä¸æ¬ï¼è¿éçé³åãç©ºæ°ãé£æ¯ï¼ä¸åé½åå', 'éå°äºå¾ååçå½å°äººï¼èäºå¾å¤æè¶£çäºï¼è¿å°±æ¯æè¡çæä¹', 'å¨è¡è§åç°äºä¸å®¶å¾æ£çåºï¼è¿ç§æå¤æåæè®©äººå¼'],
    calm: ['ä¸ç¾ä¸å¾å°èµ°çï¼æåçèä¸æ¯ä¸åç³æ¿ï¼å¼å¸çæ¯ä¸å£æ°é²ç©º', 'åå¨é¿æ¤ä¸ï¼çæ¥å¾çè¡äººï¼æåè¿åº§åå¸çè', 'æ³¡äºä¸æ¯è¶ï¼ç¿»å¼ä¸æ¬ä¹¦ï¼è¿ä¸ªä¸åå±äºæèªå·±'],
    insomnia: ['å¤æç{city}æä¸ç§ç¹å«çå®éï¼éåä¸ä¸ªäººæ¢æ¢æ', 'èµ°å¨å®éçè¡éä¸ï¼è·¯ç¯æå½±å­æå¾å¾é¿ï¼æç»ªä¹æ¢æ¢æ¸', 'æ¬å¤´çæç©ºï¼åå¸çç¯åå¾è¿ï¼æåå¾è¿']
  };
  
  var moodExps = experiences[activeMood] || experiences.calm;
  
  var html = '';
  itinerary.forEach(function(day, dayIndex) {
    var pois = day.items.filter(function(item) { return item.type === 'poi'; });
    var restaurants = day.items.filter(function(item) { return item.type === 'restaurant'; });
    var city = pois.length > 0 ? (pois[0].city || 'è¿åº§åå¸') : 'è¿åº§åå¸';
    var poi1 = pois.length > 0 ? pois[0].name : 'è¿é';
    var poi2 = restaurants.length > 0 ? restaurants[0].name : (pois.length > 1 ? pois[1].name : 'éè¿çå°');
    var exp1 = moodExps[dayIndex % moodExps.length];
    var exp2 = moodExps[(dayIndex + 1) % moodExps.length];
    var foodDesc = restaurants.length > 0 ? 'åå°äºå½å°çç¹è²ç¾é£ï¼å³éè®©äººæ' : 'éä¾¿æ¾äºä¸å®¶å°åºï¼å³éæå¤å°å¥½';
    
    var template = journalTemplates[dayIndex % journalTemplates.length];
    var journal = template.replace('{city}', city).replace('{poi1}', poi1).replace('{poi2}', poi2).replace('{experience1}', exp1).replace('{experience2}', exp2).replace('{food_desc}', foodDesc);
    
    html += '<div class="journal-card glass-panel" style="margin-bottom:16px;--active-mood-color:' + color + '">';
    html += '<div class="journal-header">';
    html += '<div class="journal-day"><span class="journal-day-num" style="background:' + color + '">' + day.day + '</span> Day ' + day.day + ' Â· ' + city + '</div>';
    html += '<div class="journal-date">' + new Date(Date.now() + dayIndex * 86400000).toLocaleDateString('zh-CN', {month:'short', day:'numeric', weekday:'short'}) + '</div>';
    html += '</div>';
    html += '<div class="journal-body">' + journal + '</div>';
    if (pois.length > 0) {
      html += '<div class="journal-photo-spot">ð¸ ä»æ¥æ¨èæç§ç¹ï¼' + pois[0].name + '</div>';
    }
    html += '<div class="journal-mood" style="background:' + color + '18;color:' + color + '">' + moodEmoji + ' ä»æ¥å¿æ' + moodLabel + '</div>';
    html += '</div>';
  });
  
  daysEl.innerHTML = html;
}

// ================================================================
//  æ°æ®å¯è§ï¿½?ï¿½?é·è¾¾'+ ????????????
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
  
  // è®¡ç®åç»´åº¦å¾'
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
  
  var labels = ['å¿æå¹é', 'æ§ä»·', 'èéåº¦', 'åºç', 'ä½åå¹é'];
  var values = [moodScore, budgetScore, comfortScore, photoScore, energyScore];
  var colors = ['#8BA88C', '#E8A85A', '#6B8FA3', '#FF6B6B', '#B5A3C4'];
  var n = 5;
  
  // èæ¯ç½æ ¼
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
  
  // è½´çº¿
  for (var i = 0; i < n; i++) {
    var angle = Math.PI * 2 / n * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.stroke();
  }
  
  // æ°æ®åºå
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
  
  // æ°æ®'
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
  
  // å¾ä¾
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
  
  // è®¡ç®ååç±»è±'
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
    { label:'æ¯ç¹é¨ç¥¨', value:poiCost, color:'#8BA88C' },
    { label:'é¤é¥®ç¾é£', value:foodCost, color:'#E8A85A' },
    { label:'éåºä½å®¿', value:hotelCost, color:'#6B8FA3' }
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
  
  // ä¸­å¿æå­
  ctx.fillStyle = '#fff';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Â¥' + stats.totalCost, cx, cy + 4);
  
  // å¾ä¾
  var legend = document.getElementById('budgetLegend');
  legend.innerHTML = slices.map(function(s) {
    return '<span class="viz-legend-item"><span class="viz-legend-dot" style="background:' + s.color + '"></span>' + s.label + ' Â¥' + s.value + '</span>';
  }).join('');
}

// ================================================================
//  æºè½æéç³»ç»
// ================================================================
function generateSmartAlerts() {
  if (!itinerary || !stats) return;
  var alertsEl = document.getElementById('smartAlerts');
  var alerts = [];
  
  // é¢ç®æé
  if (stats.budgetExceeded) {
    alerts.push({ type:'warning', icon:'â ï¸', text:'é¢ç®è¶åº Â¥' + stats.budgetOverage + 'ï¼å»ºè®®è°æ´é¨åæ¯ç¹æéæ©æ´ç»æµçé¤å' });
  } else if (stats.totalCost < budget * 0.5) {
    alerts.push({ type:'success', icon:'ð°', text:'é¢ç®åè£ï¼å©ï¿½?Â¥' + (budget - stats.totalCost) + 'ï¼å¯ä»¥èèåçº§éåºæå¢å ç¹è²ä½' });
  }
  
  // ä½åæé
  var highEnergyCount = 0;
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.energyLevel && item.energyLevel >= 4) highEnergyCount++;
    });
  });
  if (highEnergyCount >= 3 && (activeMood === 'tired' || activeMood === 'sad')) {
    alerts.push({ type:'warning', icon:'ð°', text:'æ£æµå° ' + highEnergyCount + ' ä¸ªé«ä½åæ¯ç¹ï¼å½åå¿æåç²æ«ï¼å»ºè®®æ¿æ¢ä¸ºæ´è½»æ¾çéé¡¹' });
  }
  
  // æ¥æ¤æé
  var crowdedCount = 0;
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.crowdednessLevel && item.crowdednessLevel >= 4) crowdedCount++;
    });
  });
  if (crowdedCount >= 2) {
    alerts.push({ type:'info', icon:'ð¥', text:'ï¿½?' + crowdedCount + ' ä¸ªæ¯ç¹äººæµéè¾å¤§ï¼å»ºè®®éå³°åºè¡ï¼ï¿½?ç¹åæååï¼' });
  }
  
  // å¤©æ°æéï¼å¦ææå¤©æ°æ°æ®'
  var weatherData = window._weatherData;
  if (weatherData && weatherData.isRain) {
    alerts.push({ type:'danger', icon:'ð§', text:'ç®çå°æéé¨å¯è½ï¼å·²èªå¨æ¿æ´»é¨å¤©Plan Bï¼å¯å¨è¡ç¨å¡çä¸­æ¥çå¤éæ¹' });
  }
  
  // è·¨åæé
  var cities = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
  });
  if (cities.length >= 3) {
    alerts.push({ type:'info', icon:'ð', text:'ï¿½?' + cities.length + ' åæè¡ï¼å»ºè®®æåè§åäº¤éï¼é«é/å¤§å·´ç¥¨å°½æ©é¢' });
  }
  
  if (alerts.length === 0) {
    alerts.push({ type:'success', icon:'', text:'è¡ç¨è§åä¸åå®ç¾ï¼ç¥ä½ æéæå¿«ï½' });
  }
  
  alertsEl.classList.add('show');
  alertsEl.innerHTML = alerts.map(function(a) {
    return '<div class="smart-alert ' + a.type + '"><span class="smart-alert-icon">' + a.icon + '</span><span>' + a.text + '</span></div>';
  }).join('');
}

// ================================================================
//  æºè½è¡ç¨å¯¹æ¯'
// ================================================================
function renderItineraryCompare() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('compareSection');
  var container = document.getElementById('compareContainer');
  section.classList.add('show');
  
  // æ¹æ¡Aï¼å½åæ¹'
  var planA = {
    title: 'æ¹æ¡A Â· å½åæ¨è',
    subtitle: 'AIåºäºä½ çå¿æååå¥½ç',
    recommended: true,
    budget: stats.totalCost,
    poiCount: stats.totalPois,
    cities: countCities(),
    pacing: getPacingLabel(),
    moodMatch: Math.round(85 + Math.random() * 10),
    highlights: itinerary[0] ? (itinerary[0].items.filter(function(i){return i.type==='poi';}).slice(0,2).map(function(i){return i.name;}).join('') || 'ç²¾éæ¯') : 'ç²¾éæ¯'
  };
  
  // æ¹æ¡Bï¼å¾®è°æ¹æ¡ï¼ä¸åèå¥'
  var altMood = activeMood === 'excited' ? 'calm' : activeMood === 'calm' ? 'excited' : 'happy';
  var planB = {
    title: 'æ¹æ¡B Â· ' + (altMood === 'excited' ? 'æ´»åæ¢ç´¢' : altMood === 'calm' ? 'æ é²æ¾æ¾' : 'æ¬¢ä¹ä½éª'),
    subtitle: 'æ¢ä¸ªèå¥ï¼ä½éªä¸åçæè¡æ¹å¼',
    recommended: false,
    budget: Math.round(stats.totalCost * (0.85 + Math.random() * 0.3)),
    poiCount: stats.totalPois + (altMood === 'excited' ? 1 : -1),
    cities: planA.cities,
    pacing: altMood === 'excited' ? 'å¿«èå¥æ¢' : 'æ¢èå¥äº«',
    moodMatch: Math.round(65 + Math.random() * 20),
    highlights: 'åæ ·çç®çå°ï¼ä¸ä¸æ ·çæå¼æ¹å¼'
  };
  
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  
  var html = '';
  [planA, planB].forEach(function(plan) {
    html += '<div class="compare-col glass-panel' + (plan.recommended ? ' recommended' : '') + '">';
    html += '<div class="compare-col-title">' + (plan.recommended ? 'ð ' : 'ð ') + plan.title + '</div>';
    html += '<div class="compare-col-subtitle">' + plan.subtitle + '</div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">ð° é¢ç®</span><span class="compare-metric-val" style="color:' + (plan.budget <= budget ? '#8BA88C' : '#FF6B6B') + '">Â¥' + plan.budget + '</span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">???? ??????"/span><span class="compare-metric-val" style="color:#fff">' + plan.poiCount + ''/span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">??????????????"/span><span class="compare-metric-val" style="color:#fff">' + plan.cities + ''/span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">ð¯ å¿æå¹é</span><span class="compare-metric-val" style="color:' + activeMoodColor + '">' + plan.moodMatch + '%</span></div>';
    html += '<div class="compare-metric"><span class="compare-metric-label">ð¶ èå¥</span><span class="compare-metric-val" style="color:#fff">' + plan.pacing + '</span></div>';
    html += '<div class="compare-verdict" style="background:' + theme.secondary + '15">ï¿½?' + plan.highlights + '</div>';
    if (plan.recommended) {
      html += '<button class="compare-select-btn" style="background:linear-gradient(135deg, #8BA88C, #6B8E6C)" onclick="showToast(\'å·²éæ©æ¹æ¡A Â· å½åæ¨è\')">ï¿½?å½åæ¹æ¡</button>';
    } else {
      html += '<button class="compare-select-btn" style="background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.35)" onclick="showToast(\'åæ¢æ¹æ¡Båè½å¼åä¸­\')">åæ¢å°æ­¤æ¹æ¡</button>';
    }
    html += '</div>';
  });
  
  container.innerHTML = html;
}

function getPacingLabel() {
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  return ct ? ct.paceLabel : 'éä¸­èå¥';
}

function renderItinerary() {
  var section = document.getElementById('itinerarySection');
  var daysEl = document.getElementById('itineraryDays');
  var countEl = document.getElementById('itineraryCount');
  section.classList.add('show');
  countEl.textContent = itinerary.length + ' ';

  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  daysEl.innerHTML = '';

  // ð¯ æä¼´æç¥ï¿½?Tips æ¨ªå¹
  if (companionType !== 'solo') {
    var tips = {
      couple: 'ð å·²ä¸ºæ¨é¿å¼æ¥æ¤æéåºï¼é¢çåè¶³æç§åä¼æ¯æ¶é´ï¼äº«åçèæç¨',
      friends: 'ð¯ éºèéåæ¨¡å¼å·²å¼å¯ï¼ç½çº¢æå¡å°ãå¤å¸å°åä¸ç½æ',
      family: 'ð¨âð©âï¿½?é¿è¾/äº²å­æ¾å¼æ¨¡å¼ï¼æ¯æ¥ä¸ï¿½?ä¸ªæ¯ç¹ï¼å¼ºå¶åä¼ï¼é¿åç¬å±±ç­é«å¼ºåº¦æ´»',
      business: 'ð¼ åå¡é«ææ¨¡å¼ï¼ä¼åäº¤éæ¢çº½å¨è¾¹ãå¿«æ·é¤é¥®ï¼æ°å´å¾ä½ä¸å°´'
    };
    var tip = tips[companionType];
    if (tip) {
      daysEl.innerHTML += '<div class="companion-tip-banner" style="background:' + theme.secondary + '18;border-left:3px solid ' + activeMoodColor + ';padding:14px 18px;border-radius:10px;margin-bottom:16px;font-size:13px;color:rgba(255,255,255,0.8);line-height:1.6">' + tip + '</div>';
    }
  }
  itinerary.forEach(function(day, dayIndex) {
    var html = '<div class="day-header" id="dayHeader_' + dayIndex + '" style="background:' + theme.secondary + '25;color:' + theme.primary + '" onclick="flyToDay(' + dayIndex + ')" title="ç¹å»æ¥çå°å¾è·¯çº¿"><span>Day ' + day.day + '</span><span>' + day.items.length + ' ä¸ªè'/span><span class="day-map-hint">ðº"/span></div>';
    html += '<div class="day-toolbar"><button class="refresh-btn" onclick="regenerateDay(' + dayIndex + ')">ð å·æ°è¿å¤©</button></div>';
    html += '<div class="timeline">';

    day.items.forEach(function(item, itemIndex) {
      // äº¤éèæ¶æ¡ï¼éç¬¬ä¸ä¸ªæ¡ç®ï¼
      if (itemIndex > 0 && item.transitTime) {
        html += '<div class="transit-bar"><span class="transit-icon">????</span><span class="transit-time">" + item.transitTime + 'åéè½¦ç¨</span></div>';
      }

      var dotColor = item.type === 'rest' ? '#A3B5A6' : item.type === 'restaurant' ? '#E8A85A' : activeMoodColor;
      var catLabel = item.type === 'rest' ? 'ä¼æ¯' : item.type === 'restaurant' ? 'é¤é¥®' : 'æ¯ç¹';
      html += '<div class="timeline-item"><div class="timeline-dot" style="background:' + dotColor + '"></div><div class="timeline-card"><div class="time-row"><span class="time">' + item.time + '</span><span class="category">' + catLabel + '</span>';
      if (item.estimatedDuration) {
        html += '<span class="category" style="margin-left:4px;opacity:0.5">ï¿½?' + item.estimatedDuration + 'åé</span>';
      }
      html += '</div><span class="poi-name">' + item.name + '</span>';
      // é¤åç¹æä¿¡æ¯å±ç¤º
      if (item.type === 'restaurant') {
        var foodPoi = POIS.find(function(p) { return p.name === item.name && p.category === 'restaurant'; }) || {};
        if (foodPoi.signatureDish) {
          html += '<div class="food-signature-inline">' + foodPoi.signatureDish + '</div>';
        }
        if (foodPoi.cuisineType) {
          html += '<span class="cuisine-type-tag">' + foodPoi.cuisineType + '</span>';
        }
        if (foodPoi.queueTime !== undefined) {
          html += '<span class="queue-info">??????????" + foodPoi.queueTime + 'åé' + (foodPoi.peakHours ? 'ï¼é«ï¿½?' + foodPoi.peakHours + '' : '') + '</span>';
        }
        if (foodPoi.localRating && foodPoi.localRating >= 4.5) {
          html += '<span class="local-rec-badge">???? ????????????"/span>';
        }
      }
      if (item.type !== 'rest') {
        var crowd = getCrowdLevel(item);
        html += '<span class="crowd-indicator ' + crowd.level + '">' + crowd.icon + ' ' + crowd.label + '</span>';
        html += '<div class="best-time-tip">ð æä½³æ¸¸è§ï¼' + crowd.bestTime + '</div>';
      }
      if (item.reason) html += '<div class="reason-bar">ð¡ ' + item.reason + '</div>';
      if (item.reasonTags && item.reasonTags.length) {
        html += '<div class="tags">' + item.reasonTags.map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>';
      }
      if (item.type !== 'rest') {
        html += '<div class="booking-row"><div class="price-tag" style="color:' + activeMoodColor + '">Â¥' + (item.estimatedCost || 0) + '</div><button class="book-btn" style="background:' + activeMoodColor + '" onclick="showBookingPopup(\'' + item.name + '\')">é¢è®¢</button></div>';
        if (item.estimatedCost > 0) html += '<div class="compare-inline"><span>ð</span><span>AIæ¯ä»·ï¼ç¾ï¿½?Â¥' + Math.round(item.estimatedCost * 0.93) + ' '/span><span class="compare-inline-save">ç" + Math.round(item.estimatedCost * 0.12) + '</span></div>';
      }
      // é¨å¤©å¤'
      if (item.rain_plan) {
        html += '<div class="rain-plan-toggle" onclick="toggleRainPlan(' + dayIndex + ',' + itemIndex + ')">?????????????????"/div>';
        html += '<div class="rain-plan-detail" id="rainDetail_' + dayIndex + '_' + itemIndex + '">ð  <strong>' + item.rain_plan.name + '</strong>' + item.rain_plan.category + 'ï¼ï¿½?Â¥' + (item.rain_plan.estimatedCost || 0) + '</div>';
      }
      html += '</div></div>';
    });
    html += '</div>';
    daysEl.innerHTML += html;
  });

  // ä¸ºè¡ç¨å¡çæ·»å æ¸å¥å¨'
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
  section.classList.add('show');
  var html = '<div class="hotel-header"><div class="hotel-info"><span class="hotel-name">' + hotel.name + '</span><span class="hotel-rating">????' + hotel.rating + ''/span></div><div class="hotel-price" style="color:' + activeMoodColor + '">Â¥' + hotel.bestPrice + '</div></div>';
  html += '<span class="hotel-reason">ð¡ ' + hotel.reason + '</span>';
  if (hotel.platforms) {
    html += '<div class="ai-compare"><div class="compare-title"><span class="ai-badge">AI ??????</span><span class="ai-tip">????????????????' + hotel.platforms.length + ' ??????'/span></div><div class="compare-list">';
    hotel.platforms.forEach(function(p) {
      html += '<div class="compare-row' + (p.isBest ? ' best' : '') + '"><span class="compare-platform">' + p.icon + ' ' + p.name + '</span><span class="compare-price">??' + p.price + '</span><span class="compare-features">' + (p.features || '') + '</span>' + (p.isBest ? '<span class="compare-best-tag">???"/span>' : '') + '</div>';
    });
    html += '</div><div class="compare-verdict" style="background:' + MOOD_THEME_MAP[activeMood].primary + '12"><span>AI??????" + hotel.bestPlatform + '' + hotel.bestReason + ''/span></div></div>';
  }
  if (hotel.savedAmount > 0) html += '<div class="hotel-savings">ð° æ¯ä»·èç Â¥' + hotel.savedAmount + '</div>';
  html += '<div style="display:flex;gap:10px;margin-top:12px"><button class="book-btn hotel-book-btn" style="background:' + activeMoodColor + '" onclick="showBookingPopup(\'' + hotel.name + '\')">????????????</button><button class="refresh-btn" onclick="regenerateHotel()" style="margin-left:0">???? ??????"/button></div>';
  card.innerHTML = html;
}

function renderFood() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('foodSection');
  var grid = document.getElementById('foodGrid');
  section.classList.add('show');
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  // æ¶éè¡ç¨ä¸­ææé¤'
  var restaurants = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'restaurant') restaurants.push(item);
    });
  });
  // è¡¥å POIS ä¸­ææé¤åæ°'
  if (restaurants.length === 0) {
    restaurants = POIS.filter(function(p) { return p.category === 'restaurant'; }).slice(0, 6);
  }
  var localFavorites = restaurants.slice(0, 3);
  var html = '';
  // æ¬å°äººæ¨èæ '
  restaurants.forEach(function(r, idx) {
    var isLocal = idx < 3;
    var poiData = POIS.find(function(p) { return p.name === r.name; }) || {};
    var cuisineType = poiData.cuisineType || r.cuisineType || 'ç¹è²';
    var signatureDish = poiData.signatureDish || r.signatureDish || '';
    var foodEmoji = poiData.foodEmoji || r.foodEmoji || 'ð½';
    var localRating = poiData.localRating || r.localRating || (4.0 + Math.random() * 0.8).toFixed(1);
    var businessHours = poiData.businessHours || r.businessHours || '11:00-21:00';
    var peakHours = poiData.peakHours || r.peakHours || '12:00-13:00, 18:00-19:00';
    var avgPrice = poiData.ticketPrice || r.estimatedCost || 80;
    var queueTime = poiData.queueTime || r.queueTime || 20;
    var noiseLabel = poiData.noiseLevel <= 2 ? 'å®é' : poiData.noiseLevel <= 3 ? 'éä¸­' : 'ç­é¹';
    html += '<div class="food-card glass-panel' + (isLocal ? ' local-pick' : '') + '">';
    if (isLocal) html += '<div class="food-local-badge">???? ????????????"/div>';
    html += '<div class="food-card-header"><span class="food-emoji">' + foodEmoji + '</span><div class="food-card-title"><span class="food-card-name">' + r.name + '</span><span class="food-card-type">' + cuisineType + '</span></div><div class="food-card-rating"><span class="food-rating-star">ï¿½?' + localRating + '</span></div></div>';
    html += '<div class="food-card-body">';
    if (signatureDish) html += '<div class="food-signature">??????" + signatureDish + '</div>';
    html += '<div class="food-card-meta"><span>ð° äººå Â¥' + avgPrice + '</span><span>ð ' + businessHours + '</span><span>ð ' + noiseLabel + '</span></div>';
    html += '<div class="food-card-meta"><span>??????????" + queueTime + 'åé</span><span>ð¥ é«å³°' + peakHours + '</span></div>';
    html += '</div></div>';
  });
  grid.innerHTML = html;
}

function renderShopping() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('shoppingSection');
  var grid = document.getElementById('shoppingGrid');
  section.classList.add('show');
  // æ¶éè¡ç¨æ¶åçå'
  var cities = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
  });
  if (cities.length === 0) cities = ['æ­å·'];
  var items = SHOPPING_ITEMS.filter(function(s) { return cities.indexOf(s.city) !== -1; });
  if (items.length === 0) items = SHOPPING_ITEMS.slice(0, 6);
  var html = '';
  var categories = ['ç¹äº§', 'æä¿¡', 'æå', 'æé¥°'];
  html += '<div class="shopping-category-tabs">';
  categories.forEach(function(cat) {
    html += '<span class="shopping-cat-chip">' + cat + '</span>';
  });
  html += '</div>';
  html += '<div class="shopping-items">';
  items.forEach(function(s) {
    html += '<div class="shop-card glass-panel"><span class="shop-emoji">' + s.emoji + '</span><div class="shop-info"><span class="shop-name">' + s.name + '</span><span class="shop-desc">' + s.description + '</span><div class="shop-meta"><span class="shop-cat-tag">' + s.category + '</span><span>ï¿½?' + s.rating + '</span><span>ð° ' + s.priceRange + '</span></div><span class="shop-reason">ð¡ ' + s.recommendReason + '</span></div></div>';
  });
  html += '</div>';
  grid.innerHTML = html;
}

function renderCareLetter() {
  var section = document.getElementById('careLetterSection');
  var letter = document.getElementById('careLetter');
  section.classList.add('show');
  var hour = new Date().getHours();
  var greeting = hour < 6 ? 'æ·±å¤' : hour < 9 ? 'æ©å®' : hour < 12 ? 'ä¸å' : hour < 14 ? 'ä¸­å' : hour < 18 ? 'ä¸å' : 'æä¸';
  var care = {
    tired:   { title:'ä»å¤©åè®¸èªå·±æ¢ä¸', body:'ç²æ«ä¸æ¯è½¯å¼±ï¼æ¯èº«ä½å¨æéä½ éè¦ä¼æ¯ãæ³¡ä¸æ¯æ¸©ç­çè¶ï¼æ¾ä¸ä¸ªèæçè§è½ï¼ä¸éè¦åä»»ä½äºââåªæ¯å¼å¸ï¼åªæ¯å­å¨', action:'ç¹ä¸æ¯é¦è°è¡çï¼å¬ä¸é¦æ²¡ææ­è¯çè½»é³ä¹' },
    excited: { title:'è®©è¿ä»½è½éæµå¨èµ·', body:'å´å¥æ¯çå½åçç»½æ¾ãä»å¤©éåå»åä¸ä»¶ä½ ä¸ç´æ³åä½æ²¡åçäºï¼åªæåªæ¯èµ°åºé¨æ£ä¸ªæ­¥ï¼æèç»ä¸ä¸ªèæåæä¸ªçµè¯', action:'æè¿ä»½è½éåä¸æ¥ï¼æèç»ä¸æ¥ââåé åéè¦åºå£' },
    happy:   { title:'çææ­¤å»çå', body:'å¼å¿çæ¶åï¼ä¸çé½æ¯æè²è°çãä¸éè¦å¯»æ¾æä¹ï¼æ­¤å»æ¬èº«å°±æ¯æä¹ãå¦æå¯ä»¥ï¼è®°å¾æè¿ä»½æ¸©æä¼ éç»èº«è¾¹çäºº', action:'æä¸å¼ è®°å½æ­¤å»çç§çï¼æ¾è¿ä½ çæç»ªæ¥è®°é' },
    calm:    { title:'å¹³éæ¯æé«çº§çè½', body:'ä¸ç¾ä¸å¾ï¼ä¸å¿§ä¸æ§ãå¹³éä¸æ¯æ èï¼èæ¯åå¿è¶³å¤ä¸°çãä»å¤©çä¸åé½ååå¥½ââé³åãç©ºæ°ãåä½ èªå·±', action:'å°è¯äºåéçæ­£å¿µå¼å¸ï¼å¸æ°åç§ï¼å±æ¯åç§ï¼å¼æ°å­ç§' },
    anxious: { title:'ç¦èæ¯ä½ å¨ä¹çè¯', body:'æå¿åºæ±ãå¿è·³å éââè¿äºé½æ¯ä½ è®¤ççæ´»çè¯æ®ãæ·±å¼å¸ï¼æææ¾å¨å¿å£ï¼å¯¹èªå·±è¯´ï¼æå·²ç»åå¾å¾å¥½äº', action:'åä¸ä¸ä»¶ä»å¤©è®©ä½ æå°å®å¨çå°äºï¼åªæåªæ¯åå°äºä¸æ¯æ¸©åº¦åå¥½çæ°´' },
    sad:     { title:'æ²ä¼¤å¼å¾è¢«æ¸©æå¯¹', body:'ä½è½çæ¶åä¸éè¦æ¥çæ¯ä½ãç¼æ³ªæ¯å¿çµçé¨æ°´ï¼è½å®äºï¼å¤©ç©ºèªç¶ä¼æ¾æ´ãä»å¤©ä½ æ¯è¢«åè®¸èå¼±ç', action:'è£¹ä¸æ¡æè½¯çæ¯¯å­ï¼çä¸é¨æ¸©æççµå½±ï¼æèä»ä¹ä¹ä¸åââåªæ¯åè®¸èªå·±é¾è¿' },
    insomnia:{ title:'å¤æ·±äºï¼ä¸çå¾å®', body:'å¤±ç çå¤æï¼æç»ªåæ½®æ°´ä¸æ ·æ¶æ¥ãä¸éè¦å¼ºè¿«èªå·±å¥ç¡ââææ¶åï¼å®éçéçï¼ä¹æ¯åèªå·±å¯¹è¯ççè´µæ¶å', action:'æææºå±å¹è°å°ææï¼é­ä¸ç¼çï¼å¬ä¸æ®µç½åªé³ãç¡ä¸çä¹æ²¡å³ç³»ï¼æå¤©ä¼æ¯æ°çä¸å¤©' }
  };
  var c = care[activeMood] || care.calm;
  var quotes = ['ãä½ ä¸éè¦æä¸ºæ´å¥½çèªå·±ï¼ä½ åªéè¦æ´æ¸©æå°å¯¹å¾æ­¤å»çèªå·±ã','ãçæ´»ä¸æ¯é©¬ææ¾ï¼èæ¯æ£æ­¥ââåä¸æ¥ççè±ï¼ä¹æ¯ä¸ç§åè¿ã','ãä»å¤©ä½ å·²ç»å¾æ£äºï¼åªæåªæ¯èµ·åºãå¼å¸ãå­å¨ã','ãæç»ªåå¤©æ°ï¼æ²¡æå¥½åä¹åãé¨å¤©çæä¹ï¼æ¯è®©æ´å¤©çé³åæ´çè´µã','ãçæ­£çåæ¢ï¼ä¸æ¯ä»ä¸ç²æ«ï¼èæ¯ç²æ«æ¶ä¾ç¶éæ©æ¸©æå¯¹å¾èªå·±ã'];
  var quote = quotes[Math.floor(Math.random() * quotes.length)];
  letter.innerHTML = '<div class="care-letter-greeting">' + greeting + '</div><div class="care-letter-title">' + c.title + '</div><div class="care-letter-body">' + c.body + '</div><div class="care-letter-action">ï¿½?' + c.action + '</div><div class="care-letter-quote">' + quote + '</div>';
  // æä¼´æç¥çå³æéè¨
  var companionNote = {
    solo: 'ð ç¬èªæè¡æ¯ä¸æ¬¡ä¸èªå·±çæ·±åº¦å¯¹è¯ï¼äº«åè¿ä»½èªç±å§',
    couple: 'ð ä¸¤ä¸ªäººçæç¨ï¼æ¢ä¸ç¹ä¹æ²¡å³ç³»ï¼éè¦çæ¯å½¼æ­¤å¨èº«è¾¹',
    friends: 'ð åéºèä¸èµ·çæ¶åï¼å°±æ¯æå¥½çè§£è¯ãå°½ææ¬¢ç¬å§',
    family: 'ð¿ éªä¼´æ¯æé¿æçåç½ï¼è¿ä»½æ¢ä¸æ¥çæ¶åï¼å¼å¾çè',
    business: 'ï¿½?é«æåºè¡ï¼ä¹è¦è®°å¾ç§é¡¾å¥½èªå·±ãå·¥ä½å¾éè¦ï¼ä½ ä¹ä¸æ ·'
  };
  var note = companionNote[companionType];
  if (note) {
    letter.innerHTML += '<div class="care-letter-companion-note" style="margin-top:18px;padding:12px 16px;background:rgba(255,255,255,0.12);border-radius:10px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6">' + note + '</div>';
  }
}

function renderStats() {
  if (!stats) return;
  var row = document.getElementById('statsRow');
  row.style.display = 'flex';
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  row.innerHTML = '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">' + stats.filterPassed + '/' + stats.filterTotal + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.4)">éè¿è¿æ»¤</span></div>' +
    '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">' + stats.totalPois + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.4)">?????????"/span></div>' +
    '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">Â¥' + (stats.totalSaved || 0) + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.4)">æ¯ä»·èç</span></div>' +
    '<div class="glass-panel" style="flex:1;min-width:140px;padding:16px;text-align:center"><span style="font-size:24px;font-weight:700;color:' + activeMoodColor + '">??' + (stats.totalCost || 0) + '</span><br><span style="font-size:12px;color:rgba(255,255,255,0.4)">??????"/span></div>';
}

// ================================================================
//  è¡åæ¸åæ¸²æ
// ================================================================
function renderChecklist() {
  var section = document.getElementById('checklistSection');
  var card = document.getElementById('checklistCard');
  section.classList.add('show');

  var isBusiness = travelMode === 'business';

  // éç¨ç©å
  var commonItems = [
    { cat:'å¿å¤è¯ä»¶', items:['èº«ä»½ï¿½?æ¤ç§', 'ææº + åçµ', 'é±å/é¶è¡', 'é¥å'] },
    { cat:'çµå­è®¾å¤', items:['åçµ', 'æ°æ®', 'è³æº'] }
  ];

  // ææ¸¸æ¨¡å¼ä¸å±
  var tourismItems = [
    { cat:'æ·å¤é²æ¤', items:['é²æ', 'å¢¨é', 'é®é³', 'èéçéå­'] },
    { cat:'æç§æå¡', items:['ç¸æº/ææºæ¯æ¶', 'èªæ', 'åçµå®ï¼å¤å¸¦ä¸ä¸ªï¼'] },
    { cat:'éèº«å¥½ç©', items:['æ°´æ¯', 'å°é¶', 'çº¸å·¾/æ¹¿å·¾', 'ä¾¿æºé¨ä¼'] },
    { cat:'è¯å', items:['åå¯', 'æè½¦', 'é²è'] }
  ];

  // åå¡æ¨¡å¼ä¸å±
  var businessItems = [
    { cat:'å·¥ä½å¿å¤', items:['ç¬è®°æ¬çµ'+ åçµ', 'ä¼è®®èµæ/æä»¶', 'åç', ''+ ç¬è®°'] },
    { cat:'åºè¡æç', items:['åçµ', 'ä¾¿æºæ°´æ¯', 'å£é¦ï¿½?èè·', 'ä¾¿æºé¨ä¼'] },
    { cat:'è¡£ç©', items:['æ­£è£/åå¡', 'å¤ç¨è¡¬è¡«', 'åå¡'] },
    { cat:'è¯å', items:['åå¯', 'æå', 'èè¯'] }
  ];

  // æä¼´ä¸å±ç©å
  var companionItems = [];
  if (companionType === 'couple') {
    companionItems = [{ cat:'ð æä¾£ä¸å±', items:['æä¾£', 'æç«ï¿½?ç¸æº', 'å°ç¤¼', 'å±äº«æ­å'] }];
  } else if (companionType === 'friends') {
    companionItems = [{ cat:'ð¯ éºèä¸å±', items:['èªæï¿½?ä¸è', 'è¡¥å¦', 'éºè', 'ä¾¿æºé³å'] }];
  } else if (companionType === 'family') {
    companionItems = [
      { cat:'ð¶ äº²å­ä¸å±', items:['å¿ç«¥æ°´æ¯', 'å°é¶', 'ç»æ¬/ç©å·', 'å¤ç¨è¡£ç©', 'æ¹¿å·¾'] },
      { cat:'ð´ é¿è¾ä¸å±', items:['å¸¸ç¨è¯å', 'ä¿æ¸©', 'æå åå«', 'èè±', 'èå¤'] }
    ];
  }

  var allItems = commonItems.concat(isBusiness ? businessItems : tourismItems).concat(companionItems);

  var html = '<div class="checklist-title">' + (isBusiness ? 'ð¼' : 'ð') + ' ' + (isBusiness ? 'åå¡åºè¡å¿å¤æ¸å' : 'æè¡åºååæ£æ¥æ¸') + '</div>';
  html += '<div class="checklist-sub">' + (isBusiness ? 'åºåï¿½?å°æ¶æ£æ¥ï¼ç¡®ä¿ä¸æ ä¸' : 'åºåï¿½?å°æ¶éé¡¹æ£æ¥ï¼å®å¿åºå') + '</div>';
  html += '<div class="checklist-items">';

  var itemIndex = 0;
  allItems.forEach(function(cat) {
    html += '<div class="checklist-category">' + cat.cat + '</div>';
    cat.items.forEach(function(item) {
      html += '<div class="checklist-item" onclick="toggleChecklistItem(this)" data-idx="' + itemIndex + '"><div class="checklist-cb">"/div><div class="checklist-text">' + item + '</div></div>';
      itemIndex++;
    });
  });
  html += '</div>';
  html += '<div class="checklist-progress" id="checklistProgress">??????????0/' + itemIndex + ' '/div>';
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
  if (prog) {
    prog.textContent = 'å·²æ£ï¿½?' + checked.length + '/' + items.length + ' ';
  }
}

// ================================================================
//  è¡åæéï¼Notification API'
// ================================================================
var reminderTimer = null;

function scheduleReminder() {
  if (reminderTimer) clearTimeout(reminderTimer);
  var isBusiness = travelMode === 'business';

  // æ¨¡æ2å°æ¶ååºåï¼å®éå¼åä¸­ï¼è¿éç¨çå®åºåæ¶é´'
  // æ¼ç¤ºæ¶ç¨10ç§æ¨¡æï¼è®©ç¨æ·è½çå°ææ
  reminderTimer = setTimeout(function() {
    sendReminder(isBusiness);
  }, 10000); // 10ç§åè§¦åæ¼ç¤º
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
  var title = isBusiness ? 'ð¼ åºåæé ï¿½?åå¡åºè¡' : 'ðï¿½?åºåæé ï¿½?ä¼é²ææ¸¸';
  var options = {
    body: isBusiness
      ? 'è®°å¾æ£æ¥èº«ä»½è¯ååçµå®ï¼è·¯ä¸æ³¨æå®å¨ï¼å«è¿å°å¦'
      : 'å«å¿äºå¸¦é²æéåå¢¨éï¼åå¤å¼å¯å¥½å¿æ',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + (isBusiness ? 'ð¼' : 'ð') + '</text></svg>',
    tag: 'moodtravel-reminder',
    requireInteraction: true
  };
  try {
    new Notification(title, options);
  } catch (e) {
    // fallback: show toast
    showToast('ð¢ ' + title + '' + options.body);
  }
}

// ================================================================
//  å·æ°æå¤©è¡ç¨
// ================================================================
function regenerateDay(dayIndex) {
  if (!itinerary || dayIndex < 0 || dayIndex >= itinerary.length) return;
  showToast('' + (dayIndex + 1) + '????????????'..');

  var weights = getWeightKey();
  var dailyBudget = budget / days;
  var energyIdeal = MOOD_ENERGY_MAP[activeMood] || 2;
  var isLowEnergy = activeMood === 'tired' || activeMood === 'sad' || activeMood === 'anxious' || activeMood === 'insomnia';
  var isBusinessMode = travelMode === 'business';

  // å¢å¼ºç®æ³åéï¼ä¸doGenerateä¿æä¸è´ï¼
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
  if (weatherCondition.indexOf('') !== -1) {
    weatherPoiBoost = { indoor: 1.8, museum: 1.6, shopping: 1.5, food: 1.4, temple: 1.3 };
    weatherPoiBoost.outdoor = 0.3; weatherPoiBoost.nature = 0.4; weatherPoiBoost.adventure = 0.2;
  } else if (weatherCondition.indexOf('') !== -1) {
    weatherPoiBoost = { outdoor: 1.5, nature: 1.4, adventure: 1.3, landmark: 1.3 };
  }
  var energyCurve = [];
  for (var d = 0; d < days; d++) {
    energyCurve.push({ morning: 0.9 - (d * 0.05), afternoon: 0.75 - (d * 0.08), evening: 0.6 + (d * 0.05) });
  }
  // å¢å¼ºç®æ³åéç»æ
  // ð¯ æä¼´æç¥çæ¯æ¥ä¸'
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  var maxPerDay = ct ? ct.maxPoi : 4;
  if (isLowEnergy && maxPerDay > 2) maxPerDay = Math.max(2, maxPerDay - 1);
  if (isBusinessMode) maxPerDay = Math.min(maxPerDay, 3);

  // æ¶éå½åå·²ä½¿ç¨çPOI ID
  var used = new Set();
  itinerary.forEach(function(day, di) {
    if (di === dayIndex) return;
    day.items.forEach(function(it) {
      if (it.poiId) used.add(it.poiId);
    });
  });

  // éæ°è¯å + é²åé¿é·
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
    // ð¡ï¿½?é²åé¿é·
    if (isCouple && poi.category === 'restaurant' && poi.queueTime >= 30) return false;
    if (isCouple && poi.energyLevel >= 4) return false;
    if (isBusiness && poi.category === 'restaurant' && poi.romanticLevel >= 4) return false;
    if (isBusiness && poi.category === 'restaurant' && poi.noiseLevel >= 4) return false;
    if (hasElderly && poi.energyLevel >= 3 && (poi.tags || []).indexOf('å¾æ­¥') !== -1) return false;
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
      if (poi.tags && poi.tags.some(function(t) { return t === 'ç½çº¢' || t === 'æå¡' || t === 'æç§' || t === 'å°å' || t === 'ç¾é£'; })) friendsBonus += 20;
      if (poi.category === 'shopping' && (poi.tags || []).indexOf('å¤è¡') !== -1) friendsBonus += 15;
      if (poi.hasPhotoSpot) friendsBonus += 15;
      if (poi.category === 'restaurant' && poi.romanticLevel <= 2 && poi.noiseLevel >= 3) friendsBonus += 10;
    }

    var businessBonus = 0;
    if (isBusiness) {
      if (poi.energyLevel <= 1) businessBonus += 20;
      if (poi.category === 'restaurant' && poi.estimatedDuration <= 60) businessBonus += 15;
      if (poi.category === 'restaurant' && poi.noiseLevel <= 2) businessBonus += 10;
      if (poi.tags && poi.tags.some(function(t) { return t === 'é«ç«¯' || t === 'åå¡'; })) businessBonus += 15;
    }

    var soloBonus = 0;
    if (companionType === 'solo') {
      if (poi.energyLevel <= 2 && poi.crowdednessLevel <= 2) soloBonus += 15;
      if (poi.category === 'museum' || poi.category === 'leisure') soloBonus += 10;
    }

    var total = moodScore + budgetScore + energyScore + crowdScore + kidScore + elderlyScore + coupleScore + elderlyRestaurantBonus + coupleBonus + kidsBonus + elderlyBonus + friendsBonus + businessBonus + soloBonus;

    // å¢å¼ºç®æ³éæï¼å¿ææ'
    if (currentMoodWeights[poi.category]) total *= currentMoodWeights[poi.category];
    var poiTags = poi.tags || [];
    for (var tk in currentMoodWeights) {
      if (poiTags.indexOf(tk) !== -1) total *= currentMoodWeights[tk];
    }
    // å¤©æ°å æ
    if (weatherPoiBoost[poi.category]) total *= weatherPoiBoost[poi.category];
    if (poi.weatherSensitivity === 'indoor' && weatherPoiBoost.indoor) total *= weatherPoiBoost.indoor;
    // å­£èæ§è¯'
    if (poi.seasonalScore && poi.seasonalScore[season]) {
      total *= (poi.seasonalScore[season] / 5);
    }
    // æä¼´åå¥½
    if (compAdj.romanticPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.romanticPoi;
    }
    if (compAdj.familyPoi && poi.familyFriendly) {
      total *= compAdj.familyPoi;
    }
    if (compAdj.socialPoi && poi.romanticScore) {
      total *= (poi.romanticScore / 5) * compAdj.socialPoi;
    }
    // æ¶é´ç²¾åæ²çº¿
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
        items.push({ type:'restaurant', time:fmtTime(hour), name:lunchPoi.name, estimatedCost:lunchPoi.ticketPrice || 80, estimatedDuration:lunchPoi.estimatedDuration || 60, reason:'åé¤æ¶é´ï¼æ¨èéè¿é«è¯åé¤å', reasonTags:['ä½ç½®ä¾¿å©','é«è¯'], poiId:lunchPoi.id });
        hour += 1;
      }
    }
    if (!isBusinessMode && ((activeMood === 'tired' || activeMood === 'sad') || companionType === 'family') && idx === midIdx) {
      var restReason = companionType === 'family' ? 'é¿è¾/äº²å­æ¨¡å¼ï¼èªå¨æå¥åä¼æ¶é´ï¼é¿åä½åéæ¯' : 'ç²æ«æ¨¡å¼ï¼èªå¨æå¥åå°æ¶ä¼æ¯ï¼é¿åä½åéæ¯';
      items.push({ type:'rest', time:fmtTime(hour), name: companionType === 'family' ? 'ð¿ åä¼æ¶é´' : 'ï¿½?ä¼æ¯æ¶é´', estimatedCost:30, estimatedDuration: companionType === 'family' ? 60 : 30, reason: restReason, reasonTags:['å¿æå¹é','ä½åä¿æ¤'] });
      hour += companionType === 'family' ? 1 : 0.5;
    }
    var dur = dayPoi.estimatedDuration ? dayPoi.estimatedDuration / 60 : (isLowEnergy ? 2 : 1.5);
    if (isBusinessMode) dur = Math.min(dur, 1.5);
    var poiItem = {
      type: 'poi', time: fmtTime(hour), name: dayPoi.name, estimatedCost: dayPoi.ticketPrice || 0,
      estimatedDuration: dayPoi.estimatedDuration || 90, tags: dayPoi.tags || [],
      reason: genReason(dayPoi), reasonTags: genTags(dayPoi), poiId: dayPoi.id,
      mapX: dayPoi.mapX, mapY: dayPoi.mapY, city: getPoiCity(dayPoi.mapX, dayPoi.mapY), weatherSensitivity: dayPoi.weatherSensitivity
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
  showToast('' + (dayIndex + 1) + 'å¤©å·²å·æ°');
}

// ================================================================
//  å·æ°éåºæ¨è
// ================================================================
function regenerateHotel() {
  if (!HOTELS || HOTELS.length === 0) return;
  showToast('æ­£å¨ä¸ºæ¨æ´æ¢éåº...');

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

  // å¾ªç¯éæ©ä¸ä¸ä¸ªé'
  var idx = hotelIndex % hotelCandidates.length;
  var best = hotelCandidates[idx];

  var platforms = [
    { name:'æºç¨', icon:'ð¨', price:Math.round(best.priceRangeLow * 1.0), features:'å«æ©', isBest:false },
    { name:'ç¾å¢', icon:'ð', price:Math.round(best.priceRangeLow * 0.95), features:'å«æ©ä¸å¯åæ¶', isBest:true },
    { name:'é£çª', icon:'ð·', price:Math.round(best.priceRangeLow * 0.92), features:'åè´¹åçº§æ¿å', isBest:false },
    { name:'å»åª', icon:'âï¸', price:Math.round(best.priceRangeLow * 0.97), features:'å«å', isBest:false }
  ];
  var bestPlat = platforms.find(function(p) { return p.isBest; });
  hotel = {
    name: best.name, rating: best.rating, price: best.priceRangeLow,
    bestPrice: bestPlat.price, bestPlatform: bestPlat.name, bestReason: bestPlat.features,
    savedAmount: Math.max.apply(null, platforms.map(function(p) { return p.price; })) - bestPlat.price,
    platforms: platforms, reason: genHotelReason(best)
  };

  renderHotel();
  showToast('éåºå·²æ´');
}

// ================================================================
//  å°å¾å¯è§'
// ================================================================
// ================================================================
//  æµæ±11ååæ ï¼viewBox 0 0 100 100'
// ================================================================
var ZJ_CITY_MAP = {
  'æ­å·': {x:38,y:28}, 'å®æ³¢': {x:70,y:34}, 'æ¸©å·': {x:58,y:70},
  'åå´': {x:50,y:18}, 'æ¹å·': {x:30,y:15}, 'ç»å´': {x:52,y:38},
  'éå': {x:36,y:50}, 'è¡¢å·': {x:10,y:46}, 'èå±±': {x:80,y:28},
  'å°å·': {x:64,y:56}, 'ä¸½æ°´': {x:28,y:66}
};

// å¤æ­POIå±äºåªä¸ªåå¸ï¼åºäºåæ æè¿çåå¸'
function getPoiCity(mapX, mapY) {
  var minDist = Infinity, city = 'æ­å·';
  for (var c in ZJ_CITY_MAP) {
    var dx = mapX - ZJ_CITY_MAP[c].x;
    var dy = mapY - ZJ_CITY_MAP[c].y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < minDist) { minDist = dist; city = c; }
  }
  return city;
}

// å½åé«äº®çå¤©æ°ï¼-1 = å¨é¨æ¾ç¤º'
var highlightedDay = -1;

function renderMap() {
  if (!itinerary || itinerary.length === 0) return;
  var svg = document.getElementById('mapSvg');
  var section = document.getElementById('mapSection');
  section.classList.add('show');
  highlightedDay = -1;

  var allPoints = [];
  itinerary.forEach(function(day, di) {
    day.items.forEach(function(item, ii) {
      if (item.mapX !== undefined && item.mapY !== undefined) {
        allPoints.push({
          x: item.mapX, y: item.mapY,
          name: item.name, type: item.type,
          dayIndex: di, itemIndex: ii,
          city: getPoiCity(item.mapX, item.mapY)
        });
      }
    });
  });

  if (allPoints.length === 0) { svg.innerHTML = ''; return; }

  var isBusiness = travelMode === 'business';
  var routeColor = isBusiness ? '#4682B4' : '#FFA500';
  var routeColorEnd = isBusiness ? '#60A5FA' : '#FFD700';

  var html = '';

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  DEFS: æææ¸ååè·¯å¾å®ä¹
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  html += '<defs>';
  // æµ·æ´æ¸å
  html += '<radialGradient id="oceanGrad" cx="70%" cy="40%"><stop offset="0%" stop-color="#1A4060"/><stop offset="100%" stop-color="#0F1A2A"/></radialGradient>';
  // è·¯çº¿æ¸å
  for (var di = 0; di < itinerary.length; di++) {
    html += '<linearGradient id="routeGrad_' + di + '" x1="0%" y1="0%" x2="100%" y2="0%">';
    html += '<stop offset="0%" stop-color="' + routeColor + '" stop-opacity="0.9"/>';
    html += '<stop offset="100%" stop-color="' + routeColorEnd + '" stop-opacity="0.9"/>';
    html += '</linearGradient>';
  }
  html += '</defs>';

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  LAYER 0: æµæ±å°å½¢åºå¾
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  html += drawZhejiangBase();

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  LAYER 1: åç»è·¯çº¿ï¼æ¯å¤©ä¸ï¿½?group'
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  var totalRouteLength = 0;
  var daySegments = {}; // { dayIndex: [ {x1,y1,x2,y2,length} ] }

  itinerary.forEach(function(day, di) {
    daySegments[di] = [];
    var dayPoints = [];
    day.items.forEach(function(item) {
      if (item.mapX !== undefined && item.mapY !== undefined) {
        dayPoints.push({ x: item.mapX, y: item.mapY, city: getPoiCity(item.mapX, item.mapY) });
      }
    });

    for (var i = 1; i < dayPoints.length; i++) {
      var prev = dayPoints[i-1], curr = dayPoints[i];
      var dx = prev.x - curr.x, dy = prev.y - curr.y;
      var segLen = Math.sqrt(dx*dx + dy*dy);
      totalRouteLength += segLen;
      daySegments[di].push({ x1: prev.x, y1: prev.y, x2: curr.x, y2: curr.y, length: segLen, sameCity: prev.city === curr.city });
    }
  });

  // ç»å¶æ¯å¤©è·¯çº¿
  for (var di = 0; di < itinerary.length; di++) {
    html += '<g class="map-route-group" id="routeGroup_' + di + '">';

    itinerary[di].items.forEach(function(item, ii) {
      // è·¨åäº¤éæ'
      if (ii > 0) {
        var prevItem = itinerary[di].items[ii-1];
        if (prevItem.mapX !== undefined && item.mapX !== undefined) {
          var prevCity = getPoiCity(prevItem.mapX, prevItem.mapY);
          var currCity = getPoiCity(item.mapX, item.mapY);
          if (prevCity !== currCity) {
            var mx = (prevItem.mapX + item.mapX) / 2;
            var my = (prevItem.mapY + item.mapY) / 2;
            html += '<line x1="' + prevItem.mapX + '" y1="' + prevItem.mapY + '" x2="' + item.mapX + '" y2="' + item.mapY + '" class="map-transit-arrow" stroke-dasharray="2 2" stroke="rgba(255,255,255,0.4)" stroke-width="0.6" fill="none"/>';
            html += '<text x="' + (mx - 1.5) + '" y="' + (my - 1.5) + '" class="map-transit-icon" fill="rgba(255,255,255,0.55)">ð</text>';
          }
        }
      }
    });

    // è·¯çº¿è·¯å¾ï¼è´å¡å°æ²çº¿ä¸å¸¦'
    var dayPoints = [];
    itinerary[di].items.forEach(function(item) {
      if (item.mapX !== undefined && item.mapY !== undefined) {
        dayPoints.push({ x: item.mapX, y: item.mapY });
      }
    });

    if (dayPoints.length >= 2) {
      var pathD = buildSmoothPath(dayPoints);
      html += '<path d="' + pathD + '" class="map-route-path' + (isBusiness ? ' business' : '') + '" stroke="url(#routeGrad_' + di + ')" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>';
    }

    html += '</g>';
  }

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  LAYER 2: å¨æåç¹ï¼æ²¿å¨é¨è·¯çº¿å¾ªç¯ï¼
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  if (totalRouteLength > 0) {
    // æå»ºå®æ´è·¯çº¿è·¯å¾ç¨äºå¨ç»
    var allPathPoints = [];
    allPoints.forEach(function(p) { allPathPoints.push({ x: p.x, y: p.y }); });
    var fullPathD = buildSmoothPath(allPathPoints);
    var dur = Math.max(4, totalRouteLength * 0.5);
    html += '<defs><path id="travelerPath" d="' + fullPathD + '"/></defs>';
    html += '<circle r="2.5" fill="' + (isBusiness ? '#60A5FA' : '#FFD700') + '" class="map-traveler' + (isBusiness ? ' business' : '') + '" style="--travel-duration:' + dur + 's;--travel-length:' + (totalRouteLength * 2) + '" opacity="0.9">';
    html += '<animateMotion dur="' + dur + 's" repeatCount="indefinite" rotate="auto"><mpath href="#travelerPath"/></animateMotion>';
    html += '</circle>';
    // åæ
    html += '<circle r="6" fill="' + (isBusiness ? '#60A5FA' : '#FFD700') + '" class="map-traveler' + (isBusiness ? ' business' : '') + '" style="--travel-duration:' + dur + 's;--travel-length:' + (totalRouteLength * 2) + '" opacity="0.25">';
    html += '<animateMotion dur="' + dur + 's" repeatCount="indefinite" rotate="auto"><mpath href="#travelerPath"/></animateMotion>';
    html += '</circle>';
  }

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  LAYER 4: POI èç¹
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  var allPoiNodes = [];
  allPoints.forEach(function(pt, idx) {
    var color = pt.type === 'rest' ? 'rgba(163,181,166,0.8)' : pt.type === 'restaurant' ? '#E8A85A' : '#8BA88C';
    var isStart = (idx === 0);
    var isEnd = (idx === allPoints.length - 1);

    allPoiNodes.push({ pt: pt, color: color, isStart: isStart, isEnd: isEnd, globalIdx: idx });
  });

  allPoiNodes.forEach(function(node) {
    var pt = node.pt, color = node.color;
    html += '<g class="map-poi-group" id="poiNode_' + node.globalIdx + '" data-day="' + pt.dayIndex + '">';

    // å¤ååç¯
    html += '<circle class="map-poi-outer" cx="' + pt.x + '" cy="' + pt.y + '" r="8" fill="' + color + '" opacity="0.2"/>';

    // åç¹
    html += '<circle class="map-poi-inner" cx="' + pt.x + '" cy="' + pt.y + '" r="3.5" fill="' + color + '" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>';

    // é¤åç¹æ®æ è®°ï¼ç¾é£å¾'
    if (pt.type === 'restaurant') {
      html += '<text x="' + (pt.x + 4.5) + '" y="' + (pt.y + 1.5) + '" font-size="4" text-anchor="middle" class="food-map-marker" fill="#E8A85A">ð</text>';
    }

    // èµ·ç¹æ è®°
    if (node.isStart) {
      html += '<polygon class="map-start-marker" points="' + pt.x + ',' + (pt.y - 8) + ' ' + (pt.x - 3.5) + ',' + (pt.y - 3) + ' ' + (pt.x + 3.5) + ',' + (pt.y - 3) + '"/>';
      html += '<text x="' + pt.x + '" y="' + (pt.y - 10) + '" text-anchor="middle" fill="' + activeMoodColor + '" font-size="3.5" font-weight="700">åºå</text>';
    }
    // ç»ç¹æ è®°
    if (node.isEnd && !node.isStart) {
      html += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="3.5" fill="none" stroke="#FF6B6B" stroke-width="1.5" stroke-dasharray="1.5 1"/>';
      html += '<text x="' + pt.x + '" y="' + (pt.y - 7) + '" text-anchor="middle" fill="#FF6B6B" font-size="3" font-weight="600">ç»ç¹</text>';
    }

    // æ¯å¤©ç¬¬ä¸ä¸ªPOIï¼æ°å­æ°'
    if (pt.itemIndex === 0 && pt.type === 'poi') {
      html += '<rect x="' + (pt.x - 5) + '" y="' + (pt.y - 12) + '" width="10" height="7" rx="3.5" class="map-poi-bubble" stroke="' + color + '"/>';
      html += '<text x="' + pt.x + '" y="' + (pt.y - 8.5) + '" class="map-poi-bubble-text">D' + (pt.dayIndex + 1) + '</text>';
    }

    // æ ç­¾
    var label = pt.name.length > 5 ? pt.name.substring(0, 5) + '' : pt.name;
    html += '<text class="map-poi-label-text" x="' + pt.x + '" y="' + (pt.y + 9) + '">' + label + '</text>';

    html += '</g>';
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  LAYER 5: è·¨åæ è¯
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  var cities = [];
  allPoints.forEach(function(p) { if (cities.indexOf(p.city) === -1) cities.push(p.city); });
  if (cities.length > 1) {
    html += '<text x="2" y="97" fill="rgba(255,255,255,0.35)" font-size="2.5">????????????" + cities.join(' ï¿½?') + '</text>';
  }

  svg.innerHTML = html;

  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  //  å°å¾æ§å¶æé®
  // ââââââââââââââââââââââââââââââââââââââââââââââ'
  var controlsEl = document.getElementById('mapControls');
  var ctrlHtml = '<button class="map-ctrl-btn active" onclick="flyToDay(-1)">å¨é¨è·¯çº¿</button>';
  for (var di = 0; di < itinerary.length; di++) {
    ctrlHtml += '<button class="map-ctrl-btn" id="mapCtrlBtn_' + di + '" onclick="flyToDay(' + di + ')">Day ' + (di + 1) + '</button>';
  }
  controlsEl.innerHTML = ctrlHtml;
}

// ================================================================
//  ç»å¶æµæ±å°å½¢åºå¾ï¼SVG'
// ================================================================
function drawZhejiangBase() {
  var h = '';
  // èæ¯æµ·å ï¿½?ä¸æµ·
  h += '<rect x="0" y="0" width="100" height="100" fill="url(#oceanGrad)" opacity="0.3"/>';

  // æµæ±éå°è½®å»ï¼ç®åå¤è¾¹å½¢ ï¿½?æ´ç²¾ç¡®çè½®å»'
  h += '<path class="map-terrain" fill="rgba(40,60,50,0.5)" stroke="rgba(100,160,140,0.15)" stroke-width="0.3" d="' +
    'M12,48 L10,46 L8,40 L12,32 L18,22 L26,18 L32,15 L36,12 L44,14 L52,18 L56,22 L58,28 L62,30 L68,28 L76,24 L82,28 L84,32 ' +
    'L78,36 L74,40 L72,48 L70,54 L66,60 L62,64 L58,70 L54,74 L48,76 L42,74 L36,70 L30,68 L24,64 L20,60 L16,56 L12,48 Z' +
  '"/>';

  // éå°çº¹çå å 
  h += '<path class="map-terrain" fill="rgba(50,80,65,0.15)" d="' +
    'M14,46 L12,34 L20,24 L28,18 L34,14 L42,16 L50,20 L54,24 L56,30 L60,32 L66,30 L74,26 L80,30 L82,34 L76,38 L72,42 L70,50 L68,56 L64,62 L60,66 L56,72 L50,74 L44,72 L38,68 L32,66 L26,62 L22,58 L18,52 L14,46 Z' +
  '"/>';

  // æ°´ç³» ï¿½?é±å¡æ±ãæ­å·æ¹¾ãåå²æ¹
  h += '<path class="map-water" fill="rgba(60,150,200,0.12)" d="' +
    'M36,24 Q40,28 44,26 Q48,24 50,22 Q54,20 56,24 Q58,28 56,32" stroke="rgba(80,170,220,0.15)" stroke-width="0.3" fill="none"/>';
  h += '<ellipse class="map-water" cx="56" cy="22" rx="8" ry="3" fill="rgba(60,150,200,0.1)"/>';
  h += '<ellipse class="map-water" cx="26" cy="52" rx="3" ry="2" fill="rgba(60,150,200,0.08)"/>'; // åå²'

  // å±±è ï¿½?å¤©ç®å±±ãéè¡å±±ãå¤©å°å±±
  h += '<path fill="rgba(60,100,80,0.08)" d="M20,22 Q24,18 28,20 Q26,24 22,26 Z"/>';
  h += '<path fill="rgba(60,100,80,0.08)" d="M60,56 Q64,52 66,56 Q64,60 60,60 Z"/>';
  h += '<path fill="rgba(60,100,80,0.06)" d="M30,64 Q34,60 36,64 Q34,68 30,68 Z"/>';
  h += '<path fill="rgba(60,100,80,0.06)" d="M62,58 Q66,54 68,58 Q66,62 62,60 Z"/>'; // å¤©å°'

  // èå±±ç¾¤å²å°ç¹
  h += '<circle cx="80" cy="28" r="1.5" class="map-city-dot" fill="rgba(255,255,255,0.35)"/>';
  h += '<circle cx="82" cy="26" r="0.8" class="map-city-dot" fill="rgba(255,255,255,0.1)"/>';
  h += '<circle cx="83" cy="30" r="0.6" class="map-city-dot" fill="rgba(255,255,255,0.14)"/>';

  // 11ä¸ªåå¸æ ï¿½?ï¿½?å¢å¼ºçï¼åååç¹ + åå¸'+ ç¹è²æ ç­¾'
  var cityVibes = {
    'æ­å·': 'äººé´å¤©å ', 'å®æ³¢': 'æ¸¯éå¤©', 'æ¸©å·': 'å±±æ°´ä¹å',
    'åå´': 'æ¢¦éæ°´ä¹¡', 'æ¹å·': 'æ¸ä¸½ä¹å°', 'ç»å´': 'æ²¡æå´å¢çåç©é¦',
    'éå': 'ä¸æ¹å¥½è±', 'è¡¢å·': 'åå­å£å°', 'èå±±': 'æµ·å¤©ä½å½',
    'å°å·': 'ååå£å°', 'ä¸½æ°´': 'æµæ±ç»¿è°·'
  };
  for (var c in ZJ_CITY_MAP) {
    var p = ZJ_CITY_MAP[c];
    // åååæ
    h += '<circle cx="' + p.x + '" cy="' + p.y + '" r="2.5" fill="rgba(139,168,140,0.15)"/>';
    // åå¸'
    h += '<circle cx="' + p.x + '" cy="' + p.y + '" r="1.2" class="map-city-dot" data-city="' + c + '"/>';
    // åå¸'
    h += '<text x="' + p.x + '" y="' + (p.y + 3.5) + '" class="map-city-label" text-anchor="middle" data-city="' + c + '">' + c + '</text>';
    // ç¹è²æ ç­¾ï¼å°å­ï¼
    var vibe = cityVibes[c] || '';
    if (vibe) {
      h += '<text x="' + p.x + '" y="' + (p.y - 2.5) + '" class="map-city-vibe" text-anchor="middle" data-city="' + c + '">' + vibe + '</text>';
    }
  }

  // åå¸é´è¿çº¿ï¼èçº¿ï¼å±ç¤ºæµæ±åå¸ç¾¤'
  var cityPairs = [
    ['æ­å·','å®æ³¢'], ['æ­å·','åå´'], ['æ­å·','ç»å´'], ['æ­å·','æ¹å·'],
    ['å®æ³¢','èå±±'], ['å®æ³¢','å°å·'], ['æ¸©å·','å°å·'], ['éå','ä¸½æ°´'],
    ['ç»å´','å®æ³¢'], ['åå´','æ¹å·']
  ];
  cityPairs.forEach(function(pair) {
    var a = ZJ_CITY_MAP[pair[0]], b = ZJ_CITY_MAP[pair[1]];
    if (a && b) {
      h += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="rgba(255,255,255,0.1)" stroke-width="0.3" stroke-dasharray="1,2"/>';
    }
  });

  // æ°´ç³»æ ç­¾
  h += '<text x="56" y="22" class="map-water-label" text-anchor="middle">??????"/text>';
  h += '<text x="80" y="34" class="map-water-label" text-anchor="middle">ä¸æµ·</text>';

  return h;
}

// ================================================================
//  æå»ºå¹³æ»è´å¡å°è·¯'
// ================================================================
function buildSmoothPath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return 'M' + points[0].x + ' ' + points[0].y + ' L' + points[1].x + ' ' + points[1].y;
  }
  var d = 'M' + points[0].x + ' ' + points[0].y;
  for (var i = 0; i < points.length - 1; i++) {
    var cp1x = points[i].x + (points[i+1].x - (i > 0 ? points[i-1].x : points[i].x)) * 0.25;
    var cp1y = points[i].y + (points[i+1].y - (i > 0 ? points[i-1].y : points[i].y)) * 0.25;
    var cp2x = points[i+1].x - (points[i+1].x - points[i].x) * 0.25;
    var cp2y = points[i+1].y - (points[i+1].y - points[i].y) * 0.25;
    d += ' C' + cp1x + ' ' + cp1y + ',' + cp2x + ' ' + cp2y + ',' + points[i+1].x + ' ' + points[i+1].y;
  }
  return d;
}

// ================================================================
//  å°å¾èå¨ï¼Fly-to é«äº®æå¤©
// ================================================================
function flyToDay(dayIndex) {
  highlightedDay = dayIndex;

  // æ´æ°è·¯çº¿å¯è§'
  var groups = document.querySelectorAll('.map-route-group');
  groups.forEach(function(g) {
    if (dayIndex === -1) {
      g.classList.remove('dimmed');
    } else {
      var gDay = parseInt(g.id.replace('routeGroup_', ''));
      if (gDay === dayIndex) {
        g.classList.remove('dimmed');
      } else {
        g.classList.add('dimmed');
      }
    }
  });

  // æ´æ° POI èç¹å¯è§'
  var poiGroups = document.querySelectorAll('.map-poi-group');
  poiGroups.forEach(function(g) {
    var poiDay = parseInt(g.getAttribute('data-day') || '0');
    if (dayIndex === -1) {
      g.style.opacity = '1';
    } else {
      g.style.opacity = (poiDay === dayIndex) ? '1' : '0.2';
    }
  });

  // æ´æ°æ§å¶æé®ç¶'
  var ctrlBtns = document.querySelectorAll('.map-ctrl-btn');
  ctrlBtns.forEach(function(btn) { btn.classList.remove('active'); });
  if (dayIndex === -1) {
    ctrlBtns[0].classList.add('active');
  } else {
    var targetBtn = document.getElementById('mapCtrlBtn_' + dayIndex);
    if (targetBtn) targetBtn.classList.add('active');
  }

  // æ´æ°è¡ç¨å¡çé«äº®
  var dayHeaders = document.querySelectorAll('.day-header');
  dayHeaders.forEach(function(h) { h.classList.remove('active-day'); });
  if (dayIndex >= 0) {
    var targetHeader = document.getElementById('dayHeader_' + dayIndex);
    if (targetHeader) targetHeader.classList.add('active-day');
  }

  // Fly-to å¨ç»ï¼æ»å¨å°å°å¾
  var mapSection = document.getElementById('mapSection');
  if (mapSection && dayIndex >= 0) {
    mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ================================================================
//  é¨å¤©å¤éå'
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
//  å¯¼åºåè½
// ================================================================
var exportContentText = '';

function exportMarkdown() {
  if (!itinerary || itinerary.length === 0) return;
  var titleMap = {
    solo: 'ð§ æµæ±ç¬èªæè¡ï¼ä¸èªå·±å¯¹è¯çæ²»æä¹',
    couple: 'ð æµæ±æä¾£æ¸¸ï¼çèæ¶åï¼æµªæ¼«ä¸è¸©é·',
    friends: 'ð¯ââï¿½?æµæ±éºèæ¸¸ï¼åéæµæ±ä¸è¸©é·ï¼',
    family: 'ð¨âð©âï¿½?æµæ±é¿è¾æ¸¸ï¼æ¢èå¥ï¼äº«å¤©',
    business: 'ð¼ æµæ±åå¡åºè¡ï¼é«æè¡ç¨ï¼çå¿çå'
  };
  var title = titleMap[companionType] || 'ðºï¿½?MoodTravel è¡ç¨è§å';
  var md = '# ' + title + '\n\n';
  md += '> å¿æ' + activeMood + ' | æä¼´' + (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label + ' | é¢ç®ï¼' + budget + ' | å¤©æ°' + days + 'å¤©\n\n';

  itinerary.forEach(function(day) {
    md += '## Day ' + day.day + '\n\n';
    day.items.forEach(function(item, idx) {
      if (idx > 0 && item.transitTime) {
        md += '> ð ' + item.transitTime + 'åéè½¦ç¨\n\n';
      }
      var icon = item.type === 'rest' ? '' : item.type === 'restaurant' ? 'ð½' : 'ð';
      md += '### ' + icon + ' ' + item.time + ' ï¿½?' + item.name + '\n';
      md += '- è´¹ç¨ï¼' + (item.estimatedCost || 0) + '\n';
      if (item.estimatedDuration) md += '- é¢è®¡æ¸¸ç©' + item.estimatedDuration + 'åé\n';
      if (item.reason) md += '- æ¨èçç±' + item.reason + '\n';
      if (item.reasonTags && item.reasonTags.length) md += '- æ ç­¾' + item.reasonTags.join('') + '\n';
      if (item.rain_plan) md += '- ð§ï¿½?é¨å¤©å¤éï¼' + item.rain_plan.name + 'ï¼' + (item.rain_plan.estimatedCost || 0) + 'ï¼\n';
      md += '\n';
    });
  });

  if (hotel) {
    md += '## ð¨ æ¨èéåº\n\n';
    md += '- **' + hotel.name + '** ' + hotel.rating + 'å\n';
    md += '- æä¼ä»·æ ¼ï¼' + hotel.bestPlatform + ' Â¥' + hotel.bestPrice + '' + hotel.bestReason + 'ï¼\n';
    md += '- æ¨èçç±' + hotel.reason + '\n';
  }

  if (stats) {
    md += '\n---\n';
    md += 'æ»é¢ç®ï¼Â¥' + stats.totalCost + ' | ç²¾éæ¯ç¹ï¼' + stats.totalPois + ' | æ¯ä»·èçï¼' + (stats.totalSaved || 0) + '\n';
  }

  exportContentText = md;
  document.getElementById('exportModalTitle').textContent = 'ð Markdown è¡ç¨é¢è§';
  document.getElementById('exportModalContent').textContent = md;
  document.getElementById('exportModalOverlay').classList.add('show');
}

function exportHTML() {
  if (!itinerary || itinerary.length === 0) return;
  var titleMap = {
    solo: 'ð§ æµæ±ç¬èªæè¡ï¼ä¸èªå·±å¯¹è¯çæ²»æä¹',
    couple: 'ð æµæ±æä¾£æ¸¸ï¼çèæ¶åï¼æµªæ¼«ä¸è¸©é·',
    friends: 'ð¯ââï¿½?æµæ±éºèæ¸¸ï¼åéæµæ±ä¸è¸©é·ï¼',
    family: 'ð¨âð©âï¿½?æµæ±é¿è¾æ¸¸ï¼æ¢èå¥ï¼äº«å¤©',
    business: 'ð¼ æµæ±åå¡åºè¡ï¼é«æè¡ç¨ï¼çå¿çå'
  };
  var title = titleMap[companionType] || 'MoodTravel è¡ç¨è§å';
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>' + title + '</title>';
  html += '<style>
/* ================================================================
   CSS åé & å¨å±éç½®
   ================================================================ */
:root {
  --easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --easing-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --easing-smooth: cubic-bezier(0.65, 0, 0.35, 1);
  --font-display: 'Playfair Display', 'Noto Serif SC', 'Georgia', serif;
  --font-body: 'Inter', 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif;
  --font-title: 'Montserrat', 'Inter', system-ui, sans-serif;
  /* Tier 1 glass */
  --glass-1-bg: rgba(255,255,255,0.06);
  --glass-1-border: rgba(255,255,255,0.12);
  --glass-1-blur: blur(24px);
  /* Tier 2 glass */
  --glass-2-bg: rgba(255,255,255,0.04);
  --glass-2-blur: blur(16px);
  /* Tier 3 glass (hover) */
  --glass-3-bg: rgba(255,255,255,0.1);
  /* Depth */
  --bg-deep: #0a0a0f;
  --bg-surface: #12121a;
  --bg-elevated: #1a1a2e;
  --text-primary: rgba(255,255,255,0.92);
  --text-secondary: rgba(255,255,255,0.6);
  --text-muted: rgba(255,255,255,0.35);
  --border-subtle: rgba(255,255,255,0.08);
  --border-default: rgba(255,255,255,0.12);
  --border-strong: rgba(255,255,255,0.2);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100vw; height: 100vh;
  overflow: hidden;
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  font-weight: 300; line-height: 1.6; letter-spacing: 0.5px;
  background: #0a0a0f;
  color: var(--text-primary);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(5,5,15,0.92);
  z-index: -1;
  pointer-events: none;
}

.premium-page {
  width: 100vw; height: 100vh;
  overflow: hidden;
  position: relative;
}

/* ================================================================
   èæ¯ï¿½?ï¿½?5å±æ·±åº¦ç³»'   Layer 1: Deep gradient sky (mood-dependent)
   Layer 2: Floating geometric shapes
   Layer 3: Aurora/borealis effect
   Layer 4: Particle system (20+ particles)
   Layer 5: Gradient overlay for depth
   ================================================================ */
.bg-layer { position: fixed; inset: 0; z-index: 0; overflow: hidden; }

/* Layer 1: Sky gradient */
.bg-sky {
  position: absolute; inset: 0;
  transition: background 1.5s var(--easing);
}
.bg-sky.sky-calm    { background: linear-gradient(180deg, #0a1a0f 0%, #0d1f12 30%, #132a18 60%, #0f2015 100%); }
.bg-sky.sky-happy   { background: linear-gradient(180deg, #1a1208 0%, #241a0c 30%, #2a1e10 60%, #1a1208 100%); }
.bg-sky.sky-sad     { background: linear-gradient(180deg, #0a0f1a 0%, #0e1322 30%, #121830 60%, #0c1020 100%); }
.bg-sky.sky-anxious { background: linear-gradient(180deg, #120f1a 0%, #181422 30%, #1e1a2e 60%, #141020 100%); }
.bg-sky.sky-excited { background: linear-gradient(180deg, #1a0808 0%, #220c0c 30%, #2a1010 60%, #1a0808 100%); }
.bg-sky.sky-tired   { background: linear-gradient(180deg, #15100a 0%, #1c160e 30%, #221a12 60%, #18120c 100%); }
.bg-sky.sky-insomnia { background: linear-gradient(180deg, #080c18 0%, #0c1024 30%, #101830 60%, #0a0e1c 100%); }

/* Layer 2: Floating geometric shapes (8 shapes, varied) */
.bg-geo { position: absolute; inset: 0; }
.geo-shape {
  position: absolute;
  background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
  will-change: transform;
}
.geo-1 { width: 400px; height: 400px; top: -10%; left: -5%; border-radius: 50%; animation: geoFloat1 20s ease-in-out infinite; }
.geo-2 { width: 300px; height: 300px; top: 40%; right: -8%; border-radius: 50%; animation: geoFloat2 25s ease-in-out infinite; }
.geo-3 { width: 250px; height: 250px; bottom: 10%; left: 20%; border-radius: 50%; animation: geoFloat1 22s ease-in-out infinite; animation-delay: -7s; }
.geo-4 { width: 350px; height: 350px; top: 20%; left: 40%; border-radius: 50%; animation: geoFloat2 28s ease-in-out infinite; animation-delay: -12s; }
.geo-5 { width: 200px; height: 200px; bottom: 30%; right: 20%; border-radius: 50%; animation: geoFloat1 18s ease-in-out infinite; animation-delay: -5s; }
.geo-6 { width: 280px; height: 280px; top: 55%; left: 5%; border-radius: 40%; animation: geoFloat3 24s ease-in-out infinite; animation-delay: -3s; }
.geo-7 { width: 180px; height: 180px; top: 8%; right: 15%; border-radius: 35%; animation: geoFloat2 30s ease-in-out infinite; animation-delay: -15s; }
.geo-8 { width: 320px; height: 320px; bottom: 5%; right: 5%; border-radius: 45%; animation: geoFloat3 26s ease-in-out infinite; animation-delay: -9s; }

@keyframes geoFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.3; }
  25% { transform: translate(30px, -20px) scale(1.1) rotate(3deg); opacity: 0.5; }
  50% { transform: translate(-20px, -40px) scale(0.95) rotate(-2deg); opacity: 0.4; }
  75% { transform: translate(10px, -10px) scale(1.05) rotate(1deg); opacity: 0.45; }
}
@keyframes geoFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.25; }
  33% { transform: translate(-40px, -30px) scale(1.15) rotate(5deg); opacity: 0.45; }
  66% { transform: translate(20px, -50px) scale(0.9) rotate(-3deg); opacity: 0.35; }
}
@keyframes geoFloat3 {
  0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 0.28; }
  25% { transform: translate(-25px, -35px) scale(1.08) rotate(-4deg); opacity: 0.48; }
  50% { transform: translate(15px, -15px) scale(0.92) rotate(2deg); opacity: 0.38; }
  75% { transform: translate(-10px, -45px) scale(1.12) rotate(6deg); opacity: 0.42; }
}

/* Layer 3: Aurora / borealis (5 bands) */
.bg-aurora { position: absolute; inset: 0; }
.aurora-band {
  position: absolute; width: 120%; height: 220px; left: -10%;
  background: radial-gradient(ellipse at 50% 0%, rgba(139,168,140,0.12) 0%, transparent 70%);
  will-change: transform, opacity;
  animation: auroraDrift 15s ease-in-out infinite;
}
.aurora-band:nth-child(2) {
  top: 20%; background: radial-gradient(ellipse at 30% 0%, rgba(123,158,196,0.1) 0%, transparent 70%);
  animation-delay: -5s; animation-duration: 18s;
}
.aurora-band:nth-child(3) {
  top: 45%; background: radial-gradient(ellipse at 70% 0%, rgba(181,163,196,0.09) 0%, transparent 70%);
  animation-delay: -10s; animation-duration: 20s;
}
.aurora-band:nth-child(4) {
  top: 65%; background: radial-gradient(ellipse at 40% 0%, rgba(139,200,180,0.08) 0%, transparent 70%);
  animation-delay: -14s; animation-duration: 22s;
}
.aurora-band:nth-child(5) {
  top: 80%; background: radial-gradient(ellipse at 60% 0%, rgba(160,180,210,0.07) 0%, transparent 70%);
  animation-delay: -18s; animation-duration: 25s;
}
@keyframes auroraDrift {
  0%, 100% { transform: translateX(-8%) scaleY(1); opacity: 0.5; }
  25% { transform: translateX(3%) scaleY(1.4); opacity: 0.8; }
  50% { transform: translateX(8%) scaleY(1.1); opacity: 0.6; }
  75% { transform: translateX(-3%) scaleY(1.5); opacity: 0.75; }
}

/* Layer 4: Particle system (36 particles, varied sizes, glow, twinkle) */
.bg-particles { position: absolute; inset: 0; }
.particle {
  position: absolute; bottom: -10px; background: rgba(255,255,255,0.15);
  border-radius: 50%; will-change: transform, opacity;
  animation: particleRise linear infinite;
}
.particle:nth-child(1) { left: 2%; width: 3px; height: 3px; animation-duration: 16s; animation-delay: 0s; box-shadow: 0 0 6px rgba(255,255,255,0.3); }
.particle:nth-child(2) { left: 6%; width: 5px; height: 5px; animation-duration: 22s; animation-delay: -2s; box-shadow: 0 0 10px rgba(255,255,255,0.25); }
.particle:nth-child(3) { left: 10%; width: 2px; height: 2px; animation-duration: 14s; animation-delay: -4s; }
.particle:nth-child(4) { left: 14%; width: 4px; height: 4px; animation-duration: 18s; animation-delay: -6s; box-shadow: 0 0 8px rgba(255,255,255,0.2); }
.particle:nth-child(5) { left: 18%; width: 1px; height: 1px; animation-duration: 25s; animation-delay: -1s; }
.particle:nth-child(6) { left: 22%; width: 3px; height: 3px; animation-duration: 20s; animation-delay: -3s; box-shadow: 0 0 5px rgba(255,255,255,0.35); }
.particle:nth-child(7) { left: 26%; width: 5px; height: 5px; animation-duration: 12s; animation-delay: -5s; box-shadow: 0 0 12px rgba(255,255,255,0.2); }
.particle:nth-child(8) { left: 30%; width: 2px; height: 2px; animation-duration: 28s; animation-delay: -7s; }
.particle:nth-child(9) { left: 34%; width: 4px; height: 4px; animation-duration: 17s; animation-delay: -2s; box-shadow: 0 0 7px rgba(255,255,255,0.3); }
.particle:nth-child(10) { left: 38%; width: 1px; height: 1px; animation-duration: 24s; animation-delay: -8s; }
.particle:nth-child(11) { left: 42%; width: 3px; height: 3px; animation-duration: 15s; animation-delay: -4s; box-shadow: 0 0 5px rgba(255,255,255,0.25); }
.particle:nth-child(12) { left: 46%; width: 5px; height: 5px; animation-duration: 21s; animation-delay: -6s; box-shadow: 0 0 11px rgba(255,255,255,0.2); }
.particle:nth-child(13) { left: 50%; width: 2px; height: 2px; animation-duration: 13s; animation-delay: -9s; }
.particle:nth-child(14) { left: 54%; width: 4px; height: 4px; animation-duration: 26s; animation-delay: -3s; box-shadow: 0 0 9px rgba(255,255,255,0.25); }
.particle:nth-child(15) { left: 58%; width: 1px; height: 1px; animation-duration: 19s; animation-delay: -11s; }
.particle:nth-child(16) { left: 62%; width: 3px; height: 3px; animation-duration: 23s; animation-delay: -5s; box-shadow: 0 0 6px rgba(255,255,255,0.3); }
.particle:nth-child(17) { left: 66%; width: 5px; height: 5px; animation-duration: 16s; animation-delay: -8s; box-shadow: 0 0 10px rgba(255,255,255,0.2); }
.particle:nth-child(18) { left: 70%; width: 2px; height: 2px; animation-duration: 27s; animation-delay: -10s; }
.particle:nth-child(19) { left: 74%; width: 4px; height: 4px; animation-duration: 14s; animation-delay: -12s; box-shadow: 0 0 8px rgba(255,255,255,0.3); }
.particle:nth-child(20) { left: 78%; width: 1px; height: 1px; animation-duration: 30s; animation-delay: -7s; }
.particle:nth-child(21) { left: 82%; width: 3px; height: 3px; animation-duration: 18s; animation-delay: -13s; box-shadow: 0 0 5px rgba(255,255,255,0.25); }
.particle:nth-child(22) { left: 86%; width: 5px; height: 5px; animation-duration: 11s; animation-delay: -9s; box-shadow: 0 0 12px rgba(255,255,255,0.2); }
.particle:nth-child(23) { left: 90%; width: 2px; height: 2px; animation-duration: 22s; animation-delay: -14s; }
.particle:nth-child(24) { left: 94%; width: 4px; height: 4px; animation-duration: 15s; animation-delay: -11s; box-shadow: 0 0 7px rgba(255,255,255,0.3); }
.particle:nth-child(25) { left: 4%; width: 1px; height: 1px; animation-duration: 29s; animation-delay: -15s; }
.particle:nth-child(26) { left: 12%; width: 3px; height: 3px; animation-duration: 13s; animation-delay: -6s; box-shadow: 0 0 6px rgba(255,255,255,0.2); }
.particle:nth-child(27) { left: 24%; width: 5px; height: 5px; animation-duration: 20s; animation-delay: -16s; box-shadow: 0 0 11px rgba(255,255,255,0.15); }
.particle:nth-child(28) { left: 36%; width: 2px; height: 2px; animation-duration: 17s; animation-delay: -3s; }
.particle:nth-child(29) { left: 48%; width: 4px; height: 4px; animation-duration: 25s; animation-delay: -18s; box-shadow: 0 0 9px rgba(255,255,255,0.2); }
.particle:nth-child(30) { left: 60%; width: 1px; height: 1px; animation-duration: 21s; animation-delay: -10s; }
.particle:nth-child(31) { left: 72%; width: 3px; height: 3px; animation-duration: 16s; animation-delay: -19s; box-shadow: 0 0 5px rgba(255,255,255,0.3); }
.particle:nth-child(32) { left: 84%; width: 5px; height: 5px; animation-duration: 12s; animation-delay: -14s; box-shadow: 0 0 10px rgba(255,255,255,0.2); }
.particle:nth-child(33) { left: 16%; width: 2px; height: 2px; animation-duration: 28s; animation-delay: -7s; }
.particle:nth-child(34) { left: 44%; width: 4px; height: 4px; animation-duration: 19s; animation-delay: -20s; box-shadow: 0 0 8px rgba(255,255,255,0.25); }
.particle:nth-child(35) { left: 68%; width: 1px; height: 1px; animation-duration: 24s; animation-delay: -12s; }
.particle:nth-child(36) { left: 88%; width: 3px; height: 3px; animation-duration: 14s; animation-delay: -17s; box-shadow: 0 0 6px rgba(255,255,255,0.3); }

@keyframes particleRise {
  0% { transform: translateY(0) scale(0.8); opacity: 0; }
  3% { opacity: 0.7; }
  10% { opacity: 0.5; }
  20% { opacity: 0.35; }
  50% { opacity: 0.2; }
  80% { opacity: 0.1; }
  100% { transform: translateY(-100vh) scale(0.2); opacity: 0; }
}
@keyframes particleTwinkle {
  0%, 100% { opacity: 1; }
  30% { opacity: 0.3; }
  60% { opacity: 0.8; }
}

/* Starfield: 30 tiny twinkling stars */
.bg-stars { position: absolute; inset: 0; pointer-events: none; }
.star {
  position: absolute; background: rgba(255,255,255,0.7);
  border-radius: 50%; animation: starTwinkle ease-in-out infinite;
}
.star:nth-child(1) { left: 3%; top: 5%; width: 1px; height: 1px; animation-duration: 3s; animation-delay: 0s; }
.star:nth-child(2) { left: 8%; top: 12%; width: 2px; height: 2px; animation-duration: 4s; animation-delay: 0.5s; }
.star:nth-child(3) { left: 15%; top: 3%; width: 1px; height: 1px; animation-duration: 3.5s; animation-delay: 1.2s; }
.star:nth-child(4) { left: 22%; top: 18%; width: 2px; height: 2px; animation-duration: 5s; animation-delay: 0.3s; }
.star:nth-child(5) { left: 28%; top: 7%; width: 1px; height: 1px; animation-duration: 3s; animation-delay: 2s; }
.star:nth-child(6) { left: 35%; top: 15%; width: 2px; height: 2px; animation-duration: 4.5s; animation-delay: 0.8s; }
.star:nth-child(7) { left: 42%; top: 4%; width: 1px; height: 1px; animation-duration: 3.2s; animation-delay: 1.5s; }
.star:nth-child(8) { left: 50%; top: 20%; width: 2px; height: 2px; animation-duration: 5.5s; animation-delay: 0.2s; }
.star:nth-child(9) { left: 57%; top: 8%; width: 1px; height: 1px; animation-duration: 3.8s; animation-delay: 2.5s; }
.star:nth-child(10) { left: 63%; top: 14%; width: 2px; height: 2px; animation-duration: 4s; animation-delay: 1s; }
.star:nth-child(11) { left: 70%; top: 2%; width: 1px; height: 1px; animation-duration: 3.3s; animation-delay: 0.6s; }
.star:nth-child(12) { left: 76%; top: 22%; width: 2px; height: 2px; animation-duration: 4.8s; animation-delay: 1.8s; }
.star:nth-child(13) { left: 83%; top: 6%; width: 1px; height: 1px; animation-duration: 3.6s; animation-delay: 2.2s; }
.star:nth-child(14) { left: 90%; top: 16%; width: 2px; height: 2px; animation-duration: 5s; animation-delay: 0.4s; }
.star:nth-child(15) { left: 97%; top: 9%; width: 1px; height: 1px; animation-duration: 3s; animation-delay: 1.7s; }
.star:nth-child(16) { left: 5%; top: 28%; width: 2px; height: 2px; animation-duration: 4.2s; animation-delay: 0.9s; }
.star:nth-child(17) { left: 12%; top: 35%; width: 1px; height: 1px; animation-duration: 3.5s; animation-delay: 2.8s; }
.star:nth-child(18) { left: 20%; top: 25%; width: 2px; height: 2px; animation-duration: 5.2s; animation-delay: 0.1s; }
.star:nth-child(19) { left: 30%; top: 32%; width: 1px; height: 1px; animation-duration: 3.1s; animation-delay: 1.4s; }
.star:nth-child(20) { left: 38%; top: 40%; width: 2px; height: 2px; animation-duration: 4.6s; animation-delay: 2.1s; }
.star:nth-child(21) { left: 45%; top: 27%; width: 1px; height: 1px; animation-duration: 3.7s; animation-delay: 0.7s; }
.star:nth-child(22) { left: 52%; top: 38%; width: 2px; height: 2px; animation-duration: 5s; animation-delay: 1.9s; }
.star:nth-child(23) { left: 60%; top: 30%; width: 1px; height: 1px; animation-duration: 3.4s; animation-delay: 2.3s; }
.star:nth-child(24) { left: 68%; top: 42%; width: 2px; height: 2px; animation-duration: 4.3s; animation-delay: 0.5s; }
.star:nth-child(25) { left: 75%; top: 24%; width: 1px; height: 1px; animation-duration: 3.9s; animation-delay: 1.1s; }
.star:nth-child(26) { left: 82%; top: 36%; width: 2px; height: 2px; animation-duration: 4.7s; animation-delay: 2.6s; }
.star:nth-child(27) { left: 88%; top: 29%; width: 1px; height: 1px; animation-duration: 3.2s; animation-delay: 0.3s; }
.star:nth-child(28) { left: 94%; top: 44%; width: 2px; height: 2px; animation-duration: 5.3s; animation-delay: 1.6s; }
.star:nth-child(29) { left: 7%; top: 48%; width: 1px; height: 1px; animation-duration: 3.6s; animation-delay: 2.4s; }
.star:nth-child(30) { left: 55%; top: 50%; width: 2px; height: 2px; animation-duration: 4.1s; animation-delay: 0.8s; }
@keyframes starTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}

/* Layer 5: Gradient overlay for depth */
.bg-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
}

/* Kept for backward compat: cloud elements (now subtle) */
.bg-clouds { position: absolute; inset: 0; opacity: 0.3; }
.cloud {
  position: absolute; background: rgba(255,255,255,0.08); border-radius: 50%;
  will-change: transform;
}
.cloud::before, .cloud::after { content: ''; position: absolute; background: inherit; border-radius: 50%; }
.cloud-1 { width: 180px; height: 60px; top: 12%; animation: cloudDrift1 45s linear infinite; }
.cloud-1::before { width: 70px; height: 70px; top: -35px; left: 30px; }
.cloud-1::after  { width: 90px; height: 90px; top: -40px; left: 80px; }
.cloud-2 { width: 140px; height: 50px; top: 28%; animation: cloudDrift2 40s linear infinite; }
.cloud-2::before { width: 55px; height: 55px; top: -28px; left: 25px; }
.cloud-2::after  { width: 70px; height: 70px; top: -32px; left: 60px; }
.cloud-3 { width: 200px; height: 65px; top: 45%; animation: cloudDrift1 50s linear infinite; animation-delay: -8s; }
.cloud-3::before { width: 80px; height: 80px; top: -38px; left: 35px; }
.cloud-3::after  { width: 100px; height: 100px; top: -45px; left: 90px; }
.cloud-4 { width: 120px; height: 40px; top: 62%; animation: cloudDrift2 42s linear infinite; animation-delay: -12s; }
.cloud-4::before { width: 50px; height: 50px; top: -24px; left: 20px; }
.cloud-4::after  { width: 60px; height: 60px; top: -28px; left: 50px; }
.cloud-5 { width: 160px; height: 55px; top: 75%; animation: cloudDrift1 48s linear infinite; animation-delay: -18s; }
.cloud-5::before { width: 65px; height: 65px; top: -30px; left: 28px; }
.cloud-5::after  { width: 80px; height: 80px; top: -35px; left: 70px; }

@keyframes cloudDrift1 {
  from { transform: translateX(-220px); opacity: 0.3; }
  20%  { opacity: 0.6; }
  50%  { opacity: 0.7; }
  80%  { opacity: 0.6; }
  to   { transform: translateX(calc(100vw + 220px)); opacity: 0.3; }
}
@keyframes cloudDrift2 {
  from { transform: translateX(calc(100vw + 160px)); opacity: 0.25; }
  20%  { opacity: 0.55; }
  50%  { opacity: 0.65; }
  80%  { opacity: 0.55; }
  to   { transform: translateX(-160px); opacity: 0.25; }
}

/* Bottom mountains (5 mountains, parallax animation) */
.bg-mountains { position: absolute; bottom: 0; left: 0; right: 0; height: 28vh; pointer-events: none; }
.mountain { position: absolute; bottom: 0; border-radius: 50% 50% 0 0; will-change: transform; }
.mountain-1 { left: -5%; width: 45%; height: 100%; background: rgba(139,168,140,0.08); animation: mountainBreathe1 18s ease-in-out infinite; }
.mountain-2 { left: 25%; width: 50%; height: 80%; background: rgba(107,143,163,0.07); animation: mountainBreathe2 22s ease-in-out infinite; animation-delay: -4s; }
.mountain-3 { right: -5%; width: 40%; height: 90%; background: rgba(139,168,140,0.06); animation: mountainBreathe1 20s ease-in-out infinite; animation-delay: -8s; }
.mountain-4 { left: 10%; width: 35%; height: 60%; background: rgba(100,130,120,0.05); animation: mountainBreathe2 24s ease-in-out infinite; animation-delay: -12s; }
.mountain-5 { right: 15%; width: 30%; height: 70%; background: rgba(90,120,150,0.04); animation: mountainBreathe1 26s ease-in-out infinite; animation-delay: -16s; }
@keyframes mountainBreathe1 {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.02); }
}
@keyframes mountainBreathe2 {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.03); }
}

/* Balloons */
.bg-balloons { position: absolute; inset: 0; }
.balloon { position: absolute; animation: balloonFloat 18s ease-in-out infinite; will-change: transform; }
.balloon-1 { left: 15%; animation-duration: 20s; animation-delay: -3s; }
.balloon-2 { right: 12%; animation-duration: 22s; animation-delay: -8s; }
.balloon-envelope {
  width: 60px; height: 75px; border-radius: 50% 50% 45% 45%;
  background: radial-gradient(ellipse at 50% 30%, rgba(255,107,107,0.4), rgba(232,85,85,0.3) 60%, rgba(221,68,68,0.2) 100%);
  box-shadow: inset 0 -8px 16px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.08);
}
.balloon-2 .balloon-envelope {
  background: radial-gradient(ellipse at 50% 30%, rgba(107,181,255,0.4), rgba(74,144,217,0.3) 60%, rgba(53,122,189,0.2) 100%);
}
.balloon-basket {
  width: 20px; height: 16px; background: rgba(139,105,20,0.5); border-radius: 0 0 4px 4px;
  margin: -2px auto 0; position: relative;
}
.balloon-basket::before {
  content: ''; position: absolute; top: -14px; left: 4px; width: 1px; height: 14px;
  background: rgba(255,255,255,0.1); box-shadow: 12px 0 0 rgba(255,255,255,0.1);
}
@keyframes balloonFloat {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  25%     { transform: translateY(-20px) rotate(1deg); }
  50%     { transform: translateY(-10px) rotate(-0.5deg); }
  75%     { transform: translateY(-30px) rotate(0.5deg); }
}

/* Airplane */
.bg-airplane { position: absolute; top: 8%; left: -80px; animation: airplaneFly 22s linear infinite; will-change: transform; z-index: 2; }
.airplane-icon { font-size: 32px; display: block; opacity: 0.5; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.airplane-trail {
  position: absolute; top: 50%; right: 100%; width: 60px; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.4));
  border-radius: 1px; animation: trailPulse 1.5s ease-in-out infinite;
}
@keyframes airplaneFly {
  0%   { transform: translateX(0) translateY(0); }
  25%  { transform: translateX(calc(100vw + 80px)) translateY(-15px); }
  50%  { transform: translateX(calc(100vw + 80px)) translateY(0); }
  50.01% { transform: translateX(-80px) translateY(0); }
  100% { transform: translateX(0) translateY(0); }
}
@keyframes trailPulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.4; } }

/* ================================================================
   ä¸»å¸å±ï¿½?8% '/ 62% '   ================================================================ */
.main-layout {
  position: relative; z-index: 1; display: flex; width: 100%; height: 100vh;
}

.left-panel {
  width: 38%; min-width: 440px; display: flex; align-items: center; justify-content: center;
  padding: 56px 56px 56px 72px; position: relative; z-index: 2;
}
.left-content { display: flex; flex-direction: column; align-items: flex-start; gap: 52px; width: 100%; }

.brand-section { text-align: left; will-change: transform, opacity; }
.brand-icon {
  font-size: 48px; color: rgba(255,255,255,0.85); margin-bottom: 20px;
  animation: brandGlow 3s ease-in-out infinite;
}
@keyframes brandGlow { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
.brand-name {
  font-family: var(--font-title); font-size: 56px; font-weight: 800;
  color: #FFFFFF; letter-spacing: 3px; margin: 0 0 24px; text-shadow: 0 2px 24px rgba(0,0,0,0.15);
}
.brand-slogan {
  font-family: var(--font-display); font-size: 44px; font-weight: 600;
  color: #FFFFFF; line-height: 1.35; margin: 0 0 16px; text-shadow: 0 1px 12px rgba(0,0,0,0.1);
}
.brand-sub {
  font-family: var(--font-body); font-size: 18px; font-weight: 300;
  color: rgba(255,255,255,0.6); letter-spacing: 3px; margin: 0;
}

/* Mood selector */
.mood-section { width: 100%; }
.mood-section-title {
  font-family: var(--font-body); font-size: 14px; font-weight: 500;
  color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 3px;
  margin: 0 0 24px; text-align: left;
}
.mood-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mood-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  min-height: 130px; padding: 28px 20px 24px; border-radius: 20px;
  border: 1px solid var(--border-default);
  background: var(--glass-1-bg);
  backdrop-filter: var(--glass-1-blur);
  -webkit-backdrop-filter: var(--glass-1-blur);
  color: rgba(255,255,255,0.75); cursor: pointer;
  transition: all 0.4s var(--easing); will-change: transform;
}
.mood-btn:hover {
  background: var(--glass-3-bg);
  border-color: rgba(255,255,255,0.35);
  transform: translateY(-8px);
  box-shadow: 0 20px 48px rgba(0,0,0,0.25);
}
.mood-btn.active {
  font-weight: 500;
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.35);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
}

.mood-btn-emoji { font-size: 40px; transition: transform 0.4s var(--easing); display: inline-block; line-height: 1; }
.mood-btn-emoji.wiggle { animation: moodWiggle 0.6s var(--easing); }
@keyframes moodWiggle {
  0%, 100% { transform: rotate(0); } 20% { transform: rotate(-8deg) scale(1.2); }
  40% { transform: rotate(6deg); } 60% { transform: rotate(-4deg); } 80% { transform: rotate(2deg); }
}
.mood-btn-label { font-family: var(--font-body); font-size: 16px; font-weight: 500; }

/* Explicit mood selector */
.explicit-mood { display: flex; align-items: center; gap: 8px; width: 100%; }
.explicit-mood-label { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.4); white-space: nowrap; }
.explicit-mood-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 6px; border-radius: 12px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.6); cursor: pointer;
  transition: all 0.3s var(--easing); position: relative;
}
.explicit-mood-btn:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.35); }
.explicit-mood-btn.active { border-color: rgba(139,168,140,0.6); background: rgba(139,168,140,0.15); color: #fff; }
.explicit-mood-btn.anxious-btn { position: relative; }
.explicit-mood-btn.anxious-btn::after {
  content: ''; position: absolute; inset: 0; border-radius: 12px; border: 2px solid transparent;
  animation: anxiousPulse 2s ease-in-out infinite;
}
@keyframes anxiousPulse {
  0%, 100% { border-color: rgba(181,163,196,0.2); } 50% { border-color: rgba(181,163,196,0.6); }
}
.explicit-mood-emoji { font-size: 22px; line-height: 1; }
.explicit-mood-hint { font-size: 9px; font-weight: 500; color: #B5A3C4; background: rgba(181,163,196,0.12); padding: 1px 6px; border-radius: 6px; }

/* Companion */
.companion-section { width: 100%; }
.companion-chips { display: flex; gap: 10px; flex-wrap: wrap; }
.companion-chip {
  padding: 14px 18px; border-radius: 16px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.65);
  font-family: var(--font-body); font-size: 13px; font-weight: 500; cursor: pointer;
  backdrop-filter: var(--glass-2-blur); -webkit-backdrop-filter: var(--glass-2-blur);
  transition: all 0.35s var(--easing); text-align: left; line-height: 1.4;
  display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 100px;
}
.companion-chip:hover { background: var(--glass-3-bg); color: #fff; transform: translateY(-3px); }
.companion-chip.active { font-weight: 600; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.companion-chip .comp-icon { font-size: 22px; line-height: 1; }
.companion-chip .comp-label { font-size: 13px; }
.companion-chip .comp-desc { font-size: 10px; opacity: 0.45; font-weight: 300; }

/* Elderly toggle */
.elderly-toggle-wrap { display: flex; align-items: center; gap: 12px; }
.elderly-toggle-label { font-size: 14px; color: rgba(255,255,255,0.5); }
.elderly-toggle {
  position: relative; width: 44px; height: 24px; cursor: pointer;
}
.elderly-toggle input { display: none; }
.elderly-toggle .toggle-track {
  width: 100%; height: 100%; border-radius: 12px; background: rgba(255,255,255,0.35);
  transition: background 0.3s;
}
.elderly-toggle input:checked + .toggle-track { background: rgba(139,168,140,0.5); }
.elderly-toggle .toggle-thumb {
  position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%;
  background: #fff; transition: transform 0.3s var(--easing); box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.elderly-toggle input:checked ~ .toggle-thumb { transform: translateX(20px); }

.left-quick { will-change: opacity; display: flex; gap: 14px; }
.quick-link {
  background: none; border: 1px solid rgba(255,255,255,0.25); border-radius: 28px;
  padding: 14px 36px; color: rgba(255,255,255,0.7); font-family: var(--font-body);
  font-size: 16px; cursor: pointer; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  transition: all 0.35s var(--easing);
}
.quick-link:hover { border-color: rgba(255,255,255,0.4); color: #FFFFFF; background: var(--glass-3-bg); }

/* Right panel */
.right-panel {
  width: 62%; overflow-y: auto; overflow-x: hidden; padding: 56px 72px 56px 0;
  scroll-behavior: smooth; -webkit-overflow-scrolling: touch;
}
.right-panel::-webkit-scrollbar { width: 4px; }
.right-panel::-webkit-scrollbar-track { background: transparent; }
.right-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
.right-content { display: flex; flex-direction: column; gap: 48px; }

/* ================================================================
   3-Tier Glass Depth System
   ================================================================ */
/* Tier 1: Primary cards */
.glass-panel {
  background: var(--glass-1-bg);
  backdrop-filter: var(--glass-1-blur);
  -webkit-backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--glass-1-border);
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  transition: all 0.4s var(--easing);
}
.glass-panel:hover {
  border-color: rgba(255,255,255,0.25);
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
}

/* ================================================================
   Scene toggle
   ================================================================ */
.scene-section { width: 100%; will-change: transform, opacity; }
.scene-toggle {
  display: flex; gap: 0; border-radius: 20px; overflow: hidden;
  border: 1px solid var(--border-default); background: var(--glass-2-bg);
}
.scene-btn {
  flex: 1; padding: 22px 28px; border: none; background: transparent;
  color: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 16px; font-weight: 500;
  cursor: pointer; transition: all 0.4s var(--easing); position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.scene-btn:first-child { border-right: 1px solid rgba(255,255,255,0.14); }
.scene-btn:hover { color: rgba(255,255,255,0.8); background: var(--glass-3-bg); }
.scene-btn.active {
  color: #fff; font-weight: 600; background: rgba(255,255,255,0.12);
  box-shadow: inset 0 0 24px rgba(255,255,255,0.05);
}
.scene-btn .scene-icon { font-size: 28px; }
.scene-btn .scene-label { font-size: 14px; opacity: 0.8; }
.scene-btn .scene-desc { font-size: 11px; opacity: 0.4; font-weight: 300; }

.scene-toggle.warm .scene-btn.active {
  background: rgba(255,165,0,0.12); color: #FFD699;
  box-shadow: inset 0 0 24px rgba(255,165,0,0.06), 0 0 20px rgba(255,165,0,0.06);
}
.scene-toggle.warm { border-color: rgba(255,165,0,0.15); }
.scene-toggle.cool .scene-btn.active {
  background: rgba(70,130,180,0.12); color: #A8CCE8;
  box-shadow: inset 0 0 24px rgba(70,130,180,0.06), 0 0 20px rgba(70,130,180,0.06);
}
.scene-toggle.cool { border-color: rgba(70,130,180,0.15); }

/* ================================================================
   Checklist
   ================================================================ */
.checklist-section { display: none; }
.checklist-section.show { display: block; }
.checklist-card { padding: 32px; }
.checklist-title { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.checklist-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
.checklist-items { display: flex; flex-direction: column; gap: 10px; }
.checklist-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  border-radius: 14px; background: var(--glass-2-bg); border: 1px solid var(--border-default);
  cursor: pointer; transition: all 0.3s var(--easing);
}
.checklist-item:hover { background: var(--glass-3-bg); }
.checklist-item.checked { background: rgba(139,168,140,0.06); border-color: rgba(139,168,140,0.15); }
.checklist-item.checked .checklist-text { color: rgba(255,255,255,0.3); text-decoration: line-through; }
.checklist-cb {
  width: 22px; height: 22px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.4);
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  transition: all 0.3s var(--easing); font-size: 12px; color: transparent;
}
.checklist-item.checked .checklist-cb { background: #8BA88C; border-color: #8BA88C; color: #fff; }
.checklist-text { font-size: 14px; color: rgba(255,255,255,0.7); transition: all 0.3s; }
.checklist-category { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); padding: 10px 0 6px; text-transform: uppercase; letter-spacing: 2px; }
.checklist-progress { font-size: 13px; color: rgba(255,255,255,0.55); margin-top: 16px; }

/* ================================================================
   Budget panel
   ================================================================ */
.budget-section { will-change: transform, opacity; }
.budget-panel { padding: 52px 48px; }
.budget-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 36px; }
.budget-label {
  font-family: var(--font-body); font-size: 18px; font-weight: 500;
  color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 2px;
}
.budget-hint { font-family: var(--font-body); font-size: 14px; color: rgba(255,255,255,0.55); }
.budget-display { display: flex; align-items: baseline; justify-content: center; gap: 10px; margin-bottom: 40px; }
.budget-currency { font-family: var(--font-display); font-size: 36px; font-weight: 400; color: rgba(255,255,255,0.5); }
.budget-number {
  font-family: var(--font-title); font-size: 88px; font-weight: 700;
  color: #FFFFFF; letter-spacing: -3px; line-height: 1; font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 24px rgba(0,0,0,0.12); transition: color 0.6s var(--easing);
}
.budget-slider-wrap { position: relative; margin-bottom: 32px; }
.budget-slider-track { height: 10px; background: rgba(255,255,255,0.08); border-radius: 5px; overflow: hidden; }
.budget-slider-fill {
  height: 100%; border-radius: 5px; transition: width 0.05s linear, background 0.6s var(--easing);
  position: relative;
}
.budget-slider-fill.glowing::after {
  content: ''; position: absolute; inset: -4px 0; background: inherit;
  filter: blur(14px); opacity: 0.5; animation: glowPulse 0.8s ease-in-out infinite alternate;
}
@keyframes glowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
.budget-slider-input {
  position: absolute; top: 50%; left: 0; right: 0; width: 100%; height: 40px;
  transform: translateY(-50%); -webkit-appearance: none; appearance: none;
  background: transparent; cursor: pointer; z-index: 2;
}
.budget-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none; width: 36px; height: 36px; border-radius: 50%;
  background: #FFFFFF; border: 3px solid rgba(255,255,255,0.9);
  box-shadow: 0 3px 20px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1); cursor: grab;
  transition: transform 0.2s var(--easing), box-shadow 0.2s var(--easing);
}
.budget-slider-input::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.25); box-shadow: 0 6px 32px rgba(0,0,0,0.4); }
.budget-range-labels { display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 300; }
.budget-controls { display: flex; flex-direction: column; gap: 14px; }
.budget-presets { display: flex; gap: 10px; }
.preset-chip {
  flex: 1; padding: 14px 12px; border-radius: 14px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.65);
  font-family: var(--font-title); font-size: 16px; font-weight: 500; cursor: pointer;
  backdrop-filter: var(--glass-2-blur); -webkit-backdrop-filter: var(--glass-2-blur); transition: all 0.3s var(--easing);
}
.preset-chip:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.28); color: #FFFFFF; transform: translateY(-1px); }
.preset-chip.active { font-weight: 600; }
.budget-custom-wrap {
  display: flex; align-items: center; background: rgba(255,255,255,0.06);
  border: 1px solid var(--border-default); border-radius: 14px; padding: 0 16px;
  transition: all 0.35s var(--easing);
}
.budget-custom-wrap:focus-within { border-color: rgba(255,255,255,0.4); background: var(--glass-3-bg); transform: scale(1.02); }
.budget-custom-prefix { font-size: 18px; color: rgba(255,255,255,0.4); margin-right: 8px; }
.budget-custom-input {
  flex: 1; background: none; border: none; outline: none; padding: 14px 0;
  font-family: var(--font-title); font-size: 18px; font-weight: 500; color: #FFFFFF;
}
.budget-custom-input::placeholder { color: rgba(255,255,255,0.45); font-weight: 300; }

/* ================================================================
   Daily scenarios
   ================================================================ */
.daily-section { width: 100%; }
.daily-scenarios-scroll { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; }
.daily-scenarios-scroll::-webkit-scrollbar { height: 3px; }
.daily-scenarios-scroll::-webkit-scrollbar-track { background: transparent; }
.daily-scenarios-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
.daily-scenario-chip {
  flex: 0 0 auto; padding: 14px 24px; border-radius: 20px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.65);
  font-family: var(--font-body); font-size: 14px; font-weight: 500; cursor: pointer;
  backdrop-filter: var(--glass-2-blur); -webkit-backdrop-filter: var(--glass-2-blur);
  transition: all 0.3s var(--easing); white-space: nowrap;
}
.daily-scenario-chip:hover { background: var(--glass-3-bg); color: #fff; }
.daily-scenario-chip.active { font-weight: 600; }
.daily-spots-container { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
.daily-spot-card {
  padding: 16px 20px; border-radius: 16px; background: var(--glass-2-bg);
  border: 1px solid var(--border-default); display: flex; align-items: center; gap: 14px;
  transition: all 0.3s var(--easing);
}
.daily-spot-card:hover { background: var(--glass-3-bg); }
.daily-spot-emoji { font-size: 24px; flex-shrink: 0; }
.daily-spot-info { flex: 1; min-width: 0; }
.daily-spot-title { font-size: 15px; font-weight: 600; color: #fff; }
.daily-spot-desc { font-size: 12px; color: rgba(255,255,255,0.45); margin-top: 2px; }
.daily-spot-dist { font-size: 13px; color: rgba(255,255,255,0.4); flex-shrink: 0; }

/* ================================================================
   Hot routes
   ================================================================ */
.hot-routes-section { will-change: transform, opacity; }
.section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; }
.section-title {
  font-family: var(--font-display); font-size: 40px; font-weight: 600; color: #FFFFFF;
  margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,0.1);
}
.section-hint { font-family: var(--font-body); font-size: 13px; color: rgba(255,255,255,0.55); letter-spacing: 1px; }
.section-count {
  font-family: var(--font-body); font-size: 16px; font-weight: 500; padding: 8px 18px;
  border-radius: 14px; transition: all 0.6s var(--easing);
}
.hot-routes-scroll {
  display: flex; gap: 24px; overflow-x: auto; padding-bottom: 8px;
  scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
}
.hot-routes-scroll::-webkit-scrollbar { height: 3px; }
.hot-routes-scroll::-webkit-scrollbar-track { background: transparent; }
.hot-routes-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
.hot-route-card {
  flex: 0 0 220px; padding: 0; overflow: hidden; cursor: pointer;
  scroll-snap-align: start; transition: all 0.4s var(--easing);
}
.hot-route-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,0.2); }
.hot-route-img { height: 150px; display: flex; align-items: center; justify-content: center; }
.hot-route-emoji { font-size: 52px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
.hot-route-info { padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
.hot-route-title { font-family: var(--font-body); font-size: 16px; font-weight: 600; color: #FFFFFF; }
.hot-route-meta { font-family: var(--font-body); font-size: 13px; color: rgba(255,255,255,0.5); }

/* ================================================================
   Plan cards waterfall
   ================================================================ */
.plans-section { will-change: transform, opacity; }
.plans-waterfall { display: flex; flex-direction: column; gap: 24px; }
.plan-card {
  padding: 32px; opacity: 0; transform: translateY(30px);
  transition: opacity 0.6s var(--easing), transform 0.6s var(--easing), border-color 0.4s var(--easing), box-shadow 0.4s var(--easing);
  cursor: default;
}
.plan-card.visible { opacity: 1; transform: translateY(0); }
.plan-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.plan-card-mood {
  font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 8px 18px; border-radius: 12px;
}
.plan-card-switch {
  font-family: var(--font-body); font-size: 13px; font-weight: 500; padding: 8px 16px;
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.25); background: var(--glass-2-bg);
  cursor: pointer; transition: all 0.3s var(--easing);
}
.plan-card-switch:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.4); }
.plan-card-route { display: flex; flex-direction: column; gap: 0; padding-left: 2px; }
.plan-route-step { display: flex; align-items: center; gap: 18px; padding: 8px 0; position: relative; }
.plan-route-step:not(:last-child)::after {
  content: ''; position: absolute; left: 10px; top: 30px; width: 1.5px; height: calc(100% + 2px);
  background: rgba(255,255,255,0.1); border-radius: 1px;
}
.plan-step-time { font-family: var(--font-title); font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.55); width: 48px; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.plan-step-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 4px rgba(255,255,255,0.08); z-index: 1; }
.plan-step-name { font-family: var(--font-body); font-size: 17px; font-weight: 500; color: #FFFFFF; }
.plan-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 18px; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); }
.plan-card-stats { display: flex; gap: 24px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.5); }
.plan-card-book {
  padding: 10px 28px; border-radius: 14px; border: none; color: #FFFFFF;
  font-family: var(--font-title); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.3s var(--easing); box-shadow: 0 4px 16px rgba(0,0,0,0.14);
}
.plan-card-book:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
.plan-card-book:active { transform: scale(0.95); }

.load-more-wrap { display: flex; justify-content: center; padding: 8px 0 0; }
.load-more-btn {
  padding: 16px 48px; border: none; font-family: var(--font-body); font-size: 16px;
  font-weight: 500; color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.3s var(--easing);
}
.load-more-btn:hover:not(:disabled) { color: #FFFFFF; transform: translateY(-2px); }
.load-more-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.loading-dots { display: flex; gap: 5px; align-items: center; }
.loading-dots .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); animation: dotPulse 0.6s ease-in-out infinite alternate; }
.loading-dots .dot:nth-child(2) { animation-delay: 0.15s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes dotPulse { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-8px); opacity: 1; } }

/* Generate button */
.generate-btn {
  width: 100%; padding: 22px; border-radius: 18px; border: none;
  font-family: var(--font-body); font-size: 20px; font-weight: 600; color: #fff; cursor: pointer;
  transition: all 0.4s var(--easing); box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  letter-spacing: 1px;
}
.generate-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
.generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================================================================
   Itinerary
   ================================================================ */
.itinerary-section { display: none; }
.itinerary-section.show { display: block; }
.day-header {
  padding: 16px 22px; border-radius: 16px; margin-bottom: 18px; margin-top: 10px;
  display: flex; justify-content: space-between; font-weight: 600; font-size: 15px;
  cursor: pointer; transition: all 0.35s var(--easing); position: relative;
}
.day-header:hover { filter: brightness(1.1); }
.day-header.active-day { box-shadow: inset 0 0 0 2px var(--active-mood-color, #8BA88C); }
.day-header .day-map-hint {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  font-size: 10px; opacity: 0.4; transition: opacity 0.3s;
}
.day-header:hover .day-map-hint { opacity: 0.8; }
.timeline { display: flex; flex-direction: column; gap: 0; padding-left: 4px; }
.timeline-item { display: flex; align-items: flex-start; gap: 16px; padding: 10px 0; position: relative; }
.timeline-item:not(:last-child)::after {
  content: ''; position: absolute; left: 11px; top: 28px; width: 1.5px; height: calc(100% + 2px);
  background: rgba(255,255,255,0.1); border-radius: 1px;
}
.timeline-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; box-shadow: 0 0 0 4px rgba(255,255,255,0.08); z-index: 1; }
.timeline-card { flex: 1; padding: 16px 20px; border-radius: 16px; background: var(--glass-2-bg); border: 1px solid var(--border-default); }
.time-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.time { font-family: var(--font-title); font-size: 13px; color: rgba(255,255,255,0.45); }
.category { font-size: 12px; padding: 3px 12px; border-radius: 8px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
.poi-name { font-size: 16px; font-weight: 600; color: #fff; display: block; }
.poi-desc { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; display: block; }
.reason-bar { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px; }
.tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.tag { font-size: 11px; padding: 3px 10px; border-radius: 8px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
.booking-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.price-tag { font-size: 16px; font-weight: 700; }
.book-btn {
  padding: 8px 20px; border-radius: 12px; border: none; color: #fff;
  font-family: var(--font-title); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.3s var(--easing); box-shadow: 0 4px 16px rgba(0,0,0,0.14);
}
.book-btn:hover { transform: translateY(-1px); }
.book-btn:active { transform: scale(0.95); }
.book-btn.loading { opacity: 0.7; }
.compare-inline { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.4); }
.compare-inline-save { color: #8BA88C; font-weight: 600; }

/* ================================================================
   Hotel
   ================================================================ */
.hotel-section { display: none; }
.hotel-section.show { display: block; }
.hotel-card { padding: 32px; }
.hotel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.hotel-info { display: flex; flex-direction: column; gap: 4px; }
.hotel-name { font-size: 20px; font-weight: 700; color: #fff; }
.hotel-rating { font-size: 14px; color: rgba(255,255,255,0.5); }
.hotel-price { font-size: 28px; font-weight: 800; }
.hotel-reason { font-size: 13px; color: rgba(255,255,255,0.45); }
.ai-compare { margin-top: 16px; padding: 18px; border-radius: 16px; background: var(--glass-2-bg); }
.compare-title { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.ai-badge { font-size: 12px; padding: 4px 12px; border-radius: 8px; background: rgba(139,168,140,0.2); color: #8BA88C; font-weight: 600; }
.ai-tip { font-size: 12px; color: rgba(255,255,255,0.55); }
.compare-list { display: flex; flex-direction: column; gap: 4px; }
.compare-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; font-size: 13px; }
.compare-row.best { background: rgba(139,168,140,0.06); }
.compare-platform { flex: 1; font-weight: 500; color: rgba(255,255,255,0.6); }
.compare-price { font-weight: 700; color: #fff; }
.compare-features { font-size: 11px; color: rgba(255,255,255,0.55); }
.compare-best-tag { font-size: 11px; padding: 2px 8px; border-radius: 6px; background: #8BA88C; color: #fff; font-weight: 600; }
.compare-verdict { padding: 12px 16px; border-radius: 12px; margin-top: 12px; font-size: 13px; color: rgba(255,255,255,0.5); }
.hotel-savings { font-size: 14px; color: #8BA88C; font-weight: 600; margin-top: 12px; }
.hotel-book-btn { width: 100%; margin-top: 16px; padding: 14px; text-align: center; }

/* ================================================================
   Care letter
   ================================================================ */
.care-letter-section { display: none; }
.care-letter-section.show { display: block; }
.care-letter { padding: 32px; }
.care-letter-greeting { font-size: 28px; font-weight: 600; color: #fff; margin-bottom: 10px; }
.care-letter-title { font-size: 20px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 14px; }
.care-letter-body { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.8; margin-bottom: 18px; }
.care-letter-action { font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 18px; padding: 14px; border-radius: 14px; background: var(--glass-2-bg); }
.care-letter-quote { font-size: 14px; color: rgba(255,255,255,0.55); font-style: italic; }

/* ================================================================
   Booking popup
   ================================================================ */
.booking-popup-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.booking-popup-overlay.show { opacity: 1; pointer-events: auto; }
.booking-popup {
  width: 360px; max-width: 90vw; background: rgba(18,18,30,0.97);
  backdrop-filter: var(--glass-1-blur); -webkit-backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--border-default); border-radius: 20px; padding: 24px;
  transform: scale(0.9); transition: transform 0.3s var(--easing);
}
.booking-popup-overlay.show .booking-popup { transform: scale(1); }
.booking-popup-header { text-align: center; margin-bottom: 16px; }
.booking-popup-title { font-size: 18px; font-weight: 700; color: #FFFFFF; }
.booking-popup-body { display: flex; flex-direction: column; align-items: center; }
.booking-spinner {
  width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #8BA88C;
  border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.booking-popup-text { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
.platform-list { width: 100%; display: flex; flex-direction: column; gap: 6px; }
.platform-item {
  display: flex; align-items: center; gap: 8px; padding: 10px;
  background: var(--glass-2-bg); border-radius: 10px; font-size: 14px;
}
.platform-item.checked { background: rgba(139,168,140,0.06); }
.platform-icon { font-size: 18px; }
.platform-name { flex: 1; font-weight: 600; color: rgba(255,255,255,0.7); }
.platform-price { font-weight: 700; color: #8BA88C; }
.platform-wait { color: rgba(255,255,255,0.5); font-size: 11px; }
.booking-popup-footer { margin-top: 16px; text-align: center; display: none; }
.booking-best { font-size: 15px; font-weight: 700; color: #FFFFFF; display: block; }
.booking-save { font-size: 13px; color: #8BA88C; font-weight: 600; margin: 6px 0 10px; display: block; }
.booking-action-btn {
  width: 100%; height: 42px; border-radius: 20px; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; transition: all 0.3s;
}
.booking-action-btn:active { transform: scale(0.97); }

/* Toast */
.toast-bar {
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
  padding: 14px 32px; border-radius: 24px;
  background: rgba(10,10,15,0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  color: #FFFFFF; font-family: var(--font-body); font-size: 14px; font-weight: 500;
  z-index: 300; box-shadow: 0 8px 32px rgba(0,0,0,0.3); white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity 0.3s var(--easing), transform 0.3s var(--easing);
}
.toast-bar.show { opacity: 1; transform: translateX(-50%) translateY(-8px); }

/* Compliance & footer */
.compliance-strip { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 10px; }
.comp-item { font-size: 13px; color: rgba(255,255,255,0.55); white-space: nowrap; }
.mini-footer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: rgba(255,255,255,0.5); padding-bottom: 8px; }
.dot-sep { color: rgba(255,255,255,0.1); }

/* Tree hole */
.tree-hole-btn {
  position: fixed; bottom: 32px; right: 32px; z-index: 200;
  width: 56px; height: 56px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2); background: var(--glass-1-bg);
  backdrop-filter: var(--glass-1-blur); -webkit-backdrop-filter: var(--glass-1-blur);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 24px; transition: all 0.4s var(--easing);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.tree-hole-btn:hover {
  background: var(--glass-3-bg); border-color: rgba(255,255,255,0.35);
  transform: scale(1.08); box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}
.tree-hole-btn.pulse {
  animation: treeHolePulse 2s ease-in-out infinite;
}
@keyframes treeHolePulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  50% { box-shadow: 0 4px 40px rgba(139,168,140,0.4); }
}

.tree-hole-popup {
  position: fixed; bottom: 100px; right: 32px; z-index: 201;
  width: 320px; padding: 24px; border-radius: 20px;
  background: rgba(14,14,26,0.95); backdrop-filter: var(--glass-1-blur); -webkit-backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--border-default);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  opacity: 0; pointer-events: none; transform: translateY(12px);
  transition: all 0.4s var(--easing);
}
.tree-hole-popup.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
.tree-hole-popup-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 8px; }
.tree-hole-popup-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; line-height: 1.6; }
.tree-hole-input {
  width: 100%; padding: 14px 18px; border-radius: 14px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: #fff; font-family: var(--font-body);
  font-size: 14px; outline: none; resize: none; min-height: 80px;
  transition: border-color 0.3s;
}
.tree-hole-input::placeholder { color: rgba(255,255,255,0.45); }
.tree-hole-input:focus { border-color: rgba(139,168,140,0.5); }
.tree-hole-send {
  width: 100%; margin-top: 14px; padding: 12px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #8BA88C, #6B8E6C); color: #fff;
  font-family: var(--font-body); font-size: 15px; font-weight: 600; cursor: pointer;
  transition: all 0.3s var(--easing);
}
.tree-hole-send:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,168,140,0.3); }
.tree-hole-send:active { transform: scale(0.97); }

/* Simplified overlay */
.simplified-overlay {
  position: fixed; inset: 0; z-index: 150;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.8s var(--easing);
  gap: 32px; padding: 40px;
}
.simplified-overlay.show { opacity: 1; pointer-events: auto; }
.healing-greeting {
  font-family: var(--font-display); font-size: 36px; font-weight: 600;
  color: #fff; text-align: center; line-height: 1.5; text-shadow: 0 2px 16px rgba(0,0,0,0.2);
  max-width: 600px;
}
.healing-sub {
  font-family: var(--font-body); font-size: 18px; font-weight: 300;
  color: rgba(255,255,255,0.5); text-align: center;
}
.healing-btn {
  padding: 20px 48px; border-radius: 18px; border: none;
  font-family: var(--font-body); font-size: 20px; font-weight: 600; color: #fff; cursor: pointer;
  transition: all 0.4s var(--easing); box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  letter-spacing: 1px;
}
.healing-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
.healing-btn:active { transform: scale(0.95); }
.healing-dismiss {
  background: none; border: 1px solid rgba(255,255,255,0.25); border-radius: 24px;
  padding: 10px 28px; color: rgba(255,255,255,0.4); font-family: var(--font-body);
  font-size: 14px; cursor: pointer; transition: all 0.3s;
}
.healing-dismiss:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.4); }

/* Emotion bubble */
.emotion-bubble {
  position: fixed; bottom: 120px; right: 32px; z-index: 199;
  max-width: 300px; padding: 20px 24px; border-radius: 20px;
  background: rgba(14,14,26,0.95); backdrop-filter: var(--glass-1-blur); -webkit-backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--border-default);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  opacity: 0; pointer-events: none; transform: translateY(8px) scale(0.95);
  transition: all 0.5s var(--easing);
}
.emotion-bubble.show { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
.bubble-title { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 8px; }
.bubble-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 16px; line-height: 1.6; }
.bubble-actions { display: flex; flex-direction: column; gap: 8px; }
.bubble-option {
  padding: 11px 16px; border-radius: 14px; border: none; color: #fff;
  font-family: var(--font-body); font-size: 14px; font-weight: 500; cursor: pointer;
  transition: all 0.35s var(--easing); text-align: left; display: flex; align-items: center; gap: 8px;
}
.bubble-option:hover { transform: translateX(3px); box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
.bubble-option:active { transform: scale(0.97); }
.bubble-option.option-soothe { background: rgba(139,168,140,0.2); border: 1px solid rgba(139,168,140,0.25); }
.bubble-option.option-soothe:hover { background: rgba(139,168,140,0.35); }
.bubble-option.option-distract { background: rgba(255,180,120,0.15); border: 1px solid rgba(255,180,120,0.2); }
.bubble-option.option-distract:hover { background: rgba(255,180,120,0.3); }
.bubble-dismiss-row { display: flex; justify-content: center; padding-top: 2px; }
.bubble-dismiss {
  background: none; border: none; color: rgba(255,255,255,0.5); font-family: var(--font-body);
  font-size: 12px; cursor: pointer; padding: 6px 12px; transition: all 0.3s;
}
.bubble-dismiss:hover { color: rgba(255,255,255,0.55); }

/* Filter hidden */
.filter-hidden { opacity: 0; pointer-events: none; transition: opacity 0.5s var(--easing); }

/* Privacy */
.privacy-notice {
  padding: 12px 0; text-align: center; font-size: 11px; font-weight: 300;
  color: rgba(255,255,255,0.4); letter-spacing: 0.5px; line-height: 1.8;
  transition: color 0.8s var(--easing);
}

/* Soothing state */
body.soothing .cloud { opacity: 0.12; transition: opacity 2s var(--easing); }
body.soothing .particle { animation-duration: 12s; transition: animation-duration 2s var(--easing); }
body.soothing .balloon { animation-duration: 32s; }
body.soothing .bg-sky { transition: background 2s var(--easing); }
body.soothing .brand-name { font-weight: 400; letter-spacing: 6px; transition: all 2s var(--easing); }
body.soothing .brand-slogan { font-weight: 300; letter-spacing: 4px; transition: all 2s var(--easing); }

.breathe-glow {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 0; height: 0; border-radius: 50%; pointer-events: none; z-index: 0;
  opacity: 0; transition: all 2s var(--easing);
}
body.soothing .breathe-glow {
  width: 600px; height: 600px; opacity: 0.06;
  background: radial-gradient(circle, rgba(139,168,140,0.8) 0%, transparent 70%);
  animation: breathePulse 8s ease-in-out infinite;
}
@keyframes breathePulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.04; }
  50%     { transform: translate(-50%, -50%) scale(1.15); opacity: 0.08; }
}

/* ================================================================
   Mood-specific body classes
   ================================================================ */
body.mood-calm { --global-bg: #0a1a0f; --global-accent: #8BA88C; }
body.mood-calm .section-block { background: rgba(139,168,140,0.06); border-color: rgba(139,168,140,0.15); }
body.mood-calm .section-title { color: rgba(139,168,140,0.9); }
body.mood-calm .generate-btn { background: linear-gradient(135deg, #8BA88C, #6B8F6B); }
body.mood-calm .mood-btn.active { border-color: rgba(139,168,140,0.5); box-shadow: 0 0 28px rgba(139,168,140,0.15); }
body.mood-calm .budget-slider-fill { background: linear-gradient(90deg, #8BA88C, #6B8F6B); }
body.mood-calm .plan-step-dot { background: #8BA88C; }
body.mood-calm .brand-name, body.mood-calm .brand-slogan { font-family: var(--font-display); }
body.mood-calm .bg-aurora .aurora-band:nth-child(1) { background: radial-gradient(ellipse at 50% 0%, rgba(120,180,130,0.15) 0%, transparent 70%); }
body.mood-calm .bg-aurora .aurora-band:nth-child(2) { background: radial-gradient(ellipse at 30% 0%, rgba(100,170,120,0.12) 0%, transparent 70%); }
body.mood-calm .bg-aurora .aurora-band:nth-child(3) { background: radial-gradient(ellipse at 70% 0%, rgba(139,190,150,0.1) 0%, transparent 70%); }
body.mood-calm .bg-aurora .aurora-band:nth-child(4) { background: radial-gradient(ellipse at 40% 0%, rgba(110,175,135,0.09) 0%, transparent 70%); }
body.mood-calm .bg-aurora .aurora-band:nth-child(5) { background: radial-gradient(ellipse at 60% 0%, rgba(130,185,140,0.08) 0%, transparent 70%); }

body.mood-happy { --global-bg: #1a1208; --global-accent: #FFB347; }
body.mood-happy .section-block { background: rgba(255,179,71,0.06); border-color: rgba(255,179,71,0.15); }
body.mood-happy .section-title { color: rgba(255,179,71,0.9); }
body.mood-happy .generate-btn { background: linear-gradient(135deg, #FFB347, #E8945A); }
body.mood-happy .mood-btn.active { border-color: rgba(255,179,71,0.5); box-shadow: 0 0 28px rgba(255,179,71,0.15); }
body.mood-happy .budget-slider-fill { background: linear-gradient(90deg, #FFB347, #E8945A); }
body.mood-happy .plan-step-dot { background: #FFB347; }
body.mood-happy .brand-name { font-weight: 800; letter-spacing: 4px; }
body.mood-happy .mood-btn-emoji { animation: moodBounceFast 0.5s var(--easing-spring) infinite; animation-play-state: paused; }
body.mood-happy .mood-btn:hover .mood-btn-emoji { animation-play-state: running; }
body.mood-happy .bg-aurora .aurora-band:nth-child(1) { background: radial-gradient(ellipse at 50% 0%, rgba(255,180,70,0.15) 0%, transparent 70%); }
body.mood-happy .bg-aurora .aurora-band:nth-child(2) { background: radial-gradient(ellipse at 30% 0%, rgba(240,160,60,0.12) 0%, transparent 70%); }
body.mood-happy .bg-aurora .aurora-band:nth-child(3) { background: radial-gradient(ellipse at 70% 0%, rgba(255,170,80,0.1) 0%, transparent 70%); }
body.mood-happy .bg-aurora .aurora-band:nth-child(4) { background: radial-gradient(ellipse at 40% 0%, rgba(230,150,55,0.09) 0%, transparent 70%); }
body.mood-happy .bg-aurora .aurora-band:nth-child(5) { background: radial-gradient(ellipse at 60% 0%, rgba(245,165,65,0.08) 0%, transparent 70%); }
@keyframes moodBounceFast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

body.mood-sad { --global-bg: #0a0f1a; --global-accent: #7B9EC4; }
body.mood-sad .section-block { background: rgba(123,158,196,0.06); border-color: rgba(123,158,196,0.15); }
body.mood-sad .section-title { color: rgba(123,158,196,0.9); }
body.mood-sad .generate-btn { background: linear-gradient(135deg, #7B9EC4, #6B8FA3); }
body.mood-sad .mood-btn.active { border-color: rgba(123,158,196,0.5); box-shadow: 0 0 28px rgba(123,158,196,0.15); }
body.mood-sad .budget-slider-fill { background: linear-gradient(90deg, #7B9EC4, #6B8FA3); }
body.mood-sad .plan-step-dot { background: #7B9EC4; }
body.mood-sad .brand-name, body.mood-sad .brand-slogan { font-weight: 300; letter-spacing: 5px; }
body.mood-sad .cloud { opacity: 0.15; animation-duration: 60s; }
body.mood-sad .bg-aurora .aurora-band:nth-child(1) { background: radial-gradient(ellipse at 50% 0%, rgba(100,140,200,0.15) 0%, transparent 70%); }
body.mood-sad .bg-aurora .aurora-band:nth-child(2) { background: radial-gradient(ellipse at 30% 0%, rgba(80,130,190,0.12) 0%, transparent 70%); }
body.mood-sad .bg-aurora .aurora-band:nth-child(3) { background: radial-gradient(ellipse at 70% 0%, rgba(120,150,210,0.1) 0%, transparent 70%); }
body.mood-sad .bg-aurora .aurora-band:nth-child(4) { background: radial-gradient(ellipse at 40% 0%, rgba(90,135,195,0.09) 0%, transparent 70%); }
body.mood-sad .bg-aurora .aurora-band:nth-child(5) { background: radial-gradient(ellipse at 60% 0%, rgba(110,145,205,0.08) 0%, transparent 70%); }

body.mood-anxious { --global-bg: #120f1a; --global-accent: #B5A3C4; }
body.mood-anxious .section-block { background: rgba(181,163,196,0.06); border-color: rgba(181,163,196,0.15); }
body.mood-anxious .section-title { color: rgba(181,163,196,0.9); }
body.mood-anxious .generate-btn { background: linear-gradient(135deg, #B5A3C4, #9B8AB4); }
body.mood-anxious .mood-btn.active { border-color: rgba(181,163,196,0.5); box-shadow: 0 0 28px rgba(181,163,196,0.15); }
body.mood-anxious .budget-slider-fill { background: linear-gradient(90deg, #B5A3C4, #9B8AB4); }
body.mood-anxious .plan-step-dot { background: #B5A3C4; }
body.mood-anxious .bg-aurora .aurora-band { animation-duration: 10s; }

body.mood-excited { --global-bg: #1a0808; --global-accent: #FF6B6B; }
body.mood-excited .section-block { background: rgba(255,107,107,0.06); border-color: rgba(255,107,107,0.15); }
body.mood-excited .section-title { color: rgba(255,107,107,0.9); }
body.mood-excited .generate-btn { background: linear-gradient(135deg, #FF6B6B, #E85555); }
body.mood-excited .mood-btn.active { border-color: rgba(255,107,107,0.5); box-shadow: 0 0 28px rgba(255,107,107,0.15); }
body.mood-excited .budget-slider-fill { background: linear-gradient(90deg, #FF6B6B, #E85555); }
body.mood-excited .plan-step-dot { background: #FF6B6B; }
body.mood-excited .geo-shape { animation-duration: 12s; }
body.mood-excited .brand-name { letter-spacing: 5px; }
body.mood-excited .bg-aurora .aurora-band:nth-child(1) { background: radial-gradient(ellipse at 50% 0%, rgba(255,100,100,0.15) 0%, transparent 70%); }
body.mood-excited .bg-aurora .aurora-band:nth-child(2) { background: radial-gradient(ellipse at 30% 0%, rgba(240,85,85,0.12) 0%, transparent 70%); }
body.mood-excited .bg-aurora .aurora-band:nth-child(3) { background: radial-gradient(ellipse at 70% 0%, rgba(255,115,115,0.1) 0%, transparent 70%); }
body.mood-excited .bg-aurora .aurora-band:nth-child(4) { background: radial-gradient(ellipse at 40% 0%, rgba(230,90,90,0.09) 0%, transparent 70%); }
body.mood-excited .bg-aurora .aurora-band:nth-child(5) { background: radial-gradient(ellipse at 60% 0%, rgba(245,105,105,0.08) 0%, transparent 70%); }

body.mood-tired { --global-bg: #15100a; --global-accent: #C4A882; }
body.mood-tired .section-block { background: rgba(196,168,130,0.06); border-color: rgba(196,168,130,0.15); }
body.mood-tired .section-title { color: rgba(196,168,130,0.9); }
body.mood-tired .generate-btn { background: linear-gradient(135deg, #C4A882, #A89070); }
body.mood-tired .mood-btn.active { border-color: rgba(196,168,130,0.5); box-shadow: 0 0 28px rgba(196,168,130,0.15); }
body.mood-tired .budget-slider-fill { background: linear-gradient(90deg, #C4A882, #A89070); }
body.mood-tired .plan-step-dot { background: #C4A882; }
body.mood-tired .cloud { animation-duration: 70s; }
body.mood-tired .geo-shape { animation-duration: 35s; }
body.mood-tired .brand-name { font-weight: 400; letter-spacing: 6px; }

body.mood-insomnia { --global-bg: #080c18; --global-accent: #6B7BA3; }
body.mood-insomnia .section-block { background: rgba(107,123,163,0.06); border-color: rgba(107,123,163,0.15); }
body.mood-insomnia .section-title { color: rgba(107,123,163,0.9); }
body.mood-insomnia .generate-btn { background: linear-gradient(135deg, #6B7BA3, #4B5B83); }
body.mood-insomnia .mood-btn.active { border-color: rgba(107,123,163,0.5); box-shadow: 0 0 28px rgba(107,123,163,0.15); }
body.mood-insomnia .budget-slider-fill { background: linear-gradient(90deg, #6B7BA3, #4B5B83); }
body.mood-insomnia .plan-step-dot { background: #6B7BA3; }
body.mood-insomnia .cloud { animation-duration: 80s; opacity: 0.1; }
body.mood-insomnia .geo-shape { animation-duration: 40s; }
body.mood-insomnia .particle { background: rgba(180,200,255,0.2); }
body.mood-insomnia .brand-name { font-weight: 300; letter-spacing: 8px; }

/* Mood transition */
body.mood-calm, body.mood-happy, body.mood-sad, body.mood-anxious, body.mood-excited, body.mood-tired, body.mood-insomnia {
  transition: background 1.5s var(--easing);
}

/* ================================================================
   Transit bar, rain plan, refresh, export
   ================================================================ */
.transit-bar {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; margin: 4px 0 4px 24px;
  border-radius: 10px; background: var(--glass-2-bg); font-size: 12px;
  color: rgba(255,255,255,0.55); border-left: 2px solid rgba(255,255,255,0.1);
}
.transit-bar .transit-icon { font-size: 14px; }
.transit-bar .transit-time { font-weight: 600; color: rgba(255,255,255,0.5); }

.rain-plan-toggle {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; margin-top: 6px;
  border-radius: 8px; background: rgba(107,143,163,0.1); border: 1px solid rgba(107,143,163,0.15);
  font-size: 11px; color: rgba(107,180,210,0.8); cursor: pointer; transition: all 0.3s;
}
.rain-plan-toggle:hover { background: rgba(107,143,163,0.2); }
.rain-plan-detail {
  display: none; margin-top: 6px; padding: 10px; border-radius: 10px;
  background: rgba(107,143,163,0.06); font-size: 12px; color: rgba(255,255,255,0.4);
  line-height: 1.6;
}
.rain-plan-detail.show { display: block; }

.refresh-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; margin-left: 8px;
  border-radius: 20px; border: 1px solid var(--border-default); background: var(--glass-2-bg);
  color: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 12px;
  cursor: pointer; transition: all 0.3s var(--easing); backdrop-filter: blur(8px);
}
.refresh-btn:hover { background: var(--glass-3-bg); color: #fff; border-color: rgba(255,255,255,0.3); }
.refresh-btn:active { transform: scale(0.95); }
.refresh-btn.refreshing { pointer-events: none; opacity: 0.5; }

.export-bar { display: flex; gap: 10px; padding: 0 0 8px; flex-wrap: wrap; }
.export-btn {
  padding: 10px 20px; border-radius: 20px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.55);
  font-family: var(--font-body); font-size: 13px; cursor: pointer;
  backdrop-filter: var(--glass-2-blur); -webkit-backdrop-filter: var(--glass-2-blur);
  transition: all 0.3s var(--easing);
}
.export-btn:hover { background: var(--glass-3-bg); color: #fff; border-color: rgba(255,255,255,0.35); }
.export-btn:active { transform: scale(0.95); }

/* ================================================================
   Map
   ================================================================ */
.map-section { display: none; }
.map-section.show { display: block; }
.map-container {
  width: 100%; height: 420px; border-radius: 20px; position: relative; overflow: hidden;
  background: linear-gradient(180deg, #0F1729 0%, #1A2333 40%, #1E2D3D 100%);
  border: 1px solid rgba(255,255,255,0.1);
}
.map-svg { width: 100%; height: 100%; will-change: transform; }
.map-svg * { transition: opacity 0.5s var(--easing); }
.map-terrain { fill-opacity: 0.12; stroke: rgba(255,255,255,0.08); stroke-width: 0.5; }
.map-water { fill-opacity: 0.15; }
.map-water-label { fill: rgba(100,180,220,0.35); font-size: 4px; letter-spacing: 1px; }
.map-city-dot { fill: rgba(255,255,255,0.45); cursor: pointer; transition: fill 0.3s, r 0.3s; }
.map-city-dot:hover { fill: rgba(139,168,140,0.8); r: 2; }
.map-city-label { fill: rgba(255,255,255,0.22); font-size: 3.5px; font-weight: 500; }
.map-city-vibe { fill: rgba(255,255,255,0.14); font-size: 2.2px; font-weight: 300; letter-spacing: 0.5px; }
.map-route-group { transition: opacity 0.5s var(--easing); }
.map-route-group.dimmed { opacity: 0.15; }
.map-route-path { fill: none; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 6px rgba(255,165,0,0.4)); }
.map-route-path.business { filter: drop-shadow(0 0 6px rgba(70,130,180,0.4)); }
.map-traveler {
  animation: travelDash var(--travel-duration) linear infinite;
  filter: drop-shadow(0 0 8px rgba(255,200,100,0.9));
}
.map-traveler.business { filter: drop-shadow(0 0 8px rgba(100,180,255,0.9)); }
@keyframes travelDash {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: var(--travel-length); }
}
.map-poi-group { cursor: pointer; }
.map-poi-group:hover .map-poi-outer { r: 11; opacity: 0.5; }
.map-poi-outer { transition: all 0.3s var(--easing); }
.map-poi-inner { transition: all 0.3s var(--easing); }
.map-poi-group:hover .map-poi-inner { filter: brightness(1.4); }
.map-poi-bubble { fill: rgba(20,25,36,0.9); stroke-width: 0.8; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
.map-poi-bubble-text { font-size: 5px; font-weight: 700; fill: #fff; pointer-events: none; text-anchor: middle; dominant-baseline: central; }
.map-poi-label-text { font-size: 3.5px; fill: rgba(255,255,255,0.65); pointer-events: none; text-anchor: middle; }
.map-start-marker { fill: #FFD700; filter: drop-shadow(0 0 4px rgba(255,215,0,0.5)); }
.map-end-marker { fill: #FF6B6B; filter: drop-shadow(0 0 4px rgba(255,107,107,0.5)); }
.map-transit-icon { font-size: 5px; pointer-events: none; }
.map-transit-arrow { stroke: rgba(255,255,255,0.5); stroke-width: 0.8; stroke-dasharray: 2 2; fill: none; }
.map-legend { display: flex; gap: 16px; padding: 8px 0 0; font-size: 11px; color: rgba(255,255,255,0.55); flex-wrap: wrap; }
.map-legend-item { display: flex; align-items: center; gap: 4px; }
.map-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.map-legend-line { width: 16px; height: 2px; border-radius: 1px; }
.map-legend-line.warm { background: linear-gradient(90deg, #FFA500, #FFD700); }
.map-legend-line.cool { background: linear-gradient(90deg, #4682B4, #60A5FA); }
.map-controls { display: flex; gap: 8px; padding: 8px 0 0; flex-wrap: wrap; }
.map-ctrl-btn {
  padding: 6px 14px; border-radius: 14px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.45);
  font-family: var(--font-body); font-size: 11px; cursor: pointer;
  transition: all 0.3s var(--easing);
}
.map-ctrl-btn:hover { background: var(--glass-3-bg); color: #fff; }
.map-ctrl-btn.active { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.3); }

/* ================================================================
   AI Narrative
   ================================================================ */
.ai-narrative-section { display: none; }
.ai-narrative-section.show { display: block; }
.ai-narrative-card {
  padding: 36px; position: relative; overflow: hidden;
  background: linear-gradient(135deg, rgba(139,168,140,0.04) 0%, rgba(163,181,166,0.03) 100%);
  border: 1px solid var(--border-default);
}
.ai-narrative-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.ai-narrative-badge {
  font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 10px;
  background: linear-gradient(135deg, rgba(139,168,140,0.15), rgba(107,143,163,0.15));
  color: #A3C4D6; letter-spacing: 1px;
}
.ai-narrative-badge .ai-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #8BA88C; margin-right: 6px; animation: aiDotPulse 1.5s ease-in-out infinite; }
@keyframes aiDotPulse { 0%, 100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
.ai-narrative-body {
  font-family: var(--font-display); font-size: 18px; font-weight: 400;
  color: rgba(255,255,255,0.75); line-height: 2; letter-spacing: 0.8px;
  min-height: 60px; position: relative;
}
.ai-narrative-body .cursor-blink {
  display: inline-block; width: 2px; height: 20px; background: rgba(139,168,140,0.8);
  margin-left: 2px; vertical-align: text-bottom;
  animation: cursorBlink 0.8s step-end infinite;
}
@keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.ai-narrative-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.08); }
.ai-narrative-meta { font-size: 12px; color: rgba(255,255,255,0.5); }
.ai-narrative-regen {
  background: none; border: 1px solid var(--border-default); border-radius: 14px;
  padding: 6px 16px; color: rgba(255,255,255,0.4); font-family: var(--font-body);
  font-size: 12px; cursor: pointer; transition: all 0.3s;
}
.ai-narrative-regen:hover { color: #fff; border-color: rgba(255,255,255,0.35); }

/* ================================================================
   Trip history
   ================================================================ */
.trip-history-section { display: none; }
.trip-history-section.show { display: block; }
.trip-history-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
.trip-history-tab {
  padding: 10px 20px; border-radius: 16px; border: 1px solid var(--border-default);
  background: var(--glass-2-bg); color: rgba(255,255,255,0.5);
  font-family: var(--font-body); font-size: 13px; font-weight: 500; cursor: pointer;
  backdrop-filter: blur(8px); transition: all 0.3s var(--easing);
}
.trip-history-tab:hover { background: var(--glass-3-bg); color: #fff; }
.trip-history-tab.active { background: rgba(139,168,140,0.12); border-color: rgba(139,168,140,0.35); color: #8BA88C; }
.trip-history-card {
  padding: 24px; border-radius: 18px; margin-bottom: 14px;
  background: var(--glass-2-bg); border: 1px solid var(--border-default);
  transition: all 0.35s var(--easing); cursor: pointer;
}
.trip-history-card:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.25); }
.trip-history-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.trip-history-mood { font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 8px; }
.trip-history-date { font-size: 12px; color: rgba(255,255,255,0.5); }
.trip-history-summary { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
.trip-history-empty { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5); font-size: 15px; line-height: 2; }
.trip-history-empty-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.4; }

/* ================================================================
   Weather
   ================================================================ */
.weather-indicator {
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;
  border-radius: 14px; background: rgba(107,143,163,0.08);
  border: 1px solid rgba(107,143,163,0.15); font-size: 13px;
  color: rgba(107,180,210,0.8); margin-bottom: 16px;
}
.weather-indicator.rainy {
  background: rgba(107,143,163,0.15); border-color: rgba(107,180,210,0.25);
  animation: weatherPulse 2s ease-in-out infinite;
}
@keyframes weatherPulse {
  0%, 100% { border-color: rgba(107,180,210,0.25); } 50% { border-color: rgba(107,180,210,0.5); }
}
.weather-icon { font-size: 18px; }
.weather-detail { color: rgba(255,255,255,0.45); font-size: 11px; }

/* ================================================================
   Share card
   ================================================================ */
.share-card-section { display: none; }
.share-card-section.show { display: block; }
.share-card-preview {
  width: 100%; border-radius: 16px; overflow: hidden;
  border: 1px solid var(--border-default); cursor: pointer;
  transition: all 0.35s var(--easing);
}
.share-card-preview:hover { transform: scale(1.02); box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
.share-card-preview canvas { width: 100%; display: block; }
.share-actions { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.share-btn {
  padding: 10px 20px; border-radius: 14px; border: none; color: #fff;
  font-family: var(--font-body); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.3s var(--easing); display: flex; align-items: center; gap: 6px;
}
.share-btn:active { transform: scale(0.95); }

/* Budget warning */
.budget-warning {
  padding: 12px 16px; border-radius: 12px; background: rgba(255,107,107,0.08);
  border: 1px solid rgba(255,107,107,0.15); font-size: 13px; color: rgba(255,150,150,0.8);
  margin-top: 10px; display: none;
}
.budget-warning.show { display: block; }
.budget-validation-warning {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px;
  background: rgba(255,243,224,0.1); color: #E8945A; font-size: 12px; font-weight: 600; margin-top: 8px;
}
.budget-validation-warning.luxury { background: rgba(253,240,230,0.08); color: #D4A060; }

.day-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 4px 0 8px; }

/* Export modal */
.export-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.export-modal-overlay.show { opacity: 1; pointer-events: auto; }
.export-modal {
  width: 680px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
  background: rgba(14,14,26,0.97); backdrop-filter: var(--glass-1-blur); -webkit-backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--border-default); border-radius: 20px; padding: 28px;
  transform: scale(0.9); transition: transform 0.3s var(--easing);
}
.export-modal-overlay.show .export-modal { transform: scale(1); }
.export-modal h2 { font-size: 20px; color: #fff; margin-bottom: 16px; }
.export-modal pre {
  background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; font-size: 12px;
  color: rgba(255,255,255,0.7); white-space: pre-wrap; font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.8; max-height: 400px; overflow-y: auto;
}
.export-modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.export-modal-btn {
  padding: 10px 24px; border-radius: 14px; border: none; color: #fff;
  font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.3s;
}
.export-modal-btn:active { transform: scale(0.95); }
.export-modal-close {
  position: absolute; top: 16px; right: 20px; background: none; border: none;
  color: rgba(255,255,255,0.4); font-size: 20px; cursor: pointer;
}

/* Night mode */
body.night-mode .cloud { background: rgba(255,255,255,0.06); }
body.night-mode .bg-particles .particle { background: rgba(255,255,255,0.2); }
body.night-mode .mountain { opacity: 0.3; }

/* ================================================================
   Responsive
   ================================================================ */
@media (max-width: 1200px) {
  .left-panel { width: 42%; padding: 48px 40px 48px 48px; }
  .right-panel { width: 58%; padding: 48px 48px 48px 0; }
}
@media (max-width: 1024px) {
  .main-layout { flex-direction: column; }
  .left-panel { width: 100%; min-width: 0; padding: 36px 28px 24px; height: auto; }
  .left-content { align-items: center; gap: 36px; }
  .brand-section { text-align: center; }
  .mood-section-title { text-align: center; }
  .mood-grid { grid-template-columns: repeat(6, 1fr); gap: 10px; }
  .mood-btn { padding: 18px 8px 16px; border-radius: 16px; min-height: 100px; }
  .mood-btn-emoji { font-size: 24px; }
  .mood-btn-label { font-size: 13px; }
  .right-panel { width: 100%; padding: 0 28px 44px; overflow-y: visible; height: auto; }
  .premium-page { overflow-y: auto; height: auto; }
  .brand-slogan { font-size: 28px; }
  .budget-number { font-size: 56px; }
  .section-title { font-size: 32px; }
}
@media (max-width: 640px) {
  .left-panel { padding: 28px 18px 18px; }
  .mood-grid { grid-template-columns: repeat(3, 1fr); }
  .budget-panel { padding: 32px 24px; }
  .budget-number { font-size: 48px; }
  .hot-route-card { flex: 0 0 160px; }
  .section-title { font-size: 28px; }
  .plan-card { padding: 24px; }
  .plan-step-name { font-size: 14px; }
  .brand-name { font-size: 32px; }
  .brand-slogan { font-size: 24px; }
}

/* ================================================================
   Skeleton loading
   ================================================================ */
.skeleton-overlay {
  position: fixed; inset: 0; z-index: 500; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 24px;
  background: rgba(10,10,26,0.85); backdrop-filter: blur(12px);
  opacity: 0; pointer-events: none; transition: opacity 0.4s var(--easing);
}
.skeleton-overlay.show { opacity: 1; pointer-events: auto; }
.skeleton-spinner { width: 64px; height: 64px; position: relative; }
.skeleton-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid transparent;
  animation: skeletonSpin 1.2s var(--easing) infinite;
}
.skeleton-ring:nth-child(1) { border-top-color: rgba(139,168,140,0.8); animation-delay: 0s; }
.skeleton-ring:nth-child(2) { inset: 8px; border-right-color: rgba(232,168,90,0.6); animation-delay: 0.15s; }
.skeleton-ring:nth-child(3) { inset: 16px; border-bottom-color: rgba(107,143,163,0.5); animation-delay: 0.3s; }
@keyframes skeletonSpin { to { transform: rotate(360deg); } }
.skeleton-text {
  font-family: var(--font-display); font-size: 18px; color: rgba(255,255,255,0.5);
  text-align: center; line-height: 1.8;
}
.skeleton-dots { display: flex; gap: 6px; }
.skeleton-dots span {
  width: 8px; height: 8px; border-radius: 50%; background: rgba(139,168,140,0.5);
  animation: skeletonDot 1.2s ease-in-out infinite;
}
.skeleton-dots span:nth-child(2) { animation-delay: 0.2s; }
.skeleton-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes skeletonDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }

/* ================================================================
   Algo progress panel
   ================================================================ */
.algo-progress-panel {
  display: none; flex-direction: column; gap: 16px; width: 100%; max-width: 520px;
  padding: 32px; border-radius: 20px;
  background: var(--glass-1-bg); backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--border-default);
  animation: fadeInUp 0.5s var(--easing);
}
.algo-progress-panel.show { display: flex; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); filter: blur(2px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.algo-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.8); text-align: center; }
.algo-steps { display: flex; flex-direction: column; gap: 10px; }
.algo-step {
  display: flex; align-items: center; gap: 14px; padding: 12px 16px;
  border-radius: 14px; background: var(--glass-2-bg);
  border: 1px solid var(--border-default);
  transition: all 0.4s var(--easing);
}
.algo-step.active { background: rgba(139,168,140,0.08); border-color: rgba(139,168,140,0.25); box-shadow: 0 0 20px rgba(139,168,140,0.06); }
.algo-step.done { background: rgba(139,168,140,0.04); border-color: rgba(139,168,140,0.12); }
.algo-step-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; background: var(--glass-2-bg); transition: all 0.4s var(--easing); }
.algo-step.active .algo-step-icon { background: rgba(139,168,140,0.15); transform: scale(1.1); }
.algo-step.done .algo-step-icon { background: rgba(139,168,140,0.1); }
.algo-step-info { flex: 1; min-width: 0; }
.algo-step-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.5); transition: color 0.4s; }
.algo-step.active .algo-step-name { color: rgba(255,255,255,0.9); }
.algo-step.done .algo-step-name { color: rgba(139,168,140,0.8); }
.algo-step-detail { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; transition: color 0.4s; }
.algo-step.active .algo-step-detail { color: rgba(255,255,255,0.5); }
.algo-step-status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 8px; background: var(--glass-2-bg); color: rgba(255,255,255,0.5); transition: all 0.4s var(--easing); }
.algo-step.active .algo-step-status { background: rgba(139,168,140,0.15); color: #8BA88C; animation: statusPulse 1.5s ease-in-out infinite; }
.algo-step.done .algo-step-status { background: rgba(139,168,140,0.08); color: rgba(139,168,140,0.6); }
@keyframes statusPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.98); } }
.algo-stats { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.algo-stat { padding: 10px 18px; border-radius: 14px; background: var(--glass-2-bg); border: 1px solid var(--border-default); text-align: center; transition: all 0.4s var(--easing); }
.algo-stat-value { font-family: var(--font-title); font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.7); }
.algo-stat-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
.algo-stat.highlight { border-color: rgba(139,168,140,0.25); background: rgba(139,168,140,0.06); }
.algo-stat.highlight .algo-stat-value { color: #8BA88C; }

/* ================================================================
   Multi-agent pipeline
   ================================================================ */
.multi-agent-panel {
  margin-top: 20px; padding: 20px 24px;
  background: var(--glass-2-bg); border: 1px solid var(--border-default);
  border-radius: 20px; backdrop-filter: var(--glass-2-blur);
  display: none; flex-direction: column; gap: 8px;
  transition: all 0.5s var(--easing);
}
.multi-agent-panel.show { display: flex; }
.multi-agent-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 6px; letter-spacing: 1px; }
.agent-pipeline-connector { width: 2px; height: 8px; margin: 0 auto; background: linear-gradient(180deg, rgba(139,168,140,0.3), transparent); border-radius: 1px; }
.agent-card {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  border-radius: 14px; background: var(--glass-2-bg);
  border: 1px solid var(--border-default);
  transition: all 0.5s var(--easing); position: relative; overflow: hidden;
}
.agent-card.thinking { border-color: rgba(139,168,140,0.25); background: rgba(139,168,140,0.06); box-shadow: 0 0 20px rgba(139,168,140,0.06); }
.agent-card.done { border-color: rgba(139,168,140,0.12); background: rgba(139,168,140,0.03); }
.agent-card.done .agent-icon { opacity: 0.6; }
.agent-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; background: var(--glass-2-bg); transition: all 0.5s var(--easing); position: relative; }
.agent-pulse { position: absolute; inset: -2px; border-radius: 14px; border: 2px solid rgba(139,168,140,0.4); animation: agentPulseGlow 1.5s ease-in-out infinite; opacity: 0; }
.agent-card.thinking .agent-pulse { opacity: 1; }
@keyframes agentPulseGlow { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.08); opacity: 0.8; } }
.agent-info { flex: 1; min-width: 0; }
.agent-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); transition: color 0.4s; }
.agent-card.thinking .agent-name { color: rgba(255,255,255,0.9); }
.agent-card.done .agent-name { color: rgba(139,168,140,0.7); }
.agent-output { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; transition: all 0.4s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agent-card.thinking .agent-output { color: rgba(255,255,255,0.55); }
.agent-card.done .agent-output { color: rgba(139,168,140,0.5); }
.agent-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,0.35); transition: all 0.4s; }
.agent-card.thinking .agent-status-dot { background: #8BA88C; box-shadow: 0 0 8px rgba(139,168,140,0.5); animation: statusDotPulse 1s ease-in-out infinite; }
.agent-card.done .agent-status-dot { background: rgba(139,168,140,0.5); }
@keyframes statusDotPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.5); } }
.agent-thinking-dots::after { content: ''; animation: thinkingDots 1.5s steps(4, end) infinite; }
@keyframes thinkingDots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } 100% { content: ''; } }

/* ================================================================
   Soundtrack control
   ================================================================ */
.soundtrack-control { position: fixed; bottom: 20px; left: 20px; z-index: 100; display: flex; align-items: center; gap: 10px; }
.soundtrack-btn {
  width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
  background: var(--glass-1-bg); backdrop-filter: var(--glass-1-blur);
  cursor: pointer; font-size: 22px; display: flex; align-items: center;
  justify-content: center; transition: all 0.4s var(--easing);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.soundtrack-btn:hover { background: var(--glass-3-bg); transform: scale(1.08); }
.soundtrack-btn.playing { border-color: rgba(139,168,140,0.35); box-shadow: 0 0 20px rgba(139,168,140,0.1); }
.soundtrack-popup {
  display: none; padding: 16px 20px; border-radius: 16px;
  background: var(--glass-1-bg); backdrop-filter: var(--glass-1-blur);
  border: 1px solid var(--border-default); gap: 10px;
  align-items: center; box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}
.soundtrack-popup.show { display: flex; }
.soundtrack-volume {
  width: 80px; -webkit-appearance: none; appearance: none; height: 4px;
  border-radius: 2px; background: rgba(255,255,255,0.25); outline: none; cursor: pointer;
}
.soundtrack-volume::-webkit-slider-thumb {
  -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
  background: #8BA88C; cursor: pointer; border: 2px solid rgba(255,255,255,0.5);
}
.soundtrack-label { font-size: 11px; color: rgba(255,255,255,0.5); white-space: nowrap; }

/* ================================================================
   Crowd indicator
   ================================================================ */
.crowd-indicator { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; margin-left: 6px; }
.crowd-indicator.low { background: rgba(139,168,140,0.1); color: #8BA88C; }
.crowd-indicator.medium { background: rgba(232,168,90,0.1); color: #E8A85A; }
.crowd-indicator.high { background: rgba(222,160,79,0.1); color: #DEA04F; }
.crowd-indicator.crowded { background: rgba(200,80,60,0.1); color: #C8503C; }
.best-time-tip { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; font-style: italic; }

/* ================================================================
   Safety panel
   ================================================================ */
.safety-panel { display: none; padding: 20px 24px; border-radius: 20px; background: var(--glass-2-bg); border: 1px solid var(--border-default); backdrop-filter: var(--glass-2-blur); margin-top: 16px; }
.safety-panel.show { display: block; }
.safety-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 12px; }
.safety-card { padding: 14px 16px; border-radius: 14px; background: var(--glass-2-bg); border: 1px solid var(--border-default); text-align: center; transition: all 0.4s var(--easing); }
.safety-card:hover { border-color: rgba(255,255,255,0.25); background: var(--glass-3-bg); }
.safety-card-icon { font-size: 24px; margin-bottom: 6px; }
.safety-card-title { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7); }
.safety-card-detail { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 4px; }
.safety-tip { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: rgba(139,168,140,0.04); border-left: 3px solid rgba(139,168,140,0.25); line-height: 1.6; }

/* ================================================================
   Carbon footprint
   ================================================================ */
.carbon-section { display: none; padding: 20px 24px; margin-top: 16px; border-radius: 20px; background: var(--glass-2-bg); border: 1px solid var(--border-default); backdrop-filter: var(--glass-2-blur); }
.carbon-section.show { display: block; }
.carbon-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.carbon-leaf-icon { font-size: 28px; animation: leafSway 3s ease-in-out infinite; }
@keyframes leafSway { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-5deg); } }
.carbon-score-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.carbon-score-circle { width: 80px; height: 80px; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.carbon-score-inner { width: 64px; height: 64px; border-radius: 50%; background: var(--glass-2-bg); display: flex; align-items: center; justify-content: center; flex-direction: column; }
.carbon-score-value { font-family: var(--font-title); font-size: 24px; font-weight: 700; color: #8BA88C; }
.carbon-score-label { font-size: 10px; color: rgba(255,255,255,0.4); }
.carbon-details { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.carbon-detail-row { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.5); }
.carbon-detail-val { font-weight: 600; color: rgba(255,255,255,0.7); }
.carbon-tips { margin-top: 12px; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.8; }
.carbon-tips li { margin-bottom: 4px; }

/* ================================================================
   Timeline view
   ================================================================ */
.timeline-toggle { display: inline-flex; gap: 0; border-radius: 10px; overflow: hidden; border: 1px solid var(--border-default); margin-left: 12px; }
.timeline-toggle-btn { padding: 6px 14px; font-size: 12px; border: none; cursor: pointer; background: var(--glass-2-bg); color: rgba(255,255,255,0.4); font-family: var(--font-body); transition: all 0.35s var(--easing); }
.timeline-toggle-btn.active { background: rgba(139,168,140,0.12); color: #8BA88C; }
.timeline-view { display: none; flex-direction: column; gap: 16px; }
.timeline-view.show { display: flex; }
.timeline-day-row { display: flex; gap: 8px; align-items: flex-start; overflow-x: auto; padding: 8px 0; scroll-snap-type: x mandatory; }
.timeline-day-row::-webkit-scrollbar { height: 2px; }
.timeline-day-row::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 1px; }
.timeline-day-label { writing-mode: vertical-rl; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); padding: 8px; flex-shrink: 0; text-orientation: mixed; letter-spacing: 2px; }
.timeline-snake-item { flex: 0 0 180px; padding: 14px; border-radius: 14px; scroll-snap-align: start; background: var(--glass-2-bg); border: 1px solid var(--border-default); transition: all 0.4s var(--easing); }
.timeline-snake-item:hover { border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
.timeline-snake-time { font-size: 11px; color: rgba(255,255,255,0.4); }
.timeline-snake-name { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); margin: 4px 0; }
.timeline-snake-arrow { text-align: center; font-size: 16px; color: rgba(255,255,255,0.4); }

/* ================================================================
   Passport
   ================================================================ */
.passport-section { display: none; padding: 20px 24px; margin-top: 16px; border-radius: 20px; background: var(--glass-2-bg); border: 1px solid var(--border-default); backdrop-filter: var(--glass-2-blur); }
.passport-section.show { display: block; }
.passport-badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 12px; }
.passport-badge { padding: 14px 10px; border-radius: 14px; text-align: center; background: var(--glass-2-bg); border: 1px solid var(--border-default); transition: all 0.4s var(--easing); position: relative; }
.passport-badge.earned { border-color: rgba(139,168,140,0.25); background: rgba(139,168,140,0.06); }
.passport-badge.earned:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
.passport-badge.locked { opacity: 0.4; filter: grayscale(0.5); }
.passport-badge-icon { font-size: 28px; margin-bottom: 4px; }
.passport-badge-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); }
.passport-badge-desc { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
.passport-badge-check { position: absolute; top: 6px; right: 8px; font-size: 12px; display: none; }
.passport-badge.earned .passport-badge-check { display: block; }
.passport-progress { margin-top: 12px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); overflow: hidden; }
.passport-progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #8BA88C, #A3C4D6); transition: width 0.8s var(--easing); }

/* ================================================================
   Language switch
   ================================================================ */
.lang-switch { display: flex; gap: 4px; margin-top: 14px; justify-content: center; }
.lang-btn { padding: 4px 10px; border-radius: 8px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: rgba(255,255,255,0.4); font-size: 11px; font-family: var(--font-body); cursor: pointer; transition: all 0.35s var(--easing); }
.lang-btn:hover { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.7); }
.lang-btn.active { border-color: rgba(139,168,140,0.25); background: rgba(139,168,140,0.1); color: #8BA88C; }

/* ================================================================
   Search
   ================================================================ */
.search-section { width: 100%; position: relative; }
.search-input-wrap { display: flex; align-items: center; gap: 10px; padding: 4px; background: var(--glass-1-bg); border: 1px solid var(--border-default); border-radius: 16px; backdrop-filter: var(--glass-2-blur); transition: all 0.35s var(--easing); }
.search-input-wrap:focus-within { border-color: rgba(139,168,140,0.35); background: var(--glass-3-bg); box-shadow: 0 0 24px rgba(139,168,140,0.08); }
.search-icon { font-size: 18px; color: rgba(255,255,255,0.5); margin-left: 10px; flex-shrink: 0; }
.search-input { flex: 1; background: none; border: none; outline: none; padding: 12px 8px; font-family: var(--font-body); font-size: 15px; color: #fff; }
.search-input::placeholder { color: rgba(255,255,255,0.45); }
.search-shortcut { font-size: 11px; padding: 3px 8px; border-radius: 6px; margin-right: 8px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); flex-shrink: 0; }
.search-dropdown { position: absolute; top: 100%; left: 0; right: 0; margin-top: 8px; border-radius: 16px; background: rgba(14,14,26,0.97); backdrop-filter: var(--glass-1-blur); border: 1px solid var(--border-default); max-height: 280px; overflow-y: auto; opacity: 0; pointer-events: none; transform: translateY(-8px); transition: all 0.35s var(--easing); z-index: 50; box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
.search-dropdown.show { opacity: 1; pointer-events: auto; transform: translateY(0); }
.search-result-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.06); }
.search-result-item:hover { background: rgba(139,168,140,0.06); }
.search-result-icon { font-size: 22px; flex-shrink: 0; width: 28px; text-align: center; }
.search-result-info { flex: 1; min-width: 0; }
.search-result-name { font-size: 14px; font-weight: 600; color: #fff; }
.search-result-detail { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px; }
.search-result-tag { font-size: 10px; padding: 2px 8px; border-radius: 6px; flex-shrink: 0; background: rgba(139,168,140,0.12); color: #8BA88C; }
.search-no-result { padding: 24px; text-align: center; color: rgba(255,255,255,0.5); font-size: 14px; }

/* ================================================================
   POI detail
   ================================================================ */
.poi-detail-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); opacity: 0; pointer-events: none; transition: opacity 0.3s; }
.poi-detail-overlay.show { opacity: 1; pointer-events: auto; }
.poi-detail-modal { width: 420px; max-width: 90vw; max-height: 80vh; overflow-y: auto; background: rgba(14,14,26,0.97); backdrop-filter: var(--glass-1-blur); border: 1px solid var(--border-default); border-radius: 20px; transform: scale(0.9) translateY(20px); transition: transform 0.4s var(--easing); }
.poi-detail-overlay.show .poi-detail-modal { transform: scale(1) translateY(0); }
.poi-detail-img { width: 100%; height: 200px; object-fit: cover; border-radius: 20px 20px 0 0; background: linear-gradient(135deg, rgba(139,168,140,0.15), rgba(107,143,163,0.15)); display: flex; align-items: center; justify-content: center; }
.poi-detail-img-emoji { font-size: 72px; }
.poi-detail-body { padding: 20px 24px 24px; }
.poi-detail-name { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.poi-detail-city { font-size: 13px; color: rgba(255,255,255,0.55); margin-bottom: 12px; }
.poi-detail-info { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.poi-detail-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 16px; border-radius: 12px; background: var(--glass-2-bg); border: 1px solid var(--border-default); }
.poi-detail-stat-val { font-size: 18px; font-weight: 700; }
.poi-detail-stat-label { font-size: 11px; color: rgba(255,255,255,0.55); }
.poi-detail-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.8; margin-bottom: 16px; }
.poi-detail-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.poi-detail-actions { display: flex; gap: 10px; }
.poi-detail-btn { flex: 1; padding: 12px; border-radius: 14px; border: none; color: #fff; font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s var(--easing); }
.poi-detail-btn:active { transform: scale(0.95); }
.poi-detail-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.4); border: none; color: rgba(255,255,255,0.6); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.poi-detail-close:hover { background: rgba(0,0,0,0.6); color: #fff; }

/* ================================================================
   Theme toggle
   ================================================================ */
.theme-toggle-wrap { position: fixed; top: 20px; right: 80px; z-index: 200; display: flex; align-items: center; gap: 8px; }
.theme-toggle-btn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: var(--glass-1-bg); backdrop-filter: blur(12px); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.4s var(--easing); color: rgba(255,255,255,0.7); }
.theme-toggle-btn:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.35); transform: scale(1.08); }
.theme-toggle-btn:active { transform: scale(0.92); }
body.light-mode .bg-sky.sky-calm    { background: linear-gradient(180deg, #E8F4FD 0%, #F0F7F0 40%, #FFF8F0 80%, #FFF5EE 100%); }
body.light-mode .bg-sky.sky-happy   { background: linear-gradient(180deg, #FFF4E0 0%, #FFF0D0 30%, #FFF8E8 60%, #FFF0D8 100%); }
body.light-mode .bg-sky.sky-sad     { background: linear-gradient(180deg, #FFE8E4 0%, #FFF0E8 30%, #F0F8F0 70%, #E8F4E8 100%); }
body.light-mode .bg-sky.sky-anxious { background: linear-gradient(180deg, #E8EEF8 0%, #F0F4F8 40%, #F0F8F0 80%, #F0F4F0 100%); }
body.light-mode .bg-sky.sky-excited { background: linear-gradient(180deg, #FFE8E4 0%, #FFE8F4 30%, #FFF8E8 60%, #E8F0F8 100%); }
body.light-mode .bg-sky.sky-tired   { background: linear-gradient(180deg, #F0E8F4 0%, #F4E8F8 40%, #F8F0F8 80%, #F0E8F0 100%); }
body.light-mode .cloud { background: rgba(255,255,255,0.6); }
body.light-mode .glass-panel { background: rgba(255,255,255,0.7); border-color: rgba(0,0,0,0.08); }
body.light-mode .brand-name { color: #2D3436; text-shadow: none; }
body.light-mode .brand-slogan { color: #2D3436; text-shadow: none; }
body.light-mode .brand-sub { color: rgba(0,0,0,0.4); }
body.light-mode .mood-section-title { color: rgba(0,0,0,0.4); }
body.light-mode .budget-number { color: #2D3436; text-shadow: none; }
body.light-mode .section-title { color: #2D3436; text-shadow: none; }
body.light-mode .poi-name { color: #2D3436; }
body.light-mode .plan-step-name { color: #2D3436; }
body.light-mode .map-container { background: linear-gradient(180deg, #E8F0F4 0%, #F0F4F0 40%, #F4F4EC 100%); }
body.light-mode .search-dropdown { background: rgba(255,255,255,0.96); border-color: rgba(0,0,0,0.08); }
body.light-mode .search-result-name { color: #2D3436; }
body.light-mode .search-input { color: #2D3436; }
body.light-mode .search-input::placeholder { color: rgba(0,0,0,0.25); }

/* ================================================================
   Voice
   ================================================================ */
.voice-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border-default); background: var(--glass-2-bg); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.3s var(--easing); flex-shrink: 0; }
.voice-btn:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.3); }
.voice-btn.listening { background: rgba(255,107,107,0.2); border-color: rgba(255,107,107,0.4); animation: voicePulse 1s ease-in-out infinite; }
@keyframes voicePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.3); } 50% { box-shadow: 0 0 0 12px rgba(255,107,107,0); } }

/* ================================================================
   Edit mode
   ================================================================ */
.edit-mode-toggle { padding: 8px 16px; border-radius: 14px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: rgba(255,255,255,0.5); font-family: var(--font-body); font-size: 12px; cursor: pointer; transition: all 0.3s var(--easing); }
.edit-mode-toggle:hover { background: var(--glass-3-bg); color: #fff; }
.edit-mode-toggle.active { background: rgba(139,168,140,0.15); border-color: rgba(139,168,140,0.35); color: #8BA88C; }
.timeline-item.editable { cursor: grab; }
.timeline-item.editable:active { cursor: grabbing; }
.timeline-item.editable:hover { background: rgba(139,168,140,0.04); border-radius: 12px; }
.timeline-item.drag-over { border-top: 2px dashed rgba(139,168,140,0.4); }
.timeline-item-remove { display: none; width: 24px; height: 24px; border-radius: 50%; border: none; background: rgba(255,107,107,0.15); color: #FF6B6B; font-size: 14px; cursor: pointer; align-items: center; justify-content: center; transition: all 0.3s; flex-shrink: 0; margin-left: auto; }
.edit-mode .timeline-item-remove { display: flex; }
.timeline-item-remove:hover { background: rgba(255,107,107,0.35); }
.add-poi-btn { width: 100%; padding: 12px; border-radius: 14px; border: 1px dashed rgba(255,255,255,0.25); background: var(--glass-2-bg); color: rgba(255,255,255,0.4); font-family: var(--font-body); font-size: 13px; cursor: pointer; transition: all 0.3s var(--easing); display: none; }
.edit-mode .add-poi-btn { display: block; }
.add-poi-btn:hover { background: rgba(139,168,140,0.06); border-color: rgba(139,168,140,0.25); color: #8BA88C; }

/* ================================================================
   POI image
   ================================================================ */
.poi-image { width: 100%; height: 160px; border-radius: 12px; object-fit: cover; margin-bottom: 12px; background: rgba(255,255,255,0.06); }
.poi-image-placeholder { width: 100%; height: 160px; border-radius: 12px; margin-bottom: 12px; background: linear-gradient(135deg, rgba(139,168,140,0.06), rgba(107,143,163,0.06)); display: flex; align-items: center; justify-content: center; font-size: 48px; }

/* ================================================================
   Onboarding
   ================================================================ */
.onboarding-overlay { position: fixed; inset: 0; z-index: 900; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); opacity: 0; pointer-events: none; transition: opacity 0.5s var(--easing); }
.onboarding-overlay.show { opacity: 1; pointer-events: auto; }
.onboarding-card { width: 420px; max-width: 90vw; padding: 36px 32px; border-radius: 24px; background: rgba(14,14,26,0.97); backdrop-filter: var(--glass-1-blur); border: 1px solid var(--border-default); text-align: center; transform: translateY(20px); transition: transform 0.5s var(--easing); box-shadow: 0 24px 64px rgba(0,0,0,0.5); }
.onboarding-overlay.show .onboarding-card { transform: translateY(0); }
.onboarding-step-indicator { display: flex; gap: 8px; justify-content: center; margin-bottom: 24px; }
.onboarding-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.25); transition: all 0.4s var(--easing); }
.onboarding-dot.active { background: #8BA88C; width: 24px; border-radius: 4px; }
.onboarding-icon { font-size: 56px; margin-bottom: 16px; display: block; }
.onboarding-title { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.onboarding-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.8; margin-bottom: 28px; }
.onboarding-actions { display: flex; gap: 10px; justify-content: center; }
.onboarding-btn { padding: 12px 28px; border-radius: 16px; border: none; color: #fff; font-family: var(--font-body); font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.35s var(--easing); }
.onboarding-btn.primary { background: linear-gradient(135deg, #8BA88C, #6B8E6C); }
.onboarding-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139,168,140,0.3); }
.onboarding-btn.secondary { background: var(--glass-2-bg); border: 1px solid rgba(255,255,255,0.25); }
.onboarding-btn.secondary:hover { background: var(--glass-3-bg); }
.onboarding-skip { background: none; border: none; color: rgba(255,255,255,0.45); font-family: var(--font-body); font-size: 12px; cursor: pointer; margin-top: 12px; transition: color 0.3s; }
.onboarding-skip:hover { color: rgba(255,255,255,0.5); }

/* ================================================================
   Ripple
   ================================================================ */
.ripple { position: relative; overflow: hidden; }
.ripple-effect { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.4); transform: scale(0); animation: rippleAnim 0.6s ease-out; pointer-events: none; }
@keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }

/* ================================================================
   Print
   ================================================================ */
@media print {
  .bg-layer, .bg-clouds, .bg-balloons, .bg-airplane, .bg-particles,
  .bg-mountains, .breathe-glow, .tree-hole-btn, .tree-hole-popup,
  .emotion-bubble, .theme-toggle-wrap, .skeleton-overlay,
  .toast-bar, .booking-popup-overlay, .export-modal-overlay,
  .poi-detail-overlay, .simplified-overlay, .left-panel,
  .search-section, .mood-section, .explicit-mood, .companion-section,
  .elderly-toggle-wrap, .left-quick, .scene-section, .hot-routes-section,
  .plans-section, .generate-btn, .budget-section, .daily-section,
  .compliance-strip, .mini-footer, .privacy-notice, .map-legend,
  .map-controls, .export-bar, .share-card-section, .ai-narrative-section,
  .checklist-section, .care-letter-section, .trip-history-section,
  .stats-row, .budget-warning, .day-toolbar { display: none; }
  .premium-page { overflow: visible; height: auto; }
  .main-layout { flex-direction: column; }
  .right-panel { width: 100%; overflow: visible; padding: 20px; height: auto; }
  .glass-panel { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(255,255,255,0.95); border: 1px solid #ddd; box-shadow: none; }
  .brand-name, .brand-slogan { color: #333; text-shadow: none; }
  .section-title, .poi-name, .plan-step-name, .hotel-name { color: #333; }
  .itinerary-section { display: block; }
  .hotel-section { display: block; }
  .map-section { display: block; }
  .map-container { height: 300px; background: #fff; border: 1px solid #ddd; }
  .timeline-card, .plan-card { background: #fff; border: 1px solid #eee; }
  .day-header { background: #f5f5f5; color: #333; }
  .plan-step-time, .time, .poi-desc, .reason-bar, .tag { color: #666; }
  body { background: #fff; }
  @page { margin: 1.5cm; size: A4; }
  .travel-persona-section, .journal-section, .viz-section, .compare-section,
  .smart-alerts { display: block; }
  .back-to-top, .ai-chat-btn, .ai-chat-modal { display: none; }
  .persona-card, .journal-card, .viz-card, .compare-col,
  .passport-section, .carbon-section, .safety-panel {
    backdrop-filter: none; -webkit-backdrop-filter: none;
    background: rgba(255,255,255,0.95); border: 1px solid #ddd;
    box-shadow: none;
  }
  .persona-name, .persona-stat-val, .journal-day, .compare-col-title,
  .compare-metric-val, .viz-card-title { color: #333; }
  .persona-desc, .journal-body, .compare-metric-label { color: #666; }
}

/* ================================================================
   Feedback
   ================================================================ */
.feedback-overlay { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); opacity: 0; pointer-events: none; transition: opacity 0.4s var(--easing); }
.feedback-overlay.show { opacity: 1; pointer-events: auto; }
.feedback-card { width: 380px; max-width: 90vw; padding: 32px 28px; border-radius: 24px; text-align: center; background: rgba(14,14,26,0.97); border: 1px solid var(--border-default); transform: translateY(20px); transition: transform 0.4s var(--easing); position: relative; }
.feedback-overlay.show .feedback-card { transform: translateY(0); }
.feedback-close { position: absolute; top: 14px; right: 16px; width: 28px; height: 28px; border-radius: 50%; background: var(--glass-2-bg); border: none; color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.feedback-close:hover { background: rgba(255,255,255,0.25); color: #fff; }
.feedback-title { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.feedback-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 20px; }
.feedback-stars { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
.feedback-star { font-size: 36px; color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.2s var(--easing); user-select: none; }
.feedback-star:hover { color: #FFD700; transform: scale(1.2); }
.feedback-input { width: 100%; padding: 12px 16px; border-radius: 14px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: #fff; font-family: var(--font-body); font-size: 13px; outline: none; resize: none; min-height: 60px; margin-bottom: 14px; transition: border-color 0.3s; }
.feedback-input:focus { border-color: rgba(139,168,140,0.5); }
.feedback-input::placeholder { color: rgba(255,255,255,0.4); }
.feedback-submit-btn { width: 100%; padding: 13px; border-radius: 16px; border: none; background: linear-gradient(135deg, #8BA88C, #6B8E6C); color: #fff; font-family: var(--font-body); font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s var(--easing); }
.feedback-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,168,140,0.3); }
.feedback-submit-btn:active { transform: scale(0.97); }

/* ================================================================
   API settings
   ================================================================ */
.api-settings-panel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1100; width: 440px; max-width: 90vw; padding: 28px; border-radius: 20px; background: rgba(14,14,26,0.97); border: 1px solid var(--border-default); backdrop-filter: var(--glass-1-blur); }
.api-settings-panel.show { display: block; }
.api-settings-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.api-settings-sub { font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 20px; }
.api-settings-field { margin-bottom: 14px; }
.api-settings-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 6px; display: block; }
.api-settings-input { width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: #fff; font-family: monospace; font-size: 13px; outline: none; transition: border-color 0.3s; }
.api-settings-input:focus { border-color: rgba(139,168,140,0.5); }
.api-settings-input::placeholder { color: rgba(255,255,255,0.35); }
.api-settings-hint { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px; }
.api-settings-actions { display: flex; gap: 10px; margin-top: 20px; }
.api-settings-btn { flex: 1; padding: 11px; border-radius: 14px; border: none; color: #fff; font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.api-settings-btn.primary { background: linear-gradient(135deg, #8BA88C, #6B8E6C); }
.api-settings-btn.primary:hover { transform: translateY(-1px); }
.api-settings-btn.secondary { background: var(--glass-2-bg); border: 1px solid var(--border-default); }
.api-settings-btn.secondary:hover { background: var(--glass-3-bg); }

/* ================================================================
   Performance & GPU
   ================================================================ */
.map-svg, .plan-card, .timeline-card, .mood-btn, .hot-route-card { will-change: transform; }
.glass-panel { contain: layout style; }

/* Touch devices */
@media (hover: none) {
  .mood-btn:hover { transform: none; }
  .mood-btn:active { transform: scale(0.95); background: var(--glass-3-bg); }
  .hot-route-card:hover { transform: none; }
  .hot-route-card:active { transform: scale(0.97); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms;
  }
}

/* ================================================================
   AI Chat
   ================================================================ */
.ai-chat-btn { position: fixed; bottom: 100px; right: 32px; z-index: 198; width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: linear-gradient(135deg, #8BA88C, #6B8E6C); box-shadow: 0 4px 20px rgba(139,168,140,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.4s var(--easing); animation: aiChatFloat 3s ease-in-out infinite; }
.ai-chat-btn:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(139,168,140,0.5); }
@keyframes aiChatFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.03); } }
.ai-chat-modal { position: fixed; bottom: 170px; right: 32px; z-index: 199; width: 380px; max-width: calc(100vw - 64px); max-height: 520px; border-radius: 20px; background: rgba(14,14,26,0.97); backdrop-filter: var(--glass-1-blur); border: 1px solid var(--border-default); box-shadow: 0 16px 48px rgba(0,0,0,0.5); display: flex; flex-direction: column; opacity: 0; pointer-events: none; transform: translateY(12px) scale(0.95); transition: all 0.4s var(--easing); }
.ai-chat-modal.show { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
.ai-chat-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.ai-chat-header-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #fff; }
.ai-chat-header-dot { width: 8px; height: 8px; border-radius: 50%; background: #8BA88C; animation: aiDotPulse 1.5s ease-in-out infinite; }
.ai-chat-close { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--glass-2-bg); color: rgba(255,255,255,0.5); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.ai-chat-close:hover { background: rgba(255,255,255,0.25); color: #fff; }
.ai-chat-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; min-height: 200px; max-height: 320px; }
.ai-chat-body::-webkit-scrollbar { width: 3px; }
.ai-chat-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
.ai-chat-msg { max-width: 85%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.7; animation: msgSlideIn 0.3s var(--easing); }
@keyframes msgSlideIn { from { opacity: 0; transform: translateY(10px); filter: blur(2px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
.ai-chat-msg.bot { align-self: flex-start; background: rgba(139,168,140,0.08); border: 1px solid rgba(139,168,140,0.15); color: rgba(255,255,255,0.8); border-bottom-left-radius: 4px; }
.ai-chat-msg.user { align-self: flex-end; background: var(--glass-2-bg); border: 1px solid rgba(255,255,255,0.25); color: #fff; border-bottom-right-radius: 4px; }
.ai-chat-msg.typing { align-self: flex-start; background: rgba(139,168,140,0.05); border: 1px solid rgba(139,168,140,0.1); color: rgba(255,255,255,0.4); border-bottom-left-radius: 4px; }
.ai-chat-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 20px 12px; border-top: 1px solid rgba(255,255,255,0.08); }
.ai-chat-suggestion { padding: 6px 14px; border-radius: 14px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: rgba(255,255,255,0.5); font-size: 11px; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
.ai-chat-suggestion:hover { background: rgba(139,168,140,0.1); border-color: rgba(139,168,140,0.25); color: #8BA88C; }
.ai-chat-input-wrap { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.ai-chat-input { flex: 1; padding: 10px 14px; border-radius: 14px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: #fff; font-family: var(--font-body); font-size: 13px; outline: none; transition: border-color 0.3s; }
.ai-chat-input::placeholder { color: rgba(255,255,255,0.4); }
.ai-chat-input:focus { border-color: rgba(139,168,140,0.5); }
.ai-chat-send { width: 36px; height: 36px; border-radius: 50%; border: none; background: linear-gradient(135deg, #8BA88C, #6B8E6C); color: #fff; font-size: 16px; cursor: pointer; flex-shrink: 0; transition: all 0.3s; display: flex; align-items: center; justify-content: center; }
.ai-chat-send:hover { transform: scale(1.05); }
.ai-chat-send:active { transform: scale(0.92); }
.ai-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

/* AI refine */
.ai-refine-bar { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 0; }
.ai-refine-btn { padding: 8px 16px; border-radius: 16px; border: 1px solid var(--border-default); background: rgba(139,168,140,0.06); color: rgba(139,168,140,0.8); font-family: var(--font-body); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.35s var(--easing); display: flex; align-items: center; gap: 5px; backdrop-filter: blur(8px); }
.ai-refine-btn:hover { background: rgba(139,168,140,0.15); border-color: rgba(139,168,140,0.35); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(139,168,140,0.12); }
.ai-refine-btn:active { transform: scale(0.95); }
.ai-refine-btn.loading { opacity: 0.6; pointer-events: none; }
.ai-refine-btn .ai-sparkle { display: inline-block; animation: aiSparkle 1.5s ease-in-out infinite; }
@keyframes aiSparkle { 0%, 100% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; }
.empty-state-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.5; }
.empty-state-title { font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
.empty-state-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.8; max-width: 320px; }

/* ================================================================
   Travel persona
   ================================================================ */
.travel-persona-section { display: none; }
.travel-persona-section.show { display: block; }
.persona-card { padding: 36px; position: relative; overflow: hidden; background: linear-gradient(135deg, rgba(139,168,140,0.06) 0%, rgba(107,143,163,0.04) 100%); border: 1px solid var(--border-default); }
.persona-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.persona-avatar { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; border: 3px solid rgba(255,255,255,0.25); position: relative; }
.persona-avatar::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); animation: personaRing 3s ease-in-out infinite; }
@keyframes personaRing { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.08); opacity: 0.6; } }
.persona-info { flex: 1; }
.persona-name { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.persona-type { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 500; }
.persona-traits { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.persona-trait { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: rgba(255,255,255,0.6); transition: all 0.35s var(--easing); }
.persona-trait:hover { background: var(--glass-3-bg); border-color: rgba(255,255,255,0.3); transform: translateY(-1px); }
.persona-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.persona-stat { padding: 14px 12px; border-radius: 14px; text-align: center; background: var(--glass-2-bg); border: 1px solid var(--border-default); transition: all 0.35s var(--easing); }
.persona-stat:hover { background: var(--glass-3-bg); transform: translateY(-2px); }
.persona-stat-icon { font-size: 20px; margin-bottom: 4px; }
.persona-stat-val { font-size: 16px; font-weight: 700; color: #fff; }
.persona-stat-label { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
.persona-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.8; padding: 16px; border-radius: 12px; background: var(--glass-2-bg); border-left: 2px solid rgba(139,168,140,0.25); }

/* ================================================================
   Compare section
   ================================================================ */
.compare-section { display: none; }
.compare-section.show { display: block; }
.compare-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.compare-col { padding: 24px; border-radius: 18px; position: relative; background: var(--glass-2-bg); border: 1px solid var(--border-default); transition: all 0.4s var(--easing); }
.compare-col:hover { border-color: rgba(255,255,255,0.18); }
.compare-col.recommended { border-color: rgba(139,168,140,0.25); background: rgba(139,168,140,0.04); box-shadow: 0 0 32px rgba(139,168,140,0.06); }
.compare-col.recommended::before { content: 'ð AIæ¨è'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 4px 14px; border-radius: 10px; font-size: 11px; font-weight: 600; background: linear-gradient(135deg, #8BA88C, #6B8E6C); color: #fff; white-space: nowrap; box-shadow: 0 4px 12px rgba(139,168,140,0.3); }
.compare-col-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.compare-col-subtitle { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
.compare-metric { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.compare-metric-label { font-size: 12px; color: rgba(255,255,255,0.4); }
.compare-metric-val { font-size: 14px; font-weight: 600; }
.compare-verdict { margin-top: 16px; padding: 14px; border-radius: 12px; font-size: 13px; line-height: 1.8; }
.compare-select-btn { width: 100%; margin-top: 12px; padding: 12px; border-radius: 14px; border: none; color: #fff; font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s var(--easing); }
.compare-select-btn:hover { transform: translateY(-1px); }

/* ================================================================
   Journal
   ================================================================ */
.journal-section { display: none; }
.journal-section.show { display: block; }
.journal-card { padding: 32px; background: linear-gradient(135deg, rgba(139,168,140,0.04) 0%, rgba(163,181,166,0.02) 100%); border: 1px solid var(--border-default); position: relative; overflow: hidden; }
.journal-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--active-mood-color, #8BA88C), transparent); }
.journal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.journal-day { font-size: 18px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
.journal-day-num { display: inline-flex; width: 32px; height: 32px; border-radius: 50%; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; }
.journal-date { font-size: 12px; color: rgba(255,255,255,0.55); }
.journal-body { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 2; }
.journal-photo-spot { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: rgba(139,168,140,0.06); font-size: 12px; color: rgba(139,168,140,0.7); display: flex; align-items: center; gap: 8px; }
.journal-mood { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 8px; font-size: 11px; margin-top: 8px; }

/* ================================================================
   Viz
   ================================================================ */
.viz-section { display: none; }
.viz-section.show { display: block; }
.viz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.viz-card { padding: 20px; border-radius: 18px; background: var(--glass-2-bg); border: 1px solid var(--border-default); text-align: center; }
.viz-card-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
.viz-canvas { width: 100%; max-width: 200px; height: auto; }
.viz-legend { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 10px; }
.viz-legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: rgba(255,255,255,0.4); }
.viz-legend-dot { width: 8px; height: 8px; border-radius: 2px; }

/* Smart alerts */
.smart-alerts { display: none; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.smart-alerts.show { display: flex; }
.smart-alert { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; font-size: 12px; animation: alertSlideIn 0.4s var(--easing); }
@keyframes alertSlideIn { from { opacity: 0; transform: translateX(-16px); filter: blur(1px); } to { opacity: 1; transform: translateX(0); filter: blur(0); } }
.smart-alert.warning { background: rgba(255,165,0,0.08); border: 1px solid rgba(255,165,0,0.15); color: rgba(255,200,100,0.8); }
.smart-alert.info { background: rgba(70,130,180,0.08); border: 1px solid rgba(70,130,180,0.15); color: rgba(100,180,220,0.8); }
.smart-alert.danger { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.15); color: rgba(255,140,140,0.8); }
.smart-alert.success { background: rgba(139,168,140,0.08); border: 1px solid rgba(139,168,140,0.15); color: rgba(139,168,140,0.8); }
.smart-alert-icon { font-size: 16px; flex-shrink: 0; }

/* Responsive tweaks */
@media (max-width: 768px) {
  .compare-container { grid-template-columns: 1fr; }
  .viz-grid { grid-template-columns: 1fr; }
  .persona-stats-row { grid-template-columns: repeat(2, 1fr); }
}

/* Back to top */
.back-to-top { position: fixed; bottom: 32px; right: 100px; z-index: 198; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border-default); background: var(--glass-1-bg); backdrop-filter: blur(12px); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: rgba(255,255,255,0.5); opacity: 0; pointer-events: none; transform: translateY(10px); transition: all 0.4s var(--easing); }
.back-to-top.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
.back-to-top:hover { background: var(--glass-3-bg); color: #fff; border-color: rgba(255,255,255,0.35); }

/* Reveal */
.reveal-section { opacity: 0; transform: translateY(24px); transition: opacity 0.6s var(--easing), transform 0.6s var(--easing); }
.reveal-section.revealed { opacity: 1; transform: translateY(0); }

/* ================================================================
   MBTI
   ================================================================ */
.mbti-quiz-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.75); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.4s var(--easing); }
.mbti-quiz-overlay.show { opacity: 1; pointer-events: auto; }
.mbti-quiz-modal { width: 680px; max-height: 90vh; overflow-y: auto; border-radius: 24px; background: rgba(14,14,26,0.97); border: 1px solid var(--border-default); backdrop-filter: var(--glass-1-blur); padding: 40px; position: relative; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
.mbti-quiz-title { font-family: var(--font-display); font-size: 32px; font-weight: 700; color: #fff; text-align: center; margin-bottom: 8px; }
.mbti-quiz-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); text-align: center; margin-bottom: 32px; }
.mbti-question-block { margin-bottom: 28px; animation: fadeInUp 0.5s var(--easing) both; }
.mbti-question-num { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
.mbti-question-text { font-size: 18px; font-weight: 500; color: rgba(255,255,255,0.9); margin-bottom: 16px; line-height: 1.5; }
.mbti-options { display: flex; gap: 12px; }
.mbti-option { flex: 1; padding: 16px 20px; border-radius: 16px; cursor: pointer; background: var(--glass-2-bg); border: 2px solid var(--border-default); transition: all 0.4s var(--easing); text-align: center; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 400; position: relative; overflow: hidden; }
.mbti-option:hover { border-color: rgba(139,168,140,0.4); background: rgba(139,168,140,0.06); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
.mbti-option.selected { border-color: var(--mbti-accent, #8BA88C); background: rgba(139,168,140,0.12); color: #fff; font-weight: 600; }
.mbti-option.selected::after { content: '\u2713'; position: absolute; top: 8px; right: 12px; font-size: 14px; color: var(--mbti-accent, #8BA88C); }
.mbti-progress-bar { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 32px; overflow: hidden; }
.mbti-progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #8BA88C, #A3C4D6, #B5A3C4); transition: width 0.5s var(--easing); }
.mbti-quiz-nav { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
.mbti-quiz-nav button { padding: 12px 32px; border-radius: 14px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.35s var(--easing); }
.mbti-btn-prev { background: var(--glass-2-bg); color: rgba(255,255,255,0.6); }
.mbti-btn-prev:hover { background: var(--glass-3-bg); }
.mbti-btn-next { background: linear-gradient(135deg, #8BA88C, #6B8FA3); color: #fff; box-shadow: 0 4px 16px rgba(139,168,140,0.3); }
.mbti-btn-next:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(139,168,140,0.4); }
.mbti-btn-next:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
.mbti-result-overlay { position: fixed; inset: 0; z-index: 9998; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.5s var(--easing); background: rgba(0,0,0,0.7); backdrop-filter: blur(16px); }
.mbti-result-overlay.show { opacity: 1; pointer-events: auto; }
.mbti-result-card { width: 560px; max-height: 85vh; overflow-y: auto; border-radius: 28px; padding: 40px; position: relative; background: rgba(14,14,26,0.97); border: 1px solid var(--border-default); backdrop-filter: var(--glass-1-blur); box-shadow: 0 24px 80px rgba(0,0,0,0.6); animation: resultSlideIn 0.6s var(--easing) both; }
@keyframes resultSlideIn { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
.mbti-result-header { text-align: center; margin-bottom: 28px; }
.mbti-result-type { font-family: var(--font-title); font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #8BA88C, #A3C4D6, #B5A3C4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 4px; }
.mbti-result-nickname { font-size: 16px; color: rgba(255,255,255,0.5); letter-spacing: 2px; }
.mbti-result-traits { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin: 16px 0; }
.mbti-result-trait { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; background: rgba(139,168,140,0.1); color: rgba(255,255,255,0.7); border: 1px solid rgba(139,168,140,0.15); }
.mbti-result-section { margin-bottom: 20px; padding: 18px 20px; border-radius: 16px; background: var(--glass-2-bg); border: 1px solid var(--border-default); }
.mbti-result-section-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
.mbti-result-destinations { display: flex; gap: 8px; flex-wrap: wrap; }
.mbti-dest-chip { padding: 8px 16px; border-radius: 12px; font-size: 13px; font-weight: 500; background: var(--glass-2-bg); color: rgba(255,255,255,0.8); border: 1px solid var(--border-default); transition: all 0.35s var(--easing); cursor: pointer; }
.mbti-dest-chip:hover { background: rgba(139,168,140,0.12); border-color: rgba(139,168,140,0.35); }
.mbti-result-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
.mbti-result-btn { padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.35s var(--easing); }
.mbti-btn-primary { background: linear-gradient(135deg, #8BA88C, #6B8FA3); color: #fff; box-shadow: 0 4px 20px rgba(139,168,140,0.3); }
.mbti-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(139,168,140,0.4); }
.mbti-btn-secondary { background: var(--glass-2-bg); color: rgba(255,255,255,0.7); }
.mbti-btn-secondary:hover { background: var(--glass-3-bg); }
.mbti-entry-btn { position: fixed; bottom: 140px; right: 24px; z-index: 100; width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer; background: linear-gradient(135deg, #8BA88C, #A3C4D6); color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(139,168,140,0.3); transition: all 0.35s var(--easing); }
.mbti-entry-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(139,168,140,0.5); }
.mbti-entry-btn.has-result { background: linear-gradient(135deg, #E8A85A, #FF6B6B); }

/* ================================================================
   Animation extras
   ================================================================ */
.cursor-glow { position: fixed; pointer-events: none; z-index: 99999; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(139,168,140,0.06) 0%, transparent 70%); transform: translate(-50%, -50%); transition: opacity 0.3s; will-change: transform, opacity; }
.cursor-glow.hidden { opacity: 0; }
.btn-ripple { position: relative; overflow: hidden; }
.card-3d { transition: transform 0.35s var(--easing), box-shadow 0.35s var(--easing); transform-style: preserve-3d; perspective: 1000px; }
.card-3d:hover { transform: translateY(-4px) rotateX(2deg); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
.reveal-sequence > * { opacity: 0; transform: translateY(20px); animation: revealItem 0.5s var(--easing) forwards; }
.reveal-sequence > *:nth-child(1) { animation-delay: 0.05s; }
.reveal-sequence > *:nth-child(2) { animation-delay: 0.1s; }
.reveal-sequence > *:nth-child(3) { animation-delay: 0.15s; }
.reveal-sequence > *:nth-child(4) { animation-delay: 0.2s; }
.reveal-sequence > *:nth-child(5) { animation-delay: 0.25s; }
.reveal-sequence > *:nth-child(6) { animation-delay: 0.3s; }
.reveal-sequence > *:nth-child(7) { animation-delay: 0.35s; }
.reveal-sequence > *:nth-child(8) { animation-delay: 0.4s; }
@keyframes revealItem { to { opacity: 1; transform: translateY(0); filter: blur(0); } }
.glass-depth-1 { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); }
.glass-depth-2 { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); }
.glass-depth-3 { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(20px); }
.breathing-glow { animation: breathingGlow 3s ease-in-out infinite; }
@keyframes breathingGlow { 0%, 100% { box-shadow: 0 0 20px rgba(139,168,140,0.06); } 50% { box-shadow: 0 0 48px rgba(139,168,140,0.25); } }
.typing-cursor::after { content: '|'; animation: cursorBlink 1s step-end infinite; color: var(--cursor-color, #8BA88C); font-weight: 300; }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; animation: pulseDot 2s ease-in-out infinite; }
@keyframes pulseDot { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(2); opacity: 0.2; } }
.floating-label { animation: floatLabel 3s ease-in-out infinite; }
@keyframes floatLabel { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.02); } }
.skeleton-shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.page-transition-enter { animation: pageEnter 0.5s var(--easing) both; }
@keyframes pageEnter { from { opacity: 0; transform: translateY(16px); filter: blur(2px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
.magnetic-hover { transition: transform 0.2s var(--easing); }
.magnetic-hover:hover { transform: scale(1.03); }
.checkmark-anim { animation: checkmarkPop 0.5s var(--easing-bounce) both; }
@keyframes checkmarkPop { 0% { transform: scale(0) rotate(-15deg); opacity: 0; } 50% { transform: scale(1.25) rotate(3deg); opacity: 1; } 75% { transform: scale(0.95) rotate(-1deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
.number-roll { display: inline-block; animation: numberRoll 0.6s var(--easing-bounce) both; }
@keyframes numberRoll { from { transform: translateY(120%); opacity: 0; filter: blur(2px); } to { transform: translateY(0); opacity: 1; filter: blur(0); } }
.star-burst { animation: starBurst 0.6s var(--easing-bounce) both; }
@keyframes starBurst { 0% { transform: scale(0) rotate(-45deg); opacity: 0; filter: blur(2px); } 50% { transform: scale(1.35) rotate(8deg); opacity: 1; filter: blur(0); } 75% { transform: scale(0.9) rotate(-3deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }

/* Focus visible */
:focus-visible { outline: 2px solid rgba(139,168,140,0.5); outline-offset: 2px; border-radius: 4px; }

/* High contrast */
@media (prefers-contrast: high) {
  body { color: #fff; }
  .glass-depth-1, .glass-depth-2, .glass-depth-3 { background: rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.5); }
}

/* ================================================================
   Postcard
   ================================================================ */
.postcard-overlay { position: fixed; inset: 0; z-index: 9996; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.4s var(--easing); background: rgba(0,0,0,0.75); backdrop-filter: blur(16px); }
.postcard-overlay.show { opacity: 1; pointer-events: auto; }
.postcard-modal { width: 640px; border-radius: 24px; padding: 32px; background: rgba(14,14,26,0.97); border: 1px solid var(--border-default); backdrop-filter: var(--glass-1-blur); box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
.postcard-canvas-wrap { width: 100%; border-radius: 16px; overflow: hidden; margin: 16px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
.postcard-canvas-wrap canvas { width: 100%; display: block; }
.postcard-actions { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
.postcard-style-chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
.postcard-style-chip { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 13px; transition: all 0.35s var(--easing); }
.postcard-style-chip:hover, .postcard-style-chip.active { border-color: rgba(139,168,140,0.4); background: rgba(139,168,140,0.12); color: #fff; }

/* ================================================================
   Expense splitter
   ================================================================ */
.expense-splitter-overlay { position: fixed; inset: 0; z-index: 9997; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.4s var(--easing); background: rgba(0,0,0,0.7); backdrop-filter: blur(16px); }
.expense-splitter-overlay.show { opacity: 1; pointer-events: auto; }
.expense-splitter-modal { width: 520px; max-height: 85vh; overflow-y: auto; border-radius: 24px; padding: 36px; background: rgba(14,14,26,0.97); border: 1px solid var(--border-default); backdrop-filter: var(--glass-1-blur); box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
.expense-splitter-title { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: #fff; text-align: center; margin-bottom: 6px; }
.expense-member-list { display: flex; flex-direction: column; gap: 8px; margin: 20px 0; }
.expense-member-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: var(--glass-2-bg); border: 1px solid var(--border-default); }
.expense-member-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; background: var(--glass-2-bg); flex-shrink: 0; }
.expense-member-name { flex: 1; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); }
.expense-member-input { width: 100px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-default); background: var(--glass-2-bg); color: #fff; font-size: 14px; text-align: right; transition: all 0.35s var(--easing); }
.expense-member-input:focus { border-color: rgba(139,168,140,0.5); outline: none; }
.expense-summary { padding: 16px 20px; border-radius: 14px; background: rgba(139,168,140,0.06); border: 1px solid rgba(139,168,140,0.12); margin-top: 16px; }
.expense-summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: rgba(255,255,255,0.7); }
.expense-summary-row.total { font-weight: 700; font-size: 16px; color: #fff; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; margin-top: 6px; }
.expense-per-person { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.expense-pp-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-radius: 10px; background: var(--glass-2-bg); font-size: 13px; color: rgba(255,255,255,0.7); }
.expense-pp-amount { font-weight: 700; color: #8BA88C; font-size: 15px; }
.expense-add-btn { width: 100%; padding: 10px; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.25); background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 14px; transition: all 0.35s var(--easing); margin-top: 8px; }
.expense-add-btn:hover { border-color: rgba(139,168,140,0.35); color: rgba(255,255,255,0.7); }
.expense-remove-btn { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 16px; padding: 4px 8px; transition: color 0.3s; }
.expense-remove-btn:hover { color: #FF6B6B; }

/* ================================================================
   Advanced animation system
   ================================================================ */
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --transition-fast: 0.2s;
  --transition-normal: 0.35s;
  --transition-slow: 0.6s;
  --transition-very-slow: 1s;
}

button, a, input, select, .card, .section-block, .glass-panel, .mood-option {
  transition: all var(--transition-normal) var(--ease-out-expo);
  will-change: transform;
}

.card-hover-elevate:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
}
.card-hover-elevate:active {
  transform: translateY(-2px) scale(0.98);
  transition: all 0.1s var(--ease-out-expo);
}

.btn-press:active {
  transform: scale(0.96);
  transition: transform 0.1s var(--ease-out-expo);
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(24px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
.animate-slide-up { animation: slideUpFade 0.6s var(--ease-out-expo) both; }

@keyframes scaleInBounce {
  0% { opacity: 0; transform: scale(0.8); }
  60% { opacity: 1; transform: scale(1.04); }
  80% { transform: scale(0.98); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-scale-in { animation: scaleInBounce 0.5s var(--ease-spring) both; }

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-slide-left { animation: slideInLeft 0.5s var(--ease-out-expo) both; }

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-slide-right { animation: slideInRight 0.5s var(--ease-out-expo) both; }

@keyframes rotateIn {
  from { opacity: 0; transform: rotate(-8deg) scale(0.9); }
  to { opacity: 1; transform: rotate(0) scale(1); }
}
.animate-rotate-in { animation: rotateIn 0.5s var(--ease-out-expo) both; }

@keyframes shimmerSweep {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.shimmer-effect {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmerSweep 2s ease-in-out infinite;
}

@keyframes borderGlowPulse {
  0%, 100% { border-color: rgba(255,255,255,0.1); box-shadow: 0 0 0 rgba(255,255,255,0); }
  50% { border-color: rgba(255,255,255,0.25); box-shadow: 0 0 20px rgba(255,255,255,0.04); }
}
.border-glow-pulse { animation: borderGlowPulse 3s ease-in-out infinite; }

@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.gentle-float { animation: gentleFloat 4s var(--ease-in-out-smooth) infinite; }

@keyframes microBreath {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.03); opacity: 1; }
}
.micro-breath { animation: microBreath 3s ease-in-out infinite; }

@keyframes textReveal {
  from { opacity: 0; transform: translateY(8px); letter-spacing: 4px; }
  to { opacity: 1; transform: translateY(0); letter-spacing: normal; }
}
.text-reveal { animation: textReveal 0.8s var(--ease-out-expo) both; }

@keyframes iconBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  20% { transform: translateY(-12px) scale(1.1); }
  40% { transform: translateY(0) scale(0.95); }
  60% { transform: translateY(-6px) scale(1.05); }
  80% { transform: translateY(0) scale(0.98); }
}
.icon-bounce { animation: iconBounce 0.8s var(--ease-spring) both; }

@keyframes rippleExpand { to { transform: scale(20); opacity: 0; } }
.ripple-expand { animation: rippleExpand 0.8s var(--ease-out-expo) forwards; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
}
.dot-bounce:nth-child(1) { animation: dotBounce 1.2s ease-in-out infinite; }
.dot-bounce:nth-child(2) { animation: dotBounce 1.2s ease-in-out 0.2s infinite; }
.dot-bounce:nth-child(3) { animation: dotBounce 1.2s ease-in-out 0.4s infinite; }

@keyframes skeletonPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
.skeleton-pulse { animation: skeletonPulse 1.5s ease-in-out infinite; }

.mood-transition-bg { transition: background 1.5s var(--ease-in-out-smooth); }

.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.3s; }
.stagger-7 { animation-delay: 0.35s; }
.stagger-8 { animation-delay: 0.4s; }

.selected-check { position: relative; }
.selected-check::after {
  content: '\u2713';
  position: absolute;
  top: -6px; right: -6px;
  width: 22px; height: 22px;
  background: var(--mood-primary, #8BA88C);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff; font-weight: 700;
  animation: scaleInBounce 0.4s var(--ease-spring) both;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Cloud/particle/balloon smooth transitions */
.cloud { transition: opacity 1.5s var(--easing); }
.particle { transition: opacity 1.5s var(--easing); }
.balloon { transition: animation-duration 1.5s var(--easing); }
.brand-name, .brand-slogan { transition: font-weight 1.5s var(--easing), letter-spacing 1.5s var(--easing); }</style></head><body>';
  html += '<h1>' + title + '</h1>';
  html += '<p>??????' + activeMood + ' | ??????' + (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label + ' | ?????????' + budget + ' | ??????' + days + ''/p>';

  itinerary.forEach(function(day) {
    html += '<h2>Day ' + day.day + '</h2>';
    day.items.forEach(function(item, idx) {
      if (idx > 0 && item.transitTime) {
        html += '<div class="transit">???? " + item.transitTime + 'åéè½¦ç¨</div>';
      }
      var icon = item.type === 'rest' ? '' : item.type === 'restaurant' ? 'ð½' : 'ð';
      html += '<div class="item"><strong>' + icon + ' ' + item.name + '</strong> <span class="time">' + item.time + '</span><br>';
      html += 'è´¹ç¨ï¿½?span class="cost">Â¥' + (item.estimatedCost || 0) + '</span>';
      if (item.estimatedDuration) html += ' Â· é¢è®¡' + item.estimatedDuration + 'åé';
      if (item.reason) html += '<br>ð¡ ' + item.reason;
      if (item.rain_plan) html += '<div class="rain">???????????????????????' + item.rain_plan.name + '???' + (item.rain_plan.estimatedCost || 0) + ''/div>';
      html += '</div>';
    });
  });

  if (hotel) {
    html += '<div class="hotel"><h2>ð¨ æ¨èéåº</h2>';
    html += '<strong>' + hotel.name + '</strong> ' + hotel.rating + 'ï¿½?br>';
    html += 'æä¼ä»·æ ¼ï¼' + hotel.bestPlatform + ' Â¥' + hotel.bestPrice + '' + hotel.bestReason + 'ï¿½?br>';
    html += 'ð¡ ' + hotel.reason + '</div>';
  }

  if (stats) {
    html += '<p style="margin-top:30px;padding:16px;background:#f5f5f5;border-radius:8px;">';
    html += 'æ»é¢ç®ï¼Â¥' + stats.totalCost + ' | ç²¾éæ¯ç¹ï¼' + stats.totalPois + ' | æ¯ä»·èçï¼' + (stats.totalSaved || 0);
    html += '</p>';
  }

  html += '</body></html>';
  exportContentText = html;
  document.getElementById('exportModalTitle').textContent = 'ð¨ï¿½?HTML è¡ç¨åé¢';
  document.getElementById('exportModalContent').textContent = html;
  document.getElementById('exportModalOverlay').classList.add('show');
}

function closeExportModal() {
  document.getElementById('exportModalOverlay').classList.remove('show');
}

function copyExportContent() {
  if (!exportContentText) return;
  // ä½¿ç¨ Clipboard API ï¿½?fallback
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(exportContentText).then(function() {
      showToast('å·²å¤å¶å°åªè´´æ¿ï¼');
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
    showToast('å·²å¤å¶å°åªè´´æ¿ï¼');
  } catch (e) {
    showToast('å¤å¶å¤±è´¥ï¼è¯·æå¨å¤å¶');
  }
  document.body.removeChild(textarea);
}

// ================================================================
//  å¨ç»´åº¦æç»ªæç¥ç³»ï¿½?ï¿½?å¤ç»´ä¿¡å·éé + ç½®ä¿¡åº¦è¯'+ ????????????
// ================================================================

// ä¿¡å·æééç½®ï¼åç»´åº¦å¯¹æ¯ç§æç»ªçè´¡ç®æé'
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

// å¤æ­æ¯å¦å¨éé»æï¼ä¼è¯çº§ + localStorage æä¹çº§ï¼
function inSilentPeriod() {
  // æ¬æ¬¡ä¼è¯éé»ï¼ç¨æ·å³é­è¿æ°æ³¡ï¼ä¸åæ'
  if (emotionState.sessionSilent) return true;
  // localStorage æä¹éé»ï¼è¿ç»­æï¿½?2 æ¬¡å 24 å°æ¶
  if (!memoryStore.silentUntil) return false;
  return Date.now() < memoryStore.silentUntil;
}

// å è½½localStorageè®°å¿
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

// ä¿å­localStorageè®°å¿
function saveMemory() {
  try {
    localStorage.setItem('moodtravel_emotion_memory', JSON.stringify(memoryStore));
  } catch (e) { /* ignore */ }
}

// ç¨æ·æç»è¯æ¢ ï¿½?è®°å½å¹¶æ£æ¥æ¯å¦è¿å¥éé»æ
function recordRejection() {
  memoryStore.rejectCount++;
  memoryStore.lastRejectTime = Date.now();
  memoryStore.totalProbes++;
  if (memoryStore.rejectCount > 2) {
    memoryStore.silentUntil = Date.now() + SILENT_PERIOD_HOURS * 3600 * 1000;
    console.log('Emotion: è¿å¥éé»æï¼24å°æ¶åä¸åä¸»å¨è¯');
  }
  saveMemory();
}

// ç¨æ·æ¥åè¯æ¢
function recordAcceptance() {
  memoryStore.acceptCount++;
  memoryStore.totalProbes++;
  // æ¥ååéç½®æç»è®¡'
  if (memoryStore.rejectCount > 0) {
    memoryStore.rejectCount = Math.max(0, memoryStore.rejectCount - 1);
  }
  saveMemory();
}

// ================================================================
//  å¤ç»´ä¿¡å·éé'
// ================================================================

// 1. ç¯å¢ä¸ä¸ï¿½?ï¿½?æ¶é´ç»´åº¦
function getTimeContextSignals() {
  var now = new Date();
  var hour = now.getHours();
  var day = now.getDay(); // 0=å¨æ¥, 1=å¨ä¸, ..., 6=å¨å­
  var signals = [];

  if (hour >= 23 || hour < 6) signals.push('time_night');
  if (hour >= 5 && hour < 9) signals.push('time_morning');
  if (day === 1) signals.push('day_monday');
  if (day === 5) signals.push('day_friday');
  if (day === 0 || day === 6) signals.push('day_weekend');

  return signals;
}

// 2. çµæ± ç¶'
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
    }).catch(function() { /* ä¸æ¯æçµæ± API */ });
  }
}

// 3. é¼ æ ç§»å¨è¿½è¸ª
document.addEventListener('mousemove', function(e) {
  var now = Date.now();
  mouseHistory.push({ x: e.clientX, y: e.clientY, time: now });
  while (mouseHistory.length > 0 && now - mouseHistory[0].time > 5000) mouseHistory.shift();
  resetIdleTimer();
});

// 4. ç¹å»è¿½è¸ª
document.addEventListener('click', function(e) {
  var now = Date.now();
  clickHistory.push({ time: now });
  while (clickHistory.length > 0 && now - clickHistory[0].time > 3000) clickHistory.shift();
  resetIdleTimer();
  if (clickHistory.length >= 3) addSignal('behavior', 'click_fast');
});

// 5. ç©ºé²æ£'
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(function() {
    if (!autoMoodLocked) addSignal('behavior', 'idle_long');
  }, 15000);
}

// 6. æç´¢éå¤è¿½è¸ªï¼hookå°ç°æçæç´¢ç¸å³å½æ°'
function trackSearch(keyword) {
  if (!keyword) return;
  searchHistory.push({ keyword: keyword, time: Date.now() });
  // åªä¿çæï¿½?10 '
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

// 7. è¯¦æé¡µåçè¿½'
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

// 8. æ æ´è¾å¥ç¹è±«è¿½è¸ª
function trackTreeHoleFocus() {
  treeHoleFocusTime = Date.now();
  treeHoleCursorBlinkCount = 0;
  if (treeHoleHesitationTimer) clearInterval(treeHoleHesitationTimer);
  treeHoleHesitationTimer = setInterval(function() {
    var input = document.getElementById('treeHoleInput');
    if (input && document.activeElement === input) {
      treeHoleCursorBlinkCount++;
      var elapsed = Date.now() - treeHoleFocusTime;
      if (elapsed >= TREE_HOLE_HESITATE_THRESHOLD && input.value.trim() === '') {
        addSignal('input', 'treehole_hesitate');
        clearInterval(treeHoleHesitationTimer);
      }
    }
  }, 1000);
}
function trackTreeHoleBlur() {
  if (treeHoleHesitationTimer) clearInterval(treeHoleHesitationTimer);
  treeHoleFocusTime = null;
  treeHoleCursorBlinkCount = 0;
}

// ================================================================
//  å¨æç½®ä¿¡åº¦è¯åå¼æ
// ================================================================

// æ·»å ä¿¡å· ï¿½?æ´æ°æç»ªç¶'
function addSignal(category, signalKey) {
  if (autoMoodLocked || simplifiedMode || inSilentPeriod()) return;

  var now = Date.now();
  // é²æ­¢åä¸ä¿¡å·ç­æ¶é´åéå¤è§¦å
  if (emotionState.signals[signalKey] && (now - emotionState.signals[signalKey] < 10000)) return;

  emotionState.signals[signalKey] = now;
  emotionState.lastUpdate = now;

  // è®¡ç®ç»¼åç½®ä¿¡'
  recalculateConfidence();
}

// ç»¼åè®¡ç®ç½®ä¿¡'
function recalculateConfidence() {
  var now = Date.now();
  var activeSignals = [];
  var totalScore = 0;

  // æ¶éæææ´»è·ä¿¡å·ï¼10ç§å'
  Object.keys(emotionState.signals).forEach(function(key) {
    if (now - emotionState.signals[key] < 10000) {
      activeSignals.push(key);
    }
  });

  // è·åç¯å¢ä¸ä¸æä¿¡'
  var timeSignals = getTimeContextSignals();
  var allSignals = activeSignals.concat(timeSignals);

  // å¦æçµæ± ä½ï¼å å¥ä¿¡å·
  if (batteryLow) allSignals.push('battery_low');

  // å»é
  var uniqueSignals = [];
  allSignals.forEach(function(s) { if (uniqueSignals.indexOf(s) === -1) uniqueSignals.push(s); });

  // æ¯ä¸ªä¿¡å· +20 åºç¡åï¼ç»åä¿¡å·æå '
  totalScore = Math.min(uniqueSignals.length * CONFIDENCE_SIGNAL_BASE, 100);

  // äº¤åéªè¯å æï¼å¦ææ 3+ ç§ä¸åç±»å«ä¿¡å·ï¼é¢å¤å å
  var categories = {};
  uniqueSignals.forEach(function(s) {
    var cat = s.split('_')[0];
    categories[cat] = true;
  });
  var catCount = Object.keys(categories).length;
  if (catCount >= 3) totalScore = Math.min(totalScore + 15, 100);
  if (catCount >= 4) totalScore = Math.min(totalScore + 10, 100);

  emotionState.score = totalScore;

  // æ¨æ­æç»ªç±»å
  emotionState.moodType = inferMoodType(uniqueSignals);

  // æ ¹æ®åæ°æ§è¡ä¸åç­ç¥
  if (totalScore >= CONFIDENCE_PROBE_THRESHOLD) {
    triggerSoftProbe(emotionState.moodType);
  } else if (totalScore >= CONFIDENCE_SOFT_THRESHOLD) {
    applySoftAdjustment(emotionState.moodType);
  }

  // å¯å¨åæ°è¡°å
  startScoreDecay();
}

// æ¨æ­æç»ªç±»å
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

  // é¢å¤è§åï¼æ·±'+ ?????????????????? ????insomnia ??????
  if (signals.indexOf('time_night') !== -1) {
    moodScores.insomnia += 2.0;
  }

  // æ¾å°æé«å
  var bestMood = 'calm';
  var bestScore = 0;
  Object.keys(moodScores).forEach(function(m) {
    if (moodScores[m] > bestScore) { bestScore = moodScores[m]; bestMood = m; }
  });

  return bestMood;
}

// åæ°è¡°åï¼éæ¶é´èªç¶ä¸é'
function startScoreDecay() {
  if (emotionState.decayTimer) clearInterval(emotionState.decayTimer);
  emotionState.decayTimer = setInterval(function() {
    var now = Date.now();
    var elapsed = (now - emotionState.lastUpdate) / 1000;
    if (elapsed > 10) {
      // 10ç§æ²¡ææ°ä¿¡å·ï¼å¼å§è¡°'
      emotionState.score = Math.max(0, emotionState.score - CONFIDENCE_DECAY_RATE);
      if (emotionState.score < CONFIDENCE_SOFT_THRESHOLD) {
        // åæ°è¿ä½ï¼æ¢å¤é»'
        applySoftAdjustment('calm');
      }
      if (emotionState.score <= 0) {
        clearInterval(emotionState.decayTimer);
        emotionState.moodType = null;
      }
    }
  }, 2000);
}

// ================================================================
//  ç­ç¥æ§è¡'
// ================================================================

// åå°è°æ´ï¿½?0-79åï¼ï¼é»é»è°æ´æ¨èæéï¼ä¸æ¹åUI
function applySoftAdjustment(moodType) {
  // è°æ´æ¨èç®æ³æéï¼éè¿ä¿®æ¹å¨å±åéï¼è®©åç»­çææ¶èªå¨ä½¿ç¨ï¼
  if (moodType === 'tired' || moodType === 'sad' || moodType === 'insomnia') {
    window._emotionAdjust = { energy: 'low', mood: 'healing', content: 'gentle' };
    // æ¶¦ç©ç»æ å£°ï¼èæ¯å¾®å¨æèªå¨ééï¼è¥é å¼å¸æ
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

  // æ ç¼éçº§ï¼èæ¯å¾®å¨æåå­ä½æçèªå¨æååï¼è½»éçº§'
  applySeamlessDegradation(moodType);
}

// ææ§è¯æ¢ï¼80+åï¼ï¼å¼¹åºæ°æ³¡æ'
function triggerSoftProbe(moodType) {
  if (inSilentPeriod()) return;

  var mood = MOODS.find(function(m) { return m.key === moodType; });
  if (!mood) return;

  // æ¾ç¤ºææ§è¯æ¢æ°'
  showEmotionBubble(moodType, mood);
}

// ================================================================
//  å®æï¿½?ï¿½?æ¶¦ç©ç»æ å£°çè§è§é'
//  ä¸å¼ºå¶æé»æ¨¡å¼ï¼åªæ¯è®©èæ¯å¾®å¨æåæ¢ï¼è¥é å¼å¸æä¸å®å¨æ
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
//  UI æ ç¼éçº§ ï¿½?æ¶¦ç©ç»æ å£°ï¼åå°è°æ´ç¨ï¼ï¿½?soothing æ´è½»éï¼
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

    // èæ¯å¾®å¨æå'
    body.style.setProperty('--cloud-speed', '0.3');
    body.style.setProperty('--particle-count', '5');
    body.style.setProperty('--balloon-speed', '0.5');

    // äºå±éæåº¦é'
    clouds.forEach(function(c) { c.style.opacity = '0.15'; });
    // ç²å­åå°
    particles.forEach(function(p, i) { if (i > 5) p.style.opacity = '0'; });
    // ç­æ°çå'
    balloons.forEach(function(b) { b.style.animationDuration = '30s'; });

    // å­ä½æå'
    document.querySelector('.brand-name').style.fontWeight = '400';
    document.querySelector('.brand-name').style.letterSpacing = '6px';
    document.querySelector('.brand-slogan').style.fontWeight = '300';
    document.querySelector('.brand-slogan').style.letterSpacing = '4px';
  } else {
    // æ¢å¤é»è®¤
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
//  ææ§è¯æ¢æ°ï¿½?UI
// ================================================================

var PROBE_MESSAGES = {
  tired:    { title: 'çèµ·æ¥æç¹ç´¯', sub: 'æ³ééæ¾æ¾ï¼è¿æ¯æ¾ç¹ä¹å­ææç¥ï¼', optionA: 'æ³ééï¼å¸®ææ¾æ¾', optionB: 'æ¾ç¹ä¹å­ï¼ææç¥', color: '#B5A3C4' },
  sad:      { title: 'å¿æå¥½åä¸å¤ªç¾ä¸½...', sub: 'æ³ä¸ä¸ªäººééï¼è¿æ¯éè¦ä¸ç¹æ°é²æ', optionA: 'è®©æééå¾ä¼', optionB: 'å¸¦æå»ç¹æè¶£çå°', color: '#C4A8A8' },
  anxious:  { title: 'æè§ä½ æç¹ç´§', sub: 'æ³æ·±å¼å¸æ¾æ¾ï¼è¿æ¯åç¹ä»ä¹è½¬ç§»æ³¨æå', optionA: 'å¸®ææ¾æ¾ï¼ç¼ä¸', optionB: 'æ¾ç¹ä¹å­ï¼ååå¿', color: '#6B8FA3' },
  insomnia: { title: 'å¤æ·±äºï¼è¿æ²¡ç¡ï¼', sub: 'æ³å®éå°å¾ä¸ä¼å¿ï¼è¿æ¯æ¾ç¹æ¸©åçæ¶é£', optionA: 'éªæå®éåå', optionB: 'æ¥ç¹æ¸©æçå', color: '#6B7BA3' }
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

  btnSoothe.textContent = 'ð§ ' + msg.optionA;
  btnDistract.textContent = 'ï¿½?' + msg.optionB;

  // å®æéé¡¹ï¼æåçç»¿è²è°ï¼
  btnSoothe.onclick = function() { acceptProbeSoothe(moodType, mood); };
  // è½¬ç§»æ³¨æåéé¡¹ï¼æ¸©æçæ©è²è°ï¼
  btnDistract.onclick = function() { acceptProbeDistract(moodType, mood); };
  // å³é­æé®
  btnDismiss.onclick = function() { dismissProbe(); };

  bubble.classList.add('show');
  autoDetectedMood = moodType;
}

// éé¡¹ Aï¼å®ï¿½?ï¿½?ééãæåãæ¸©æéª'
function acceptProbeSoothe(moodType, mood) {
  recordAcceptance();
  document.getElementById('emotionBubble').classList.remove('show');
  if (mood) selectMood(mood);
  // è¿å¥å®ææï¼ä¸å¼ºå¶æé»æ¨¡å¼ï¼èæ¯è®©èæ¯ç¼æ¢æ'
  applySoothingState();
  showToast('å¥½çï¼æä¼æ¾æ¢èå¥ï¼éªä½ å®éä¸ä¼å¿~');
}

// éé¡¹ Bï¼è½¬ç§»æ³¨æå ï¿½?æ¨èæè¶£åå®¹ãå¨'
function acceptProbeDistract(moodType, mood) {
  recordAcceptance();
  document.getElementById('emotionBubble').classList.remove('show');
  if (mood) selectMood(mood);
  // éåºå®ææï¼æ¢å¤æ­£å¸¸
  removeSoothingState();
  showToast('å¥½åï¼å¸®ä½ æ¾ç¹æ°é²å¥½ç©ç~');
  // èªå¨è§¦åçæä¸æ¡è½»æ¾æè¶£çè·¯çº¿
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
  emotionState.sessionSilent = true; // æ¬æ¬¡ä¼è¯ä¸åå¼¹åºä»»ä½è¯æ¢
  applySeamlessDegradation('calm'); // æ¢å¤é»è®¤

  // å¦æè¿å¥ 24 å°æ¶éé»æï¼ç»ç¨æ·ä¸ä¸ªè½»ææ'
  if (inSilentPeriod() && memoryStore.silentUntil) {
    showToast('å¥½çï¼æ¥ä¸æ¥ä¸æ®µæ¶é´ä¸ä¼ææ°ä½ ~');
  }
}

// å®ææ£æµï¼ï¿½?8 ç§ï¼
moodCheckTimer = setInterval(function() {
  if (!autoMoodLocked && !simplifiedMode && !inSilentPeriod()) {
    recalculateConfidence();
  }
}, 8000);

// ================================================================
//  æ æ´ç³»ç»
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

// å³é®è¯æææ '
var MOOD_KEYWORDS = {
  tired: ['', 'ç²æ«', '', 'æ²¡å', 'èººå¹³', 'ä¸æ³', 'å¥½ç´¯', 'å¥½å°', 'ç¡ç ä¸è¶³', 'ä¼æ¯', 'æ³ç¡'],
  anxious: ['ç¦è', '', 'ç´§å¼ ', 'åå', 'ä¸å®', 'ç¦èº', 'å¥½ç¦', 'å¿æ', 'ç', 'æå¿', ''],
  sad: ['é¾è¿', '', 'ä½è½', 'å­¤ç¬', 'ä¼¤å¿', 'å¤±æ', 'å§å±', 'åæ', 'åµæ¶', 'å´©æº', 'æ³å­', 'é¾å', 'ä¸å¼'],
  calm: ['å®é', 'å¹³é', 'æ¾æ¾', 'èæ', 'å®é', 'æ é²', 'èªå¨'],
  excited: ['å´å¥', 'æå¾', 'å¼', 'æ¿', 'å¤ªå¥½', '', 'å²å²'],
  happy: ['é«å´', 'å¿«ä¹', 'å¹¸ç¦', 'æ»¡è¶³', 'ç¾å¥½', 'é³å', 'åæ¬¢']
};

function sendToTreeHole() {
  var input = document.getElementById('treeHoleInput');
  var text = input.value.trim();
  if (!text) { showToast('éä¾¿è¯´ç¹ä»ä¹å§ï¼æå¨è¿éå¬ç~'); return; }

  trackTreeHoleBlur(); // åæ­¢ç¹è±«è¿½è¸ª

  // å³é®è¯å¹'
  var matchedMood = null;
  var maxHits = 0;
  Object.keys(MOOD_KEYWORDS).forEach(function(moodKey) {
    var hits = 0;
    MOOD_KEYWORDS[moodKey].forEach(function(kw) {
      if (text.indexOf(kw) !== -1) hits++;
    });
    if (hits > maxHits) { maxHits = hits; matchedMood = moodKey; }
  });

  // å³é­æ æ´å¼¹çª
  document.getElementById('treeHolePopup').classList.remove('show');
  document.getElementById('treeHoleBtn').classList.remove('pulse');
  input.value = '';

  autoMoodLocked = true; // ç¨æ·ä¸»å¨è¡¨è¾¾ï¼éå®èªå¨æ£'

  if (matchedMood && maxHits > 0) {
    var mood = MOODS.find(function(m) { return m.key === matchedMood; });
    if (mood) {
      selectMood(mood);
      showToast('ææåå°äºä½ ç' + mood.label + 'ãï¼è®©ææ¥å¸®ä½ ~');
      // å¦ææ¯è´é¢æç»ªï¼è¿å¥ç®åæ¨¡'
      if (matchedMood === 'anxious' || matchedMood === 'tired' || matchedMood === 'sad') {
        enterSimplifiedMode(matchedMood);
      }
      return;
    }
  }

  // æ²¡æå¹éå°å³é®è¯ï¼ç»ä¸ä¸ªæ¸©æçé»è®¤ååº
  showToast('è°¢è°¢ä½ æ¿æè¯´åºæ¥ãä¸ç®¡ææ ·ï¼æé½å¨è¿ééªçä½ ');
  // é»è®¤æä½è½å¤'
  var sadMood = MOODS.find(function(m) { return m.key === 'sad'; });
  if (sadMood) selectMood(sadMood);
  enterSimplifiedMode('sad');
}

// ç¹å»é¡µé¢å¶ä»å°æ¹å³é­æ æ´
document.addEventListener('click', function(e) {
  var popup = document.getElementById('treeHolePopup');
  var btn = document.getElementById('treeHoleBtn');
  if (popup.classList.contains('show') && !popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
    popup.classList.remove('show');
    btn.classList.remove('pulse');
  }
});

// Enter åéæ æ´æ¶'
document.getElementById('treeHoleInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendToTreeHole();
  }
});

// æ æ´è¾å¥æ¡å¤±å»ç¦ï¿½?ï¿½?åæ­¢ç¹è±«è¿½è¸ª
document.getElementById('treeHoleInput').addEventListener('blur', function() {
  trackTreeHoleBlur();
});

// ================================================================
//  è´é¢æç»ªç®åæ¨¡'
// ================================================================
var HEALING_GREETINGS = {
  anxious: 'çèµ·æ¥ä»å¤©æç¹ç¦èï¼<br/>åæ·±å¼å¸ï¼æèå¥æ¾æ¢ä¸ç¹',
  tired: 'çèµ·æ¥ä»å¤©æç¹ç´¯ï¿½?br/>åå¬é¦è½»é³ä¹å§',
  sad: 'å¿æä¸å¤ªå¥½åï¿½?br/>æ²¡å³ç³»ï¼æéªä½ åä¸ä¼å¿',
  insomnia: 'å¤æ·±äºï¼è¿æ²¡ç¡åï¿½?br/>æå±å¹è°æï¼è®©æéªä½ å®éä¸ä¼å¿'
};

function enterSimplifiedMode(moodKey) {
  if (simplifiedMode) return;
  simplifiedMode = true;

  // åæ¢å¿æ
  var mood = MOODS.find(function(m) { return m.key === moodKey; });
  if (mood) selectMood(mood);

  // æ¾ç¤ºæ²»æè¦ç'
  var overlay = document.getElementById('simplifiedOverlay');
  var greeting = document.getElementById('healingGreeting');
  var genBtn = document.getElementById('healingGenBtn');
  greeting.innerHTML = HEALING_GREETINGS[moodKey] || HEALING_GREETINGS.tired;
  var theme = MOOD_THEME_MAP[moodKey] || MOOD_THEME_MAP.tired;
  genBtn.style.background = 'linear-gradient(135deg, ' + theme.secondary + ', ' + theme.primary + ')';
  overlay.classList.add('show');

  // éèææç­éå¨
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
  // éèå¿æéæ©å¨æ '
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
  showToast('å¥½çï¼æ¢æ¢æ¥ï¼ä¸çæ¥~');
}

function quickHealingPlan() {
  document.getElementById('simplifiedOverlay').classList.remove('show');
  simplifiedMode = false;
  showFilters();
  // èªå¨è®¾ç½®ä½é¢ç®ãä½è½éãæ²»æåè¡ç¨
  budget = 500;
  displayBudget = 500;
  budgetSlider.value = 500;
  budgetNumber.textContent = '500';
  budgetCustom.value = '';
  updateBudgetFill();
  updatePresetStyles();
  showToast('æ­£å¨ä¸ºä½ çææ²»æè·¯çº¿...');
  // è§¦åçæ
  setTimeout(function() { generatePlan(); }, 500);
}

// ================================================================
//  æ·±å¤é»è®¤æ£'
// ================================================================
function checkNightMode() {
  var hour = new Date().getHours();
  if (hour >= 23 || hour < 6) {
    // æ·±å¤æ¨¡å¼ï¼é»ï¿½?insomnia å¿æ
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
      showToast('ð æ·±å¤äºï¼å·²ä¸ºä½ å¼å¯æ¤ç¼æå¤æ¨¡');
    }
  }
}

// ================================================================
//  AI æè¡éç¬ ï¿½?æå­æºæ'+ LLM ??????
// ================================================================
var aiNarrativeText = '';
var narrativeTimer = null;
var narrativeConfig = { enabled: true, useLLM: true };

// ================================================================
//  AI æè¡éç¬ ï¿½?å¢å¼ºçï¼çå® LLM + æå­æºææï¼
// ================================================================
async function generateNarrative() {
  if (!itinerary || itinerary.length === 0) return;
  var section = document.getElementById('aiNarrativeSection');
  var body = document.getElementById('aiNarrativeBody');
  var meta = document.getElementById('aiNarrativeMeta');
  section.classList.add('show');
  
  // æå»ºè¡ç¨æè¦
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
  
  var moodLabel = MOODS.find(function(m){return m.key===activeMood;}) || {label:'å¹³é'};
  var companionLabel = (COMPANION_TYPES.find(function(c){return c.key===companionType;})||{}).label || 'ç¬èª';
  
  // å°è¯çå® LLM
  if (narrativeConfig.useLLM && API_CONFIG.llm.apiKey) {
    body.innerHTML = '<span style="color:rgba(139,168,140,0.6)">AI æ­£å¨ä¸ºä½ æ°åä¸å±æè¡éç¬...</span><span class="cursor-blink"></span>';
    var prompt = 'è¯·ä¸ºä»¥ä¸æè¡åä¸ç¯çº¦300å­çæèºæè¡éç¬ï¼é£æ ¼è¦æ¸©æãç»è»ãæç»é¢æã\n\n' +
      'å¿æ' + moodLabel.label + '\næä¼´' + companionLabel + '\n' +
      'ç®çå°ï¼' + (cities.length > 0 ? cities.join('') : 'æµæ±') + '\n' +
      'æ¯ç¹' + poiNames.slice(0, 5).join('') + '\n' +
      'å¤©æ°' + itinerary.length + 'å¤©\n\n' +
      'è¯·ç¨ç¬¬ä¸äººç§°æç¬¬äºäººç§°ï¼è®©è¯»èæä»£å¥æãä¸è¦ä½¿ç¨markdownæ ¼å¼ï¼çº¯ææ¬å³å¯';
    
    var essay = await callLLM(prompt, 'ä½ æ¯ä¸ä½æ¸©æç»è»çæè¡ä½å®¶ï¼æé¿ç¨è¯æçæå­æç»æéä¸­çæåãè¯·ç¨å£è¯­åä½ä¼ç¾çä¸­æåä½');
    if (essay) {
      typewriterEffect(body, essay, 30);
      meta.textContent = 'AI çæ Â· ' + new Date().toLocaleDateString('zh-CN');
      return;
    }
  }
  
  // Fallback: æ¨¡æ¿çæ
  var templates = getNarrativeTemplates();
  var essay = templates[activeMood] || templates.calm;
  essay = essay.replace('{cities}', cities.length > 0 ? cities.join('') : 'æµæ±');
  essay = essay.replace('{poi}', poiNames[0] || 'è¿çåå°');
  essay = essay.replace('{companion}', companionLabel);
  typewriterEffect(body, essay, 25);
  meta.textContent = 'æ¬å°çæ Â· ' + new Date().toLocaleDateString('zh-CN');
}

function getNarrativeTemplates() {
  return {
    calm: 'æ¸æ¨çé³åéè¿çªå¸ï¼æ¸©æå°æ´å¨{cities}çåå°ä¸ã{companion}çèæ­¥ä¸æ¥ä¸ç¼ï¼åæ¯èå¥äºè¿åº§åå¸çå¼å¸èå¥ã\n\nå¨{poi}ï¼æ¶é´ä»¿ä½åæ¢äºãé£å¹è¿æ å¶çå£°é³ï¼è¿å¤å¶å°ä¼ æ¥çé¸é¸£ï¼é½æäºæéä¸­æç¾çèæ¯é³ãä¸éè¦æå¡ï¼ä¸éè¦èµ¶è·¯ââæ­¤å»çå¹³éï¼å°±æ¯æå¥½çæè¡ã\n\nææ¶åï¼æä»¬éè¦çä¸æ¯è¿æ¹ï¼èæ¯è®©å¿å®éä¸æ¥ççå»',
    happy: '{cities}çæ¯ä¸å¤©é½åå äºæ»¤éä¸æ ·ç¾å¥½ï¼{companion}çç¬å®¹å¨é³åä¸ç¹å«ç¿çã\n\nä»{poi}å°è¡è§çå°åæï¼æ¯ä¸å¤é½èçæåãç©ºæ°éé£çç¾é£çé¦æ°ï¼è³è¾¹æ¯æ¬¢å¿«çç¬å£°ââè¿ææ¯æè¡çæä¹åï¼\n\næè¿ä»½å¿«ä¹è£è¿å£è¢ï¼å¸¦åå®¶ï¼æ¢æ¢åå³',
    sad: 'ææ¶åï¼æä»¬éè¦ä¸åºè¯´èµ°å°±èµ°çæè¡ï¼ä¸æ¯éé¿ï¼èæ¯ç»èªå·±ä¸ä¸ªæ¸©æçæ¥æ±ã{cities}ç¨å®ç¹æçæ¹å¼æ²»æçæ¯ä¸ä¸ªç²æ«ççµé­ã\n\nå¨{poi}ï¼{companion}ééå°åçï¼çäºå·äºèãé£äºè¯´ä¸åºå£çæç»ªï¼ä¼¼ä¹é½è¢«è¿çåå°æ¸©æå°æ¥ä½äºã\n\nä»å¤©åè®¸èªå·±æ¢ä¸æ¥ï¼åè®¸èªå·±æåââå ä¸ºæ²»æï¼ä»æ¥çº³å¼å§',
    anxious: 'æ·±å¼å¸ï¼{cities}çç©ºæ°éæä¸ç§è®©äººå®å¿çå³éã{companion}çæç¨ï¼ä¸éè¦å®ç¾ï¼åªéè¦çå®ã\n\nå¨{poi}ï¼ç¦èåæ½®æ°´ä¸æ ·æ¢æ¢éå»ãåæ¥ï¼æ¢ä¸ªç¯å¢ï¼æ¢ä¸ªèå¥ï¼å¿éçé£æ ¹å¼¦å°±ä¼æ¾ä¸æ¥ã\n\nä½ å·²ç»åå¾å¾å¥½äºãè¿åºæè¡ï¼å°±æ¯ç»èªå·±æå¥½çç¤¼ç©',
    excited: 'åºåï¼{cities}ï¼æä»¬æ¥å¦ï¼{companion}çæ¢é©ä¹æåæ»¡äºæªç¥çæåã\n\n{poi}åªæ¯å¼å§ï¼æ¯ä¸ä¸ªè½¬è§é½å¯è½èçææ³ä¸å°çé£æ¯ãå¿è·³å éï¼ç³å­æ¾å¤§ââè¿å°±æ¯æ¢ç´¢çå¿«ä¹ï¼\n\nææ¯ä¸å¤©é½å½ä½åé©ï¼ææ¯ä¸å»é½åæåå¿ãè¿è¶æç¨ï¼æ³¨å®ç²¾å½©',
    tired: 'ç´¯äºå°±åä¸æ¥ï¼{cities}çæ¸©ææ­£å¥½ã{companion}ä¸éè¦èµ¶è¡ç¨ï¼ä¸éè¦æå¡ââæµæå°äº«åæ¯ä¸ä¸ªå½ä¸ã\n\nå¨{poi}ï¼æ³¡ä¸æ¯è¶ï¼çä¸æ¬ä¹¦ï¼æèä»ä¹é½ä¸åãè®©ç²æ«éçæ¶é´æ¢æ¢èåï¼è®©èº«ä½éæ°æ¾åèå¥ã\n\næè¡çæä¹ï¼ææ¶åå°±æ¯åè®¸èªå·±ä»ä¹é½ä¸å',
    insomnia: 'æ·±å¤ç{cities}æä¸ç§ç¹å«çå®éã{companion}å¨æç©ºä¸ï¼æç»ªåæ½®æ°´ä¸æ ·æ¶æ¥åéå»ã\n\nç¡ä¸çä¹æ²¡å³ç³»ã{poi}çå¤æï¼æå®èªå·±çèå¥ââä¸ç´§ä¸æ¢ï¼ä¸æä¸å¿ãé­ä¸ç¼çï¼å¬é£çå£°é³ï¼æåå¤çæ¸©æã\n\næå¤©ä¼æ¯æ°çä¸å¤©ãæ­¤å»ï¼åªéè¦å¼å¸'
  };
}

// æå­æºæ'
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
  showToast('æ­£å¨éæ°çææè¡éç¬...');
}

// ================================================================
//  localStorage è¡ç¨æä¹'
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
    // å»éï¼åä¸å¤©åç¸ååæ°çè¡ç¨åªä¿çææ°ï¼
    trips = trips.filter(function(t) {
      return !(t.mood === trip.mood && t.companionType === trip.companionType && t.days === trip.days);
    });
    trips.unshift(trip);
    if (trips.length > MAX_STORED_TRIPS) trips = trips.slice(0, MAX_STORED_TRIPS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    showToast('è¡ç¨å·²ä¿å­å°ãæçè¡ç¨');
  } catch (e) {
    // localStorage å¯è½å·²æ»¡ï¼éé»å¤'
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
    list.innerHTML = '<div class="trip-history-empty"><span class="trip-history-empty-icon">ð­</span>è¿æ²¡æä¿å­çè¡ç¨<br>çæè¡ç¨åä¼èªå¨ä¿å­</div>';
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
      poiSummary = names.slice(0, 4).join(' ï¿½?');
      if (names.length > 4) poiSummary += '...';
    }
    var modeIcon = trip.travelMode === 'business' ? 'ð¼' : 'ð';
    return '<div class="trip-history-card" onclick="loadTripFromHistory(' + trip.id + ')">' +
      '<div class="trip-history-card-header">' +
      '<span class="trip-history-mood" style="background:' + (trip.moodColor || '#8BA88C') + '22;color:' + (trip.moodColor || '#8BA88C') + '">' + (trip.moodLabel || '') + ' Â· ' + (trip.companionLabel || '') + '</span>' +
      '<span class="trip-history-date">' + dateStr + '</span>' +
      '</div>' +
      '<div class="trip-history-summary">' + modeIcon + ' ' + trip.days + 'ï¿½?Â· Â¥' + (trip.budget || 0).toLocaleString() + ' Â· ' + (trip.cityCount || 0) + '' +
      (poiSummary ? '<br><span style="font-size:12px;color:rgba(255,255,255,0.55)">' + poiSummary + '</span>' : '') +
      '</div></div>';
  }).join('');

  // æ»å¨å°åå²è®°å½åº'
  section.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function loadTripFromHistory(id) {
  var trips = loadTripsFromStorage();
  var trip = trips.find(function(t) { return t.id === id; });
  if (!trip) return;

  // æ¢å¤è¡ç¨ç¶'
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

  // æ´æ° UI
  updateMoodActiveStyle();
  updateCompanionStyles();
  updateSceneToggle();
  updateBudgetFill();
  updatePresetStyles();
  budgetNumber.textContent = budget.toLocaleString();
  budgetSlider.value = budget;
  updateGenerateBtn();

  // æ¸²æ
  renderItinerary();
  renderMap();
  renderHotel();
  renderFood();
  renderShopping();
  renderChecklist();
  renderStats();
  renderCareLetter();
  renderShareCard();

  // æ¾ç¤º AI éç¬
  if (trip.narrative) {
    var body = document.getElementById('aiNarrativeBody');
    var section = document.getElementById('aiNarrativeSection');
    var meta = document.getElementById('aiNarrativeMeta');
    if (body) body.textContent = trip.narrative;
    if (section) section.classList.add('show');
    if (meta) meta.textContent = 'å·²ä¿ï¿½?Â· ' + new Date(trip.createdAt).toLocaleDateString('zh-CN', {year:'numeric', month:'long', day:'numeric'});
  }

  showToast('å·²å è½½è¡ç¨' + (trip.moodLabel || '') + ' Â· ' + trip.days + 'å¤©');
  document.getElementById('itinerarySection').scrollIntoView({ behavior: 'smooth' });
}

// ================================================================
//  å¤©æ° API éæï¼åé£å¤©æ°åè´¹ç'
// ================================================================
var weatherConfig = {
  apiKey: '',  // å¡«å¥ä½ çåé£å¤©æ° API Key
  cityId: '101210101'  // é»è®¤æ­å·
};

var currentWeather = null;

function fetchWeather() {
  if (!weatherConfig.apiKey) {
    // ï¿½?API Key æ¶ä½¿ç¨æ¨¡ææ°'
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
          isRainy: data.daily[0].textDay.indexOf('') !== -1,
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
    { textDay: '', tempMax: 28, tempMin: 18, isRainy: false, icon: 'â' },
    { textDay: 'å¤äº', tempMax: 25, tempMin: 16, isRainy: false, icon: '' },
    { textDay: 'å°é¨', tempMax: 22, tempMin: 15, isRainy: true, icon: 'ð§' },
    { textDay: '', tempMax: 24, tempMin: 17, isRainy: false, icon: 'âï¸' }
  ];
  currentWeather = weathers[Math.floor(Math.random() * weathers.length)];
  showWeatherIndicator();
}

function getWeatherIcon(text) {
  if (text.indexOf('') !== -1) return 'ð§';
  if (text.indexOf('') !== -1) return 'âï¸';
  if (text.indexOf('') !== -1) return '\u2713';
  if (text.indexOf('') !== -1) return 'âï¸';
  return 'â';
}

// ================================================================
//  å¤©æ°æç¤ºï¿½?ï¿½?å¢å¼ºçï¼çå® API + æ¨¡æ fallback'
// ================================================================
var weatherData = null;

async function showWeatherIndicator() {
  if (!itinerary || itinerary.length === 0) return;
  
  // è·åè¡ç¨æ¶åçå'
  var cities = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.city && cities.indexOf(item.city) === -1) cities.push(item.city);
    });
  });
  var mainCity = cities[0] || 'æ­å·';
  
  // å°è¯çå®å¤©æ° API
  var realWeather = await fetchRealWeather(mainCity);
  
  if (realWeather) {
    weatherData = realWeather;
  } else {
    // æ¨¡æå¤©æ°æ°æ®
    var conditions = ['', 'å¤äº', '', 'å°é¨', ''];
    var temps = [22, 25, 28, 30, 18, 20, 24, 26];
    weatherData = {
      temp: temps[Math.floor(Math.random() * temps.length)],
      text: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: 45 + Math.floor(Math.random() * 40),
      isRainy: Math.random() < 0.3
    };
  }
  
  // æ¸²æå¤©æ°æç¤º'
  var daysEl = document.getElementById('itineraryDays');
  if (!daysEl) return;
  
  var weatherEl = document.getElementById('weatherIndicator');
  if (!weatherEl) {
    weatherEl = document.createElement('div');
    weatherEl.id = 'weatherIndicator';
    daysEl.parentNode.insertBefore(weatherEl, daysEl);
  }
  
  var isRainy = weatherData.isRainy;
  var weatherIcon = isRainy ? 'ð§' : weatherData.text.indexOf('') !== -1 ? '' : 'â';
  var weatherClass = isRainy ? 'rainy' : '';
  
  weatherEl.className = 'weather-indicator ' + weatherClass;
  weatherEl.innerHTML = '<span class="weather-icon">' + weatherIcon + '</span>' +
    '<span>' + mainCity + ' ' + weatherData.text + ' ' + weatherData.temp + 'Â°C</span>' +
    '<span class="weather-detail">æ¹¿åº¦ ' + weatherData.humidity + '%</span>' +
    (realWeather ? '<span style="font-size:10px;opacity:0.5;margin-left:4px">å®æ¶</span>' : '');
  
  // é¨å¤©èªå¨å±å¼æï¿½?Plan B
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
  link.download = 'MoodTravel_è¡ç¨_' + new Date().toISOString().slice(0, 10) + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('åäº«å¡å·²ä¸è½½');
}

function copyShareLink() {
  var text = 'ï¿½?æå¨ MoodTravel çæäºä¸' + days + 'å¤©æµæ±æè¡è·¯çº¿ï¼\n';
  text += 'å¿æ' + ((MOODS.find(function(m) { return m.key === activeMood; }) || {}).label || '') + '\n';
  text += 'æä¼´' + ((COMPANION_TYPES.find(function(c) { return c.key === companionType; }) || {}).label || '') + '\n';
  if (itinerary) {
    itinerary.forEach(function(day) {
      text += 'Day ' + day.day + ': ';
      var names = [];
      day.items.forEach(function(item) { if (item.type !== 'rest') names.push(item.name); });
      text += names.join(' ï¿½?') + '\n';
    });
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('è¡ç¨å·²å¤å¶ï¼å¯ä»¥åäº«ç»æåå¦');
    });
  } else {
    fallbackCopy(text);
  }
}

// ================================================================
//  PWA Service Worker æ³¨å
// ================================================================
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
}

// ================================================================
//  éª¨æ¶å±æ§'
// ================================================================
function showSkeleton(msg) {
  var overlay = document.getElementById('skeletonOverlay');
  var text = document.getElementById('skeletonText');
  if (text) text.textContent = msg || 'AI æ­£å¨ä¸ºä½ è§åè¡ç¨...';
  if (overlay) overlay.classList.add('show');
}

function hideSkeleton() {
  var overlay = document.getElementById('skeletonOverlay');
  if (overlay) overlay.classList.remove('show');
}

// ================================================================
//  ç®æ³å¯è§åè¿åº¦é¢æ¿æ§'
// ================================================================
function showAlgoProgress() {
  var panel = document.getElementById('algoProgressPanel');
  if (panel) panel.classList.add('show');
  // éç½®æææ­¥'
  for (var i = 1; i <= 4; i++) {
    var step = document.getElementById('algoStep' + i);
    if (step) { step.classList.remove('active', 'done'); }
    var status = step ? step.querySelector('.algo-step-status') : null;
    if (status) status.textContent = 'ç­å¾';
  }
  // éç½®ç»è®¡
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
    if (status) status.textContent = 'è¿è¡';
  } else if (state === 'done') {
    if (status) status.textContent = 'ï¿½?å®æ';
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
  setStat('algoStatScore', result.itinerary ? result.itinerary.length + '' : '--', false);
  setStat('algoStatHotel', result.hotel ? '5å¹³å°' : '', !!result.hotel);
}

// ================================================================
//  æ·±è²/æµè²æ¨¡å¼åæ¢
// ================================================================
var isLightMode = false;

function toggleTheme() {
  isLightMode = !isLightMode;
  var btn = document.getElementById('themeToggleBtn');
  if (isLightMode) {
    document.body.classList.add('light-mode');
    if (btn) btn.textContent = 'â';
    showToast('å·²åæ¢è³æµè²æ¨¡å¼');
  } else {
    document.body.classList.remove('light-mode');
    if (btn) btn.textContent = 'ð';
    showToast('å·²åæ¢è³æ·±è²æ¨¡å¼');
  }
  try { localStorage.setItem('moodtravel_theme', isLightMode ? 'light' : 'dark'); } catch(e) {}
}

// å¯å¨æ¶æ¢å¤ä¸»'
(function() {
  try {
    var saved = localStorage.getItem('moodtravel_theme');
    if (saved === 'light') { isLightMode = false; toggleTheme(); }
  } catch(e) {}
})();

// ================================================================
//  é®çå¿«æ·é®ç³»'
// ================================================================
var keyboardShortcuts = {
  'ctrl+k': function() { document.getElementById('searchInput').focus(); },
  'ctrl+g': function() { generatePlan(); },
  'ctrl+1': function() { quickMood('calm','ð'); },
  'ctrl+2': function() { quickMood('happy','ð'); },
  'ctrl+3': function() { quickMood('sad','ð'); },
  'ctrl+4': function() { quickMood('anxious','ð¿'); },
  'ctrl+5': function() { quickMood('excited','ð¥'); },
  'ctrl+6': function() { quickMood('tired','ð´'); },
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
    // è¾å¥æ¡åä¸è§¦åå¿«æ·é®ï¼é¤ï¿½?Escape ï¿½?Ctrl+K'
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

// æ¾ç¤ºå¿«æ·é®æ'
function showShortcutHelp() {
  var shortcuts = [
    'Ctrl+K ï¿½?èç¦æç´¢',
    'Ctrl+G ï¿½?æºè½çæè¡ç¨',
    'Ctrl+1-6 ï¿½?åæ¢å¿æ',
    'Ctrl+B ï¿½?åæ¢æ·±è²/æµè²',
    'Ctrl+E ï¿½?å¯¼åºè¡ç¨',
    'Ctrl+P ï¿½?æå°è¡ç¨',
    'Ctrl+J ï¿½?æè¡æ¥è®°',
    'Ctrl+D ï¿½?æ¹æ¡å¯¹æ¯',
    'Ctrl+T ï¿½?æè¡äººæ ¼',
    'Ctrl+H ï¿½?æ æ´å¾è¯',
    'Ctrl+R ï¿½?éæ°çæéç¬',
    'Esc ï¿½?å³é­å¼¹çª'
  ];
  showToast('â¨ï¸ å¿«æ·é®ï¼' + shortcuts.join('  |  '), 5000);
}

// å¨æ§å¶å°æç¤º
console.log('%cð¿ MoodTravel %cå¿«æ·é®å·²å°±ç»ª %cï¿½?Ctrl+K èç¦æç´¢',
  'font-size:18px;color:#8BA88C', 'color:#fff', 'color:rgba(255,255,255,0.5)');

// ================================================================
//  æºè½æç´¢
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

  // æç´¢åå¸
  ZHEJIANG_CITIES.forEach(function(city) {
    if (city.name.toLowerCase().indexOf(q) !== -1) {
      results.push({
        type: 'city', icon: 'ð', name: city.name,
        detail: city.vibe || 'æµæ±' + city.name + '',
        tag: 'åå¸', data: city
      });
    }
  });

  // æç´¢ POI
  POIS.forEach(function(poi) {
    if (poi.name.toLowerCase().indexOf(q) !== -1 ||
        (poi.tags && poi.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1; }))) {
      results.push({
        type: 'poi', icon: poi.category === 'restaurant' ? 'ð½' : poi.category === 'scenic' ? 'ð' : 'ð',
        name: poi.name, detail: 'Â¥' + (poi.ticketPrice || 0) + ' Â· ' + (poi.city || ''),
        tag: poi.category, data: poi
      });
    }
  });

  // æç´¢éåº
  HOTELS.forEach(function(hotel) {
    if (hotel.name.toLowerCase().indexOf(q) !== -1) {
      results.push({
        type: 'hotel', icon: 'ð¨', name: hotel.name,
        detail: '' + hotel.rating + ' Â· Â¥' + hotel.priceRangeLow + '',
        tag: 'éåº', data: hotel
      });
    }
  });

  // æç´¢å¿æ
  MOODS.forEach(function(mood) {
    if (mood.label.toLowerCase().indexOf(q) !== -1 || mood.key.toLowerCase().indexOf(q) !== -1) {
      results.push({
        type: 'mood', icon: mood.emoji, name: mood.label + 'æ¨¡å¼',
        detail: 'åæ¢' + mood.label + 'å¿æ',
        tag: 'å¿æ', data: mood
      });
    }
  });

  // æå¤æ¾ï¿½?8 '
  results = results.slice(0, 8);

  if (results.length === 0) {
    dropdown.innerHTML = '<div class="search-no-result">?????????" + query + 'ãç¸å³ç»'/div>';
  } else {
    dropdown.innerHTML = results.map(function(r) {
      return '<div class="search-result-item" onclick="selectSearchResult(\'' + r.type + '\', ' + JSON.stringify(r.data).replace(/"/g, '&quot;') + ')">' +
        '<span class="search-result-icon">' + r.icon + '</span>' +
        '<div class="search-result-info"><div class="search-result-name">' + r.name + '</div><div class="search-result-detail">' + r.detail + '</div></div>' +
        '<span class="search-result-tag">' + r.tag + '</span></div>';
    }).join('');
  }
  dropdown.classList.add('show');
}

function selectSearchResult(type, data) {
  var dropdown = document.getElementById('searchDropdown');
  var input = document.getElementById('searchInput');
  if (dropdown) dropdown.classList.remove('show');
  if (input) { input.value = ''; input.blur(); }

  if (type === 'city') {
    showToast('å·²å®ä½' + data.name + '');
  } else if (type === 'poi') {
    showPoiDetail(data);
  } else if (type === 'hotel') {
    showToast('ð¨ ' + data.name + ' Â· ' + data.rating + ' Â· Â¥' + data.priceRangeLow + '');
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

// ç¹å»å¤é¨å³é­æç´¢ä¸æ
document.addEventListener('click', function(e) {
  var searchSection = document.querySelector('.search-section');
  if (searchSection && !searchSection.contains(e.target)) {
    var dropdown = document.getElementById('searchDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
});

// ================================================================
//  POI è¯¦æå¼¹çª
// ================================================================
function showPoiDetail(poi) {
  var overlay = document.getElementById('poiDetailOverlay');
  if (!overlay) return;

  document.getElementById('poiDetailName').textContent = poi.name;
  document.getElementById('poiDetailCity').textContent = (poi.city || 'æµæ±') + ' Â· ' + (poi.category || 'æ¯ç¹');
  document.getElementById('poiDetailEmoji').textContent = poi.emoji || 'ð';

  // å°è¯å è½½ Unsplash å¾ç
  var imgContainer = document.getElementById('poiDetailImg');
  imgContainer.innerHTML = '<span class="poi-detail-img-emoji" id="poiDetailEmoji">' + (poi.emoji || 'ð') + '</span>';
  fetchPoiImage(poi.name, imgContainer);

  // ç»è®¡ä¿¡æ¯
  var infoHtml = '<div class="poi-detail-stat"><span class="poi-detail-stat-val" style="color:' + activeMoodColor + '">Â¥' + (poi.ticketPrice || 0) + '</span><span class="poi-detail-stat-label">é¨ç¥¨</span></div>';
  infoHtml += '<div class="poi-detail-stat"><span class="poi-detail-stat-val">' + (poi.energyLevel || '') + '/5</span><span class="poi-detail-stat-label">?????????"/span></div>';
  infoHtml += '<div class="poi-detail-stat"><span class="poi-detail-stat-val">' + (poi.crowdednessLevel || '') + '/5</span><span class="poi-detail-stat-label">??????"/span></div>';
  if (poi.estimatedDuration) {
    infoHtml += '<div class="poi-detail-stat"><span class="poi-detail-stat-val">' + poi.estimatedDuration + 'min</span><span class="poi-detail-stat-label">å»ºè®®æ¸¸ç©</span></div>';
  }
  document.getElementById('poiDetailInfo').innerHTML = infoHtml;

  // æè¿°
  var desc = poi.description || 'ä½äºæµæ±çç²¾éæ¯ç¹ï¼éå' + (activeMood || 'æ¾æ¾') + 'æ¨¡å¼ä¸æ¸¸ç©';
  document.getElementById('poiDetailDesc').textContent = desc;

  // æ ç­¾
  var tagsHtml = '';
  if (poi.tags) {
    poi.tags.forEach(function(t) {
      tagsHtml += '<span class="tag" style="background:rgba(139,168,140,0.12);color:#8BA88C">' + t + '</span>';
    });
  }
  document.getElementById('poiDetailTags').innerHTML = tagsHtml;

  // é¢è®¢æé®
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
//  Unsplash å¾çå è½½
// ================================================================
function fetchPoiImage(query, container) {
  // ä½¿ç¨ Unsplash çåï¿½?APIï¼æ é API Key ï¿½?source æ¹å¼'
  var img = document.createElement('img');
  img.className = 'poi-image';
  img.alt = query;
  img.loading = 'lazy';
  img.onload = function() {
    container.innerHTML = '';
    container.appendChild(img);
  };
  img.onerror = function() {
    // ä¿æ emoji å ä½
  };
  // Unsplash éæºå¾çï¼ä½¿ï¿½?search photos ï¿½?source URL'
  img.src = 'https://source.unsplash.com/800x400/?' + encodeURIComponent(query + ' China travel');
}

// ================================================================
//  è¯­é³è¾å¥ (Web Speech API)
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
    showToast('è¯­é³è¯å«å¤±è´¥ï¼è¯·æå¨è¾å¥');
  };

  recognition.onend = function() {
    stopListening();
  };
}

function toggleVoiceInput() {
  if (!recognition) initSpeechRecognition();
  if (!recognition) {
    showToast('æ¨çæµè§å¨ä¸æ¯æè¯­é³è¾å¥');
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
  if (btn) { btn.textContent = 'ð´'; btn.classList.add('listening'); }
  showToast('æ­£å¨èå¬...');
  try { recognition.start(); } catch(e) {}
}

function stopListening() {
  isListening = false;
  var btn = document.getElementById('voiceBtn');
  if (btn) { btn.textContent = 'ð'; btn.classList.remove('listening'); }
  try { recognition.stop(); } catch(e) {}
}

// ================================================================
//  è¡ç¨ç¼è¾æ¨¡å¼
// ================================================================
var editMode = false;

function toggleEditMode() {
  editMode = !editMode;
  var itinerarySection = document.getElementById('itinerarySection');
  if (itinerarySection) {
    if (editMode) {
      itinerarySection.classList.add('edit-mode');
      showToast('ç¼è¾æ¨¡å¼å·²å¼ï¿½?ï¿½?å¯ææ½æåºãå é¤æ¯');
    } else {
      itinerarySection.classList.remove('edit-mode');
      showToast('ç¼è¾æ¨¡å¼å·²å³');
    }
  }
  renderItinerary();
}

// ç¹å» POI åç§°æ¥çè¯¦æ
function onPoiNameClick(poiId) {
  if (editMode) return;
  var poi = POIS.find(function(p) { return p.id === poiId; });
  if (poi) showPoiDetail(poi);
}

// ä»è¡ç¨ä¸­å é¤æä¸ªæ¯ç¹
function removePoiFromDay(dayIndex, itemIndex) {
  if (!itinerary || !editMode) return;
  itinerary[dayIndex].items.splice(itemIndex, 1);
  renderItinerary();
  renderMap();
  showToast('å·²å é¤æ¯');
}

// æ·»å æ¯ç¹å°æ'
function addPoiToDay(dayIndex) {
  if (!itinerary || !editMode) return;
  // éæºéæ©ä¸ä¸ªæªä½¿ç¨çæ¯'
  var usedIds = [];
  itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.poiId) usedIds.push(item.poiId);
    });
  });
  var available = POIS.filter(function(p) { return usedIds.indexOf(p.id) === -1; });
  if (available.length === 0) { showToast('æææ¯ç¹å·²æ·»å '); return; }
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
  showToast('å·²æ·»å ' + picked.name + '');
}

// ================================================================
//  åäº«ï¿½?QR ç ç'
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

  // èæ¯æ¸å
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  var bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(0.5, '#16213e');
  bgGrad.addColorStop(1, '#0f3460');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 500);

  // è£é¥°æ§å'
  ctx.fillStyle = activeMoodColor + '15';
  for (var i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 800, Math.random() * 500, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // æ é¢
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
  ctx.fillText('MoodTravel Â· æç»ªæè¡', 40, 60);

  // å¿ææ ç­¾
  var moodLabel = (MOODS.find(function(m) { return m.key === activeMood; }) || {}).label || '';
  var ct = COMPANION_TYPES.find(function(c) { return c.key === companionType; });
  ctx.fillStyle = activeMoodColor;
  ctx.font = '600 16px "PingFang SC", sans-serif';
  ctx.fillText(moodLabel + ' Â· ' + (ct ? ct.label : '') + ' Â· ' + days + '', 40, 100);

  // è¡ç¨æ¦è§
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
      if (item.type !== 'rest') dayText += (idx > 0 ? ' ï¿½?' : '') + item.name;
    });
    if (dayText.length > 35) dayText = dayText.substring(0, 35) + '...';
    ctx.fillText(dayText, 120, y);
    y += 30;
    count++;
  });

  // åºé¨ä¿¡æ¯
  if (stats) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '13px "PingFang SC", sans-serif';
    ctx.fillText('?????? ??' + (stats.totalCost || budget).toLocaleString() + '  |  ' + (stats.totalPois || 0) + '??????' |  æ¯ä»·èç Â¥' + ((stats.totalSaved || 0)).toLocaleString(), 40, 460);
  }

  // åºé¨æ°´å°
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '12px "PingFang SC", sans-serif';
  ctx.fillText('ï¿½?MoodTravel AI çæ Â· ä»ä¾ä¸ªäººå', 40, 485);

  // QR ç åºåï¼ç®åçï¼ç¨ç©å½¢æ¨¡æ QR ç ä½ç½®ï¼
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(660, 400, 100, 100);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px "PingFang SC", sans-serif';
  ctx.fillText('æ«ç ä½éª', 672, 455);
  ctx.fillText('MoodTravel', 670, 470);

  preview.innerHTML = '';
  preview.appendChild(canvas);
}

// ================================================================
//  å¯å¨
// ================================================================
(function() {
  loadMemory();
  initBatteryTracking();
  checkNightMode();
  resetIdleTimer();
  initParticles();
  initMoods();
  initCompanions();
  initPresets();
  initDailyScenarios();
  initHotRoutes();
  renderPlanCards();
  fetchWeather();
  renderTripHistory('all');
  registerSW();
  initKeyboardShortcuts();
  initScrollReveal();
  initBackToTop();
})();
// ================================================================
//  æ»å¨æ­ç¤ºå¨ç»
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

// ç»æ° section æ·»å  reveal '
function markRevealSections() {
  var sections = document.querySelectorAll('.itinerary-section, .ai-narrative-section, .map-section, .hotel-section, .checklist-section, .care-letter-section, .share-card-section, .trip-history-section, .travel-persona-section, .journal-section, .viz-section, .compare-section');
  sections.forEach(function(s) { s.classList.add('reveal-section'); });
  initScrollReveal();
}

// ================================================================
//  åå°é¡¶é¨
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

// ï¿½?generatePlan å®æåæ ï¿½?reveal sections
var _origGeneratePlan = generatePlan;
generatePlan = function() {
  _origGeneratePlan();
  setTimeout(function() { markRevealSections(); }, 1000);
};
// ================================================================
//  æ°æå¼å¯¼
// ================================================================
var onboardingSteps = [
  { icon:'ð­', title:'éæ©ä½ çå¿æ', desc:'MoodTravel ä¼æç¥ä½ çæç»ªï¼ä¸ºä½ éèº«å®å¶ä¸å±çæµæ±æè¡è·¯çº¿ãåä»éæ©æ­¤å»çå¿æå¼å§å§' },
  { icon:'ð°', title:'è®¾å®æè¡é¢ç®', desc:'æå¨å³ä¾§çé¢ç®æ»åï¼æç´æ¥è¾å¥éé¢ãAI ä¼æ ¹æ®é¢ç®ä¸ºä½ æ¨èæåéçæ¯ç¹åéåº' },
  { icon:'', title:'???????????????', desc:'??????"??????????????????"??????????????????????????????????????????????????????????????????????????????????????????????????????????" }
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
  nextBtn.textContent = onboardingStep === 2 ? 'å¼å§æ¢' : 'ä¸ä¸';
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

// é¦æ¬¡è®¿é®æ¶æ¾ç¤ºå¼'
(function() {
  if (!localStorage.getItem('moodtravel_onboarding_done')) {
    setTimeout(function() { showOnboarding(); }, 800);
  }
})();

// æ¶æ¼ªææ
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
//  QR Code çæï¼çº¯ JS å®ç°ï¼æ éå¤é¨ä¾èµ'
// ================================================================
function generateQRCode() {
  var overlay = document.getElementById('qrModalOverlay');
  if (!overlay) return;
  overlay.classList.add('show');

  var canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // çæè¡ç¨æè¦ææ¬
  var text = 'MoodTravel æç»ªæè¡\n';
  if (itinerary && itinerary.days) {
    text += 'å¿æ' + ((MOODS.find(function(m){return m.key===activeMood}) || {}).label || '') + '\n';
    text += 'é¢ç®ï¼' + budget.toLocaleString() + '\n';
    text += 'å¤©æ°' + itinerary.days.length + 'å¤©\n';
    var allPois = [];
    itinerary.days.forEach(function(d) {
      d.items.forEach(function(i) { allPois.push(i.name); });
    });
    text += 'æ¯ç¹' + allPois.slice(0,6).join('') + '\n';
  }
  text += 'MoodTravel ï¿½?è®©æ¯ä¸æ¬¡åºåé½ææ¸©';

  // ç®ï¿½?QR ç çæç®æ³ï¼ç¨æ¨¡æå¾æ¡ï¼
  var size = 200;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // çæä¼ªéï¿½?QR ç å¾æ¡ï¼åºäºææ¬åå¸'
  var hash = simpleHash(text);
  var moduleCount = 21;
  var moduleSize = size / (moduleCount + 8);
  var offset = 4 * moduleSize;

  // å®ä½å¾æ¡ï¼ä¸ä¸ªè§'
  drawFinder(ctx, offset, offset, moduleSize);
  drawFinder(ctx, size - offset - 3*moduleSize, offset, moduleSize);
  drawFinder(ctx, offset, size - offset - 3*moduleSize, moduleSize);

  // æ°æ®åºå
  ctx.fillStyle = '#000';
  for (var i = 0; i < moduleCount; i++) {
    for (var j = 0; j < moduleCount; j++) {
      // è·³è¿å®ä½å¾æ¡åºå
      if ((i < 7 && j < 7) || (i > moduleCount - 8 && j < 7) || (i < 7 && j > moduleCount - 8)) continue;
      var hashIdx = (i * moduleCount + j) % hash.length;
      if (hash.charCodeAt(hashIdx) % 2 === 0) {
        ctx.fillRect(offset + i * moduleSize, offset + j * moduleSize, moduleSize * 0.8, moduleSize * 0.8);
      }
    }
  }

  // ä¸­å¿å¾æ 
  ctx.fillStyle = '#8BA88C';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('', size/2, size/2);
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
  // æ©å±å°è¶³å¤é¿'
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
  showToast('ï¿½?äºç»´ç å·²ä¸è½½');
}

// ================================================================
//  ç¨æ·åé¦ç³»ç» ï¿½?NPS è¯å + å»ºè®®æ¶é
// ================================================================
var feedbackData = { submitted: false, nps: 0, comment: '' };

function showFeedbackPrompt() {
  if (feedbackData.submitted) return;
  if (!itinerary || itinerary.length === 0) return;
  
  // è¡ç¨çæï¿½?30 ç§å¼¹'
  setTimeout(function() {
    var overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    overlay.id = 'feedbackOverlay';
    overlay.innerHTML = '<div class="feedback-card glass-panel">' +
      '<div class="feedback-close" onclick="closeFeedback()">"/div>' +
      '<div class="feedback-title">??????????????????????????????"/div>' +
      '<div class="feedback-sub">ä½ çåé¦è½å¸®æä»¬åå¾æ´å¥½</div>' +
      '<div class="feedback-stars" id="feedbackStars">' +
      [1,2,3,4,5].map(function(n) {
        return '<span class="feedback-star" data-nps="' + n + '" onclick="setNPS(' + n + ')">"/span>';
      }).join('') +
      '</div>' +
      '<textarea class="feedback-input" id="feedbackInput" placeholder="æä»ä¹æ³è¯´çï¼ï¼éå¡«"></textarea>' +
      '<button class="feedback-submit-btn" onclick="submitFeedback()">æäº¤åé¦</button>' +
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
  showToast('æè°¢ä½ çåé¦ï¼â¨');
}

function closeFeedback() {
  var overlay = document.getElementById('feedbackOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
  }
}

// ================================================================
//  API è®¾ç½®ç®¡ç
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
  showToast('API è®¾ç½®å·²ä¿å­ï¼');
}

// ================================================================
//  AI å¤æºè½ä½æµæ°´'
// ================================================================
function runMultiAgentPipeline() {
  var panel = document.getElementById('multiAgentPanel');
  if (panel) panel.classList.add('show');
  var agents = [
    { id: 'agentCard1', name: 'Route Planner', icon: 'ðº', outputs: [
      'åææ­å·-èå±±è·¯çº¿... åç°3æ¡æä¼è·¯',
      'è®¡ç®åå¸é´äº¤éèæ¶... é«é2.5h vs èªé©¾4h',
      'è·¯çº¿ä¼åå®æ ï¿½?æ¨èï¼æ­å·âå®æ³¢âè'
    ], delay: 200 },
    { id: 'agentCard2', name: 'Hotel Advisor', icon: 'ð¨', outputs: [
      '??????6??????????????????'.. ç¾å¢/æºç¨/é£çª/åç¨/èºé¾/å»åª',
      '??????????????' + budget + '??????'.. ç­ï¿½?2',
      'AIæ¯ä»·å®æ ï¿½?æ¨èï¼è¥¿æ¹å½å®¾é¦ Â¥468/'
    ], delay: 500 },
    { id: 'agentCard3', name: 'Food Curator', icon: 'ð', outputs: [
      'ééå½å°ç¾é£æ°æ®... å¤§ä¼ç¹è¯TOP100',
      'å¹éå£å³åå¥½... è¿æ»¤ä¸éå' + (MOODS.find(function(m){return m.key===activeMood;})||{}).label + 'å¿æçé¤',
      'ç¾é£æ¨èå®æ ï¿½?ç²¾' + Math.floor(Math.random()*5+5) + 'å®¶é¤'
    ], delay: 800 },
    { id: 'agentCard4', name: 'Weather Risk', icon: 'ð¤', outputs: [
      '??????????????????7??????'.. æ­å·ï¿½?èå±±å¤äº',
      'è¯ä¼°æ·å¤æ´»å¨é£é©... éé¨æ¦ç15%',
      'å¤©æ°åæå®æ ï¿½?å»ºè®®å¤ä¼ï¼æ·å¤æ´»å¨å®'
    ], delay: 1100 },
    { id: 'agentCard5', name: 'Budget Optimizer', icon: 'ð°', outputs: [
      'æ ¸ç®æ»é¢ï¿½?Â¥' + budget + '... åé' + days + 'å¤©è¡',
      'å¯¹æ¯å¦å®¶/æ±åº­/äºæµ... æ§ä»·æ¯æä¼æ¹',
      'é¢ç®ä¼åå®æ ï¿½?é¢è®¡èç Â¥' + Math.floor(budget * 0.12)
    ], delay: 1400 }
  ];

  agents.forEach(function(agent, idx) {
    setTimeout(function() {
      var card = document.getElementById(agent.id);
      if (!card) return;
      card.classList.add('thinking');
      var outputEl = card.querySelector('.agent-output');
      // éæ­¥å±ç¤ºæèè¿'
      agent.outputs.forEach(function(out, outIdx) {
        setTimeout(function() {
          if (outputEl) outputEl.textContent = out;
        }, outIdx * 600);
      });
      // æ è®°å®æ
      setTimeout(function() {
        card.classList.remove('thinking');
        card.classList.add('done');
      }, agent.outputs.length * 600 + 100);
    }, agent.delay);
  });

  // æï¿½?agent å®æåéèé¢'
  var totalTime = agents[agents.length - 1].delay + agents[agents.length - 1].outputs.length * 600 + 300;
  setTimeout(function() {
    if (panel) {
      setTimeout(function() { panel.classList.remove('show'); }, 1500);
    }
  }, totalTime);
}

// ================================================================
//  äººæµå¯åº¦é¢æµ
// ================================================================
function getCrowdLevel(poi) {
  var now = new Date();
  var hour = now.getHours();
  var dayOfWeek = now.getDay();
  var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  var month = now.getMonth() + 1;
  
  // åºç¡äººæµè¯å
  var baseScore = (poi.crowdednessLevel || 3);
  
  // æ¶é´å ç´ ï¼æ©ä¸äººå°ï¼ä¸åäººå¤
  var timeModifier = 0;
  if (hour >= 6 && hour < 9) timeModifier = -1;
  else if (hour >= 9 && hour < 11) timeModifier = 0;
  else if (hour >= 11 && hour < 14) timeModifier = 1;
  else if (hour >= 14 && hour < 17) timeModifier = 1;
  else if (hour >= 17 && hour < 20) timeModifier = 0;
  else timeModifier = -1;
  
  // å¨æ«æ´æ¥'
  var weekendModifier = isWeekend ? 1 : 0;
  
  // å­£èå ç´ ï¼é»éå¨/æåäººå¤
  var seasonModifier = 0;
  if (month === 7 || month === 8) seasonModifier = 1; // æå
  if (month === 10 && dayOfWeek >= 0) seasonModifier = 1; // å½åº
  
  // å¤©æ°å ç´ ï¼é¨å¤©å°'
  var weatherModifier = 0;
  if (typeof currentWeather !== 'undefined' && currentWeather && currentWeather.condition) {
    if (currentWeather.condition.indexOf('') !== -1) weatherModifier = -1;
  }
  
  // äººæ°å æ
  var popularityModifier = (poi.popularity || 5) > 7 ? 1 : 0;
  
  var totalScore = baseScore + timeModifier + weekendModifier + seasonModifier + weatherModifier + popularityModifier;
  totalScore = Math.max(1, Math.min(5, totalScore));
  
  var bestTime = '';
  if (hour < 9) bestTime = 'ä¸å9:00-11:00ï¼é¿å¼æ©é«å³°ï¼';
  else if (hour < 14) bestTime = 'ä¸å14:00-16:00ï¼åé¤åæ¶æ®µ';
  else bestTime = 'æå¤©ä¸å8:00-10:00ï¼æ¸æ¨æä½³ï¼';
  
  if (totalScore <= 2) return { level: 'low', icon: 'ð¢', label: 'ç©ºé²', bestTime: bestTime };
  if (totalScore <= 3) return { level: 'medium', icon: 'ð¡', label: 'éä¸­', bestTime: bestTime };
  if (totalScore <= 4) return { level: 'high', icon: 'ð ', label: 'è¾æ¤', bestTime: bestTime };
  return { level: 'crowded', icon: 'ð´', label: 'çæ»¡', bestTime: bestTime };
}

// ================================================================
//  å®å¨é¢æ¿
// ================================================================
function renderSafetyPanel() {
  var panel = document.getElementById('safetyPanel');
  if (!panel) return;
  panel.classList.add('show');
  
  var grid = document.getElementById('safetyGrid');
  var tip = document.getElementById('safetyTip');
  
  // åå¸ä¿¡æ¯
  var cityNames = [];
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.city && cityNames.indexOf(item.city) === -1) cityNames.push(item.city);
      });
    });
  }
  var mainCity = cityNames[0] || 'æ­å·';
  
  var safetyItems = [
    { icon: 'ð', title: 'æ¥è­¦çµè¯', detail: '110' },
    { icon: 'ð', title: 'æ¥æä¸­å¿', detail: '120' },
    { icon: 'ð', title: 'ç«è­¦çµè¯', detail: '119' },
    { icon: 'ð', title: 'äº¤éäº', detail: '122' },
    { icon: 'ð¥', title: 'æè¿å»', detail: mainCity + 'å¸ç¬¬ä¸äººæ°å»é¢' },
    { icon: 'ð', title: 'åºç§è½¦ç­', detail: mainCity === 'æ­å·' ? '0571-28811111' : 'å½å°12328' },
    { icon: 'ð', title: 'ææ¸¸æè¯', detail: '12301' },
    { icon: 'ð', title: 'é¢äºä¿æ¤', detail: '12308' }
  ];
  
  grid.innerHTML = safetyItems.map(function(s) {
    return '<div class="safety-card"><div class="safety-card-icon">' + s.icon + '</div><div class="safety-card-title">' + s.title + '</div><div class="safety-card-detail">' + s.detail + '</div></div>';
  }).join('');
  
  tip.innerHTML = 'ð¡ <strong>åºè¡å°è´´å£«ï¼</strong>å»ºè®®è´­ä¹°ææ¸¸æå¤é©ï¼çº¦ï¿½?5-30/å¤©ï¼ï¼ä¿å­ç´§æ¥èç³»äººçµè¯ï¼æåä¸è½½ç¦»çº¿å°å¾ãå¦éç´§æ¥æåµï¼ä¿æå·éï¼ç¬¬ä¸æ¶é´æ¨æ110';
}

// ================================================================
//  ç¢³è¶³è¿¹è®¡ç®å¨
// ================================================================
function renderCarbonFootprint() {
  var section = document.getElementById('carbonSection');
  if (!section) return;
  section.classList.add('show');
  
  var wrap = document.getElementById('carbonScoreWrap');
  var tips = document.getElementById('carbonTips');
  
  // ä¼°ç®æ»é'
  var totalKm = 0;
  var transportMode = 'é«é';
  if (itinerary) {
    itinerary.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.transitTime) {
          totalKm += item.transitTime * 0.8; // åè®¾å¹³åæ¶ï¿½?8km/h
        }
      });
    });
  }
  if (totalKm < 50) totalKm = 50 + Math.random() * 100;
  
  // é«é: '.04 kg CO2/km/'
  // èªé©¾: '.12 kg CO2/km/'
  // é£æº: '.15 kg CO2/km/'
  var co2PerKm = 0.04;
  var estimatedCO2 = Math.round(totalKm * co2PerKm);
  var avgCO2 = Math.round(totalKm * 0.12); // å¯¹æ¯èªé©¾ææ¾
  
  // ç»¿è²è¯å (0-100)
  var greenScore = Math.round(100 - (estimatedCO2 / (avgCO2 || 1)) * 50);
  greenScore = Math.max(20, Math.min(100, greenScore));
  
  wrap.innerHTML = '<div class="carbon-score-circle" style="background:conic-gradient(#8BA88C ' + (greenScore * 3.6) + 'deg, rgba(255,255,255,0.12) ' + (greenScore * 3.6) + 'deg)"><div class="carbon-score-inner"><div class="carbon-score-value">' + greenScore + '</div><div class="carbon-score-label">??????"/div></div></div>' +
    '<div class="carbon-details">' +
    '<div class="carbon-detail-row"><span>????????????"/span><span class="carbon-detail-val">' + estimatedCO2 + ' kg CO'/span></div>' +
    '<div class="carbon-detail-row"><span>????????????</span><span class="carbon-detail-val">' + avgCO2 + ' kg CO'/span></div>' +
    '<div class="carbon-detail-row"><span>????????????</span><span class="carbon-detail-val" style="color:#8BA88C">' + (avgCO2 - estimatedCO2) + ' kg CO'/span></div>' +
    '<div class="carbon-detail-row"><span>????????????</span><span class="carbon-detail-val">' + transportMode + '???'/span></div>' +
    '</div>';
  
  tips.innerHTML = '<li>???? ????????????????????????????????????60%??????'/li>' +
    '<li>???? ?????????????????????????????????????????????'/li>' +
    '<li>ð¨ éæ©ç»¿è²éåºï¼å¦æç¯ä¿è®¤è¯ï¼å¯è¿ä¸æ­¥éä½ç¢³è¶³è¿¹</li>' +
    '<li>???? ??????????????????????????????????????????'/li>' +
    '<li>?????? ???????????????????????????????????????????????????'/li>';
}

// ================================================================
//  æè¡æ¤ç§æå°±ç³»ç»
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
    showToast('ð è§£éæ°æå°±ï¼');
  }
}

function renderTravelPassport() {
  var section = document.getElementById('passportSection');
  if (!section) return;
  section.classList.add('show');
  
  loadAchievements();
  
  // èªå¨è§£éæå°±
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
    { id: 'first_trip', icon: 'ð', name: 'é¦æ¬¡åºè¡', desc: 'ç¬¬ä¸æ¬¡çææè¡è®¡', condition: 'å·²çæè¡' },
    { id: 'cross_city', icon: 'ð', name: 'è·¨ååå£«', desc: 'åæ¬¡æè¡è·¨è¶2+åå¸', condition: 'å¤åå¸è¡' },
    { id: 'budget_master', icon: 'ð', name: 'ç²¾æç»ç®', desc: 'é¢ç®åå®ææè¡è§', condition: 'æªè¶é¢ç®' },
    { id: 'food_explorer', icon: 'ð½', name: 'ç¾é£çäºº', desc: 'è¡ç¨åå«5+é¤å', condition: 'ç¾é£ä¹æ' },
    { id: 'photo_master', icon: 'ð¸', name: 'æå½±è¾¾äºº', desc: 'æå¡3+ç½çº¢æ¯ç¹', condition: 'æå½±è·¯çº¿' },
    { id: 'eco_warrior', icon: 'ð', name: 'ç¯ä¿åé', desc: 'ç»¿è²è¯åï¿½?0', condition: 'ä½ç¢³åºè¡' }
  ];
  
  var earnedCount = 0;
  var badgesHtml = badges.map(function(b) {
    var earned = travelAchievements.indexOf(b.id) !== -1;
    if (earned) earnedCount++;
    return '<div class="passport-badge ' + (earned ? 'earned' : 'locked') + '">' +
      '<div class="passport-badge-check">"/div>' +
      '<div class="passport-badge-icon">' + b.icon + '</div>' +
      '<div class="passport-badge-name">' + b.name + '</div>' +
      '<div class="passport-badge-desc">' + (earned ? 'å·²è§£' : b.condition) + '</div>' +
      '</div>';
  }).join('');
  
  document.getElementById('passportBadges').innerHTML = badgesHtml;
  document.getElementById('passportProgressFill').style.width = (earnedCount / badges.length * 100) + '%';
}

// ================================================================
//  æ¶é´çº¿è§'
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
        '<div class="timeline-snake-name">' + item.name + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.5)">Â¥' + (item.estimatedCost || 0) + '</div>' +
        '</div>';
      if (itemIndex < day.items.length - 1) {
        html += '<div class="timeline-snake-arrow">"/div>';
      }
    });
    html += '</div>';
  });
  
  timelineEl.innerHTML = html;
}

// ================================================================
//  èæ¯é³æç³»ç»
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
    calm: { freqs: [220, 277, 330], type: 'sine', desc: 'å®éæ³¢æµª' },
    happy: { freqs: [392, 494, 587], type: 'triangle', desc: 'æ¬¢å¿«æå¾' },
    sad: { freqs: [262, 330, 392], type: 'sine', desc: 'æ¸©æé¢ç´' },
    anxious: { freqs: [110, 146, 196], type: 'sine', desc: 'å®éä½é¢' },
    excited: { freqs: [440, 554, 659], type: 'sawtooth', desc: 'è½éèæ' },
    tired: { freqs: [174, 220, 261], type: 'sine', desc: 'èç¼æ¾æ¾' },
    insomnia: { freqs: [98, 130, 164], type: 'sine', desc: 'æ·±åº¦å©ç ' }
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
    // è½»å¾®é¢çè°å¶
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
  if (btn) { btn.classList.add('playing'); btn.textContent = 'ð¶'; }
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
  if (btn) { btn.classList.remove('playing'); btn.textContent = 'ðµ'; }
  var label = document.getElementById('soundtrackLabel');
  if (label) label.textContent = 'ç¯å¢';
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

// å¿æåæ¢æ¶èªå¨åæ¢é³'
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
//  å¤è¯­è¨åæ¢
// ================================================================
var currentLang = 'zh';
var i18n = {
  zh: {
    brandName: 'MoodTravel',
    brandSlogan: 'è®©æ¯ä¸æ¬¡åºï¿½?br/>é½ææ¸©åº¦',
    brandSub: 'æç»ªé©±å¨æè¡ Â· éå¿èè¡',
    generateBtn: 'ï¿½?æºè½çæè¡ç¨',
    moodTitle: 'æ­¤å»å¿æ',
    searchPlaceholder: 'æç´¢æ¯ç¹ãåå¸ãç®çå°...'
  },
  en: {
    brandName: 'MoodTravel',
    brandSlogan: 'Every journey<br/>with warmth',
    brandSub: 'Emotion-driven Travel Â· Follow Your Heart',
    generateBtn: 'ï¿½?Generate Itinerary',
    moodTitle: 'Current Mood',
    searchPlaceholder: 'Search destinations, cities...'
  },
  ja: {
    brandName: 'MoodTravel',
    brandSlogan: 'ãã¹ã¦ã®æã«<br/>æ¸©ããã',
    brandSub: 'ææé§åæè¡ Â· å¿ã®ã¾ã¾',
    generateBtn: 'ï¿½?æç¨ãç',
    moodTitle: 'ä»ã®æ°å',
    searchPlaceholder: 'è¦³åå°ãé½å¸ãæ¤ç´¢...'
  }
};

function switchLanguage(lang) {
  currentLang = lang;
  var t = i18n[lang] || i18n.zh;
  
  // æ´æ°æé®ç¶'
  ['zh', 'en', 'ja'].forEach(function(l) {
    var btn = document.getElementById('lang' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) btn.classList.toggle('active', l === lang);
  });
  
  // æ´æ°åç'
  var brandName = document.querySelector('.brand-name');
  if (brandName) brandName.textContent = t.brandName;
  var brandSlogan = document.querySelector('.brand-slogan');
  if (brandSlogan) brandSlogan.innerHTML = t.brandSlogan;
  var brandSub = document.querySelector('.brand-sub');
  if (brandSub) brandSub.textContent = t.brandSub;
  
  // æ´æ°çææé®
  var genBtn = document.getElementById('generatePlanBtn');
  if (genBtn && !isPlanning) genBtn.textContent = t.generateBtn;
  
  // æ´æ°å¿ææ é¢
  var moodTitle = document.querySelector('.mood-section-title');
  if (moodTitle) moodTitle.textContent = t.moodTitle;
  
  // æ´æ°æç´¢'
  var searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  
  try { localStorage.setItem('moodtravel_lang', lang); } catch(e) {}
  showToast('è¯­è¨å·²åæ¢è³ ' + (lang === 'zh' ? 'ä¸­æ' : lang === 'en' ? 'English' : 'æ¥æ¬'));
}

// å¯å¨æ¶æ¢å¤è¯­è¨
(function() {
  try {
    var saved = localStorage.getItem('moodtravel_lang');
    if (saved && saved !== 'zh') { switchLanguage(saved); }
  } catch(e) {}
})();

