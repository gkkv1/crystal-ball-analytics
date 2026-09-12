// src/utils/financeCalculations.js
// Pure calculation engine for Finance Performance module
// All functions are side-effect free; use financeData as input

import { getFilteredData } from './calculations.js';

// ─── Helpers ────────────────────────────────────────────────────────────────
function sumField(records, field) {
  return records.reduce((acc, r) => acc + (r[field] || 0), 0);
}

function weightedAvg(records, field, weightField) {
  const totalWeight = sumField(records, weightField);
  if (totalWeight === 0) return 0;
  const wSum = records.reduce((s, r) => s + (r[field] || 0) * (r[weightField] || 0), 0);
  return wSum / totalWeight;
}

function round1(v) { return Math.round(v * 10) / 10; }
function round2(v) { return Math.round(v * 100) / 100; }

const FYS      = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// ─── Filter finance records (reuses Revenue's getFilteredData — same field names) ─
export function getFilteredFinance(records, filters) {
  return getFilteredData(records, filters);
}

// ─── Finance KPIs (header cards) ────────────────────────────────────────────
export function calculateFinanceKPIs(filtered) {
  if (!filtered.length) return null;
  const revenue         = sumField(filtered, 'revenue');
  const grossMargin     = sumField(filtered, 'grossMargin');
  const grossMarginPct  = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const offshoreRealizAvg = weightedAvg(filtered, 'offshoreRealization', 'revenue');
  const onsiteRealizAvg   = weightedAvg(filtered, 'onsiteRealization',   'revenue');
  const adjustedBTAAvg    = weightedAvg(filtered, 'adjustedBTA',         'revenue');
  const offshoreBTAAvg    = weightedAvg(filtered, 'offshoreBTA',         'revenue');
  const onsiteBTAAvg      = weightedAvg(filtered, 'onsiteBTA',           'revenue');
  const boughtOutPctAvg   = weightedAvg(filtered, 'boughtOutPct',        'revenue');
  const manPowerPctAvg    = weightedAvg(filtered, 'manPowerPct',         'revenue');
  const airFarePctAvg     = weightedAvg(filtered, 'airFarePct',          'revenue');
  const othersPctAvg      = weightedAvg(filtered, 'othersPct',           'revenue');
  const totalCostPctAvg   = 100 - grossMarginPct;

  return {
    revenue, grossMargin, grossMarginPct,
    offshoreRealizAvg, onsiteRealizAvg,
    adjustedBTAAvg, offshoreBTAAvg, onsiteBTAAvg,
    boughtOutPctAvg, manPowerPctAvg, airFarePctAvg, othersPctAvg, totalCostPctAvg,
  };
}

// ─── Revenue & Gross Margin by FY ────────────────────────────────────────────
export function getMarginByFY(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  return FYS.map((fy) => {
    const recs = getFilteredFinance(allRecords, { ...base, fiscalYear: fy });
    const revenue     = sumField(recs, 'revenue');
    const grossMargin = sumField(recs, 'grossMargin');
    return {
      fy,
      revenue:        round2(revenue),
      grossMargin:    round2(grossMargin),
      grossMarginPct: revenue > 0 ? round1((grossMargin / revenue) * 100) : 0,
    };
  });
}

// ─── Cost as % of Revenue by FY ─────────────────────────────────────────────
export function getCostPctByFY(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  return FYS.map((fy) => {
    const recs    = getFilteredFinance(allRecords, { ...base, fiscalYear: fy });
    const revenue = sumField(recs, 'revenue');
    const gm      = sumField(recs, 'grossMargin');
    const totalCostPct = revenue > 0 ? 100 - (gm / revenue) * 100 : 0;
    return {
      fy,
      airFarePct:   revenue > 0 ? round1(weightedAvg(recs, 'airFarePct',  'revenue')) : 0,
      boughtOutPct: revenue > 0 ? round1(weightedAvg(recs, 'boughtOutPct','revenue')) : 0,
      manPowerPct:  revenue > 0 ? round1(weightedAvg(recs, 'manPowerPct', 'revenue')) : 0,
      othersPct:    revenue > 0 ? round1(weightedAvg(recs, 'othersPct',   'revenue')) : 0,
      totalCostPct: round1(totalCostPct),
    };
  });
}

// ─── Cluster Wise Yearly Revenue & Gross Margin ──────────────────────────────
export function getClusterMarginByFY(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  const all  = getFilteredFinance(allRecords, base);
  const clusters = [...new Set(all.map((r) => r.bgCluster))];

  return clusters.map((cl) => {
    const clRecs = all.filter((r) => r.bgCluster === cl);
    const sample = clRecs[0];
    const byFY   = {};
    FYS.forEach((fy) => {
      const fyRecs = clRecs.filter((r) => r.fiscalYear === fy);
      const rev    = sumField(fyRecs, 'revenue');
      const gm     = sumField(fyRecs, 'grossMargin');
      byFY[fy] = {
        revenue:        round2(rev),
        grossMarginPct: rev > 0 ? round1((gm / rev) * 100) : 0,
      };
    });
    return {
      id: cl, label: sample?.bgClusterLabel || cl, byFY,
    };
  }).sort((a, b) => (b.byFY['FY26']?.revenue || 0) - (a.byFY['FY26']?.revenue || 0));
}

// ─── Sub Unit Wise Quarterly Revenue & Gross Margin ──────────────────────────
export function getSubUnitMarginByQuarter(allRecords, filters) {
  const selFY  = filters.fiscalYear && filters.fiscalYear !== 'All' ? filters.fiscalYear : 'FY26';
  const base   = { ...filters, fiscalYear: selFY, quarter: 'All' };
  const all    = getFilteredFinance(allRecords, base);
  const subUnits = [...new Set(all.map((r) => r.subUnit))];
  const periods  = QUARTERS.map((q) => `${selFY}${q}`);

  const rows = subUnits.map((su) => {
    const suRecs = all.filter((r) => r.subUnit === su);
    const sample = suRecs[0];
    const byPeriod = {};
    QUARTERS.forEach((q) => {
      const qRecs = suRecs.filter((r) => r.quarter === q);
      const rev   = sumField(qRecs, 'revenue');
      const gm    = sumField(qRecs, 'grossMargin');
      const aop   = sumField(qRecs, 'aop');
      byPeriod[`${selFY}${q}`] = {
        revenue:        round2(rev),
        grossMarginPct: rev  > 0 ? round1((gm  / rev)  * 100) : 0,
        aopPct:         aop  > 0 ? round1((rev / aop)   * 100) : 0,
      };
    });
    const totalRev = sumField(suRecs, 'revenue');
    return { id: su, label: sample?.subUnitLabel || su, byPeriod, totalRev };
  }).sort((a, b) => b.totalRev - a.totalRev);

  return { periods, rows };
}

// ─── Yearly Realization Trend ─────────────────────────────────────────────────
export function getYearlyRealizationTrend(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  return FYS.map((fy) => {
    const recs = getFilteredFinance(allRecords, { ...base, fiscalYear: fy });
    const rev  = sumField(recs, 'revenue');
    return {
      fy,
      offshoreRealization: rev > 0 ? round1(weightedAvg(recs, 'offshoreRealization', 'revenue')) : null,
      onsiteRealization:   rev > 0 ? round1(weightedAvg(recs, 'onsiteRealization',   'revenue')) : null,
    };
  });
}

// ─── Yearly BTA Trend ─────────────────────────────────────────────────────────
export function getYearlyBTATrend(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  return FYS.map((fy) => {
    const recs = getFilteredFinance(allRecords, { ...base, fiscalYear: fy });
    const rev  = sumField(recs, 'revenue');
    return {
      fy,
      offshoreBTA:  rev > 0 ? round1(weightedAvg(recs, 'offshoreBTA',  'revenue')) : null,
      onsiteBTA:    rev > 0 ? round1(weightedAvg(recs, 'onsiteBTA',     'revenue')) : null,
      adjustedBTA:  rev > 0 ? round1(weightedAvg(recs, 'adjustedBTA',   'revenue')) : null,
    };
  });
}

// ─── Quarterly Realization Trend (all FY × Q) ────────────────────────────────
export function getQuarterlyRealizationTrend(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  const result = [];
  FYS.forEach((fy) => {
    QUARTERS.forEach((q) => {
      const recs = getFilteredFinance(allRecords, { ...base, fiscalYear: fy, quarter: q });
      const rev  = sumField(recs, 'revenue');
      if (rev === 0) return;
      result.push({
        label: `${fy}${q}`, fy, quarter: q,
        offshoreRealization: round1(weightedAvg(recs, 'offshoreRealization', 'revenue')),
        onsiteRealization:   round1(weightedAvg(recs, 'onsiteRealization',   'revenue')),
      });
    });
  });
  return result;
}

// ─── Quarterly Adjusted BTA Trend ─────────────────────────────────────────────
export function getQuarterlyBTATrend(allRecords, filters) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  const result = [];
  FYS.forEach((fy) => {
    QUARTERS.forEach((q) => {
      const recs = getFilteredFinance(allRecords, { ...base, fiscalYear: fy, quarter: q });
      const rev  = sumField(recs, 'revenue');
      if (rev === 0) return;
      result.push({
        label: `${fy}${q}`, fy, quarter: q,
        offshoreBTA:  round1(weightedAvg(recs, 'offshoreBTA',  'revenue')),
        onsiteBTA:    round1(weightedAvg(recs, 'onsiteBTA',     'revenue')),
        adjustedBTA:  round1(weightedAvg(recs, 'adjustedBTA',   'revenue')),
      });
    });
  });
  return result;
}

// ─── Generic dim-wise BTA by FY ───────────────────────────────────────────────
function getDimBTA(allRecords, filters, dimField, labelField) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  const all  = getFilteredFinance(allRecords, base);
  const dims = [...new Set(all.map((r) => r[dimField]))];
  return dims.map((dim) => {
    const dimRecs = all.filter((r) => r[dimField] === dim);
    const sample  = dimRecs[0];
    const byFY    = {};
    FYS.forEach((fy) => {
      const fyRecs = dimRecs.filter((r) => r.fiscalYear === fy);
      const rev    = sumField(fyRecs, 'revenue');
      byFY[fy] = rev > 0 ? {
        offshoreBTA:  round1(weightedAvg(fyRecs, 'offshoreBTA',  'revenue')),
        onsiteBTA:    round1(weightedAvg(fyRecs, 'onsiteBTA',     'revenue')),
        adjustedBTA:  round1(weightedAvg(fyRecs, 'adjustedBTA',   'revenue')),
      } : { offshoreBTA: null, onsiteBTA: null, adjustedBTA: null };
    });
    return { id: dim, label: sample?.[labelField] || dim, byFY };
  }).sort((a, b) => (b.byFY['FY26']?.adjustedBTA || 0) - (a.byFY['FY26']?.adjustedBTA || 0));
}
export const getClusterBTA   = (r, f) => getDimBTA(r, f, 'bgCluster', 'bgClusterLabel');
export const getGeoBTA       = (r, f) => getDimBTA(r, f, 'geo',       'geo');
export const getSubUnitBTA   = (r, f) => getDimBTA(r, f, 'subUnit',   'subUnitLabel');

// ─── Generic dim-wise Realization by FY ──────────────────────────────────────
function getDimRealization(allRecords, filters, dimField, labelField) {
  const base = { ...filters, fiscalYear: 'All', quarter: 'All' };
  const all  = getFilteredFinance(allRecords, base);
  const dims = [...new Set(all.map((r) => r[dimField]))];
  return dims.map((dim) => {
    const dimRecs = all.filter((r) => r[dimField] === dim);
    const sample  = dimRecs[0];
    const byFY    = {};
    FYS.forEach((fy) => {
      const fyRecs = dimRecs.filter((r) => r.fiscalYear === fy);
      const rev    = sumField(fyRecs, 'revenue');
      byFY[fy] = rev > 0 ? {
        offshoreRealization: round1(weightedAvg(fyRecs, 'offshoreRealization', 'revenue')),
        onsiteRealization:   round1(weightedAvg(fyRecs, 'onsiteRealization',   'revenue')),
      } : { offshoreRealization: null, onsiteRealization: null };
    });
    return { id: dim, label: sample?.[labelField] || dim, byFY };
  });
}
export const getClusterRealization = (r, f) => getDimRealization(r, f, 'bgCluster', 'bgClusterLabel');
export const getGeoRealization     = (r, f) => getDimRealization(r, f, 'geo',       'geo');
export const getSubUnitRealization = (r, f) => getDimRealization(r, f, 'subUnit',   'subUnitLabel');
