/**
 * 旅心流 · 行程推荐引擎
 * ======================
 * 根据用户心情 + 现实约束，生成带权重的景点推荐列表。
 *
 * 输入参数：
 *   moodIndex  - 心情指数 1-10（1=极差, 10=极好）
 *   budgetMax  - 预算上限（元）
 *   hasKids    - 是否带小孩
 *   isDieting  - 是否减肥中
 *
 * 输出：
 *   { score, name, reason, tags }[] 按推荐度降序排列
 */

// ============ 1. POI 数据库（Mock） ============

const POI_DATABASE = [
  // ---- 治愈放松类（低心情友好） ----
  {
    id: 'spa_01', name: '悦榕庄SPA水疗', category: 'spa',
    minCost: 480, maxCost: 880,
    moodScore: { sad: 9.5, anxious: 9.0, tired: 9.5, calm: 7.0, happy: 2.0, excited: 1.0 },
    energy: 1, isIndoor: true, kidsOk: false, dietOk: true,
    tags: ['高端放松', '室内', '治愈'],
    desc: '90分钟热石精油按摩，彻底放松身心'
  },
  {
    id: 'spa_02', name: '泰式古法按摩', category: 'spa',
    minCost: 198, maxCost: 298,
    moodScore: { sad: 8.5, anxious: 8.0, tired: 9.0, calm: 6.5, happy: 2.5, excited: 1.5 },
    energy: 1, isIndoor: true, kidsOk: false, dietOk: true,
    tags: ['性价比', '放松', '室内'],
    desc: '60分钟泰式拉伸，缓解肌肉疲劳'
  },
  {
    id: 'hotel_lux', name: '安缦法云精品酒店', category: 'hotel',
    minCost: 3800, maxCost: 5800,
    moodScore: { sad: 9.8, anxious: 9.5, tired: 9.0, calm: 7.0, happy: 3.0, excited: 1.0 },
    energy: 1, isIndoor: true, kidsOk: false, dietOk: true,
    tags: ['顶级奢华', '隐居', '包场体验'],
    desc: '藏在灵隐寺旁的顶级度假酒店，一房一景'
  },
  {
    id: 'hotel_std', name: '全季酒店（西湖店）', category: 'hotel',
    minCost: 350, maxCost: 500,
    moodScore: { sad: 7.0, anxious: 6.5, tired: 7.5, calm: 7.0, happy: 5.0, excited: 3.0 },
    energy: 1, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['舒适', '性价比', '连锁品牌'],
    desc: '干净舒适，位置便利，熟睡体验'
  },

  // ---- 亲子类（kids 优先） ----
  {
    id: 'park_disney', name: '迪士尼乐园', category: 'theme_park',
    minCost: 399, maxCost: 799,
    moodScore: { sad: 3.0, anxious: 2.0, tired: 2.0, calm: 5.0, happy: 9.5, excited: 10 },
    energy: 4, isIndoor: false, kidsOk: true, dietOk: true,
    tags: ['亲子必去', '户外', '高人气'],
    desc: '全天候童话世界，花车巡游+烟花秀'
  },
  {
    id: 'park_zoo', name: '杭州野生动物世界', category: 'theme_park',
    minCost: 180, maxCost: 220,
    moodScore: { sad: 3.5, anxious: 2.5, tired: 3.0, calm: 5.5, happy: 8.0, excited: 8.5 },
    energy: 3, isIndoor: false, kidsOk: true, dietOk: true,
    tags: ['亲子友好', '户外', '动物互动'],
    desc: '近距离接触大熊猫、长颈鹿、羊驼'
  },
  {
    id: 'restaurant_family', name: '海底捞亲子餐厅', category: 'restaurant',
    minCost: 150, maxCost: 300,
    moodScore: { sad: 4.0, anxious: 4.0, tired: 4.0, calm: 6.0, happy: 8.0, excited: 8.0 },
    energy: 1, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['亲子餐厅', '室内', '服务好'],
    desc: '儿童套餐+游乐区，大人安心吃火锅'
  },

  // ---- 减肥友好类 ----
  {
    id: 'food_salad', name: 'Wagas轻食沙拉', category: 'restaurant',
    minCost: 55, maxCost: 88,
    moodScore: { sad: 5.0, anxious: 5.0, tired: 5.5, calm: 6.5, happy: 6.0, excited: 5.0 },
    energy: 1, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['低卡', '高蛋白', '减肥友好'],
    desc: '鸡胸肉藜麦沙拉碗，约380大卡'
  },
  {
    id: 'food_steam', name: '蒸年轻·蒸汽海鲜', category: 'restaurant',
    minCost: 80, maxCost: 150,
    moodScore: { sad: 5.0, anxious: 5.5, tired: 5.5, calm: 6.0, happy: 7.0, excited: 6.0 },
    energy: 1, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['低脂', '蒸菜', '减肥友好'],
    desc: '无油蒸制，保留食材原味，低卡高蛋白'
  },

  // ---- 兴奋活力类（高心情） ----
  {
    id: 'adventure_bungee', name: '蹦极体验（富阳基地）', category: 'adventure',
    minCost: 280, maxCost: 380,
    moodScore: { sad: 0.5, anxious: 0.5, tired: 0.5, calm: 3.0, happy: 8.0, excited: 9.8 },
    energy: 5, isIndoor: false, kidsOk: false, dietOk: true,
    tags: ['极限运动', '户外', '肾上腺素'],
    desc: '从50米高台纵身一跃，体验自由落体'
  },
  {
    id: 'night_bar', name: '南山路精酿酒吧', category: 'nightlife',
    minCost: 100, maxCost: 250,
    moodScore: { sad: 1.0, anxious: 0.5, tired: 1.0, calm: 4.0, happy: 8.0, excited: 9.0 },
    energy: 2, isIndoor: true, kidsOk: false, dietOk: false,
    tags: ['夜生活', '社交', '精酿啤酒'],
    desc: '杭州夜生活地标，现场音乐+手工精酿'
  },

  // ---- 文化类（通用） ----
  {
    id: 'museum_tea', name: '中国茶叶博物馆', category: 'museum',
    minCost: 0, maxCost: 0,
    moodScore: { sad: 7.0, anxious: 8.0, tired: 6.0, calm: 9.0, happy: 7.0, excited: 3.0 },
    energy: 2, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['文化', '室内', '免费'],
    desc: '茶文化千年历史，免费品茶体验'
  },
  {
    id: 'temple_lingyin', name: '灵隐寺', category: 'temple',
    minCost: 75, maxCost: 75,
    moodScore: { sad: 7.5, anxious: 8.5, tired: 6.0, calm: 9.0, happy: 7.0, excited: 4.0 },
    energy: 3, isIndoor: false, kidsOk: true, dietOk: true,
    tags: ['心灵治愈', '文化地标', '户外'],
    desc: '千年古刹，晨钟暮鼓，祈福静心'
  },
  {
    id: 'bookstore', name: '猫的天空之城 概念书店', category: 'cafe',
    minCost: 30, maxCost: 60,
    moodScore: { sad: 9.0, anxious: 8.0, tired: 7.5, calm: 8.5, happy: 6.0, excited: 2.0 },
    energy: 1, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['安静', '治愈', '室内'],
    desc: '安静看书、写明信片、撸猫，一个人也很舒服'
  },
  {
    id: 'lake_walk', name: '西湖漫步', category: 'scenic',
    minCost: 0, maxCost: 0,
    moodScore: { sad: 8.0, anxious: 6.0, tired: 7.0, calm: 9.0, happy: 8.0, excited: 6.0 },
    energy: 2, isIndoor: false, kidsOk: true, dietOk: true,
    tags: ['免费', '自然', '户外'],
    desc: '柳浪闻莺，看夕阳西下，放空发呆'
  },
  {
    id: 'cycling_sudi', name: '苏堤骑行', category: 'sport',
    minCost: 20, maxCost: 50,
    moodScore: { sad: 4.0, anxious: 3.0, tired: 3.0, calm: 6.0, happy: 8.5, excited: 8.0 },
    energy: 4, isIndoor: false, kidsOk: true, dietOk: true,
    tags: ['户外', '运动', '拍照'],
    desc: '沿苏堤骑行，穿梭六桥，看三潭印月'
  },
  {
    id: 'garden_tea', name: '郭庄园林下午茶', category: 'cafe',
    minCost: 60, maxCost: 120,
    moodScore: { sad: 7.5, anxious: 7.0, tired: 6.0, calm: 9.0, happy: 7.0, excited: 3.5 },
    energy: 1, isIndoor: true, kidsOk: true, dietOk: true,
    tags: ['园林', '下午茶', '安静'],
    desc: '江南园林里喝下午茶，亭台楼阁水榭回廊'
  }
];

// ============ 2. 心情标签映射 ============

function getMoodLabel(moodIndex) {
  if (moodIndex >= 8) return 'excited';
  if (moodIndex >= 6) return 'happy';
  if (moodIndex >= 4) return 'calm';
  if (moodIndex >= 3) return 'anxious';
  if (moodIndex >= 2) return 'tired';
  return 'sad';
}

// ============ 3. 核心推荐引擎 ============

/**
 * 行程推荐引擎
 *
 * 算法逻辑分为 4 层：
 *   第 1 层：硬性过滤（预算、小孩安全、减肥限制）
 *   第 2 层：心情匹配度评分（权重 40%）
 *   第 3 层：专项加权（小孩/减肥/心情状态 各 20%）
 *   第 4 层：降序排序 + 多样性去重
 */
function recommend({
  moodIndex = 5,
  budgetMax = 3000,
  hasKids = false,
  isDieting = false
}) {
  const moodLabel = getMoodLabel(moodIndex);

  // ---- 第 1 层：硬性过滤 ----
  const candidates = POI_DATABASE.filter(poi => {
    // 预算过滤
    if (poi.minCost > budgetMax) return false;
    // 有小孩时，排除不适合小孩的项目
    if (hasKids && !poi.kidsOk) return false;
    // 减肥时，排除与减肥冲突的项目（如酒吧）
    if (isDieting && !poi.dietOk) return false;
    return true;
  });

  // ---- 第 2 层 + 第 3 层：多维加权打分 ----
  const scored = candidates.map(poi => {
    // 2.1 心情匹配度（权重 40%）
    const moodScore = poi.moodScore[moodLabel] || 5.0;

    // 2.2 预算匹配度（权重 10%）
    // 价格越接近预算上限的 50% 越理想（既不太贵也不廉价）
    const idealPrice = budgetMax * 0.35;
    const priceScore = 10 - Math.min(10, Math.abs(poi.minCost - idealPrice) / idealPrice * 10);

    // 2.3 精力匹配度（权重 10%）
    // 心情越低，越需要低精力消耗的活动
    let energyScore;
    if (moodIndex <= 3) {
      // 心情差 → 体力消耗越低越好
      energyScore = (5 - poi.energy) * 2 + 2;
    } else if (moodIndex >= 8) {
      // 心情好 → 体力消耗越高越好（追求刺激）
      energyScore = poi.energy * 2;
    } else {
      // 中等心情 → 中等体力消耗最好
      energyScore = 10 - Math.abs(poi.energy - 3) * 2.5;
    }
    energyScore = Math.max(0, Math.min(10, energyScore));

    // ---- 专项加权 ----

    // 3.1 带孩子加成（权重 20%）
    let kidScore = 5; // 默认中性
    if (hasKids) {
      // 有小孩：亲子友好项加分，主题乐园/动物园/亲子餐厅大幅加分
      if (poi.category === 'theme_park') kidScore = 10;
      else if (poi.tags.includes('亲子友好') || poi.tags.includes('亲子必去')) kidScore = 9;
      else if (poi.tags.includes('亲子餐厅')) kidScore = 8;
      else if (poi.kidsOk) kidScore = 6;
      else kidScore = 0; // 已在上层过滤，此分支不会到达
    }

    // 3.2 减肥需求加成（权重 10%）
    let dietScore = 5;
    if (isDieting) {
      if (poi.tags.includes('减肥友好')) dietScore = 10;
      else if (poi.tags.includes('低卡') || poi.tags.includes('低脂')) dietScore = 9;
      else if (poi.tags.includes('高蛋白')) dietScore = 8;
      else if (poi.dietOk) dietScore = 5;
      else dietScore = 0; // 已在过滤层排除
    }

    // 3.3 心情极值特殊策略（权重 10%）
    // 心情极差（1-2）→ 强制偏好治愈/放松类
    // 心情极好（9-10）→ 强制偏好刺激/社交类
    let extremeBonus = 0;
    if (moodIndex <= 2) {
      if (poi.tags.includes('治愈') || poi.tags.includes('放松')) extremeBonus = 3;
      if (poi.category === 'spa' || poi.category === 'hotel') extremeBonus += 2;
    }
    if (moodIndex >= 9) {
      if (poi.tags.includes('极限运动') || poi.tags.includes('夜生活')) extremeBonus = 3;
      if (poi.category === 'adventure' || poi.category === 'nightlife') extremeBonus += 2;
    }

    // ---- 综合得分 ----
    const totalScore = moodScore * 0.40
                     + priceScore * 0.10
                     + energyScore * 0.10
                     + kidScore * 0.20
                     + dietScore * 0.10
                     + extremeBonus * 0.10;

    return {
      ...poi,
      score: Math.round(totalScore * 100) / 100,
      breakdown: { moodScore, priceScore, energyScore, kidScore, dietScore, extremeBonus },
      reason: generateReason(poi, moodLabel, hasKids, isDieting, moodIndex)
    };
  });

  // ---- 第 4 层：排序 + 多样性保障 ----
  scored.sort((a, b) => b.score - a.score);

  // 防止结果全是同一类型：确保至少 3 种不同 category
  const diverse = [];
  const seenCategories = new Set();
  for (const item of scored) {
    if (diverse.length >= 10) break;
    if (seenCategories.size < 3 || seenCategories.has(item.category)) {
      diverse.push(item);
      seenCategories.add(item.category);
    }
  }
  // 如果还不够 3 种，从剩余结果中补充
  if (seenCategories.size < 3) {
    for (const item of scored) {
      if (!diverse.includes(item)) {
        diverse.push(item);
        seenCategories.add(item.category);
        if (seenCategories.size >= 3 && diverse.length >= 5) break;
      }
    }
  }

  return diverse;
}

// ============ 4. 推荐理由生成器 ============

function generateReason(poi, moodLabel, hasKids, isDieting, moodIndex) {
  const reasons = [];

  // 心情相关
  if (poi.moodScore[moodLabel] >= 9) {
    reasons.push('当前心情高度匹配');
  } else if (poi.moodScore[moodLabel] >= 7) {
    reasons.push('适合当前心情状态');
  }

  // 预算相关
  if (poi.minCost === 0) {
    reasons.push('免费景点，零预算压力');
  } else if (poi.minCost <= 100) {
    reasons.push('低价高性价比');
  }

  // 体力相关
  if (poi.energy === 1) {
    reasons.push(moodIndex <= 3 ? '几乎零体力消耗，适合低能量状态' : '轻松不累');
  } else if (poi.energy === 5) {
    reasons.push(moodIndex >= 8 ? '高能量活动，匹配兴奋状态' : '体力消耗较大，需量力而行');
  }

  // 带孩子
  if (hasKids && poi.kidsOk) {
    if (poi.tags.includes('亲子必去')) reasons.push('亲子游首选目的地');
    else if (poi.tags.includes('亲子友好')) reasons.push('适合带小朋友');
    else reasons.push('儿童友好，安全可靠');
  }

  // 减肥
  if (isDieting && poi.tags.includes('减肥友好')) {
    reasons.push('低卡健康之选，约350-400大卡');
  } else if (isDieting && poi.dietOk) {
    reasons.push('符合减肥饮食要求');
  }

  return reasons.join('；') || '综合推荐';
}

// ============ 5. 测试用例 ============

function runTests() {
  const testCases = [
    {
      name: '心情极差 + 高预算 → 优先SPA和高端酒店',
      input: { moodIndex: 2, budgetMax: 5000, hasKids: false, isDieting: false },
      expected: ['悦榕庄SPA', '安缦法云', '泰式按摩']
    },
    {
      name: '心情极好 + 带小孩 → 优先乐园和亲子餐厅',
      input: { moodIndex: 9, budgetMax: 2000, hasKids: true, isDieting: false },
      expected: ['迪士尼', '海底捞亲子', '野生动物世界']
    },
    {
      name: '心情一般 + 减肥 → 优先低卡餐厅',
      input: { moodIndex: 5, budgetMax: 1000, hasKids: false, isDieting: true },
      expected: ['Wagas轻食', '蒸海鲜', '茶博馆']
    },
    {
      name: '心情低落 + 低预算 → 优先免费治愈景点',
      input: { moodIndex: 2, budgetMax: 300, hasKids: false, isDieting: false },
      expected: ['西湖漫步', '猫的天空之城', '茶博馆']
    }
  ];

  console.log('═══════════════════════════════════════════');
  console.log('  旅心流 · 推荐引擎测试');
  console.log('═══════════════════════════════════════════\n');

  testCases.forEach(({ name, input, expected }) => {
    console.log('📋 测试场景：' + name);
    console.log('   输入：', JSON.stringify(input));
    const results = recommend(input);
    console.log('   输出 Top 5：');
    results.slice(0, 5).forEach((r, i) => {
      const marker = expected.some(e => r.name.includes(e)) ? '✅' : '  ';
      console.log(`     ${marker} ${i + 1}. ${r.name} (${r.score}分) → ${r.reason}`);
    });
    console.log('');
  });
}

// ============ 6. 导出 ============

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { recommend, getMoodLabel, POI_DATABASE };
}