import React, { useState } from 'react';
import { 
  BookOpen, 
  PenLine, 
  Film, 
  Sparkles, 
  Globe, 
  Lock, 
  Calendar, 
  Clock, 
  BookMarked,
  Quote
} from 'lucide-react';
import { LogType, NavigationTab } from '../types';
import { CATEGORIES } from '../data/categories';
import { createLog } from '../services/logService';
import { useAuth } from '../context/AuthContext';

interface InputLogViewProps {
  onSuccessNavigate: (tab: NavigationTab) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const InputLogView: React.FC<InputLogViewProps> = ({ onSuccessNavigate, showToast }) => {
  const { user } = useAuth();
  const lifeCategories = CATEGORIES.filter(c => c.group === 'life');

  const [selectedType, setSelectedType] = useState<LogType>('閱讀');
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quick Inspiration Templates
  const templates: Record<LogType, string[]> = {
    '閱讀': [
      '書名：《》\n核心觀點：\n最受啟發的一句話：',
      '今日閱讀章節筆記：\n我的反思：',
      '摘錄金句：',
    ],
    '創作': [
      '今日三件感恩日記：\n1. \n2. \n3. ',
      '今日心情隨想與反省：',
      '創作靈感與草稿構想：',
      '未來一週目標計畫：',
    ],
    '視聽': [
      '作品名稱/影集/音頻：《》\n推薦指數：⭐⭐⭐⭐⭐\n心得短評：',
      '這部作品最觸動我的場景與台詞：',
    ],
    '寫字': [
      '今日三件感恩日記：\n1. \n2. \n3. ',
      '今日心情隨想與反省：',
      '未來一週目標計畫：',
    ],
    '影片': [
      '片名/影集：《》\n推薦指數：⭐⭐⭐⭐⭐\n心得短評：',
      '這部作品最觸動我的場景與台詞：',
    ],
    '旅行': [],
    '運動': [],
    '美食': [],
  };

  const applyTemplate = (tmpl: string) => {
    if (note && !window.confirm('是否套用模板並覆蓋現有文字？')) {
      return;
    }
    setNote(tmpl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!note.trim()) {
      showToast('請填寫隨筆心得內容', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createLog({
        userId: user.email,
        userDisplayName: user.displayName || user.email.split('@')[0],
        userPhotoURL: user.photoURL,
        type: selectedType,
        categoryGroup: 'life',
        note: note.trim(),
        isPublic,
      });

      showToast(`「${selectedType}」日記儲存成功！`, 'success');
      setNote('');
    } catch (e) {
      console.error(e);
      showToast('日記儲存時發生錯誤', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentDateTimeStr = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>靜態生活隨筆與日記</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          文字的溫度・靜心紀錄
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          紀錄閱讀思考、心情日記與觀影心得，自動帶入時間印記並妥善保存
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        {/* Category Selection (Compact Button Height) */}
        <div className="grid grid-cols-3 gap-2">
          {lifeCategories.map(cat => {
            const isSelected = selectedType === cat.type;
            return (
              <button
                type="button"
                key={cat.type}
                onClick={() => setSelectedType(cat.type)}
                className={`py-2.5 px-3 rounded-xl border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm font-bold ${
                  isSelected
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm ring-2 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                id={`input-type-${cat.type}`}
              >
                <span className="text-base">
                  {cat.type === '閱讀' ? '📖' : (cat.type === '創作' || cat.type === '寫字') ? '✍️' : '🎬'}
                </span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Timestamp Info */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <span>紀錄時間：</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{currentDateTimeStr}</span>
        </div>

        {/* Quick Inspiration Templates */}
        {templates[selectedType] && templates[selectedType].length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Quote className="w-3 h-3 text-violet-400" />
              <span>快速套用模板靈感：</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {templates[selectedType].map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {idx === 0 ? '推薦格式' : idx === 1 ? '隨想格式' : '精選摘錄'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Input (Larger text and taller area) */}
        <div className="space-y-1.5">
          <textarea
            required
            rows={8}
            placeholder={`在此輸入你的「${selectedType}」心得、摘錄佳句或心情感觸...`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-4 text-sm sm:text-base md:text-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none resize-none leading-relaxed min-h-[180px]"
            id="input-note-textarea"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>純文字筆記，支援換行排版</span>
            <span>{note.length} / 2000 字</span>
          </div>
        </div>

        {/* Public Option Checkbox */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isPublic ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400' : 'bg-slate-200 text-slate-500'}`}>
              {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                公開此紀錄
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                允許他人透過您的 Gmail 於公開查詢頁閱讀此篇近 1 個月筆記
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="sr-only peer"
              id="input-public-toggle"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-violet-500"></div>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 px-6 bg-gradient-to-r from-violet-500 to-pink-600 hover:from-violet-600 hover:to-pink-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            id="input-submit-btn"
          >
            <Sparkles className="w-4 h-4" />
            <span>{submitting ? '儲存中...' : `保存「${selectedType}」日記`}</span>
          </button>

          <button
            type="button"
            onClick={() => onSuccessNavigate('logs')}
            className="py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookMarked className="w-4 h-4 text-slate-500" />
            <span>前往個人日誌</span>
          </button>
        </div>
      </form>
    </div>
  );
};
