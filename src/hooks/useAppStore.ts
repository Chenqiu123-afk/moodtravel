// 全局状态管理
import { create } from 'zustand';
import { Emotion, emotions, defaultEmotion } from '@/data/emotions';
import { Weather, weatherData, defaultCity } from '@/data/weather';
import { Activity, activities } from '@/data/activities';
import { ItineraryItem, generateItinerary } from '@/utils/itineraryGenerator';

interface AppState {
  // 情绪状态
  selectedEmotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  
  // 天气状态
  selectedWeather: Weather;
  setWeather: (weather: Weather) => void;
  
  // 预算状态
  budget: number;
  setBudget: (budget: number) => void;
  
  // 行程状态
  itinerary: ItineraryItem[];
  isGenerating: boolean;
  generateItineraryAction: () => void;
  updateItinerary: () => void;
  
  // 活动库
  availableActivities: Activity[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // 情绪
  selectedEmotion: defaultEmotion,
  setEmotion: (emotion: Emotion) => {
    set({ selectedEmotion: emotion });
    // 如果行程已生成，自动更新
    if (get().itinerary.length > 0) {
      get().updateItinerary();
    }
  },
  
  // 天气
  selectedWeather: defaultCity,
  setWeather: (weather: Weather) => {
    set({ selectedWeather: weather });
    // 如果行程已生成，自动更新
    if (get().itinerary.length > 0) {
      get().updateItinerary();
    }
  },
  
  // 预算
  budget: 300, // 默认预算300元
  setBudget: (budget: number) => {
    set({ budget });
    // 如果行程已生成，自动更新
    if (get().itinerary.length > 0) {
      get().updateItinerary();
    }
  },
  
  // 行程
  itinerary: [],
  isGenerating: false,
  
  generateItineraryAction: () => {
    set({ isGenerating: true });
    
    // 模拟生成延迟
    setTimeout(() => {
      const { selectedEmotion, selectedWeather, budget, availableActivities } = get();
      const newItinerary = generateItinerary(
        selectedEmotion,
        selectedWeather,
        budget,
        availableActivities
      );
      
      set({
        itinerary: newItinerary,
        isGenerating: false
      });
    }, 2000); // 2秒生成延迟
  },
  
  updateItinerary: () => {
    const { selectedEmotion, selectedWeather, budget, availableActivities } = get();
    const newItinerary = generateItinerary(
      selectedEmotion,
      selectedWeather,
      budget,
      availableActivities
    );
    
    set({ itinerary: newItinerary });
  },
  
  // 活动库
  availableActivities: activities
}));