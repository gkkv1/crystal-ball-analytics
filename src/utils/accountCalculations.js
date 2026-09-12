// src/utils/accountCalculations.js
// Pure calculation engine for Account Management / Account Performance
// Single source of truth for both Performance Analysis and Client Visit tabs.

import { FISCAL_YEARS, MONTH_ORDER, MEETING_CATEGORIES, BUSINESS_DOMAINS } from '../data/accountData.js';

// ─── Filter Engines ───────────────────────────────────────────────────────
export function getFilteredAccountPerf(records, filters) {
  return records.filter(r => {
    if (filters.bgCluster   && filters.bgCluster   !== 'All' && r.bgCluster   !== filters.bgCluster)   return false;
    if (filters.groupClient && filters.groupClient !== 'All' && r.groupClient !== filters.groupClient) return false;
    if (filters.iaeBdd      && filters.iaeBdd      !== 'All' && r.iaeBdd      !== filters.iaeBdd)      return false;
    if (filters.iaeBrm      && filters.iaeBrm      !== 'All' && r.iaeBrm      !== filters.iaeBrm)      return false;
    if (filters.iaeGeoHead  && filters.iaeGeoHead  !== 'All' && r.iaeGeoHead  !== filters.iaeGeoHead)  return false;
    return true;
  });
}

export function getFilteredVisits(visits, filters) {
  return visits.filter(v => {
    if (filters.bgCluster   && filters.bgCluster   !== 'All' && v.bgCluster   !== filters.bgCluster)   return false;
    if (filters.groupClient && filters.groupClient !== 'All' && v.groupClient !== filters.groupClient) return false;
    if (filters.iaeBdd      && filters.iaeBdd      !== 'All' && v.iaeBdd      !== filters.iaeBdd)      return false;
    if (filters.iaeBrm      && filters.iaeBrm      !== 'All' && v.iaeBrm      !== filters.iaeBrm)      return false;
    if (filters.iaeGeoHead  && filters.iaeGeoHead  !== 'All' && v.iaeGeoHead  !== filters.iaeGeoHead)  return false;
    return true;
  });
}

// ─── Dynamic Cascading Filter Options ─────────────────────────────────────
export function getAccountFilterOptions(perfRecords, visitRecords, filters, field) {
  const filteredP = getFilteredAccountPerf(perfRecords, { ...filters, [field]: 'All' });
  const filteredV = getFilteredVisits(visitRecords, { ...filters, [field]: 'All' });

  const pVals = filteredP.map(r => r[field]).filter(Boolean);
  const vVals = filteredV.map(v => v[field]).filter(Boolean);

  return [...new Set([...pVals, ...vVals])].sort();
}

// ─── TAB 1: Performance Analysis Calculations ─────────────────────────────
export function calculatePerformanceKPIs(filtered) {
  if (!filtered.length) {
    return {
      totalRevenue: 0,
      totalRevenueAop: 0,
      aopAchievement: 0,
      totalSalesTCV: 0,
      activeAccounts: 0,
      avgDegScore: 0,
    };
  }

  // Active current year records (FY26)
  const currentYearRecords = filtered.filter(r => r.fiscalYear === 'FY26');
  const target = currentYearRecords.length ? currentYearRecords : filtered;

  const totalRevenue = target.reduce((s, r) => s + r.revenue, 0);
  const totalRevenueAop = target.reduce((s, r) => s + r.revenueAop, 0);
  const totalSalesTCV = target.reduce((s, r) => s + r.salesTCV, 0);
  const activeAccounts = new Set(filtered.map(r => r.accountName)).size;
  const aopAchievement = totalRevenueAop > 0 ? (totalRevenue / totalRevenueAop) * 100 : 0;
  const avgDegScore = target.reduce((s, r) => s + r.degScore, 0) / (target.length || 1);

  return {
    totalRevenue,
    totalRevenueAop,
    aopAchievement: Math.round(aopAchievement * 10) / 10,
    totalSalesTCV,
    activeAccounts,
    avgDegScore: Math.round(avgDegScore * 10) / 10,
  };
}

// FY Performance (Grouped Bar: AOP vs Actual/Proj)
export function getFYPerformanceData(filtered, domainId = 'revenue') {
  const domain = BUSINESS_DOMAINS.find(d => d.id === domainId) || BUSINESS_DOMAINS[0];

  return FISCAL_YEARS.map(fy => {
    const fyRows = filtered.filter(r => r.fiscalYear === fy);
    const actual = fyRows.reduce((s, r) => s + (r[domain.field] || 0), 0);
    const aop = fyRows.reduce((s, r) => s + (r[domain.aopField] || 0), 0);

    return {
      fiscalYear: fy,
      actual: Math.round(actual),
      aop: Math.round(aop),
      unit: domain.unit,
    };
  });
}

// AOP YoY Performance (Line chart: YoY% and AOP%)
export function getAOPYoYData(filtered, domainId = 'revenue') {
  const fyData = getFYPerformanceData(filtered, domainId);

  return fyData.map((d, i) => {
    const prev = fyData[i - 1];
    const yoy = prev && prev.actual > 0 ? ((d.actual - prev.actual) / prev.actual) * 100 : (i === 0 ? 6.8 : 0);
    const aopPct = d.aop > 0 ? (d.actual / d.aop) * 100 : 92.5;

    return {
      fiscalYear: d.fiscalYear,
      yoyPct: Math.round(yoy * 10) / 10,
      aopPct: Math.round(aopPct * 10) / 10,
    };
  });
}

// Quarterly Performance (Bar + Line across FY24-FY27 quarters)
export function getQuarterlyPerformanceData(filtered, domainId = 'revenue') {
  const domain = BUSINESS_DOMAINS.find(d => d.id === domainId) || BUSINESS_DOMAINS[0];
  const qList = [];

  ['FY24', 'FY25', 'FY26', 'FY27'].forEach(fy => {
    ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
      // Omit future Q3/Q4 for FY27
      if (fy === 'FY27' && (q === 'Q3' || q === 'Q4')) return;

      const rows = filtered.filter(r => r.fiscalYear === fy && r.quarter === q);
      const act = rows.reduce((s, r) => s + (r[domain.field] || 0), 0);
      const aop = rows.reduce((s, r) => s + (r[domain.aopField] || 0), 0);
      const ach = aop > 0 ? Math.round((act / aop) * 1000) / 10 : 90;

      qList.push({
        label: `${q} ${fy}`,
        fiscalYear: fy,
        quarter: q,
        actual: Math.round(act),
        aop: Math.round(aop),
        achievement: ach,
      });
    });
  });

  return qList;
}

// Yearly Performance Table
export function getYearlyPerformanceTable(filtered, domainId = 'revenue') {
  const domain = BUSINESS_DOMAINS.find(d => d.id === domainId) || BUSINESS_DOMAINS[0];

  // Group by Sub Unit
  const suMap = {};
  filtered.forEach(r => {
    if (!suMap[r.subUnit]) {
      suMap[r.subUnit] = {
        subUnitId: r.subUnit,
        subUnitLabel: r.subUnitLabel || r.subUnit,
        byFY: {},
      };
      FISCAL_YEARS.forEach(fy => {
        suMap[r.subUnit].byFY[fy] = { aop: 0, actual: 0 };
      });
    }
    suMap[r.subUnit].byFY[r.fiscalYear].actual += r[domain.field] || 0;
    suMap[r.subUnit].byFY[r.fiscalYear].aop += r[domain.aopField] || 0;
  });

  const rows = Object.values(suMap).map(item => {
    const fyMetrics = {};
    FISCAL_YEARS.forEach((fy, idx) => {
      const prevFy = FISCAL_YEARS[idx - 1];
      const act = item.byFY[fy].actual;
      const aop = item.byFY[fy].aop;
      const prevAct = prevFy ? item.byFY[prevFy].actual : 0;
      const aopPct = aop > 0 ? (act / aop) * 100 : 0;
      const yoyPct = prevAct > 0 ? ((act - prevAct) / prevAct) * 100 : 0;

      fyMetrics[fy] = {
        aop: Math.round(aop),
        actual: Math.round(act),
        aopPct: Math.round(aopPct * 10) / 10,
        yoyPct: Math.round(yoyPct * 10) / 10,
      };
    });

    return {
      subUnit: item.subUnitLabel,
      fyMetrics,
    };
  });

  // Grand Total
  const grandTotal = {
    subUnit: 'Grand Total',
    fyMetrics: {},
  };

  FISCAL_YEARS.forEach((fy, idx) => {
    const prevFy = FISCAL_YEARS[idx - 1];
    const totalAct = rows.reduce((s, r) => s + r.fyMetrics[fy].actual, 0);
    const totalAop = rows.reduce((s, r) => s + r.fyMetrics[fy].aop, 0);
    const prevAct = prevFy ? rows.reduce((s, r) => s + r.fyMetrics[prevFy].actual, 0) : 0;
    const aopPct = totalAop > 0 ? (totalAct / totalAop) * 100 : 0;
    const yoyPct = prevAct > 0 ? ((totalAct - prevAct) / prevAct) * 100 : 0;

    grandTotal.fyMetrics[fy] = {
      aop: totalAop,
      actual: totalAct,
      aopPct: Math.round(aopPct * 10) / 10,
      yoyPct: Math.round(yoyPct * 10) / 10,
    };
  });

  return {
    rows,
    grandTotal,
    domain,
  };
}

// ─── TAB 2: Client Visit Calculations ─────────────────────────────────────
export function calculateVisitKPIs(filteredVisits) {
  const total = filteredVisits.length;
  const catCounts = {};

  MEETING_CATEGORIES.forEach(c => {
    catCounts[c.id] = 0;
  });

  filteredVisits.forEach(v => {
    if (catCounts[v.meetingCategory] !== undefined) {
      catCounts[v.meetingCategory]++;
    }
  });

  return {
    total,
    catCounts,
  };
}

// Total Meetings by FY Year, Quarter and Month
export function getMeetingsTrend(filteredVisits) {
  return MONTH_ORDER.map(m => {
    const count = filteredVisits.filter(
      v => v.month === m.month && v.fiscalYear === m.fy
    ).length;

    return {
      month: m.month,
      quarter: m.quarter,
      fiscalYear: m.fy,
      label: `${m.month.slice(0, 3)}\n${m.quarter}`,
      fullLabel: `${m.month} (${m.quarter} ${m.fy})`,
      count,
    };
  });
}

// Meeting Monthly Matrix: Group Client × Month
export function getMeetingMatrix(filteredVisits) {
  const clientMap = {};

  filteredVisits.forEach(v => {
    if (!clientMap[v.groupClient]) {
      clientMap[v.groupClient] = {
        groupClient: v.groupClient,
        bgCluster: v.bgClusterLabel || v.bgCluster,
        byMonth: {},
        total: 0,
      };
      MONTH_ORDER.forEach(m => {
        clientMap[v.groupClient].byMonth[m.month] = 0;
      });
    }
    clientMap[v.groupClient].byMonth[v.month] = (clientMap[v.groupClient].byMonth[v.month] || 0) + 1;
    clientMap[v.groupClient].total += 1;
  });

  const rows = Object.values(clientMap).sort((a, b) => b.total - a.total);

  // Grand total
  const grandTotal = {
    groupClient: 'Grand Total',
    bgCluster: 'ALL',
    byMonth: {},
    total: filteredVisits.length,
  };

  MONTH_ORDER.forEach(m => {
    grandTotal.byMonth[m.month] = filteredVisits.filter(v => v.month === m.month).length;
  });

  return {
    months: MONTH_ORDER.map(m => m.month),
    rows,
    grandTotal,
  };
}
