import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithCustomEmail: (email: string, name?: string) => void;
  logout: () => Promise<void>;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'joyful_life_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    // No preset default user
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL || undefined,
        };
        setUser(appUser);
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(appUser));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  const loginWithGoogle = async () => {
    try {
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user && result.user.email) {
          const appUser: AppUser = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || result.user.email.split('@')[0],
            photoURL: result.user.photoURL || undefined,
          };
          setUser(appUser);
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(appUser));
          setIsAuthModalOpen(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
          return;
        }
      }
    } catch (error: any) {
      console.warn("Google popup login encountered notice:", error);
    }
  };

  const loginWithCustomEmail = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    const appUser: AppUser = {
      uid: 'user-' + btoa(cleanEmail).substring(0, 12),
      email: cleanEmail,
      displayName: name?.trim() || cleanEmail.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    };
    setUser(appUser);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(appUser));
    setIsAuthModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      // ignore
    }
    setUser(null);
    localStorage.removeItem(DEMO_USER_KEY);
  };

  const requireAuth = (callback: () => void) => {
    if (user) {
      callback();
    } else {
      setPendingAction(() => callback);
      setIsAuthModalOpen(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithCustomEmail,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
