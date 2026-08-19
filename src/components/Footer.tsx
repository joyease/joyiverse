import React from 'react';
import { Home, MapPin, Map as MapIcon, PenTool, BookMarked, Lock } from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentTab, onSelectTab }) => {
  const { user, requireAuth } = useAuth();

  const handleTabClick = (tab: NavigationTab) => {
    if (tab === 'home') {
      onSelectTab('home');
      return;
    }

    // Tabs (2) ~ (5) require login
    if (!user) {
      requireAuth(() => {
        onSelectTab(tab);
      });
      return;
    }

    onSelectTab(tab);
  };

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ElementType;
    requiresAuth: boolean;
  }[] = [
    { id: 'home', label: '首頁', icon: Home, requiresAuth: false },
    { id: 'checkin', label: '打卡', icon: MapPin, requiresAuth: true },
    { id: 'map', label: '地圖', icon: MapIcon, requiresAuth: true },
    { id: 'input', label: '輸入', icon: PenTool, requiresAuth: true },
    { id: 'logs', label: '日誌', icon: BookMarked, requiresAuth: true },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#242933] border-t border-slate-800 transition-colors pb-safe shadow-2xl">
      <div className="max-w-md sm:max-w-lg mx-auto px-3 sm:px-6 h-16 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isLocked = item.requiresAuth && !user;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer focus:outline-none ${
                isActive
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id={`nav-tab-${item.id}`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                {isLocked && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Lock className="w-2 h-2" />
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};
