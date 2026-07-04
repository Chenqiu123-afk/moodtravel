// 天气数据
export interface Weather {
  city: string;
  cityId: string;
  weather: string;
  temperature: number;
  humidity: number;
  wind: string;
  icon: string;
  suggestion: string;
}

export const weatherData: Weather[] = [
  {
    city: '北京',
    cityId: 'bj',
    weather: '晴',
    temperature: 28,
    humidity: 45,
    wind: '微风',
    icon: 'Sun',
    suggestion: '适合户外活动，建议防晒'
  },
  {
    city: '上海',
    cityId: 'sh',
    weather: '多云',
    temperature: 25,
    humidity: 60,
    wind: '轻风',
    icon: 'Cloud',
    suggestion: '气温适宜，适合各类活动'
  },
  {
    city: '杭州',
    cityId: 'hz',
    weather: '阴',
    temperature: 22,
    humidity: 75,
    wind: '微风',
    icon: 'CloudRain',
    suggestion: '可能有雨，建议携带雨具'
  },
  {
    city: '成都',
    cityId: 'cd',
    weather: '晴',
    temperature: 24,
    humidity: 55,
    wind: '微风',
    icon: 'Sun',
    suggestion: '天气舒适，适合休闲游览'
  },
  {
    city: '厦门',
    cityId: 'xm',
    weather: '晴',
    temperature: 30,
    humidity: 70,
    wind: '微风',
    icon: 'Sun',
    suggestion: '海边天气宜人，适合海滨活动'
  }
];

// 默认城市
export const defaultCity = weatherData[0];