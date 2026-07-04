import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppStore';
import { DollarSign } from 'lucide-react';

export default function BudgetSlider() {
  const { budget, setBudget, selectedEmotion } = useAppStore();

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBudget(value);
  };

  const getBudgetLevel = (value: number): string => {
    if (value <= 200) return '经济';
    if (value <= 500) return '舒适';
    return '豪华';
  };

  const getBudgetColor = (value: number): string => {
    if (value <= 200) return '#98D8C8';
    if (value <= 500) return selectedEmotion.colors.primary;
    return '#FFD700';
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 预算标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" style={{ color: selectedEmotion.colors.primary }} />
          <span className="text-lg font-semibold text-white">预算设置</span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-2xl font-bold text-white"
            style={{ color: getBudgetColor(budget) }}
          >
            ¥{budget}
          </span>
        </div>
      </div>

      {/* 预算等级标签 */}
      <div className="flex justify-between text-xs text-white/70 mb-2">
        <span>经济 (≤200)</span>
        <span>舒适 (200-500)</span>
        <span>豪华 (>500)</span>
      </div>

      {/* 自定义滑块 */}
      <div className="relative h-12 mb-4">
        {/* 滑块轨道 */}
        <div 
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-white/20"
          style={{
            background: `linear-gradient(to right, 
              #98D8C8 0%, 
              ${selectedEmotion.colors.primary} 40%, 
              #FFD700 100%)`
          }}
        />
        
        {/* 滑块输入 */}
        <input
          type="range"
          min="100"
          max="1000"
          step="50"
          value={budget}
          onChange={handleBudgetChange}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-2 appearance-none bg-transparent cursor-pointer z-10"
          aria-label="调整预算"
          style={{
            // 自定义滑块样式
          }}
        />
        
        {/* 滑块按钮 */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg cursor-pointer"
          style={{
            left: `calc(${(budget - 100) / 900 * 100}% - 12px)`,
            background: selectedEmotion.colors.gradient,
            boxShadow: '0 0 20px ' + selectedEmotion.colors.primary + '40'
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: [
              '0 0 20px ' + selectedEmotion.colors.primary + '40',
              '0 0 30px ' + selectedEmotion.colors.primary + '60',
              '0 0 20px ' + selectedEmotion.colors.primary + '40'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* 预算等级显示 */}
      <div className="text-center">
        <motion.span
          className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: getBudgetColor(budget) + '30',
            color: 'white'
          }}
          key={budget}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {getBudgetLevel(budget)}型旅行
        </motion.span>
      </div>
    </motion.div>
  );
}