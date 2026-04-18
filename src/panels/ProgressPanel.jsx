import { useState, useEffect } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';

const BADGE_ICONS = ['🥇','🏆','⭐','💎','🔥','⚡','💪','🎯','🏅','🌟','🦾','🚀'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ProgressPanel() {
  const { userSubscription, showToast } = useApp();
  const [streak, setStreak]       = useState(0);
  const [badges, setBadges]       = useState([]);
  const [prs, setPRs]             = useState([]);
  const [stats, setStats]         = useState({});
  const [weight, setWeight]       = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metrics, setMetrics]     = useState({ weight: '', bodyfat: '', chest: '', waist: '', arm: '', thigh: '' });

  useEffect(() => { loadProgress(); }, []);

  async function loadProgress() {
    const [streakRes, statsRes, prRes] = await Promise.all([
      api('/api/streak'),
      api('/api/stats'),
      api('/api/history/prs'),
    ]);

    if (streakRes?.streak !== undefined) setStreak(streakRes.streak);
    if (statsRes) {
      setStats(statsRes);
      // Build badges from monthly counts
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthly = statsRes.monthly_counts || {};
      const earnedMonths = Object.keys(monthly).filter(m => monthly[m] >= 6).sort().slice(-12);
      const badgeList = earnedMonths.map((m, i) => {
        const [yr, mo] = m.split('-');
        return { label: MONTH_NAMES[parseInt(mo) - 1] + ' ' + yr, earned: true, icon: BADGE_ICONS[i % BADGE_ICONS.length] };
      });
      // Pad with upcoming badges
      while (badgeList.length < 8) {
        badgeList.push({ label: 'Locked', earned: false, icon: '🔒' });
      }
      setBadges(badgeList);
    }
    if (prRes?.prs) setPRs(prRes.prs);
  }

  async function saveBodyWeight() {
    const val = parseFloat(weight);
    if (!val) return;
    setSavingWeight(true);
    const res = await api('/api/bodyweight', 'POST', { weight_kg: val });
    setSavingWeight(false);
    if (res?.success) { showToast('Weight saved', 'success'); setWeight(''); }
    else showToast('Failed to save', 'error');
  }

  return (
    <div id="panel-progress" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">PROGRESS</div>
        <div className="panel-sub">STREAK · BADGES · WEEKLY REVIEW · BODY</div>
      </div>

      <div className="scroll-content" style={{ flex: 1, paddingBottom: 80 }}>
        {/* Streak */}
        <div id="streakSection" style={{ padding: '14px 18px 0' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 36 }}>🔥</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: 'var(--accent)', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>DAY STREAK</div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="section-label" style={{ marginTop: 4 }}>MONTHLY BADGES</div>
        <div id="badgesSection" style={{ padding: '0 18px 4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {badges.map((b, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 6px', background: 'var(--surface)',
                border: `1px solid ${b.earned ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                opacity: b.earned ? 1 : 0.5,
              }}>
                <div style={{ fontSize: 22 }}>{b.icon}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--muted)', letterSpacing: 0.5, textAlign: 'center' }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="stat-grid" style={{ marginTop: 8 }}>
          {[
            { val: stats.sessions_this_month || 0, lbl: 'SESSIONS THIS MONTH' },
            { val: stats.prs_this_month || 0,      lbl: 'PRs THIS MONTH' },
            { val: stats.adherence_pct ? stats.adherence_pct + '%' : '—', lbl: 'PLAN ADHERENCE' },
            { val: stats.total_volume_kg ? Math.round(stats.total_volume_kg / 1000) + 't' : '—', lbl: 'TOTAL VOLUME' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Log bodyweight */}
        <div className="section-label">LOG BODYWEIGHT</div>
        <div style={{ margin: '0 18px 4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Today's Weight</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="weightInput"
              className="weight-input"
              type="number"
              step="0.1"
              placeholder="kg"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            />
            <button
              className="action-btn"
              onClick={saveBodyWeight}
              disabled={savingWeight}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >Save</button>
          </div>
        </div>

        {/* PRs */}
        <div className="section-label">PERSONAL RECORDS</div>
        <div id="prList" className="pr-list" style={{ padding: '0 18px 80px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {prs.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Log sessions to see your PRs here.</div>
          ) : (
            prs.map((pr, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>{pr.exercise_name}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--accent)' }}>{pr.weight_kg}kg × {pr.reps}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
