import { useState, useEffect } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';

export default function AdminPanel() {
  const { showToast } = useApp();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin]           = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (pinVerified) loadUsers();
  }, [pinVerified]);

  async function loadUsers() {
    setLoading(true);
    const res = await api('/api/admin/users');
    if (res?.users) setUsers(res.users);
    setLoading(false);
  }

  function checkPin() {
    const adminPin = import.meta.env.VITE_ADMIN_PIN || 'forge2024';
    if (pin === adminPin) {
      setPinVerified(true);
    } else {
      setPinError('Incorrect PIN');
    }
  }

  async function setTier(userId, tier) {
    const res = await api('/api/admin/user-tier', 'POST', { user_id: userId, tier });
    if (res?.success) { showToast('Tier updated', 'success'); loadUsers(); }
    else showToast('Failed', 'error');
  }

  async function toggleExempt(userId, exempt) {
    const res = await api('/api/admin/user-exempt', 'POST', { user_id: userId, exempt });
    if (res?.success) { showToast('Updated', 'success'); loadUsers(); }
    else showToast('Failed', 'error');
  }

  async function toggleFreeze(userId, freeze) {
    const res = await api('/api/admin/user-freeze', 'POST', { user_id: userId, freeze });
    if (res?.success) { showToast('Updated', 'success'); loadUsers(); }
    else showToast('Failed', 'error');
  }

  const filtered = users.filter(u =>
    !filter || u.email?.toLowerCase().includes(filter.toLowerCase()) || u.name?.toLowerCase().includes(filter.toLowerCase())
  );

  if (!pinVerified) {
    return (
      <div id="panel-admin" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="panel-header">
          <div className="panel-title">ADMIN</div>
          <div className="panel-sub">Enter admin PIN to continue</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <input
            id="adminPinInput"
            type="password"
            placeholder="Admin PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkPin()}
            className="field-input"
            style={{ maxWidth: 320, textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
          />
          {pinError && <div style={{ color: 'var(--red)', fontSize: 13 }}>{pinError}</div>}
          <button className="btn-primary" onClick={checkPin} style={{ maxWidth: 320 }}>Enter Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div id="panel-admin" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">ADMIN</div>
        <div className="panel-sub">Manage all user accounts · {users.length} users</div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <input
          className="field-input"
          placeholder="Search users..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '8px 12px' }}
        />
      </div>

      {/* User list */}
      <div id="adminUserList" className="scroll-content" style={{ flex: 1, padding: '0 18px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</div>
        ) : filtered.map(u => (
          <div key={u.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 10, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name || 'Unnamed'}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {u.is_exempt && <span style={{ background: 'rgba(57,217,138,0.15)', border: '1px solid rgba(57,217,138,0.3)', color: 'var(--green)', fontSize: 9, padding: '2px 6px', borderRadius: 10, fontFamily: "'DM Mono', monospace" }}>EXEMPT</span>}
                {u.frozen && <span style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: 'var(--red)', fontSize: 9, padding: '2px 6px', borderRadius: 10, fontFamily: "'DM Mono', monospace" }}>FROZEN</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['iron','steel','forge'].map(tier => (
                <button key={tier} onClick={() => setTier(u.id, tier)}
                  style={{ flex: 1, padding: '6px 8px', background: u.subscription_tier === tier ? 'var(--accent)' : 'var(--surface2)', color: u.subscription_tier === tier ? '#000' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                  {tier.toUpperCase()}
                </button>
              ))}
              <button onClick={() => toggleExempt(u.id, !u.is_exempt)}
                style={{ padding: '6px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>
                {u.is_exempt ? 'UNEXEMPT' : 'EXEMPT'}
              </button>
              <button onClick={() => toggleFreeze(u.id, !u.frozen)}
                style={{ padding: '6px 8px', background: u.frozen ? 'rgba(57,217,138,0.1)' : 'rgba(255,68,68,0.08)', border: `1px solid ${u.frozen ? 'rgba(57,217,138,0.3)' : 'rgba(255,68,68,0.25)'}`, color: u.frozen ? 'var(--green)' : 'var(--red)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>
                {u.frozen ? 'UNFREEZE' : 'FREEZE'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
