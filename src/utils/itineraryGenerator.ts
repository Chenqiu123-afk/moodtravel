// 行程生成算法
import { Emotion } from '@/data/emotions';
import { Weather } from '@/data/weather';
import { Activity } from '@/data/activities';

export interface ItineraryItem {
  id: string;
  activity: Activity;
  startTime: string;
  endTime: string;
  estimatedCost: number;
  emotionMatch: number;
  weatherMatch: number;
}

// 计算活动与情绪和天气的匹配度
function calculateMatchScore(activity: Activity, emotion: Emotion, weather: Weather): number {
  let emotionScore = 0;
  let weatherScore = 0;

  // 情绪匹配度（满分60）
  if (activity.tags.emotions.includes(emotion.id)) {
    emotionScore = 60;
  } else if (activity.tags.emotions.some(e => emotion.tags.some(t => e === t))) {
    emotionScore = 30; // 间接匹配
  }

  // 天气匹配度（满分40）
  if (activity.tags.weather.includes(weather.weather)) {
    weatherScore = 40;
  } else if (activity.tags.weather.length > 2) {
    weatherScore = 20; // 天气适应性强
  }

  return emotionScore + weatherScore;
}

// 根据时长分配时间
function assignTime(index: number, duration: number): { start: string; end: string } {
  // 基础时间：早上9点开始
  const baseHour = 9;
  const currentStartHour = baseHour + (index * 2); // 每个活动间隔2小时估算
  
  const startHour = currentStartHour;
  const endHour = currentStartHour + Math.ceil(duration);
  
  const startTime = `${String(startHour).padStart(2, '0')}:00`;
  const endTime = `${String(endHour).padStart(2, '0')}:00`;
  
  return { start: startTime, end: endTime };
}

// 生成行程时间轴
function buildTimeline(
  candidates: Activity[],
  budget: number,
  emotion: Emotion,
  weather: Weather
): ItineraryItem[] {
  const timeline: ItineraryItem[] = [];
  let totalCost = 0;
  
  for (let i = 0; i < candidates.length && i < 6; i++) { // 最多6个活动
    const activity = candidates[i];
    const avgCost = (activity.cost.min + activity.cost.max) / 2;
    
    // 预算检查
    if (totalCost + avgCost > budget * 0.9) { // 保留10%缓冲
      continue;
    }
    
    const time = assignTime(i, activity.duration);
    const matchScore = calculateMatchScore(activity, emotion, weather);
    
    timeline.push({
      id: `${activity.id}-${i}`,
      activity,
      startTime: time.start,
      endTime: time.end,
      estimatedCost: avgCost,
      emotionMatch: Math.floor(matchScore * 0.6), // 情绪匹配度占60%
      weatherMatch: Math.floor(matchScore * 0.4) // 天气匹配度占40%
    });
    
    totalCost += avgCost;
  }
  
  return timeline;
}

// 主生成函数
export function generateItinerary(
  emotion: Emotion,
  weather: Weather,
  budget: number,
  activities: Activity[]
): ItineraryItem[] {
  // 1. 筛选符合情绪和天气的活动
  let candidates = activities.filter(activity => {
    return activity.tags.emotions.includes(emotion.id) ||
           activity.tags.weather.includes(weather.weather);
  });
  
  // 如果筛选结果太少，放宽条件
  if (candidates.length < 3) {
    candidates = activities.filter(activity => {
      return activity.tags.emotions.some(e => emotion.tags.includes(e)) ||
             activity.tags.weather.includes(weather.weather);
    });
  }
  
  // 2. 根据预算过滤
  candidates = candidates.filter(activity => {
    return activity.cost.max <= budget * 0.5; // 单个活动不超过总预算的一半
  });
  
  // 3. 计算匹配度得分并排序
  const scoredCandidates = candidates.map(activity => ({
    ...activity,
    score: calculateMatchScore(activity, emotion, weather)
  }));
  
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  // 4. 生成时间轴行程
  return buildTimeline(scoredCandidates, budget, emotion, weather);
}

// 重新生成行程（当调整情绪或预算时）
export function regenerateItinerary(
  currentItinerary: ItineraryItem[],
  emotion: Emotion,
  weather: Weather,
  budget: number,
  activities: Activity[]
): ItineraryItem[] {
  return generateItinerary(emotion, weather, budget, activities);
}