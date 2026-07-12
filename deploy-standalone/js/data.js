var MOODS = [
  { key: 'calm', label: '平静', emoji: '😌', color: '#8BA88C', pad_p: '+0.7', pad_a: '-0.4', pad_d: '+0.3' },
  { key: 'happy', label: '开心', emoji: '😊', color: '#E8A85A', pad_p: '+0.8', pad_a: '+0.5', pad_d: '+0.4' },
  { key: 'sad', label: '治愈', emoji: '🌅', color: '#E8945A', pad_p: '-0.5', pad_a: '-0.3', pad_d: '-0.2' },
  { key: 'anxious', label: '放松', emoji: '🌿', color: '#6B8FA3', pad_p: '-0.4', pad_a: '+0.6', pad_d: '-0.3' },
  { key: 'excited', label: '探索', emoji: '🔥', color: '#FF6B6B', pad_p: '+0.9', pad_a: '+0.8', pad_d: '+0.6' },
  { key: 'tired', label: '慵懒', emoji: '😴', color: '#B5A3C4', pad_p: '+0.2', pad_a: '-0.7', pad_d: '-0.5' },
  { key: 'insomnia', label: '深夜', emoji: '🌙', color: '#6B7BA3', pad_p: '+0.1', pad_a: '+0.3', pad_d: '-0.1' }
];

var MOOD_THEME_MAP = {
  calm: {
    primary: '#8BA88C', secondary: '#A3C4A3', accent: '#6B8F6B',
    bgGradient: 'linear-gradient(135deg, #0a1a0f 0%, #0d1f12 30%, #0a1510 60%, #07100a 100%)',
    cardBg: 'rgba(139,168,140,0.12)', cardBorder: 'rgba(139,168,140,0.25)',
    textColor: '#d4e8d4', highlightColor: '#8BA88C',
    animationSpeed: 'slow', particleColor: '#8BA88C',
    ambientGlow: '0 0 60px rgba(139,168,140,0.15)',
    bgPattern: 'forest', iconSet: 'nature',
    fontStyle: 'serif', label: '宁静'
  },
  happy: {
    primary: '#FFB347', secondary: '#FFD89B', accent: '#E8945A',
    bgGradient: 'linear-gradient(135deg, #1a1208 0%, #1f180a 30%, #1a1008 60%, #150d05 100%)',
    cardBg: 'rgba(255,179,71,0.12)', cardBorder: 'rgba(255,179,71,0.25)',
    textColor: '#ffe8c8', highlightColor: '#FFB347',
    animationSpeed: 'fast', particleColor: '#FFB347',
    ambientGlow: '0 0 60px rgba(255,179,71,0.15)',
    bgPattern: 'sunburst', iconSet: 'celebration',
    fontStyle: 'sans-serif', label: '开心'
  },
  sad: {
    primary: '#7B9EC4', secondary: '#A3C4D6', accent: '#6B8FA3',
    bgGradient: 'linear-gradient(135deg, #0a0f1a 0%, #0d1320 30%, #0a0e18 60%, #070a12 100%)',
    cardBg: 'rgba(123,158,196,0.12)', cardBorder: 'rgba(123,158,196,0.25)',
    textColor: '#c8d8e8', highlightColor: '#7B9EC4',
    animationSpeed: 'slow', particleColor: '#7B9EC4',
    ambientGlow: '0 0 60px rgba(123,158,196,0.12)',
    bgPattern: 'rain', iconSet: 'gentle',
    fontStyle: 'serif', label: '低落'
  },
  anxious: {
    primary: '#B5A3C4', secondary: '#C4B5D6', accent: '#9B8AB4',
    bgGradient: 'linear-gradient(135deg, #120f1a 0%, #151220 30%, #100e18 60%, #0c0a12 100%)',
    cardBg: 'rgba(181,163,196,0.12)', cardBorder: 'rgba(181,163,196,0.25)',
    textColor: '#e0d4e8', highlightColor: '#B5A3C4',
    animationSpeed: 'medium', particleColor: '#B5A3C4',
    ambientGlow: '0 0 60px rgba(181,163,196,0.12)',
    bgPattern: 'ripple', iconSet: 'calming',
    fontStyle: 'sans-serif', label: '焦虑'
  },
  excited: {
    primary: '#FF6B6B', secondary: '#FF8E8E', accent: '#E85555',
    bgGradient: 'linear-gradient(135deg, #1a0808 0%, #200d0d 30%, #1a0808 60%, #150505 100%)',
    cardBg: 'rgba(255,107,107,0.12)', cardBorder: 'rgba(255,107,107,0.25)',
    textColor: '#ffd0d0', highlightColor: '#FF6B6B',
    animationSpeed: 'fast', particleColor: '#FF6B6B',
    ambientGlow: '0 0 60px rgba(255,107,107,0.15)',
    bgPattern: 'explosion', iconSet: 'energetic',
    fontStyle: 'sans-serif', label: '兴奋'
  },
  tired: {
    primary: '#C4A882', secondary: '#D4BCA0', accent: '#A89070',
    bgGradient: 'linear-gradient(135deg, #15100a 0%, #1a140d 30%, #121008 60%, #0d0c06 100%)',
    cardBg: 'rgba(196,168,130,0.12)', cardBorder: 'rgba(196,168,130,0.25)',
    textColor: '#e8d8c0', highlightColor: '#C4A882',
    animationSpeed: 'very-slow', particleColor: '#C4A882',
    ambientGlow: '0 0 40px rgba(196,168,130,0.1)',
    bgPattern: 'soft', iconSet: 'cozy',
    fontStyle: 'serif', label: '疲惫'
  },
  insomnia: {
    primary: '#6B7BA3', secondary: '#8B9BC4', accent: '#4B5B83',
    bgGradient: 'linear-gradient(135deg, #080c18 0%, #0a0f20 30%, #080a15 60%, #050812 100%)',
    cardBg: 'rgba(107,123,163,0.12)', cardBorder: 'rgba(107,123,163,0.25)',
    textColor: '#c0c8e0', highlightColor: '#6B7BA3',
    animationSpeed: 'very-slow', particleColor: '#6B7BA3',
    ambientGlow: '0 0 30px rgba(107,123,163,0.08)',
    bgPattern: 'stars', iconSet: 'night',
    fontStyle: 'serif', label: '失眠'
  }
};

// ================================================================
//  PAD (Pleasure-Arousal-Dominance) 三维情绪模型
//  用于更精准的情绪分类和个性化推荐
//  参考: Mehrabian & Russell 情绪维度理论
// ================================================================
var PAD_MODEL = {
  calm:      { P: 0.4, A: -0.5, D: 0.3,  desc: '平静放松，内心安宁，适合慢节奏深度游' },
  happy:     { P: 0.8, A: 0.5,  D: 0.6,  desc: '愉悦高能，积极乐观，适合社交打卡探索' },
  sad:       { P: -0.5, A: -0.3, D: -0.4, desc: '需要治愈，渴望温暖，适合自然疗愈之旅' },
  anxious:   { P: -0.3, A: 0.6,  D: -0.5, desc: '紧张不安，需要释放，适合开阔空间放空' },
  excited:   { P: 0.7, A: 0.8,  D: 0.5,  desc: '兴奋冒险，高能量，适合极限体验和探索' },
  tired:     { P: -0.1, A: -0.7, D: -0.3, desc: '身心疲惫，需要回血，适合躺平式度假' },
  insomnia:  { P: -0.2, A: 0.4,  D: -0.2, desc: '深夜emo，思绪纷乱，适合安静独处疗愈' }
};

// 根据 PAD 值计算情绪相似度（用于推荐匹配）
function getPADSimilarity(mood1, mood2) {
  var p1 = PAD_MODEL[mood1], p2 = PAD_MODEL[mood2];
  if (!p1 || !p2) return 0;
  var dp = p1.P - p2.P, da = p1.A - p2.A, dd = p1.D - p2.D;
  return 1 - Math.sqrt(dp*dp + da*da + dd*dd) / Math.sqrt(3); // 0-1 相似度
}

// 根据 PAD 值推荐最佳旅行类型
function getPADTravelType(mood) {
  var pad = PAD_MODEL[mood];
  if (!pad) return { type: '休闲观光', intensity: 'medium' };
  if (pad.A > 0.5) return { type: '冒险探索', intensity: 'high' };
  if (pad.A < -0.3) return { type: '躺平度假', intensity: 'low' };
  if (pad.P < -0.3) return { type: '疗愈治愈', intensity: 'gentle' };
  return { type: '深度文化', intensity: 'medium' };
}

var COMPANION_TYPES = [
  { key:'solo', label:'独自旅行', icon:'🧑', desc:'自由自在，随心而行', pacing:'fast', maxPoi:5, paceLabel:'特种兵节奏' },
  { key:'couple', label:'情侣/伴侣', icon:'💑', desc:'浪漫氛围，甜蜜时光', pacing:'moderate', maxPoi:3, paceLabel:'浪漫慢节奏' },
  { key:'friends', label:'闺蜜/好友', icon:'👯', desc:'吃喝玩乐，不踩雷', pacing:'fast', maxPoi:4, paceLabel:'逛吃模式' },
  { key:'family', label:'带长辈/亲子', icon:'👨‍👩‍👧', desc:'慢节奏，享天伦', pacing:'slow', maxPoi:2, paceLabel:'松弛模式' },
  { key:'business', label:'商务同事', icon:'💼', desc:'高效出行，省时省心', pacing:'efficient', maxPoi:3, paceLabel:'效率优先' }
];

var DAILY_SCENARIOS = [
  { key:'walk', label:'🚶 下班透透气' },
  { key:'break', label:'☕ 摸鱼5分钟' },
  { key:'grocery', label:'🛒 帮长辈买菜' },
  { key:'rain', label:'🌧️ 雨天躲雨处' }
];

var TRAVEL_SPOTS = [
  { id:'spot-001', title:'避世书局', tags:['躺平','回血','安静'], energyLevel:10, distance:280, scenario:'relax', description:'这里很安静，适合一个人发呆，把烦恼留在门外。', elderDesc:'安静的书店，适合老人慢慢逛', emoji:'📚' },
  { id:'spot-002', title:'云端足疗', tags:['放松','回血','按摩'], energyLevel:15, distance:420, scenario:'relax', description:'把疲惫交给专业的双手，让身体像云一样轻盈。', elderDesc:'专业的足疗按摩店', emoji:'🦶' },
  { id:'spot-006', title:'猫空咖啡', tags:['治愈','萌宠','咖啡'], energyLevel:40, distance:350, scenario:'relax', description:'猫咪的呼噜声是最好的白噪音，一杯拿铁就是一下午。', elderDesc:'安静的猫咪咖啡馆', emoji:'🐱' },
  { id:'spot-101', title:'社区小公园', tags:['散步','户外','日常'], energyLevel:5, distance:120, scenario:'walk', description:'出门右转就是，有长椅和树荫，晚饭后散步的好去处。', elderDesc:'适合老人散步的公园，距您120米', emoji:'🌳' },
  { id:'spot-102', title:'转角咖啡', tags:['咖啡','摸鱼','休闲'], energyLevel:8, distance:200, scenario:'break', description:'手冲咖啡很棒，WiFi免费，适合摸鱼五分钟。', elderDesc:'安静的咖啡店，距您200米', emoji:'☕' },
  { id:'spot-103', title:'幸福菜市场', tags:['买菜','日常','新鲜'], energyLevel:5, distance:200, scenario:'grocery', description:'早上刚进了一批新鲜蔬菜，西红柿和黄瓜都很水灵。', elderDesc:'附近便宜的菜市场，距您200米', emoji:'🥬' },
  { id:'spot-104', title:'街角便利店', tags:['日常','便利','买菜'], energyLevel:3, distance:80, scenario:'grocery', description:'24小时营业，牛奶面包鸡蛋都有，比菜市场干净。', elderDesc:'小区门口的便利店，距您80米', emoji:'🏪' },
  { id:'spot-105', title:'避雨长廊', tags:['下雨','躲雨','日常'], energyLevel:2, distance:300, scenario:'rain', description:'沿着河边的长廊一直走，全程有顶棚，下雨也不怕。', elderDesc:'河边有顶棚的长廊，下雨也能散步', emoji:'🌂' },
  { id:'spot-106', title:'社区活动中心', tags:['室内','躲雨','日常'], energyLevel:5, distance:250, scenario:'rain', description:'有棋牌室和阅览室，下雨天老人们都在这。', elderDesc:'可以下棋看报的社区活动中心', emoji:'🎲' },
  { id:'spot-107', title:'河滨步道', tags:['散步','户外','日常'], energyLevel:10, distance:400, scenario:'walk', description:'平坦的步道，适合下班后透透气，看河水慢慢流。', elderDesc:'平坦好走的河边步道，距您400米', emoji:'🌊' }
];

var POIS = [
  { id:1, name:'悦榕庄SPA水疗', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:680, kidsFriendly:false, elderlyFriendly:true, romanticLevel:5, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:10,anxious:8,sad:9,calm:8,excited:2,happy:5}, tags:['高端','放松','按摩'], estimatedDuration:120, mapX:15, mapY:55, city:'杭州' },
  { id:2, name:'猫的天空之城·概念书店', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:35, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:9,anxious:9,sad:10,calm:9,excited:3,happy:6}, tags:['安静','文艺','拍照'], estimatedDuration:90, mapX:35, mapY:42, city:'杭州' },
  { id:4, name:'永福寺·抄经体验', category:'temple', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:45, kidsFriendly:true, elderlyFriendly:true, minAge:6, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:4, nearMedical:false, moodScores:{tired:8,anxious:10,sad:9,calm:9,excited:2,happy:5}, tags:['安静','禅意','抄经'], estimatedDuration:120, mapX:13, mapY:28, city:'杭州' },
  { id:5, name:'中国茶叶博物馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:3,happy:6}, tags:['免费','安静','品茶'], estimatedDuration:90, mapX:22, mapY:38, city:'杭州' },
  { id:6, name:'西湖漫步', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:6,anxious:5,sad:8,calm:8,excited:6,happy:8}, tags:['免费','西湖','散步'], estimatedDuration:60, mapX:38, mapY:50, city:'杭州' },
  { id:7, name:'杭州宋城·千古情', category:'theme_park', energyLevel:4, crowdednessLevel:4, weatherSensitivity:'mixed', ticketPrice:320, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:2,anxious:2,sad:3,calm:5,excited:10,happy:9}, tags:['演出','穿越','亲子'], estimatedDuration:240, mapX:18, mapY:68, city:'杭州' },
  { id:8, name:'苏堤骑行', category:'sport', energyLevel:4, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:30, kidsFriendly:true, elderlyFriendly:false, minAge:8, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:2,anxious:4,sad:4,calm:6,excited:9,happy:9}, tags:['骑行','户外','运动'], estimatedDuration:120, mapX:30, mapY:46, city:'杭州' },
  { id:9, name:'河坊街夜市', category:'shopping', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:true, restSeats:2, nearMedical:true, moodScores:{tired:3,anxious:2,sad:4,calm:5,excited:8,happy:9}, tags:['免费','小吃','古街'], estimatedDuration:120, mapX:48, mapY:62, city:'杭州' },
  { id:10, name:'湖滨银泰in77', category:'shopping', energyLevel:3, crowdednessLevel:4, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:4,anxious:3,sad:4,calm:6,excited:8,happy:9}, tags:['购物','美食','免费'], estimatedDuration:150, mapX:52, mapY:52, city:'杭州' },
  { id:11, name:'杭州动物园', category:'theme_park', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:20, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:4,anxious:5,sad:5,calm:7,excited:8,happy:9}, tags:['亲子','动物','户外'], estimatedDuration:180, mapX:20, mapY:60, city:'杭州' },
  { id:12, name:'浙江省科技馆', category:'museum', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:5,anxious:5,sad:5,calm:7,excited:8,happy:8}, tags:['免费','亲子','互动'], estimatedDuration:120, mapX:58, mapY:40, city:'杭州' },
  { id:15, name:'郭庄园林下午茶', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'mixed', ticketPrice:68, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:false, restSeats:5, nearMedical:false, moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:5,happy:7}, tags:['园林','下午茶','安静'], estimatedDuration:90, mapX:25, mapY:42, city:'杭州' },
  { id:16, name:'Wagas轻食沙拉', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:68, isDietFriendly:true, dietaryTags:['lowFat','highProtein'], avgCalories:350, queueTime:5, hasElevator:true, spicinessLevel:0, hasPrivateRoom:false, hasHotTea:false, noiseLevel:2, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:6,sad:6,calm:7,excited:5,happy:6}, estimatedDuration:60, mapX:55, mapY:48, city:'杭州' },
  { id:17, name:'蒸年轻·蒸汽海鲜', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:90, isDietFriendly:true, dietaryTags:['lowFat','highProtein','lightFlavor'], avgCalories:400, queueTime:15, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:6,happy:7}, estimatedDuration:60, mapX:44, mapY:55, city:'杭州' },
  { id:18, name:'楼外楼·杭帮菜', category:'restaurant', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor', ticketPrice:120, isDietFriendly:false, dietaryTags:[], avgCalories:900, queueTime:45, hasElevator:false, spicinessLevel:1, hasPrivateRoom:true, hasHotTea:true, noiseLevel:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:3, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:4,sad:5,calm:6,excited:7,happy:8}, estimatedDuration:60, mapX:40, mapY:48, city:'杭州' },
  { id:19, name:'外婆家', category:'restaurant', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'indoor', ticketPrice:65, isDietFriendly:false, dietaryTags:[], avgCalories:750, queueTime:60, hasElevator:true, spicinessLevel:1, hasPrivateRoom:false, hasHotTea:true, noiseLevel:4, romanticLevel:2, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:2, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:4,anxious:3,sad:4,calm:5,excited:6,happy:7}, estimatedDuration:60, mapX:50, mapY:58, city:'杭州' },
  { id:20, name:'浙江美术馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:8,excited:4,happy:6}, tags:['免费','艺术','安静'], estimatedDuration:90, mapX:44, mapY:62, city:'杭州' },
  { id:21, name:'西西弗书店', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:30, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:9,anxious:8,sad:9,calm:9,excited:3,happy:6}, tags:['安静','咖啡','阅读'], estimatedDuration:90, mapX:54, mapY:44, city:'杭州' },
  { id:23, name:'灵隐寺', category:'temple', energyLevel:3, crowdednessLevel:5, weatherSensitivity:'outdoor', ticketPrice:75, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:4,anxious:4,sad:5,calm:6,excited:5,happy:6}, tags:['佛教','古迹','人流量大'], estimatedDuration:120, mapX:10, mapY:22, city:'杭州' },
  { id:24, name:'九溪烟树', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:4,anxious:6,sad:7,calm:8,excited:7,happy:8}, tags:['免费','徒步','溪流'], estimatedDuration:180, mapX:22, mapY:72, city:'杭州' },
  { id:25, name:'知味观·味庄', category:'restaurant', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:85, isDietFriendly:true, dietaryTags:['lightFlavor','traditional'], avgCalories:500, queueTime:10, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:8,anxious:8,sad:8,calm:8,excited:5,happy:7}, estimatedDuration:60, mapX:42, mapY:52, city:'杭州' },
  { id:27, name:'鼎泰丰', category:'restaurant', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:110, isDietFriendly:true, dietaryTags:['lightFlavor','steamed'], avgCalories:420, queueTime:20, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:3, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, estimatedDuration:60, mapX:56, mapY:50, city:'杭州' },
  { id:28, name:'方回春堂·药膳餐厅', category:'restaurant', energyLevel:1, crowdednessLevel:1, weatherSensitivity:'indoor', ticketPrice:75, isDietFriendly:true, dietaryTags:['medicinal','lightFlavor','warm'], avgCalories:380, queueTime:5, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:1, romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:true, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:9,anxious:9,sad:9,calm:9,excited:3,happy:6}, estimatedDuration:60, mapX:46, mapY:60, city:'杭州' },
  // === 宁波 ===
  { id:101, name:'天一阁', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:30, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:7,anxious:8,sad:7,calm:9,excited:4,happy:6}, tags:['古迹','藏书','安静'], estimatedDuration:90, mapX:72, mapY:40, city:'宁波' },
  { id:102, name:'老外滩酒吧街', category:'shopping', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:false, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:true, moodScores:{tired:3,anxious:3,sad:4,calm:5,excited:8,happy:9}, tags:['夜景','酒吧','免费'], estimatedDuration:120, mapX:74, mapY:42, city:'宁波' },
  { id:103, name:'东钱湖骑行', category:'sport', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:8, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:3,anxious:5,sad:5,calm:7,excited:9,happy:9}, tags:['骑行','湖景','免费'], estimatedDuration:180, mapX:70, mapY:44, city:'宁波' },
  { id:104, name:'宁波状元楼酒店', category:'restaurant', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:120, isDietFriendly:true, dietaryTags:['seafood','traditional'], avgCalories:500, queueTime:15, hasElevator:true, spicinessLevel:0, hasPrivateRoom:true, hasHotTea:true, noiseLevel:2, romanticLevel:3, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:6,happy:8}, estimatedDuration:60, mapX:73, mapY:41, city:'宁波' },
  // === 温州 ===
  { id:201, name:'雁荡山灵峰', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:50, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:4,anxious:5,sad:6,calm:7,excited:9,happy:8}, tags:['山水','徒步','奇峰'], estimatedDuration:240, mapX:68, mapY:70, city:'温州' },
  { id:202, name:'五马街美食', category:'shopping', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:true, moodScores:{tired:4,anxious:4,sad:5,calm:6,excited:8,happy:9}, tags:['美食','古街','免费'], estimatedDuration:120, mapX:66, mapY:72, city:'温州' },
  { id:203, name:'楠溪江竹筏漂流', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:80, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:8,excited:8,happy:9}, tags:['漂流','山水','情侣'], estimatedDuration:120, mapX:64, mapY:68, city:'温州' },
  // === 嘉兴 ===
  { id:301, name:'乌镇西栅', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:150, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:5,anxious:6,sad:6,calm:8,excited:8,happy:9}, tags:['水乡','夜景','拍照'], estimatedDuration:300, mapX:50, mapY:30, city:'嘉兴' },
  { id:302, name:'西塘古镇', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:95, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:5,anxious:6,sad:6,calm:8,excited:7,happy:8}, tags:['古镇','廊桥','文艺'], estimatedDuration:240, mapX:52, mapY:28, city:'嘉兴' },
  { id:303, name:'南湖革命纪念馆', category:'museum', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:1, hasPhotoSpot:false, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:5,anxious:5,sad:5,calm:6,excited:4,happy:5}, tags:['红色','免费','教育'], estimatedDuration:90, mapX:54, mapY:32, city:'嘉兴' },
  // === 绍兴 ===
  { id:401, name:'鲁迅故里', category:'museum', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:8,excited:5,happy:7}, tags:['文学','免费','古迹'], estimatedDuration:120, mapX:58, mapY:48, city:'绍兴' },
  { id:402, name:'沈园之夜', category:'scenic', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:40, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:9,excited:5,happy:7}, tags:['园林','爱情','夜游'], estimatedDuration:90, mapX:56, mapY:46, city:'绍兴' },
  { id:403, name:'咸亨酒店', category:'restaurant', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:60, isDietFriendly:false, dietaryTags:['traditional','huangjiu'], avgCalories:650, queueTime:20, hasElevator:false, spicinessLevel:1, hasPrivateRoom:true, hasHotTea:true, noiseLevel:3, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:false, restSeats:2, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:5,anxious:4,sad:5,calm:6,excited:6,happy:7}, estimatedDuration:60, mapX:57, mapY:47, city:'绍兴' },
  // === 舟山 ===
  { id:501, name:'普陀山', category:'temple', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:160, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:4,anxious:5,sad:6,calm:7,excited:6,happy:7}, tags:['佛教','海岛','祈福'], estimatedDuration:240, mapX:82, mapY:28, city:'舟山' },
  { id:502, name:'朱家尖南沙', category:'scenic', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:75, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:5,anxious:5,sad:6,calm:7,excited:9,happy:9}, tags:['沙滩','大海','亲子'], estimatedDuration:180, mapX:84, mapY:30, city:'舟山' },
  { id:503, name:'沈家门海鲜夜排档', category:'restaurant', energyLevel:1, crowdednessLevel:4, weatherSensitivity:'outdoor', ticketPrice:100, isDietFriendly:true, dietaryTags:['seafood','fresh'], avgCalories:450, queueTime:10, hasElevator:true, spicinessLevel:1, hasPrivateRoom:false, hasHotTea:true, noiseLevel:4, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:2, nearMedical:false, kidsFriendly:true, elderlyFriendly:true, moodScores:{tired:4,anxious:3,sad:5,calm:5,excited:8,happy:9}, estimatedDuration:60, mapX:80, mapY:32, city:'舟山' },
  // === 湖州 ===
  { id:601, name:'莫干山裸心谷', category:'leisure', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'mixed', ticketPrice:200, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:false, moodScores:{tired:8,anxious:9,sad:8,calm:9,excited:6,happy:8}, tags:['民宿','竹海','避暑'], estimatedDuration:240, mapX:32, mapY:22, city:'湖州' },
  { id:602, name:'南浔古镇', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:100, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:8,excited:6,happy:7}, tags:['古镇','水乡','安静'], estimatedDuration:180, mapX:36, mapY:24, city:'湖州' },
  // === 丽水 ===
  { id:701, name:'云和梯田', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:80, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:4,anxious:6,sad:7,calm:8,excited:8,happy:8}, tags:['梯田','日出','摄影'], estimatedDuration:180, mapX:40, mapY:80, city:'丽水' },
  { id:702, name:'古堰画乡', category:'scenic', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:50, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:false, moodScores:{tired:6,anxious:7,sad:7,calm:9,excited:6,happy:7}, tags:['写生','古村','文艺'], estimatedDuration:150, mapX:38, mapY:78, city:'丽水' },
  // === 金华 ===
  { id:801, name:'横店影视城', category:'theme_park', energyLevel:4, crowdednessLevel:4, weatherSensitivity:'mixed', ticketPrice:280, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:2,anxious:2,sad:3,calm:5,excited:10,happy:9}, tags:['影视','穿越','亲子'], estimatedDuration:360, mapX:48, mapY:64, city:'金华' },
  { id:802, name:'武义温泉', category:'leisure', energyLevel:1, crowdednessLevel:2, weatherSensitivity:'indoor', ticketPrice:150, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:4, hasPhotoSpot:false, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:false, moodScores:{tired:9,anxious:9,sad:9,calm:9,excited:5,happy:7}, tags:['温泉','放松','养生'], estimatedDuration:180, mapX:44, mapY:66, city:'金华' },
  // === 衢州 ===
  { id:901, name:'江郎山', category:'scenic', energyLevel:4, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:100, kidsFriendly:false, elderlyFriendly:false, minAge:10, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:1, nearMedical:false, moodScores:{tired:2,anxious:3,sad:4,calm:5,excited:10,happy:8}, tags:['登山','奇峰','户外'], estimatedDuration:300, mapX:30, mapY:60, city:'衢州' },
  // === 台州 ===
  { id:1001, name:'天台山国清寺', category:'temple', energyLevel:2, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:3, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:9,excited:5,happy:7}, tags:['佛教','免费','古刹'], estimatedDuration:120, mapX:60, mapY:60, city:'台州' },
  { id:1002, name:'神仙居', category:'scenic', energyLevel:3, crowdednessLevel:2, weatherSensitivity:'outdoor', ticketPrice:110, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:2, nearMedical:false, moodScores:{tired:3,anxious:4,sad:5,calm:6,excited:9,happy:8}, tags:['仙境','栈道','拍照'], estimatedDuration:240, mapX:62, mapY:62, city:'台州' },
  // === 上海 ===
  { id:1101, name:'外滩·万国建筑群', category:'scenic', energyLevel:2, crowdednessLevel:4, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:5,anxious:4,sad:6,calm:7,excited:8,happy:9}, tags:['夜景','免费','地标'], estimatedDuration:120, mapX:72, mapY:12, city:'上海' },
  { id:1102, name:'迪士尼乐园', category:'theme_park', energyLevel:5, crowdednessLevel:5, weatherSensitivity:'mixed', ticketPrice:475, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:true, moodScores:{tired:1,anxious:2,sad:2,calm:3,excited:10,happy:10}, tags:['童话','烟花','童年'], estimatedDuration:480, mapX:68, mapY:14, city:'上海' },
  { id:1103, name:'武康路·安福路', category:'leisure', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:7,anxious:6,sad:7,calm:9,excited:6,happy:8}, tags:['梧桐','咖啡','文艺'], estimatedDuration:90, mapX:70, mapY:13, city:'上海' },
  // === 南京 ===
  { id:1201, name:'中山陵·明孝陵', category:'scenic', energyLevel:3, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:false, minAge:5, romanticLevel:2, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:false, wheelchairAccessible:false, restSeats:3, nearMedical:false, moodScores:{tired:3,anxious:3,sad:5,calm:6,excited:7,happy:7}, tags:['历史','免费','陵园'], estimatedDuration:180, mapX:52, mapY:10, city:'南京' },
  { id:1202, name:'夫子庙·秦淮河', category:'scenic', energyLevel:2, crowdednessLevel:4, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:6,anxious:4,sad:6,calm:7,excited:8,happy:9}, tags:['夜游','画舫','小吃'], estimatedDuration:120, mapX:54, mapY:12, city:'南京' },
  { id:1203, name:'牛首山·佛顶宫', category:'temple', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'mixed', ticketPrice:98, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:false, moodScores:{tired:7,anxious:8,sad:8,calm:9,excited:6,happy:7}, tags:['佛教','建筑','震撼'], estimatedDuration:150, mapX:50, mapY:11, city:'南京' },
  // === 苏州 ===
  { id:1301, name:'拙政园·苏州园林', category:'scenic', energyLevel:2, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:80, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:5, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:5, nearMedical:true, moodScores:{tired:7,anxious:8,sad:8,calm:9,excited:6,happy:8}, tags:['园林','世界遗产','精致'], estimatedDuration:120, mapX:58, mapY:16, city:'苏州' },
  { id:1302, name:'平江路·山塘街', category:'leisure', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'outdoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:0, romanticLevel:4, hasPhotoSpot:true, hasNursingRoom:false, strollerFriendly:true, wheelchairAccessible:true, restSeats:3, nearMedical:true, moodScores:{tired:8,anxious:7,sad:7,calm:9,excited:5,happy:7}, tags:['水巷','茶馆','慢生活'], estimatedDuration:90, mapX:60, mapY:17, city:'苏州' },
  { id:1303, name:'苏州博物馆·贝聿铭', category:'museum', energyLevel:1, crowdednessLevel:3, weatherSensitivity:'indoor', ticketPrice:0, kidsFriendly:true, elderlyFriendly:true, minAge:3, romanticLevel:3, hasPhotoSpot:true, hasNursingRoom:true, strollerFriendly:true, wheelchairAccessible:true, restSeats:4, nearMedical:true, moodScores:{tired:7,anxious:7,sad:6,calm:9,excited:6,happy:7}, tags:['建筑','免费','艺术'], estimatedDuration:90, mapX:59, mapY:16, city:'苏州' }
];

// ================================================================
//  POI数据增强：基于现有属性智能填充新维度属性
// ================================================================
(function enrichPOIs() {
  for (var i = 0; i < POIS.length; i++) {
    var p = POIS[i];
    var cat = p.category;
    var tags = p.tags || [];
    var isOutdoor = p.weatherSensitivity === 'outdoor' || p.weatherSensitivity === 'mixed';
    var isIndoor = p.weatherSensitivity === 'indoor';
    var isNature = cat === 'scenic' || cat === 'sport';
    var isCultural = cat === 'museum' || cat === 'temple';
    var isFood = cat === 'restaurant';
    var isShopping = cat === 'shopping';
    var isRelax = cat === 'leisure';
    var isTheme = cat === 'theme_park';

    // seasonalScore: 该POI在各季节的适配度 (1-10)
    if (!p.seasonalScore) {
      if (isNature) {
        p.seasonalScore = { spring: 9, summer: isOutdoor ? 7 : 8, autumn: 9, winter: isOutdoor ? 4 : 6 };
      } else if (isCultural) {
        p.seasonalScore = { spring: 8, summer: 8, autumn: 9, winter: 7 };
      } else if (isFood || isShopping) {
        p.seasonalScore = { spring: 8, summer: 8, autumn: 8, winter: 8 };
      } else if (isRelax) {
        p.seasonalScore = { spring: 8, summer: isIndoor ? 9 : 7, autumn: 9, winter: isIndoor ? 9 : 5 };
      } else if (isTheme) {
        p.seasonalScore = { spring: 8, summer: 7, autumn: 8, winter: 6 };
      } else {
        p.seasonalScore = { spring: 7, summer: 7, autumn: 7, winter: 6 };
      }
      // 特殊调整：有避暑标签的夏季加分
      if (tags.indexOf('避暑') !== -1) p.seasonalScore.summer = 10;
      if (tags.indexOf('温泉') !== -1) { p.seasonalScore.winter = 10; p.seasonalScore.summer = 4; }
      if (tags.indexOf('雪') !== -1 || tags.indexOf('滑雪') !== -1) p.seasonalScore.winter = 10;
    }

    // weatherSensitivity 已存在，跳过

    // crowdProfile: 典型人群画像
    if (!p.crowdProfile) {
      var cLevel = p.crowdednessLevel || 3;
      if (cLevel <= 2) p.crowdProfile = '安静小众';
      else if (cLevel <= 3) p.crowdProfile = '适中';
      else if (cLevel <= 4) p.crowdProfile = '较热门';
      else p.crowdProfile = '热门打卡';
    }

    // bestTimeOfDay: 最佳游览时段
    if (!p.bestTimeOfDay) {
      if (tags.indexOf('夜景') !== -1 || tags.indexOf('夜游') !== -1) {
        p.bestTimeOfDay = 'evening';
      } else if (tags.indexOf('日出') !== -1) {
        p.bestTimeOfDay = 'morning';
      } else if (isFood && tags.indexOf('小吃') !== -1) {
        p.bestTimeOfDay = 'evening';
      } else if (isOutdoor && p.energyLevel >= 3) {
        p.bestTimeOfDay = 'morning';
      } else if (isRelax) {
        p.bestTimeOfDay = 'afternoon';
      } else {
        p.bestTimeOfDay = 'afternoon';
      }
    }

    // photoScore: 出片指数 (1-10)
    if (!p.photoScore) {
      if (p.hasPhotoSpot) p.photoScore = Math.min(10, 6 + (p.romanticLevel || 3));
      else if (isNature) p.photoScore = Math.min(10, 5 + (p.romanticLevel || 3));
      else if (isCultural) p.photoScore = 5;
      else p.photoScore = 3;
    }

    // accessibility: 可达性
    if (!p.accessibility) {
      if (p.wheelchairAccessible && p.energyLevel <= 2) p.accessibility = 'easy';
      else if (p.energyLevel >= 4) p.accessibility = 'difficult';
      else p.accessibility = 'moderate';
    }

    // familyFriendly: 亲子友好度
    if (p.familyFriendly === undefined) {
      p.familyFriendly = !!(p.kidsFriendly && p.elderlyFriendly && p.energyLevel <= 3 && (p.hasNursingRoom || p.strollerFriendly || p.restSeats >= 3));
    }

    // romanticScore: 浪漫指数 (1-10)
    if (!p.romanticScore) {
      p.romanticScore = Math.min(10, (p.romanticLevel || 1) * 2);
    }

    // adventureScore: 冒险指数 (1-10)
    if (!p.adventureScore) {
      if (tags.indexOf('户外') !== -1 || tags.indexOf('登山') !== -1 || tags.indexOf('徒步') !== -1) p.adventureScore = 8;
      else if (isNature && p.energyLevel >= 3) p.adventureScore = 6;
      else if (tags.indexOf('骑行') !== -1) p.adventureScore = 7;
      else p.adventureScore = Math.max(1, p.energyLevel - 1);
    }

    // culturalScore: 文化深度 (1-10)
    if (!p.culturalScore) {
      if (cat === 'museum') p.culturalScore = 9;
      else if (cat === 'temple') p.culturalScore = 8;
      else if (tags.indexOf('古迹') !== -1 || tags.indexOf('佛教') !== -1 || tags.indexOf('文学') !== -1) p.culturalScore = 8;
      else if (tags.indexOf('文艺') !== -1 || tags.indexOf('古街') !== -1) p.culturalScore = 6;
      else p.culturalScore = 3;
    }

    // relaxationScore: 放松指数 (1-10)
    if (!p.relaxationScore) {
      if (cat === 'leisure') p.relaxationScore = 9;
      else if (cat === 'temple') p.relaxationScore = 7;
      else if (p.energyLevel <= 1 && p.crowdednessLevel <= 2) p.relaxationScore = 8;
      else if (p.energyLevel <= 2) p.relaxationScore = 6;
      else p.relaxationScore = Math.max(1, 10 - p.energyLevel * 2);
      if (tags.indexOf('温泉') !== -1) p.relaxationScore = 10;
      if (tags.indexOf('按摩') !== -1) p.relaxationScore = 10;
    }

    // ================================================================
    //  新增POI增强字段：拍照时间、本地贴士、隐藏宝地等
    // ================================================================

    // bestPhotoTime: 最佳拍照时间
    if (!p.bestPhotoTime) {
      if (tags.indexOf('日出') !== -1) p.bestPhotoTime = '清晨5:30-7:00';
      else if (tags.indexOf('夜景') !== -1 || tags.indexOf('夜游') !== -1) p.bestPhotoTime = '傍晚17:30-19:30（蓝调时刻）';
      else if (tags.indexOf('日落') !== -1) p.bestPhotoTime = '傍晚16:30-18:00';
      else if (isNature && p.bestTimeOfDay === 'morning') p.bestPhotoTime = '清晨6:00-8:00（光线柔和）';
      else if (isCultural) p.bestPhotoTime = '上午9:00-11:00（人少光影好）';
      else if (isFood) p.bestPhotoTime = '自然光充足时段，靠窗位置最佳';
      else if (isRelax) p.bestPhotoTime = '下午14:00-16:00（午后阳光）';
      else if (isTheme) p.bestPhotoTime = '开园后1小时内（人少）';
      else p.bestPhotoTime = '上午9:00-11:00';
    }

    // instagramWorthy: 出片指数 (1-10)
    if (!p.instagramWorthy) {
      var base = p.hasPhotoSpot ? 7 : 4;
      if (p.romanticLevel >= 4) base += 2;
      if (isNature) base += 1;
      if (tags.indexOf('拍照') !== -1) base += 2;
      if (tags.indexOf('网红') !== -1) base += 1;
      p.instagramWorthy = Math.min(10, base);
    }

    // hiddenGem: 是否为隐藏宝地
    if (p.hiddenGem === undefined) {
      p.hiddenGem = (p.crowdednessLevel <= 2 && p.rating !== undefined && p.rating >= 4.3) ||
                    (tags.indexOf('小众') !== -1 || tags.indexOf('安静') !== -1 && p.crowdednessLevel <= 2);
      // 部分高评分但冷门的POI标记为隐藏宝地
      if (!p.hiddenGem && p.crowdednessLevel <= 2 && p.photoScore >= 6 && p.culturalScore >= 7) p.hiddenGem = true;
      if (p.crowdednessLevel >= 4) p.hiddenGem = false;
    }

    // crowdPeakHours: 人流高峰时段
    if (!p.crowdPeakHours) {
      if (isTheme) p.crowdPeakHours = '10:00-15:00（周末及节假日）';
      else if (isFood) p.crowdPeakHours = '11:30-13:00 及 17:30-19:30';
      else if (isShopping) p.crowdPeakHours = '14:00-17:00 及 19:00-21:00';
      else if (isCultural) p.crowdPeakHours = '10:00-12:00 及 14:00-16:00';
      else if (isNature) p.crowdPeakHours = '9:00-11:00（周末及节假日）';
      else p.crowdPeakHours = '10:00-15:00';
    }

    // seasonalBeauty: 最美季节
    if (!p.seasonalBeauty) {
      if (tags.indexOf('樱花') !== -1 || tags.indexOf('桃花') !== -1) p.seasonalBeauty = 'spring';
      else if (tags.indexOf('荷花') !== -1 || tags.indexOf('避暑') !== -1 || tags.indexOf('漂流') !== -1) p.seasonalBeauty = 'summer';
      else if (tags.indexOf('红叶') !== -1 || tags.indexOf('银杏') !== -1 || tags.indexOf('梯田') !== -1) p.seasonalBeauty = 'autumn';
      else if (tags.indexOf('温泉') !== -1 || tags.indexOf('雪') !== -1) p.seasonalBeauty = 'winter';
      else if (isNature && p.seasonalScore) {
        var best = 'spring'; var maxScore = 0;
        for (var sk in p.seasonalScore) { if (p.seasonalScore[sk] > maxScore) { maxScore = p.seasonalScore[sk]; best = sk; } }
        p.seasonalBeauty = best;
      } else if (isCultural) p.seasonalBeauty = 'autumn';
      else p.seasonalBeauty = 'spring';
    }

    // avgStayTime: 建议停留时间（分钟）
    if (!p.avgStayTime) {
      p.avgStayTime = p.estimatedDuration || 90;
    }

    // photoTip: 拍照技巧建议
    if (!p.photoTip) {
      if (isNature) {
        if (tags.indexOf('湖') !== -1 || tags.indexOf('水') !== -1) p.photoTip = '利用水面倒影构图，低角度拍摄更有层次感';
        else if (tags.indexOf('山') !== -1 || tags.indexOf('登山') !== -1) p.photoTip = '登顶后广角拍摄全景，黄金时刻（日出日落）光线最佳';
        else if (tags.indexOf('溪流') !== -1) p.photoTip = '慢门拍摄流水，配合三脚架效果更佳';
        else p.photoTip = '黄金时刻拍摄，逆光人像更有氛围感';
      } else if (isCultural) {
        if (tags.indexOf('古迹') !== -1) p.photoTip = '利用框架构图（门、窗、廊柱），增加画面层次感';
        else if (tags.indexOf('佛教') !== -1 || tags.indexOf('寺院') !== -1) p.photoTip = '低角度仰拍建筑，避开人群，注意尊重宗教场所';
        else p.photoTip = '对称构图拍摄建筑，利用光影营造氛围';
      } else if (isFood) {
        p.photoTip = '45度俯拍食物，利用自然光，靠窗位置最佳';
      } else if (isShopping || tags.indexOf('古街') !== -1) {
        p.photoTip = '抓拍街头人文，利用巷子纵深感构图';
      } else if (isRelax) {
        p.photoTip = '利用窗边自然光，营造慵懒氛围感';
      } else if (isTheme) {
        p.photoTip = '与标志性场景合影，利用广角镜头拍出冲击力';
      } else {
        p.photoTip = '寻找独特视角，避开人群，多尝试不同角度';
      }
    }

    // localTip: 本地人小贴士
    if (!p.localTip) {
      if (p.id === 1) p.localTip = '杭州本地人推荐：做完SPA可以去旁边的龙井茶园散步，感受真正的慢生活';
      else if (p.id === 2) p.localTip = '本地文艺青年聚集地，周末有小型读书会，可以偶遇同好';
      else if (p.id === 4) p.localTip = '本地人推荐：抄经后用毛笔蘸清水在石板上练字，心静如水';
      else if (p.id === 6) p.localTip = '西湖边长大的本地人建议：清晨6点苏堤最美，游客还没到，只有晨练的老人和水鸟';
      else if (p.id === 7) p.localTip = '本地人建议：下午场人少，性价比更高，晚上看演出刚好';
      else if (p.id === 9) p.localTip = '河坊街主街游客多，本地人会拐进旁边的小巷子，藏着真正好吃的小店';
      else if (p.id === 15) p.localTip = '杭州本地人私藏：郭庄比西湖边的茶馆安静十倍，茶点也精致';
      else if (p.id === 23) p.localTip = '本地人建议：避开初一十五，早上7点前到人最少，还能听到早课诵经';
      else if (p.id === 24) p.localTip = '九溪十八涧的精华在雨后，溪水充沛，赤脚踩水最惬意';
      else if (p.id === 101) p.localTip = '宁波本地人：天一阁旁边的月湖公园免费，风景不输景区';
      else if (p.id === 201) p.localTip = '温州本地人推荐：雁荡山夜景比白天更震撼，灵峰夜景不容错过';
      else if (p.id === 301) p.localTip = '乌镇本地人：西栅夜景美但人多，东栅清晨更有原汁原味的水乡生活';
      else if (p.id === 401) p.localTip = '绍兴本地人建议：从百草园到三味书屋慢慢走，感受鲁迅笔下的童年';
      else if (p.id === 501) p.localTip = '舟山本地人：普陀山建议住一晚，清晨的寺庙最宁静，还能看海上日出';
      else if (p.id === 601) p.localTip = '莫干山本地人：裸心谷的竹林步道免费开放，不一定要住里面';
      else if (p.id === 701) p.localTip = '丽水本地人：云和梯田5-6月灌水期最美，镜面效果绝了';
      else if (p.id === 801) p.localTip = '横店本地人：下午场门票便宜一半，还能避开旅行团高峰';
      else if (p.id === 802) p.localTip = '武义本地人：温泉泡完记得喝杯当地的武阳春雨茶，解乏';
      else if (p.id === 1001) p.localTip = '天台本地人：国清寺的素斋很有名，但需要提前预约';
      else if (p.id === 1002) p.localTip = '神仙居雨后初晴时去，云海翻涌如同仙境';
      else if (p.city === '杭州') p.localTip = '杭州本地人小秘密：西湖边不要打车，骑共享单车最方便';
      else if (p.city === '宁波') p.localTip = '宁波本地人推荐：海鲜去舟山沈家门吃，宁波市区吃汤圆和老外滩';
      else if (p.city === '嘉兴') p.localTip = '嘉兴本地人：粽子不一定吃五芳斋，小巷子里的阿婆粽更有味道';
      else if (p.city === '绍兴') p.localTip = '绍兴本地人：黄酒奶茶意外好喝，鲁迅故里门口就有卖';
      else p.localTip = '本地人推荐：周边小巷子走走，往往藏着最地道的小吃和风景';
    }
  }
})();

var HOTELS = [
  { id:1, name:'安缦法云精品酒店', priceRangeLow:3800, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:10,anxious:9,sad:9,calm:10,excited:7,happy:8}, rating:4.9, featureTags:['禅意设计','山景房','顶级SPA','隐世奢华','竹林环绕'], mapX:12, mapY:24, city:'杭州' },
  { id:2, name:'西溪湿地悦榕庄', priceRangeLow:2200, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:10,anxious:9,sad:9,calm:9,excited:8,happy:8}, rating:4.8, featureTags:['湿地景观','水疗SPA','江南园林','度假村','静谧'], mapX:20, mapY:35, city:'杭州' },
  { id:3, name:'西湖国宾馆', priceRangeLow:1200, stars:5, has_spa:false, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:7}, rating:4.7, featureTags:['西湖景观','国宾级服务','园林式','商务','湖景房'], mapX:38, mapY:48, city:'杭州' },
  { id:4, name:'全季酒店（西湖店）', priceRangeLow:350, stars:3, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:false, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:5,anxious:5,sad:5,calm:6,excited:5,happy:6}, rating:4.3, featureTags:['性价比','交通便利','简约设计','近西湖'], mapX:40, mapY:50, city:'杭州' },
  { id:5, name:'如家快捷酒店', priceRangeLow:180, stars:2, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:false, kidsFriendly:false, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:3,anxious:3,sad:3,calm:4,excited:3,happy:4}, rating:3.8, featureTags:['经济实惠','交通便利','干净'], mapX:42, mapY:52, city:'杭州' },
  { id:6, name:'杭州西子湖四季酒店', priceRangeLow:2800, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:9,anxious:9,sad:9,calm:10,excited:8,happy:9}, rating:4.9, featureTags:['西湖景观','顶级服务','园林设计','米其林餐厅','私密'], mapX:36, mapY:46, city:'杭州' },
  // === 宁波 ===
  { id:101, name:'宁波威斯汀酒店', priceRangeLow:680, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:6,happy:7}, rating:4.6, featureTags:['江景房','商务','天际泳池','市中心'], mapX:72, mapY:40, city:'宁波' },
  { id:102, name:'亚朵酒店（宁波老外滩店）', priceRangeLow:350, stars:4, has_spa:false, has_pool:false, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:5,happy:6}, rating:4.5, featureTags:['设计感','阅读空间','老外滩','性价比'], mapX:74, mapY:42, city:'宁波' },
  // === 温州 ===
  { id:201, name:'温州香格里拉', priceRangeLow:780, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:7,happy:8}, rating:4.7, featureTags:['瓯江景观','商务','豪华','天际泳池'], mapX:66, mapY:71, city:'温州' },
  // === 嘉兴 ===
  { id:301, name:'乌镇枕水度假酒店', priceRangeLow:880, stars:5, has_spa:true, has_pool:true, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:8}, rating:4.8, featureTags:['水乡景观','枕水而居','江南韵味','度假','古镇'], mapX:50, mapY:30, city:'嘉兴' },
  { id:302, name:'西塘花筑·奢', priceRangeLow:420, stars:4, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, rating:4.5, featureTags:['古镇民宿','花筑系列','文艺','水乡'], mapX:52, mapY:28, city:'嘉兴' },
  // === 绍兴 ===
  { id:401, name:'绍兴咸亨大酒店', priceRangeLow:380, stars:4, has_spa:false, has_pool:false, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:5,happy:6}, rating:4.4, featureTags:['文化主题','鲁迅故里旁','黄酒文化','历史感'], mapX:57, mapY:47, city:'绍兴' },
  // === 舟山 ===
  { id:501, name:'普陀山雷迪森庄园', priceRangeLow:1200, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:6,happy:8}, rating:4.7, featureTags:['海景房','禅修','海岛度假','普陀山','素食'], mapX:82, mapY:28, city:'舟山' },
  // === 湖州 ===
  { id:601, name:'莫干山裸心堡', priceRangeLow:2500, stars:5, has_spa:true, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:9,anxious:9,sad:9,calm:10,excited:7,happy:9}, rating:4.9, featureTags:['山顶城堡','无边泳池','竹海景观','设计感','避世'], mapX:32, mapY:22, city:'湖州' },
  { id:602, name:'莫干山芝麻谷艺术酒店', priceRangeLow:680, stars:4, has_spa:false, has_pool:true, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:6,happy:8}, rating:4.6, featureTags:['艺术设计','彩色建筑','网红打卡','莫干山'], mapX:34, mapY:23, city:'湖州' },
  // === 丽水 ===
  { id:701, name:'云和梯田民宿', priceRangeLow:280, stars:3, has_spa:false, has_pool:false, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:7,anxious:7,sad:7,calm:8,excited:5,happy:7}, rating:4.3, featureTags:['梯田景观','日出','民宿','原生态'], mapX:40, mapY:80, city:'丽水' },
  // === 金华 ===
  { id:801, name:'横店丰景嘉丽大酒店', priceRangeLow:480, stars:4, has_spa:false, has_pool:true, has_gym:true, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:true, businessFriendly:true, moodScores:{tired:6,anxious:6,sad:6,calm:7,excited:7,happy:8}, rating:4.4, featureTags:['影视主题','横店周边','亲子','主题房'], mapX:48, mapY:64, city:'金华' },
  // === 台州 ===
  { id:1001, name:'天台温泉山庄', priceRangeLow:520, stars:4, has_spa:true, has_pool:true, has_gym:false, breakfastIncluded:true, kidsFriendly:true, elderlyFriendly:true, nearTransport:false, businessFriendly:false, moodScores:{tired:8,anxious:8,sad:8,calm:9,excited:5,happy:7}, rating:4.5, featureTags:['温泉','山景','养生','天台山'], mapX:60, mapY:60, city:'台州' }
];

var WEIGHT_MATRIX = {
  'tired_solo':     { mood:0.35, budget:0.15, energy:0.30, crowd:0.15, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.05 },
  'tired_couple':   { mood:0.30, budget:0.10, energy:0.15, crowd:0.10, kid:0, elderly:0, couple:0.30, friends:0, business:0, diet:0.05 },
  'tired_friends':  { mood:0.25, budget:0.10, energy:0.10, crowd:0.10, kid:0, elderly:0, couple:0, friends:0.35, business:0, diet:0.10 },
  'tired_family':   { mood:0.25, budget:0.15, energy:0.30, crowd:0.15, kid:0.10, elderly:0.10, couple:0, friends:0, business:0, diet:0.05 },
  'tired_business': { mood:0.15, budget:0.15, energy:0.15, crowd:0.15, kid:0, elderly:0, couple:0, friends:0, business:0.35, diet:0.05 },
  'excited_solo':   { mood:0.20, budget:0.15, energy:0.10, crowd:0.05, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0 },
  'excited_couple': { mood:0.25, budget:0.10, energy:0.05, crowd:0.05, kid:0, elderly:0, couple:0.30, friends:0, business:0, diet:0.05 },
  'excited_friends':{ mood:0.20, budget:0.10, energy:0.05, crowd:0.05, kid:0, elderly:0, couple:0, friends:0.35, business:0, diet:0.10 },
  'excited_family': { mood:0.20, budget:0.15, energy:0.20, crowd:0.10, kid:0.15, elderly:0.10, couple:0, friends:0, business:0, diet:0.10 },
  'sad_solo':       { mood:0.35, budget:0.15, energy:0.20, crowd:0.20, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.10 },
  'sad_couple':     { mood:0.30, budget:0.10, energy:0.15, crowd:0.15, kid:0, elderly:0, couple:0.25, friends:0, business:0, diet:0.05 },
  'sad_friends':    { mood:0.25, budget:0.10, energy:0.15, crowd:0.15, kid:0, elderly:0, couple:0, friends:0.30, business:0, diet:0.05 },
  'sad_family':     { mood:0.30, budget:0.10, energy:0.15, crowd:0.20, kid:0.20, elderly:0.10, couple:0, friends:0, business:0, diet:0.05 },
  'anxious_solo':   { mood:0.30, budget:0.15, energy:0.20, crowd:0.25, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.10 },
  'anxious_couple': { mood:0.25, budget:0.10, energy:0.15, crowd:0.20, kid:0, elderly:0, couple:0.25, friends:0, business:0, diet:0.05 },
  'anxious_friends':{ mood:0.25, budget:0.10, energy:0.15, crowd:0.20, kid:0, elderly:0, couple:0, friends:0.25, business:0, diet:0.05 },
  'anxious_family': { mood:0.25, budget:0.15, energy:0.20, crowd:0.25, kid:0.10, elderly:0.10, couple:0, friends:0, business:0, diet:0.05 },
  'happy_couple':   { mood:0.15, budget:0.10, energy:0.10, crowd:0.05, kid:0, elderly:0, couple:0.35, friends:0, business:0, diet:0.05 },
  'happy_friends':  { mood:0.15, budget:0.15, energy:0.05, crowd:0.05, kid:0, elderly:0, couple:0, friends:0.35, business:0, diet:0.10 },
  'happy_budget':   { mood:0.15, budget:0.35, energy:0.10, crowd:0.05, kid:0, elderly:0, couple:0, friends:0, business:0, diet:0.05 },
  'calm_family':    { mood:0.20, budget:0.15, energy:0.15, crowd:0.15, kid:0.20, elderly:0, couple:0, friends:0, business:0, diet:0.15 },
  'calm_couple':    { mood:0.20, budget:0.10, energy:0.15, crowd:0.10, kid:0, elderly:0, couple:0.30, friends:0, business:0, diet:0.15 },
  'calm_friends':   { mood:0.20, budget:0.15, energy:0.10, crowd:0.10, kid:0, elderly:0, couple:0, friends:0.30, business:0, diet:0.15 },
  'default':        { mood:0.25, budget:0.20, energy:0.15, crowd:0.15, kid:0.10, elderly:0.05, couple:0, friends:0, business:0, diet:0.10 }
};

var MOOD_ENERGY_MAP = { tired:1, sad:1, anxious:2, calm:2, happy:3, excited:4, insomnia:1 };

var PLATFORM_LIST = [
  { name:'携程', icon:'🏨', baseMultiplier:1.0 },
  { name:'美团', icon:'🍜', baseMultiplier:0.95 },
  { name:'飞猪', icon:'🐷', baseMultiplier:0.92 },
  { name:'去哪儿', icon:'✈️', baseMultiplier:0.97 },
  { name:'同程', icon:'🎫', baseMultiplier:0.93 }
];

var BUDGET_PRESETS = [
  { label:'¥3,000', value:3000 },
  { label:'¥5,000', value:5000 },
  { label:'¥10,000', value:10000 },
  { label:'自定义', value:'custom' }
];

var HOT_ROUTES = [
  { id:1, title:'森林治愈之旅', emoji:'🌲', days:'2天1夜', budget:'¥800起', bg:'linear-gradient(135deg, #a8d8a8, #6b9b6b)' },
  { id:2, title:'海边发呆指南', emoji:'🌊', days:'3天2夜', budget:'¥1,500起', bg:'linear-gradient(135deg, #89CFF0, #4A90D9)' },
  { id:3, title:'城市漫步探店', emoji:'☕', days:'1天', budget:'¥300起', bg:'linear-gradient(135deg, #D4A574, #A67C52)' },
  { id:4, title:'山间露营观星', emoji:'🏕️', days:'2天1夜', budget:'¥600起', bg:'linear-gradient(135deg, #7B8FB2, #4A5F7A)' },
  { id:5, title:'古镇文艺之旅', emoji:'🏘️', days:'2天1夜', budget:'¥500起', bg:'linear-gradient(135deg, #C4A8A8, #8B7070)' },
  { id:6, title:'骑行追风计划', emoji:'🚴', days:'1天', budget:'¥200起', bg:'linear-gradient(135deg, #FFB347, #E8945A)' },
  { id:7, title:'温泉放松之旅', emoji:'♨️', days:'2天1夜', budget:'¥1,200起', bg:'linear-gradient(135deg, #B5A3C4, #7B6B8A)' }
];

var PLAN_CARDS = [
  { id:1, color:'#FF6B6B', moodLabel:'活力出行', showBack:false, planA:[{time:'09:00',name:'西湖苏堤漫步'},{time:'12:00',name:'知味观午餐'},{time:'14:00',name:'青藤茶馆品茗'},{time:'17:00',name:'雷峰塔日落'}], planAStats:{steps:'🚶 8k步',time:'⏱ 8h',budget:'💰 ¥1,200'}, planB:[{time:'08:00',name:'十里琅珰徒步'},{time:'11:30',name:'龙井村农家菜'},{time:'14:00',name:'环湖骑行30km'},{time:'18:00',name:'桂语山房晚餐'}], planBStats:{steps:'🚶 25k步',time:'⏱ 10h',budget:'💰 ¥2,800'} },
  { id:2, color:'#8BA88C', moodLabel:'治愈放松', showBack:false, planA:[{time:'10:00',name:'浙博之江馆'},{time:'13:00',name:'素食餐厅'},{time:'15:00',name:'梅家坞茶园'},{time:'18:00',name:'湖边散步'}], planAStats:{steps:'🚶 5k步',time:'⏱ 6h',budget:'💰 ¥800'}, planB:[{time:'09:00',name:'西溪湿地摇橹船'},{time:'12:30',name:'湿地农庄午餐'},{time:'15:00',name:'湿地博物馆'},{time:'18:00',name:'河坊街小吃'}], planBStats:{steps:'🚶 12k步',time:'⏱ 9h',budget:'💰 ¥1,500'} },
  { id:3, color:'#6B8FA3', moodLabel:'静谧时光', showBack:false, planA:[{time:'11:00',name:'猫空书店'},{time:'13:30',name:'转角咖啡馆'},{time:'16:00',name:'社区花园'},{time:'19:00',name:'日式居酒屋'}], planAStats:{steps:'🚶 3k步',time:'⏱ 5h',budget:'💰 ¥500'}, planB:[{time:'10:00',name:'避世书局'},{time:'13:00',name:'法喜寺素斋'},{time:'15:00',name:'云栖竹径'},{time:'18:00',name:'灵隐寺晚钟'}], planBStats:{steps:'🚶 8k步',time:'⏱ 8h',budget:'💰 ¥1,000'} },
  { id:4, color:'#E8A85A', moodLabel:'探索冒险', showBack:false, planA:[{time:'07:00',name:'宝石山日出'},{time:'10:00',name:'北山街骑行'},{time:'13:00',name:'青芝坞午餐'},{time:'16:00',name:'九溪烟树徒步'}], planAStats:{steps:'🚶 20k步',time:'⏱ 11h',budget:'💰 ¥1,800'}, planB:[{time:'06:30',name:'满觉陇登山'},{time:'11:00',name:'虎跑泉水泡茶'},{time:'14:00',name:'六和塔登高'},{time:'17:00',name:'钱塘江骑行'}], planBStats:{steps:'🚶 28k步',time:'⏱ 12h',budget:'💰 ¥2,000'} },
  { id:5, color:'#B5A3C4', moodLabel:'文艺漫步', showBack:false, planA:[{time:'10:00',name:'中国美院象山校区'},{time:'13:00',name:'转塘艺术街区'},{time:'15:00',name:'单向空间书店'},{time:'18:00',name:'爵士酒吧'}], planAStats:{steps:'🚶 10k步',time:'⏱ 8h',budget:'💰 ¥1,200'}, planB:[{time:'09:00',name:'南宋御街漫步'},{time:'12:00',name:'杭帮菜博物馆'},{time:'14:30',name:'晓风书屋'},{time:'17:00',name:'西湖音乐喷泉'}], planBStats:{steps:'🚶 15k步',time:'⏱ 9h',budget:'💰 ¥1,600'} },
  { id:6, color:'#C4A8A8', moodLabel:'温暖陪伴', showBack:false, planA:[{time:'09:30',name:'花港观鱼'},{time:'12:00',name:'楼外楼午餐'},{time:'14:00',name:'三潭印月游船'},{time:'17:00',name:'湖滨银泰晚餐'}], planAStats:{steps:'🚶 6k步',time:'⏱ 7h',budget:'💰 ¥1,500'}, planB:[{time:'10:00',name:'杭州动物园'},{time:'13:00',name:'外婆家午餐'},{time:'15:00',name:'少年宫游乐'},{time:'18:00',name:'武林夜市'}], planBStats:{steps:'🚶 10k步',time:'⏱ 8h',budget:'💰 ¥1,800'} }
];

var EXTRA_CARDS = [
  { id:7, color:'#A3B5A6', moodLabel:'自然呼吸', showBack:false, planA:[{time:'08:00',name:'植物园晨练'},{time:'11:00',name:'农家乐午餐'},{time:'14:00',name:'龙井问茶'},{time:'17:00',name:'茅家埠日落'}], planAStats:{steps:'🚶 12k步',time:'⏱ 8h',budget:'💰 ¥1,000'}, planB:[{time:'07:00',name:'玉皇山登顶'},{time:'11:00',name:'八卦田采摘'},{time:'14:00',name:'江洋畈生态公园'},{time:'17:00',name:'白塔公园'}], planBStats:{steps:'🚶 18k步',time:'⏱ 10h',budget:'💰 ¥1,400'} },
  { id:8, color:'#FFB347', moodLabel:'美食之旅', showBack:false, planA:[{time:'09:00',name:'新丰小吃早餐'},{time:'12:00',name:'奎元馆虾爆鳝面'},{time:'15:00',name:'定胜糕体验'},{time:'18:00',name:'湖滨28餐厅'}], planAStats:{steps:'🚶 4k步',time:'⏱ 6h',budget:'💰 ¥2,000'}, planB:[{time:'08:30',name:'游埠豆浆'},{time:'12:00',name:'德明饭店'},{time:'15:00',name:'Cycle&Cycle'},{time:'18:00',name:'金沙厅'}], planBStats:{steps:'🚶 6k步',time:'⏱ 7h',budget:'💰 ¥3,500'} }
];

// ================================================================
//  浙江全域测试数据字典（11 地级市）
// ================================================================
var ZHEJIANG_CITIES = [
  { name:'杭州', tags:['西湖','人文','茶文化','互联网','慢生活'], vibe:'温婉江南，人间天堂', poiKeywords:['西湖','灵隐寺','龙井','西溪湿地','宋城','河坊街'] },
  { name:'宁波', tags:['港口','海鲜','历史','经济','书香'], vibe:'书藏古今，港通天下', poiKeywords:['天一阁','老外滩','东钱湖','象山海鲜','奉化溪口'] },
  { name:'温州', tags:['山水','商业','美食','活力','民营'], vibe:'敢为人先的山水之城', poiKeywords:['雁荡山','楠溪江','江心屿','五马街','南麂岛'] },
  { name:'嘉兴', tags:['水乡','古镇','红色','粽子','恬静'], vibe:'梦里水乡，红色起航', poiKeywords:['乌镇','西塘','南湖','月河老街','盐官观潮'] },
  { name:'湖州', tags:['竹海','太湖','民宿','安吉','清幽'], vibe:'行遍江南清丽地，人生只合住湖州', poiKeywords:['莫干山','南浔古镇','安吉竹海','太湖旅游度假区','长兴银杏'] },
  { name:'绍兴', tags:['黄酒','鲁迅','水乡','书法','古韵'], vibe:'没有围墙的博物馆', poiKeywords:['鲁迅故里','沈园','东湖','安昌古镇','兰亭'] },
  { name:'金华', tags:['火腿','溶洞','影视','温泉','古村'], vibe:'水墨金华，东方好莱坞', poiKeywords:['双龙洞','横店影视城','诸葛八卦村','武义温泉','义乌小商品城'] },
  { name:'衢州', tags:['美食','辣味','古城','山水','围棋'], vibe:'南孔圣地，衢州有礼', poiKeywords:['江郎山','廿八都古镇','龙游石窟','烂柯山','水亭门'] },
  { name:'舟山', tags:['海岛','海鲜','普陀','沙滩','渔港'], vibe:'海天佛国，渔都港城', poiKeywords:['普陀山','朱家尖','嵊泗列岛','东极岛','沈家门渔港'] },
  { name:'台州', tags:['山海','佛道','蜜橘','古城','海鲜'], vibe:'山海水城，和合圣地', poiKeywords:['天台山','神仙居','临海古城','大陈岛','长屿硐天'] },
  { name:'丽水', tags:['吸氧','梯田','畲族','古堰','画乡'], vibe:'浙江绿谷，天然氧吧', poiKeywords:['云和梯田','古堰画乡','缙云仙都','南尖岩','龙泉青瓷'] }
];

function getSanxinCity() {
  var escapeCities = ZHEJIANG_CITIES.filter(function(c) { return c.name !== '杭州'; });
  return escapeCities[Math.floor(Math.random() * escapeCities.length)];
}

var ANXIOUS_KEYWORDS = ['好累','不想上班','心烦','压力大','焦虑','想逃','散心','心累','崩溃','受不了','想哭','难过','不想动','没力气','emo','抑郁','烦躁','憋屈','想静静','想一个人','想离开','太累了','撑不住'];

