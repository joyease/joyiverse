import React from 'react';
import { 
  Compass, 
  Activity, 
  Utensils, 
  BookOpen, 
  PenLine, 
  Film, 
  Heart, 
  GraduationCap, 
  Sparkles, 
  ExternalLink,
  MapPin,
  BookText
} from 'lucide-react';
import { LogType, NavigationTab } from '../types';

interface HomeViewProps {
  onSelectCategory: (category: LogType) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

interface SquareTileItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  iconBg: string;
  tagBg: string;
  type: 'category' | 'link';
  categoryKey?: LogType;
  url?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectCategory }) => {
  // 9 Square tiles arranged strictly in 3 rows x 3 columns
  const tiles: SquareTileItem[] = [
    // Row 1: 旅行、運動、美食
    {
      id: 'travel',
      title: '旅行',
      subtitle: '陌生點打卡',
      badge: 'GPS 足跡',
      icon: Compass,
      gradient: 'from-sky-950 via-sky-900 to-slate-950',
      borderColor: 'border-sky-800/60 hover:border-sky-400/80 hover:shadow-sky-950/50',
      iconBg: 'bg-sky-500/20 text-sky-300 group-hover:bg-sky-500/30 group-hover:text-sky-200',
      tagBg: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
      type: 'category',
      categoryKey: '旅行',
    },
    {
      id: 'sport',
      title: '運動',
      subtitle: '揮汗前打卡',
      badge: 'GPS 足跡',
      icon: Activity,
      gradient: 'from-emerald-950 via-emerald-900 to-slate-950',
      borderColor: 'border-emerald-800/60 hover:border-emerald-400/80 hover:shadow-emerald-950/50',
      iconBg: 'bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 group-hover:text-emerald-200',
      tagBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
      type: 'category',
      categoryKey: '運動',
    },
    {
      id: 'food',
      title: '美食',
      subtitle: '好食物打卡',
      badge: 'GPS 足跡',
      icon: Utensils,
      gradient: 'from-amber-950 via-amber-900 to-stone-950',
      borderColor: 'border-amber-800/60 hover:border-amber-400/80 hover:shadow-amber-950/50',
      iconBg: 'bg-amber-500/20 text-amber-300 group-hover:bg-amber-500/30 group-hover:text-amber-200',
      tagBg: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
      type: 'category',
      categoryKey: '美食',
    },

    // Row 2: 閱讀、創作、視聽
    {
      id: 'reading',
      title: '閱讀',
      subtitle: '讀些什麼有啟發',
      badge: '文字心得',
      icon: BookOpen,
      gradient: 'from-violet-950 via-violet-900 to-slate-950',
      borderColor: 'border-violet-800/60 hover:border-violet-400/80 hover:shadow-violet-950/50',
      iconBg: 'bg-violet-500/20 text-violet-300 group-hover:bg-violet-500/30 group-hover:text-violet-200',
      tagBg: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
      type: 'category',
      categoryKey: '閱讀',
    },
    {
      id: 'creation',
      title: '創作',
      subtitle: '寫些什麼好修心',
      badge: '文字心得',
      icon: PenLine,
      gradient: 'from-rose-950 via-rose-900 to-slate-950',
      borderColor: 'border-rose-800/60 hover:border-rose-400/80 hover:shadow-rose-950/50',
      iconBg: 'bg-rose-500/20 text-rose-300 group-hover:bg-rose-500/30 group-hover:text-rose-200',
      tagBg: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
      type: 'category',
      categoryKey: '創作',
    },
    {
      id: 'media',
      title: '視聽',
      subtitle: '觀賞什麼好玩意',
      badge: '文字心得',
      icon: Film,
      gradient: 'from-indigo-950 via-indigo-900 to-slate-950',
      borderColor: 'border-indigo-800/60 hover:border-indigo-400/80 hover:shadow-indigo-950/50',
      iconBg: 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30 group-hover:text-indigo-200',
      tagBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40',
      type: 'category',
      categoryKey: '視聽',
    },

    // Row 3: 幸福、學習、易理 (外部連結)
    {
      id: 'happiness',
      title: '幸福',
      subtitle: 'Joyiverse 專欄',
      badge: '前往網站',
      icon: Heart,
      gradient: 'from-fuchsia-950 via-pink-900 to-slate-950',
      borderColor: 'border-pink-800/60 hover:border-pink-400/80 hover:shadow-pink-950/50',
      iconBg: 'bg-pink-500/20 text-pink-300 group-hover:bg-pink-500/30 group-hover:text-pink-200',
      tagBg: 'bg-pink-500/20 text-pink-200 border-pink-500/40',
      type: 'link',
      url: 'https://joyiverse.wordpress.com',
    },
    {
      id: 'learning',
      title: '學習',
      subtitle: 'Hermann Studio',
      badge: '前往網站',
      icon: GraduationCap,
      gradient: 'from-teal-950 via-cyan-900 to-slate-950',
      borderColor: 'border-teal-800/60 hover:border-teal-400/80 hover:shadow-teal-950/50',
      iconBg: 'bg-teal-500/20 text-teal-300 group-hover:bg-teal-500/30 group-hover:text-teal-200',
      tagBg: 'bg-teal-500/20 text-teal-200 border-teal-500/40',
      type: 'link',
      url: 'https://hermannstudio.wordpress.com',
    },
    {
      id: 'yijing',
      title: '易理',
      subtitle: '易經哲學生活應用',
      badge: '前往網站',
      icon: Sparkles,
      gradient: 'from-amber-950 via-yellow-900 to-slate-950',
      borderColor: 'border-amber-800/60 hover:border-amber-400/80 hover:shadow-amber-950/50',
      iconBg: 'bg-amber-500/20 text-amber-300 group-hover:bg-amber-500/30 group-hover:text-amber-200',
      tagBg: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
      type: 'link',
      url: 'https://yi.hermann.tw/',
    },
  ];

  const handleTileClick = (tile: SquareTileItem) => {
    if (tile.type === 'category' && tile.categoryKey) {
      onSelectCategory(tile.categoryKey);
    } else if (tile.type === 'link' && tile.url) {
      window.open(tile.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 animate-in fade-in duration-200">
      {/* Header section */}
      <div className="flex items-center justify-between px-1 mb-1">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>幸福時空 ‧ 九宮探索</span>
        </h1>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          點選方塊進入項目
        </span>
      </div>

      {/* 3x3 Nine Square Tiles Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-4.5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const isLink = tile.type === 'link';

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={`aspect-square w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br ${tile.gradient} border ${tile.borderColor} p-2 sm:p-4 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer group focus:outline-none`}
              id={`home-square-${tile.id}`}
            >
              {/* Subtle top indicator / external icon */}
              <div className="w-full flex items-center justify-between text-[10px] sm:text-xs">
                {isLink ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[11px] font-medium border bg-white/10 text-white/90 border-white/20">
                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden xs:inline sm:inline">連結</span>
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[11px] font-medium border ${tile.tagBg}`}>
                    {tile.id === 'travel' || tile.id === 'sport' || tile.id === 'food' ? (
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    ) : (
                      <BookText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    <span className="hidden xs:inline sm:inline">{tile.badge}</span>
                  </span>
                )}
                {isLink && (
                  <ExternalLink className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
                )}
              </div>

              {/* Center: Large Icon & Title */}
              <div className="flex flex-col items-center justify-center my-auto gap-1 sm:gap-2">
                <div
                  className={`w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner border border-white/10 ${tile.iconBg} group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-base sm:text-xl font-bold text-white tracking-wide group-hover:text-white group-hover:scale-105 transition-all">
                  {tile.title}
                </h2>
              </div>

              {/* Bottom: Subtitle */}
              <div className="w-full">
                <p className="text-[10px] sm:text-xs text-white/70 group-hover:text-white/90 truncate transition-colors">
                  {tile.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
