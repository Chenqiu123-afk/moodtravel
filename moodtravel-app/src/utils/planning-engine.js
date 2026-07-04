/**
 * MoodTravel 多维规划引擎
 * ========================
 * 将用户心情 + 现实约束 + 动态天气 → 精确到小时的行程单
 *
 * 4 层漏斗：硬性过滤 → 多维评分 → 冲突解决 → 输出生成
 */

// ============================================================
// 1. 权重矩阵 —— 不同场景自动调整
// ============================================================
const WEIGHT_MATRIX = {
  // 格式：{ mood, budget, energy, crowd, kid, elderly, diet }
  'tired_solo':     { mood: 0.35, budget: 0.15, energy: 0.30, crowd: 0.15, kid: 0, elderly: 0, diet: 0.05 },
  'tired_kids':     { mood: 0.30, budget: 0.10, energy: 0.25, crowd: 0.15, kid: 0.15, elderly: 0, diet: 0.05 },
  'tired_elderly':  { mood: 0.25, budget: 0.15, energy: 0.30, crowd: 0.15, kid: 0, elderly: 0.10, diet: 0.05 },
  'excited_couple': { mood: 0.25, budget: 0.10, energy: 0.05, crowd: 0.05, kid: 0, elderly: 0, diet: 0.05 },
  'excited_solo':   { mood: 0.20, budget: 0.15, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, diet: 0 },
  'sad_kids':       { mood: 0.30, budget: 0.10, energy: 0.15, crowd: 0.20, kid: 0.20, elderly: 0, diet: 0.05 },
  'sad_solo':       { mood: 0.35, budget: 0.15, energy: 0.20, crowd: 0.20, kid: 0, elderly: 0, diet: 0.10 },
  'anxious_diet':   { mood: 0.25, budget: 0.15, energy: 0.20, crowd: 0.15, kid: 0, elderly: 0, diet: 0.25 },
  'anxious_solo':   { mood: 0.30, budget: 0.15, energy: 0.20, crowd: 0.25, kid: 0, elderly: 0, diet: 0.10 },
  'happy_budget':   { mood: 0.15, budget: 0.35, energy: 0.10, crowd: 0.05, kid: 0, elderly: 0, diet: 0.05 },
  'calm_family':    { mood: 0.20, budget: 0.15, energy: 0.15, crowd: 0.15, kid: 0.20, elderly: 0, diet: 0.15 },
  'default':        { mood: 0.25, budget: 0.20, energy: 0.15, crowd: 0.15, kid: 0.10, elderly: 0.05, diet: 0.10 }
};

// ============================================================
// 2. 心情 → 体力消耗映射
// ============================================================
const MOOD_ENERGY_MAP = {
  excited: { ideal: 4, range: [2, 5] },  // 兴奋 → 高体力
  happy:   { ideal: 3, range: [2, 4] },
  calm:    { ideal: 2, range: [1, 4] },
  anxious: { ideal: 2, range: [1, 3] },
  tired:   { ideal: 1, range: [1, 2] },  // 疲惫 → 低体力
  sad:     { ideal: 1, range: [1, 3] }   // 低落 → 低体力
};

// ============================================================
// 3. 场景 → 权重键映射
// ============================================================
function getWeightKey(moodLabel, companionTypes) {
  const hasKid = companionTypes.some(c => c.role === 'child' && c.age < 12);
  const hasElderly = companionTypes.some(c => c.age >= 60);
  const key = `${moodLabel}_${hasKid ? 'kids' : hasElderly ? 'elderly' : 'solo'}`;
  return WEIGHT_MATRIX[key] || WEIGHT_MATRIX.default;
}

// ============================================================
// 4. 主函数：生成行程
// ============================================================

/**
 * @param {Object} trip - 行程配置
 * @param {Object} trip.user - 用户信息
 * @param {string} trip.user.moodLabel - excited/happy/calm/anxious/tired/sad
 * @param {number} trip.user.moodIndex - 1-10
 * @param {Array}  trip.user.companions - [{role, age}]
 * @param {number} trip.budget - 总预算
 * @param {number} trip.days - 行程天数
 * @param {string} trip.destination - 城市名
 * @param {boolean} trip.isDieting - 是否减肥
 * @param {boolean} trip.budgetSensitive - 是否预算敏感
 * @param {Array} trip.dietaryTags - ['lowFat', 'halal']
 * @param {Object} trip.weather - 天气数据
 * @param {Array}  pois - 景点列表
 * @param {Array}  restaurants - 餐厅列表
 * @param {Array}  hotels - 酒店列表
 * @returns {Object} { itinerary: [...], stats: {...} }
 */
function generateItinerary(trip, pois, restaurants, hotels) {
  const {
    user: { moodLabel, moodIndex, companions },
    budget, days, isDieting, budgetSensitive, dietaryTags, weather
  } = trip;

  // ---- 4.1 确定权重矩阵 ----
  const weights = getWeightKey(moodLabel, companions);
  const dailyBudget = budget / days;
  const hasKids = companions.some(c => c.role === 'child' && c.age < 12);
  const hasElderly = companions.some(c => c.age >= 60);
  const youngestChildAge = hasKids
    ? Math.min(...companions.filter(c => c.role === 'child').map(c => c.age))
    : Infinity;

  // ---- 4.2 第 1 层：硬性过滤 ----
  const candidates = pois.filter(poi => {
    // 预算过滤
    if (poi.ticketPrice > dailyBudget * 0.4) return false;
    // 天气过滤：雨天排除户外
    if (weather && weather.isRain && poi.weatherSensitivity === 'outdoor') return false;
    if (weather && weather.isRain && poi.weatherSensitivity === 'mixed') {
      poi._weatherNote = '雨天，部分户外区域可能受影响';
    }
    // 亲子过滤
    if (hasKids && !poi.kidsFriendly) return false;
    if (hasKids && poi.minAge && poi.minAge > youngestChildAge) return false;
    // 老人过滤
    if (hasElderly && !poi.elderlyFriendly && poi.energyLevel >= 4) return false;
    // 减肥过滤
    if (isDieting && poi.category === 'restaurant' && !poi.isDietFriendly) return false;
    return true;
  });

  // ---- 4.3 第 2 层：多维评分 ----
  const energyIdeal = MOOD_ENERGY_MAP[moodLabel].ideal;

  const scored = candidates.map(poi => {
    // 心情匹配度
    const moodScore = (poi.moodScores[moodLabel] || 5) / 10 * weights.mood * 100;

    // 预算匹配度
    const budgetRatio = dailyBudget > 0 ? Math.min(poi.ticketPrice / dailyBudget, 1) : 0;
    const budgetScore = (1 - budgetRatio) * weights.budget * 100;

    // 体力消耗匹配度（越接近理想值越好）
    const energyDiff = Math.abs(poi.energyLevel - energyIdeal);
    const energyScore = (1 - energyDiff / 4) * weights.energy * 100;

    // 拥挤回避度（心情差 → 越不拥挤越好）
    const crowdednessScore = (5 - poi.crowdednessLevel) / 4 * weights.crowd * 100;

    // 亲子友好度
    const kidScore = hasKids ? (poi.kidsFriendly ? weights.kid * 100 : 0) : 0;

    // 老人友好度
    const elderlyScore = hasElderly ? (poi.elderlyFriendly ? weights.elderly * 100 : 0) : 0;

    // 饮食匹配度
    let dietScore = 0;
    if (isDieting && poi.category === 'restaurant') {
      dietScore = poi.isDietFriendly ? weights.diet * 100 : 0;
    }
    if (dietaryTags && dietaryTags.length > 0 && poi.category === 'restaurant') {
      const matchCount = dietaryTags.filter(t => poi.dietaryTags?.includes(t)).length;
      dietScore = (matchCount / dietaryTags.length) * weights.diet * 100;
    }

    const totalScore = moodScore + budgetScore + energyScore + crowdednessScore + kidScore + elderlyScore + dietScore;

    return {
      ...poi,
      _scores: { moodScore, budgetScore, energyScore, crowdednessScore, kidScore, elderlyScore, dietScore },
      _totalScore: totalScore
    };
  });

  // 排序
  scored.sort((a, b) => b._totalScore - a._totalScore);

  // ---- 4.4 第 3 层：冲突解决 + 行程编排 ----
  const itinerary = [];
  const usedPoiIds = new Set();

  for (let day = 1; day <= days; day++) {
    const dayItems = [];

    // 选取当天景点（每天 4-5 个核心景点）
    const maxPerDay = moodIndex <= 3 ? 4 : 5; // 心情差 → 少排景点
    const dayPois = [];
    for (const poi of scored) {
      if (dayPois.length >= maxPerDay) break;
      if (!usedPoiIds.has(poi.id)) {
        usedPoiIds.add(poi.id);
        dayPois.push(poi);
      }
    }

    // 检查多样性：确保至少 3 种不同 category
    const categories = new Set(dayPois.map(p => p.category));
    if (categories.size < 2 && dayPois.length >= 3) {
      // 替换最后一个同类 POI
      for (const poi of scored) {
        if (!usedPoiIds.has(poi.id) && !categories.has(poi.category)) {
          usedPoiIds.delete(dayPois[dayPois.length - 1].id);
          dayPois[dayPois.length - 1] = poi;
          usedPoiIds.add(poi.id);
          categories.add(poi.category);
          break;
        }
      }
    }

    // 插入餐厅
    const dayRestaurants = findNearbyRestaurants(dayPois, restaurants, dietaryTags, isDieting);

    // 编排时间
    const timeSlots = arrangeTimeSlots(dayPois, dayRestaurants, moodLabel, moodIndex);

    dayItems.push(...timeSlots);
    itinerary.push({ day, items: dayItems });
  }

  // 选择酒店
  const hotel = selectHotel(hotels, { budget: dailyBudget, moodLabel, hasKids, hasElderly });

  // ---- 4.5 第 4 层：计算统计 ----
  let totalCost = 0;
  let totalSaved = 0;
  itinerary.forEach(day => {
    day.items.forEach(item => {
      totalCost += item.estimatedCost || 0;
      totalSaved += item.savedAmount || 0;
    });
  });

  return {
    itinerary,
    hotel,
    stats: {
      totalCost,
      totalSaved,
      totalPois: usedPoiIds.size,
      moodLabel,
      weights,
      filterStats: {
        total: pois.length,
        passed: candidates.length,
        selected: usedPoiIds.size
      }
    }
  };
}

// ============================================================
// 5. 辅助函数
// ============================================================

/** 为每个景点找最近的餐厅 */
function findNearbyRestaurants(dayPois, restaurants, dietaryTags, isDieting) {
  const result = [];
  for (const poi of dayPois) {
    const nearby = restaurants
      .filter(r => {
        // 距离筛选
        if (r.nearestPoiDistance && r.nearestPoiDistance > 2000) return false;
        // 饮食筛选
        if (isDieting && !r.isDietFriendly) return false;
        if (dietaryTags && dietaryTags.length > 0) {
          const match = dietaryTags.some(t => r.dietaryTags?.includes(t));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => (a.nearestPoiDistance || 9999) - (b.nearestPoiDistance || 9999))
      .slice(0, 2);
    result.push({
      poi,
      restaurants: nearby
    });
  }
  return result;
}

/** 编排时间槽 */
function arrangeTimeSlots(dayPois, dayRestaurants, moodLabel, moodIndex) {
  const slots = [];
  const baseHour = 9; // 9:00 开始
  const hoursPerPoi = 1.5;

  // 心情差 → 每个景点多给 30 分钟
  const extraTime = moodIndex <= 3 ? 0.5 : 0;
  const totalDuration = (hoursPerPoi + extraTime) * dayPois.length;

  // 午餐时间
  const lunchIndex = 2; // 在第 3 个景点后插入午餐
  // 是否插入休息
  const needRest = moodIndex <= 3;

  let currentHour = baseHour;
  dayPois.forEach((poi, i) => {
    // 插入休息
    if (needRest && i === 2) {
      slots.push({
        type: 'rest',
        time: formatTime(currentHour),
        endTime: formatTime(currentHour + 0.5),
        name: '☕ 休息时间',
        desc: '根据当前心情，安排半小时休息',
        estimatedCost: 30,
        estimatedDuration: 30,
        reason: '疲惫模式：自动插入休息点',
        reasonTags: ['心情匹配', '体力保护']
      });
      currentHour += 0.5;
    }

    // 景点
    const duration = hoursPerPoi + extraTime;
    const reason = generateReason(poi, moodLabel, poi._scores);
    slots.push({
      type: 'poi',
      time: formatTime(currentHour),
      endTime: formatTime(currentHour + duration),
      name: poi.name,
      desc: poi.desc || '',
      category: poi.category,
      estimatedCost: poi.ticketPrice || 0,
      estimatedDuration: Math.round(duration * 60),
      energyLevel: poi.energyLevel,
      weatherSensitivity: poi.weatherSensitivity,
      kidsFriendly: poi.kidsFriendly,
      reason,
      reasonTags: generateReasonTags(poi, moodLabel, poi._scores),
      _scores: poi._scores,
      _totalScore: poi._totalScore
    });
    currentHour += duration;

    // 插入午餐
    if (i === lunchIndex) {
      const lunchRestaurant = dayRestaurants.find(r => r.poi === poi);
      if (lunchRestaurant && lunchRestaurant.restaurants.length > 0) {
        const best = lunchRestaurant.restaurants[0];
        slots.push({
          type: 'restaurant',
          time: formatTime(currentHour),
          endTime: formatTime(currentHour + 1),
          name: best.name,
          desc: best.cuisine + ' · 人均 ¥' + best.avgCost,
          estimatedCost: best.avgCost * 1.5, // 按1.5人份
          estimatedDuration: 60,
          isDietFriendly: best.isDietFriendly,
          dietaryTags: best.dietaryTags,
          avgCalories: best.avgCalories,
          tags: best.tags,
          reason: best.isDietFriendly ? '根据减肥需求推荐低卡餐食' : '距景点最近的高评分餐厅',
          reasonTags: best.isDietFriendly ? ['饮食匹配', '低卡健康'] : ['位置便利', '高评分']
        });
        currentHour += 1;
      }
    }
  });

  return slots;
}

/** 格式化时间 */
function formatTime(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 生成推荐理由 */
function generateReason(poi, moodLabel, scores) {
  const reasons = [];
  if (scores.moodScore > 25) reasons.push('当前心情高度匹配');
  else if (scores.moodScore > 15) reasons.push('适合当前心情状态');
  if (scores.budgetScore > 15) {
    if (poi.ticketPrice === 0) reasons.push('免费景点，零预算压力');
    else reasons.push('低价高性价比');
  }
  if (scores.energyScore > 20) reasons.push('体力消耗符合当前状态');
  if (scores.kidScore > 15) reasons.push('亲子游首选目的地');
  if (scores.elderlyScore > 8) reasons.push('适合老人出行');
  return reasons.join('；') || '综合匹配推荐';
}

/** 生成推荐标签 */
function generateReasonTags(poi, moodLabel, scores) {
  const tags = [];
  if (scores.moodScore > 20) tags.push('心情匹配');
  if (scores.budgetScore > 15) tags.push(poi.ticketPrice === 0 ? '免费景点' : '高性价比');
  if (scores.energyScore > 15) tags.push('体力友好');
  if (scores.crowdednessScore > 15) tags.push('避开拥挤');
  if (scores.kidScore > 10) tags.push('亲子推荐');
  if (scores.dietScore > 10) tags.push('低卡健康');
  return tags;
}

/** 选择酒店 */
function selectHotel(hotels, options) {
  const { budget, moodLabel, hasKids, hasElderly } = options;

  const candidates = hotels
    .filter(h => h.priceRangeLow <= budget * 2) // 酒店预算不超过日预算 2 倍
    .map(h => {
      let score = 0;
      // 心情匹配
      score += (h.moodScores[moodLabel] || 5) * 3;
      // 预算匹配
      const priceRatio = h.priceRangeLow / budget;
      if (priceRatio <= 0.5) score += 30;
      else if (priceRatio <= 1) score += 20;
      else if (priceRatio <= 1.5) score += 10;
      // 亲子
      if (hasKids && h.kidsFriendly) score += 20;
      // 老人
      if (hasElderly && h.elderlyFriendly) score += 20;
      // 评分
      score += h.rating * 5;
      // 比价节省
      if (h.savedAmount) score += Math.min(h.savedAmount / 10, 15);

      return { ...h, _score: score };
    })
    .sort((a, b) => b._score - a._score);

  const best = candidates[0];
  if (!best) return null;

  return {
    id: best.id,
    name: best.name,
    price: best.bestPrice || best.priceRangeLow,
    savedAmount: best.savedAmount || 0,
    bestPlatform: best.bestPlatform || '',
    rating: best.rating,
    reason: generateHotelReason(best, moodLabel, budget)
  };
}

function generateHotelReason(hotel, moodLabel, budget) {
  const reasons = [];
  if (hotel.moodScores[moodLabel] >= 8) reasons.push('当前心情高度匹配');
  if (hotel.priceRangeLow <= budget * 0.5) reasons.push('预算友好');
  if (hotel.savedAmount > 0) reasons.push('比价为您节省 ¥' + hotel.savedAmount);
  if (hotel.rating >= 4.5) reasons.push('高评分推荐');
  return reasons.join('；') || '综合推荐';
}

// ============================================================
// 6. 导出
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateItinerary, WEIGHT_MATRIX, MOOD_ENERGY_MAP };
}