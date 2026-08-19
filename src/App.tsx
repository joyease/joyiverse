import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { HomeView } from './views/HomeView';
import { PublicQueryView } from './views/PublicQueryView';
import { CheckInView } from './views/CheckInView';
import { InputLogView } from './views/InputLogView';
import { PersonalMapView } from './views/PersonalMapView';
import { PersonalLogsView } from './views/PersonalLogsView';
import { NavigationTab, LogType } from './types';

const MainContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [publicQueryCategory, setPublicQueryCategory] = useState<LogType | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Navigations
  const handleSelectCategoryFromHome = (catType: LogType) => {
    setPublicQueryCategory(catType);
  };

  const handleBackToHome = () => {
    setPublicQueryCategory(null);
    setCurrentTab('home');
  };

  const handleSelectTab = (tab: NavigationTab) => {
    setPublicQueryCategory(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24">
      {/* Toast System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Header */}
      <Header onNavigateHome={handleBackToHome} />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {publicQueryCategory ? (
          <PublicQueryView
            categoryType={publicQueryCategory}
            onBack={handleBackToHome}
            onSelectCategory={(cat) => setPublicQueryCategory(cat)}
          />
        ) : currentTab === 'home' ? (
          <HomeView
            onSelectCategory={handleSelectCategoryFromHome}
            onNavigateTab={handleSelectTab}
          />
        ) : currentTab === 'checkin' ? (
          <CheckInView
            onSuccessNavigate={handleSelectTab}
            showToast={showToast}
          />
        ) : currentTab === 'map' ? (
          <PersonalMapView />
        ) : currentTab === 'input' ? (
          <InputLogView
            onSuccessNavigate={handleSelectTab}
            showToast={showToast}
          />
        ) : currentTab === 'logs' ? (
          <PersonalLogsView showToast={showToast} />
        ) : null}
      </main>

      {/* Login / Auth Modal */}
      <AuthModal />

      {/* 5-Tab Bottom Navigation Footer */}
      <Footer currentTab={publicQueryCategory ? 'home' : currentTab} onSelectTab={handleSelectTab} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
