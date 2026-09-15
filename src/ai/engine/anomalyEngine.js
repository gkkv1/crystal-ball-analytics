// src/ai/engine/anomalyEngine.js
// Deterministic anomaly detection engine
// Scans all synthetic datasets for unusual patterns using statistical thresholds.
// All anomalies are derived from actual data — never randomly generated.

import { getRevenueByGeo, getRevenueByCluster, getRevenueQuarterlyTrend, getRevenueSummary } from '../tools/revenueTools.js';
import { getFinanceSummary, getMarginTrend, getMarginAnalysis } from '../tools/financeTools.js';
import { getSalesSummary, getPipelineAnalysis } from '../tools/salesTools.js';
import { getDegSummary, getCsiTrendAnalysis } from '../tools/degTools.js';
import { getRmgSummary, getWonHCAnalysis } from '../tools/rmgTools.js';
import { getMeetingsTrendAnalysis } from '../tools/accountTools.js';
import { SEVERITY } from '../types/ai.types.js';

function round1(v) { return Math.round(v * 10) / 10; }

// Compute severity score: higher = more severe
function scoreSeverity(deviationPct, moduleWeight = 1.0, isPersistent = false) {
  const base = Math.abs(deviationPct) / 100;
  const persistence = isPersistent ? 1.3 : 1.0;
  const score = base * moduleWeight * persistence;
  if (score >= 0.25) return SEVERITY.CRITICAL;
  if (score >= 0.15) return SEVERITY.HIGH;
  if (score >= 0.07) return SEVERITY.MEDIUM;
  return SEVERITY.LOW;
}

// ─── Revenue Anomalies ────────────────────────────────────────────────────────
function detectRevenueAnomalies(filters = {}) {
  const anomalies = [];
  const revFilters = { fiscalYear: 'FY27', quarter: 'All', ...filters };
  const dimFilters = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All', ...filters };

  try {
    // 1. Overall AOP achievement
    const kpis = getRevenueSummary(revFilters);
    if (kpis && kpis.aopAchievementPct < 92) {
      const dev = 100 - kpis.aopAchievementPct;
      anomalies.push({
        id:          'rev-aop-miss',
        module:      'revenue',
        severity:    scoreSeverity(dev, 1.0, true),
        title:       'Revenue Below AOP Target',
        description: `Overall revenue is at ${round1(kpis.aopAchievementPct)}% of AOP — ${round1(dev)}pp below target.`,
        driver:      'Underperformance likely concentrated in specific geographies or clusters.',
        metric:      'AOP Achievement %',
        value:       kpis.aopAchievementPct,
        benchmark:   100,
        deviationPct: -dev,
        magnitude:   `${round1(dev)}pp below plan`,
        affectedDimension: 'Overall Portfolio',
        recommendedAction: 'Drill into geo and cluster breakdown to identify primary drag.',
        navigateTo:  'revenue',
        filterPreset: {},
      });
    }

    // 2. Geography anomalies
    const geos = getRevenueByGeo(revFilters);
    const avgAopPct = geos.length
      ? geos.reduce((s, g) => s + g.aopPct, 0) / geos.length
      : 94;

    geos.forEach(g => {
      const deviation = g.aopPct - avgAopPct;
      if (deviation < -8) {
        anomalies.push({
          id:          `rev-geo-${g.geo.replace(/\s/g, '-').toLowerCase()}`,
          module:      'revenue',
          severity:    scoreSeverity(Math.abs(deviation), 0.9, true),
          title:       `${g.geo} Revenue Anomaly`,
          description: `${g.geo} is at ${round1(g.aopPct)}% of AOP — ${round1(Math.abs(deviation))}pp below portfolio average of ${round1(avgAopPct)}%.`,
          driver:      `Revenue shortfall of ${g.gapWithAOP < 0 ? Math.abs(g.gapWithAOP).toFixed(1) : 0} Cr vs AOP in this geography.`,
          metric:      'AOP Achievement %',
          value:       g.aopPct,
          benchmark:   avgAopPct,
          deviationPct: deviation,
          magnitude:   `${round1(Math.abs(deviation))}pp below portfolio average`,
          affectedDimension: g.geo,
          recommendedAction: `Investigate ${g.geo} cluster performance and identify account-level issues.`,
          navigateTo:  'revenue',
          filterPreset: { geo: g.geo },
        });
      }
    });

    // 3. YoY growth anomaly
    if (kpis && kpis.yoyGrowthPct < -5) {
      anomalies.push({
        id:          'rev-yoy-decline',
        module:      'revenue',
        severity:    scoreSeverity(Math.abs(kpis.yoyGrowthPct), 1.0),
        title:       'Negative Year-over-Year Revenue Growth',
        description: `Revenue declined ${round1(Math.abs(kpis.yoyGrowthPct))}% vs prior period — a reversal from expected growth trajectory.`,
        driver:      'Review volume and rate changes across the portfolio.',
        metric:      'YoY Growth %',
        value:       kpis.yoyGrowthPct,
        benchmark:   0,
        deviationPct: kpis.yoyGrowthPct,
        magnitude:   `${round1(Math.abs(kpis.yoyGrowthPct))}% YoY decline`,
        affectedDimension: 'Portfolio',
        recommendedAction: 'Analyze which sub-units and geos drove the YoY decline.',
        navigateTo:  'revenue',
        filterPreset: {},
      });
    }
  } catch (e) {
    console.error('[AnomalyEngine] Revenue anomaly error:', e);
  }

  return anomalies;
}

// ─── Finance Anomalies ────────────────────────────────────────────────────────
function detectFinanceAnomalies(filters = {}) {
  const anomalies = [];
  const dimFilters = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All', ...filters };

  try {
    const margin = getMarginAnalysis(dimFilters);
    if (margin && margin.change < -1.5) {
      anomalies.push({
        id:          'fin-margin-decline',
        module:      'finance',
        severity:    scoreSeverity(Math.abs(margin.change) * 5, 0.9, margin.trend3Y < -2),
        title:       'Gross Margin Erosion Detected',
        description: `Gross margin has declined by ${round1(Math.abs(margin.change))}pp from ${round1(margin.prior)}% to ${round1(margin.current)}%.`,
        driver:      'Likely driven by rising manpower costs and increased bought-out components.',
        metric:      'Gross Margin %',
        value:       margin.current,
        benchmark:   margin.prior,
        deviationPct: margin.change,
        magnitude:   `${round1(Math.abs(margin.change))}pp decline`,
        affectedDimension: 'Portfolio',
        recommendedAction: 'Review cost mix, particularly manpower % and bought-out % by cluster.',
        navigateTo:  'finance',
        filterPreset: {},
      });
    }

    // BTA anomaly
    const kpis = getFinanceSummary(dimFilters);
    if (kpis && kpis.adjustedBTAAvg < 97.5) {
      const dev = 100 - kpis.adjustedBTAAvg;
      anomalies.push({
        id:          'fin-bta-below',
        module:      'finance',
        severity:    scoreSeverity(dev * 3, 0.7),
        title:       'Adjusted BTA Below Threshold',
        description: `Adjusted BTA is at ${round1(kpis.adjustedBTAAvg)}% — ${round1(dev)}pp below the 100% benchmark.`,
        driver:      'Below-benchmark BTA indicates billing rate realization shortfall.',
        metric:      'Adjusted BTA %',
        value:       kpis.adjustedBTAAvg,
        benchmark:   100,
        deviationPct: -dev,
        magnitude:   `${round1(dev)}pp below benchmark`,
        affectedDimension: 'Portfolio',
        recommendedAction: 'Review billing rate negotiations and contract terms by sub-unit.',
        navigateTo:  'finance',
        filterPreset: {},
      });
    }
  } catch (e) {
    console.error('[AnomalyEngine] Finance anomaly error:', e);
  }

  return anomalies;
}

// ─── Sales Anomalies ──────────────────────────────────────────────────────────
function detectSalesAnomalies(filters = {}) {
  const anomalies = [];
  const salesFilters = { fiscalYear: 'FY27', quarter: 'All', salesGeo: 'All', ai: 'All', newRenew: 'All', ...filters };

  try {
    const kpis = getSalesSummary(salesFilters);
    if (kpis && kpis.achievedPct < 70) {
      anomalies.push({
        id:          'sales-achievement-low',
        module:      'sales',
        severity:    scoreSeverity(100 - kpis.achievedPct, 0.8, true),
        title:       'TCV Achievement Significantly Below Plan',
        description: `Sales TCV achievement is at ${round1(kpis.achievedPct)}% — ${round1(100 - kpis.achievedPct)}pp below AOP target.`,
        driver:      'Large deal slippage and qualified pipeline decline are likely contributors.',
        metric:      'TCV Achievement %',
        value:       kpis.achievedPct,
        benchmark:   100,
        deviationPct: kpis.achievedPct - 100,
        magnitude:   `${round1(100 - kpis.achievedPct)}pp below plan`,
        affectedDimension: 'Sales Portfolio',
        recommendedAction: 'Review large deal status and pipeline conversion rates.',
        navigateTo:  'sales',
        filterPreset: {},
      });
    }

    const pipeline = getPipelineAnalysis(salesFilters);
    if (pipeline && pipeline.pipelineChangePct < -15) {
      anomalies.push({
        id:          'sales-pipeline-drop',
        module:      'sales',
        severity:    scoreSeverity(Math.abs(pipeline.pipelineChangePct), 0.8),
        title:       'Sales Pipeline Declining',
        description: `TCV pipeline declined ${round1(Math.abs(pipeline.pipelineChangePct))}% vs prior period, indicating potential future revenue risk.`,
        driver:      'Reduced deal qualification activity or competitive losses.',
        metric:      'Pipeline Change %',
        value:       pipeline.pipelineChangePct,
        benchmark:   0,
        deviationPct: pipeline.pipelineChangePct,
        magnitude:   `${round1(Math.abs(pipeline.pipelineChangePct))}% decline`,
        affectedDimension: 'Sales Pipeline',
        recommendedAction: 'Accelerate pipeline generation and review stalled opportunities.',
        navigateTo:  'sales',
        filterPreset: {},
      });
    }
  } catch (e) {
    console.error('[AnomalyEngine] Sales anomaly error:', e);
  }

  return anomalies;
}

// ─── DEG Anomalies ────────────────────────────────────────────────────────────
function detectDegAnomalies(filters = {}) {
  const anomalies = [];
  const dimFilters = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All', ...filters };

  try {
    const csi = getCsiTrendAnalysis(dimFilters);
    if (csi && csi.recentChange < -0.8) {
      anomalies.push({
        id:          'deg-csi-decline',
        module:      'deg',
        severity:    scoreSeverity(Math.abs(csi.recentChange) * 10, 0.65),
        title:       'CSI Score Declining',
        description: `CSI score dropped ${round1(Math.abs(csi.recentChange))}pp from ${round1(csi.previous)}% to ${round1(csi.current)}% in the latest period.`,
        driver:      'Increase in low-CSI project count or delivery quality issues.',
        metric:      'CSI Score',
        value:       csi.current,
        benchmark:   csi.previous,
        deviationPct: csi.recentChange,
        magnitude:   `${round1(Math.abs(csi.recentChange))}pp decline`,
        affectedDimension: 'Customer Portfolio',
        recommendedAction: 'Identify accounts with lowest CSI scores and initiate service recovery.',
        navigateTo:  'deg',
        filterPreset: {},
      });
    }

    const kpis = getDegSummary(dimFilters);
    if (kpis && kpis.lowCsiPct > 8) {
      anomalies.push({
        id:          'deg-low-csi-high',
        module:      'deg',
        severity:    scoreSeverity(kpis.lowCsiPct - 5, 0.65),
        title:       'High Low-CSI Project Count',
        description: `${round1(kpis.lowCsiPct)}% of projects have low CSI scores — above the 5% warning threshold.`,
        driver:      'Multiple accounts may be at risk of dissatisfaction or churn.',
        metric:      'Low CSI %',
        value:       kpis.lowCsiPct,
        benchmark:   5,
        deviationPct: kpis.lowCsiPct - 5,
        magnitude:   `${round1(kpis.lowCsiPct - 5)}pp above threshold`,
        affectedDimension: `${kpis.lowCsiCount} projects`,
        recommendedAction: 'Prioritize delivery improvement plans for low-CSI accounts.',
        navigateTo:  'deg',
        filterPreset: {},
      });
    }
  } catch (e) {
    console.error('[AnomalyEngine] DEG anomaly error:', e);
  }

  return anomalies;
}

// ─── RMG Anomalies ────────────────────────────────────────────────────────────
function detectRmgAnomalies(filters = {}) {
  const anomalies = [];
  const dimFilters = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All', ...filters };

  try {
    const wonHC = getWonHCAnalysis(dimFilters);
    if (wonHC && wonHC.changePct < -15) {
      anomalies.push({
        id:          'rmg-hc-decline',
        module:      'rmg',
        severity:    scoreSeverity(Math.abs(wonHC.changePct), 0.6),
        title:       'WON HC Weekly Additions Declining',
        description: `WON HC weekly additions declined ${round1(Math.abs(wonHC.changePct))}% — from average ${wonHC.earlierAvg} to ${wonHC.recentAvg} headcount/week.`,
        driver:      'Reduced demand from accounts or hiring slowdown in key clusters.',
        metric:      'WON HC (weekly avg)',
        value:       wonHC.recentAvg,
        benchmark:   wonHC.earlierAvg,
        deviationPct: wonHC.changePct,
        magnitude:   `${round1(Math.abs(wonHC.changePct))}% decline in weekly additions`,
        affectedDimension: 'HC Pipeline',
        recommendedAction: 'Review talent demand by cluster and accelerate talent placement.',
        navigateTo:  'rmg',
        filterPreset: {},
      });
    }
  } catch (e) {
    console.error('[AnomalyEngine] RMG anomaly error:', e);
  }

  return anomalies;
}

// ─── Account / Meetings Anomalies ─────────────────────────────────────────────
function detectAccountAnomalies(filters = {}) {
  const anomalies = [];
  const dimFilters = { bgCluster: 'All', groupClient: 'All', iaeBdd: 'All', iaeBrm: 'All', iaeGeoHead: 'All', ...filters };

  try {
    const meetings = getMeetingsTrendAnalysis(dimFilters);
    if (meetings && meetings.changePct < -15) {
      anomalies.push({
        id:          'acct-meetings-decline',
        module:      'account',
        severity:    scoreSeverity(Math.abs(meetings.changePct), 0.7),
        title:       'Client Engagement Activity Declining',
        description: `Client meetings declined ${round1(Math.abs(meetings.changePct))}% — from ${meetings.recentAvg} to lower recent activity.`,
        driver:      'Reduced executive touch-points may signal relationship risk.',
        metric:      'Meeting Frequency',
        value:       meetings.recentAvg,
        benchmark:   meetings.recentAvg * (1 + Math.abs(meetings.changePct) / 100),
        deviationPct: meetings.changePct,
        magnitude:   `${round1(Math.abs(meetings.changePct))}% fewer meetings`,
        affectedDimension: 'Client Portfolio',
        recommendedAction: 'Identify accounts with no recent meetings and schedule executive engagements.',
        navigateTo:  'account',
        filterPreset: {},
      });
    }
  } catch (e) {
    console.error('[AnomalyEngine] Account anomaly error:', e);
  }

  return anomalies;
}

// ─── Main Anomaly Scanner ─────────────────────────────────────────────────────
export function detectAllAnomalies(filters = {}) {
  const all = [
    ...detectRevenueAnomalies(filters),
    ...detectFinanceAnomalies(filters),
    ...detectSalesAnomalies(filters),
    ...detectDegAnomalies(filters),
    ...detectRmgAnomalies(filters),
    ...detectAccountAnomalies(filters),
  ];

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return all.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));
}

// ─── Single module anomaly scan ───────────────────────────────────────────────
export function detectModuleAnomalies(module, filters = {}) {
  switch (module) {
    case 'revenue': return detectRevenueAnomalies(filters);
    case 'finance': return detectFinanceAnomalies(filters);
    case 'sales':   return detectSalesAnomalies(filters);
    case 'deg':     return detectDegAnomalies(filters);
    case 'rmg':     return detectRmgAnomalies(filters);
    case 'account': return detectAccountAnomalies(filters);
    default:        return detectAllAnomalies(filters);
  }
}
