// src/utils/rmgCalculations.js
// Calculation and aggregation engine for RMG Performance (WON-HC Report)
// All metrics, charts, and tables are computed from the single filtered dataset.

import { RMG_WEEKS, CURRENT_WEEK_ID, CURRENT_QUARTER, CURRENT_FY } from '../data/rmgData.js';
import { DIMENSION_TREE } from '../data/dimensions.js';

// ─── Filter Engine ────────────────────────────────────────────────────────
export function getFilteredRmg(records, filters) {
  return records.filter(r => {
    if (filters.bgCluster   && filters.bgCluster   !== 'All' && r.bgCluster   !== filters.bgCluster)   return false;
    if (filters.bg          && filters.bg          !== 'All' && r.bg          !== filters.bg)          return false;
    if (filters.subUnit     && filters.subUnit     !== 'All' && r.subUnit     !== filters.subUnit)     return false;
    if (filters.geo         && filters.geo         !== 'All' && r.geo         !== filters.geo)         return false;
    if (filters.groupClient && filters.groupClient !== 'All' && r.groupClient !== filters.groupClient) return false;
    return true;
  });
}

// ─── Dynamic Cascading Filter Options ─────────────────────────────────────
export function getRmgFilterOptions(allRecords, filters, field) {
  const partial = getFilteredRmg(allRecords, { ...filters, [field]: 'All' });
  return [...new Set(partial.map(r => r[field]).filter(Boolean))].sort();
}

// ─── KPI Calculations ────────────────────────────────────────────────────
export function calculateRmgKPIs(filtered) {
  if (!filtered.length) {
    return {
      currentQuarterAddition: 0,
      currentWeekAddition: 0,
      totalWonHC: 0,
    };
  }

  // Current Week Addition
  const currentWeekRecords = filtered.filter(r => r.weekId === CURRENT_WEEK_ID);
  const currentWeekAddition = currentWeekRecords.reduce((sum, r) => sum + r.wonHC, 0);

  // Current Quarter Addition (all weeks in current quarter)
  const currentQuarterRecords = filtered.filter(
    r => r.quarter === CURRENT_QUARTER && r.fiscalYear === CURRENT_FY
  );
  const currentQuarterAddition = currentQuarterRecords.reduce((sum, r) => sum + r.wonHC, 0);

  // Overall Total
  const totalWonHC = filtered.reduce((sum, r) => sum + r.wonHC, 0);

  return {
    currentQuarterAddition,
    currentWeekAddition,
    totalWonHC,
  };
}

// ─── WON HC Trend (Main Bar Chart across Weeks) ───────────────────────────
export function getWonHCTrend(filtered) {
  return RMG_WEEKS.map(w => {
    const weekRecords = filtered.filter(r => r.weekId === w.id);
    const wonHC = weekRecords.reduce((sum, r) => sum + r.wonHC, 0);
    return {
      weekId: w.id,
      weekDate: w.label,
      fullLabel: w.fullLabel,
      wonHC,
    };
  });
}

// ─── BG Cluster Wise WON HC Trend (Multi-Line Chart) ──────────────────────
export function getBgClusterWiseTrend(filtered) {
  // Get all unique clusters in the filtered data
  const clusterMap = {};
  DIMENSION_TREE.forEach(c => {
    clusterMap[c.id] = c.label;
  });

  const availableClusters = [...new Set(filtered.map(r => r.bgCluster))];

  const series = availableClusters.map(clusterId => {
    const clusterRows = filtered.filter(r => r.bgCluster === clusterId);
    const data = RMG_WEEKS.map(w => {
      const rows = clusterRows.filter(r => r.weekId === w.id);
      return rows.reduce((sum, r) => sum + r.wonHC, 0);
    });

    return {
      id: clusterId,
      label: clusterMap[clusterId] || clusterId,
      data,
    };
  });

  return {
    weeks: RMG_WEEKS.map(w => w.id),
    weekLabels: RMG_WEEKS.map(w => w.fullLabel),
    series,
  };
}

// ─── Sub Unit Wise WON HC Trend (Multi-Line Chart) ─────────────────────────
export function getSubUnitWiseTrend(filtered) {
  const suMap = {};
  DIMENSION_TREE.forEach(c => {
    c.bgs.forEach(bg => {
      bg.subUnits.forEach(su => {
        suMap[su.id] = su.label;
      });
    });
  });

  // Top sub-units by total WON HC to avoid clutter (max 7)
  const suTotals = {};
  filtered.forEach(r => {
    suTotals[r.subUnit] = (suTotals[r.subUnit] || 0) + r.wonHC;
  });

  const sortedSubUnits = Object.keys(suTotals)
    .sort((a, b) => suTotals[b] - suTotals[a])
    .slice(0, 7);

  const series = sortedSubUnits.map(suId => {
    const suRows = filtered.filter(r => r.subUnit === suId);
    const data = RMG_WEEKS.map(w => {
      const rows = suRows.filter(r => r.weekId === w.id);
      return rows.reduce((sum, r) => sum + r.wonHC, 0);
    });

    return {
      id: suId,
      label: suMap[suId] || suId,
      data,
    };
  });

  return {
    weeks: RMG_WEEKS.map(w => w.id),
    weekLabels: RMG_WEEKS.map(w => w.fullLabel),
    series,
  };
}

// ─── BG Cluster WON HC Table ──────────────────────────────────────────────
export function getBgClusterWonTable(filtered) {
  const clusterMap = {};
  DIMENSION_TREE.forEach(c => {
    clusterMap[c.id] = c.label;
  });

  const availableClusters = [...new Set(filtered.map(r => r.bgCluster))];

  const rows = availableClusters.map(clusterId => {
    const clusterRows = filtered.filter(r => r.bgCluster === clusterId);
    const weekValues = {};
    let rowTotal = 0;

    RMG_WEEKS.forEach(w => {
      const sum = clusterRows
        .filter(r => r.weekId === w.id)
        .reduce((acc, r) => acc + r.wonHC, 0);
      weekValues[w.id] = sum;
      rowTotal += sum;
    });

    return {
      id: clusterId,
      label: clusterMap[clusterId] || clusterId,
      weekValues,
      rowTotal,
    };
  });

  // Grand Total calculation
  const grandTotal = {
    label: 'Grand Total',
    weekValues: {},
    total: 0,
  };

  RMG_WEEKS.forEach(w => {
    const sum = filtered
      .filter(r => r.weekId === w.id)
      .reduce((acc, r) => acc + r.wonHC, 0);
    grandTotal.weekValues[w.id] = sum;
    grandTotal.total += sum;
  });

  return {
    weeks: RMG_WEEKS,
    rows,
    grandTotal,
  };
}

// ─── Account Wise WON HC Table ────────────────────────────────────────────
export function getAccountWiseWonTable(filtered) {
  const accountMap = {};

  filtered.forEach(r => {
    if (!accountMap[r.accountName]) {
      accountMap[r.accountName] = {
        accountName: r.accountName,
        groupClient: r.groupClient,
        bgCluster: r.bgCluster,
        weekValues: {},
        rowTotal: 0,
      };
      RMG_WEEKS.forEach(w => {
        accountMap[r.accountName].weekValues[w.id] = 0;
      });
    }
    accountMap[r.accountName].weekValues[r.weekId] += r.wonHC;
    accountMap[r.accountName].rowTotal += r.wonHC;
  });

  const rows = Object.values(accountMap).sort((a, b) => b.rowTotal - a.rowTotal);

  // Grand Total calculation
  const grandTotal = {
    label: 'Grand Total',
    weekValues: {},
    total: 0,
  };

  RMG_WEEKS.forEach(w => {
    const sum = filtered
      .filter(r => r.weekId === w.id)
      .reduce((acc, r) => acc + r.wonHC, 0);
    grandTotal.weekValues[w.id] = sum;
    grandTotal.total += sum;
  });

  return {
    weeks: RMG_WEEKS,
    rows,
    grandTotal,
  };
}
