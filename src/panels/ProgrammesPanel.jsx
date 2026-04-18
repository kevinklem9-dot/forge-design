import { useState, useEffect } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';

export default function ProgrammesPanel() {
  const { userProgrammes, setUserProgrammes, setUserPlan, setActivePanel, showToast } = useApp();
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => { loadProgrammes(); }, []);

  async function loadProgrammes() {
    setLoading(true);
    const res = await api('/api/programmes');
    if (res?.programmes) setUserProgrammes(res.programmes);
    setLoading(false);
  }

  async function saveCurrentAsProgramme() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await api('/api/programmes', 'POST', { name: newName.trim() });
    setSaving(false);
    if (res?.programme) {
      showToast('Programme saved', 'success');
      setShowNew(false);
      setNewName('');
      loadProgrammes();
    } else {
      showToast('Failed to save', 'error');
    }
  }

  async function switchProgramme(id) {
    const res = await api(`/api/programmes/${id}/activate`, 'POST');
    if (res?.plan) {
      setUserPlan(res.plan);
      localStorage.setItem('forge-cached-plan', JSON.stringify(res.plan));
      showToast('Programme loaded', 'success');
      setActivePanel('workout');
    } else {
      showToast('Failed to load', 'error');
    }
  }

  async function deleteProgramme(id) {
    if (!window.confirm('Delete this programme?')) return;
    const res = await api(`/api/programmes/${id}`, 'DELETE');
    if (res?.success) { showToast('Deleted', 'success'); loadProgrammes(); }
    else showToast('Failed', 'error');
  }

  return (
    <div id="panel-programmes" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">MY PROGRAMMES</div>
        <div className="panel-sub">Saved training programmes</div>
      </div>

      <div id="programmesPanel" className="scroll-content" style={{ flex: 1, padding: '12px 18px 100px' }}>
        {/* Save current plan */}
        {showNew ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div className="field-label" style={{ marginBottom: 8 }}>PROGRAMME NAME</div>
            <input className="field-input" placeholder="e.g. Push Pull Legs — Spring 2025"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCurrentAsProgramme()}
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveCurrentAsProgramme} disabled={saving} className="btn-primary" style={{ flex: 2 }}>
                {saving ? 'Saving...' : 'Save Programme'}
              </button>
              <button onClick={() => { setShowNew(false); setNewName(''); }} className="btn-ghost" style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNew(true)} className="btn-primary" style={{ marginBottom: 16, width: '100%' }}>
            + Save Current Plan as Programme
          </button>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</div>
        ) : userProgrammes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1 }}>No saved programmes yet.<br/>Save your current plan to access it later.</div>
          </div>
        ) : (
          userProgrammes.map(p => (
            <div key={p.id} style={{ background: 'var(--surface)', border: `1px solid ${p.is_active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.name}
                    {p.is_active && <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'var(--accent)', color: '#000', padding: '2px 6px', borderRadius: 10 }}>ACTIVE</span>}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!p.is_active && (
                  <button onClick={() => switchProgramme(p.id)}
                    style={{ flex: 2, padding: '8px 12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Load Programme
                  </button>
                )}
                <button onClick={() => deleteProgramme(p.id)}
                  style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: 'var(--red)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
