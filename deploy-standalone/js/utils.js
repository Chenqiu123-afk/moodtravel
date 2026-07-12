function showToast(msg, duration) {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, duration || 2500);
}

// XSS-safe HTML escaping
function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Safe innerHTML setter with optional sanitization
function safeSetHTML(el, html) {
  if (!el) return;
  if (typeof html === 'string') {
    el.innerHTML = html;
  }
}

// ================================================================
//  辅助
// ================================================================
function scrollToContent() { var el = document.querySelector('.budget-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

function updateGenerateBtn() {
  var btn = document.getElementById('generatePlanBtn');
  var theme = MOOD_THEME_MAP[activeMood] || MOOD_THEME_MAP.calm;
  btn.style.background = 'linear-gradient(135deg, ' + theme.secondary + ', ' + theme.primary + ')';
  btn.style.boxShadow = '0 6px 20px ' + theme.primary + '40';
}

function getWeightKey() {
  var k = companionType; // solo, couple, friends, family, business
  var key = activeMood + '_' + k;
  return WEIGHT_MATRIX[key] || WEIGHT_MATRIX['default'];
}

function fmtTime(h) {
  var hh = Math.floor(h); var mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function genReason(poi) {
  var s = poi._scores; var reasons = [];
  var moodLabel = (MOODS.find(function(m){return m.key===activeMood;})||{}).label;
  
  // 心情匹配度
  if (s.moodScore > 25) reasons.push('🎯 ' + moodLabel + '心情高度匹配，专属推荐');
  else if (s.moodScore > 15) reasons.push('✨ 适合当前' + moodLabel + '心情状态');
  
  // 预算匹配
  if (s.budgetScore > 20) reasons.push(poi.ticketPrice === 0 ? '💰 免费景点，零预算压力' : '💰 超高性价比之选');
  else if (s.budgetScore > 15) reasons.push('💵 价格合理，预算友好');
  
  // 体力匹配
  if (s.energyScore > 20) {
    if (activeMood === 'tired' || activeMood === 'sad') reasons.push('🛋️ 低体力消耗，适合放松');
    else reasons.push('⚡ 体力消耗适中，刚刚好');
  }
  
  // 旅伴感知
  if (isCouple && s.coupleScore > 20) reasons.push('💕 情侣浪漫之选，私密氛围满分');
  if (isCouple && poi.romanticLevel >= 4) reasons.push('🌹 已为您避开拥挤，预留充足二人时光');
  if (isFriends && poi.hasPhotoSpot) reasons.push('📸 闺蜜出片圣地，随手一拍都是大片');
  if (isFriends && poi.category === 'shopping') reasons.push('🛍️ 逛吃逛吃，闺蜜快乐源泉');
  if (hasKids && s.kidScore > 15) reasons.push('👶 亲子友好，带娃无忧');
  if (hasKids && poi.hasNursingRoom) reasons.push('🍼 配备母婴室，宝妈安心');
  if (hasElderly && s.elderlyScore > 15) reasons.push('👴 长辈友好，舒适安全');
  if (hasElderly && poi.wheelchairAccessible) reasons.push('♿ 无障碍通道，老人出行无忧');
  if (isBusiness && poi.energyLevel <= 1) reasons.push('💼 高效商务之选，省时省心');
  if (isBusiness && poi.noiseLevel <= 2) reasons.push('🤫 安静得体，适合商务用餐');
  
  // 场景感知
  if (poi.weatherSensitivity === 'indoor' && window._weatherData && window._weatherData.isRain) {
    reasons.push('🏠 室内景点，雨天无忧');
  }
  
  return reasons.join('；') || '✨ 综合匹配推荐，值得体验';
}

function genTags(poi) {
  var s = poi._scores; var tags = [];
  if (s.moodScore > 20) tags.push('心情匹配');
  if (s.budgetScore > 15) tags.push(poi.ticketPrice === 0 ? '免费景点' : '高性价比');
  if (isCouple && poi.romanticLevel >= 4) tags.push('浪漫约会');
  if (isCouple && poi.hasPhotoSpot) tags.push('拍照打卡');
  if (hasKids && poi.hasNursingRoom) tags.push('母婴室');
  if (hasKids && poi.strollerFriendly) tags.push('推车友好');
  if (hasElderly && poi.wheelchairAccessible) tags.push('无障碍');
  if (hasElderly && poi.restSeats >= 4) tags.push('休息充足');
  if (hasElderly && poi.nearMedical) tags.push('近医疗点');
  if (hasElderly && poi.hasPrivateRoom) tags.push('有包间');
  if (isFriends && poi.hasPhotoSpot) tags.push('出片圣地');
  if (isFriends && poi.category === 'shopping') tags.push('逛吃逛吃');
  if (isBusiness && poi.energyLevel <= 1) tags.push('高效出行');
  if (isBusiness && poi.noiseLevel <= 2) tags.push('安静得体');
  return tags;
}

function genHotelReason(h) {
  var reasons = [];
  if (h.moodScores[activeMood] >= 8) reasons.push('当前心情高度匹配');
  if (h.priceRangeLow <= budget * 0.3) reasons.push('预算友好');
  if (h.rating >= 4.5) reasons.push('高评分推荐');
  if (isCouple) reasons.push('私密性好，适合情侣入住');
  if (hasKids && h.kidsFriendly) reasons.push('亲子友好，儿童设施齐全');
  if (hasElderly && h.elderlyFriendly) reasons.push('老人友好，无障碍设施完善');
  if (isFriends && h.has_pool) reasons.push('闺蜜泳池派对首选');
  if (isBusiness && h.businessFriendly) reasons.push('商务出行首选，交通便利');
  if (isBusiness && h.nearTransport) reasons.push('靠近交通枢纽，出行高效');
  // 新增：酒店特色标签匹配
  if (h.featureTags) {
    if (h.featureTags.indexOf('温泉') !== -1 && (activeMood === 'tired' || activeMood === 'sad')) reasons.push('温泉疗愈，放松身心');
    if (h.featureTags.indexOf('山景房') !== -1 || h.featureTags.indexOf('湖景房') !== -1) reasons.push('景观房型，视野极佳');
    if (h.featureTags.indexOf('设计感') !== -1) reasons.push('设计独特，颜值在线');
    if (h.featureTags.indexOf('SPA') !== -1 || h.featureTags.indexOf('水疗') !== -1) reasons.push('SPA水疗，奢华享受');
  }
  return reasons.join('；') || '综合推荐';
}

// ================================================================
//  场景切换
// ================================================================
function switchScene(mode) {
  travelMode = mode;
  updateSceneToggle();
  var t = (window.i18n && window.i18n[currentLang]) || (window.i18n && window.i18n.zh) || {};
  if (mode === 'tourism') {
    showToast(t.sceneTourismToast);
  } else {
    showToast(t.sceneBusinessToast);
  }
}

function updateSceneToggle() {
  var toggle = document.getElementById('sceneToggle');
  var btns = document.querySelectorAll('.scene-btn');
  btns.forEach(function(btn) {
    if (btn.dataset.scene === travelMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  // 暖色系 #FFA500（旅游） vs 冷色系 #4682B4（出行）
  if (travelMode === 'tourism') {
    toggle.classList.add('warm');
    toggle.classList.remove('cool');
    document.querySelector('.scene-btn[data-scene="tourism"] .scene-desc').textContent = '放松身心 · 探索美好 · 自在漫游';
    document.querySelector('.scene-btn[data-scene="business"] .scene-desc').textContent = '效率优先 · 交通便利 · 省时';
  } else {
    toggle.classList.add('cool');
    toggle.classList.remove('warm');
    document.querySelector('.scene-btn[data-scene="tourism"] .scene-desc').textContent = '松弛感 · 打卡地 · 休息时间';
    document.querySelector('.scene-btn[data-scene="business"] .scene-desc').textContent = '高效出行 · 交通枢纽 · 快捷餐饮';
  }
}

