import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Crosshair,
  Info
} from 'lucide-react';
import L from 'leaflet';
import { LogType, NavigationTab } from '../types';
import { CATEGORIES } from '../data/categories';
import { createLog } from '../services/logService';
import { useAuth } from '../context/AuthContext';
import { getAccurateLocation, LocationResult } from '../services/locationService';

interface CheckInViewProps {
  onSuccessNavigate: (tab: NavigationTab) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({ onSuccessNavigate, showToast }) => {
  const { user, openAuthModal, requireAuth } = useAuth();
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
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mini Map Refs
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // 取得 GPS 定位邏輯
  const acquireGps = async () => {
    setGpsStatus('locating');
    setGpsMessage('正在啟動 GPS 與網路定位，請稍候...');

    try {
      const result: LocationResult = await getAccurateLocation();
      setCoords({ lat: result.lat, lng: result.lng });
      setAccuracy(result.accuracy);
      
      if (result.source === 'manual') {
        setGpsStatus('failed');
        setGpsMessage(result.message);
      } else {
        setGpsStatus('success');
        setGpsMessage(result.message);
      }

      // 若地圖已建立，立即移動地圖中心並平滑聚焦
      if (miniMapRef.current) {
        miniMapRef.current.setView([result.lat, result.lng], 16, { animate: true });
        if (markerRef.current) {
          markerRef.current.setLatLng([result.lat, result.lng]);
        }
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng([result.lat, result.lng]);
          accuracyCircleRef.current.setRadius(Math.min(result.accuracy, 500));
        }
      }
    } catch (err: any) {
      console.warn("GPS acquisition exception:", err);
      setGpsStatus('failed');
      setGpsMessage('無法取得 GPS 座標，已啟用手動點選模式，點擊下方地圖即可標記地點');
      if (!coords) {
        setCoords({ lat: 25.0330, lng: 121.5654 });
      }
    }
  };

  useEffect(() => {
    acquireGps();
  }, []);

  // Mini Leaflet Map Initialization
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    if (miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
    }

    const defaultLat = coords?.lat || 25.0330;
    const defaultLng = coords?.lng || 121.5654;

    const map = L.map(miniMapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-checkin-pin',
      html: `
        <div class="marker-pin" style="background-color: #0284c7;">
          <span class="marker-inner-icon">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([defaultLat, defaultLng], { 
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    const accuracyCircle = L.circle([defaultLat, defaultLng], {
      radius: accuracy || 50,
      color: '#0284c7',
      fillColor: '#38bdf8',
      fillOpacity: 0.15,
      weight: 1,
    }).addTo(map);

    marker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      const newLat = Number(newPos.lat.toFixed(5));
      const newLng = Number(newPos.lng.toFixed(5));
      setCoords({ lat: newLat, lng: newLng });
      setGpsStatus('success');
      setGpsMessage(`手動拖曳指定座標：${newLat}, ${newLng}`);
      accuracyCircle.setLatLng([newLat, newLng]);
    });

    map.on('click', (e) => {
      const clickPos = e.latlng;
      const clickLat = Number(clickPos.lat.toFixed(5));
      const clickLng = Number(clickPos.lng.toFixed(5));
      marker.setLatLng(clickPos);
      accuracyCircle.setLatLng(clickPos);
      setCoords({ lat: clickLat, lng: clickLng });
      setGpsStatus('success');
      setGpsMessage(`已設定地圖點選座標：${clickLat}, ${clickLng}`);
    });

    miniMapRef.current = map;
    markerRef.current = marker;
    accuracyCircleRef.current = accuracyCircle;

    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      miniMapRef.current = null;
      markerRef.current = null;
      accuracyCircleRef.current = null;
    };
  }, []);

  // Update marker position and center when coords state changes
  useEffect(() => {
    if (miniMapRef.current && markerRef.current && coords) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([coords.lat, coords.lng]);
        if (accuracy) {
          accuracyCircleRef.current.setRadius(Math.min(accuracy, 500));
        }
      }
      miniMapRef.current.setView([coords.lat, coords.lng], miniMapRef.current.getZoom() || 15);
      setTimeout(() => {
        miniMapRef.current?.invalidateSize();
      }, 100);
    }
  }, [coords, accuracy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      requireAuth(() => {});
      return;
    }
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
      onSuccessNavigate('map');
    } catch (e: any) {
      console.error("Check-in error:", e);
      showToast('儲存失敗，請檢查網路狀態後再試一次', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="space-y-0.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5" />
          <span>動態戶外 GPS 打卡</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          留下此刻的足跡與心情
        </h1>
      </div>

      {!user && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>目前為訪客模式，打卡儲存時需登入您的 Email 與密碼</span>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            立即登入
          </button>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        {/* Category Selection (Compact Button Height) */}
        <div className="grid grid-cols-3 gap-2">
          {outdoorCategories.map(cat => {
            const isSelected = selectedType === cat.type;
            return (
              <button
                type="button"
                key={cat.type}
                onClick={() => setSelectedType(cat.type)}
                className={`py-2.5 px-3 rounded-xl border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm font-bold ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 shadow-sm ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                id={`checkin-type-${cat.type}`}
              >
                <span className="text-base">
                  {cat.type === '旅行' ? '🧭' : cat.type === '運動' ? '🏃' : '🍜'}
                </span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* GPS Location Status & Fallback Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-sky-500" />
              <span>GPS 座標定位狀態</span>
            </span>
            <button
              type="button"
              onClick={acquireGps}
              disabled={gpsStatus === 'locating'}
              className="text-xs px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center gap-1.5 font-bold transition-all cursor-pointer disabled:opacity-50"
              id="re-locate-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>{gpsStatus === 'locating' ? '定位中...' : '重新定位'}</span>
            </button>
          </div>

          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all ${
              gpsStatus === 'success'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : gpsStatus === 'locating'
                ? 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 animate-pulse'
                : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            {gpsStatus === 'success' ? (
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : gpsStatus === 'locating' ? (
              <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-xs">{gpsMessage || '準備定位中...'}</p>
                {coords && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>可直接在地圖上「點選」或「拖曳圖釘」微調定位打卡點</span>
              </p>
            </div>
          </div>

          {/* Interactive OpenStreetMap Mini Preview & Picker */}
          <div className="space-y-1.5">
            <div 
              ref={miniMapContainerRef}
              className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner z-0 relative"
              id="checkin-mini-map"
            />
          </div>

          {/* Optional Location Name field */}
          <div>
            <input
              type="text"
              placeholder="自訂地標名稱 (選填，例如：象山步道、大安森林公園)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-3 text-sm sm:text-base rounded-2xl border-2 border-dashed border-sky-300/80 dark:border-sky-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:border-solid outline-none transition-colors"
            />
          </div>
        </div>

        {/* Note Input (Larger text and taller area) */}
        <div className="space-y-1.5">
          <textarea
            required
            rows={6}
            placeholder={`在此寫下你在這段「${selectedType}」中的所見所聞、心情或體驗...`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-4 text-sm sm:text-base md:text-lg rounded-2xl border-2 border-dashed border-sky-300/80 dark:border-sky-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:border-solid outline-none resize-none leading-relaxed min-h-[150px] transition-colors"
            id="checkin-note-input"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>支援純文字記錄 (免上傳圖片，輕量環保)</span>
            <span>{note.length} / 2000 字</span>
          </div>
        </div>

        {/* Public Option Checkbox */}
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
