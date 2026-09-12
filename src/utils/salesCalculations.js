// src/utils/salesCalculations.js
// Pure calculation engine for Sales Performance module
// All functions are side-effect free

import { DIMENSION_TREE } from '../data/dimensions.js';
import { SALES_GEO_LIST, SALES_OPPORTUNITIES } from '../data/salesData.js';

const FYS      = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// ─── Core filter ─────────────────────────────────────────────────────────
export function getFilteredSales(records, filters) {
  return records.filter(r => {
    if (filters.fiscalYear && filters.fiscalYear !== 'All' && r.fiscalYear !== filters.fiscalYear) return false;
    if (filters.quarter    && filters.quarter    !== 'All' && r.quarter    !== filters.quarter)    return false;
    if (filters.bgCluster  && filters.bgCluster  !== 'All' && r.bgCluster  !== filters.bgCluster)  return false;
    if (filters.bg         && filters.bg         !== 'All' && r.bg         !== filters.bg)         return false;
    if (filters.subUnit    && filters.subUnit    !== 'All' && r.subUnit    !== filters.subUnit)    return false;
    if (filters.salesGeo   && filters.salesGeo   !== 'All' && r.salesGeo   !== filters.salesGeo)   return false;
    if (filters.groupClient&& filters.groupClient!== 'All' && r.groupClient!== filters.groupClient) return false;
    if (filters.ai         && filters.ai         !== 'All' && r.ai         !== filters.ai)         return false;
    if (filters.newRenew   && filters.newRenew   !== 'All' && r.newRenew   !== filters.newRenew)   return false;
    return true;
  });
}

export function getFilteredOpps(opps, filters) {
  return opps.filter(o => {
    if (filters.fiscalYear && filters.fiscalYear !== 'All' && o.fiscalYear !== filters.fiscalYear) return false;
    if (filters.quarter    && filters.quarter    !== 'All' && o.quarter    !== filters.quarter)    return false;
    if (filters.bgCluster  && filters.bgCluster  !== 'All' && o.bgCluster  !== filters.bgCluster)  return false;
    if (filters.bg         && filters.bg         !== 'All' && o.bg         !== filters.bg)         return false;
    if (filters.subUnit    && filters.subUnit    !== 'All' && o.subUnit    !== filters.subUnit)    return false;
    if (filters.salesGeo   && filters.salesGeo   !== 'All' && o.salesGeo   !== filters.salesGeo)   return false;
    if (filters.groupClient&& filters.groupClient!== 'All' && o.groupClient!== filters.groupClient) return false;
    if (filters.ai         && filters.ai         !== 'All' && o.ai         !== filters.ai)         return false;
    if (filters.newRenew   && filters.newRenew   !== 'All' && o.newRenew   !== filters.newRenew)   return false;
    return true;
  });
}

// ─── Aggregators ─────────────────────────────────────────────────────────
function sumF(arr, f)  { return arr.reduce((a, r) => a + (r[f] || 0), 0); }
function r2(v) { return Math.round(v * 100) / 100; }
function pct(a, b)     { return b > 0 ? r2((a / b) * 100) : 0; }

// ─── KPI summary ─────────────────────────────────────────────────────────
export function calculateSalesKPIs(filtered) {
  if (!filtered.length) return null;
  const tcvAOP      = r2(sumF(filtered, 'tcvAOP'));
  const tcvWon      = r2(sumF(filtered, 'tcvWon'));
  const tcvPipeline = r2(sumF(filtered, 'tcvPipeline'));
  const tcvQual     = r2(sumF(filtered, 'tcvQualified'));
  const ndAOP       = r2(sumF(filtered, 'newDealAOP'));
  const ndWon       = r2(sumF(filtered, 'newDealWon'));
  const ndPipe      = r2(sumF(filtered, 'newDealPipeline'));
  return {
    tcvAOP, tcvWon,
    achievedPct:      pct(tcvWon, tcvAOP),
    tcvPipeline, tcvQual,
    newDealAOP:  ndAOP, newDealWon: ndWon,
    newDealPct:       pct(ndWon, ndAOP),
    newDealPipeline:  ndPipe,
    opportunityCount: filtered.length,
  };
}

// ─── FY Trend ─────────────────────────────────────────────────────────────
export function getTCVByFY(all, filters) {
  const base = getFilteredSales(all, { ...filters, fiscalYear: 'All', quarter: 'All' });
  return FYS.map(fy => {
    const rows = base.filter(r => r.fiscalYear === fy);
    const aop  = r2(sumF(rows, 'tcvAOP'));
    const won  = r2(sumF(rows, 'tcvWon'));
    return { fy, tcvAOP: aop, tcvWon: won, achievedPct: pct(won, aop) };
  });
}

export function getNewDealByFY(all, filters) {
  const base = getFilteredSales(all, { ...filters, fiscalYear: 'All', quarter: 'All' });
  return FYS.map(fy => {
    const rows = base.filter(r => r.fiscalYear === fy);
    const aop  = r2(sumF(rows, 'newDealAOP'));
    const won  = r2(sumF(rows, 'newDealWon'));
    return { fy, newDealAOP: aop, newDealWon: won, achievedPct: pct(won, aop) };
  });
}

// ─── Quarterly Trend ──────────────────────────────────────────────────────
export function getTCVByQuarter(all, filters) {
  const base   = getFilteredSales(all, { ...filters, fiscalYear: 'All', quarter: 'All' });
  const points = [];
  FYS.forEach(fy => {
    QUARTERS.forEach(q => {
      const rows = base.filter(r => r.fiscalYear === fy && r.quarter === q);
      if (!rows.length) return;
      const aop = r2(sumF(rows, 'tcvAOP'));
      const won = r2(sumF(rows, 'tcvWon'));
      points.push({ label: `${fy} ${q}`, fy, quarter: q, tcvAOP: aop, tcvWon: won, achievedPct: pct(won, aop) });
    });
  });
  return points;
}

export function getNewDealByQuarter(all, filters) {
  const base   = getFilteredSales(all, { ...filters, fiscalYear: 'All', quarter: 'All' });
  const points = [];
  FYS.forEach(fy => {
    QUARTERS.forEach(q => {
      const rows = base.filter(r => r.fiscalYear === fy && r.quarter === q);
      if (!rows.length) return;
      const aop = r2(sumF(rows, 'newDealAOP'));
      const won = r2(sumF(rows, 'newDealWon'));
      points.push({ label: `${fy} ${q}`, fy, quarter: q, newDealAOP: aop, newDealWon: won, achievedPct: pct(won, aop) });
    });
  });
  return points;
}

// ─── Qualified Pipeline by Quarter ───────────────────────────────────────
export function getPipelineByQuarter(all, filters) {
  const base   = getFilteredSales(all, { ...filters, fiscalYear: 'All', quarter: 'All' });
  const points = [];
  FYS.forEach(fy => {
    QUARTERS.forEach(q => {
      const rows = base.filter(r => r.fiscalYear === fy && r.quarter === q);
      if (!rows.length) return;
      const overall   = r2(sumF(rows, 'tcvPipeline'));
      const qualified = r2(sumF(rows, 'tcvQualified'));
      const shelved   = r2(sumF(rows, 'tcvShelved'));
      if (overall === 0) return;
      points.push({ label: `${fy} ${q}`, fy, quarter: q, overall, qualified, shelved });
    });
  });
  return points;
}

// ─── Sub SP / Offering breakdown ─────────────────────────────────────────
export function getOfferingBreakdown(all, filters) {
  const rows   = getFilteredSales(all, filters);
  const bySubSP = {};
  rows.forEach(r => {
    if (!bySubSP[r.subSP]) bySubSP[r.subSP] = { subSP: r.subSP, tcvWon: 0, tcvAOP: 0 };
    bySubSP[r.subSP].tcvWon  += r.tcvWon;
    bySubSP[r.subSP].tcvAOP  += r.tcvAOP;
  });
  return Object.values(bySubSP)
    .map(d => ({ ...d, tcvWon: r2(d.tcvWon), tcvAOP: r2(d.tcvAOP), pct: pct(d.tcvWon, d.tcvAOP) }))
    .sort((a, b) => b.tcvWon - a.tcvWon);
}

// ─── Cluster Wise TCV Performance ────────────────────────────────────────
export function getClusterTCVPerformance(all, filters) {
  const base = getFilteredSales(all, { ...filters, bgCluster: 'All', quarter: 'All' });
  const activeFY = filters.fiscalYear === 'All' ? null : filters.fiscalYear;
  const fys = activeFY ? [activeFY] : FYS;
  const qts = filters.quarter === 'All' ? QUARTERS : [filters.quarter];

  const rows = [];
  DIMENSION_TREE.forEach(cluster => {
    const byPeriod = {};
    let totAOP = 0, totWon = 0, totNdAOP = 0, totNdWon = 0;
    fys.forEach(fy => qts.forEach(q => {
      const key = `${fy} ${q}`;
      const sub = base.filter(r => r.bgCluster === cluster.id && r.fiscalYear === fy && r.quarter === q);
      const aop = r2(sumF(sub, 'tcvAOP'));
      const won = r2(sumF(sub, 'tcvWon'));
      const ndAOP = r2(sumF(sub, 'newDealAOP'));
      const ndWon = r2(sumF(sub, 'newDealWon'));
      totAOP += aop; totWon += won; totNdAOP += ndAOP; totNdWon += ndWon;
      byPeriod[key] = { tcvAOP: aop, tcvWon: won, achievedPct: pct(won, aop), newDealAOP: ndAOP, newDealWon: ndWon, ndAchievedPct: pct(ndWon, ndAOP) };
    }));
    rows.push({
      id: cluster.id, label: cluster.label, byPeriod,
      totals: { tcvAOP: r2(totAOP), tcvWon: r2(totWon), achievedPct: pct(totWon, totAOP), newDealAOP: r2(totNdAOP), newDealWon: r2(totNdWon), ndAchievedPct: pct(totNdWon, totNdAOP) },
    });
  });
  const periods = fys.flatMap(fy => qts.map(q => `${fy} ${q}`));
  return { rows, periods };
}

// ─── Sub Unit Wise TCV Performance ───────────────────────────────────────
export function getSubUnitTCVPerformance(all, filters) {
  const base = getFilteredSales(all, { ...filters, subUnit: 'All', quarter: 'All' });
  const activeFY = filters.fiscalYear === 'All' ? null : filters.fiscalYear;
  const fys = activeFY ? [activeFY] : FYS;
  const qts = filters.quarter === 'All' ? QUARTERS : [filters.quarter];

  const suMap = {};
  DIMENSION_TREE.forEach(c => c.bgs.forEach(bg => bg.subUnits.forEach(su => { suMap[su.id] = su.label; })));

  const rows = [];
  Object.entries(suMap).forEach(([suId, suLabel]) => {
    const byPeriod = {};
    let totAOP = 0, totWon = 0;
    fys.forEach(fy => qts.forEach(q => {
      const key = `${fy} ${q}`;
      const sub = base.filter(r => r.subUnit === suId && r.fiscalYear === fy && r.quarter === q);
      const aop = r2(sumF(sub, 'tcvAOP'));
      const won = r2(sumF(sub, 'tcvWon'));
      totAOP += aop; totWon += won;
      byPeriod[key] = { tcvAOP: aop, tcvWon: won, achievedPct: pct(won, aop) };
    }));
    if (totAOP === 0) return;
    rows.push({ id: suId, label: suLabel, byPeriod, totals: { tcvAOP: r2(totAOP), tcvWon: r2(totWon), achievedPct: pct(totWon, totAOP) } });
  });
  const periods = fys.flatMap(fy => qts.map(q => `${fy} ${q}`));
  return { rows, periods };
}

// ─── Geo Wise TCV Performance ─────────────────────────────────────────────
export function getGeoTCVPerformance(all, filters) {
  const base = getFilteredSales(all, { ...filters, salesGeo: 'All', quarter: 'All' });
  const activeFY = filters.fiscalYear === 'All' ? null : filters.fiscalYear;
  const fys = activeFY ? [activeFY] : FYS;
  const qts = filters.quarter === 'All' ? QUARTERS : [filters.quarter];

  const rows = SALES_GEO_LIST.map(geo => {
    const byPeriod = {};
    let totAOP = 0, totWon = 0, totNdAOP = 0, totNdWon = 0;
    fys.forEach(fy => qts.forEach(q => {
      const key = `${fy} ${q}`;
      const sub = base.filter(r => r.salesGeo === geo && r.fiscalYear === fy && r.quarter === q);
      const aop = r2(sumF(sub, 'tcvAOP')); const won = r2(sumF(sub, 'tcvWon'));
      const ndAOP = r2(sumF(sub, 'newDealAOP')); const ndWon = r2(sumF(sub, 'newDealWon'));
      totAOP += aop; totWon += won; totNdAOP += ndAOP; totNdWon += ndWon;
      byPeriod[key] = { tcvAOP: aop, tcvWon: won, achievedPct: pct(won, aop), newDealAOP: ndAOP, newDealWon: ndWon, ndAchievedPct: pct(ndWon, ndAOP) };
    }));
    return { id: geo, label: geo, byPeriod, totals: { tcvAOP: r2(totAOP), tcvWon: r2(totWon), achievedPct: pct(totWon, totAOP), newDealAOP: r2(totNdAOP), newDealWon: r2(totNdWon), ndAchievedPct: pct(totNdWon, totNdAOP) } };
  }).filter(r => r.totals.tcvAOP > 0);

  const periods = fys.flatMap(fy => qts.map(q => `${fy} ${q}`));
  return { rows, periods };
}

// ─── Weekly Trend (distribute quarterly achieved over 13 weeks) ───────────
const WEEKLY_CUM = [0.04,0.09,0.14,0.19,0.26,0.33,0.42,0.52,0.63,0.74,0.85,0.94,1.00];

export function getWeeklyTrend(all, filters) {
  // Get data for the selected FY + quarter (or default FY26/Q1)
  const fy = filters.fiscalYear && filters.fiscalYear !== 'All' ? filters.fiscalYear : 'FY26';
  const q  = filters.quarter    && filters.quarter    !== 'All' ? filters.quarter    : 'Q1';
  const subset = getFilteredSales(all, { ...filters, fiscalYear: fy, quarter: q });
  const aop    = r2(sumF(subset, 'tcvAOP'));
  const won    = r2(sumF(subset, 'tcvWon'));
  const ndAop  = r2(sumF(subset, 'newDealAOP'));
  const ndWon  = r2(sumF(subset, 'newDealWon'));
  const pipe   = r2(sumF(subset, 'tcvPipeline'));

  return WEEKLY_CUM.map((cum, i) => ({
    week: `W${String(i + 1).padStart(2, '0')}`,
    cumulativeWon:   r2(won * cum),
    weeklyWon:       r2(won * (cum - (i > 0 ? WEEKLY_CUM[i - 1] : 0))),
    tcvAOP:          r2(aop * cum),
    achievedPct:     pct(won * cum, aop),
    newDealCumWon:   r2(ndWon * cum),
    newDealWeeklyWon:r2(ndWon * (cum - (i > 0 ? WEEKLY_CUM[i - 1] : 0))),
    pipelineRemaining:r2(pipe * (1 - cum * 0.3)),
  }));
}

// ─── Large Deals ─────────────────────────────────────────────────────────
export function getLargeDeals(opps, filters, threshold) {
  const filtered = getFilteredOpps(opps, filters);
  return filtered.filter(o => o.tcv >= threshold).sort((a, b) => b.tcv - a.tcv);
}

export function getLargeDealKPIs(largeDeals) {
  if (!largeDeals.length) return null;
  const total   = r2(largeDeals.reduce((a, o) => a + o.tcv, 0));
  const avgTCV  = r2(total / largeDeals.length);
  const largest = largeDeals[0]?.tcv || 0;
  const expTotal= r2(largeDeals.reduce((a, o) => a + o.expectedTCV, 0));
  return { count: largeDeals.length, total, avgTCV, largest, expTotal };
}

// ─── Available filter values (cascading) ─────────────────────────────────
export function getSalesFilterOptions(all, filters, field) {
  const partial = getFilteredSales(all, { ...filters, [field]: 'All' });
  return [...new Set(partial.map(r => r[field]).filter(Boolean))].sort();
}
