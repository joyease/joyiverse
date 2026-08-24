import { initializeApp, getApps, getApp } from 'firebase/app';
import appletConfigJson from '../../firebase-applet-config.json';
const appletConfig: Record<string, string | undefined> = (appletConfigJson as Record<string, string | undefined>) || {};
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
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
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { LogEntry } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth ? auth.currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid,
      email: currentAuth?.email,
      emailVerified: currentAuth?.emailVerified,
      isAnonymous: currentAuth?.isAnonymous,
      tenantId: currentAuth?.tenantId,
      providerInfo: currentAuth?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Firebase Configuration:
// 1. If VITE_FIREBASE_* env variables are provided (e.g. for GitHub Pages or custom project build), they take highest priority.
// 2. Otherwise fall back to user's Joyiverse project configuration (joyiverse-c0601).
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDLRUdJHUZyd1rO0qnN8z0jEQlg86q9QRQ";
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "joyiverse-c0601";
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined;

export const isRealFirebaseConfigured = Boolean(
  rawApiKey &&
  !rawApiKey.includes('DummyKey') &&
  rawProjectId
);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "joyiverse-c0601.firebaseapp.com",
  projectId: rawProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "joyiverse-c0601.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "637809504937",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:637809504937:web:8484051747b92c08f66fb8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let dbInstance: Firestore | null = null;
try {
  if (firestoreDatabaseId && firestoreDatabaseId !== '(default)') {
    dbInstance = getFirestore(app, firestoreDatabaseId);
    console.log(`✅ [Firebase Firestore] Connected to named database: ${firestoreDatabaseId}`);
  } else {
    dbInstance = getFirestore(app);
    console.log(`✅ [Firebase Firestore] Connected to default database for project: ${rawProjectId}`);
  }
} catch (e) {
  console.warn("Firestore initialization error, falling back to default getFirestore:", e);
  try {
    dbInstance = getFirestore(app);
  } catch (e2) {
    console.error("Firestore final initialization error:", e2);
  }
}
export const db = dbInstance;

// Test connection on boot
export async function testConnection() {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase is offline or in mock preview environment.");
    }
    return false;
  }
}

// Initial mock seeding for rich demo experience when user enters public query or preview
const LOCAL_STORAGE_KEY = 'joyful_life_logs_v1';

export const INITIAL_SAMPLE_LOGS: LogEntry[] = [
  {
    id: 'sample-1',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '旅行',
    categoryGroup: 'outdoor',
    note: '陽明山擎天崗大草原踏青，秋高氣爽，微風吹拂帶來滿滿的好心情。',
    lat: 25.1667,
    lng: 121.5742,
    locationName: '陽明山擎天崗',
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'sample-2',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '美食',
    categoryGroup: 'outdoor',
    note: '探訪大稻埕巷弄老宅咖啡廳，手沖耶加雪菲配現烤黑糖布丁，口感滑順香濃。',
    lat: 25.0560,
    lng: 121.5100,
    locationName: '大稻埕老宅咖啡',
    isPublic: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'sample-3',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '運動',
    categoryGroup: 'outdoor',
    note: '大佳河濱公園晨跑 6 公里，沿途欣賞晨曦與水鳥，流汗感覺超舒暢！',
    lat: 25.0716,
    lng: 121.5367,
    locationName: '大佳河濱公園',
    isPublic: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'sample-4',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '閱讀',
    categoryGroup: 'life',
    note: '重讀《被討厭的勇氣》，阿德勒心理學提醒我們：所有的煩惱都來自於人際關係，找回自主權便能獲得真正的自由。',
    isPublic: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'sample-5',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '寫字',
    categoryGroup: 'life',
    note: '今日三件感恩日記：1. 喝到一杯美味的清茶 2. 順利推進系統架構開發 3. 與久違的老朋友互道問候。',
    isPublic: true,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'sample-6',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '影片',
    categoryGroup: 'life',
    note: '觀賞紀錄片《天生狂野》，大自然生命的堅韌與壯闊令人無比震撼，珍惜地球上的每份生機。',
    isPublic: true,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'sample-7',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '旅行',
    categoryGroup: 'outdoor',
    note: '象山步道夜爬，六巨石眺望台北101璀璨夜景，微風徐徐。',
    lat: 25.0270,
    lng: 121.5750,
    locationName: '象山觀景平台',
    isPublic: true,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'sample-8',
    userId: 'hermanntalk@gmail.com',
    userDisplayName: 'Hermann',
    type: '美食',
    categoryGroup: 'outdoor',
    note: '士林夜市品嚐經典藥燉排骨與生炒花枝，滿滿的在地人情味與道地香氣。',
    lat: 25.0880,
    lng: 121.5245,
    locationName: '士林夜市美食街',
    isPublic: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

export function getLocalLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLocalLogs(logs: LogEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save local logs:", e);
  }
}
