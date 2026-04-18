import { BACKEND_URL } from './constants';

export async function api(path, method = 'GET', body = null, timeoutMs = 30000) {
  try {
    const session = JSON.parse(
      localStorage.getItem('forge-session') ||
      sessionStorage.getItem('forge-session-temp') ||
      'null'
    );
    const token = session?.access_token;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const opts = {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(BACKEND_URL + path, opts);
    clearTimeout(timer);
    const data = await res.json();
    data._status = res.status;
    return data;
  } catch (e) {
    if (e.name === 'AbortError') return { _error: 'timeout', _status: 0 };
    console.error('API error:', path, e.message);
    return null;
  }
}

export function fmt(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
