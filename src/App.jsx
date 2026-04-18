import { useState, useEffect } from 'react';
import { useApp } from './hooks/AppContext';
import { useAuth } from './hooks/useAuth';
import { loadTheme } from './lib/theme';
import { api } from './lib/api';

import AuthScreen       from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import BottomNav        from './components/BottomNav';
import TrialBanner      from './components/TrialBanner';
import UpgradeSheet     from './components/UpgradeSheet';

import CoachPanel      from './panels/CoachPanel';
import WorkoutPanel    from './panels/WorkoutPanel';
import LogPanel        from './panels/LogPanel';
import NutritionPanel  from './panels/NutritionPanel';
import ProgressPanel   from './panels/ProgressPanel';
import AccountPanel    from './panels/AccountPanel';
import AdminPanel      from './panels/AdminPanel';
import ProgrammesPanel from './panels/ProgrammesPanel';

function CheckinOverlay({ summary, onClose, onSubmit }) {
  const [feeling, setFeeling]       = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ready = feeling && difficulty;
  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    await onSubmit({ feeling, difficulty, notes, summary });
    setSubmitting(false);
    onClose();
  }
  return (
    <div style={{ position:'fixed',inset:0,zIndex:20000,background:'rgba(0,0,0,0.75)',display:'flex',flexDirection:'column',justifyContent:'flex-end' }}>
      <div style={{ background:'var(--bg)',borderRadius:'20px 20px 0 0',padding:'24px 20px 40px',maxHeight:'80vh',overflowY:'auto' }}>
        <div style={{ fontFamily:"'Bebas Neue', sans-serif",fontSize:20,letterSpacing:2,marginBottom:16 }}>SESSION FEEDBACK</div>
        <div style={{ fontFamily:"'DM Mono', monospace",fontSize:10,color:'var(--muted)',letterSpacing:1,marginBottom:8 }}>HOW DO YOU FEEL?</div>
        <div id="checkin-buttons" style={{ display:'flex',gap:8,marginBottom:16 }}>
          {[{val:'great',label:'Feeling great'},{val:'ok',label:'Feeling ok'},{val:'tired',label:'Feeling tired'}].map(o=>(
            <button key={o.val} className={`checkin-btn${feeling===o.val?' selected':''}`} onClick={()=>setFeeling(o.val)} style={{flex:1,fontSize:12}}>{o.label}</button>
          ))}
        </div>
        <div style={{ fontFamily:"'DM Mono', monospace",fontSize:10,color:'var(--muted)',letterSpacing:1,marginBottom:8 }}>DIFFICULTY</div>
        <div style={{ display:'flex',gap:8,marginBottom:16 }}>
          {[{val:'too_easy',label:'Too easy'},{val:'just_right',label:'Just right'},{val:'too_hard',label:'Too hard'}].map(o=>(
            <button key={o.val} className={`checkin-btn${difficulty===o.val?' selected':''}`} onClick={()=>setDifficulty(o.val)} style={{flex:1,fontSize:12}}>{o.label}</button>
          ))}
        </div>
        <div style={{ fontFamily:"'DM Mono', monospace",fontSize:10,color:'var(--muted)',letterSpacing:1,marginBottom:8 }}>NOTES (optional)</div>
        <textarea id="checkin-notes" value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="e.g. left knee felt tight..."
          style={{ width:'100%',padding:'10px 12px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:9,color:'var(--text)',fontSize:13,fontFamily:"'DM Sans', sans-serif",resize:'none',minHeight:72,boxSizing:'border-box',outline:'none',marginBottom:14 }}
        />
        <button id="checkin-submit" onClick={submit} disabled={!ready||submitting}
          style={{ display:'block',width:'100%',padding:13,background:ready?'var(--accent)':'var(--surface)',color:ready?'#000':'var(--muted)',border:'1px solid var(--border)',borderRadius:10,fontWeight:700,fontSize:14,cursor:ready?'pointer':'not-allowed',fontFamily:"'DM Sans', sans-serif",marginBottom:8 }}>
          {submitting?'Getting feedback...':'Get Feedback'}
        </button>
        <button onClick={onClose} style={{ display:'block',width:'100%',padding:10,background:'none',border:'1px solid var(--border)',borderRadius:10,color:'var(--muted)',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans', sans-serif" }}>Skip</button>
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser, setActivePanel, activePanel, appLanguage, showToast, setSelectedDay, setLogDay } = useApp();
  const { bootFromCache } = useAuth();
  const [screen, setScreen]           = useState('loading');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState(null);
  const [checkinData, setCheckinData] = useState(null);

  useEffect(() => {
    loadTheme();
    bootFromCache().then(ok => {
      if (ok) {
        const d = new Date().getDay();
        const idx = d === 0 ? 6 : d - 1;
        setSelectedDay(idx);
        setLogDay(idx);
        setScreen('app');
      } else {
        setScreen('auth');
      }
    });
  }, []);

  function openUpgrade(tier) { setUpgradeTier(tier||null); setUpgradeOpen(true); }

  async function handleCheckin({ feeling, difficulty, notes, summary }) {
    const userContent = notes
      ? `Feeling: ${feeling}. Difficulty: ${difficulty}. Notes: ${notes}`
      : `Feeling: ${feeling}. Difficulty: ${difficulty}.`;
    const res = await api('/api/checkin', 'POST', {
      session_summary: (summary||'').slice(0,2000),
      feeling, difficulty, notes,
      language: appLanguage||'en',
      messages: [{ role:'user', content:userContent }],
    }, 45000);
    if (res?.reply) {
      setActivePanel('coach');
      window.dispatchEvent(new CustomEvent('forge:checkin-reply', { detail:{ reply:res.reply } }));
    } else {
      showToast(res?._error==='timeout'?'Feedback timed out — try again.':'Could not get feedback — try again.', 'error');
    }
  }

  if (screen === 'loading') return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:20,background:'var(--bg)' }}>
      <div style={{ fontFamily:"'Bebas Neue', sans-serif",fontSize:52,letterSpacing:8,color:'var(--accent)',lineHeight:1 }}>FORGE</div>
      <div className="spin" style={{ width:24,height:24 }} />
    </div>
  );

  if (screen === 'auth') return <AuthScreen onSuccess={() => {
    const d = new Date().getDay();
    const idx = d===0?6:d-1;
    setSelectedDay(idx); setLogDay(idx);
    setScreen('app');
  }} />;

  if (screen === 'onboarding') return <OnboardingScreen onComplete={() => setScreen('app')} />;

  const isAdmin = currentUser?.email === 'kevinklem9@gmail.com';

  return (
    <div style={{ position:'relative',height:'100%',overflow:'hidden',background:'var(--bg)' }}>
      <TrialBanner onUpgrade={() => openUpgrade()} />
      <div style={{ position:'absolute',inset:0,bottom:72 }}>
        {activePanel==='coach'      && <CoachPanel      onOpenUpgrade={openUpgrade} />}
        {activePanel==='workout'    && <WorkoutPanel />}
        {activePanel==='log'        && <LogPanel         onCheckin={s=>setCheckinData({summary:s})} />}
        {activePanel==='nutrition'  && <NutritionPanel />}
        {activePanel==='progress'   && <ProgressPanel />}
        {activePanel==='account'    && <AccountPanel     onOpenUpgrade={openUpgrade} />}
        {activePanel==='programmes' && <ProgrammesPanel />}
        {activePanel==='admin'      && isAdmin && <AdminPanel />}
      </div>
      <BottomNav />
      {upgradeOpen && <UpgradeSheet highlightTier={upgradeTier} onClose={() => setUpgradeOpen(false)} />}
      {checkinData && <CheckinOverlay summary={checkinData.summary} onClose={() => setCheckinData(null)} onSubmit={handleCheckin} />}
    </div>
  );
}
