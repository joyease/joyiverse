import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 預設密碼 (若未特別在 Firebase 指定自訂密碼時使用)
export const DEFAULT_APP_PASSWORD = '1291290';

// 預設內建開放的白名單信箱
export const DEFAULT_ALLOWED_EMAILS: { email: string; name: string; defaultPassword?: string }[] = [
  { email: 'hermanntalk@gmail.com', name: 'Hermann (預設管理員)', defaultPassword: DEFAULT_APP_PASSWORD },
  { email: 'hermannhuang@gmail.com', name: 'Hermann Huang (授權帳號)', defaultPassword: DEFAULT_APP_PASSWORD },
];

export interface AllowedAccount {
  email: string;
  name?: string;
  password?: string;
}

const LOCAL_STORAGE_WHITELIST_KEY = 'joyful_allowed_accounts_cache_v3';

/**
 * 取得所有授權帳號資訊（包含密碼與名稱）
 */
export async function getAuthorizedAccounts(): Promise<AllowedAccount[]> {
  const accountMap = new Map<string, AllowedAccount>();

  // 1. 加入內建帳號
  DEFAULT_ALLOWED_EMAILS.forEach(item => {
    accountMap.set(item.email.toLowerCase(), {
      email: item.email.toLowerCase(),
      name: item.name,
      password: item.defaultPassword || DEFAULT_APP_PASSWORD
    });
  });

  // 2. 讀取本地快取
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_WHITELIST_KEY);
    if (cached) {
      const parsed: AllowedAccount[] = JSON.parse(cached);
      parsed.forEach(acc => {
        if (acc?.email) {
          accountMap.set(acc.email.toLowerCase(), {
            email: acc.email.toLowerCase(),
            name: acc.name,
            password: acc.password || DEFAULT_APP_PASSWORD
          });
        }
      });
    }
  } catch (e) {
    // ignore
  }

  // 3. 從 Firestore allowed_emails 集合拉取最新雲端設定 (含自訂 password 欄位)
  if (db) {
    try {
      const allowedEmailsCol = collection(db, 'allowed_emails');
      const snapshot = await getDocs(allowedEmailsCol);
      snapshot.forEach(docSnap => {
        const id = docSnap.id.trim().toLowerCase();
        const data = docSnap.data();
        const targetEmail = (data?.email && typeof data.email === 'string' ? data.email.trim().toLowerCase() : (id.includes('@') ? id : ''));
        
        if (targetEmail) {
          accountMap.set(targetEmail, {
            email: targetEmail,
            name: data?.name || data?.displayName || targetEmail.split('@')[0],
            // 若 Firebase 中有設定 password 欄位則使用，否則使用預設密碼 1291290
            password: data?.password ? String(data.password).trim() : (data?.pass ? String(data.pass).trim() : DEFAULT_APP_PASSWORD)
          });
        }
      });

      // 同步最新清單至快取
      const list = Array.from(accountMap.values());
      try {
        localStorage.setItem(LOCAL_STORAGE_WHITELIST_KEY, JSON.stringify(list));
      } catch (err) {
        // ignore
      }
    } catch (error) {
      console.warn('[Firebase] 讀取雲端 allowed_emails 提醒 (已自動切換內建授權名單):', error);
    }
  }

  return Array.from(accountMap.values());
}

/**
 * 驗證 Email 與 密碼 (錯誤時僅提示帳號密碼錯誤，不外洩密碼)
 */
export async function verifyEmailAndPassword(
  email: string, 
  passwordInput: string
): Promise<{ authorized: boolean; normalizedEmail: string; displayName?: string; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanEmail) {
    return { authorized: false, normalizedEmail: '', message: '請輸入有效的 Email 地址' };
  }
  if (!cleanPass) {
    return { authorized: false, normalizedEmail: cleanEmail, message: '請輸入登入密碼' };
  }

  // 1. 取得完整授權名單 (包含內建與 Firebase 雲端資料)
  const accounts = await getAuthorizedAccounts();
  const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);

  // 2. 若不在名單中，嘗試直接查詢 Firestore 單一文件 allowed_emails/{cleanEmail}
  if (!account && db) {
    try {
      const emailDocRef = doc(db, 'allowed_emails', cleanEmail);
      const docSnap = await getDoc(emailDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const expectedPass = data?.password ? String(data.password).trim() : (data?.pass ? String(data.pass).trim() : DEFAULT_APP_PASSWORD);
        if (cleanPass === expectedPass) {
          return {
            authorized: true,
            normalizedEmail: cleanEmail,
            displayName: data?.name || data?.displayName || cleanEmail.split('@')[0]
          };
        } else {
          return {
            authorized: false,
            normalizedEmail: cleanEmail,
            message: '登入失敗：密碼不正確，請重新輸入。'
          };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (!account) {
    return {
      authorized: false,
      normalizedEmail: cleanEmail,
      message: `登入失敗：信箱「${cleanEmail}」尚未在授權名單中。`
    };
  }

  // 3. 比對密碼
  const expectedPassword = (account.password || DEFAULT_APP_PASSWORD).trim();
  if (cleanPass !== expectedPassword) {
    return {
      authorized: false,
      normalizedEmail: cleanEmail,
      message: '登入失敗：密碼不正確，請重新確認後再試。'
    };
  }

  return {
    authorized: true,
    normalizedEmail: cleanEmail,
    displayName: account.name
  };
}
