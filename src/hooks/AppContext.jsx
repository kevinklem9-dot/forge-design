import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser]       = useState(null);
  const [userProfile, setUserProfile]       = useState(null);
  const [userPlan, setUserPlan]             = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [userProgrammes, setUserProgrammes] = useState([]);
  const [activePanel, setActivePanel]       = useState('coach');
  const [selectedDay, setSelectedDay]       = useState(0);
  const [logDay, setLogDay]                 = useState(0);
  const [appLanguage, setAppLanguage]       = useState(
    localStorage.getItem('forge_language') || 'en'
  );
  const [theme, setTheme]                   = useState(
    localStorage.getItem('forge_theme') || 'dark-yellow'
  );

  const showToast = useCallback((msg, type = '') => {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);
      background:${type === 'error' ? '#ff4444' : 'var(--surface)'};
      color:${type === 'error' ? '#fff' : 'var(--text)'};
      border:1px solid ${type === 'error' ? '#ff4444' : 'var(--border)'};
      padding:10px 18px;border-radius:10px;font-size:13px;
      font-family:'DM Sans',sans-serif;z-index:99999;
      opacity:0;transition:all 0.25s;white-space:nowrap;`;
    document.body.appendChild(el);
    el.textContent = msg;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      userProfile, setUserProfile,
      userPlan, setUserPlan,
      userSubscription, setUserSubscription,
      userProgrammes, setUserProgrammes,
      activePanel, setActivePanel,
      selectedDay, setSelectedDay,
      logDay, setLogDay,
      appLanguage, setAppLanguage,
      theme, setTheme,
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
