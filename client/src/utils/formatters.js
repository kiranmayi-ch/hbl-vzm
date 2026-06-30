import { format, parseISO } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatCurrency(num) {
  if (num === null || num === undefined) return '—';
  return `₹${new Intl.NumberFormat('en-IN').format(num)}`;
}

export function formatPercent(num) {
  if (num === null || num === undefined) return '—';
  return `${Number(num).toFixed(1)}%`;
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'submitted': return 'badge-submitted';
    case 'draft': return 'badge-draft';
    case 'open': return 'badge-open';
    case 'closed': return 'badge-closed';
    case 'pending': return 'badge-pending';
    default: return 'badge-draft';
  }
}

export function getScoreColor(score, max = 5) {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'var(--color-success)';
  if (pct >= 60) return 'var(--accent-amber)';
  if (pct >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function getPercentColor(pct) {
  if (pct >= 80) return 'var(--color-success)';
  if (pct >= 60) return 'var(--accent-amber)';
  if (pct >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}
