// src/ai/tools/rmgTools.js
// AI Tool Layer — RMG Module
// Wraps rmgCalculations.js for AI engine consumption.

import { RAW_RMG_RECORDS, RMG_WEEKS } from '../../data/rmgData.js';
import {
  getFilteredRmg,
  calculateRmgKPIs,
  getWonHCTrend,
  getBgClusterWiseTrend,
} from '../../utils/rmgCalculations.js';

const DEFAULT_FILTERS = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All' };

function mergeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

// ─── RMG KPI Summary ─────────────────────────────────────────────────────────
export function getRmgSummary(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredRmg(RAW_RMG_RECORDS, f);
  return calculateRmgKPIs(filtered);
}

// ─── WON HC Trend ────────────────────────────────────────────────────────────
export function getWonHCTrendData(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredRmg(RAW_RMG_RECORDS, f);
  return getWonHCTrend(filtered);
}

// ─── Cluster WON HC Trend ────────────────────────────────────────────────────
export function getWonHCByCluster(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredRmg(RAW_RMG_RECORDS, f);
  return getBgClusterWiseTrend(filtered);
}

// ─── WON HC Trend Analysis ───────────────────────────────────────────────────
export function getWonHCAnalysis(filters = {}) {
  const trend = getWonHCTrendData(filters);
  if (trend.length < 2) return null;

  const recent = trend.slice(-3);
  const earlier = trend.slice(0, -3);

  const recentAvg  = recent.reduce((s, d) => s + d.wonHC, 0) / recent.length;
  const earlierAvg = earlier.length ? earlier.reduce((s, d) => s + d.wonHC, 0) / earlier.length : recentAvg;

  const changePct = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

  const best  = trend.reduce((a, b) => a.wonHC > b.wonHC ? a : b);
  const worst = trend.reduce((a, b) => a.wonHC < b.wonHC ? a : b);

  return {
    recentAvg: Math.round(recentAvg),
    earlierAvg: Math.round(earlierAvg),
    changePct,
    direction: changePct >= 0 ? 'increasing' : 'declining',
    best,
    worst,
    data: trend,
  };
}
