import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  ExternalLink, 
  Sparkles,
  Info,
  Map as MapIcon,
  List,
  Compass,
  Activity,
  Utensils,
  BookOpen,
  PenLine,
  Film,
  Globe
} from 'lucide-react';
import L from 'leaflet';
import { LogEntry, LogType } from '../types';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories';
import { fetchPublicCategoryLogs } from '../services/logService';
import { useAuth } from '../context/AuthContext';

interface PublicQueryViewProps {
  categoryType: LogType;
  onBack: () => void;
  onSelectCategory?: (type: LogType) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Activity,
  Utensils,
  BookOpen,
  PenLine,
  Film,
};

export const PublicQueryView: React.FC<PublicQueryViewProps> = ({
  categoryType,
  onBack,
}) => {
  const { user } = useAuth();
  const currentCategory = CATEGORY_MAP[categoryType] || CATEGORIES[0];
  const Icon = ICON_MAP[currentCategory.iconName] || Compass;
  const isMapMode = currentCategory.group === 'outdoor';

  // State
  const [targetEmail, setTargetEmail] = useState<string>(user?.email || '');
  const [searchQuery, setSearchQuery] = useState<string>(user?.email || '');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Pagination / Load more for list mode
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Perform search
  const performSearch = async (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await fetchPublicCategoryLogs(clean, categoryType);
      setLogs(results);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      console.error("Public query error:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [categoryType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setTargetEmail(searchQuery.trim());
      performSearch(searchQuery.trim());
    }
  };

  // Setup Leaflet Map for outdoor category (Travel, Sport, Food)
  useEffect(() => {
    if (!isMapMode) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (loading || logs.length === 0 || !mapContainerRef.current) {
      return;
    }

    // Clean up if reinitializing container
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Determine initial center
    const validPoints = logs.filter(l => l.lat != null && l.lng != null);
    let defaultLat = 25.0330;
    let defaultLng = 121.5654;
    let defaultZoom = 12;

    if (validPoints.length > 0 && validPoints[0].lat != null && validPoints[0].lng != null) {
      defaultLat = validPoints[0].lat;
      defaultLng = validPoints[0].lng;
    }

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: false,
    });

    // Add Zoom Control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Layer (Standard OSM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Add all log markers
    const latLngBounds: [number, number][] = [];

    validPoints.forEach(entry => {
      if (entry.lat == null || entry.lng == null) return;

      const dateStr = new Date(entry.createdAt).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Custom Unified Pin with Category Color
      const pinHtml = `
        <div class="marker-pin" style="background-color: ${currentCategory.themeColor};">
          <span class="marker-inner-icon">📍</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; color: #1e293b; max-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 700; color: ${currentCategory.themeColor}; font-size: 12px; background: ${currentCategory.themeColor}15; padding: 2px 8px; border-radius: 9999px;">
              ${entry.type}
            </span>
            <span style="font-size: 11px; color: #64748b;">${dateStr}</span>
          </div>
          ${entry.locationName ? `<div style="font-weight: 600; margin-bottom: 4px; font-size: 13px;">📍 ${entry.locationName}</div>` : ''}
          <p style="margin: 4px 0 0 0; color: #334155; line-height: 1.4;">${entry.note}</p>
        </div>
      `;

      const marker = L.marker([entry.lat, entry.lng], { icon: customIcon })
        .bindPopup(popupContent, { className: 'custom-popup' });

      markersGroup.addLayer(marker);
      latLngBounds.push([entry.lat, entry.lng]);
    });

    if (latLngBounds.length > 0) {
      if (latLngBounds.length === 1) {
        map.setView(latLngBounds[0], 14);
      } else {
        map.fitBounds(latLngBounds, { padding: [40, 40], maxZoom: 15 });
      }
    }

    // Force map to compute correct dimensions
    const resizeTimer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const resizeTimer2 = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    const resizeTimer3 = setTimeout(() => {
      map.invalidateSize();
    }, 800);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer1);
      clearTimeout(resizeTimer2);
      clearTimeout(resizeTimer3);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [logs, loading, isMapMode, currentCategory]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-colors focus:outline-none cursor-pointer"
            id="public-query-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
                style={{ backgroundColor: `${currentCategory.themeColor}20`, color: currentCategory.themeColor }}
              >
                <Icon className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentCategory.name}・公開查詢頁
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentCategory.subtitle}・僅顯示近 1 個月公開紀錄
            </p>
          </div>
        </div>
      </div>

      {/* Target Gmail Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              placeholder="請輸入你或朋友的 gmail"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              id="public-search-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-rose-500 dark:hover:bg-rose-600 text-white text-xs sm:text-sm font-semibold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
            id="public-search-submit-btn"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{loading ? '查詢中' : '查詢'}</span>
          </button>
        </form>

        {user && user.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>我的帳號：</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery(user.email);
                setTargetEmail(user.email);
                performSearch(user.email);
              }}
              className="text-indigo-600 dark:text-indigo-400 font-medium underline cursor-pointer"
            >
              {user.email} (點擊快速查詢)
            </button>
          </div>
        )}
      </div>

      {/* Query Results Presentation */}
      <div className="space-y-4">
        {/* Status Header */}
        {targetEmail && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                查詢結果
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {targetEmail}
              </span>
            </div>

            <span className="text-xs text-slate-500">
              {logs.length > 0 ? `共 ${logs.length} 筆公開紀錄` : ''}
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">正在讀取公開日誌中...</p>
          </div>
        )}

        {/* Initial Prompt when not searched yet */}
        {!loading && !hasSearched && (
          <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              請輸入 Gmail 進行查詢
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              輸入您或朋友的 Gmail 地址，即可瀏覽近 1 個月公開分享的「{currentCategory.name}」足跡與隨筆。
            </p>
          </div>
        )}

        {/* Empty State / Privacy Protection */}
        {!loading && hasSearched && logs.length === 0 && (
          <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              查無近期紀錄
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              該帳號在最近 1 個月內無「{currentCategory.name}」的公開紀錄，或該用戶已將其設為私有。
            </p>
          </div>
        )}

        {/* Mode A: Outdoor Map Mode (Travel, Sport, Food) */}
        {!loading && logs.length > 0 && isMapMode && (
          <div className="space-y-4">
            {/* Map Container */}
            <div className="relative h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
              <div ref={mapContainerRef} className="w-full h-full" id="public-outdoor-map" />
              
              {/* Overlay Badge */}
              <div className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-sm text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCategory.themeColor }} />
                <span>OpenStreetMap 地圖 ({logs.filter(l => l.lat != null).length} 個打卡點)</span>
              </div>
            </div>

            {/* Accompanying Point Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {logs.map((entry) => {
                const dateStr = new Date(entry.createdAt).toLocaleDateString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 transition-colors shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className="font-bold px-2 py-0.5 rounded-full text-[11px]"
                        style={{ backgroundColor: `${currentCategory.themeColor}15`, color: currentCategory.themeColor }}
                      >
                        {entry.type}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    {entry.locationName && (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {entry.locationName}
                      </p>
                    )}

                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {entry.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode B: Life List Mode (Reading, Writing, Video) with Pagination */}
        {!loading && logs.length > 0 && !isMapMode && (
          <div className="space-y-3">
            {logs.slice(0, visibleCount).map((entry) => {
              const dateStr = new Date(entry.createdAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: `${currentCategory.themeColor}15`, color: currentCategory.themeColor }}
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                      <span className="text-[11px] sm:text-xs font-normal text-slate-400 dark:text-slate-500">
                        {entry.type} 日誌
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-normal">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight whitespace-pre-wrap">
                      {entry.note}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {visibleCount < logs.length && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-2xl transition-colors cursor-pointer"
                  id="load-more-public-logs-btn"
                >
                  載入更多紀錄 ({logs.length - visibleCount} 筆剩餘)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
