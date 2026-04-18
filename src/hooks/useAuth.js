import { useCallback } from 'react';
import { useApp } from './AppContext';
import { api } from '../lib/api';
import { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL } from '../lib/constants';

export function useAuth() {
  const { setCurrentUser, setUserProfile, setUserPlan, setUserSubscription, showToast } = useApp();

  const supabaseAuth = useCallback(async (endpoint, body) => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify(body),
    });
    return res.json();
  }, []);

  const handleSession = useCallback(async (session) => {
    if (!session?.user) return false;
    setCurrentUser(session.user);

    // Store session
    const sessionData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: session.user,
      expires_at: session.expires_at,
    };

    const rememberMe = localStorage.getItem('forge-remember-me') === 'true';
    if (rememberMe) {
      localStorage.setItem('forge-session', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('forge-session-temp', JSON.stringify(sessionData));
    }

    // Refresh token if needed
    const expiresAt = session.expires_at || 0;
    if (Date.now() / 1000 > expiresAt - 60) {
      const refreshToken = session.refresh_token;
      if (refreshToken) {
        try {
          const refreshed = await supabaseAuth('token?grant_type=refresh_token', { refresh_token: refreshToken });
          if (refreshed?.access_token) {
            const newSession = { ...sessionData, access_token: refreshed.access_token, expires_at: refreshed.expires_at };
            rememberMe
              ? localStorage.setItem('forge-session', JSON.stringify(newSession))
              : sessionStorage.setItem('forge-session-temp', JSON.stringify(newSession));
          }
        } catch(e) { /* ignore */ }
      }
    }

    // Load profile + subscription
    const [profileRes, subRes] = await Promise.all([
      api('/api/profile'),
      api('/api/subscription'),
    ]);

    if (profileRes?.profile) setUserProfile(profileRes.profile);
    if (subRes?.tier)        setUserSubscription(subRes);

    // Load plan
    const planRes = await api('/api/plan');
    if (planRes?.plan) setUserPlan(planRes.plan);

    return true;
  }, [setCurrentUser, setUserProfile, setUserPlan, setUserSubscription, supabaseAuth]);

  const signIn = useCallback(async (email, password, rememberMe) => {
    if (rememberMe) localStorage.setItem('forge-remember-me', 'true');
    else localStorage.removeItem('forge-remember-me');

    const data = await supabaseAuth('token?grant_type=password', { email, password });
    if (data?.error || data?.error_description) {
      throw new Error(data.error_description || data.error || 'Sign in failed');
    }
    return handleSession(data);
  }, [supabaseAuth, handleSession]);

  const signUp = useCallback(async (name, email, password) => {
    const res = await api('/api/signup', 'POST', { name, email, password });
    if (res?.error) throw new Error(res.error);
    return res;
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('forge-session');
    localStorage.removeItem('forge-remember-me');
    localStorage.removeItem('forge-cached-profile');
    localStorage.removeItem('forge-cached-plan');
    sessionStorage.removeItem('forge-session-temp');
    setCurrentUser(null);
    setUserProfile(null);
    setUserPlan(null);
    setUserSubscription(null);
  }, [setCurrentUser, setUserProfile, setUserPlan, setUserSubscription]);

  const sendPasswordReset = useCallback(async (email) => {
    const res = await api('/api/reset-password', 'POST', { email });
    return res;
  }, []);

  const bootFromCache = useCallback(async () => {
    const stored = localStorage.getItem('forge-session') || sessionStorage.getItem('forge-session-temp');
    if (!stored) return false;
    try {
      const session = JSON.parse(stored);
      return await handleSession(session);
    } catch(e) { return false; }
  }, [handleSession]);

  const isAdmin = useCallback((user) => {
    return user?.email === ADMIN_EMAIL;
  }, []);

  return { signIn, signUp, signOut, sendPasswordReset, bootFromCache, handleSession, isAdmin };
}
