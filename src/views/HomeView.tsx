import React from 'react';
import { 
  Compass, 
  Activity, 
  Utensils, 
  BookOpen, 
  PenLine, 
  Film, 
  ChevronRight, 
  Map as MapIcon,
  BookText
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { LogType, NavigationTab } from '../types';

interface HomeViewProps {
  onSelectCategory: (category: LogType) => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Activity,
  Utensils,
  BookOpen,
  PenLine,
  Film,
};

const CATEGORY_DEEP_THEMES: Record<LogType, {
  gradient: string;
  borderColor: string;
  iconBg: string;
  tagBg: string;
  modeLabel: string;
  isMap: boolean;
}> = {
  '旅行': {
    gradient: 'from-sky-950 via-sky-900 to-slate-950',
    borderColor: 'border-sky-800/60 hover:border-sky-500/80',
    iconBg: 'bg-sky-500/20 text-sky-300',
    tagBg: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    modeLabel: 'GPS 地圖足跡',
    isMap: true,
  },
  '運動': {
    gradient: 'from-emerald-950 via-emerald-900 to-slate-950',
    borderColor: 'border-emerald-800/60 hover:border-emerald-500/80',
    iconBg: 'bg-emerald-500/20 text-emerald-300',
    tagBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    modeLabel: 'GPS 地圖足跡',
    isMap: true,
  },
  '美食': {
    gradient: 'from-amber-950 via-amber-900 to-stone-950',
    borderColor: 'border-amber-800/60 hover:border-amber-500/80',
    iconBg: 'bg-amber-500/20 text-amber-300',
    tagBg: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    modeLabel: 'GPS 地圖足跡',
    isMap: true,
  },
  '閱讀': {
    gradient: 'from-violet-950 via-violet-900 to-slate-950',
    borderColor: 'border-violet-800/60 hover:border-violet-500/80',
    iconBg: 'bg-violet-500/20 text-violet-300',
    tagBg: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
    modeLabel: '文字心得日記',
    isMap: false,
  },
  '創作': {
    gradient: 'from-rose-950 via-rose-900 to-slate-950',
    borderColor: 'border-rose-800/60 hover:border-rose-500/80',
    iconBg: 'bg-rose-500/20 text-rose-300',
    tagBg: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
    modeLabel: '文字心得日記',
    isMap: false,
  },
  '視聽': {
    gradient: 'from-indigo-950 via-indigo-900 to-slate-950',
    borderColor: 'border-indigo-800/60 hover:border-indigo-500/80',
    iconBg: 'bg-indigo-500/20 text-indigo-300',
    tagBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40',
    modeLabel: '文字心得日記',
    isMap: false,
  },
  '寫字': {
    gradient: 'from-rose-950 via-rose-900 to-slate-950',
    borderColor: 'border-rose-800/60 hover:border-rose-500/80',
    iconBg: 'bg-rose-500/20 text-rose-300',
    tagBg: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
    modeLabel: '文字心得日記',
    isMap: false,
  },
  '影片': {
    gradient: 'from-indigo-950 via-indigo-900 to-slate-950',
    borderColor: 'border-indigo-800/60 hover:border-indigo-500/80',
    iconBg: 'bg-indigo-500/20 text-indigo-300',
    tagBg: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40',
    modeLabel: '文字心得日記',
    isMap: false,
  },
};

export const HomeView: React.FC<HomeViewProps> = ({ onSelectCategory, onNavigateTab }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 animate-in fade-in duration-200">
      {/* 6 Horizontal Deep-Colored Blocks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>幸福時空 ‧ 生活隨記</span>
          </h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            點選進入公開查詢
          </span>
        </div>

        {/* Six Horizontal Strip Cards */}
        <div className="flex flex-col gap-3">
          {CATEGORIES.map(cat => {
            const Icon = ICON_MAP[cat.iconName] || Compass;
            const theme = CATEGORY_DEEP_THEMES[cat.type] || {
              gradient: 'from-slate-900 via-slate-800 to-slate-950',
              borderColor: 'border-slate-800 hover:border-slate-600',
              iconBg: 'bg-white/10 text-white',
              tagBg: 'bg-white/10 text-white border-white/20',
              modeLabel: '探索模式',
              isMap: false,
            };

            return (
              <button
                key={cat.type}
                onClick={() => onSelectCategory(cat.type)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r ${theme.gradient} border ${theme.borderColor} shadow-md hover:shadow-xl transition-all duration-200 flex items-center justify-between cursor-pointer group active:scale-[0.99] focus:outline-none`}
                id={`home-block-${cat.type}`}
              >
                {/* Left side: Icon + Bold White Title + Mode Badge */}
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-inner border border-white/10 ${theme.iconBg} group-hover:scale-105 transition-transform flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-wide group-hover:translate-x-0.5 transition-transform">
                      {cat.name}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium px-2.5 py-0.5 rounded-full border ${theme.tagBg} self-start sm:self-center`}>
                      {theme.isMap ? (
                        <MapIcon className="w-3 h-3" />
                      ) : (
                        <BookText className="w-3 h-3" />
                      )}
                      <span>{theme.modeLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Right side: Sleek chevron */}
                <div className="flex items-center gap-1 text-white/80 group-hover:text-white transition-colors flex-shrink-0 pl-2">
                  <span className="hidden sm:inline text-xs font-medium text-white/70 group-hover:text-white">
                    查看
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
