/**
 * ================================================================
 *  MoodTravel 精选地点 Mock 数据源
 *  每个地点都带有"疗愈"调性，文案传递情绪安抚与松弛感。
 *  用于首页能量滑块联动展示，数据字段具备高扩展性。
 * ================================================================
 */

export const travelSpots = [
  {
    id: 'spot-001',
    title: '避世书局',
    tags: ['躺平', '回血', '安静'],
    energyLevel: 10,
    distance: 280,
    scenario: 'relax',
    description: '这里很安静，适合一个人发呆，把烦恼留在门外。',
    elderDesc: '安静的书店，适合老人慢慢逛',
    imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-002',
    title: '云端足疗',
    tags: ['放松', '回血', '按摩'],
    energyLevel: 15,
    distance: 420,
    scenario: 'relax',
    description: '把疲惫交给专业的双手，让身体像云一样轻盈。',
    elderDesc: '专业的足疗按摩店',
    imageUrl: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-003',
    title: '森系温泉',
    tags: ['回血', '放松', '疗愈'],
    energyLevel: 20,
    distance: 3200,
    description: '在森林的怀抱里泡个汤，让温热的泉水洗去一身疲惫。',
    elderDesc: '森林温泉，距离稍远',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-004',
    title: '山间冥想台',
    tags: ['治愈', '独处', '自然'],
    energyLevel: 30,
    distance: 2500,
    description: '闭上眼，听风吹过竹林的声音，那是大自然在和你说话。',
    elderDesc: '山间休息平台，适合静坐',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-005',
    title: '湖畔茶寮',
    tags: ['治愈', '慢生活', '自然'],
    energyLevel: 35,
    distance: 1800,
    description: '一杯龙井，一湖烟雨，时间在这里慢下来。',
    elderDesc: '西湖边茶馆，有电梯和长椅',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-006',
    title: '猫空咖啡',
    tags: ['治愈', '萌宠', '咖啡'],
    energyLevel: 40,
    distance: 350,
    scenario: 'relax',
    description: '猫咪的呼噜声是最好的白噪音，一杯拿铁就是一下午。',
    elderDesc: '安静的猫咪咖啡馆',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-007',
    title: '落日露台',
    tags: ['浪漫', '独处', '美景'],
    energyLevel: 45,
    distance: 680,
    description: '看着夕阳把天空染成粉色，今天的烦恼就到此为止吧。',
    elderDesc: '看夕阳的好地方，有长椅',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-008',
    title: '静心画室',
    tags: ['治愈', '创造', '独处'],
    energyLevel: 50,
    distance: 450,
    scenario: 'relax',
    description: '不需要画得多好，只需要把心情交给画笔，让色彩替你说话。',
    elderDesc: '安静的画室，适合老人作画',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80&fm=webp'
  },
  // ---- 日常场景地点（极近距离） ----
  {
    id: 'spot-101',
    title: '社区小公园',
    tags: ['散步', '户外', '日常'],
    energyLevel: 5,
    distance: 120,
    scenario: 'walk',
    description: '出门右转就是，有长椅和树荫，晚饭后散步的好去处。',
    elderDesc: '适合老人散步的公园，距您120米',
    imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-102',
    title: '转角咖啡',
    tags: ['咖啡', '摸鱼', '休闲'],
    energyLevel: 8,
    distance: 200,
    scenario: 'break',
    description: '手冲咖啡很棒，WiFi免费，适合摸鱼五分钟。',
    elderDesc: '安静的咖啡店，距您200米',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-103',
    title: '幸福菜市场',
    tags: ['买菜', '日常', '新鲜'],
    energyLevel: 5,
    distance: 200,
    scenario: 'grocery',
    description: '早上刚进了一批新鲜蔬菜，西红柿和黄瓜都很水灵。',
    elderDesc: '附近便宜的菜市场，距您200米',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-104',
    title: '街角便利店',
    tags: ['日常', '便利', '买菜'],
    energyLevel: 3,
    distance: 80,
    scenario: 'grocery',
    description: '24小时营业，牛奶面包鸡蛋都有，比菜市场干净。',
    elderDesc: '小区门口的便利店，距您80米',
    imageUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-105',
    title: '避雨长廊',
    tags: ['下雨', '躲雨', '日常'],
    energyLevel: 2,
    distance: 300,
    scenario: 'rain',
    description: '沿着河边的长廊一直走，全程有顶棚，下雨也不怕。',
    elderDesc: '河边有顶棚的长廊，下雨也能散步',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-106',
    title: '社区活动中心',
    tags: ['室内', '躲雨', '日常'],
    energyLevel: 5,
    distance: 250,
    scenario: 'rain',
    description: '有棋牌室和阅览室，下雨天老人们都在这。',
    elderDesc: '可以下棋看报的社区活动中心',
    imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&q=80&fm=webp'
  },
  {
    id: 'spot-107',
    title: '河滨步道',
    tags: ['散步', '户外', '日常'],
    energyLevel: 10,
    distance: 400,
    scenario: 'walk',
    description: '平坦的步道，适合下班后透透气，看河水慢慢流。',
    elderDesc: '平坦好走的河边步道，距您400米',
    imageUrl: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=80&fm=webp'
  }
]