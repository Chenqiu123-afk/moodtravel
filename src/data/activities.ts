// 活动库数据
export interface ActivityCost {
  min: number;
  max: number;
}

export interface ActivityTags {
  emotions: string[];
  weather: string[];
  categories: string[];
}

export interface Activity {
  id: string;
  name: string;
  location: string;
  description: string;
  duration: number;
  cost: ActivityCost;
  tags: ActivityTags;
  image: string;
}

export const activities: Activity[] = [
  {
    id: 'gugong',
    name: '故宫博物院',
    location: '北京市东城区',
    description: '中国明清两代的皇家宫殿，世界上现存规模最大的宫殿型建筑',
    duration: 3,
    cost: { min: 60, max: 80 },
    tags: {
      emotions: ['joy', 'contemplative', 'romantic'],
      weather: ['晴', '多云'],
      categories: ['文化', '历史']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=故宫博物院红墙金瓦古建筑阳光明媚&image_size=landscape_16_9'
  },
  {
    id: 'changcheng',
    name: '长城游览',
    location: '北京市延庆区',
    description: '世界文化遗产，中华民族的象征，壮观的古代防御工事',
    duration: 4,
    cost: { min: 40, max: 60 },
    tags: {
      emotions: ['joy', 'adventure', 'energetic'],
      weather: ['晴'],
      categories: ['历史', '户外']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=长城蜿蜒山峦蓝天白云壮观景色&image_size=landscape_16_9'
  },
  {
    id: 'yantian',
    name: '颐和园漫步',
    location: '北京市海淀区',
    description: '皇家园林，山水景色优美，适合悠闲散步',
    duration: 2.5,
    cost: { min: 30, max: 50 },
    tags: {
      emotions: ['relax', 'romantic', 'contemplative'],
      weather: ['晴', '多云', '阴'],
      categories: ['自然', '园林']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=颐和园昆明湖万寿山古典园林美景&image_size=landscape_16_9'
  },
  {
    id: 'huangshan',
    name: '黄山探险',
    location: '安徽省黄山市',
    description: '中国著名风景区，奇松怪石云海温泉，五绝著称',
    duration: 6,
    cost: { min: 150, max: 200 },
    tags: {
      emotions: ['adventure', 'energetic', 'contemplative'],
      weather: ['晴', '多云'],
      categories: ['自然', '户外']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=黄山云海奇松怪石壮美山峰&image_size=landscape_16_9'
  },
  {
    id: 'hupan',
    name: '西湖畔游',
    location: '浙江省杭州市',
    description: '人间天堂西湖，湖光山色，诗情画意',
    duration: 3,
    cost: { min: 0, max: 100 },
    tags: {
      emotions: ['relax', 'romantic', 'contemplative'],
      weather: ['晴', '多云', '阴'],
      categories: ['自然', '湖泊']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=西湖断桥残雪湖光山色美景&image_size=landscape_16_9'
  },
  {
    id: 'chengdujinli',
    name: '锦里古街',
    location: '四川省成都市',
    description: '成都最具代表性的历史街区，品尝美食感受文化',
    duration: 2,
    cost: { min: 50, max: 150 },
    tags: {
      emotions: ['joy', 'relax', 'romantic'],
      weather: ['晴', '多云'],
      categories: ['美食', '文化']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=成都锦里古街红灯笼美食小吃热闹街景&image_size=landscape_16_9'
  },
  {
    id: 'dapanda',
    name: '大熊猫基地',
    location: '四川省成都市',
    description: '近距离观察国宝大熊猫，感受自然的可爱与神奇',
    duration: 2.5,
    cost: { min: 50, max: 70 },
    tags: {
      emotions: ['joy', 'relax'],
      weather: ['晴', '多云'],
      categories: ['自然', '动物']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=大熊猫基地可爱熊猫吃竹子玩耍&image_size=landscape_16_9'
  },
  {
    id: 'gulangyu',
    name: '鼓浪屿漫步',
    location: '福建省厦门市',
    description: '海上花园，钢琴之岛，漫步其间享受悠闲时光',
    duration: 4,
    cost: { min: 100, max: 200 },
    tags: {
      emotions: ['relax', 'romantic', 'contemplative'],
      weather: ['晴', '多云'],
      categories: ['海岛', '文化']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=鼓浪屿海边沙滩蓝天白云悠闲漫步&image_size=landscape_16_9'
  },
  {
    id: 'xiamenhaibian',
    name: '厦门海滩',
    location: '福建省厦门市',
    description: '金色沙滩，碧海蓝天，享受海滨度假时光',
    duration: 3,
    cost: { min: 0, max: 50 },
    tags: {
      emotions: ['joy', 'relax', 'energetic'],
      weather: ['晴'],
      categories: ['海滩', '户外']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=厦门海滩金色沙滩碧海蓝天度假&image_size=landscape_16_9'
  },
  {
    id: 'shanghaiwaitan',
    name: '外滩夜景',
    location: '上海市黄浦区',
    description: '上海的标志性景观，夜晚灯火辉煌，浪漫迷人',
    duration: 2,
    cost: { min: 0, max: 0 },
    tags: {
      emotions: ['joy', 'romantic', 'contemplative'],
      weather: ['晴', '多云', '阴'],
      categories: ['城市', '夜景']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=上海外滩夜景东方明珠璀璨灯火&image_size=landscape_16_9'
  },
  {
    id: 'tiantan',
    name: '天坛公园',
    location: '北京市东城区',
    description: '明清皇帝祭天的场所，建筑精美，环境幽雅',
    duration: 2,
    cost: { min: 15, max: 34 },
    tags: {
      emotions: ['relax', 'contemplative'],
      weather: ['晴', '多云'],
      categories: ['历史', '园林']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=天坛祈年殿蓝天白云古建筑&image_size=landscape_16_9'
  },
  {
    id: 'jingan',
    name: '静安寺',
    location: '上海市静安区',
    description: '上海著名古刹，闹市中的宁静之地',
    duration: 1.5,
    cost: { min: 50, max: 50 },
    tags: {
      emotions: ['contemplative', 'relax'],
      weather: ['晴', '多云', '阴'],
      categories: ['文化', '宗教']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=上海静安寺金色屋顶闹市中的寺庙&image_size=landscape_16_9'
  },
  {
    id: 'shanghaiyishu',
    name: '上海当代艺术馆',
    location: '上海市黄浦区',
    description: '当代艺术展览，感受现代艺术的魅力',
    duration: 2,
    cost: { min: 50, max: 100 },
    tags: {
      emotions: ['contemplative', 'joy'],
      weather: ['晴', '多云', '阴'],
      categories: ['艺术', '文化']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=上海当代艺术馆现代艺术展览空间&image_size=landscape_16_9'
  },
  {
    id: 'beijing798',
    name: '798艺术区',
    location: '北京市朝阳区',
    description: '艺术创意园区，前卫时尚的文化聚集地',
    duration: 3,
    cost: { min: 0, max: 100 },
    tags: {
      emotions: ['joy', 'adventure', 'contemplative'],
      weather: ['晴', '多云'],
      categories: ['艺术', '创意']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=北京798艺术区创意空间现代艺术涂鸦&image_size=landscape_16_9'
  },
  {
    id: 'hupao',
    name: '虎跑泉茶馆',
    location: '浙江省杭州市',
    description: '品尝西湖龙井，感受茶文化的宁静',
    duration: 1.5,
    cost: { min: 50, max: 150 },
    tags: {
      emotions: ['relax', 'contemplative', 'romantic'],
      weather: ['晴', '多云', '阴'],
      categories: ['美食', '文化']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=杭州虎跑泉茶馆喝茶品茗茶艺表演&image_size=landscape_16_9'
  },
  {
    id: 'dujiangyan',
    name: '都江堰',
    location: '四川省都江堰市',
    description: '古代水利工程奇迹，见证古人的智慧',
    duration: 3,
    cost: { min: 80, max: 90 },
    tags: {
      emotions: ['contemplative', 'adventure', 'joy'],
      weather: ['晴', '多云'],
      categories: ['历史', '水利']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=都江堰水利工程古建筑山水景色&image_size=landscape_16_9'
  },
  {
    id: 'qingchengshan',
    name: '青城山',
    location: '四川省都江堰市',
    description: '道教名山，清幽宁静，登山健身的好去处',
    duration: 5,
    cost: { min: 90, max: 120 },
    tags: {
      emotions: ['energetic', 'contemplative', 'adventure'],
      weather: ['晴', '多云'],
      categories: ['自然', '宗教']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=青城山道教名山清幽宁静登山步道&image_size=landscape_16_9'
  },
  {
    id: 'nanputuo',
    name: '南普陀寺',
    location: '福建省厦门市',
    description: '闽南佛教圣地，香火鼎盛，寺宇庄严',
    duration: 2,
    cost: { min: 0, max: 0 },
    tags: {
      emotions: ['contemplative', 'relax'],
      weather: ['晴', '多云'],
      categories: ['宗教', '文化']
    },
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=厦门南普陀寺佛教寺庙香火鼎盛&image_size=landscape_16_9'
  }
];

// 默认活动
export const defaultActivities = activities.slice(0, 5);