// src/ai/tools/financeTools.js
// AI Tool Layer — Finance Module
// Wraps financeCalculations.js for AI engine consumption.

import { RAW_FINANCE_RECORDS } from '../../data/financeData.js';
import {
  getFilteredFinance,
  calculateFinanceKPIs,
  getMarginByFY,
  getCostPctByFY,
  getClusterMarginByFY,
  getYearlyRealizationTrend,
  getYearlyBTATrend,
  getQuarterlyBTATrend,
} from '../../utils/financeCalculations.js';

const DEFAULT_FILTERS = { fiscalYear: 'All', quarter: 'All', bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All' };

function mergeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

// ─── Finance KPI Summary ──────────────────────────────────────────────────────
export function getFinanceSummary(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredFinance(RAW_FINANCE_RECORDS, f);
  const kpis = calculateFinanceKPIs(filtered);
  return kpis;
}

// ─── Gross Margin Trend ───────────────────────────────────────────────────────
export function getMarginTrend(filters = {}) {
  const f = mergeFilters(filters);
  return getMarginByFY(RAW_FINANCE_RECORDS, f);
}

// ─── Cost Breakdown Trend ─────────────────────────────────────────────────────
export function getCostTrend(filters = {}) {
  const f = mergeFilters(filters);
  return getCostPctByFY(RAW_FINANCE_RECORDS, f);
}

// ─── Cluster Margin ───────────────────────────────────────────────────────────
export function getMarginByCluster(filters = {}) {
  const f = mergeFilters(filters);
  return getClusterMarginByFY(RAW_FINANCE_RECORDS, f);
}

// ─── Realization Trend ────────────────────────────────────────────────────────
export function getRealizationTrend(filters = {}) {
  const f = mergeFilters(filters);
  return getYearlyRealizationTrend(RAW_FINANCE_RECORDS, f);
}

// ─── BTA Trend ────────────────────────────────────────────────────────────────
export function getBTATrend(filters = {}) {
  const f = mergeFilters(filters);
  return getYearlyBTATrend(RAW_FINANCE_RECORDS, f);
}

// ─── Margin Analysis ──────────────────────────────────────────────────────────
export function getMarginAnalysis(filters = {}) {
  const trend = getMarginTrend(filters);
  if (!trend.length) return null;

  const current = trend.find(d => d.fy === 'FY27') || trend[trend.length - 1];
  const prior   = trend.find(d => d.fy === 'FY26') || trend[trend.length - 2];
  const fy25    = trend.find(d => d.fy === 'FY25');

  const marginChange = prior ? current.grossMarginPct - prior.grossMarginPct : 0;
  const trend3Y = fy25 ? current.grossMarginPct - fy25.grossMarginPct : 0;

  return {
    current: current.grossMarginPct,
    prior: prior?.grossMarginPct,
    change: marginChange,
    trend3Y,
    direction: marginChange >= 0 ? 'improving' : 'declining',
    data: trend,
  };
}

// ─── Quarterly BTA for forecasting ────────────────────────────────────────────
export function getQuarterlyBTAForForecast(filters = {}) {
  const f = mergeFilters(filters);
  return getQuarterlyBTATrend(RAW_FINANCE_RECORDS, f);
}
