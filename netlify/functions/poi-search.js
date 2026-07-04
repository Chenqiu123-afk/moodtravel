// Netlify Function: 高德POI搜索代理
// 保护API Key安全，前端无需暴露Key
const AMAP_KEY = process.env.AMAP_KEY || '';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { query, city, types } = event.queryStringParameters || {};
  if (!query) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing query parameter' }) };
  }

  if (!AMAP_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ results: [], fallback: true, message: 'AMAP_KEY not configured' }) };
  }

  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      keywords: query,
      types: types || '',
      city: city || '',
      offset: '10',
      page: '1',
      extensions: 'all'
    });

    const fetch = (await import('node-fetch')).default;
    const resp = await fetch(`https://restapi.amap.com/v3/place/text?${params.toString()}`);
    const data = await resp.json();

    if (data.status === '1' && data.pois) {
      const results = data.pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        address: poi.address,
        location: poi.location, // "lng,lat"
        tel: poi.tel || '',
        biz_ext: poi.biz_ext || {},
        photos: poi.photos || [],
        rating: poi.biz_ext?.rating || ''
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ results, count: data.count }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ results: [], count: 0 }) };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ results: [], fallback: true, error: err.message }) };
  }
};