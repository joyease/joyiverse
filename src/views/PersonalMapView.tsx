import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Map as MapIcon, 
  MapPin, 
  Compass, 
  Activity, 
  Utensils, 
  Filter, 
  Clock, 
  Navigation,
  Calendar,
  Lock,
  User,
  RefreshCw
} from 'lucide-react';
import { LogEntry, LogType } from '../types';
import { CATEGORY_MAP } from '../data/categories';
import { fetchUserLogs } from '../services/logService';
import { useAuth } from '../context/AuthContext';

type FilterType = 'all' | '旅行' | '運動' | '美食' | '閱讀' | '創作' | '視聽';
type MapTimeFilter = 'all' | 'month' | 'week' | 'day';

interface PersonalMapViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const PersonalMapView: React.FC<PersonalMapViewProps> = ({ showToast }) => {
  const { user, openAuthModal } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  
  // Default to past 7 days to reduce initial browsing load
  const [timeFilter, setTimeFilter] = useState<MapTimeFilter>('week');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Map DOM and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const loadData = async (emailToFetch?: string, isManualSync = false) => {
    setLoading(true);
    setSyncFeedback(null);
    try {
      const target = (emailToFetch || user?.email || '').trim().toLowerCase();
      const data = await fetchUserLogs(target);
      setLogs(data);
      const geoCount = data.filter(d => d.lat != null && d.lng != null).length;
      if (isManualSync) {
        const msg = `已從雲端同步！共載入 ${data.length} 筆資料 (含 ${geoCount} 個地圖打卡點)`;
        setSyncFeedback(msg);
        showToast?.(msg, 'success');
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    } catch (e) {
      console.error("Error loading user map logs:", e);
      if (isManualSync) {
        const errMsg = '同步失敗，請檢查網路連線後重試';
        setSyncFeedback(errMsg);
        showToast?.(errMsg, 'error');
        setTimeout(() => setSyncFeedback(null), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(user?.email);
  }, [user?.email]);

  // Filter logs with valid lat/lng and matching Time + Category filters
  const filteredGeoLogs = useMemo(() => {
    return logs.filter(item => {
      if (item.lat == null || item.lng == null) return false;

      // 1. Category filter
      if (filterType !== 'all') {
        const normalizedType = item.type === '寫字' ? '創作' : item.type === '影片' ? '視聽' : item.type;
        if (normalizedType !== filterType) return false;
      }

      // 2. Time filter
      const logDate = new Date(item.createdAt);
      if (isNaN(logDate.getTime())) return true;

      if (timeFilter === 'day') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return logDate >= startOfDay;
      } else if (timeFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setHours(0, 0, 0, 0);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return logDate >= oneWeekAgo;
      } else if (timeFilter === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setHours(0, 0, 0, 0);
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 31);
        return logDate >= oneMonthAgo;
      }

      return true; // 'all'
    });
  }, [logs, filterType, timeFilter]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center (Taipei, or from latest check-in point)
    let centerLat = 25.0330;
    let centerLng = 121.5654;
    let zoomLevel = 13;

    if (filteredGeoLogs.length > 0 && filteredGeoLogs[0].lat != null && filteredGeoLogs[0].lng != null) {
      centerLat = filteredGeoLogs[0].lat;
      centerLng = filteredGeoLogs[0].lng;
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: zoomLevel,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Force map to compute correct dimensions
    const resizeTimer1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const resizeTimer2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer1);
      clearTimeout(resizeTimer2);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Boot once

  // Update Markers Layer on filtered logs change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const map = mapInstanceRef.current;
    markersLayerRef.current.clearLayers();

    filteredGeoLogs.forEach(entry => {
      if (entry.lat == null || entry.lng == null) return;
      const meta = CATEGORY_MAP[entry.type] || CATEGORY_MAP['旅行'];
      const dateStr = new Date(entry.createdAt).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const pinHtml = `
        <div class="marker-pin" style="background-color: ${meta.themeColor};">
          <span class="marker-inner-icon">${entry.type === '旅行' ? '🧭' : entry.type === '運動' ? '🏃' : '🍜'}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-user-pin',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; color: #0f172a; max-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 700; color: ${meta.themeColor}; font-size: 11px; background: ${meta.themeColor}18; padding: 2px 8px; border-radius: 9999px;">
              ${entry.type}
            </span>
            <span style="font-size: 11px; color: #64748b;">${dateStr}</span>
          </div>
          ${entry.locationName ? `<div style="font-weight: 600; margin-bottom: 3px; font-size: 13px;">📍 ${entry.locationName}</div>` : ''}
          <p style="margin: 4px 0 0 0; color: #334155; line-height: 1.4;">${entry.note}</p>
          <div style="margin-top: 6px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
            <span>${entry.isPublic ? '🌐 公開' : '🔒 私有'}</span>
            <span>${entry.lat.toFixed(4)}, ${entry.lng.toFixed(4)}</span>
          </div>
        </div>
      `;

      const marker = L.marker([entry.lat, entry.lng], { icon: customIcon })
        .bindPopup(popupContent, { className: 'custom-popup' });

      markersLayerRef.current?.addLayer(marker);
    });

    // Adjust view to fit bounds if points exist
    if (filteredGeoLogs.length > 0) {
      const bounds = filteredGeoLogs.map(l => [l.lat!, l.lng!] as [number, number]);
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [filteredGeoLogs]);

  const recentPoint = filteredGeoLogs[0];

  const timeFilterOptions: { key: MapTimeFilter; label: string }[] = [
    { key: 'week', label: '近7天' },
    { key: 'day', label: '今天' },
    { key: 'month', label: '近30天' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in duration-200">
      {/* Header & Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <MapIcon className="w-3.5 h-3.5" />
            <span>個人專屬足跡地圖</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            我的地理軌跡・打卡點位
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            僅本人可見所有個人打卡點，可依時間與類別篩選打卡標記
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
              <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-white leading-tight">{user.displayName || user.email.split('@')[0]}</span>
                <span className="text-[11px] text-slate-400 leading-tight">{user.email}</span>
              </div>
            </div>

            {/* Prominent Re-sync Button */}
            <button
              onClick={() => loadData(user.email, true)}
              disabled={loading}
              id="personal-map-resync-btn"
              className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="點擊從雲端 Firestore 重新獲取最新足跡打卡資料"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '同步中...' : '重新同步'}</span>
            </button>
          </div>
        )}
      </div>

      {syncFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {!user ? (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex flex-col items-center text-center gap-4 py-12 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">此頁面為個人專屬足跡地圖</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              請登入您的授權 Gmail 帳號與密碼，系統將直接載入您在雲端 Firestore 的個人打卡與地圖足跡。
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            立即登入帳號
          </button>
        </div>
      ) : (
        <>
      {/* Filter Controls: Time Range & Category */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 1. Time Range Filters: 全部 / 近30天 / 近7天 / 今天 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>時間：</span>
          </span>
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
            {timeFilterOptions.map(opt => {
              const isSelected = timeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setTimeFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  id={`map-time-filter-${opt.key}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>類別：</span>
          </span>
          {(['all', '旅行', '運動', '美食', '閱讀', '創作', '視聽'] as FilterType[]).map((ft) => {
            const isSelected = filterType === ft;
            return (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                id={`map-cat-filter-${ft}`}
              >
                {ft === 'all' ? '全部足跡' : ft}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Visual Container */}
      <div className="relative h-[460px] sm:h-[540px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
        <div ref={mapContainerRef} className="w-full h-full" id="personal-footprint-map" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-5 left-5 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-lg text-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>足跡點位</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
              {filteredGeoLogs.length} 個點位
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>目前範圍：{timeFilterOptions.find(o => o.key === timeFilter)?.label}</span>
          </div>

          {recentPoint && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">最新打卡：</span>
              <span>{recentPoint.locationName || `${recentPoint.lat?.toFixed(2)}, ${recentPoint.lng?.toFixed(2)}`}</span>
            </div>
          )}
        </div>

        {/* Empty Overlay prompt if 0 points */}
        {!loading && filteredGeoLogs.length === 0 && (
          <div className="absolute inset-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-6 text-center">
            <div className="max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                在此時間範圍內無打卡點
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                目前篩選「{timeFilterOptions.find(o => o.key === timeFilter)?.label}」無足跡紀錄，可嘗試切換至「全部」或前往「打卡」標籤頁新增打卡點。
              </p>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

