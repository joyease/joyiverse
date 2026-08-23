import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getLocalLogs, saveLocalLogs } from '../lib/firebase';
import { LogEntry, LogType, CategoryGroup } from '../types';

const LOGS_COLLECTION = 'logs';

/**
 * Timeout helper to avoid infinite hanging when network/credentials are pending
 */
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out after 5s')), ms)
    )
  ]);
}

/**
 * Add a new log entry to Firestore (with local persistence sync)
 */
export async function createLog(data: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LogEntry> {
  const nowIso = new Date().toISOString();
  const normalizedEmail = (data.userId || '').trim().toLowerCase();
  const newEntry: LogEntry = {
    ...data,
    userId: normalizedEmail,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Always sync local store for instant UI feedback
  const localList = getLocalLogs();
  saveLocalLogs([newEntry, ...localList]);

  // Try writing to Firestore if real db is configured
  if (db) {
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, LOGS_COLLECTION), {
          userId: normalizedEmail,
          userDisplayName: newEntry.userDisplayName || '',
          userPhotoURL: newEntry.userPhotoURL || '',
          type: newEntry.type,
          categoryGroup: newEntry.categoryGroup,
          note: newEntry.note,
          lat: newEntry.lat !== undefined ? newEntry.lat : null,
          lng: newEntry.lng !== undefined ? newEntry.lng : null,
          locationName: newEntry.locationName || null,
          isPublic: newEntry.isPublic,
          createdAt: nowIso,
          updatedAt: nowIso,
        }),
        5000
      );
      
      // Update local entry id if Firestore assigned a real ID
      if (docRef?.id) {
        newEntry.id = docRef.id;
        const currentLocal = getLocalLogs();
        const updatedLocal = currentLocal.map(item => 
          item.createdAt === nowIso && item.userId === normalizedEmail ? { ...item, id: docRef.id } : item
        );
        saveLocalLogs(updatedLocal);
      }
      console.log('✅ [Firebase Firestore] 成功寫入雲端資料庫！Document ID:', docRef.id);
    } catch (error: any) {
      console.error('❌ [Firebase Firestore 寫入失敗]:', error?.code, error?.message || error);
      handleFirestoreError(error, OperationType.CREATE, LOGS_COLLECTION);
    }
  }

  return newEntry;
}

/**
 * Update an existing log's note & public status
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
        5000
      );
    } catch (error) {
      console.warn('Firestore update warning:', error);
      handleFirestoreError(error, OperationType.UPDATE, `${LOGS_COLLECTION}/${logId}`);
    }
  }

  // Update local
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
 * Delete a log
 */
export async function removeLog(logId: string): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, LOGS_COLLECTION, logId);
      await withTimeout(deleteDoc(docRef), 5000);
    } catch (error) {
      console.warn('Firestore delete warning:', error);
      handleFirestoreError(error, OperationType.DELETE, `${LOGS_COLLECTION}/${logId}`);
    }
  }

  // Delete local
  const localList = getLocalLogs();
  saveLocalLogs(localList.filter(item => item.id !== logId));
}

/**
 * Get all logs for the current user
 */
export async function fetchUserLogs(userEmail?: string): Promise<LogEntry[]> {
  const normalizedEmail = (userEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return [];
  }

  const localList = getLocalLogs();
  let cloudResults: LogEntry[] = [];

  if (db) {
    try {
      const emailVariants = Array.from(new Set([userEmail, normalizedEmail].filter(Boolean)));
      const q = query(
        collection(db, LOGS_COLLECTION),
        where('userId', 'in', emailVariants),
        limit(200)
      );
      const snapshot = await withTimeout(getDocs(q), 5000);
      if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          cloudResults.push({
            id: docSnap.id,
            userId: data.userId,
            userDisplayName: data.userDisplayName,
            userPhotoURL: data.userPhotoURL,
            type: data.type === '寫字' ? '創作' : data.type === '影片' ? '視聽' : data.type,
            categoryGroup: data.categoryGroup,
            note: data.note,
            lat: data.lat,
            lng: data.lng,
            locationName: data.locationName,
            isPublic: data.isPublic,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
      }
    } catch (error) {
      console.warn('Firestore fetch user logs warning:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  // Get matching local logs
  const matchingLocal = localList.filter(
    item => (item.userId || '').toLowerCase() === normalizedEmail
  );

  // Merge cloud & local results (avoiding duplicates)
  const cloudIds = new Set(cloudResults.map(r => r.id));
  const combined = [...cloudResults];
  for (const localItem of matchingLocal) {
    if (!cloudIds.has(localItem.id)) {
      combined.push({
        ...localItem,
        type: localItem.type === '寫字' ? '創作' : localItem.type === '影片' ? '視聽' : localItem.type,
      });
    }
  }

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return combined;
}

/**
 * Public Query: fetch logs by target Gmail, category type, within 1 month, where isPublic == true
 */
export async function fetchPublicCategoryLogs(
  targetGmail: string,
  categoryType: LogType
): Promise<LogEntry[]> {
  const normalizedEmail = targetGmail.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 31);

  // 查詢類別別名 (例：查詢「創作」同時相容歷史資料「寫字」；查詢「視聽」同時相容「影片」)
  const typesToQuery: LogType[] = [categoryType];
  if (categoryType === '創作') typesToQuery.push('寫字');
  if (categoryType === '視聽') typesToQuery.push('影片');

  if (db) {
    try {
      const q = query(
        collection(db, LOGS_COLLECTION),
        where('userId', '==', normalizedEmail),
        where('type', 'in', typesToQuery),
        where('isPublic', '==', true),
        limit(50)
      );
      const snapshot = await withTimeout(getDocs(q), 5000);
      if (!snapshot.empty) {
        const results: LogEntry[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (new Date(data.createdAt).getTime() >= oneMonthAgo.getTime()) {
            results.push({
              id: docSnap.id,
              userId: data.userId,
              userDisplayName: data.userDisplayName,
              userPhotoURL: data.userPhotoURL,
              type: data.type === '寫字' ? '創作' : data.type === '影片' ? '視聽' : data.type,
              categoryGroup: data.categoryGroup,
              note: data.note,
              lat: data.lat,
              lng: data.lng,
              locationName: data.locationName,
              isPublic: data.isPublic,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          }
        });
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
      }
    } catch (error) {
      console.warn('Firestore public query warning:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  // Fallback local query
  const localList = getLocalLogs();
  return localList
    .filter(
      item =>
        item.userId.toLowerCase() === normalizedEmail &&
        typesToQuery.includes(item.type) &&
        item.isPublic &&
        new Date(item.createdAt).getTime() >= oneMonthAgo.getTime()
    )
    .map(item => ({
      ...item,
      type: item.type === '寫字' ? ('創作' as LogType) : item.type === '影片' ? ('視聽' as LogType) : item.type,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
