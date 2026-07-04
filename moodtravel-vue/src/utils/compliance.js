/**
 * ================================================================
 *  MoodTravel 合规模块 — 第三方资源授权管理
 *  图片、字体、音乐、WCAG 对比度检查
 * ================================================================
 */

// ================================================================
// 图片资源清单 — Unsplash / Pixabay 授权
// ================================================================
export const IMAGE_ASSETS = {
  /** 背景图：山脉风景 */
  bg_mountain: {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&fm=webp',
    source: 'Unsplash',
    author: 'Unsplash Community',
    license: 'Unsplash License (Free for commercial use, no attribution required)',
    id: 'unsplash-photo-1506905925346'
  },
  /** 杭州西湖 */
  bg_westlake: {
    url: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?w=1200&q=80&fm=webp',
    source: 'Unsplash',
    author: 'Unsplash',
    license: 'Unsplash License',
    id: 'unsplash-photo-1599571234909'
  },
  /** 茶园 */
  bg_tea: {
    url: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=1200&q=80&fm=webp',
    source: 'Unsplash',
    author: 'Unsplash',
    license: 'Unsplash License',
    id: 'unsplash-photo-1558160074'
  },
  /** 咖啡馆 */
  bg_cafe: {
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80&fm=webp',
    source: 'Unsplash',
    author: 'Unsplash',
    license: 'Unsplash License',
    id: 'unsplash-photo-1501339847302'
  },
  /** 森林/自然 */
  bg_nature: {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&fm=webp',
    source: 'Unsplash',
    author: 'Unsplash',
    license: 'Unsplash License',
    id: 'unsplash-photo-1441974231531'
  }
}

// ================================================================
// 字体资源 — Google Fonts (OFL License)
// ================================================================
export const FONT_ASSETS = {
  montserrat: {
    family: 'Montserrat',
    url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap',
    license: 'SIL Open Font License 1.1 (OFL)',
    licenseUrl: 'https://scripts.sil.org/OFL'
  },
  inter: {
    family: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    license: 'SIL Open Font License 1.1 (OFL)',
    licenseUrl: 'https://scripts.sil.org/OFL'
  },
  playfair: {
    family: 'Playfair Display',
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap',
    license: 'SIL Open Font License 1.1 (OFL)',
    licenseUrl: 'https://scripts.sil.org/OFL'
  }
}

// ================================================================
// 音乐资源 — 商用授权曲库 (Pixabay Music / YouTube Audio Library)
// ================================================================
export const MUSIC_ASSETS = {
  ambient_calm: {
    name: 'Ambient Calm',
    source: 'Pixabay Music',
    license: 'Pixabay Content License (Free for commercial use)',
    licenseUrl: 'https://pixabay.com/service/license/',
    mood: 'calm'
  },
  nature_sounds: {
    name: 'Nature Sounds',
    source: 'YouTube Audio Library',
    license: 'YouTube Audio Library License (Free for commercial use)',
    licenseUrl: 'https://www.youtube.com/audiolibrary',
    mood: 'tired'
  },
  upbeat_travel: {
    name: 'Upbeat Travel',
    source: 'Pixabay Music',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license/',
    mood: 'excited'
  }
}

// ================================================================
// 加载 Google Fonts
// ================================================================
export function loadGoogleFonts() {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = FONT_ASSETS.inter.url
  document.head.appendChild(link)

  const link2 = document.createElement('link')
  link2.rel = 'stylesheet'
  link2.href = FONT_ASSETS.playfair.url
  document.head.appendChild(link2)
}

// ================================================================
// WCAG 对比度检查工具
// 基于 WCAG 2.1 AA 标准：
//   普通文本：对比度 >= 4.5:1
//   大文本 (>= 18px 或 >= 14px bold)：对比度 >= 3:1
// ================================================================

/** 计算相对亮度 (sRGB) */
function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

/** 计算对比度 */
function contrastRatio(fg, bg) {
  const l1 = luminance(fg[0], fg[1], fg[2])
  const l2 = luminance(bg[0], bg[1], bg[2])
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** 解析 hex 颜色 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
}

/**
 * 检查 WCAG 对比度
 * @param {string} fgHex - 前景色 hex
 * @param {string} bgHex - 背景色 hex
 * @param {boolean} isLargeText - 是否为大文本
 * @returns {{ pass: boolean, ratio: number, level: string, fg: string, bg: string }}
 */
export function checkContrast(fgHex, bgHex, isLargeText = false) {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  const ratio = contrastRatio(fg, bg)
  const threshold = isLargeText ? 3 : 4.5
  const aaaThreshold = isLargeText ? 4.5 : 7

  return {
    pass: ratio >= threshold,
    ratio: Math.round(ratio * 100) / 100,
    level: ratio >= aaaThreshold ? 'AAA' : ratio >= threshold ? 'AA' : 'FAIL',
    aa: ratio >= threshold,
    aaa: ratio >= aaaThreshold,
    fg: fgHex,
    bg: bgHex
  }
}

/**
 * 主题对比度全面检查
 */
export function checkThemeContrast(theme) {
  const results = {}

  // 主题色对白色文字
  results.primary_on_white = checkContrast(theme.primary, '#FFFFFF')
  results.primary_on_bg = checkContrast(theme.primary, theme.bg)

  // 文本色
  results.text_on_bg = checkContrast('#3A3A3A', theme.bg)
  results.text_on_white = checkContrast('#3A3A3A', '#FFFFFF')

  return results
}

// ================================================================
// 生成版权合规报告
// ================================================================
export function generateComplianceReport() {
  const images = Object.entries(IMAGE_ASSETS).map(([key, asset]) => ({
    key,
    source: asset.source,
    author: asset.author,
    license: asset.license,
    url: asset.url
  }))

  const fonts = Object.entries(FONT_ASSETS).map(([key, font]) => ({
    key,
    family: font.family,
    license: font.license,
    licenseUrl: font.licenseUrl
  }))

  return {
    generatedAt: new Date().toISOString(),
    project: 'MoodTravel',
    version: '1.0.0',
    assets: {
      images,
      fonts
    },
    wcagStatus: 'WCAG 2.1 AA 目标',
    notes: [
      '所有图片来自 Unsplash，使用 Unsplash License（免费商用，无需署名）',
      '所有字体来自 Google Fonts，使用 SIL OFL 1.1 开源许可证',
      '音乐资源预留接口，实际播放前需检查用户授权'
    ]
  }
}

// ================================================================
// 请求用户音乐播放授权
// ================================================================
export function requestMusicPermission() {
  return new Promise((resolve) => {
    // 检查浏览器是否支持 AudioContext
    if (!window.AudioContext && !window.webkitAudioContext) {
      resolve({ granted: false, reason: 'browser_not_supported' })
      return
    }

    // 实际播放前创建 AudioContext 需要用户手势
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        resolve({ granted: true, context: ctx })
      }).catch(() => {
        resolve({ granted: false, reason: 'user_required' })
      })
    } else {
      resolve({ granted: true, context: ctx })
    }
  })
}

export default {
  IMAGE_ASSETS,
  FONT_ASSETS,
  MUSIC_ASSETS,
  loadGoogleFonts,
  checkContrast,
  checkThemeContrast,
  generateComplianceReport,
  requestMusicPermission
}