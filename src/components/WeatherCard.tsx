import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Wind, Droplets, MapPin } from 'lucide-react';
import { Weather, weatherData } from '@/data/weather';
import { useAppStore } from '@/hooks/useAppStore';

// 图标映射
const weatherIconMap: { [key: string]: React.ReactNode } = {
  'Sun': <Sun className="w-12 h-12" />,
  'Cloud': <Cloud className="w-12 h-12" />,
  'CloudRain': <CloudRain className="w-12 h-12" />
};

export default function WeatherCard() {
  const { selectedWeather, setWeather, selectedEmotion } = useAppStore();
  const [showCitySelector, setShowCitySelector] = useState(false);

  const handleCityChange = (weather: Weather) => {
    setWeather(weather);
    setShowCitySelector(false);
  };

  return (
    <motion.div
      className="glass rounded-2xl p-6 w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        borderColor: selectedEmotion.colors.primary + '40'
      }}
    >
      {/* 城市选择 */}
      <div className="flex items-center justify-between mb-4">
        <button
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => setShowCitySelector(!showCitySelector)}
          aria-label="切换城市"
        >
          <MapPin className="w-5 h-5" style={{ color: selectedEmotion.colors.primary }} />
          <span className="text-lg font-semibold text-white">{selectedWeather.city}</span>
        </button>
      </div>

      {/* 城市选择器 */}
      {showCitySelector && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 flex flex-wrap gap-2"
        >
          {weatherData.map(weather => (
            <button
              key={weather.cityId}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                weather.cityId === selectedWeather.cityId
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
              onClick={() => handleCityChange(weather)}
            >
              {weather.city}
            </button>
          ))}
        </motion.div>
      )}

      {/* 天气信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              rotate: selectedWeather.icon === 'Sun' ? [0, 10, -10, 0] : 0
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ color: selectedEmotion.colors.primary }}
          >
            {weatherIconMap[selectedWeather.icon]}
          </motion.div>
          
          <div>
            <p className="text-4xl font-bold text-white">{selectedWeather.temperature}°C</p>
            <p className="text-sm text-white/80">{selectedWeather.weather}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            <span>{selectedWeather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4" />
            <span>{selectedWeather.wind}</span>
          </div>
        </div>
      </div>

      {/* 天气建议 */}
      <motion.div
        className="mt-4 pt-4 border-t border-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-white/90 italic">{selectedWeather.suggestion}</p>
      </motion.div>
    </motion.div>
  );
}