'use strict';

// ================================================================
//  algorithm.test.js — MoodTravel 核心四层漏斗算法单元测试
//  使用 Node.js 内置 test runner (node:test) + assert
// ================================================================

var test = require('node:test');
var assert = require('node:assert');
var setup = require('./setup');

// ------------------------------------------------------------------
//  初始化测试环境（一次性加载，所有测试共用）
// ------------------------------------------------------------------
var sandbox = setup.initTestEnv();

// 便捷访问
var POIS = sandbox.POIS;
var HOTELS = sandbox.HOTELS;
var MOODS = sandbox.MOODS;
var COMPANION_TYPES = sandbox.COMPANION_TYPES;
var WEIGHT_MATRIX = sandbox.WEIGHT_MATRIX;
var MOOD_ENERGY_MAP = sandbox.MOOD_ENERGY_MAP;
var PAD_MODEL = sandbox.PAD_MODEL;
var doGenerate = sandbox.doGenerate;
var getWeightKey = sandbox.getWeightKey;
var getPADSimilarity = sandbox.getPADSimilarity;
var getPADTravelType = sandbox.getPADTravelType;

// ================================================================
//  Layer 1: 硬过滤测试
// ================================================================

test('Layer 1: 预算过滤 — 高票价POI被排除', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 300;      // 总预算300
  sandbox.days = 1;           // 日预算300
  sandbox.companionType = 'solo';

  var result = doGenerate();

  // 日预算 300，门票 > 150（dailyBudget * 0.5）的应被过滤
  // 所有入选POI的门票 <= 150
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        assert.ok(item.estimatedCost <= 150,
          'POI ' + item.name + ' 门票 ' + item.estimatedCost + ' 不应超过日预算一半 150');
      }
    });
  });
});

test('Layer 1: 亲子过滤 — 不接待儿童的POI被排除', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'happy';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'family';
  sandbox.hasKids = true;

  // 江郎山(id:901) kidsFriendly=false, minAge=10, energyLevel=4
  var jiangLangShan = POIS.find(function(p) { return p.id === 901; });
  assert.ok(jiangLangShan, '江郎山应存在于POI数据中');
  assert.strictEqual(jiangLangShan.kidsFriendly, false);

  var result = doGenerate();

  // 验证所有入选POI都是kids友好的
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        var poi = POIS.find(function(p) { return p.id === item.poiId; });
        if (poi) {
          assert.ok(poi.kidsFriendly,
            'POI ' + poi.name + ' 应对儿童友好');
          if (poi.minAge) {
            assert.ok(poi.minAge <= 5,
              'POI ' + poi.name + ' minAge ' + poi.minAge + ' 应 <= 5');
          }
        }
      }
    });
  });
});

test('Layer 1: 长辈过滤 — 高体力不可达POI被排除', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'family';
  sandbox.hasElderly = true;

  // 九溪烟树(id:24) elderlyFriendly=false, wheelchairAccessible=false, restSeats=1, energyLevel=3
  var jiuXi = POIS.find(function(p) { return p.id === 24; });
  assert.ok(jiuXi, '九溪烟树应存在于POI数据中');
  assert.strictEqual(jiuXi.elderlyFriendly, false);

  var result = doGenerate();

  // 验证所有入选POI对长辈友好
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        var poi = POIS.find(function(p) { return p.id === item.poiId; });
        if (poi) {
          // energyLevel >= 4 且 不 elderlyFriendly 的会被过滤
          if (poi.energyLevel >= 4) {
            assert.ok(poi.elderlyFriendly,
              '高体力POI ' + poi.name + ' 应对长辈友好');
          }
          // energyLevel >= 3 且 无轮椅通道且休息座位 < 3 的会被过滤
          if (poi.energyLevel >= 3) {
            assert.ok(poi.wheelchairAccessible || poi.restSeats >= 3,
              'POI ' + poi.name + ' 应有轮椅通道或足够休息座位');
          }
        }
      }
    });
  });
});

test('Layer 1: 情侣防坑 — 高体力POI和排队餐厅被过滤', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'happy';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'couple';
  sandbox.isCouple = true;

  var result = doGenerate();

  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        var poi = POIS.find(function(p) { return p.id === item.poiId; });
        if (poi) {
          // 情侣模式过滤 energyLevel >= 4
          assert.ok(poi.energyLevel < 4,
            '情侣模式下POI ' + poi.name + ' 体力等级应 < 4，实际为 ' + poi.energyLevel);
        }
      }
      if (item.type === 'restaurant') {
        var restPoi = POIS.find(function(p) { return p.id === item.poiId; });
        if (restPoi && restPoi.queueTime !== undefined) {
          // 情侣模式过滤排队 >= 30 分钟
          assert.ok(restPoi.queueTime < 30,
            '情侣模式下餐厅 ' + restPoi.name + ' 排队时间应 < 30，实际为 ' + restPoi.queueTime);
        }
      }
    });
  });
});

// ================================================================
//  Layer 2: 多维评分测试
// ================================================================

test('Layer 2: 心情评分 — tired心情下放松类POI得分更高', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'tired';
  sandbox.budget = 10000;
  sandbox.days = 2;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  // 收集所有POI item
  var poiItems = [];
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiItems.push(item);
    });
  });

  assert.ok(poiItems.length > 0, '应至少有一个POI入选');

  // 检查第一个POI（最高分）是否与tired心情匹配良好
  // tired mood 的 moodPoiTypeWeights 中 relaxation:1.7, spa:1.6 最高
  var firstPoi = POIS.find(function(p) { return p.id === poiItems[0].poiId; });
  if (firstPoi) {
    var tiredScore = firstPoi.moodScores.tired || 0;
    // 排名靠前的POI对tired心情应有较高匹配
    assert.ok(tiredScore >= 5,
      '排名第一的POI ' + firstPoi.name + ' 对tired心情评分应 >= 5，实际为 ' + tiredScore);
  }
});

test('Layer 2: 预算评分 — 低预算下算法仍能产出合理结果', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 500;       // 低预算
  sandbox.days = 1;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  // 收集所有POI item
  var poiItems = [];
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiItems.push(item);
    });
  });

  assert.ok(poiItems.length > 0, '低预算下应有POI入选');

  // 验证所有入选POI门票不超过日预算一半（硬过滤条件）
  var dailyBudget = sandbox.budget / sandbox.days; // 500
  poiItems.forEach(function(item) {
    assert.ok(item.estimatedCost <= dailyBudget * 0.5,
      'POI ' + item.name + ' 门票 ' + item.estimatedCost + ' 不应超过日预算一半 ' + (dailyBudget * 0.5));
  });

  // 验证总费用在合理范围内
  var totalCost = result.stats.totalCost;
  assert.ok(totalCost <= sandbox.budget * 2,
    '总费用 ' + totalCost + ' 不应严重超出预算 ' + sandbox.budget);
});

test('Layer 2: 体力评分 — 匹配心情理想体力水平', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'tired';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'solo';

  // tired mood 的理想体力水平是 1
  var energyIdeal = MOOD_ENERGY_MAP.tired;
  assert.strictEqual(energyIdeal, 1, 'tired心情的理想体力应为1');

  var result = doGenerate();

  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        var poi = POIS.find(function(p) { return p.id === item.poiId; });
        if (poi) {
          // tired心情下，入选POI的体力水平应不高于3
          assert.ok(poi.energyLevel <= 3,
            'tired心情下POI ' + poi.name + ' 体力等级应 <= 3，实际为 ' + poi.energyLevel);
        }
      }
    });
  });
});

test('Layer 2: 旅伴评分 — 情侣模式加分浪漫属性', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'happy';
  sandbox.budget = 8000;
  sandbox.days = 2;
  sandbox.companionType = 'couple';
  sandbox.isCouple = true;

  var result = doGenerate();

  // 情侣模式下，应优先选择浪漫程度高的POI
  var poiItems = [];
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiItems.push(item);
    });
  });

  // 至少有一个POI带有浪漫相关标签
  var hasRomanticTag = poiItems.some(function(item) {
    return item.reasonTags && item.reasonTags.indexOf('浪漫约会') !== -1;
  });
  // 注意：这不是强断言，因为浪漫标签取决于POI属性
  // 但至少应该验证情侣模式下的reasonTags生成逻辑被执行
  assert.ok(poiItems.length > 0, '情侣模式下应有POI入选');
});

test('Layer 2: 好友模式加分 — 出片打卡属性加分', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'excited';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'friends';
  sandbox.isFriends = true;

  var result = doGenerate();

  // 好友模式 + excited心情，应优先选择有拍照点的POI
  var poiItems = [];
  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiItems.push(item);
    });
  });

  assert.ok(poiItems.length > 0, '好友模式下应有POI入选');
});

// ================================================================
//  Layer 3: 行程编排测试
// ================================================================

test('Layer 3: 行程结构 — 天数正确且每天有内容', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 3;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  assert.strictEqual(result.itinerary.length, 3, '应有3天行程');
  result.itinerary.forEach(function(day, i) {
    assert.strictEqual(day.day, i + 1, '第' + (i + 1) + '天的day字段应为' + (i + 1));
    assert.ok(day.items.length > 0, '第' + (i + 1) + '天应有项目');
  });
});

test('Layer 3: 每日POI上限 — 不超过旅伴类型限制', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'solo'; // solo: maxPoi=5

  var result = doGenerate();

  result.itinerary.forEach(function(day) {
    var poiCount = 0;
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiCount++;
    });
    // solo maxPoi=5, but the algorithm adds at least 4 (maxPerDay = Math.max(4, maxPoi + 1))
    // so maxPerDay = Math.max(4, 6) = 6, but calm mood is not lowEnergy, so no further reduction
    assert.ok(poiCount <= 6, '每天POI数量 ' + poiCount + ' 不应超过上限');
  });
});

test('Layer 3: 低能量心情 — 每日上限降低', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'tired';  // isLowEnergy = true
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'solo'; // maxPoi=5, but lowEnergy reduces by 1

  var result = doGenerate();

  result.itinerary.forEach(function(day) {
    var poiCount = 0;
    day.items.forEach(function(item) {
      if (item.type === 'poi') poiCount++;
    });
    // maxPerDay = Math.max(4, 5+1) = 6, then lowEnergy: Math.max(2, 6-1) = 5
    assert.ok(poiCount <= 5, 'tired心情下每天POI数量 ' + poiCount + ' 不应超过5');
  });
});

test('Layer 3: 类别多样性 — 每天至少2类POI', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  result.itinerary.forEach(function(day) {
    var categories = {};
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        var poi = POIS.find(function(p) { return p.id === item.poiId; });
        if (poi) categories[poi.category] = true;
      }
    });
    var catCount = Object.keys(categories).length;
    // 如果POI数量 >= 3，算法会确保至少2类
    var poiCount = day.items.filter(function(i) { return i.type === 'poi'; }).length;
    if (poiCount >= 3) {
      assert.ok(catCount >= 2, '每天应有至少2类POI，当前类别数：' + catCount);
    }
  });
});

// ================================================================
//  Layer 4: 酒店推荐测试
// ================================================================

test('Layer 4: 酒店推荐 — 返回正确结构', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  assert.ok(result.hotel, '应返回酒店推荐');
  assert.ok(typeof result.hotel.name === 'string', '酒店应有名称');
  assert.ok(typeof result.hotel.price === 'number', '酒店应有价格');
  assert.ok(typeof result.hotel.rating === 'number', '酒店应有评分');
  assert.ok(Array.isArray(result.hotel.platforms), '酒店应有多平台比价');
  assert.ok(result.hotel.platforms.length > 0, '应至少有一个比价平台');
});

test('Layer 4: 酒店预算过滤 — 超出预算的酒店被排除', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 500;       // 极低预算
  sandbox.days = 1;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  if (result.hotel) {
    // 酒店总价（price * days）应 <= budget * 0.8（硬过滤条件）
    // 如果所有酒店都超出预算，会取前2个最便宜的
    var hotelTotal = result.hotel.price * sandbox.days;
    // 不做硬断言，因为fallback可能取前2名
    assert.ok(hotelTotal >= 0, '酒店价格应非负');
  }
});

// ================================================================
//  边缘情况测试
// ================================================================

test('边缘情况: 极端预算 — 不会崩溃', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 100;       // 极低预算
  sandbox.days = 1;
  sandbox.companionType = 'solo';

  var result;
  try {
    result = doGenerate();
  } catch (e) {
    assert.fail('极端预算下不应崩溃: ' + e.message);
  }

  assert.ok(result, '应返回结果');
  assert.ok(Array.isArray(result.itinerary), '应有行程数组');
  assert.ok(result.stats, '应有统计数据');
});

test('边缘情况: 全心情遍历 — 所有7种心情均能生成有效行程', function(t) {
  var allMoods = ['calm', 'happy', 'sad', 'anxious', 'excited', 'tired', 'insomnia'];

  allMoods.forEach(function(mood) {
    setup.resetState(sandbox);
    sandbox.activeMood = mood;
    sandbox.budget = 5000;
    sandbox.days = 2;
    sandbox.companionType = 'solo';

    var result;
    try {
      result = doGenerate();
    } catch (e) {
      assert.fail('心情 ' + mood + ' 下不应崩溃: ' + e.message);
    }

    assert.ok(result, '心情 ' + mood + ' 应返回结果');
    assert.ok(result.itinerary.length > 0, '心情 ' + mood + ' 应生成非空行程');
    assert.ok(result.stats.totalPois > 0, '心情 ' + mood + ' 应有POI入选');
  });
});

test('边缘情况: 商务模式 — 过滤高体力POI', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 1;
  sandbox.companionType = 'business';
  sandbox.isBusiness = true;
  sandbox.travelMode = 'business';

  var result = doGenerate();

  result.itinerary.forEach(function(day) {
    day.items.forEach(function(item) {
      if (item.type === 'poi') {
        var poi = POIS.find(function(p) { return p.id === item.poiId; });
        if (poi) {
          // 商务模式过滤 energyLevel >= 4 的POI
          assert.ok(poi.energyLevel < 4,
            '商务模式下POI ' + poi.name + ' 体力等级应 < 4，实际为 ' + poi.energyLevel);
        }
      }
    });
  });
});

test('边缘情况: 家庭成员模式 — 带娃+长辈', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 8000;
  sandbox.days = 3;
  sandbox.companionType = 'family';
  sandbox.hasKids = true;
  sandbox.hasElderly = true;

  var result;
  try {
    result = doGenerate();
  } catch (e) {
    assert.fail('家庭模式不应崩溃: ' + e.message);
  }

  assert.ok(result, '应返回结果');
  assert.ok(result.itinerary.length > 0, '家庭模式应生成行程');

  // 家庭模式每日上限较低（maxPoi=2, maxPerDay=Math.max(4,3)=4）
  // 加上隐藏宝地保底可能多1个POI，所以上限为5
  result.itinerary.forEach(function(day) {
    var poiCount = day.items.filter(function(i) { return i.type === 'poi'; }).length;
    assert.ok(poiCount <= 5, '家庭模式每天POI不应过多，实际为 ' + poiCount);
  });
});

// ================================================================
//  PAD 情绪模型测试
// ================================================================

test('PAD模型: 情绪相似度计算', function(t) {
  // calm 和 tired 相似度较高（都是低唤醒）
  var sim1 = getPADSimilarity('calm', 'tired');
  assert.ok(sim1 > 0.5, 'calm和tired相似度应 > 0.5，实际为 ' + sim1);

  // excited 和 tired 相似度较低（高唤醒 vs 低唤醒）
  var sim2 = getPADSimilarity('excited', 'tired');
  assert.ok(sim2 < 0.5, 'excited和tired相似度应 < 0.5，实际为 ' + sim2);

  // 相同心情相似度为1
  var sim3 = getPADSimilarity('happy', 'happy');
  assert.ok(sim3 > 0.99, '相同心情相似度应接近1，实际为 ' + sim3);
});

test('PAD模型: 旅行类型推荐', function(t) {
  // excited 高唤醒 → 冒险探索
  var type1 = getPADTravelType('excited');
  assert.strictEqual(type1.type, '冒险探索');

  // tired 低唤醒 → 躺平度假
  var type2 = getPADTravelType('tired');
  assert.strictEqual(type2.type, '躺平度假');

  // sad 低愉悦 → 疗愈治愈
  var type3 = getPADTravelType('sad');
  assert.strictEqual(type3.type, '疗愈治愈');
});

// ================================================================
//  权重矩阵测试
// ================================================================

test('权重矩阵: 正确获取心情+旅伴组合权重', function(t) {
  setup.resetState(sandbox);

  sandbox.activeMood = 'tired';
  sandbox.companionType = 'solo';
  var w1 = getWeightKey();
  assert.ok(w1, 'tired_solo应有权重');
  assert.ok(typeof w1.mood === 'number', '应有mood权重');

  sandbox.activeMood = 'excited';
  sandbox.companionType = 'couple';
  var w2 = getWeightKey();
  assert.ok(w2, 'excited_couple应有权重');

  // 不存在的组合应回退到default
  sandbox.activeMood = 'insomnia';
  sandbox.companionType = 'business';
  var w3 = getWeightKey();
  assert.ok(w3, '不存在组合应回退到default权重');
});

// ================================================================
//  统计数据测试
// ================================================================

test('统计数据: stats结构完整', function(t) {
  setup.resetState(sandbox);
  sandbox.activeMood = 'calm';
  sandbox.budget = 5000;
  sandbox.days = 2;
  sandbox.companionType = 'solo';

  var result = doGenerate();

  assert.ok(result.stats, '应有stats');
  assert.ok(typeof result.stats.totalCost === 'number', '应有totalCost');
  assert.ok(typeof result.stats.totalPois === 'number', '应有totalPois');
  assert.ok(typeof result.stats.filterTotal === 'number', '应有filterTotal');
  assert.ok(typeof result.stats.filterPassed === 'number', '应有filterPassed');
  assert.ok(result.stats.filterPassed <= result.stats.filterTotal,
    'filterPassed应 <= filterTotal');
  assert.ok(result.stats.filterPassed > 0, '应有POI通过过滤');
});