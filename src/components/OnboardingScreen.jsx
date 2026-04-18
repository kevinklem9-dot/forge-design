import { useState, useCallback } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';

const OB_STEPS_BASE = [
  {
    title: 'Your Goals', sub: 'Select all that apply', field: 'goal', type: 'multi',
    options: [
      { value: 'muscle',    icon: '💪', label: 'Build Muscle',       sub: 'Hypertrophy focus' },
      { value: 'fat_loss',  icon: '🔥', label: 'Lose Fat',           sub: 'Burn & preserve muscle' },
      { value: 'strength',  icon: '🏋️', label: 'Get Stronger',      sub: 'Power & strength' },
      { value: 'endurance', icon: '🏃', label: 'Improve Fitness',    sub: 'Conditioning' },
      { value: 'sport',     icon: '🏅', label: 'Sport Performance',  sub: 'Train for your sport' },
    ]
  },
  {
    title: 'Gym Experience', sub: 'How long have you been training?', field: 'experience', type: 'grid',
    options: [
      { value: 'beginner',     icon: '🌱', label: 'Beginner',     sub: 'Under 1 year' },
      { value: 'intermediate', icon: '⚡', label: 'Intermediate', sub: '1–3 years' },
      { value: 'advanced',     icon: '🔱', label: 'Advanced',     sub: '3+ years' },
    ]
  },
  {
    title: 'Gym Days', sub: 'How many days per week can you train?', field: 'days_per_week', type: 'grid',
    options: [
      { value: 1, icon: '1️⃣', label: '1 Day',  sub: 'Full body' },
      { value: 2, icon: '2️⃣', label: '2 Days', sub: 'Full body split' },
      { value: 3, icon: '3️⃣', label: '3 Days', sub: 'Full body' },
      { value: 4, icon: '4️⃣', label: '4 Days', sub: 'Upper/lower' },
      { value: 5, icon: '5️⃣', label: '5 Days', sub: 'Push/pull/legs' },
      { value: 6, icon: '6️⃣', label: '6 Days', sub: 'PPL x 2' },
    ]
  },
  { title: 'Which Gym Days?', sub: 'Select the days you can train', field: 'preferred_days', type: 'days' },
  {
    title: 'Equipment', sub: 'Select all you have access to', field: 'equipment', type: 'multi',
    options: [
      { value: 'full_gym',  icon: '🏢', label: 'Full Gym',   sub: 'All equipment' },
      { value: 'home_gym',  icon: '🏠', label: 'Home Gym',   sub: 'Dumbbells & barbell' },
      { value: 'minimal',   icon: '🎽', label: 'Minimal',    sub: 'Bands & bodyweight' },
    ]
  },
  { title: 'Your Stats', sub: 'Age, height and current weight', field: 'stats', type: 'stats' },
  {
    title: 'Diet Style', sub: 'How do you eat?', field: 'diet_style', type: 'grid',
    options: [
      { value: 'anything',    icon: '🍖', label: 'Everything',    sub: 'No restrictions' },
      { value: 'vegetarian',  icon: '🥗', label: 'Vegetarian',    sub: 'No meat' },
      { value: 'vegan',       icon: '🌱', label: 'Vegan',         sub: 'Plant only' },
      { value: 'keto',        icon: '🥑', label: 'Keto/Low Carb', sub: 'Fat-dominant' },
    ]
  },
  { title: 'Any Restrictions?', sub: 'Foods to avoid, allergies, injuries', field: 'restrictions', type: 'text' },
];

const SPORT_STEPS = [
  { title: 'Your Sport',      sub: 'Tell us exactly what you play or compete in',  field: 'sport_name',            type: 'sport_name' },
  { title: 'Competition Level', sub: 'Do you compete or train recreationally?',    field: 'sport_level',           type: 'grid',
    options: [
      { value: 'recreational', icon: '🎮', label: 'Recreational', sub: 'For fun & fitness' },
      { value: 'amateur',      icon: '🏅', label: 'Amateur',       sub: 'Local / club level' },
      { value: 'competitive',  icon: '🏆', label: 'Competitive',   sub: 'Regional / national' },
      { value: 'elite',        icon: '⭐', label: 'Elite',         sub: 'Professional level' },
    ]
  },
  { title: 'Sport Days', sub: 'How many days per week do you train/play your sport?', field: 'sport_training_days', type: 'sport_days' },
  { title: 'Sport Notes', sub: 'Upcoming competitions, specific goals, position?',   field: 'sport_notes',          type: 'text' },
];

const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function OnboardingScreen({ onComplete }) {
  const { userProfile, setUserProfile, setUserPlan, appLanguage, showToast } = useApp();
  const [step, setStep]       = useState(0);
  const [data, setData]       = useState({});
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus]   = useState('');

  function getSteps() {
    const base = [...OB_STEPS_BASE];
    if (Array.isArray(data.goal) && data.goal.includes('sport')) {
      base.splice(1, 0, ...SPORT_STEPS);
    }
    return base;
  }

  const steps = getSteps();
  const currentStep = steps[step];
  const total = steps.length;
  const pct = Math.round(((step + 1) / total) * 100);

  function setField(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function toggleMulti(field, value) {
    setData(prev => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  }

  function canAdvance() {
    const s = currentStep;
    const val = data[s.field];
    if (s.type === 'grid')   return val !== undefined && val !== null && val !== '';
    if (s.type === 'multi')  return Array.isArray(val) && val.length > 0;
    if (s.type === 'stats')  return data.age && data.height_cm && data.weight_kg && data.sex;
    if (s.type === 'days')   return true;
    if (s.type === 'text')   return true;
    if (s.type === 'sport_name')  return val && val.trim().length > 0;
    if (s.type === 'sport_days')  return true;
    return true;
  }

  async function handleNext() {
    if (!canAdvance()) return;
    if (step < total - 1) {
      setStep(s => s + 1);
    } else {
      await submitOnboarding();
    }
  }

  async function submitOnboarding() {
    setGenerating(true);
    setGenStatus('Saving your profile...');

    const toStr = v => Array.isArray(v) ? v.join(', ') : (v || '');
    let sportContext = '';
    if (data.sport_name) {
      sportContext = [
        'Sport: ' + data.sport_name,
        data.sport_level        ? 'Level: ' + data.sport_level : '',
        data.sport_training_days?.length ? 'Sport days: ' + data.sport_training_days.join(', ') : '',
        data.sport_notes        ? 'Notes: ' + data.sport_notes : '',
      ].filter(Boolean).join('. ');
    }
    const injuriesField = [data.restrictions || '', sportContext].filter(Boolean).join('. ') || 'none';

    const profileRes = await api('/api/profile', 'PATCH', {
      age: parseInt(data.age), sex: data.sex,
      height_cm: parseInt(data.height_cm), weight_kg: parseFloat(data.weight_kg),
      goal: toStr(data.goal), experience: data.experience,
      days_per_week: parseInt(data.days_per_week) || 3,
      preferred_days: toStr(data.preferred_days),
      equipment: toStr(data.equipment),
      diet_style: data.diet_style,
      diet_restrictions: data.diet_restrictions || 'none',
      injuries: injuriesField,
    });

    if (!profileRes?.profile) {
      showToast('Failed to save profile — check connection', 'error');
      setGenerating(false);
      return;
    }
    setUserProfile(profileRes.profile);

    setGenStatus('Generating your workout plan...');
    await delay(500);
    setGenStatus('Calculating your macros...');
    await delay(400);
    setGenStatus('Building your meal plan...');

    const planRes = await api('/api/generate-plan', 'POST', { language: appLanguage || 'en' });
    if (planRes?.plan) {
      setUserPlan(planRes.plan);
      localStorage.setItem('forge-cached-plan', JSON.stringify(planRes.plan));
      onComplete();
    } else {
      showToast((planRes?.error || 'Error generating plan') + ' — try again', 'error');
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 24, padding: 32 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, letterSpacing: 6, color: 'var(--accent)' }}>FORGE</div>
        <div className="spin" style={{ width: 32, height: 32 }} />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--muted)', letterSpacing: 2, textAlign: 'center', lineHeight: 2 }} id="gen-status">
          {genStatus}
        </div>
      </div>
    );
  }

  return (
    <div id="screen-onboarding" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowY: 'auto' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: pct + '%', background: 'var(--accent)', transition: 'width 0.3s' }} id="ob-bar" />
      </div>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }} id="ob-step-label">
          STEP {step + 1} OF {total}
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, color: 'var(--text)', lineHeight: 1.1, marginBottom: 6 }} id="ob-title">
          {currentStep.title}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 1, lineHeight: 1.5 }} id="ob-sub">
          {currentStep.sub}
        </div>
      </div>

      {/* Body */}
      <div id="ob-body" style={{ flex: 1, padding: '20px 24px 0', overflowY: 'auto' }}>
        <StepBody
          step={currentStep}
          data={data}
          onSelect={setField}
          onToggle={toggleMulti}
          onSetData={setData}
        />
      </div>

      {/* Nav */}
      <div style={{ padding: '16px 24px 40px', display: 'flex', gap: 12, flexShrink: 0 }}>
        {step > 0 && (
          <button id="ob-back" onClick={() => setStep(s => s - 1)}
            style={{ flex: 1, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            ← Back
          </button>
        )}
        <button id="ob-next" onClick={handleNext}
          disabled={!canAdvance()}
          style={{ flex: 2, padding: 14, background: canAdvance() ? 'var(--accent)' : 'var(--surface)', color: canAdvance() ? '#000' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: canAdvance() ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
          {step === total - 1 ? '🔥 Build My Plan' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

function StepBody({ step, data, onSelect, onToggle, onSetData }) {
  const val = data[step.field];
  const selected = Array.isArray(val) ? val : [];

  // Grid single-select
  if (step.type === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {step.options.map(o => {
          const isSel = data[step.field] == o.value;
          return (
            <div key={o.value} onClick={() => onSelect(step.field, o.value)}
              style={{ background: isSel ? 'rgba(232,255,61,0.08)' : 'var(--surface)', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.15s', userSelect: 'none' }}>
              <div style={{ fontSize: 24 }}>{o.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5 }}>{o.sub}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Multi-select
  if (step.type === 'multi') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {step.options.map(o => {
          const isSel = selected.includes(o.value);
          return (
            <div key={o.value} onClick={() => onToggle(step.field, o.value)}
              style={{ flex: '1 1 calc(50% - 5px)', minWidth: 130, background: isSel ? 'rgba(232,255,61,0.08)' : 'var(--surface)', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.15s', userSelect: 'none' }}>
              <div style={{ fontSize: 24 }}>{o.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5 }}>{o.sub}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Stats
  if (step.type === 'stats') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[
          { id: 'ob-age',    field: 'age',       label: 'Age',    unit: 'YEARS', mode: 'numeric', type: 'number' },
          { id: 'ob-height', field: 'height_cm', label: 'Height', unit: 'CM',    mode: 'numeric', type: 'number' },
          { id: 'ob-weight', field: 'weight_kg', label: 'Weight', unit: 'KG',    mode: 'decimal', type: 'number' },
        ].map(f => (
          <div key={f.field} className="field-group" style={{ margin: 0 }}>
            <div className="field-label">{f.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id={f.id} type={f.type} inputMode={f.mode} placeholder="—"
                value={data[f.field] || ''}
                onChange={e => onSetData(prev => ({ ...prev, [f.field]: e.target.value }))}
                style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', color: 'var(--text)', fontSize: 28, fontFamily: "'Bebas Neue', sans-serif", textAlign: 'center', outline: 'none', letterSpacing: 2 }}
              />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: 1, width: 40 }}>{f.unit}</div>
            </div>
          </div>
        ))}
        <div className="field-group" style={{ margin: 0 }}>
          <div className="field-label">Sex</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ v: 'male', icon: '♂️', label: 'Male' }, { v: 'female', icon: '♀️', label: 'Female' }].map(s => (
              <div key={s.v} onClick={() => onSetData(prev => ({ ...prev, sex: s.v }))}
                style={{ background: data.sex === s.v ? 'rgba(232,255,61,0.08)' : 'var(--surface)', border: `2px solid ${data.sex === s.v ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Day picker
  if (step.type === 'days') {
    const target = parseInt(data.days_per_week) || 3;
    const prefDays = Array.isArray(data.preferred_days) ? data.preferred_days : [];
    return (
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 12 }}>
          SELECT {target} DAY{target !== 1 ? 'S' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WEEK_DAYS.map(d => {
            const isSel = prefDays.includes(d);
            return (
              <div key={d} onClick={() => {
                  const next = isSel ? prefDays.filter(x => x !== d) : [...prefDays, d];
                  onSetData(prev => ({ ...prev, preferred_days: next }));
                }}
                style={{ background: isSel ? 'rgba(232,255,61,0.08)' : 'var(--surface)', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{d}</span>
                {isSel && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Sport name
  if (step.type === 'sport_name') {
    return (
      <div className="field-group" style={{ margin: 0 }}>
        <input className="field-input" type="text" placeholder="e.g. Football, BJJ, Swimming..."
          value={data.sport_name || ''}
          onChange={e => onSetData(prev => ({ ...prev, sport_name: e.target.value }))}
          style={{ fontSize: 16 }}
        />
      </div>
    );
  }

  // Sport days
  if (step.type === 'sport_days') {
    const sportDays = Array.isArray(data.sport_training_days) ? data.sport_training_days : [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {WEEK_DAYS.map(d => {
          const isSel = sportDays.includes(d);
          return (
            <div key={d} onClick={() => {
                const next = isSel ? sportDays.filter(x => x !== d) : [...sportDays, d];
                onSetData(prev => ({ ...prev, sport_training_days: next }));
              }}
              style={{ background: isSel ? 'rgba(232,255,61,0.08)' : 'var(--surface)', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{d}</span>
              {isSel && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // Text / restrictions
  if (step.type === 'text') {
    return (
      <div className="field-group" style={{ margin: 0 }}>
        <textarea
          className="field-input"
          placeholder="e.g. gluten-free, bad knees, no dairy..."
          value={data[step.field] || ''}
          onChange={e => onSetData(prev => ({ ...prev, [step.field]: e.target.value }))}
          rows={4}
          style={{ resize: 'none', lineHeight: 1.6 }}
        />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginTop: 8, letterSpacing: 1 }}>OPTIONAL — leave blank if none</div>
      </div>
    );
  }

  return null;
}
