import { useState } from 'react';
import { useApp } from '../hooks/AppContext';
import { api } from '../lib/api';
import { TIER_PRICES } from '../lib/constants';
import { getTrialDaysLeft } from '../lib/subscription';

const IRON_FEATURES = [
  'AI-generated workout programme',
  'AI-generated 7-day nutrition plan',
  'Workout logging (per-set)',
  'Streak tracking & badges',
  'Personal records detection',
  'Daily push reminders',
  '5 app themes · 12 languages',
  'AI coach — 20 messages/month',
];
const STEEL_FEATURES = [
  'Everything in Iron',
  'Unlimited AI coach messages',
  'Weekly AI performance review',
  'Post-workout AI check-in',
  'Progressive overload tracker',
  'Body metrics & AI insights',
  'Plan editing via AI chat',
  'Deload detection & alerts',
  'Weekly shopping list',
  'Multiple saved programmes',
  'Workout history export',
];
const FORGE_FEATURES = [
  'Everything in Steel',
  'Exercise video demonstrations',
  'Monthly AI deep-dive review',
  'Nutrition barcode scanner',
  'Wearable sync (coming soon)',
  'Priority support',
  'Early access to new features',
];

export default function UpgradeSheet({ highlightTier, onClose }) {
  const { userSubscription, setUserSubscription, showToast } = useApp();
  const [annual, setAnnual] = useState(true);

  const sub = userSubscription || {};
  const currentTier = sub.tier || 'iron';
  const onTrial = sub.status === 'trial';
  const trialDays = getTrialDaysLeft(sub.trialEndsAt);

  async function handleUpgrade(tier) {
    onClose();
    const res = await api('/api/subscription/tier', 'PATCH', { tier });
    if (res?.subscription) {
      setUserSubscription(res.subscription);
    } else if (res) {
      setUserSubscription(prev => ({ ...prev, tier, accessTier: onTrial ? 'forge' : tier }));
    }
    showToast(`Switched to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`, 'success');
  }

  function TierCard({ tier, label, features, recommended }) {
    const isCurrent = currentTier === tier;
    const prices = annual ? TIER_PRICES.annual : TIER_PRICES.monthly;
    const price = prices[tier];
    const isForge = tier === 'forge';
    const isSteel = tier === 'steel';

    let cardStyle = {
      border: '2px solid var(--border)',
      borderRadius: 14,
      padding: 18,
      marginBottom: 12,
      position: 'relative',
      background: 'var(--surface)',
      transition: 'all 0.2s',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    };
    if (isCurrent) {
      cardStyle = { ...cardStyle, borderColor: 'var(--border)', opacity: 0.75 };
    } else if (recommended) {
      cardStyle = { ...cardStyle, borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', boxShadow: '0 4px 30px rgba(255,255,255,0.08)', transform: 'scale(1.02)' };
    } else if (isForge) {
      cardStyle = { ...cardStyle, borderColor: 'rgba(232,255,61,0.3)', background: 'rgba(232,255,61,0.03)', boxShadow: '0 4px 24px rgba(232,255,61,0.06)' };
    }

    const priceColor = recommended ? '#FFD700' : 'var(--accent)';

    let btnText, btnDisabled, btnStyle;
    if (isCurrent) {
      btnText = onTrial ? `Current plan · ${trialDays} days left` : '✓ Your current plan';
      btnDisabled = true;
      btnStyle = { background: 'var(--surface2)', color: 'var(--muted)', border: '2px solid var(--accent)', cursor: 'default' };
    } else if (recommended) {
      btnText = onTrial ? `Switch to ${label.split(' ')[1]} — trial continues` : `Choose ${label.split(' ')[1]}`;
      btnDisabled = false;
      btnStyle = { background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#000', boxShadow: '0 4px 20px rgba(255,215,0,0.3)', cursor: 'pointer' };
    } else if (isForge) {
      btnText = onTrial ? 'Switch to Forge — trial continues' : 'Choose Forge';
      btnDisabled = false;
      btnStyle = { background: 'var(--accent)', color: '#000', boxShadow: '0 4px 20px rgba(232,255,61,0.2)', cursor: 'pointer' };
    } else {
      btnText = onTrial ? `Switch to ${label.split(' ')[1]} — trial continues` : `Choose ${label.split(' ')[1]}`;
      btnDisabled = false;
      btnStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' };
    }

    return (
      <div style={cardStyle}>
        {isCurrent && (
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, fontFamily: "'DM Mono', monospace", letterSpacing: 1, whiteSpace: 'nowrap' }}>
            {onTrial ? `CURRENT PLAN · ${trialDays} DAYS LEFT` : 'CURRENT PLAN'}
          </div>
        )}
        {recommended && !isCurrent && (
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, fontFamily: "'DM Mono', monospace", letterSpacing: 1, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(255,215,0,0.4)' }}>
            RECOMMENDED
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{label}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: priceColor }}>
              {price}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/mo</span>
            </div>
            <div style={{ fontSize: 11, color: annual ? priceColor : 'var(--muted)' }}>
              {annual ? 'billed annually' : `${TIER_PRICES.annual[tier]}/mo if annual`}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => !btnDisabled && handleUpgrade(tier)}
          disabled={btnDisabled}
          style={{ display: 'block', width: '100%', padding: 13, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, textAlign: 'center', border: 'none', transition: 'all 0.15s', ...btnStyle }}
        >
          {btnText}
        </button>
      </div>
    );
  }

  return (
    <div
      id="upgradeSheet"
      className="upgrade-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="upgrade-sheet">
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 3, color: 'var(--accent)' }}>CHOOSE YOUR PLAN</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>7-day free trial · Cancel anytime · 30-day money back</div>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: !annual ? 'var(--text)' : 'var(--muted)' }}>Monthly</span>
          <div
            onClick={() => setAnnual(!annual)}
            style={{ width: 48, height: 26, borderRadius: 13, background: annual ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', top: 3, left: annual ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: annual ? 'var(--text)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Annual
            <span style={{ background: 'rgba(232,255,61,0.12)', border: '1px solid rgba(232,255,61,0.3)', borderRadius: 10, padding: '2px 8px', fontSize: 11, color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>SAVE 20%</span>
          </span>
        </div>

        <TierCard tier="iron"  label="⚙️ Iron"  features={IRON_FEATURES}  recommended={false} />
        <TierCard tier="steel" label="🔩 Steel" features={STEEL_FEATURES} recommended={!highlightTier || highlightTier === 'steel'} />
        <TierCard tier="forge" label="🔥 Forge" features={FORGE_FEATURES} recommended={false} />

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
          Stripe payments coming soon — plans not yet active.
        </div>
        <button className="btn-ghost" onClick={onClose} style={{ marginTop: 8 }}>Maybe later</button>
      </div>
    </div>
  );
}
