// ── FORGE THEME SYSTEM ───────────────────────────────────────
// Matches the exact CSS variables used in the original app

export const THEME_VARS = {
  'dark-yellow': {
    '--bg': '#0a0a0a', '--surface': '#111111', '--surface2': '#1a1a1a',
    '--border': '#222222', '--accent': '#e8ff3d', '--accent2': '#ff6b35',
    '--text': '#f0f0f0', '--muted': '#666666',
  },
  'dark-blue': {
    '--bg': '#090d1a', '--surface': '#0f1628', '--surface2': '#162035',
    '--border': '#1e2d4a', '--accent': '#4d9fff', '--accent2': '#ff6b35',
    '--text': '#e8f0ff', '--muted': '#4a6080',
  },
  'dark-green': {
    '--bg': '#090f0a', '--surface': '#0f1810', '--surface2': '#162018',
    '--border': '#1e301f', '--accent': '#39d98a', '--accent2': '#ff6b35',
    '--text': '#e8f5ea', '--muted': '#3d6645',
  },
  'midnight': {
    '--bg': '#05050f', '--surface': '#0a0a1e', '--surface2': '#10102a',
    '--border': '#1a1a38', '--accent': '#bf9fff', '--accent2': '#ff6b9d',
    '--text': '#e8e8ff', '--muted': '#5050a0',
  },
  'light': {
    '--bg': '#f5f5f0', '--surface': '#ffffff', '--surface2': '#f0f0eb',
    '--border': '#e0e0d8', '--accent': '#1a1a1a', '--accent2': '#ff6b35',
    '--text': '#1a1a1a', '--muted': '#888888',
  },
};

export function applyTheme(theme) {
  const vars = THEME_VARS[theme] || THEME_VARS['dark-yellow'];
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  localStorage.setItem('forge_theme', theme);
}

export function loadTheme() {
  const saved = localStorage.getItem('forge_theme') || 'dark-yellow';
  applyTheme(saved);
  return saved;
}
