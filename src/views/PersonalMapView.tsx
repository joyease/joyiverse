import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { 
  Map as MapIcon, 
  Flame, 
  MapPin, 
  Compass, 
  Activity, 
  Utensils, 
  Layers, 
  Filter, 
  RefreshCw, 
  Clock, 
  Navigation,
  Sparkles,
  Info
} from 'lucide-react';
import { LogEntry, LogType } from '../types';
import { CATEGORY_MAP } from '../data/categories';
import { fetchUserLogs } from '../services/logService';
import { useAuth } from '../context/AuthContext';

type FilterType = 'all' | '旅行' | '運動' | '美食';

export const PersonalMapView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  // Layer toggles
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // Map DOM and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserLogs(user.email);
      setLogs(data);
    } catch (e) {
      console.error("Error loading user map logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filter logs with valid lat/lng
  const filteredGeoLogs = logs.filter(item => {
    if (item.lat == null || item.lng == null) return false;
    if (filterType === 'all') return item.categoryGroup === 'outdoor';
    return item.type === filterType;
  });

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

    // OpenStreetMap Layer (Standard OSM, identical to peak100)
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

  // Update Layers (Markers & Heatmap) on data/filter/toggle change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Manage Markers Layer
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      if (showMarkers) {
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
      }
    }

    // 2. Manage Heatmap Layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (showHeatmap && filteredGeoLogs.length > 0) {
      const heatPoints = filteredGeoLogs.map(item => [item.lat!, item.lng!, 0.8]);
      try {
        // Leaflet.heat layer with Blue -> Green -> Yellow -> Red gradient
        const heat = (L as any).heatLayer(heatPoints, {
          radius: 30,
          blur: 20,
          maxZoom: 16,
          max: 1.0,
          gradient: {
            0.2: '#3b82f6', // blue
            0.4: '#10b981', // green
            0.6: '#eab308', // yellow
            0.8: '#f97316', // orange
            1.0: '#ef4444'  // red
          }
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      } catch (e) {
        console.warn("Heatmap layer warning:", e);
      }
    }

    // Adjust view to fit bounds if points exist
    if (filteredGeoLogs.length > 0) {
      const bounds = filteredGeoLogs.map(l => [l.lat!, l.lng!] as [number, number]);
      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [filteredGeoLogs, showMarkers, showHeatmap]);

  const recentPoint = filteredGeoLogs[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-in fade-in duration-200">
      {/* Header & Stats bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <MapIcon className="w-3.5 h-3.5" />
            <span>個人專屬足跡與熱力圖</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            我的地理軌跡・熱力分佈
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            僅本人可見所有個人打卡點，支援熱力圖視覺化與類別篩選
          </p>
        </div>

        {/* Action / Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">重新整理</span>
          </button>
        </div>
      </div>

      {/* Filter & Layer Controls */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>類別：</span>
          </span>
          {(['all', '旅行', '運動', '美食'] as FilterType[]).map((ft) => {
            const isSelected = filterType === ft;
            return (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ft === 'all' ? '全部戶外' : ft}
              </button>
            );
          })}
        </div>

        {/* Visual Layer Toggles */}
        <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>圖層：</span>
          </span>

          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showMarkers
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 ring-1 ring-sky-500/30 font-bold'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>地標標記</span>
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              showHeatmap
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-500/30 font-bold'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>熱力分佈圖</span>
          </button>
        </div>
      </div>

      {/* Main Map Visual Container */}
      <div className="relative h-[460px] sm:h-[540px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
        <div ref={mapContainerRef} className="w-full h-full" id="personal-footprint-map" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-5 left-5 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-lg text-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
            <span>足跡統計</span>
            <span className="text-[11px] text-slate-500">{filteredGeoLogs.length} 個點位</span>
          </div>

          {/* Heatmap color gradient bar */}
          {showHeatmap && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>低頻率 (藍)</span>
                <span>高密集 (紅)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-400 to-rose-500" />
            </div>
          )}

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
                尚未記錄任何 GPS 打卡點
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                前往「打卡」標籤頁，啟用定位功能即可將旅行、運動與美食足跡記錄至個人熱力地圖中。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
