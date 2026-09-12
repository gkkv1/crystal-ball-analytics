// src/utils/formatters.js
// Centralized number formatting utilities

/**
 * Format a revenue value as INR Crores
 * e.g. 3085.1 → "₹3,085.1 Cr"
 */
export function formatRevenue(value, { showSymbol = true, showUnit = true, decimals = 1 } = {}) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const formatted = Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = value < 0 ? '-' : '';
  const symbol = showSymbol ? '₹' : '';
  const unit = showUnit ? ' Cr' : '';
  return `${sign}${symbol}${formatted}${unit}`;
}

/**
 * Format a revenue number without symbol/unit for compact table cells
 * e.g. 3085.1 → "3,085.1"
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage value
 * e.g. 88.1 → "88.1%"
 */
export function formatPct(value, { decimals = 1, showSign = false } = {}) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a gap/delta value with sign
 * Positive: "+123.4", Negative: "-123.4"
 */
export function formatGap(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Returns CSS class string for a delta value
 * Positive = success (green), Negative = danger (red)
 */
export function getDeltaClass(value, { inverse = false } = {}) {
  if (value === null || value === undefined || isNaN(value)) return 'text-slate-500';
  const isPositive = inverse ? value < 0 : value >= 0;
  return isPositive ? 'text-emerald-600' : 'text-red-500';
}

/**
 * Format a compact large number (e.g. for chart axis labels)
 * 11348 → "11.3K", 1000000 → "1.0M"
 */
export function formatCompact(value) {
  if (!value && value !== 0) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(1)}`;
}

/**
 * Return color hex for semantic meaning
 */
export const COLORS = {
  aop: '#2563EB',
  actual: '#0891B2',
  target: '#D97706',
  bgProj: '#7C3AED',
  suProj: '#059669',
  qoq: '#F59E0B',
  positive: '#059669',
  negative: '#DC2626',
  warning: '#D97706',
  neutral: '#64748B',
  navy: '#1E3A5F',
};
