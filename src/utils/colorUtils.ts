// 颜色计算工具函数
import { Emotion } from '@/data/emotions';

// 根据情绪生成背景渐变色
export function generateEmotionGradient(emotion: Emotion): string {
  return emotion.colors.gradient;
}

// 根据情绪生成柔和的背景色
export function generateSoftBackground(emotion: Emotion): string {
  const { primary, secondary } = emotion.colors;
  return `linear-gradient(135deg, ${primary}40 0%, ${secondary}40 100%)`;
}

// 计算颜色的亮度（用于判断是否需要调整文字颜色）
export function getBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// 判断是否需要使用深色文字
export function shouldUseDarkText(hexColor: string): boolean {
  return getBrightness(hexColor) > 128;
}

// 生成半透明的情绪色用于卡片背景
export function generateCardBackground(emotion: Emotion, opacity: number = 0.15): string {
  const { primary } = emotion.colors;
  return `${primary}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
}

// 根据匹配度生成颜色（匹配度越高，颜色越鲜艳）
export function generateMatchColor(matchScore: number, emotion: Emotion): string {
  const { primary } = emotion.colors;
  
  if (matchScore >= 80) {
    return primary; // 高匹配度，使用原色
  } else if (matchScore >= 50) {
    return `${primary}99`; // 中等匹配度，使用半透明
  } else {
    return `${primary}66`; // 低匹配度，使用更淡的颜色
  }
}