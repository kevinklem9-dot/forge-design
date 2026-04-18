import { useState } from 'react';
import { useApp } from '../hooks/AppContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { applyTheme, THEME_VARS } from '../lib/theme';
import { getTrialDaysLeft } from '../lib/subscription';

const THEMES = ['dark-yellow', 'dark-blue', 'dark-green', 'midnight', 'light'];
const THEME_COLORS = {
  'dark-yellow': '#e8ff3d',
  'dark-blue':   '#4d9fff',
  'dark-green':  '#39d98a',
  'midnight':    '#bf9fff',
  'light':       '#1a1a1a',
};
const THEME_BG = {
  'dark-yellow': '#0a0a0a',
  'dark-blue':   '#090d1a',
  'dark-green':  '#090f0a',
  'midnight':    '#05050f',
  'light':       '#f5f5f0',
};

const TIER_COLOURS = { iron: 'var(--muted)', steel: '#7eb8f7', forge: 'var(--accent)' };

export default function AccountPanel({ onOpenUpgrade }) {
  const { currentUser, userProfile, setUserProfile, userSubscription, theme, setTheme, showToast } = useApp();
  const { signOut, sendPasswordReset } = useAuth();
  const [name, setName]   = useState(userProfile?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saving, setSaving] = useState(false);

  const sub = userSubscription || {};
  const displayTier = sub.isExempt ? 'forge' : (sub.tier || 'iron');
  const tierLabel = { iron: '⚙️ Iron', steel: '🔩 Steel', forge: '🔥 Forge' };
  const trialDays = getTrialDaysLeft(sub.trialEndsAt);
  const statusText = sub.isExempt
    ? 'Exempt (Free)'
    : sub.status === 'trial'
      ? `Trial — ${trialDays} days left`
      : (sub.status || 'Trial');

  async function saveProfile() {
    if (!name.trim()) { showToast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    const res = await api('/api/profile', 'PATCH', { name: name.trim() });
    setSaving(false);
    if (!res?.profile) { showToast('Failed to save — try again', 'error'); return; }
    setUserProfile(res.profile);
    localStorage.setItem('forge-cached-profile', JSON.stringify(res.profile));
    showToast('Profile saved', 'success');
  }

  async function handlePasswordReset() {
    const userEmail = currentUser?.email || email;
    if (!userEmail) { showToast('Could not find your email', 'error'); return; }
    await sendPasswordReset(userEmail);
    showToast('Password reset email sent', 'success');
  }

  function handleTheme(t) {
    setTheme(t);
    applyTheme(t);
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div id="panel-account" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">ACCOUNT</div>
        <div className="panel-sub">MEMBERSHIP · PROFILE · SETTINGS</div>
      </div>

      <div id="accountPanel" className="scroll-content" style={{ flex: 1, padding: '0 18px 100px' }}>

        {/* Membership */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10, marginTop: 16 }}>MEMBERSHIP</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, color: TIER_COLOURS[displayTier] }}>
                {tierLabel[displayTier] || 'Iron'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{statusText}</div>
            </div>
            <button
              onClick={() => onOpenUpgrade?.()}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              {displayTier === 'forge' && sub.isExempt ? 'View Plans' : 'Upgrade'}
            </button>
          </div>
          {!sub.hasUnlimitedCoach && !sub.isExempt && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 0.5 }}>AI COACH MESSAGES</span>
                <span style={{ fontWeight: 600 }}>{sub.coachUsage || 0} / {sub.coachLimit || 20}</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, ((sub.coachUsage || 0) / (sub.coachLimit || 20)) * 100)}%`, background: 'var(--accent)', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Resets on the 1st of each month.</div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>PROFILE</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">NAME</label>
            <input
              id="acct-name"
              className="field-input"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ background: 'var(--bg)' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">EMAIL</label>
            <input
              id="acct-email"
              className="field-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ background: 'var(--bg)' }}
            />
          </div>
          <button onClick={saveProfile} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Theme */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>THEME</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {THEMES.map(t => (
              <div
                key={t}
                onClick={() => handleTheme(t)}
                style={{
                  aspectRatio: 1, borderRadius: '50%', cursor: 'pointer',
                  background: THEME_BG[t],
                  border: `2px solid ${theme === t ? THEME_COLORS[t] : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: theme === t ? `0 0 0 1px ${THEME_COLORS[t]}` : 'none',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: THEME_COLORS[t] }} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>SECURITY</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <button onClick={handlePasswordReset} className="btn-ghost" style={{ width: '100%' }}>
            Send Password Reset Email
          </button>
        </div>

        {/* Sign out */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>ACCOUNT</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <button
            onClick={handleSignOut}
            style={{ width: '100%', padding: 12, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: 'var(--red)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
