import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/AppContext';

export default function AuthScreen({ onSuccess }) {
  const [tab, setTab]           = useState('login'); // login | signup | forgot
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [rememberMe, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp, sendPasswordReset } = useAuth();
  const { showToast } = useApp();

  async function handleSignIn(e) {
    e.preventDefault();
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      await signIn(email, password, rememberMe);
      onSuccess();
    } catch(err) {
      setError(err.message || 'Sign in failed.');
    }
    setLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!name || !email || !password) { setError('Fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await signUp(name, email, password);
      setError('');
      showToast('Check your email to confirm your account.');
      setTab('login');
    } catch(err) {
      setError(err.message || 'Sign up failed.');
    }
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!email) { setError('Enter your email.'); return; }
    setLoading(true); setError('');
    await sendPasswordReset(email);
    setResetSent(true);
    setLoading(false);
  }

  return (
    <div className="auth-screen" style={{ minHeight: '100%', overflowY: 'auto' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 8, color: 'var(--accent)', lineHeight: 1 }}>FORGE</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 3, marginTop: 4 }}>AI PERSONAL TRAINER</div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 400, marginTop: 32 }}>

        {/* Tabs */}
        {tab !== 'forgot' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {['login','signup'].map(t => (
              <div
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: 10, textAlign: 'center',
                  fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1,
                  color: tab === t ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </div>
            ))}
          </div>
        )}

        {/* Sign In */}
        {tab === 'login' && (
          <form onSubmit={handleSignIn}>
            <div className="field-group">
              <div className="field-label">Email</div>
              <input id="login-email" className="field-input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field-group">
              <div className="field-label">Password</div>
              <div style={{ position: 'relative' }}>
                <input id="login-password" className="field-input" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" id="remember-me" checked={rememberMe} onChange={e => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>REMEMBER ME</span>
              </label>
              <button type="button" onClick={() => { setTab('forgot'); setError(''); }}
                style={{ background: 'none', border: 'none', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', cursor: 'pointer', letterSpacing: 1, textDecoration: 'underline' }}>
                FORGOT PASSWORD?
              </button>
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div className="field-group">
              <div className="field-label">Full Name</div>
              <input id="signup-name" className="field-input" type="text" placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field-group">
              <div className="field-label">Email</div>
              <input id="signup-email" className="field-input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field-group">
              <div className="field-label">Password</div>
              <div style={{ position: 'relative' }}>
                <input id="signup-password" className="field-input" type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleReset}>
            {resetSent ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--green)', lineHeight: 1.6, marginBottom: 16 }}>
                Reset link sent. Check your email.
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 16, lineHeight: 1.6 }}>
                  Enter your email and we'll send you a reset link.
                </div>
                <div className="field-group">
                  <div className="field-label">Email</div>
                  <input id="reset-email" className="field-input" type="email" placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </>
            )}
            <button type="button" onClick={() => { setTab('login'); setError(''); setResetSent(false); }}
              style={{ width: '100%', background: 'none', border: 'none', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', cursor: 'pointer', marginTop: 12, letterSpacing: 1 }}>
              ← BACK TO SIGN IN
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
