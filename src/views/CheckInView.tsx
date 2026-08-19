import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Activity, 
  Utensils, 
  MapPin, 
  Navigation, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Globe, 
  Lock,
  ArrowRight,
  Map as MapIcon,
  RefreshCw
} from 'lucide-react';
import { LogType, NavigationTab } from '../types';
import { CATEGORIES } from '../data/categories';
import { createLog } from '../services/logService';
import { useAuth } from '../context/AuthContext';

interface CheckInViewProps {
  onSuccessNavigate: (tab: NavigationTab) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({ onSuccessNavigate, showToast }) => {
  const { user } = useAuth();
  const outdoorCategories = CATEGORIES.filter(c => c.group === 'outdoor');

  // Form State
  const [selectedType, setSelectedType] = useState<LogType>('旅行');
  const [note, setNote] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // GPS State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'failed'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Automatically attempt GPS retrieval on view load
  const acquireGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('failed');
      setGpsMessage('瀏覽器不支援 Geolocation，將以無定位模式儲存');
      return;
    }

    setGpsStatus('locating');
    setGpsMessage('正在透過 GPS 定位當前經緯度...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setCoords({ lat, lng });
        setGpsStatus('success');
        setGpsMessage(`定位成功：${lat}, ${lng} (精準度 ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        console.warn("Geolocation warning:", err.message);
        setGpsStatus('failed');
        setGpsMessage('無法取得精確 GPS，將以無定位模式儲存（仍可正常提交）');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    acquireGps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!note.trim()) {
      showToast('請輸入打卡備註心得', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createLog({
        userId: user.email,
        userDisplayName: user.displayName || user.email.split('@')[0],
        userPhotoURL: user.photoURL,
        type: selectedType,
        categoryGroup: 'outdoor',
        note: note.trim(),
        lat: coords?.lat || null,
        lng: coords?.lng || null,
        locationName: locationName.trim() || null,
        isPublic,
      });

      showToast(`「${selectedType}」打卡成功！`, 'success');
      // Reset form
      setNote('');
      setLocationName('');
    } catch (e) {
      console.error(e);
      showToast('打卡提交時發生錯誤，請稍後重試', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5" />
          <span>動態戶外 GPS 打卡</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          留下此刻的足跡與心情
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          紀錄旅行美景、運動熱血與美食探索，自動結合 GPS 經緯度構建個人足跡地圖
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* 1. Category Selection (Single Choice) */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            1. 選擇打卡類型 (單選)
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {outdoorCategories.map(cat => {
              const isSelected = selectedType === cat.type;
              return (
                <button
                  type="button"
                  key={cat.type}
                  onClick={() => setSelectedType(cat.type)}
                  className={`p-3.5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-sm ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  id={`checkin-type-${cat.type}`}
                >
                  <span className="text-xl">
                    {cat.type === '旅行' ? '🧭' : cat.type === '運動' ? '🏃' : '🍜'}
                  </span>
                  <span className="text-xs font-bold">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. GPS Location Status & Fallback Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              2. GPS 定位座標
            </label>
            <button
              type="button"
              onClick={acquireGps}
              disabled={gpsStatus === 'locating'}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1 font-medium cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>重新定位</span>
            </button>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              gpsStatus === 'success'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : gpsStatus === 'failed'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {gpsStatus === 'success' ? (
              <Navigation className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{gpsMessage || '準備定位中...'}</p>
              {gpsStatus === 'failed' && (
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                  提示：系統已啟用無定位降級模式，您依然可以填寫備註順利提交打卡。
                </p>
              )}
            </div>
          </div>

          {/* Optional Location Name field */}
          <div>
            <input
              type="text"
              placeholder="自訂地標名稱 (選填，例如：象山步道、大安森林公園)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
          </div>
        </div>

        {/* 3. Note Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            3. 備註與心得紀錄 *
          </label>
          <textarea
            required
            rows={4}
            placeholder={`寫下你在這段${selectedType}中的所見所聞、心情或體驗...`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-none leading-relaxed"
            id="checkin-note-input"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>支援純文字記錄 (免上傳圖片，輕量環保)</span>
            <span>{note.length} / 2000 字</span>
          </div>
        </div>

        {/* 4. Public Option Checkbox */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isPublic ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400' : 'bg-slate-200 text-slate-500'}`}>
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                公開此紀錄
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                允許他人透過您的 Gmail 於公開查詢頁搜尋近 1 個月的打卡點
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="sr-only peer"
              id="checkin-public-toggle"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            id="checkin-submit-btn"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? '儲存中...' : `確認提交「${selectedType}」打卡`}</span>
          </button>

          <button
            type="button"
            onClick={() => onSuccessNavigate('map')}
            className="py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MapIcon className="w-4 h-4 text-slate-500" />
            <span>查看個人足跡地圖</span>
          </button>
        </div>
      </form>
    </div>
  );
};
