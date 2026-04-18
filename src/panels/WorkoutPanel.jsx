import { useState, useEffect } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';
import ExerciseModal from '../components/ExerciseModal';

export default function WorkoutPanel() {
  const { userPlan, selectedDay, setSelectedDay } = useApp();
  const [modalExercise, setModalExercise] = useState(null);

  const plan = userPlan?.workout_plan;
  const days = plan?.days || [];
  const currentDay = days[selectedDay];

  const isRestDay = !currentDay?.exercises?.length;
  const todayIdx = new Date().getDay(); // 0=Sun

  return (
    <div id="panel-workout" className="panel active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">PLAN</div>
        <div className="panel-sub" id="workout-sub">
          {currentDay ? `${currentDay.name || 'Day ' + (selectedDay + 1)}` : 'Loading your programme...'}
        </div>
      </div>

      {/* Day chips */}
      <div className="day-scroll" id="dayScroll">
        {days.map((day, i) => {
          const labels = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
          const isActive = i === selectedDay;
          const isRest = !day.exercises?.length;
          return (
            <div
              key={i}
              className={`day-chip${isActive ? ' active' : ''}`}
              onClick={() => setSelectedDay(i)}
            >
              <div className="chip-label">{labels[i] || `D${i+1}`}</div>
              <div className="chip-name">{isRest ? 'REST' : (day.name?.split(' ')[0]?.toUpperCase() || 'TRAIN')}</div>
            </div>
          );
        })}
      </div>

      {/* Exercise list */}
      <div id="exerciseList" className="scroll-content" style={{ padding: '10px 18px 80px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isRestDay ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>😴</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, marginBottom: 6 }}>REST DAY</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1 }}>Recovery is training. See you tomorrow.</div>
          </div>
        ) : (
          currentDay?.exercises?.map((ex, i) => (
            <div
              key={i}
              className="exercise-card"
              id={`ex-card-${i}`}
              onClick={() => setModalExercise({ ...ex, index: i })}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, background: 'var(--surface2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                🏋️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ex.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 0.5 }}>
                  {ex.sets} sets · {ex.reps} reps{ex.rest ? ` · Rest ${ex.rest}` : ''}{ex.rpe ? ` · RPE ${ex.rpe}` : ''}
                </div>
                {ex.note && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontStyle: 'italic' }}>{ex.note}</div>
                )}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 14, flexShrink: 0 }}>›</div>
            </div>
          ))
        )}
      </div>

      {/* Exercise Modal */}
      {modalExercise && (
        <ExerciseModal
          exercise={modalExercise}
          onClose={() => setModalExercise(null)}
        />
      )}
    </div>
  );
}
