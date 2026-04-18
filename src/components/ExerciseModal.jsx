import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ExerciseModal({ exercise, onClose }) {
  const [ytId, setYtId]         = useState(null);
  const [ytTitle, setYtTitle]   = useState('');
  const [mwUrl, setMwUrl]       = useState('');
  const [primary, setPrimary]   = useState([]);
  const [steps, setSteps]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetchVideo() {
      setLoading(true);
      try {
        let url = '/api/exercise/search?name=' + encodeURIComponent(exercise.name);
        if (exercise.mw_id) url += '&mw_id=' + encodeURIComponent(exercise.mw_id);
        const res = await api(url);
        const ex = res?.exercise;
        if (ex) {
          setYtId(ex.youtubeVideoId || null);
          setYtTitle(ex.youtubeTitle || '');
          setMwUrl(ex.muscleWikiUrl || '');
          setPrimary(ex.primaryMuscles || []);
          setSteps(ex.instructions || []);
        }
      } catch(e) {}
      setLoading(false);
    }
    fetchVideo();
  }, [exercise.name, exercise.mw_id]);

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      id="exerciseModal"
      onClick={handleBackdrop}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
    >
      <div style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', maxHeight: '92vh', overflowY: 'auto', paddingBottom: 40 }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'var(--bg)', padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, color: 'var(--accent)' }}>{exercise.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              {exercise.sets} SETS × {exercise.reps}{exercise.rest ? ` · REST ${exercise.rest}` : ''}{exercise.rpe ? ` · RPE ${exercise.rpe}` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: '50%', width: 32, height: 32, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Video area */}
        <div id="exerciseVideoArea" style={{ padding: '16px 20px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>
              <div className="spin" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
              Loading form guide...
            </div>
          ) : ytId ? (
            <>
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 12, marginBottom: 8 }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              {ytTitle && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--muted)', marginTop: 4, letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ytTitle}
                </div>
              )}
            </>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏋️</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>No video available — follow the coaching notes below.</div>
            </div>
          )}
          {mwUrl && (
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <a href={mwUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', textDecoration: 'none' }}>
                View on MuscleWiki →
              </a>
            </div>
          )}
        </div>

        {/* Coaching notes */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>COACHING NOTES</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
            {exercise.note || 'Focus on controlled movement through the full range of motion.'}
          </div>
        </div>

        {/* Muscles + steps */}
        <div id="exerciseTipsArea" style={{ padding: '16px 20px 0' }}>
          {primary.length > 0 && (
            <>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>MUSCLES WORKED</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {primary.map((m, i) => (
                  <span key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontFamily: "'DM Mono', monospace", textTransform: 'capitalize' }}>{m}</span>
                ))}
              </div>
            </>
          )}
          {steps.length > 0 && (
            <>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 10 }}>STEP BY STEP</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.slice(0, 6).map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
