import React, { useState } from 'react';
import { X, Sparkles, Shield, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, loginWithCustomEmail } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    loginWithCustomEmail(customEmail, customName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden"
        id="auth-modal-dialog"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Visual */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              登入 Joyiverse
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              以 Google Gmail 驗證身分，守護個人足跡與日誌
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2.5 mb-6 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>記錄旅行、運動、美食 GPS 打卡足跡與地圖</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>撰寫閱讀、寫字、影片的心得隨想與隨筆日記</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>自訂公開或私有隱私權限，支援以 Gmail 查詢</span>
          </div>
        </div>

        {/* Google Auth Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 font-medium text-sm rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            id="google-auth-button"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? '驗證中...' : '使用 Google 帳號快速登入'}</span>
          </button>

          {/* Alternative fast test account login */}
          {!showCustomInput ? (
            <div className="text-center pt-2">
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 underline transition-colors cursor-pointer"
                id="toggle-custom-email-btn"
              >
                或直接輸入指定 Gmail 體驗
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="pt-2 space-y-2.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Gmail 地址
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="請輸入你或朋友的 gmail"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  暱稱 (選填)
                </label>
                <input
                  type="text"
                  placeholder="自訂暱稱 (例如：小明)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                  id="submit-custom-email-btn"
                >
                  <span>確認登入</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer privacy notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>遵循個資保護規範，僅儲存文字與經緯度</span>
        </div>
      </div>
    </div>
  );
};
