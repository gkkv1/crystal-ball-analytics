// src/utils/degCalculations.js
// Pure calculation engine for DEG Performance module

import { DIMENSION_TREE } from '../data/dimensions.js';
import { DEG_PERIODS }   from '../data/degData.js';

// ─── Core filter ─────────────────────────────────────────────────────────
export function getFilteredDeg(records, filters) {
  return records.filter(r => {
    if (filters.bgCluster  && filters.bgCluster  !== 'All' && r.bgCluster  !== filters.bgCluster)  return false;
    if (filters.bg         && filters.bg         !== 'All' && r.bg         !== filters.bg)         return false;
    if (filters.subUnit    && filters.subUnit    !== 'All' && r.subUnit    !== filters.subUnit)    return false;
    if (filters.geo        && filters.geo        !== 'All' && r.geo        !== filters.geo)        return false;
    if (filters.groupClient&& filters.groupClient!== 'All' && r.groupClient!== filters.groupClient) return false;
    return true;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function sumF(arr, f)  { return arr.reduce((a, r) => a + (r[f] || 0), 0); }
function r1(v) { return Math.round(v * 10)  / 10;  }
function r2(v) { return Math.round(v * 100) / 100; }
function wAvg(arr, valF, wF) {
  const tw = sumF(arr, wF);
  if (!tw) return 0;
  return r1(arr.reduce((a, r) => a + r[valF] * r[wF], 0) / tw);
}
function safePct(n, d) { return d > 0 ? r1(n / d * 100) : 0; }

// ─── KPI summary ─────────────────────────────────────────────────────────
export function calculateDegKPIs(filtered) {
  if (!filtered.length) return null;
  const totalProjects  = sumF(filtered, 'totalProjects');
  const csi100Count    = sumF(filtered, 'csi100Count');
  const lowCsiCount    = sumF(filtered, 'lowCsiCount');
  const loyaltyCount   = sumF(filtered, 'loyaltyCount');
  const rankingCount   = sumF(filtered, 'rankingCount');
  return {
    csiScore:    wAvg(filtered, 'csiScore', 'totalProjects'),
    totalProjects,
    csi100Count,
    csi100Pct:   safePct(csi100Count, totalProjects),
    lowCsiCount,
    lowCsiPct:   safePct(lowCsiCount, totalProjects),
    loyaltyCount,
    loyaltyPct:  safePct(loyaltyCount, totalProjects),
    rankingCount,
    rankingPct:  safePct(rankingCount, totalProjects),
  };
}

// ─── CSI% Trend (line chart — one point per period) ───────────────────────
export function getCsiTrend(all, filters) {
  const base = getFilteredDeg(all, filters);
  return DEG_PERIODS.map(period => {
    const rows = base.filter(r => r.period === period);
    return {
      period,
      csiScore:     wAvg(rows, 'csiScore', 'totalProjects') || 0,
      totalProjects: sumF(rows, 'totalProjects'),
      csi100Count:   sumF(rows, 'csi100Count'),
      csi100Pct:     safePct(sumF(rows, 'csi100Count'), sumF(rows, 'totalProjects')),
    };
  });
}

// ─── CSI% Trend by Sub Unit (grouped bar — sub unit × period) ─────────────
export function getCsiBySubUnit(all, filters) {
  const base    = getFilteredDeg(all, filters);
  const suMap   = {};
  DIMENSION_TREE.forEach(c => c.bgs.forEach(bg => bg.subUnits.forEach(su => {
    suMap[su.id] = su.label;
  })));

  const subUnits = Object.keys(suMap).filter(suId =>
    base.some(r => r.subUnit === suId)
  );

  return {
    subUnits: subUnits.map(suId => ({
      id:    suId,
      label: suMap[suId],
      periods: DEG_PERIODS.map(period => {
        const rows = base.filter(r => r.subUnit === suId && r.period === period);
        return {
          period,
          csiScore:     wAvg(rows, 'csiScore', 'totalProjects') || 0,
          totalProjects: sumF(rows, 'totalProjects'),
        };
      }),
    })),
    periods: DEG_PERIODS,
  };
}

// ─── CSI Table (sub unit × period) ────────────────────────────────────────
export function getCsiTable(all, filters) {
  const base  = getFilteredDeg(all, filters);
  const suMap = {};
  DIMENSION_TREE.forEach(c => c.bgs.forEach(bg => bg.subUnits.forEach(su => {
    suMap[su.id] = su.label;
  })));

  const subUnits = Object.keys(suMap).filter(suId =>
    base.some(r => r.subUnit === suId)
  );

  const rows = subUnits.map(suId => {
    const suRows = base.filter(r => r.subUnit === suId);
    const byPeriod = DEG_PERIODS.map(period => {
      const pr = suRows.filter(r => r.period === period);
      if (!pr.length) return null;
      const tp  = sumF(pr, 'totalProjects');
      const c100= sumF(pr, 'csi100Count');
      const lc  = sumF(pr, 'lowCsiCount');
      const loy = sumF(pr, 'loyaltyCount');
      const rnk = sumF(pr, 'rankingCount');
      return {
        period,
        totalProjects: tp,
        csiScore:      wAvg(pr, 'csiScore', 'totalProjects'),
        csi100Count:   c100,
        csi100Pct:     safePct(c100, tp),
        csi100RespPct: r1(pr.reduce((a,r) => a + r.csi100RespPct * r.totalProjects, 0) / (tp||1)),
        lowCsiCount:   lc,
        lowCsiPct:     safePct(lc, tp),
        loyaltyCount:  loy,
        loyaltyPct:    safePct(loy, tp),
        rankingCount:  rnk,
        rankingPct:    safePct(rnk, tp),
      };
    }).filter(Boolean);

    // Sub-unit totals
    const tp  = sumF(suRows, 'totalProjects');
    const c100= sumF(suRows, 'csi100Count');
    const lc  = sumF(suRows, 'lowCsiCount');
    const loy = sumF(suRows, 'loyaltyCount');
    const rnk = sumF(suRows, 'rankingCount');
    return {
      id: suId, label: suMap[suId], byPeriod,
      totals: {
        totalProjects: tp,
        csiScore:      wAvg(suRows, 'csiScore', 'totalProjects'),
        csi100Count: c100, csi100Pct: safePct(c100, tp),
        lowCsiCount:  lc,  lowCsiPct:  safePct(lc,   tp),
        loyaltyCount: loy, loyaltyPct: safePct(loy,  tp),
        rankingCount: rnk, rankingPct: safePct(rnk,  tp),
      },
    };
  }).filter(r => r.totals.totalProjects > 0);

  // Grand total
  const tp  = sumF(base, 'totalProjects');
  const c100= sumF(base, 'csi100Count');
  const lc  = sumF(base, 'lowCsiCount');
  const loy = sumF(base, 'loyaltyCount');
  const rnk = sumF(base, 'rankingCount');
  const grandTotal = {
    totalProjects: tp,
    csiScore:      wAvg(base, 'csiScore', 'totalProjects'),
    csi100Count: c100, csi100Pct: safePct(c100, tp),
    lowCsiCount:  lc,  lowCsiPct:  safePct(lc,   tp),
    loyaltyCount: loy, loyaltyPct: safePct(loy,  tp),
    rankingCount: rnk, rankingPct: safePct(rnk,  tp),
  };
  return { rows, grandTotal };
}

// ─── Available filter values ──────────────────────────────────────────────
export function getDegFilterOptions(all, filters, field) {
  const partial = getFilteredDeg(all, { ...filters, [field]: 'All' });
  return [...new Set(partial.map(r => r[field]).filter(Boolean))].sort();
}
