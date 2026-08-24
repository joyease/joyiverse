import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getLocalLogs, saveLocalLogs } from '../lib/firebase';
import { LogEntry, LogType } from '../types';

const LOGS_COLLECTION = 'logs';

/**
 * Timeout helper to avoid infinite hanging when network/credentials are pending
 */
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore operation timed out after ${ms / 1000}s`)), ms)
    )
  ]);
}

/**
 * Helper to normalize raw log document data from Firestore into typed LogEntry
 */
function mapDocToLogEntry(id: string, data: any): LogEntry {
  return {
    id,
    userId: (data.userId || '').trim().toLowerCase(),
    userDisplayName: data.userDisplayName || '',
    userPhotoURL: data.userPhotoURL || '',
    type: data.type === '寫字' ? '創作' : data.type === '影片' ? '視聽' : data.type,
    categoryGroup: data.categoryGroup || 'outdoor',
    note: data.note || '',
    lat: typeof data.lat === 'number' ? data.lat : null,
    lng: typeof data.lng === 'number' ? data.lng : null,
    locationName: data.locationName || null,
    isPublic: Boolean(data.isPublic),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
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
 * Get all logs for a user (query Firestore by normalized email)
 */
export async function fetchUserLogs(userEmail?: string): Promise<LogEntry[]> {
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  let cloudResults: LogEntry[] = [];
  let fetchedFromCloud = false;

  if (db) {
    try {
      // Use simple equality query (single-field query is ALWAYS indexed in Firestore out-of-the-box)
      const q = query(
        collection(db, LOGS_COLLECTION),
        where('userId', '==', normalizedEmail),
        limit(300)
      );
      const snapshot = await withTimeout(getDocs(q), 10000);
      if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
          cloudResults.push(mapDocToLogEntry(docSnap.id, docSnap.data()));
        });
      }
      fetchedFromCloud = true;
    } catch (error) {
      console.warn('Firestore fetch user logs warning, will check local cache:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  if (fetchedFromCloud) {
    // Sort in descending order by createdAt
    cloudResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Refresh local cache with latest cloud records for this user
    const otherUsersLocal = getLocalLogs().filter(
      item => (item.userId || '').toLowerCase() !== normalizedEmail
    );
    saveLocalLogs([...cloudResults, ...otherUsersLocal]);
    return cloudResults;
  }

  // Fallback to local cache only if cloud fetch failed (e.g. offline)
  const localList = getLocalLogs();
  const matchingLocal = localList
    .filter(item => (item.userId || '').toLowerCase() === normalizedEmail)
    .map(item => ({
      ...item,
      type: item.type === '寫字' ? ('創作' as LogType) : item.type === '影片' ? ('視聽' as LogType) : item.type,
    }));

  matchingLocal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return matchingLocal;
}

/**
 * Public Query: fetch logs by target Gmail, category type, within 1 month, where isPublic == true.
 * Uses a single-field Firestore query to guarantee execution without requiring manual Firestore composite indexes.
 */
export async function fetchPublicCategoryLogs(
  targetGmail: string,
  categoryType: LogType
): Promise<LogEntry[]> {
  const normalizedEmail = targetGmail.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 31);
  const oneMonthAgoMs = oneMonthAgo.getTime();

  // Alias compatibility
  const typesToQuery: string[] = [categoryType];
  if (categoryType === '創作') typesToQuery.push('寫字');
  if (categoryType === '視聽') typesToQuery.push('影片');

  if (db) {
    try {
      // Query by userId only to avoid composite index requirement
      const q = query(
        collection(db, LOGS_COLLECTION),
        where('userId', '==', normalizedEmail),
        limit(200)
      );
      const snapshot = await withTimeout(getDocs(q), 10000);
      const results: LogEntry[] = [];

      snapshot.forEach(docSnap => {
        const item = mapDocToLogEntry(docSnap.id, docSnap.data());
        const itemTime = new Date(item.createdAt).getTime();

        if (
          item.isPublic &&
          typesToQuery.includes(item.type) &&
          itemTime >= oneMonthAgoMs
        ) {
          results.push(item);
        }
      });

      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return results;
    } catch (error) {
      console.warn('Firestore public category query warning, trying local cache:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  // Fallback local query
  const localList = getLocalLogs();
  return localList
    .filter(
      item =>
        (item.userId || '').toLowerCase() === normalizedEmail &&
        typesToQuery.includes(item.type) &&
        item.isPublic &&
        new Date(item.createdAt).getTime() >= oneMonthAgoMs
    )
    .map(item => ({
      ...item,
      type: item.type === '寫字' ? ('創作' as LogType) : item.type === '影片' ? ('視聽' as LogType) : item.type,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
