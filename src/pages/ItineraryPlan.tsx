import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';
import BudgetSlider from '@/components/BudgetSlider';
import Timeline from '@/components/Timeline';
import FloatingPanel from '@/components/FloatingPanel';

export default function ItineraryPlan() {
  const { selectedEmotion, generateItineraryAction, itinerary, isGenerating } = useAppStore();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden gradient-transition pb-20"
      style={{ background: selectedEmotion.colors.gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* 流动粒子背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/15 particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 px-4 py-8 max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors"
            onClick={handleBack}
            aria-label="返回情绪选择页"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white font-medium">返回</span>
          </button>

          <div className="text-white text-right">
            <p className="text-sm font-medium opacity-80">当前情绪</p>
            <p className="text-lg font-bold">{selectedEmotion.name}</p>
          </div>
        </motion.div>

        {/* 标题 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            <Wand2 className="inline w-8 h-8 mr-2" />
            定制您的旅程
          </h2>
          <p className="text-white/80">根据预算和偏好，生成个性化行程</p>
        </motion.div>

        {/* 预算设置 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <BudgetSlider />
        </motion.div>

        {/* AI生成按钮 */}
        {itinerary.length === 0 && !isGenerating && (
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              className="relative px-12 py-6 rounded-2xl overflow-hidden"
              style={{
                background: selectedEmotion.colors.gradient,
                boxShadow: '0 0 30px ' + selectedEmotion.colors.primary + '60'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateItineraryAction}
              aria-label="生成个性化行程"
            >
              {/* 光晕效果 */}
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{
                  opacity: [0, 0.3, 0],
                  scale: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <div className="relative z-10 flex items-center gap-3">
                <Wand2 className="w-7 h-7 text-white" />
                <span className="text-white text-xl font-bold">生成专属行程</span>
              </div>
            </motion.button>

            <p className="mt-4 text-white/70 text-sm">
              AI 将根据您的情绪、天气和预算为您定制行程
            </p>
          </motion.div>
        )}

        {/* 行程时间轴 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Timeline />
        </motion.div>
      </div>

      {/* 浮动控制面板 */}
      <FloatingPanel />
    </motion.div>
  );
}