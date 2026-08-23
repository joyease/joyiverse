import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Database,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_ALLOWED_EMAILS } from '../services/whitelistService';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    loginWithPassword, 
    refreshAllowedList,
    user 
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isAuthModalOpen) return null;

  // 點選快速填入 Email
  const handleSelectAccount = (email: string) => {
    setInputEmail(email);
    setInputPassword('');
    setErrorMessage('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) {
      setErrorMessage('請輸入 Email 地址');
      return;
    }
    if (!inputPassword.trim()) {
      setErrorMessage('請輸入登入密碼');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await loginWithPassword(inputEmail, inputPassword, displayName);
      if (!res.success) {
        setErrorMessage(res.message || '登入失敗，密碼錯誤或尚未在授權名單中。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshList = async () => {
    setIsRefreshing(true);
    setErrorMessage('');
    try {
      await refreshAllowedList();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 overflow-hidden"
        id="auth-modal-dialog"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Visual */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>指定 Email 密碼登入</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              僅開放授權名單內的 Email 輸入密碼登入
            </p>
          </div>
        </div>

        {/* Quick select presets for the requested emails */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>已開放帳號（點選填入 Email）：</span>
            </span>
            <button
              onClick={handleRefreshList}
              className="text-[11px] text-slate-400 hover:text-sky-500 flex items-center gap-1 transition-colors cursor-pointer"
              title="從 Firebase 重新同步授權名單"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>重新整理名單</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DEFAULT_ALLOWED_EMAILS.map((item) => {
              const isCurrent = user?.email === item.email;
              const isSelected = inputEmail.toLowerCase() === item.email.toLowerCase();
              return (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => handleSelectAccount(item.email)}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/30'
                      : isCurrent
                      ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                  id={`quick-account-${item.email.replace(/[@.]/g, '-')}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {item.email[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{item.email}</p>
                      <p className="text-[10px] text-slate-400">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        使用中
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400">
                        點選填入
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form: Email + Password */}
        <form onSubmit={handleFormSubmit} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              授權 Email：
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="例如：hermanntalk@gmail.com"
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                id="auth-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              登入密碼：
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="請輸入密碼"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none font-mono"
                id="auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="顯示暱稱 (選填，例如：Hermann)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Error display - 不提示密碼內容 */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={closeAuthModal}
              className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inputEmail.trim() || !inputPassword.trim()}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              id="submit-auth-btn"
            >
              <span>{isSubmitting ? '驗證中...' : '確認登入'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Footer info: Firebase backend configuration */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Firebase <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">allowed_emails</code> 名單驗證</span>
          </span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">密碼保護</span>
        </div>
      </div>
    </div>
  );
};
