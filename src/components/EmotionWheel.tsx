import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, Mountain, Heart, Moon, Zap } from 'lucide-react';
import { Emotion, emotions } from '@/data/emotions';
import { useAppStore } from '@/hooks/useAppStore';

// 图标映射
const iconMap: { [key: string]: React.ReactNode } = {
  'Sun': <Sun className="w-8 h-8" />,
  'Cloud': <Cloud className="w-8 h-8" />,
  'Mountain': <Mountain className="w-8 h-8" />,
  'Heart': <Heart className="w-8 h-8" />,
  'Moon': <Moon className="w-8 h-8" />,
  'Zap': <Zap className="w-8 h-8" />
};

export default function EmotionWheel() {
  const { selectedEmotion, setEmotion } = useAppStore();
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);

  const handleEmotionClick = (emotion: Emotion) => {
    setEmotion(emotion);
  };

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* 中心显示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center"
          style={{ background: selectedEmotion.colors.gradient }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-white text-center">
            {iconMap[selectedEmotion.icon]}
            <p className="mt-2 text-sm font-semibold">{selectedEmotion.name}</p>
          </div>
        </motion.div>
      </div>

      {/* 情绪轮盘 */}
      <div className="absolute inset-0">
        {emotions.map((emotion, index) => {
          const angle = (index * 60) - 90; // 6个情绪，每个60度
          const radius = 120;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <motion.button
              key={emotion.id}
              className="absolute w-20 h-20 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                left: `calc(50% + ${x}px - 40px)`,
                top: `calc(50% + ${y}px - 40px)`,
                background: emotion.colors.gradient,
                boxShadow: hoveredEmotion === emotion.id ? '0 0 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmotionClick(emotion)}
              onMouseEnter={() => setHoveredEmotion(emotion.id)}
              onMouseLeave={() => setHoveredEmotion(null)}
              aria-label={`选择${emotion.name}情绪`}
            >
              <div className="text-white">
                {iconMap[emotion.icon]}
              </div>
              
              {/* 悬停时显示标签 */}
              {hoveredEmotion === emotion.id && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 text-xs text-white font-medium bg-black/60 px-2 py-1 rounded whitespace-nowrap"
                >
                  {emotion.name}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 选中状态的光晕 */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div 
          className="w-40 h-40 rounded-full"
          style={{ 
            background: selectedEmotion.colors.primary,
            filter: 'blur(20px)',
            opacity: 0.3
          }}
        />
      </motion.div>
    </div>
  );
}