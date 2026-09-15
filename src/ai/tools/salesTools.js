// src/ai/tools/salesTools.js
// AI Tool Layer — Sales Module
// Wraps salesCalculations.js for AI engine consumption.

import { RAW_SALES_RECORDS, SALES_OPPORTUNITIES, LARGE_DEAL_THRESHOLD } from '../../data/salesData.js';
import {
  getFilteredSales,
  getFilteredOpps,
  calculateSalesKPIs,
  getTCVByFY,
  getClusterTCVPerformance,
  getLargeDeals,
} from '../../utils/salesCalculations.js';

const DEFAULT_FILTERS = { fiscalYear: 'FY27', quarter: 'All', bgCluster: 'All', bg: 'All', subUnit: 'All', salesGeo: 'All', groupClient: 'All', ai: 'All', newRenew: 'All' };

function mergeFilters(filters) {
  return { ...DEFAULT_FILTERS, ...filters };
}

// ─── Sales KPI Summary ────────────────────────────────────────────────────────
export function getSalesSummary(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredSales(RAW_SALES_RECORDS, f);
  return calculateSalesKPIs(filtered);
}

// ─── TCV by FY Trend ──────────────────────────────────────────────────────────
export function getSalesTCVTrend(filters = {}) {
  const f = mergeFilters(filters);
  return getTCVByFY(RAW_SALES_RECORDS, f);
}

// ─── TCV by Cluster ───────────────────────────────────────────────────────────
export function getSalesByCluster(filters = {}) {
  const f = mergeFilters(filters);
  return getTCVByCluster(RAW_SALES_RECORDS, f);
}

// ─── Large Deals ─────────────────────────────────────────────────────────────
export function getSalesLargeDeals(filters = {}) {
  const f = mergeFilters(filters);
  return getLargeDeals(SALES_OPPORTUNITIES, f, LARGE_DEAL_THRESHOLD);
}

// ─── Pipeline Analysis ────────────────────────────────────────────────────────
export function getPipelineAnalysis(filters = {}) {
  const f = mergeFilters(filters);
  const filtered = getFilteredSales(RAW_SALES_RECORDS, f);
  const kpis = calculateSalesKPIs(filtered);
  if (!kpis) return null;

  // Compare to prior quarter
  const priorF = { ...f, quarter: 'Q1' };
  const priorFiltered = getFilteredSales(RAW_SALES_RECORDS, priorF);
  const priorKpis = calculateSalesKPIs(priorFiltered);

  const pipelineChange = priorKpis
    ? ((kpis.tcvPipeline - priorKpis.tcvPipeline) / Math.max(priorKpis.tcvPipeline, 1)) * 100
    : 0;

  return {
    current: kpis,
    prior: priorKpis,
    pipelineChangePct: pipelineChange,
    pipelineDirection: pipelineChange >= 0 ? 'increasing' : 'declining',
  };
}

// ─── Quarterly TCV for forecasting ────────────────────────────────────────────
export function getSalesTCVQuarterly(filters = {}) {
  const f = mergeFilters(filters);
  const base = getFilteredSales(RAW_SALES_RECORDS, { ...f, fiscalYear: 'All', quarter: 'All' });
  const FYS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const points = [];

  FYS.forEach(fy => {
    QUARTERS.forEach(q => {
      const rows = base.filter(r => r.fiscalYear === fy && r.quarter === q);
      if (!rows.length) return;
      const won = rows.reduce((s, r) => s + (r.tcvWon || 0), 0);
      if (won > 0) points.push({ label: `${fy} ${q}`, fy, quarter: q, value: won });
    });
  });

  return points;
}
