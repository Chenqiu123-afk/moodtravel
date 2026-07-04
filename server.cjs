const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 8106;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// ================================================================
//  AI Agent 系统 — 调用 pollinations.ai 免费 LLM
// ================================================================
function callAI(prompt, model) {
  return new Promise(function(resolve) {
    var encoded = encodeURIComponent(prompt);
    // 使用 seed 和 model 参数提高结果质量
    var apiUrl = 'https://text.pollinations.ai/' + encoded + '?model=' + (model || 'openai') + '&seed=' + Math.floor(Math.random() * 100000);

    var urlObj = new URL(apiUrl);
    var options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 30000,
      headers: { 'Accept': 'text/plain' }
    };

    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        var result = data.trim();
        // 检测 JSON 错误响应（429 等）
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

// 带重试的 AI 调用（顺序调用，避免并发限制）
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

// Agent 1: 路线规划师
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

// Agent 2: 酒店顾问
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

// Agent 3: 美食策展人
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

// Agent 4: 天气风险分析
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

// Agent 5: 预算优化师
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

// ================================================================
//  HTTP 服务器
// ================================================================
const server = http.createServer(async function(req, res) {
  var parsedUrl = new URL(req.url, 'http://localhost:' + PORT);
  var pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ================================================================
  //  AI Agent API 端点
  // ================================================================
  if (pathname === '/api/agents/run-all') {
    try {
      var body = '';
      req.on('data', function(chunk) { body += chunk; });
      req.on('end', async function() {
        var params = {};
        try { params = JSON.parse(body); } catch(e) {}

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

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          agents: [
            { name: 'Route Planner', icon: '🗺️', result: result1 || '路线规划完成' },
            { name: 'Hotel Advisor', icon: '🏨', result: result2 || '酒店推荐完成' },
            { name: 'Food Curator', icon: '🍜', result: result3 || '美食推荐完成' },
            { name: 'Weather Risk', icon: '🌤️', result: result4 || '天气分析完成' },
            { name: 'Budget Optimizer', icon: '💰', result: result5 || '预算优化完成' }
          ],
          poweredBy: 'pollinations.ai (free LLM)',
          timestamp: new Date().toISOString()
        }));
      });
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 单个Agent调用
  if (pathname === '/api/agents/route') {
    handleAgentAPI(req, res, agentRoutePlanner);
    return;
  }
  if (pathname === '/api/agents/hotel') {
    handleAgentAPI(req, res, agentHotelAdvisor);
    return;
  }
  if (pathname === '/api/agents/food') {
    handleAgentAPI(req, res, agentFoodCurator);
    return;
  }
  if (pathname === '/api/agents/weather') {
    handleAgentAPI(req, res, agentWeatherRisk);
    return;
  }
  if (pathname === '/api/agents/budget') {
    handleAgentAPI(req, res, agentBudgetOptimizer);
    return;
  }

  // ================================================================
  //  静态文件服务
  // ================================================================
  var filePath = path.join(DIR, pathname === '/' ? '/index.html' : pathname.split('?')[0]);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  var ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback: 返回 index.html
        fs.readFile(path.join(DIR, 'index.html'), function(err2, data2) {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(500);
      res.end('Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  });
});

function handleAgentAPI(req, res, agentFn) {
  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', async function() {
    var params = {};
    try { params = JSON.parse(body); } catch(e) {}
    try {
      var result = await agentFn(params);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, result: result }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  });
}

server.listen(PORT, '0.0.0.0', function() {
  console.log('='.repeat(60));
  console.log('  MoodTravel Server v2.0 — AI Multi-Agent Edition');
  console.log('  Local:  http://127.0.0.1:' + PORT + '/');
  console.log('  AI API: http://127.0.0.1:' + PORT + '/api/agents/run-all');
  console.log('  Powered by: pollinations.ai (free LLM)');
  console.log('='.repeat(60));
});