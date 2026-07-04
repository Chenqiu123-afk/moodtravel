// 情绪配置数据
export interface EmotionColors {
  primary: string;
  secondary: string;
  gradient: string;
}

export interface Emotion {
  id: string;
  name: string;
  icon: string;
  colors: EmotionColors;
  description: string;
  tags: string[];
}

export const emotions: Emotion[] = [
  {
    id: 'joy',
    name: '愉悦',
    icon: 'Sun',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FFE66D',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)'
    },
    description: '阳光灿烂的心情，期待充满活力的旅程',
    tags: ['阳光', '活力', '欢乐']
  },
  {
    id: 'relax',
    name: '放松',
    icon: 'Cloud',
    colors: {
      primary: '#98D8C8',
      secondary: '#7EC8E3',
      gradient: 'linear-gradient(135deg, #98D8C8 0%, #7EC8E3 100%)'
    },
    description: '悠闲自在的状态，享受慢节奏的旅行时光',
    tags: ['悠闲', '舒适', '宁静']
  },
  {
    id: 'adventure',
    name: '冒险',
    icon: 'Mountain',
    colors: {
      primary: '#7B68EE',
      secondary: '#DC143C',
      gradient: 'linear-gradient(135deg, #7B68EE 0%, #DC143C 100%)'
    },
    description: '探索未知的冲动，渴望挑战和惊喜',
    tags: ['探索', '挑战', '刺激']
  },
  {
    id: 'romantic',
    name: '浪漫',
    icon: 'Heart',
    colors: {
      primary: '#FFB6C1',
      secondary: '#DDA0DD',
      gradient: 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 100%)'
    },
    description: '浪漫温馨的心情，期待美好的二人世界',
    tags: ['浪漫', '温馨', '甜蜜']
  },
  {
    id: 'contemplative',
    name: '沉思',
    icon: 'Moon',
    colors: {
      primary: '#4169E1',
      secondary: '#708090',
      gradient: 'linear-gradient(135deg, #4169E1 0%, #708090 100%)'
    },
    description: '内省宁静的状态，寻找心灵的沉淀和思考',
    tags: ['宁静', '内省', '思考']
  },
  {
    id: 'energetic',
    name: '活力',
    icon: 'Zap',
    colors: {
      primary: '#FFD700',
      secondary: '#FF8C00',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)'
    },
    description: '精力充沛的状态，期待运动和户外活动',
    tags: ['运动', '户外', '活力']
  }
];

// 默认情绪
export const defaultEmotion = emotions[0];