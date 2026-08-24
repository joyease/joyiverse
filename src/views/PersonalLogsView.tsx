import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  BookMarked, 
  Calendar, 
  Clock, 
  Edit3, 
  Trash2, 
  Filter, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Sparkles, 
  Globe, 
  Lock, 
  Check, 
  X, 
  MapPin, 
  AlertTriangle,
  User,
  RefreshCw,
  Database
} from 'lucide-react';
import { LogEntry, LogType, TimeRangeFilter } from '../types';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories';
import { fetchUserLogs, updateLog, removeLog } from '../services/logService';
import { useAuth } from '../context/AuthContext';

interface PersonalLogsViewProps {
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const PersonalLogsView: React.FC<PersonalLogsViewProps> = ({ showToast }) => {
  const { user, openAuthModal } = useAuth();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeFilter, setTimeFilter] = useState<TimeRangeFilter>('all');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Edit State
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editNote, setEditNote] = useState<string>('');
  const [editIsPublic, setEditIsPublic] = useState<boolean>(true);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLogs = async (emailToFetch?: string, isManualSync = false) => {
    setLoading(true);
    try {
      const target = (emailToFetch || user?.email || '').trim().toLowerCase();
      const data = await fetchUserLogs(target);
      setLogs(data);
      if (isManualSync) {
        showToast(`已從雲端重新同步完成！共找到 ${data.length} 筆日誌紀錄`, 'success');
      }
    } catch (e) {
      console.error("Error loading personal logs:", e);
      if (isManualSync) {
        showToast('同步過程發生錯誤，請稍候重試', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(user?.email);
  }, [user?.email]);

  // Filter logs according to TimeRange (All, Day, Week, Month, Year)
  const filteredLogsByTime = useMemo(() => {
    const now = new Date();
    return logs.filter(log => {
      if (timeFilter === 'all') return true;
      const logDate = new Date(log.createdAt);
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
      } else if (timeFilter === 'year') {
        const oneYearAgo = new Date();
        oneYearAgo.setHours(0, 0, 0, 0);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return logDate >= oneYearAgo;
      }
      return true;
    });
  }, [logs, timeFilter]);

  // Category counts for Recharts
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {
      '旅行': 0,
      '運動': 0,
      '美食': 0,
      '閱讀': 0,
      '創作': 0,
      '視聽': 0,
    };

    filteredLogsByTime.forEach(l => {
      const normalizedType = l.type === '寫字' ? '創作' : l.type === '影片' ? '視聽' : l.type;
      if (counts[normalizedType] !== undefined) {
        counts[normalizedType] += 1;
      }
    });

    return CATEGORIES.map(cat => ({
      name: cat.name,
      type: cat.type,
      count: counts[cat.type] || 0,
      color: cat.themeColor,
    }));
  }, [filteredLogsByTime]);

  const totalPeriodCount = filteredLogsByTime.length;

  // Filtered logs list for management table
  const displayLogsList = useMemo(() => {
    if (selectedCategoryFilter === 'all') return filteredLogsByTime;
    return filteredLogsByTime.filter(l => {
      const normalizedType = l.type === '寫字' ? '創作' : l.type === '影片' ? '視聽' : l.type;
      return normalizedType === selectedCategoryFilter;
    });
  }, [filteredLogsByTime, selectedCategoryFilter]);

  // Handle Edit
  const openEditModal = (log: LogEntry) => {
    setEditingLog(log);
    setEditNote(log.note);
    setEditIsPublic(log.isPublic);
  };

  const handleSaveEdit = async () => {
    if (!editingLog || !editNote.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateLog(editingLog.id, {
        note: editNote.trim(),
        isPublic: editIsPublic,
      });
      showToast('紀錄更新成功！', 'success');
      setEditingLog(null);
      loadLogs();
    } catch (e) {
      console.error(e);
      showToast('更新失敗，請稍後重試', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async (logId: string) => {
    try {
      await removeLog(logId);
      showToast('紀錄已成功刪除', 'info');
      setDeletingId(null);
      loadLogs();
    } catch (e) {
      console.error(e);
      showToast('刪除失敗，請稍後重試', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold">
            <BookMarked className="w-3.5 h-3.5" />
            <span>個人日誌管理與統計</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            六大幸福項目
          </h1>
        </div>

        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-xs">
              <User className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-white leading-tight">{user.displayName || user.email.split('@')[0]}</span>
                <span className="text-[11px] text-slate-400 leading-tight">{user.email}</span>
              </div>
            </div>

            {/* Prominent Re-sync Button */}
            <button
              onClick={() => loadLogs(user.email, true)}
              disabled={loading}
              id="personal-logs-resync-btn"
              className="px-3.5 py-2 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="點擊從雲端 Firestore 重新獲取最新日誌資料"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '同步中...' : '重新同步'}</span>
            </button>
          </div>
        )}
      </div>

      {!user ? (
        <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex flex-col items-center text-center gap-4 py-12 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">此頁面為個人專屬日誌</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              請登入您的授權 Gmail 帳號與密碼，系統將直接載入您在雲端 Firestore 的所有個人生活紀錄與統計數據。
            </p>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            立即登入帳號
          </button>
        </div>
      ) : (
        <>

      {/* Time Dimension Switcher Tabs (全部 / 今日 / 週 / 月 / 年) */}
      <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center gap-1 max-w-lg">
        {(
          [
            { id: 'all', label: '全部 (All)' },
            { id: 'day', label: '今日 (Day)' },
            { id: 'week', label: '近 7 天' },
            { id: 'month', label: '近 30 天' },
            { id: 'year', label: '近 1 年' },
          ] as { id: TimeRangeFilter; label: string }[]
        ).map(tab => {
          const isActive = timeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              id={`logs-filter-${tab.id}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Statistics Visualization Chart Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold">
            區間累計 {totalPeriodCount} 筆
          </span>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>長條圖</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                chartType === 'pie'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>圓餅圖</span>
            </button>
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="h-64 w-full pt-2">
          {totalPeriodCount === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-1">
              <Sparkles className="w-6 h-6 text-slate-300" />
              <p className="text-xs">選定區間內尚無任何紀錄數據</p>
            </div>
          ) : chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${value} 筆`, '總次數']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} 筆`, '累計']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Management List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              詳細紀錄清單
            </h2>
            <span className="text-xs text-slate-500">
              (共 {displayLogsList.length} 筆)
            </span>
          </div>

          {/* Sub category filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400">篩選：</span>
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-xl transition-colors cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 dark:bg-rose-500 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              全部
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.type}
                onClick={() => setSelectedCategoryFilter(cat.type)}
                className={`px-2.5 py-1 text-xs rounded-xl transition-colors cursor-pointer ${
                  selectedCategoryFilter === cat.type
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {displayLogsList.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-2">
            <BookMarked className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">此篩選條件下尚無紀錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayLogsList.map((log) => {
              const displayType = log.type === '寫字' ? '創作' : log.type === '影片' ? '視聽' : log.type;
              const meta = CATEGORY_MAP[displayType] || CATEGORY_MAP['旅行'];
              const dateStr = new Date(log.createdAt).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow transition-all space-y-2"
                >
                  {/* Card Header: 標籤與操作按鈕 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${meta.themeColor}18`, color: meta.themeColor }}
                      >
                        {displayType}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
                        log.isPublic 
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {log.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{log.isPublic ? '公開' : '私有'}</span>
                      </span>
                    </div>

                    {/* Action Buttons: 編輯備註 & 刪除 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(log)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="編輯備註"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(log.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="刪除此筆紀錄"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Date line */}
                  <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>

                  {log.locationName && (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{log.locationName}</span>
                      {log.lat != null && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({log.lat.toFixed(4)}, {log.lng?.toFixed(4)})
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {log.note}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span>編輯紀錄備註 ({editingLog.type})</span>
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  備註文字內容
                </label>
                <textarea
                  rows={5}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  公開狀態 (允許他人用 Gmail 查詢)
                </span>
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingEdit ? '儲存中...' : '儲存修改'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                確定要刪除此筆紀錄？
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                刪除後該紀錄將從資料庫與個人日誌中永久移除。
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteConfirm(deletingId)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm cursor-pointer"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
