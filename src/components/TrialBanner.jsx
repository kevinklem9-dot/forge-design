import { useApp } from '../hooks/AppContext';
import { getTrialDaysLeft } from '../lib/subscription';

export default function TrialBanner({ onUpgrade }) {
  const { userSubscription } = useApp();
  if (!userSubscription) return null;

  const { status, trialEndsAt, tier, accessTier } = userSubscription;
  const isOnTrial = status === 'trial';
  if (!isOnTrial) return null;

  const days = getTrialDaysLeft(trialEndsAt);

  return (
    <div className="trial-banner">
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--accent)', letterSpacing: 1 }}>
        {days > 0 ? `${days} DAYS LEFT IN TRIAL` : 'TRIAL ENDED'}
      </span>
      <button
        onClick={onUpgrade}
        style={{
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: 'var(--bg)', background: 'var(--accent)',
          border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        }}
      >
        UPGRADE
      </button>
    </div>
  );
}
