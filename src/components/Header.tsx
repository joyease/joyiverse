import React, { useState } from 'react';
import { Sparkles, HelpCircle, User as UserIcon, LogOut, ShieldCheck, Mail, ExternalLink, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome }) => {
  const { user, openAuthModal, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#242933] border-b border-slate-800 text-white transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          id="header-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                Joyiverse
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium bg-rose-950/80 border border-rose-800/60 text-rose-300 rounded-full">
                生活足跡・日誌
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden xs:block">
              足跡打卡・生活隨筆・統計可視化
            </p>
          </div>
        </button>

        {/* Right: 2 Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon 1: 關於 Icon */}
          <a
            href="https://sites.google.com/view/joyiverse"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-1.5 focus:outline-none"
            title="關於 Joyiverse (FAQ 與個資宣告)"
            id="header-about-link"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-medium">關於</span>
          </a>

          {/* Icon 2: 個人帳號 / 頭像 Icon */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pl-2.5 pr-1.5 rounded-full border border-slate-700 hover:border-rose-500 bg-slate-800 transition-all focus:outline-none cursor-pointer"
                id="header-user-avatar-btn"
              >
                <span className="text-xs font-medium text-slate-200 max-w-[90px] truncate hidden sm:inline">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || user.email}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center text-xs font-semibold">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-slate-800 hover:bg-rose-600 border border-slate-700 transition-all focus:outline-none cursor-pointer"
                id="header-login-trigger-btn"
              >
                <UserIcon className="w-4 h-4" />
                <span>登入</span>
              </button>
            )}

            {/* User Dropdown / Popover */}
            {isProfileOpen && user && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-[#242933] rounded-2xl shadow-2xl border border-slate-750 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-500/30"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center text-base font-bold">
                        {user.email[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.displayName || '使用者'}
                      </p>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/70 border border-slate-750">
                      <span className="flex items-center gap-1.5 text-slate-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        身分驗證
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-medium">
                        Google Gmail 已驗證
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-750">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <Globe className="w-4 h-4 text-sky-400" />
                          公開查詢狀態
                        </span>
                        <span className="text-[11px] text-slate-400">預設公開</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        他人可於 6 大公開頁輸入您的 Gmail 瀏覽近一個月公開紀錄
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <a
                      href="https://sites.google.com/view/joyiverse"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        隱私條款與說明
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      id="profile-logout-btn"
                    >
                      <LogOut className="w-4 h-4" />
                      登出帳號
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
