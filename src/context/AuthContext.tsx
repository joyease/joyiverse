import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppUser } from '../types';
import { 
  AllowedAccount,
  getAuthorizedAccounts, 
  verifyEmailAndPassword 
} from '../services/whitelistService';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  allowedAccountsList: AllowedAccount[];
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithPassword: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  requireAuth: (callback: () => void) => void;
  refreshAllowedList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_KEY = 'joyful_life_current_user_v4';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 預設為未登入狀態 (null)
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [allowedAccountsList, setAllowedAccountsList] = useState<AllowedAccount[]>([]);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const refreshAllowedList = useCallback(async () => {
    try {
      const list = await getAuthorizedAccounts();
      setAllowedAccountsList(list);
    } catch (e) {
      console.warn('Failed to refresh allowed accounts:', e);
    }
  }, []);

  useEffect(() => {
    refreshAllowedList().finally(() => setLoading(false));
  }, [refreshAllowedList]);

  const openAuthModal = () => {
    refreshAllowedList();
    setIsAuthModalOpen(true);
  };
  
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  const loginWithPassword = async (
    email: string, 
    passwordInput: string,
    displayName?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const result = await verifyEmailAndPassword(email, passwordInput);
    if (!result.authorized) {
      return { success: false, message: result.message };
    }

    const cleanEmail = result.normalizedEmail;
    const name = displayName?.trim() || result.displayName || cleanEmail.split('@')[0];

    const appUser: AppUser = {
      uid: 'user-' + btoa(cleanEmail).substring(0, 12),
      email: cleanEmail,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    };

    setUser(appUser);
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(appUser));
      localStorage.setItem('joyful_last_active_email', cleanEmail);
    } catch (e) {
      // ignore
    }

    setIsAuthModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }

    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    try {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } catch (e) {
      // ignore
    }
  };

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      setPendingAction(() => callback);
      openAuthModal();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        allowedAccountsList,
        openAuthModal,
        closeAuthModal,
        loginWithPassword,
        logout,
        requireAuth,
        refreshAllowedList,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
