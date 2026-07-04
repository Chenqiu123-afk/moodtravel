import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, DollarSign, Heart, Cloud, Tag } from 'lucide-react';
import { ItineraryItem } from '@/utils/itineraryGenerator';
import { useAppStore } from '@/hooks/useAppStore';

interface ActivityCardProps {
  item: ItineraryItem;
  index: number;
}

export default function ActivityCard({ item, index }: ActivityCardProps) {
  const { selectedEmotion } = useAppStore();
  const { activity, startTime, endTime, estimatedCost, emotionMatch, weatherMatch } = item;

  return (
    <motion.div
      className="relative glass rounded-xl overflow-hidden"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
      style={{
        borderColor: selectedEmotion.colors.primary + '30'
      }}
    >
      {/* 活动图片 */}
      <div className="h-32 bg-gray-100 relative overflow-hidden">
        <img 
          src={activity.image}
          alt={activity.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 图片加载失败时使用渐变背景
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.style.background = selectedEmotion.colors.gradient;
          }}
        />
        {/* 匹配度标签 */}
        <div className="absolute top-2 right-2 flex gap-1">
          <motion.div
            className="px-2 py-1 rounded-full text-xs font-semibold"
            style={{ 
              background: selectedEmotion.colors.primary + 'CC',
              color: 'white'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.15 + 0.3 }}
          >
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{emotionMatch}%</span>
            </div>
          </motion.div>
          <motion.div
            className="px-2 py-1 rounded-full text-xs font-semibold bg-white/80"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.15 + 0.4 }}
          >
            <div className="flex items-center gap-1 text-gray-700">
              <Cloud className="w-3 h-3" />
              <span>{weatherMatch}%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 活动信息 */}
      <div className="p-4 bg-white/10">
        {/* 时间 */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4" style={{ color: selectedEmotion.colors.primary }} />
          <span className="text-sm font-medium text-white">
            {startTime} - {endTime}
          </span>
        </div>

        {/* 活动名称 */}
        <h3 className="text-lg font-bold text-white mb-1">{activity.name}</h3>

        {/* 地点 */}
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-white/60" />
          <span className="text-xs text-white/70">{activity.location}</span>
        </div>

        {/* 描述 */}
        <p className="text-sm text-white/80 mb-3">{activity.description}</p>

        {/* 费用和时长 */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" style={{ color: selectedEmotion.colors.primary }} />
            <span className="text-sm font-semibold text-white">¥{estimatedCost}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock className="w-4 h-4" />
            <span>{activity.duration}小时</span>
          </div>
        </div>

        {/* 活动类别标签 */}
        <div className="mt-3 flex flex-wrap gap-1">
          {activity.tags.categories.map((cat, i) => (
            <motion.span
              key={i}
              className="px-2 py-1 rounded-full text-xs text-white/80 bg-white/10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 + i * 0.1 }}
            >
              <Tag className="w-3 h-3 inline mr-1" />
              {cat}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}