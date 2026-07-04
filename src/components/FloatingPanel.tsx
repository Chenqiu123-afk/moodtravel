import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { Sun, Cloud, Mountain, Heart, Moon, Zap, RefreshCw } from 'lucide-react';
import { emotions } from '@/data/emotions';

// 图标映射
const iconMap: { [key: string]: React.ReactNode } = {
  'Sun': <Sun className="w-4 h-4" />,
  'Cloud': <Cloud className="w-4 h-4" />,
  'Mountain': <Mountain className="w-4 h-4" />,
  'Heart': <Heart className="w-4 h-4" />,
  'Moon': <Moon className="w-4 h-4" />,
  'Zap': <Zap className="w-4 h-4" />
};

export default function FloatingPanel() {
  const { 
    selectedEmotion, 
    setEmotion, 
    budget, 
    setBudget,
    itinerary,
    updateItinerary,
    isGenerating 
  } = useAppStore();

  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleQuickBudgetChange = (delta: number) => {
    const newBudget = Math.max(100, Math.min(1000, budget + delta));
    setBudget(newBudget);
  };

  React.useEffect(() => {
    if (itinerary.length > 0 && !isGenerating) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedEmotion, budget, itinerary.length, isGenerating]);

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 glass rounded-2xl p-4 max-w-lg w-full z-20"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      style={{
        borderColor: selectedEmotion.colors.primary + '40'
      }}
    >
      {/* 状态提示 */}
      {(isGenerating || isUpdating) && (
        <motion.div
          className="mb-3 flex items-center justify-center gap-2 text-sm text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>正在更新行程...</span>
        </motion.div>
      )}

      {/* 情绪快捷切换 */}
      <div className="mb-4">
        <p className="text-xs text-white/70 mb-2">切换情绪</p>
        <div className="flex gap-2 justify-center">
          {emotions.map(emotion => (
            <motion.button
              key={emotion.id}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                emotion.id === selectedEmotion.id
                  ? 'ring-2 ring-white'
                  : ''
              }`}
              style={{
                background: emotion.colors.gradient
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEmotion(emotion)}
              aria-label={`切换到${emotion.name}情绪`}
            >
              <div className="text-white">
                {iconMap[emotion.icon]}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 预算快捷调整 */}
      <div>
        <p className="text-xs text-white/70 mb-2">调整预算</p>
        <div className="flex items-center justify-between gap-4">
          <motion.button
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickBudgetChange(-50)}
            aria-label="减少预算50元"
          >
            -50
          </motion.button>
          
          <div className="flex-1 text-center">
            <span 
              className="text-xl font-bold text-white"
              style={{ color: selectedEmotion.colors.primary }}
            >
              ¥{budget}
            </span>
          </div>
          
          <motion.button
            className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickBudgetChange(50)}
            aria-label="增加预算50元"
          >
            +50
          </motion.button>
        </div>
      </div>

      {/* 更新提示 */}
      {itinerary.length > 0 && !isGenerating && !isUpdating && (
        <motion.div
          className="mt-3 text-center text-xs text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          已为您更新 {itinerary.length} 个活动
        </motion.div>
      )}
    </motion.div>
  );
}