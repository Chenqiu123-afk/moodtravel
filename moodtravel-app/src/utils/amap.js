/**
 * 高德地图 Web API 封装
 * ======================
 * 将高德 POI 搜索返回的原始数据，转换为 MoodTravel App 所需格式。
 *
 * 使用前需在 https://console.amap.com 申请 Web 服务 Key
 */

const AMAP_KEY = '266de1ff51d786530d80c9f6d950a853';
const AMAP_BASE = 'https://restapi.amap.com/v3';

// ============================================================
// 1. 核心查询函数
// ============================================================

/**
 * 根据城市 + 心情关键词搜索真实景点
 *
 * @param {string} city       - 城市名，如 "杭州"
 * @param {string} moodQuery  - 心情描述，如 "适合一个人发呆"
 * @param {Object} options    - 可选参数
 * @param {number} options.radius    - 搜索半径（米），默认 50000
 * @param {number} options.pageSize  - 返回数量，默认 20
 * @param {string} options.types     - 高德 POI 类型，如 "风景名胜|博物馆|咖啡馆"
 * @returns {Promise<Array>} - 转换后的景点数组
 */
async function searchByMood(city, moodQuery, options = {}) {
  const {
    radius = 50000,
    pageSize = 20,
    types = ''
  } = options;

  // 1.1 将心情关键词拆分为多个搜索词
  const keywords = moodToKeywords(moodQuery);

  // 1.2 先获取城市编码
  const cityCode = await getCityCode(city);
  if (!cityCode) {
    console.error('未找到城市：' + city);
    return [];
  }

  // 1.3 获取城市中心经纬度
  const center = await getCityCenter(city);
  if (!center) {
    console.error('无法获取城市中心坐标：' + city);
    return [];
  }

  // 1.4 按心情关键词分别搜索，合并结果
  const allResults = [];
  for (const kw of keywords) {
    const pois = await searchPOI(center, kw, {
      radius,
      pageSize: Math.ceil(pageSize / keywords.length),
      types,
      cityCode
    });
    allResults.push(...pois);
  }

  // 1.5 去重（按 amap_poi_id）
  const seen = new Set();
  const unique = allResults.filter(p => {
    if (seen.has(p.amap_poi_id)) return false;
    seen.add(p.amap_poi_id);
    return true;
  });

  // 1.6 转换为 App 需要的格式
  return unique.slice(0, pageSize).map(p => transformToAppFormat(p, moodQuery));
}

// ============================================================
// 2. 心情关键词 → 高德搜索词映射
// ============================================================

/**
 * 将"适合一个人发呆"这种自然语言 → 一组高德 POI 搜索关键词
 */
function moodToKeywords(moodQuery) {
  // 关键词映射表
  const map = {
    '发呆': ['书店', '咖啡馆', '公园', '湖边'],
    '治愈': ['书店', '茶馆', '咖啡厅', '美术馆', '博物馆'],
    '安静': ['书店', '茶馆', '博物馆', '美术馆', '图书馆'],
    '放松': ['公园', '咖啡馆', '茶馆', 'SPA', '湖边'],
    '一个人': ['书店', '咖啡馆', '公园', '美术馆', '博物馆'],
    '开心': ['游乐园', '步行街', '美食', '公园', '购物中心'],
    '兴奋': ['游乐园', '蹦极', '密室逃脱', '酒吧', 'KTV'],
    '焦虑': ['书店', '茶馆', '咖啡厅', '公园', '博物馆'],
    '疲惫': ['SPA', '咖啡馆', '茶馆', '公园', '酒店'],
    '低落': ['书店', '咖啡厅', '公园', '湖边', '美术馆'],
    '亲子': ['动物园', '游乐园', '博物馆', '公园', '科技馆'],
    '减肥': ['轻食', '沙拉', '素食', '健身房', '公园'],
    '低预算': ['公园', '博物馆', '免费', '步行街', '图书馆'],
    '拍照': ['网红', '打卡', '景点', '公园', '创意园'],
    '美食': ['餐厅', '小吃', '火锅', '日料', '本地菜'],
  };

  // 从心情描述中提取关键词
  const matched = [];
  for (const [key, values] of Object.entries(map)) {
    if (moodQuery.includes(key)) {
      matched.push(...values);
    }
  }

  // 如果没有匹配到任何关键词，使用默认搜索词
  if (matched.length === 0) {
    return ['景点', '公园', '咖啡馆'];
  }

  // 去重
  return [...new Set(matched)].slice(0, 5);
}

// ============================================================
// 3. 高德 API 调用函数
// ============================================================

/**
 * 获取城市编码
 * GET /v3/config/district
 */
async function getCityCode(cityName) {
  try {
    const url = `${AMAP_BASE}/config/district?key=${AMAP_KEY}&keywords=${encodeURIComponent(cityName)}&subdistrict=0`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === '1' && data.districts.length > 0) {
      return data.districts[0].adcode;
    }
    return null;
  } catch (e) {
    console.error('获取城市编码失败：', e);
    return null;
  }
}

/**
 * 获取城市中心经纬度
 * GET /v3/geocode/geo
 */
async function getCityCenter(cityName) {
  try {
    const url = `${AMAP_BASE}/geocode/geo?key=${AMAP_KEY}&address=${encodeURIComponent(cityName)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === '1' && data.geocodes.length > 0) {
      return data.geocodes[0].location; // "120.153576,30.287459"
    }
    return null;
  } catch (e) {
    console.error('获取城市中心坐标失败：', e);
    return null;
  }
}

/**
 * POI 周边搜索
 * GET /v3/place/around
 */
async function searchPOI(center, keyword, options = {}) {
  const {
    radius = 50000,
    pageSize = 10,
    types = '',
    cityCode = ''
  } = options;

  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      location: center,
      keywords: keyword,
      radius: radius,
      offset: pageSize,
      page: 1,
      extensions: 'all'  // 返回详细信息（评分、照片、营业时间等）
    });

    if (types) params.set('types', types);

    const url = `${AMAP_BASE}/place/around?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === '1' && data.pois) {
      return data.pois;
    }
    return [];
  } catch (e) {
    console.error('POI 搜索失败：', e);
    return [];
  }
}

/**
 * 获取 POI 详情（含营业时间）
 * GET /v3/place/detail
 */
async function getPOIDetail(poiId) {
  try {
    const url = `${AMAP_BASE}/place/detail?key=${AMAP_KEY}&id=${poiId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === '1' && data.pois.length > 0) {
      return data.pois[0];
    }
    return null;
  } catch (e) {
    console.error('获取 POI 详情失败：', e);
    return null;
  }
}

// ============================================================
// 4. 数据格式转换：高德格式 → App 格式
// ============================================================

/**
 * 将高德返回的原始 POI 数据，转换为 App 需要的 JSON 格式
 */
function transformToAppFormat(amapPOI, moodQuery) {
  return {
    // ---- 基础信息 ----
    poi_id: amapPOI.id,
    name: amapPOI.name,
    category: mapCategory(amapPOI.type),
    sub_category: amapPOI.type?.split(';')[1] || '',
    city: amapPOI.cityname || amapPOI.pname || '',
    district: amapPOI.adname || '',
    address: amapPOI.address || '',
    coordinates: {
      lat: parseFloat(amapPOI.location?.split(',')[1] || 0),
      lng: parseFloat(amapPOI.location?.split(',')[0] || 0)
    },

    // ---- 评分 ----
    rating: parseFloat(amapPOI.biz_ext?.rating || 0) || 0,
    review_count: parseInt(amapPOI.biz_ext?.cost || 0) || 0,

    // ---- 费用 ----
    ticket_price: amapPOI.biz_ext?.cost
      ? parseInt(amapPOI.biz_ext.cost)
      : 0,
    cost_note: amapPOI.biz_ext?.cost
      ? '人均约 ¥' + amapPOI.biz_ext.cost
      : '免费或信息缺失',

    // ---- 营业时间 ----
    opening_hours: amapPOI.biz_ext?.opentime || '暂无数据',
    // 解析营业时间示例：高德返回 "10:00-22:00"
    // 这里直接透传，前端再做展示

    // ---- 关键词匹配 ----
    search_matched: amapPOI.type || '',  // 匹配到的类型
    mood_keywords: moodQuery,            // 用于搜索的心情关键词

    // ---- 图片 ----
    photos: (amapPOI.photos || []).slice(0, 3).map(p => ({
      url: p.url || '',
      title: p.title || ''
    })),

    // ---- 标签 ----
    tags: (() => {
      const tags = [];
      if (Array.isArray(amapPOI.tag)) tags.push(...amapPOI.tag);
      else if (typeof amapPOI.tag === 'string') tags.push(...amapPOI.tag.split(';').filter(Boolean));
      if (typeof amapPOI.atag === 'string') tags.push(amapPOI.atag);
      if (typeof amapPOI.keytag === 'string') tags.push(amapPOI.keytag);
      return tags.filter(Boolean);
    })(),

    // ---- 距离 ----
    distance: parseInt(amapPOI.distance || 0), // 距离搜索中心点的米数

    // ---- 原始数据备份 ----
    _raw: {
      type: amapPOI.type,
      typecode: amapPOI.typecode,
      biz_type: amapPOI.biz_type
    }
  };
}

/**
 * 高德 POI 类型 → App 分类映射
 */
function mapCategory(amapType) {
  if (!amapType) return 'other';

  const type = amapType.split(';')[0] || '';

  const mapping = {
    '风景名胜': 'scenic',
    '公园广场': 'park',
    '博物馆': 'museum',
    '展览馆': 'museum',
    '会展中心': 'museum',
    '美术馆': 'museum',
    '图书馆': 'museum',
    '科技馆': 'museum',
    '餐饮服务': 'restaurant',
    '中餐厅': 'restaurant',
    '外国餐厅': 'restaurant',
    '咖啡厅': 'cafe',
    '茶艺馆': 'cafe',
    '冷饮店': 'cafe',
    '甜品店': 'cafe',
    '购物服务': 'shopping',
    '商场': 'shopping',
    '步行街': 'shopping',
    '住宿服务': 'hotel',
    '宾馆酒店': 'hotel',
    '运动场所': 'sport',
    '娱乐场所': 'entertainment',
    '游乐园': 'theme_park',
    '动物园': 'theme_park',
    '水族馆': 'theme_park',
    '寺庙道观': 'temple',
    '教堂': 'temple',
    '休闲场所': 'leisure',
    '影剧院': 'entertainment',
    '酒吧': 'nightlife',
    'KTV': 'nightlife',
    'SPA': 'spa',
    '疗养院': 'spa',
  };

  return mapping[type] || 'other';
}

// ============================================================
// 5. 批量查询：一条链获取完整数据
// ============================================================

/**
 * 完整查询流程：城市 + 心情 → 带详情和营业时间的完整景点列表
 *
 * 使用示例：
 *   const pois = await fullSearch('杭州', '适合一个人发呆');
 *   // 返回已包含营业时间、评分、照片的完整数据
 */
async function fullSearch(city, moodQuery, options = {}) {
  const { pageSize = 10, enrichDetails = true } = options;

  // 5.1 搜索
  const results = await searchByMood(city, moodQuery, { pageSize });

  // 5.2 如果需要，补充每个 POI 的详情（营业时间等）
  if (enrichDetails && results.length > 0) {
    const enriched = await Promise.all(
      results.slice(0, pageSize).map(async (poi) => {
        try {
          const detail = await getPOIDetail(poi.poi_id);
          if (detail) {
            return transformToAppFormat(detail, moodQuery);
          }
        } catch (e) {
          // 详情获取失败，使用已有数据
        }
        return poi;
      })
    );
    return enriched;
  }

  return results;
}

// ============================================================
// 6. 导出
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    searchByMood,
    fullSearch,
    getCityCode,
    getCityCenter,
    searchPOI,
    getPOIDetail,
    moodToKeywords,
    transformToAppFormat,
    mapCategory
  };
}