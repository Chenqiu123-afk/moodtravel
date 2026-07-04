import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import EmotionWheel from '@/components/EmotionWheel';
import WeatherCard from '@/components/WeatherCard';

export default function EmotionSelect() {
  const { selectedEmotion } = useAppStore();
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/plan');
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col relative overflow-hidden gradient-transition"
      style={{ background: selectedEmotion.colors.gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* 流动粒子背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-white/20 particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* 标题 */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            <Sparkles className="inline w-10 h-10 mr-2" />
            旅心流
          </h1>
          <p className="text-white/80 text-lg">选择你的心情，开启专属旅程</p>
        </motion.div>

        {/* 情绪轮盘 */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <EmotionWheel />
        </motion.div>

        {/* 情绪描述 */}
        <motion.div
          className="text-center mb-8 max-w-md"
          key={selectedEmotion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-white/90 text-lg font-medium mb-2">
            {selectedEmotion.description}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {selectedEmotion.tags.map((tag, i) => (
              <span 
                key={i}
                className="px-3 py-1 rounded-full text-sm bg-white/20 text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 天气卡片 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <WeatherCard />
        </motion.div>

        {/* 下一步按钮 */}
        <motion.button
          className="glass px-8 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform"
          style={{
            background: selectedEmotion.colors.primary + '30',
            borderColor: selectedEmotion.colors.primary + '40'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="text-white text-lg font-semibold">开始规划行程</span>
          <ArrowRight className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
}