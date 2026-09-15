// src/ai/tools/accountTools.js
// AI Tool Layer — Account Module
// Wraps accountCalculations.js for AI engine consumption.

import { RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS } from '../../data/accountData.js';
import {
  getFilteredAccountPerf,
  getFilteredVisits,
  calculatePerformanceKPIs,
  calculateVisitKPIs,
  getMeetingsTrend,
  getMeetingMatrix,
  getFYPerformanceData,
} from '../../utils/accountCalculations.js';

const DEFAULT_FILTERS = { bgCluster: 'All', groupClient: 'All', iaeBdd: 'All', iaeBrm: 'All', iaeGeoHead: 'All' };

function mergeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

// ─── Account Performance Summary ─────────────────────────────────────────────
export function getAccountSummary(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredAccountPerf(RAW_ACCOUNT_PERFORMANCE, f);
  return calculatePerformanceKPIs(filtered);
}

// ─── Client Meetings Summary ──────────────────────────────────────────────────
export function getMeetingsActivity(filters = {}) {
  const f = mergeFilters(filters);
  const filteredVisits = getFilteredVisits(RAW_CLIENT_VISITS, f);
  return calculateVisitKPIs(filteredVisits);
}

// ─── Meetings Trend ───────────────────────────────────────────────────────────
export function getMeetingsTrendData(filters = {}) {
  const f = mergeFilters(filters);
  const filteredVisits = getFilteredVisits(RAW_CLIENT_VISITS, f);
  return getMeetingsTrend(filteredVisits);
}

// ─── Top Accounts by Meetings ─────────────────────────────────────────────────
export function getTopAccountsByMeetings(filters = {}) {
  const f = mergeFilters(filters);
  const filteredVisits = getFilteredVisits(RAW_CLIENT_VISITS, f);
  const matrix = getMeetingMatrix(filteredVisits);
  return matrix.rows.slice(0, 10);
}

// ─── Account FY Performance ───────────────────────────────────────────────────
export function getAccountFYPerformance(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredAccountPerf(RAW_ACCOUNT_PERFORMANCE, f);
  return getFYPerformanceData(filtered, 'revenue');
}

// ─── Meetings Trend Analysis ──────────────────────────────────────────────────
export function getMeetingsTrendAnalysis(filters = {}) {
  const trend = getMeetingsTrendData(filters);
  if (!trend.length) return null;

  const recent  = trend.slice(-3).reduce((s, d) => s + d.count, 0);
  const earlier = trend.slice(0, -3).reduce((s, d) => s + d.count, 0);
  const earlierAvg = trend.length > 3 ? earlier / (trend.length - 3) : recent / 3;
  const recentAvg = recent / 3;

  const changePct = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

  const totalMeetings = trend.reduce((s, d) => s + d.count, 0);
  const bestMonth = trend.reduce((a, b) => a.count > b.count ? a : b, trend[0]);

  return {
    totalMeetings,
    recentAvg: Math.round(recentAvg),
    changePct,
    direction: changePct >= 0 ? 'increasing' : 'declining',
    bestMonth,
    data: trend,
  };
}
