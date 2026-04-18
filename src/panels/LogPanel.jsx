import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';

const WEEK_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

function getOverloadAdvice(exercise, sessions) {
  const parts = (exercise.reps_range || exercise.reps || '8-12').replace('–', '-').split('-');
  const repMin = parseInt(parts[0]);
  const repMax = parseInt(parts[1] || parts[0]);
  const targetSets = parseInt(exercise.target_sets || exercise.sets || 3);
  if (!sessions?.length) return { type: 'hold', headline: exercise.name, detail: 'First session logged. Keep this weight and build to the top of your rep range.' };
  const last = sessions[sessions.length - 1];
  const recent = sessions.slice(-4);
  const hitTopReps = last.reps >= repMax;
  const hitTargetSets = last.sets >= targetSets;
  const stalled = recent.length >= 3 && recent.slice(-3).every(s => s.weight_kg === last.weight_kg && s.reps < repMax);
  if (stalled) return { type: 'hold', headline: exercise.name, detail: 'Performance has stalled. Hold the weight and focus on technique before adding load.' };
  if (hitTopReps && hitTargetSets) return { type: 'add', headline: `Add weight on ${exercise.name}`, detail: `You hit the top of your rep range. Add 2.5kg next session.` };
  return { type: 'hold', headline: exercise.name, detail: `You're progressing. Aim to hit ${repMax} reps on all sets before adding weight.` };
}

export default function LogPanel({ onCheckin }) {
  const { userPlan, logDay, setLogDay, showToast, appLanguage } = useApp();
  const [setsState, setSetsState] = useState({}); // {exIdx: [{weight,reps}]}
  const [feedback, setFeedback]   = useState([]);
  const [saving, setSaving]       = useState(false);

  const days = userPlan?.workout_plan?.days || [];
  const workoutDays = days.filter(d => d.exercises?.length > 0);
  const currentDay = days[logDay];

  // Init sets when day changes
  useEffect(() => {
    if (!currentDay?.exercises) return;
    const state = {};
    currentDay.exercises.forEach((ex, i) => {
      const targetSets = parseInt(ex.sets) || 3;
      // Restore auto-save
      try {
        const saved = localStorage.getItem(`forge_autosave_log_${logDay}`);
        if (saved) {
          const data = JSON.parse(saved);
          if (data[i]) { state[i] = data[i]; return; }
        }
      } catch(e) {}
      state[i] = Array.from({ length: targetSets }, () => ({ weight: '', reps: '' }));
    });
    setSetsState(state);
    setFeedback([]);
  }, [logDay, userPlan]);

  function updateSet(exIdx, setIdx, field, value) {
    setSetsState(prev => {
      const next = { ...prev, [exIdx]: [...(prev[exIdx] || [])] };
      next[exIdx] = next[exIdx].map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      // Auto-save
      try { localStorage.setItem(`forge_autosave_log_${logDay}`, JSON.stringify(next)); } catch(e) {}
      return next;
    });
  }

  function addSet(exIdx) {
    setSetsState(prev => {
      const sets = prev[exIdx] || [];
      const last = sets[sets.length - 1];
      return { ...prev, [exIdx]: [...sets, { weight: last?.weight || '', reps: '' }] };
    });
  }

  function removeSet(exIdx, setIdx) {
    setSetsState(prev => {
      const sets = prev[exIdx] || [];
      if (sets.length <= 1) return prev;
      return { ...prev, [exIdx]: sets.filter((_, i) => i !== setIdx) };
    });
  }

  async function saveLog() {
    if (!currentDay?.exercises) return;
    const exercises = [];
    currentDay.exercises.forEach((ex, i) => {
      const sets = (setsState[i] || []).filter(s => {
        const w = parseFloat(String(s.weight).replace(',', '.'));
        const r = parseInt(s.reps);
        return w > 0 && r > 0;
      }).map(s => ({
        weight: parseFloat(String(s.weight).replace(',', '.')),
        reps: parseInt(s.reps),
      }));
      if (sets.length > 0) {
        exercises.push({ name: ex.name, sets_data: sets, weight: sets[0].weight, reps: sets[0].reps, sets: sets.length, reps_range: ex.reps, target_sets: ex.sets });
      }
    });

    if (!exercises.length) { showToast('Enter at least one set'); return; }
    setSaving(true);

    const res = await api('/api/log', 'POST', { day_index: logDay, day_label: currentDay.label, exercises });
    setSaving(false);

    if (!res?.success) { showToast('Error saving — try again', 'error'); return; }

    // Overload feedback
    const fb = [];
    for (const ex of exercises) {
      const histRes = await api(`/api/history/${encodeURIComponent(ex.name)}`);
      const history = histRes?.history || [];
      const advice = getOverloadAdvice(ex, history);
      fb.push(advice);
    }
    setFeedback(fb);

    if (res.new_prs?.length) showToast(`New PR: ${res.new_prs[0]} 🏆`, 'success');
    else showToast('Session saved ✓', 'success');

    // Clear autosave
    try { localStorage.removeItem(`forge_autosave_log_${logDay}`); } catch(e) {}

    // Background updates
    api('/api/streak/update', 'POST').catch(() => {});
    api('/api/missions/first_workout/complete', 'POST').catch(() => {});

    // Build summary + trigger checkin
    const summary = exercises.map(ex =>
      `${ex.name} — ${ex.sets_data.map((s, i) => `Set ${i+1}: ${s.weight}kg × ${s.reps}`).join(', ')}`
    ).join('\n');
    setTimeout(() => onCheckin?.(summary), 1200);
  }

  return (
    <div id="panel-log" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">LOG</div>
        <div className="panel-sub">Record sets, reps, weight. Overload tracked automatically.</div>
      </div>

      {/* Day bar */}
      <div id="logDayBar" className="day-scroll">
        {workoutDays.map((d, i) => {
          const origIdx = days.indexOf(d);
          return (
            <div
              key={i}
              className={`day-chip${origIdx === logDay ? ' active' : ''}`}
              onClick={() => setLogDay(origIdx)}
            >
              <div className="chip-label">{WEEK_SHORT[origIdx] || `D${origIdx+1}`}</div>
              <div className="chip-name">{(d.label || d.name || '').split(' ')[0].toUpperCase()}</div>
            </div>
          );
        })}
      </div>

      {/* Exercise list */}
      <div id="logExerciseList" className="scroll-content" style={{ flex: 1, padding: '10px 18px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!currentDay?.exercises?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>😴</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2 }}>REST DAY</div>
          </div>
        ) : (
          currentDay.exercises.map((ex, exIdx) => {
            const sets = setsState[exIdx] || [{ weight: '', reps: '' }];
            return (
              <div key={exIdx} id={`log-card-${exIdx}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{ex.name}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>TARGET: {ex.sets}×{ex.reps}</div>
                  </div>
                </div>
                <div id={`log-sets-${exIdx}`} style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sets.map((s, setIdx) => (
                    <div key={setIdx} id={`log-set-${exIdx}-${setIdx}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', width: 36, textAlign: 'center', flexShrink: 0 }}>S{setIdx + 1}</div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          id={`lw-${exIdx}-${setIdx}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="kg"
                          value={s.weight}
                          onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value.replace(',', '.'))}
                          style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 14, textAlign: 'center', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                        />
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', textAlign: 'center', marginTop: 2, letterSpacing: 1 }}>KG</div>
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          id={`lr-${exIdx}-${setIdx}`}
                          type="number"
                          inputMode="numeric"
                          placeholder="reps"
                          value={s.reps}
                          onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                          style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 14, textAlign: 'center', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                        />
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', textAlign: 'center', marginTop: 2, letterSpacing: 1 }}>REPS</div>
                      </div>
                      {sets.length > 1 ? (
                        <button onClick={() => removeSet(exIdx, setIdx)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>✕</button>
                      ) : <div style={{ width: 32 }} />}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => addSet(exIdx)} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 8, padding: 8, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add Set</button>
                </div>
              </div>
            );
          })
        )}

        {/* Feedback */}
        {feedback.length > 0 && (
          <div>
            <div className="section-label" style={{ padding: '14px 0 8px' }}>OVERLOAD ADVICE</div>
            {feedback.map((f, i) => (
              <div key={i} style={{ background: f.type === 'add' ? 'rgba(57,217,138,0.08)' : 'var(--surface)', border: `1px solid ${f.type === 'add' ? 'rgba(57,217,138,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{f.headline}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{f.detail}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>

      {/* Save button */}
      {currentDay?.exercises?.length > 0 && (
        <div className="log-actions" style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="save-btn btn-primary" onClick={saveLog} disabled={saving}>
            {saving ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      )}
    </div>
  );
}
