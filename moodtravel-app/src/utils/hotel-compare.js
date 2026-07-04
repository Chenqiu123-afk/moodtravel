/**
 * 酒店比价引擎
 * =============
 * 根据用户预算 + 心情 + 同行结构，推荐最合适的酒店
 * 自动比较各平台价格，标注"为您节省XX元"
 */

// ============================================================
// 1. 模拟平台比价数据
// ============================================================
const MOCK_PLATFORMS = ['携程', '美团', '飞猪', '去哪儿', '同程'];
const PRICE_VARIATION = 0.15; // 平台间价格波动 ±15%

function generatePlatformPrices(basePrice) {
  const prices = MOCK_PLATFORMS.map(platform => {
    const variation = 1 + (Math.random() - 0.5) * 2 * PRICE_VARIATION;
    return {
      platform,
      price: Math.round(basePrice * variation)
    };
  });
  // 确保有一个最低价
  prices.sort((a, b) => a.price - b.price);
  return prices;
}

// ============================================================
// 2. 酒店服务与心情匹配
// ============================================================
const FACILITY_MOOD_BONUS = {
  tired:   { has_spa: 15, has_restaurant: 5, has_pool: 5 },
  excited: { has_gym: 10, has_pool: 10, has_restaurant: 5 },
  sad:     { has_spa: 10, has_restaurant: 5 },
  anxious: { has_spa: 10 },
  calm:    { has_spa: 8, has_restaurant: 5, has_gym: 3 },
  happy:   { has_restaurant: 8, has_pool: 8, has_gym: 5 }
};

// ============================================================
// 3. 主函数：推荐酒店
// ============================================================

/**
 * @param {Array}  hotels - 酒店列表
 * @param {Object} options
 * @param {number} options.budget - 每日预算
 * @param {string} options.moodLabel - 心情标签
 * @param {boolean} options.hasKids - 是否带小孩
 * @param {boolean} options.hasElderly - 是否带老人
 * @param {boolean} options.budgetSensitive - 是否预算敏感
 * @param {number} options.topN - 返回前 N 个
 * @returns {Array} 排序后的酒店列表，每个含 bestPrice / savedAmount
 */
function recommendHotels(hotels, options = {}) {
  const {
    budget = 1000,
    moodLabel = 'calm',
    hasKids = false,
    hasElderly = false,
    budgetSensitive = false,
    topN = 3
  } = options;

  const moodBonus = FACILITY_MOOD_BONUS[moodLabel] || {};

  // 为每个酒店生成平台比价
  const enriched = hotels.map(hotel => {
    const basePrice = hotel.priceRangeLow || hotel.priceRangeHigh || 500;
    const platformPrices = generatePlatformPrices(basePrice);
    const bestDeal = platformPrices[0];
    const rackRate = Math.max(...platformPrices.map(p => p.price));
    const savedAmount = rackRate - bestDeal.price;

    // 评分
    let score = 0;

    // 价格匹配（预算敏感时权重更高）
    const priceRatio = bestDeal.price / budget;
    if (priceRatio <= 0.3) score += 30;
    else if (priceRatio <= 0.5) score += 25;
    else if (priceRatio <= 0.8) score += 20;
    else if (priceRatio <= 1.2) score += 15;
    else score += 5;

    if (budgetSensitive) score *= 1.5; // 预算敏感时价格权重翻倍

    // 心情匹配
    if (hotel.moodScores && hotel.moodScores[moodLabel]) {
      score += hotel.moodScores[moodLabel] * 3;
    }

    // 设施匹配
    for (const [facility, bonus] of Object.entries(moodBonus)) {
      if (hotel[facility]) score += bonus;
    }

    // 亲子
    if (hasKids && hotel.kidsFriendly) score += 20;
    // 老人
    if (hasElderly && hotel.elderlyFriendly) score += 20;

    // 评分
    score += (hotel.rating || 3.5) * 5;

    // 省钱加分
    if (savedAmount > 0) score += Math.min(savedAmount / 10, 15);

    return {
      ...hotel,
      platformPrices,
      bestPrice: bestDeal.price,
      bestPlatform: bestDeal.platform,
      savedAmount,
      _score: score
    };
  });

  // 排序
  enriched.sort((a, b) => b._score - a._score);

  return enriched.slice(0, topN);
}

// ============================================================
// 4. 省钱文案生成
// ============================================================

function generateSavingsMessage(hotel) {
  if (!hotel.savedAmount || hotel.savedAmount <= 0) {
    return '当前价格已是全网最低';
  }
  return `比价 ${MOCK_PLATFORMS.length} 个平台，${hotel.bestPlatform} 最低 ¥${hotel.bestPrice}，为您节省 ¥${hotel.savedAmount}`;
}

// ============================================================
// 5. 总分省钱汇总
// ============================================================

function calculateTotalSavings(hotels) {
  const totalSaved = hotels.reduce((sum, h) => sum + (h.savedAmount || 0), 0);
  const totalBest = hotels.reduce((sum, h) => sum + (h.bestPrice || 0), 0);
  return {
    hotelCount: hotels.length,
    totalBestPrice: totalBest,
    totalSaved,
    message: totalSaved > 0
      ? `🏨 ${hotels.length} 晚酒店，比价全网最低：¥${totalBest}，为您节省 ¥${totalSaved}`
      : '🏨 当前价格已是全网最低'
  };
}

// ============================================================
// 6. 导出
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    recommendHotels,
    generateSavingsMessage,
    calculateTotalSavings
  };
}