import React from 'react';
import { 
  Compass, 
  Activity, 
  Utensils, 
  BookOpen, 
  PenLine, 
  Film, 
  ChevronRight, 
  MapPin, 
  PenTool, 
  Search,
  Sparkles,
  Heart,
  TrendingUp,
  Map as MapIcon
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

export const HomeView: React.FC<HomeViewProps> = ({ onSelectCategory, onNavigateTab }) => {
  const outdoorCategories = CATEGORIES.filter(c => c.group === 'outdoor');
  const lifeCategories = CATEGORIES.filter(c => c.group === 'life');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-white p-6 sm:p-8 shadow-lg shadow-rose-500/15">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>日常足跡與生活靈感紀錄</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            記錄每一個微小而幸福的日常瞬間
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            透過簡約地圖打卡記錄探險足跡，用細膩文字留下心靈共鳴。隨時隨地，探索自己與朋友的幸福歷程。
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('checkin')}
              className="px-4 py-2.5 bg-white text-rose-600 font-semibold text-xs sm:text-sm rounded-2xl shadow-sm hover:bg-rose-50 transition-all flex items-center gap-2 cursor-pointer"
              id="hero-quick-checkin-btn"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>立即 GPS 打卡</span>
            </button>

            <button
              onClick={() => onNavigateTab('input')}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/30 transition-all flex items-center gap-2 cursor-pointer"
              id="hero-quick-input-btn"
            >
              <PenTool className="w-4 h-4" />
              <span>隨筆靈感輸入</span>
            </button>
          </div>
        </div>

        {/* Decorative background visual circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-6 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
      </div>

      {/* 6 Big Blocks Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>探索 6 大幸福主題</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                公開查詢 & 專屬視圖
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              點擊任一主題區塊，輸入 Gmail 即可公開檢視該類別近 1 個月的足跡地圖或心得日誌
            </p>
          </div>
        </div>

        {/* Group 1: 動態戶外組 (地圖打卡模式) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-300 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>動態戶外組 (地圖視覺化)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {outdoorCategories.map(cat => {
              const Icon = ICON_MAP[cat.iconName] || Compass;
              return (
                <button
                  key={cat.type}
                  onClick={() => onSelectCategory(cat.type)}
                  className={`group relative text-left p-5 rounded-3xl bg-gradient-to-br ${cat.bgGradient} border border-slate-200/80 dark:border-slate-800/80 ${cat.borderHover} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none`}
                  id={`home-block-${cat.type}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${cat.themeColor}15`, color: cat.themeColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1">
                        <MapIcon className="w-3 h-3 text-sky-500" />
                        地圖模式
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:translate-x-0.5 transition-transform">
                      {cat.name}
                    </h3>
                    <p className={`text-xs font-medium ${cat.textColor} mb-2`}>
                      {cat.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-750/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    <span>進入公開查詢</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Group 2: 靜態生活組 (清單倒序模式) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300 tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span>靜態生活組 (心靈與文字清單)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {lifeCategories.map(cat => {
              const Icon = ICON_MAP[cat.iconName] || BookOpen;
              return (
                <button
                  key={cat.type}
                  onClick={() => onSelectCategory(cat.type)}
                  className={`group relative text-left p-5 rounded-3xl bg-gradient-to-br ${cat.bgGradient} border border-slate-200/80 dark:border-slate-800/80 ${cat.borderHover} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none`}
                  id={`home-block-${cat.type}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${cat.themeColor}15`, color: cat.themeColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                        日誌清單
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:translate-x-0.5 transition-transform">
                      {cat.name}
                    </h3>
                    <p className={`text-xs font-medium ${cat.textColor} mb-2`}>
                      {cat.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-750/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    <span>進入公開查詢</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Explanations footer card */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              純淨・簡約・永續紀錄
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              無廣告、無多餘多媒體負擔，專注於生活的真實軌跡與心得沉澱。
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('logs')}
          className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
        >
          <span>查看個人總覽圖表</span>
          <TrendingUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
