// src/ai/tools/revenueTools.js
// AI Tool Layer — Revenue Module
// Thin wrappers around existing calculation functions.
// AI engine calls these; never imports calculation functions directly.

import { RAW_REVENUE_RECORDS } from '../../data/revenueData.js';
import {
  getFilteredData,
  calculateKPIs,
  getGeoBreakdown,
  getClusterBreakdown,
  getBGBreakdown,
  getSubUnitBreakdown,
  getAccountBreakdown,
  getAnnualPerformance,
  getQuarterlyPerformance,
  generateInsights,
} from '../../utils/calculations.js';

const DEFAULT_FILTERS = { fiscalYear: 'FY27', quarter: 'All', bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All' };

function mergeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

// ─── KPI Summary ─────────────────────────────────────────────────────────────
export function getRevenueSummary(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredData(RAW_REVENUE_RECORDS, f);
  const kpis = calculateKPIs(filtered);
  if (!kpis) return null;
  return {
    ...kpis,
    recordCount: filtered.length,
    filters: f,
  };
}

// ─── Geography Breakdown ──────────────────────────────────────────────────────
export function getRevenueByGeo(filters = {}) {
  const f = mergeFilters(filters);
  const data = getGeoBreakdown(RAW_REVENUE_RECORDS, f);
  return data.map(d => ({
    geo: d.label,
    actual: d.actual,
    aop: d.aop,
    target: d.target,
    aopPct: d.aopPct,
    targetPct: d.targetPct,
    gapWithAOP: d.gapWithAOP,
    gapWithTarget: d.gapWithTarget,
    yoyPct: d.yoyPct,
  }));
}

// ─── Cluster Breakdown ────────────────────────────────────────────────────────
export function getRevenueByCluster(filters = {}) {
  const f = mergeFilters(filters);
  return getClusterBreakdown(RAW_REVENUE_RECORDS, f).map(d => ({
    cluster: d.label,
    clusterId: d.id,
    actual: d.actual,
    aop: d.aop,
    target: d.target,
    aopPct: d.aopPct,
    targetPct: d.targetPct,
    gapWithAOP: d.gapWithAOP,
    yoyPct: d.yoyPct,
  }));
}

// ─── Account Breakdown ────────────────────────────────────────────────────────
export function getRevenueByAccount(filters = {}) {
  const f = mergeFilters(filters);
  return getAccountBreakdown(RAW_REVENUE_RECORDS, f)
    .slice(0, 10)
    .map(d => ({
      account: d.label,
      actual: d.actual,
      aop: d.aop,
      aopPct: d.aopPct,
      gapWithAOP: d.gapWithAOP,
    }));
}

// ─── Annual Trend ─────────────────────────────────────────────────────────────
export function getRevenueAnnualTrend(filters = {}) {
  const f = mergeFilters(filters);
  return getAnnualPerformance(RAW_REVENUE_RECORDS, f);
}

// ─── Quarterly Trend (for forecast base) ─────────────────────────────────────
export function getRevenueQuarterlyTrend(filters = {}) {
  const f = mergeFilters(filters);
  return getQuarterlyPerformance(RAW_REVENUE_RECORDS, f)
    .filter(d => d.actual > 0); // exclude future quarters with no actuals
}

// ─── Smart Insights ───────────────────────────────────────────────────────────
export function getRevenueInsights(filters = {}) {
  const f = mergeFilters(filters);
  return generateInsights(RAW_REVENUE_RECORDS, f);
}

// ─── Best / Worst Analysis ────────────────────────────────────────────────────
export function getBestAndWorstGeo(filters = {}) {
  const geos = getRevenueByGeo(filters).filter(g => g.aop > 0);
  if (!geos.length) return { best: null, worst: null };
  const best  = geos.reduce((a, b) => a.aopPct > b.aopPct ? a : b);
  const worst = geos.reduce((a, b) => a.aopPct < b.aopPct ? a : b);
  return { best, worst, all: geos };
}

export function getBestAndWorstCluster(filters = {}) {
  const clusters = getRevenueByCluster(filters).filter(c => c.aop > 0);
  if (!clusters.length) return { best: null, worst: null };
  const best  = clusters.reduce((a, b) => a.aopPct > b.aopPct ? a : b);
  const worst = clusters.reduce((a, b) => a.aopPct < b.aopPct ? a : b);
  return { best, worst, all: clusters };
}

// ─── YoY Comparison ──────────────────────────────────────────────────────────
export function getRevenueYoYComparison(filters = {}) {
  const annual = getRevenueAnnualTrend(filters);
  const current = annual.find(d => d.fy === 'FY27') || annual[annual.length - 1];
  const prior   = annual.find(d => d.fy === 'FY26') || annual[annual.length - 2];
  return { current, prior, annual };
}
