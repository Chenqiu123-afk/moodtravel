/**
 * 天气 API 封装
 * =============
 * 支持：和风天气 / 高德天气 双源
 * 功能：实时天气、7天预报、灾害预警、心情→天气建议
 *
 * 使用方式：
 *   import { getWeather, checkRain, getMoodWeatherAdvice } from './weather.js'
 *
 *   const weather = await getWeather('330100')  // 杭州城市编码
 *   if (weather.hasRain) { /* 触发行程调整 */ }
 */

// 和风天气 Key（需在 https://dev.qweather.com 申请）
const HEFENG_KEY = 'YOUR_HEFENG_KEY_HERE';

// 高德天气 Key（复用高德 Key）
const AMAP_KEY = '266de1ff51d786530d80c9f6d950a853';

// ============================================================
// 1. 和风天气 API（推荐，数据更丰富）
// ============================================================

/** 获取实时天气 */
async function getHeWeatherNow(locationId) {
  const res = await fetch(
    `https://devapi.qweather.com/v7/weather/now?key=${HEFENG_KEY}&location=${locationId}`
  );
  const data = await res.json();
  if (data.code !== '200') throw new Error(`天气查询失败：${data.code}`);
  return {
    temp: data.now.temp,
    feelsLike: data.now.feelsLike,
    text: data.now.text,          // "阴" / "暴雨" / "晴"
    icon: data.now.icon,
    windDir: data.now.windDir,
    windScale: data.now.windScale,
    humidity: data.now.humidity,
    precip: data.now.precip,
    vis: data.now.vis
  };
}

/** 获取 7 天预报 */
async function getHeWeather7d(locationId) {
  const res = await fetch(
    `https://devapi.qweather.com/v7/weather/7d?key=${HEFENG_KEY}&location=${locationId}`
  );
  const data = await res.json();
  return data.daily.map(d => ({
    date: d.fxDate,
    tempMax: d.tempMax,
    tempMin: d.tempMin,
    textDay: d.textDay,
    textNight: d.textNight,
    iconDay: d.iconDay,
    humidity: d.humidity,
    windDirDay: d.windDirDay,
    windScaleDay: d.windScaleDay
  }));
}

/** 获取灾害预警 */
async function getHeWarning(locationId) {
  const res = await fetch(
    `https://devapi.qweather.com/v7/warning/now?key=${HEFENG_KEY}&location=${locationId}`
  );
  const data = await res.json();
  return (data.warning || []).map(w => ({
    id: w.id,
    type: w.type,            // "暴雨" / "台风" / "高温"
    level: w.level,          // "黄色" / "橙色" / "红色"
    title: w.title,
    text: w.text,
    startTime: w.startTime,
    endTime: w.endTime,
    severity: w.severity
  }));
}

// ============================================================
// 2. 高德天气 API（备用，无需额外申请 Key）
// ============================================================

/** 获取高德天气（使用已有 Key） */
async function getAmapWeather(cityCode) {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${cityCode}&extensions=all`
  );
  const data = await res.json();
  if (data.status !== '1') throw new Error('高德天气查询失败');
  return {
    current: data.forecasts[0].casts[0],
    forecasts: data.forecasts[0].casts
  };
}

// ============================================================
// 3. 统一接口（优先和风，降级高德）
// ============================================================

/**
 * 获取目的地天气
 * @param {string} cityCode - 城市编码（如杭州 330100）
 * @param {Date}   startDate - 出发日期
 * @param {number} days - 行程天数
 */
async function getWeather(cityCode, startDate, days = 3) {
  try {
    // 尝试和风天气
    const [now, forecast7d, warnings] = await Promise.all([
      getHeWeatherNow(cityCode),
      getHeWeather7d(cityCode),
      getHeWarning(cityCode)
    ]);

    // 截取行程期间的预报
    const startStr = formatDate(startDate);
    const relevantForecasts = forecast7d.filter(f => f.date >= startStr).slice(0, days);

    return {
      source: 'hefeng',
      current: now,
      forecasts: relevantForecasts,
      warnings,
      hasRain: relevantForecasts.some(f => isRainCode(f.iconDay)),
      hasWarning: warnings.length > 0,
      rainDays: relevantForecasts.filter(f => isRainCode(f.iconDay)),
      summary: generateWeatherSummary(relevantForecasts, warnings)
    };
  } catch (e) {
    console.warn('和风天气不可用，降级到高德天气：', e.message);
    // 降级到高德
    const amapData = await getAmapWeather(cityCode);
    const relevantForecasts = amapData.forecasts?.slice(0, days) || [];

    return {
      source: 'amap',
      hasRain: relevantForecasts.some(f => isRainText(f.dayweather)),
      forecasts: relevantForecasts.map(f => ({
        date: f.date,
        tempMax: f.daytemp,
        tempMin: f.nighttemp,
        textDay: f.dayweather,
        textNight: f.nightweather,
        iconDay: f.dayweather_icon || '999'
      })),
      warnings: [],
      hasWarning: false,
      rainDays: relevantForecasts.filter(f => isRainText(f.dayweather)),
      summary: `未来${days}天：${relevantForecasts.map(f => f.dayweather).join('、')}`
    };
  }
}

// ============================================================
// 4. 天气判断工具函数
// ============================================================

/** 和风天气图标码 → 是否下雨 */
function isRainCode(iconCode) {
  // 300-399：小雨/中雨/大雨/暴雨
  const code = parseInt(iconCode);
  return code >= 300 && code <= 399;
}

/** 高德天气文字 → 是否下雨 */
function isRainText(text) {
  const rainKeywords = ['雨','雷','阵雨','暴雨','小雨','中雨','大雨','雷阵雨'];
  return rainKeywords.some(k => text.includes(k));
}

/** 生成天气摘要 */
function generateWeatherSummary(forecasts, warnings) {
  const parts = [];
  parts.push(`未来${forecasts.length}天：${forecasts.map(f => f.textDay).join('、')}`);
  if (warnings.length > 0) {
    parts.push(`预警：${warnings.map(w => `${w.level}${w.type}`).join('、')}`);
  }
  return parts.join('；');
}

// ============================================================
// 5. 心情 → 天气建议
// ============================================================

/**
 * 根据心情和天气，生成对用户的建议文案
 */
function getMoodWeatherAdvice(moodLabel, weather) {
  const adviceMap = {
    tired: {
      rain: '外面下雨，正好在酒店泡个澡、做个SPA，彻底放松',
      sunny: '天气不错，找个安静的地方慢慢散步，不赶时间',
      hot: '高温天气，建议选择室内空调场所，避免户外暴晒'
    },
    excited: {
      rain: '虽然下雨，但室内蹦床公园、密室逃脱一样可以释放激情',
      sunny: '完美天气！尽情享受户外活动，释放你的能量',
      hot: '高温不影响你的热情，但记得多补水！'
    },
    sad: {
      rain: '雨天很适合去书店、咖啡馆发呆，让情绪自然流淌',
      sunny: '阳光有治愈的力量，去公园或湖边坐坐吧',
      hot: '找个安静的博物馆慢慢逛，室内清凉又治愈'
    },
    anxious: {
      rain: '雨声是天然的白噪音，去茶馆听着雨声喝茶，非常解压',
      sunny: '晴天适合去寺庙或山间步道，自然的力量能安抚焦虑',
      hot: '高温时避免拥挤景点，选择预约制的室内场所更安心'
    },
    calm: {
      rain: '雨天泡杯茶，看雨滴打在窗上，享受这份宁静',
      sunny: '不冷不热的好天气，适合慢悠悠地探索城市角落',
      hot: '高温天适合早起游览，午后找个咖啡馆躲避烈日'
    },
    happy: {
      rain: '下雨也挡不住好心情，雨天别有一番风味',
      sunny: '阳光明媚，心情更好，拍照出片率超高',
      hot: '好心情不怕热，冰淇淋和冷饮走起！'
    }
  };

  const advice = adviceMap[moodLabel] || adviceMap.calm;
  if (weather.hasRain) return advice.rain;
  if (weather.current?.temp > 35) return advice.hot;
  return advice.sunny;
}

// ============================================================
// 6. 暴雨触发 → 行程调整
// ============================================================

/**
 * 检测今天是否需要调整行程
 * @returns {{ needAdjust: boolean, reason: string, replacementStrategy: string }}
 */
function checkWeatherAdjustment(weather, dayIndex) {
  const dayForecast = weather.forecasts?.[dayIndex];
  if (!dayForecast) return { needAdjust: false };

  const isRain = isRainCode(dayForecast.iconDay) || isRainText(dayForecast.textDay);
  const hasWarning = weather.warnings?.some(w =>
    w.type === '暴雨' && (w.level === '橙色' || w.level === '红色')
  );

  if (hasWarning) {
    return {
      needAdjust: true,
      severity: 'critical',
      reason: `${dayForecast.textDay} + ${weather.warnings.find(w => w.type === '暴雨').level}预警`,
      replacementStrategy: 'ALL_INDOOR' // 全部切换为室内
    };
  }

  if (isRain) {
    return {
      needAdjust: true,
      severity: 'moderate',
      reason: dayForecast.textDay,
      replacementStrategy: 'INDOOR_FIRST' // 优先室内
    };
  }

  return { needAdjust: false };
}

// ============================================================
// 7. 辅助函数
// ============================================================

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// ============================================================
// 8. 导出
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWeather,
    checkWeatherAdjustment,
    getMoodWeatherAdvice,
    isRainCode,
    isRainText
  };
}