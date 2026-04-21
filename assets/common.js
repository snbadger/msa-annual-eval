// Shared utilities used across pages.

export function qs(param) {
  return new URLSearchParams(window.location.search).get(param);
}

export function toast(msg, ms = 2500, isError = false) {
  let el = document.getElementById('__toast__');
  if (!el) {
    el = document.createElement('div');
    el.id = '__toast__';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.classList.toggle('err', !!isError);
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(el._hide);
  el._hide = setTimeout(() => el.classList.remove('visible'), ms);
}

export function showError(containerOrSelector, msg) {
  const el = typeof containerOrSelector === 'string'
    ? document.querySelector(containerOrSelector)
    : containerOrSelector;
  if (!el) return;
  el.innerHTML = '';
  const banner = document.createElement('div');
  banner.className = 'error-banner';
  banner.textContent = msg;
  el.appendChild(banner);
}

export function setLoading(selector, loading) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.disabled = !!loading;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Working…';
  } else if (btn.dataset.originalText) {
    btn.textContent = btn.dataset.originalText;
  }
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // Fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    return true;
  } finally {
    ta.remove();
  }
}

export function fmtDate(d) {
  if (!d) return '';
  // Postgres date columns come back as 'YYYY-MM-DD' strings. Parsing them with
  // new Date() treats them as UTC midnight, which in PT rolls back to the
  // previous day. Detect and force local-midnight for date-only values.
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US',
      { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function humanRel(d) {
  if (!d) return '';
  const then = new Date(d).getTime();
  const now = Date.now();
  const s = Math.round((now - then) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' hr ago';
  return Math.round(s / 86400) + ' days ago';
}

export function buildReviewerUrl(token) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  return `${base}r.html?t=${encodeURIComponent(token)}`;
}
