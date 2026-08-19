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

  // Try writing to Firestore
  if (db) {
    try {
      const docRef = await addDoc(collection(db, LOGS_COLLECTION), {
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
      });
      newEntry.id = docRef.id;
    } catch (error) {
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
      await updateDoc(docRef, {
        ...updates,
        updatedAt: nowIso,
      });
    } catch (error) {
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
      await deleteDoc(docRef);
    } catch (error) {
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
      const snapshot = await getDocs(q);
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
      const snapshot = await getDocs(q);
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
