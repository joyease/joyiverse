import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getLocalLogs, saveLocalLogs } from '../lib/firebase';
import { LogEntry, LogType } from '../types';

const LOGS_COLLECTION = 'logs';

/**
 * Timeout helper to avoid infinite hanging when network/credentials are pending
 */
function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore operation timed out after ${ms / 1000}s`)), ms)
    )
  ]);
}

/**
 * Parse any date/timestamp into a clean ISO string
 */
function parseDateToIso(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
  }
  // Firestore Timestamp with toDate()
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch (e) {
      // ignore
    }
  }
  // Firestore Timestamp with seconds / _seconds
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val._seconds === 'number') {
    return new Date(val._seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Parse coordinate to number or null
 */
function parseCoordinate(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const num = parseFloat(val.trim());
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Normalize log type name to standard 6 categories
 */
function normalizeLogType(raw: any): LogType {
  const str = String(raw || '').trim();
  const lower = str.toLowerCase();

  if (str === '寫字' || lower === 'write' || lower === 'writing' || str === '創作' || lower === 'create' || lower === 'art') return '創作';
  if (str === '影片' || lower === 'video' || lower === 'movie' || str === '視聽' || lower === 'audio' || lower === 'music' || lower === 'media') return '視聽';
  if (str === '旅行' || lower === 'travel' || lower === 'trip' || lower === 'tour') return '旅行';
  if (str === '運動' || lower === 'sport' || lower === 'sports' || lower === 'exercise' || lower === 'gym') return '運動';
  if (str === '美食' || lower === 'food' || lower === 'dining' || lower === 'eat' || lower === 'restaurant') return '美食';
  if (str === '閱讀' || lower === 'read' || lower === 'reading' || lower === 'book') return '閱讀';
  
  if (str === '旅行' || str === '運動' || str === '美食' || str === '閱讀' || str === '創作' || str === '視聽') {
    return str as LogType;
  }
  return '旅行';
}

/**
 * Helper to normalize raw log document data from Firestore into typed LogEntry
 */
function mapDocToLogEntry(id: string, data: any): LogEntry {
  const normalizedType = normalizeLogType(data.type);
  const group = data.categoryGroup || (['旅行', '運動', '美食'].includes(normalizedType) ? 'outdoor' : 'life');

  const lat =
    parseCoordinate(data.lat) ??
    parseCoordinate(data.latitude) ??
    parseCoordinate(data.location?.lat) ??
    parseCoordinate(data.location?.latitude) ??
    parseCoordinate(data.geo?.lat);

  const lng =
    parseCoordinate(data.lng) ??
    parseCoordinate(data.longitude) ??
    parseCoordinate(data.location?.lng) ??
    parseCoordinate(data.location?.longitude) ??
    parseCoordinate(data.geo?.lng);

  const createdAt = parseDateToIso(data.createdAt || data.timestamp || data.time || data.created_at);
  const updatedAt = parseDateToIso(data.updatedAt || data.updated_at || createdAt);

  // If isPublic is undefined or null, default to true
  const isPublic = data.isPublic !== undefined && data.isPublic !== null ? Boolean(data.isPublic) : true;

  return {
    id,
    userId: (data.userId || data.user_id || data.email || '').trim().toLowerCase(),
    userDisplayName: data.userDisplayName || data.displayName || data.userName || '',
    userPhotoURL: data.userPhotoURL || data.photoURL || '',
    type: normalizedType,
    categoryGroup: group,
    note: data.note || data.content || data.title || data.message || '',
    lat,
    lng,
    locationName: data.locationName || data.location_name || data.placeName || data.address || null,
    isPublic,
    createdAt,
    updatedAt,
  };
}

/**
 * Add a new log entry to Firestore (with local persistence sync)
 */
export async function createLog(data: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LogEntry> {
  const nowIso = new Date().toISOString();
  const normalizedEmail = (data.userId || '').trim().toLowerCase();
  
  const payloadToFirestore = {
    userId: normalizedEmail,
    userDisplayName: data.userDisplayName || normalizedEmail.split('@')[0],
    userPhotoURL: data.userPhotoURL || '',
    type: data.type,
    categoryGroup: data.categoryGroup,
    note: data.note.trim(),
    lat: typeof data.lat === 'number' ? data.lat : null,
    lng: typeof data.lng === 'number' ? data.lng : null,
    locationName: data.locationName || null,
    isPublic: Boolean(data.isPublic),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const newEntry: LogEntry = {
    ...payloadToFirestore,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
  };

  // Write to Firestore as single source of truth
  if (db) {
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, LOGS_COLLECTION), payloadToFirestore),
        10000
      );
      
      if (docRef?.id) {
        newEntry.id = docRef.id;
        console.log('✅ [Firebase Firestore] 成功寫入雲端資料庫！Document ID:', docRef.id);
      }
    } catch (error: any) {
      console.error('❌ [Firebase Firestore 寫入失敗]:', error?.code, error?.message || error);
      handleFirestoreError(error, OperationType.CREATE, LOGS_COLLECTION);
    }
  }

  // Update local cache
  const localList = getLocalLogs();
  saveLocalLogs([newEntry, ...localList.filter(item => item.id !== newEntry.id)]);

  return newEntry;
}

/**
 * Update an existing log's note & public status in Firestore and local cache
 */
export async function updateLog(
  logId: string,
  updates: { note?: string; isPublic?: boolean }
): Promise<void> {
  const nowIso = new Date().toISOString();

  if (db) {
    try {
      const docRef = doc(db, LOGS_COLLECTION, logId);
      await withTimeout(
        updateDoc(docRef, {
          ...updates,
          updatedAt: nowIso,
        }),
        8000
      );
      console.log('✅ [Firebase Firestore] 成功更新文件:', logId);
    } catch (error) {
      console.warn('Firestore update warning:', error);
      handleFirestoreError(error, OperationType.UPDATE, `${LOGS_COLLECTION}/${logId}`);
    }
  }

  // Update local cache
  const localList = getLocalLogs();
  const updated = localList.map(item => {
    if (item.id === logId) {
      return {
        ...item,
        ...updates,
        updatedAt: nowIso,
      };
    }
    return item;
  });
  saveLocalLogs(updated);
}

/**
 * Delete a log from Firestore and local cache
 */
export async function removeLog(logId: string): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, LOGS_COLLECTION, logId);
      await withTimeout(deleteDoc(docRef), 8000);
      console.log('✅ [Firebase Firestore] 成功刪除文件:', logId);
    } catch (error) {
      console.warn('Firestore delete warning:', error);
      handleFirestoreError(error, OperationType.DELETE, `${LOGS_COLLECTION}/${logId}`);
    }
  }

  // Delete from local cache
  const localList = getLocalLogs();
  saveLocalLogs(localList.filter(item => item.id !== logId));
}

/**
 * Get all logs for the current user and database
 */
export async function fetchUserLogs(_userEmail?: string): Promise<LogEntry[]> {
  let cloudResults: LogEntry[] = [];
  let fetchedFromCloud = false;

  if (db) {
    try {
      // Query collection up to 1000 logs
      const q = query(
        collection(db, LOGS_COLLECTION),
        limit(1000)
      );
      const snapshot = await withTimeout(getDocs(q), 12000);
      if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
          cloudResults.push(mapDocToLogEntry(docSnap.id, docSnap.data()));
        });
      }
      fetchedFromCloud = true;
      console.log(`✅ [Firestore 雲端同步] 成功自 Firestore 取得 ${cloudResults.length} 筆日誌紀錄`);
    } catch (error) {
      console.warn('Firestore fetch user logs warning, falling back to local cache:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  if (fetchedFromCloud) {
    // Sort in descending order by createdAt
    cloudResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveLocalLogs(cloudResults);
    return cloudResults;
  }

  // Fallback to local cache only if cloud fetch failed (e.g. offline)
  const localList = getLocalLogs();
  const matchingLocal = localList
    .map(item => mapDocToLogEntry(item.id, item));

  matchingLocal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matchingLocal;
}

/**
 * Public Query: fetch logs by category type and optional target search query.
 * Can be accessed without login.
 */
export async function fetchPublicCategoryLogs(
  targetSearch?: string,
  categoryType?: LogType
): Promise<LogEntry[]> {
  const queryTerm = (targetSearch || '').trim().toLowerCase();
  const normalizedCategory = categoryType ? normalizeLogType(categoryType) : undefined;

  let allLogs: LogEntry[] = [];

  if (db) {
    try {
      const q = query(
        collection(db, LOGS_COLLECTION),
        limit(1000)
      );
      const snapshot = await withTimeout(getDocs(q), 12000);
      if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
          allLogs.push(mapDocToLogEntry(docSnap.id, docSnap.data()));
        });
      }
    } catch (error) {
      console.warn('Firestore public category query warning, trying local cache:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  if (allLogs.length === 0) {
    allLogs = getLocalLogs().map(item => mapDocToLogEntry(item.id, item));
  }

  // Filter logs
  const filtered = allLogs.filter(item => {
    // 1. Category Match
    if (normalizedCategory && item.type !== normalizedCategory) {
      return false;
    }

    // 2. Target Term Filter (if provided by user)
    if (queryTerm) {
      const uId = (item.userId || '').toLowerCase();
      const uName = (item.userDisplayName || '').toLowerCase();
      const uNote = (item.note || '').toLowerCase();
      const uLoc = (item.locationName || '').toLowerCase();
      const matches =
        uId.includes(queryTerm) ||
        uName.includes(queryTerm) ||
        uNote.includes(queryTerm) ||
        uLoc.includes(queryTerm);
      if (!matches) return false;
    }

    return true;
  });

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return filtered;
}
