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
  const newEntry: LogEntry = {
    ...data,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Try writing to Firestore if real db is configured
  let syncedToCloud = false;
  if (db) {
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, LOGS_COLLECTION), {
          userId: newEntry.userId,
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
      newEntry.id = docRef.id;
      syncedToCloud = true;
      console.log('✅ [Firebase Firestore] 成功寫入雲端資料庫！Document ID:', docRef.id);
    } catch (error: any) {
      console.error('❌ [Firebase Firestore 寫入失敗]:', error?.code, error?.message || error);
      handleFirestoreError(error, OperationType.CREATE, LOGS_COLLECTION);
    }
  }

  // Always sync local store for instant UI feedback
  const localList = getLocalLogs();
  saveLocalLogs([newEntry, ...localList]);
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
export async function fetchUserLogs(userEmail: string): Promise<LogEntry[]> {
  if (!userEmail) return [];

  if (db) {
    try {
      const q = query(
        collection(db, LOGS_COLLECTION),
        where('userId', '==', userEmail),
        limit(200)
      );
      const snapshot = await withTimeout(getDocs(q), 5000);
      if (!snapshot.empty) {
        const results: LogEntry[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          results.push({
            id: docSnap.id,
            userId: data.userId,
            userDisplayName: data.userDisplayName,
            userPhotoURL: data.userPhotoURL,
            type: data.type,
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
        // Sort descending by createdAt
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
      }
    } catch (error) {
      console.warn('Firestore fetch user logs warning:', error);
      handleFirestoreError(error, OperationType.LIST, LOGS_COLLECTION);
    }
  }

  // Fallback to local logs matching this user email
  const localList = getLocalLogs();
  return localList
    .filter(item => item.userId.toLowerCase() === userEmail.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const oneMonthAgoIso = oneMonthAgo.toISOString();

  if (db) {
    try {
      const q = query(
        collection(db, LOGS_COLLECTION),
        where('userId', '==', normalizedEmail),
        where('type', '==', categoryType),
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
              type: data.type,
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
        item.type === categoryType &&
        item.isPublic &&
        new Date(item.createdAt).getTime() >= oneMonthAgo.getTime()
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
