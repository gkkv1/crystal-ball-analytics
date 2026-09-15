// src/ai/tools/degTools.js
// AI Tool Layer — DEG Module
// Wraps degCalculations.js for AI engine consumption.

import { RAW_DEG_RECORDS } from '../../data/degData.js';
import {
  getFilteredDeg,
  calculateDegKPIs,
  getCsiTrend,
  getCsiBySubUnit,
} from '../../utils/degCalculations.js';

const DEFAULT_FILTERS = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All' };

function mergeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

// ─── DEG KPI Summary ──────────────────────────────────────────────────────────
export function getDegSummary(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredDeg(RAW_DEG_RECORDS, f);
  return calculateDegKPIs(filtered);
}

// ─── CSI Trend ────────────────────────────────────────────────────────────────
export function getCsiTrendData(filters = {}) {
  const f = mergeFilters(filters);
  return getCsiTrend(RAW_DEG_RECORDS, f);
}

// ─── CSI by Sub Unit ──────────────────────────────────────────────────────────
export function getCsiBySubUnitData(filters = {}) {
  const f = mergeFilters(filters);
  return getCsiBySubUnit(RAW_DEG_RECORDS, f);
}

// ─── CSI Trend Analysis ───────────────────────────────────────────────────────
export function getCsiTrendAnalysis(filters = {}) {
  const trend = getCsiTrendData(filters);
  if (trend.length < 2) return null;

  const last    = trend[trend.length - 1];
  const prev    = trend[trend.length - 2];
  const first   = trend[0];

  const recentChange = last.csiScore - prev.csiScore;
  const overallChange = last.csiScore - first.csiScore;
  const direction = recentChange >= 0 ? 'improving' : 'declining';

  // Find best and worst periods
  const best  = trend.reduce((a, b) => a.csiScore > b.csiScore ? a : b);
  const worst = trend.reduce((a, b) => a.csiScore < b.csiScore ? a : b);

  return {
    current: last.csiScore,
    previous: prev.csiScore,
    recentChange,
    overallChange,
    direction,
    best,
    worst,
    data: trend,
  };
}
