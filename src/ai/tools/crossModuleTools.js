// src/ai/tools/crossModuleTools.js
// AI Tool Layer — Cross-Module Aggregation
// Combines all module summaries for holistic analysis questions.

import { getRevenueSummary, getBestAndWorstGeo, getBestAndWorstCluster } from './revenueTools.js';
import { getFinanceSummary, getMarginAnalysis } from './financeTools.js';
import { getSalesSummary, getPipelineAnalysis } from './salesTools.js';
import { getDegSummary, getCsiTrendAnalysis } from './degTools.js';
import { getRmgSummary, getWonHCAnalysis } from './rmgTools.js';
import { getAccountSummary, getMeetingsTrendAnalysis } from './accountTools.js';

// ─── Full Cross-Module Summary ────────────────────────────────────────────────
// Called by: executive summary, cross-module questions, watchtower alerts
export function getAllModuleSummaries(filters = {}) {
  // Revenue uses dashboard filters; others use dimension-only filters
  const dimFilters = {
    bgCluster:   filters.bgCluster   || 'All',
    bg:          filters.bg          || 'All',
    subUnit:     filters.subUnit     || 'All',
    geo:         filters.geo         || 'All',
    groupClient: filters.groupClient || 'All',
  };

  const revFilters = {
    ...filters,
    fiscalYear: filters.fiscalYear || 'FY27',
    quarter:    filters.quarter    || 'All',
  };

  try {
    const revenue        = getRevenueSummary(revFilters);
    const revGeo         = getBestAndWorstGeo(revFilters);
    const revCluster     = getBestAndWorstCluster(revFilters);
    const finance        = getFinanceSummary(dimFilters);
    const marginAnalysis = getMarginAnalysis(dimFilters);
    const sales          = getSalesSummary({ ...revFilters, salesGeo: 'All', ai: 'All', newRenew: 'All' });
    const pipeline       = getPipelineAnalysis({ ...revFilters, salesGeo: 'All', ai: 'All', newRenew: 'All' });
    const deg            = getDegSummary(dimFilters);
    const csiAnalysis    = getCsiTrendAnalysis(dimFilters);
    const rmg            = getRmgSummary(dimFilters);
    const wonHCAnalysis  = getWonHCAnalysis(dimFilters);
    const account        = getAccountSummary(dimFilters);
    const meetings       = getMeetingsTrendAnalysis(dimFilters);

    return {
      revenue: { kpis: revenue, geo: revGeo, cluster: revCluster },
      finance: { kpis: finance, margin: marginAnalysis },
      sales:   { kpis: sales, pipeline },
      deg:     { kpis: deg, csi: csiAnalysis },
      rmg:     { kpis: rmg, wonHC: wonHCAnalysis },
      account: { kpis: account, meetings },
    };
  } catch (e) {
    console.error('[CrossModuleTools] Error:', e);
    return null;
  }
}

// ─── Risk Assessment ──────────────────────────────────────────────────────────
export function getRiskSummary(filters = {}) {
  const all = getAllModuleSummaries(filters);
  if (!all) return [];

  const risks = [];

  // Revenue risk
  if (all.revenue.kpis) {
    const aopPct = all.revenue.kpis.aopAchievementPct || 0;
    if (aopPct < 90) {
      risks.push({
        module: 'revenue',
        severity: aopPct < 80 ? 'critical' : 'high',
        title: `Revenue at ${aopPct.toFixed(1)}% of AOP`,
        detail: `Revenue is ${(100 - aopPct).toFixed(1)}pp below AOP target.`,
      });
    }
  }

  // Finance risk
  if (all.finance.margin) {
    const change = all.finance.margin.change || 0;
    if (change < -1) {
      risks.push({
        module: 'finance',
        severity: change < -2.5 ? 'high' : 'medium',
        title: `Gross margin down ${Math.abs(change).toFixed(1)}pp`,
        detail: `Margin declined from ${all.finance.margin.prior?.toFixed(1)}% to ${all.finance.margin.current?.toFixed(1)}%.`,
      });
    }
  }

  // Sales pipeline risk
  if (all.sales.pipeline && all.sales.pipeline.pipelineChangePct < -10) {
    const pct = all.sales.pipeline.pipelineChangePct;
    risks.push({
      module: 'sales',
      severity: pct < -20 ? 'high' : 'medium',
      title: `Pipeline declined ${Math.abs(pct).toFixed(1)}%`,
      detail: 'TCV pipeline declining may indicate future revenue risk.',
    });
  }

  // DEG/CSI risk
  if (all.deg.csi && all.deg.csi.recentChange < -0.8) {
    risks.push({
      module: 'deg',
      severity: 'medium',
      title: `CSI score dropped ${Math.abs(all.deg.csi.recentChange).toFixed(1)}pp`,
      detail: `Customer satisfaction declining from ${all.deg.csi.previous?.toFixed(1)} to ${all.deg.csi.current?.toFixed(1)}.`,
    });
  }

  // RMG risk
  if (all.rmg.wonHC && all.rmg.wonHC.changePct < -15) {
    risks.push({
      module: 'rmg',
      severity: 'medium',
      title: `WON HC declining (${all.rmg.wonHC.changePct.toFixed(1)}%)`,
      detail: 'Headcount additions are below recent trend.',
    });
  }

  return risks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });
}
