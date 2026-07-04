import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { ItineraryItem } from '@/utils/itineraryGenerator';
import { useAppStore } from '@/hooks/useAppStore';
import ActivityCard from './ActivityCard';

export default function Timeline() {
  const { itinerary, selectedEmotion, isGenerating } = useAppStore();

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          className="w-16 h-16 rounded-full"
          style={{ background: selectedEmotion.colors.gradient }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <p className="mt-4 text-white text-lg">正在生成行程...</p>
        <p className="mt-2 text-white/70 text-sm">根据您的情绪、天气和预算定制</p>
      </div>
    );
  }

  if (itinerary.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 text-lg">暂无行程安排</p>
        <p className="mt-2 text-white/50 text-sm">请点击下方按钮生成行程</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 时间轴线 */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b"
        style={{
          background: `linear-gradient(to bottom, 
            ${selectedEmotion.colors.primary}, 
            ${selectedEmotion.colors.secondary})`
        }}
      />

      {/* 行程项 */}
      <div className="space-y-4 pl-8">
        {itinerary.map((item, index) => (
          <div key={item.id} className="relative">
            {/* 时间点 */}
            <motion.div
              className="absolute -left-8 top-0 w-4 h-4 rounded-full shadow-lg"
              style={{ 
                background: selectedEmotion.colors.primary,
                boxShadow: '0 0 10px ' + selectedEmotion.colors.primary
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.15 }}
            />
            
            {/* 时间标签 */}
            <motion.div
              className="absolute -left-8 -top-6 text-xs text-white font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.startTime}
              </div>
            </motion.div>

            {/* 活动卡片 */}
            <ActivityCard item={item} index={index} />
          </div>
        ))}
      </div>

      {/* 行程总结 */}
      <motion.div
        className="mt-6 p-4 glass rounded-xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: itinerary.length * 0.15 + 0.5 }}
      >
        <p className="text-white text-lg font-semibold">
          共 {itinerary.length} 个活动，预计花费 ¥
          {itinerary.reduce((sum, item) => sum + item.estimatedCost, 0)}
        </p>
        <p className="mt-2 text-white/70 text-sm">
          行程时长约 {itinerary.reduce((sum, item) => sum + item.activity.duration, 0)} 小时
        </p>
      </motion.div>
    </div>
  );
}