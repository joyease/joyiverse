import { CategoryMeta, LogType } from '../types';

export const CATEGORIES: CategoryMeta[] = [
  // Outdoor Group
  {
    type: '旅行',
    group: 'outdoor',
    name: '旅行',
    subtitle: '陌生點打卡地圖',
    iconName: 'Compass',
    themeColor: '#0ea5e9', // sky-500
    bgGradient: 'from-sky-50 to-sky-100/60 dark:from-sky-950/40 dark:to-sky-900/20',
    textColor: 'text-sky-600 dark:text-sky-400',
    borderHover: 'hover:border-sky-300 dark:hover:border-sky-700',
    description: '記錄旅途風景、城市漫步與探險地標',
    sampleNote: '漫步在京都哲學之道，櫻花初綻的微風令人神清氣爽。',
  },
  {
    type: '運動',
    group: 'outdoor',
    name: '運動',
    subtitle: '揮汗前打卡地圖',
    iconName: 'Activity',
    themeColor: '#10b981', // emerald-500
    bgGradient: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    description: '慢跑、登山、單車與日常體能鍛鍊足跡',
    sampleNote: '晨跑 5 公里，河濱公園的朝陽讓人充滿活力！',
  },
  {
    type: '美食',
    group: 'outdoor',
    name: '美食',
    subtitle: '好食物打卡地圖',
    iconName: 'Utensils',
    themeColor: '#f59e0b', // amber-500
    bgGradient: 'from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-300 dark:hover:border-amber-700',
    description: '街角咖啡館、私房餐廳與美味小吃探店',
    sampleNote: '巷弄手沖咖啡搭配現烤肉桂捲，香氣層次豐富迷人。',
  },

  // Life Group
  {
    type: '閱讀',
    group: 'life',
    name: '閱讀',
    subtitle: '讀些什麼有啟發',
    iconName: 'BookOpen',
    themeColor: '#8b5cf6', // violet-500
    bgGradient: 'from-violet-50 to-violet-100/60 dark:from-violet-950/40 dark:to-violet-900/20',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderHover: 'hover:border-violet-300 dark:hover:border-violet-700',
    description: '書籍章節摘要、金句摘錄與閱讀思索',
    sampleNote: '讀完《原子習慣》第四章，微小的改變累積起來將產生複利效應。',
  },
  {
    type: '創作',
    group: 'life',
    name: '創作',
    subtitle: '寫些什麼好修心',
    iconName: 'PenLine',
    themeColor: '#ec4899', // pink-500
    bgGradient: 'from-pink-50 to-pink-100/60 dark:from-pink-950/40 dark:to-pink-900/20',
    textColor: 'text-pink-600 dark:text-pink-400',
    borderHover: 'hover:border-pink-300 dark:hover:border-pink-700',
    description: '隨筆手札、心情隨想、感恩日記與每日反省',
    sampleNote: '今天完成了重要企劃，感謝身邊夥伴的支持與鼓勵。',
  },
  {
    type: '視聽',
    group: 'life',
    name: '視聽',
    subtitle: '觀賞什麼好玩意',
    iconName: 'Film',
    themeColor: '#6366f1', // indigo-500
    bgGradient: 'from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    description: '電影、紀錄片、影集觀後感與精選台詞',
    sampleNote: '重溫經典動畫《神隱少女》，配樂與美術依然令人動容深思。',
  },
];

export const CATEGORY_MAP: Record<LogType, CategoryMeta> = (() => {
  const map = CATEGORIES.reduce(
    (acc, item) => ({ ...acc, [item.type]: item }),
    {} as Record<LogType, CategoryMeta>
  );
  // 相容舊資料之 mapping
  if (map['創作']) map['寫字'] = map['創作'];
  if (map['視聽']) map['影片'] = map['視聽'];
  return map;
})();
