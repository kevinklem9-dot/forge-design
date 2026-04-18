import { useState } from 'react';
import { useApp } from '../hooks/AppContext';

const WEEK_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function NutritionPanel() {
  const { userPlan } = useApp();
  const [tab, setTab]     = useState('macros'); // macros | calendar | shopping
  const [nutDay, setNutDay] = useState(0);

  const plan = userPlan?.nutrition_plan;
  if (!plan) return (
    <div id="panel-nutrition" className="panel active" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="panel-title">NUTRITION</div>
        <div className="panel-sub">Loading your meal plan...</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading...</div>
    </div>
  );

  const meals = plan.meals || [];
  const subLabel = `${plan.calories || '—'} KCAL · ${plan.goal || 'HIGH PROTEIN'}`;

  // Shopping list generation
  function getShoppingList() {
    const items = {};
    meals.forEach(meal => {
      (meal.ingredients || meal.items || []).forEach(item => {
        const name = (typeof item === 'string' ? item : item.name || '').toLowerCase().trim();
        if (name) items[name] = (items[name] || 0) + 1;
      });
    });
    return Object.keys(items).sort();
  }

  function copyShoppingList() {
    const list = getShoppingList().join('\n');
    navigator.clipboard?.writeText(list).then(() => {}).catch(() => {});
  }

  return (
    <div id="panel-nutrition" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">NUTRITION</div>
        <div id="nutrition-sub" className="panel-sub">{subLabel}</div>
      </div>

      {/* Sub-tabs */}
      <div className="chat-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {[
          { id: 'macros',   label: '📊 Macros' },
          { id: 'calendar', label: '📅 Week' },
          { id: 'shopping', label: '🛒 Shopping' },
        ].map(t => (
          <div key={t.id} id={`ntab-${t.id}`} className={`chat-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* MACROS VIEW */}
      {tab === 'macros' && (
        <div id="nview-macros" className="scroll-content" style={{ flex: 1 }}>
          <div className="macro-row">
            {[
              { val: plan.calories, label: 'KCAL' },
              { val: plan.protein_g ? plan.protein_g + 'g' : '—', label: 'PROTEIN' },
              { val: plan.carbs_g ? plan.carbs_g + 'g' : '—', label: 'CARBS' },
              { val: plan.fat_g ? plan.fat_g + 'g' : '—', label: 'FAT' },
            ].map((m, i) => (
              <div key={i} className="macro-card">
                <div className="macro-value">{m.val || '—'}</div>
                <div className="macro-label">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="section-label">DAILY MEAL PLAN</div>
          <div id="mealList" className="meal-list" style={{ padding: '0 18px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meals.map((meal, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{meal.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>
                  {meal.calories ? `${meal.calories} KCAL` : ''}{meal.protein_g ? ` · ${meal.protein_g}G PROTEIN` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {(meal.items || meal.ingredients || []).map((item, j) => (
                    <span key={j}>{typeof item === 'string' ? item : item.name}{j < (meal.items || meal.ingredients || []).length - 1 ? ', ' : ''}</span>
                  ))}
                  {meal.description && <span>{meal.description}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {tab === 'calendar' && (
        <div id="nview-calendar" className="scroll-content" style={{ flex: 1 }}>
          <div className="day-scroll" style={{ borderBottom: '1px solid var(--border)' }}>
            {WEEK_SHORT.map((d, i) => (
              <div key={i} className={`day-chip${nutDay === i ? ' active' : ''}`} onClick={() => setNutDay(i)}>
                <div className="chip-label">{d}</div>
              </div>
            ))}
          </div>
          <div id="nutritionDayMeals" style={{ padding: '14px 18px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {meals.map((meal, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{meal.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {meal.description || (meal.items || []).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHOPPING VIEW */}
      {tab === 'shopping' && (
        <div id="nview-shopping" className="scroll-content" style={{ flex: 1 }}>
          <div style={{ padding: '14px 18px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-label" style={{ padding: 0 }}>WEEKLY SHOPPING LIST</div>
            <button
              onClick={copyShoppingList}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: 'pointer', letterSpacing: 1 }}
            >COPY</button>
          </div>
          <div id="shoppingList" style={{ padding: '0 18px 80px' }}>
            {getShoppingList().map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}></div>
                <div style={{ fontSize: 14, textTransform: 'capitalize' }}>{item}</div>
              </div>
            ))}
            {getShoppingList().length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Shopping list will appear here once your meal plan is loaded.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
