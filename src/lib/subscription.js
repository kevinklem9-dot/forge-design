import { STEEL_FEATURES, FORGE_FEATURES } from './constants';

export function canAccess(feature, tier, isExempt) {
  if (isExempt) return true;
  if (tier === 'forge') return true;
  if (tier === 'steel') return STEEL_FEATURES.includes(feature) || !FORGE_FEATURES.includes(feature);
  return !STEEL_FEATURES.includes(feature) && !FORGE_FEATURES.includes(feature);
}

export function hasAccess(feature, accessTier, isExempt) {
  return canAccess(feature, accessTier, isExempt);
}

export function getTrialDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.floor((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)));
}
