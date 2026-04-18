// ── FORGE CONSTANTS ──────────────────────────────────────────
export const SUPABASE_URL = 'https://ozhtiqoregcwxkkxohbk.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96aHRpcW9yZWdjd3hra3hvaGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjAxMTAsImV4cCI6MjA5MDMzNjExMH0.DrrZLUgLgtBTfSrhDC_acZ48ZrKQdqltBfAi_0-aTeI';
export const BACKEND_URL = 'https://forge-production-db97.up.railway.app';
export const ADMIN_EMAIL = 'kevinklem9@gmail.com';

export const TIER_LABELS = { iron: '⚙️ Iron', steel: '🔩 Steel', forge: '🔥 Forge' };
export const IRON_COACH_LIMIT = 20;
export const ALL_PANELS = ['coach', 'workout', 'log', 'nutrition', 'progress', 'admin', 'programmes', 'account'];
export const THEMES = ['dark-yellow', 'dark-blue', 'dark-green', 'midnight', 'light'];
export const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const WEEK_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const BADGE_ICONS = ['🥇','🏆','⭐','💎','🔥','⚡','💪','🎯','🏅','🌟','🦾','🚀'];

export const TIER_PRICES = {
  monthly: { iron: '£14.99', steel: '£24.99', forge: '£34.99' },
  annual:  { iron: '£11.99', steel: '£19.99', forge: '£27.99' },
};

export const STEEL_FEATURES = [
  'unlimited_coach','weekly_review','checkin','overload_tracker',
  'body_metrics','plan_editing','deload','shopping_list',
  'multiple_programmes','export_history'
];
export const FORGE_FEATURES = [...STEEL_FEATURES, 'video_demos','monthly_review','barcode'];
