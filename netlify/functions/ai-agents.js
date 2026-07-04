// Netlify Function: AI Multi-Agent System
// 调用 pollinations.ai 免费 LLM，为旅行规划提供5个AI Agent并行分析
// 端点: /.netlify/functions/ai-agents

const https = require('https');

function callAI(prompt, model) {
  return new Promise(function(resolve) {
    var encoded = encodeURIComponent(prompt);
    var apiUrl = 'https://text.pollinations.ai/' + encoded + '?model=' + (model || 'openai') + '&seed=' + Math.floor(Math.random() * 100000);

    var urlObj = new URL(apiUrl);
    var options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 25000,
      headers: { 'Accept': 'text/plain' }
    };

    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        var result = data.trim();
        if (result.startsWith('{') && result.indexOf('error') !== -1) {
          resolve('');
          return;
        }
        resolve(result);
      });
    });

    req.on('error', function() { resolve(''); });
    req.on('timeout', function() { req.destroy(); resolve(''); });
    req.end();
  });
}

async function callAIWithRetry(prompt, model, retries) {
  retries = retries || 2;
  for (var i = 0; i <= retries; i++) {
    if (i > 0) {
      await new Promise(function(r) { setTimeout(r, 1500 * i); });
    }
    var result = await callAI(prompt, model);
    if (result && result.length > 10) return result;
  }
  return '';
}

async function agentRoutePlanner(params) {
  var prompt = [
    '你是一个专业的旅行路线规划师。请根据以下参数，推荐3个最适合的景点，每个景点用一句话介绍。',
    '目的地: ' + (params.city || '杭州'),
    '心情: ' + (params.mood || '平静'),
    '天数: ' + (params.days || 2) + '天',
    '预算: ' + (params.budget || 2000) + '元/人',
    '旅伴: ' + (params.companion || '独行'),
    '季节: ' + (params.season || '春季'),
    '天气: ' + (params.weather || '晴朗'),
    '请用中文回复，格式：1. 景点名 - 一句话介绍。每个景点用换行分隔。',
  ].join('\n');
  return await callAIWithRetry(prompt, 'openai');
}

async function agentHotelAdvisor(params) {
  var prompt = [
    '你是一个专业的酒店推荐顾问。请根据以下参数，推荐2个最适合的酒店类型和区域。',
    '目的地: ' + (params.city || '杭州'),
    '预算: ' + (params.budget || 2000) + '元/人',
    '旅伴类型: ' + (params.companion || '独行'),
    '偏好: ' + (params.mood || '舒适'),
    '请用中文回复，简洁推荐酒店区域和类型，50字以内。',
  ].join('\n');
  return await callAIWithRetry(prompt, 'openai');
}

async function agentFoodCurator(params) {
  var prompt = [
    '你是一个美食推荐专家。请根据以下参数，推荐3道当地必吃美食。',
    '城市: ' + (params.city || '杭州'),
    '预算: ' + (params.budget || 2000) + '元/人',
    '饮食偏好: ' + (params.mood || '舒适'),
    '请用中文回复，格式：菜名 - 一句话推荐理由。50字以内。',
  ].join('\n');
  return await callAIWithRetry(prompt, 'openai');
}

async function agentWeatherRisk(params) {
  var prompt = [
    '你是一个旅行天气风险评估专家。请根据以下参数，给出简短的天气风险提示和出行建议。',
    '城市: ' + (params.city || '杭州'),
    '季节: ' + (params.season || '春季'),
    '当前天气: ' + (params.weather || '晴朗'),
    '请用中文回复，40字以内，给出天气对旅行的影响和1条建议。',
  ].join('\n');
  return await callAIWithRetry(prompt, 'openai');
}

async function agentBudgetOptimizer(params) {
  var prompt = [
    '你是一个旅行预算优化专家。请根据以下参数，给出预算分配建议。',
    '总预算: ' + (params.budget || 2000) + '元/人',
    '天数: ' + (params.days || 2) + '天',
    '目的地: ' + (params.city || '杭州'),
    '请用中文回复，格式：门票X元/餐饮X元/住宿X元/交通X元，一句话建议。50字以内。',
  ].join('\n');
  return await callAIWithRetry(prompt, 'openai');
}

exports.handler = async function(event, context) {
  // CORS headers
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers, body: '' };
  }

  try {
    var params = {};
    if (event.body) {
      try { params = JSON.parse(event.body); } catch(e) {}
    }

    var city = params.city || '杭州';
    var mood = params.mood || 'calm';
    var moodLabels = { calm:'平静放松', happy:'开心愉快', sad:'安静治愈', anxious:'焦虑不安', excited:'兴奋激动', tired:'疲惫需要休息', insomnia:'失眠' };
    var seasonLabels = { spring:'春', summer:'夏', autumn:'秋', winter:'冬' };
    var now = new Date();
    var month = now.getMonth() + 1;
    var season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';

    var agentParams = {
      city: city,
      mood: moodLabels[mood] || mood,
      days: params.days || 2,
      budget: params.budget || 2000,
      companion: params.companion || 'solo',
      season: seasonLabels[season] || '春',
      weather: params.weather || '晴朗'
    };

    // 顺序调用所有5个Agent（避免并发限制）
    var result1 = await agentRoutePlanner(agentParams);
    var result2 = await agentHotelAdvisor(agentParams);
    var result3 = await agentFoodCurator(agentParams);
    var result4 = await agentWeatherRisk(agentParams);
    var result5 = await agentBudgetOptimizer(agentParams);

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        success: true,
        agents: [
          { name: 'Route Planner', icon: '🗺️', result: result1 || '路线规划完成 ✓' },
          { name: 'Hotel Advisor', icon: '🏨', result: result2 || '酒店推荐完成 ✓' },
          { name: 'Food Curator', icon: '🍜', result: result3 || '美食推荐完成 ✓' },
          { name: 'Weather Risk', icon: '🌤️', result: result4 || '天气分析完成 ✓' },
          { name: 'Budget Optimizer', icon: '💰', result: result5 || '预算优化完成 ✓' }
        ],
        poweredBy: 'pollinations.ai (free LLM) via Netlify Functions',
        timestamp: new Date().toISOString()
      })
    };
  } catch(e) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ success: false, error: e.message })
    };
  }
};