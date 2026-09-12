// src/utils/calculations.js
// Pure calculation engine — all analytics derived here
// No UI dependencies. All functions are side-effect free.

// ─── Core filter function ──────────────────────────────────────────────────
/**
 * Apply active dashboard filters to the raw records.
 * Returns the filtered subset.
 */
export function getFilteredData(records, filters) {
  return records.filter((r) => {
    if (filters.fiscalYear && filters.fiscalYear !== 'All' && r.fiscalYear !== filters.fiscalYear) return false;
    if (filters.quarter && filters.quarter !== 'All' && r.quarter !== filters.quarter) return false;
    if (filters.bgCluster && filters.bgCluster !== 'All' && r.bgCluster !== filters.bgCluster) return false;
    if (filters.bg && filters.bg !== 'All' && r.bg !== filters.bg) return false;
    if (filters.subUnit && filters.subUnit !== 'All' && r.subUnit !== filters.subUnit) return false;
    if (filters.geo && filters.geo !== 'All' && r.geo !== filters.geo) return false;
    if (filters.groupClient && filters.groupClient !== 'All' && r.groupClient !== filters.groupClient) return false;
    return true;
  });
}

// ─── Basic aggregators ─────────────────────────────────────────────────────
export function sumField(records, field) {
  return records.reduce((acc, r) => acc + (r[field] || 0), 0);
}

export function groupByKey(records, key) {
  return records.reduce((acc, r) => {
    const k = r[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});
}

// ─── KPI calculations ──────────────────────────────────────────────────────
export function calculateKPIs(filteredRecords) {
  if (!filteredRecords.length) return null;

  const actual = sumField(filteredRecords, 'actualRevenue');
  const aop = sumField(filteredRecords, 'aop');
  const target = sumField(filteredRecords, 'target');
  const bgProj = sumField(filteredRecords, 'bgProjection');
  const clusterProj = sumField(filteredRecords, 'clusterProjection');
  const suProj = sumField(filteredRecords, 'subUnitProjection');
  const prevPeriod = sumField(filteredRecords, 'prevPeriodRevenue');

  return {
    actualRevenue: actual,
    aop,
    target,
    bgProjection: bgProj,
    clusterProjection: clusterProj,
    subUnitProjection: suProj,
    gapWithAOP: actual - aop,
    gapWithTarget: actual - target,
    gapWithBGProj: actual - bgProj,
    gapWithSUProj: actual - suProj,
    aopAchievementPct: aop > 0 ? (actual / aop) * 100 : 0,
    targetAchievementPct: target > 0 ? (actual / target) * 100 : 0,
    yoyGrowthPct: prevPeriod > 0 ? ((actual - prevPeriod) / prevPeriod) * 100 : 0,
  };
}

// ─── Annual performance ────────────────────────────────────────────────────
/**
 * Returns array of per-fiscal-year aggregates for all FYs present in records.
 * Shape: [{ fy, aop, actual, target, clusterProj, prevActual, yoyPct, aopPct }]
 */
export function getAnnualPerformance(allRecords, filters) {
  const FYS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
  const dimFilters = { ...filters, fiscalYear: 'All', quarter: 'All' };

  return FYS.map((fy, idx) => {
    const fyRecords = getFilteredData(allRecords, { ...dimFilters, fiscalYear: fy });
    const prevFyRecords = idx > 0
      ? getFilteredData(allRecords, { ...dimFilters, fiscalYear: FYS[idx - 1] })
      : [];

    const actual = sumField(fyRecords, 'actualRevenue');
    const aop = sumField(fyRecords, 'aop');
    const target = sumField(fyRecords, 'target');
    const clusterProj = sumField(fyRecords, 'clusterProjection');
    const prevActual = sumField(prevFyRecords, 'actualRevenue');

    return {
      fy,
      aop,
      actual,
      target,
      clusterProj,
      prevActual,
      yoyPct: prevActual > 0 ? ((actual - prevActual) / prevActual) * 100 : null,
      aopPct: aop > 0 ? (actual / aop) * 100 : 0,
    };
  });
}

// ─── AOP YoY trend ─────────────────────────────────────────────────────────
export function getAOPYoYTrend(allRecords, filters) {
  return getAnnualPerformance(allRecords, filters).filter((d) => d.yoyPct !== null);
}

// ─── Quarterly performance ─────────────────────────────────────────────────
/**
 * Returns per-quarter data for all quarters across all selected FYs.
 * Shape: [{ fy, quarter, label, aop, actual, target, clusterProj, prevQtrActual, qoqPct }]
 */
export function getQuarterlyPerformance(allRecords, filters) {
  const FYS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const dimFilters = { ...filters, fiscalYear: 'All', quarter: 'All' };

  const result = [];

  FYS.forEach((fy) => {
    QUARTERS.forEach((q, qIdx) => {
      const qRecords = getFilteredData(allRecords, { ...dimFilters, fiscalYear: fy, quarter: q });
      if (!qRecords.length) return;

      const actual = sumField(qRecords, 'actualRevenue');
      const aop = sumField(qRecords, 'aop');
      const target = sumField(qRecords, 'target');
      const clusterProj = sumField(qRecords, 'clusterProjection');

      // Previous quarter
      let prevActual = 0;
      if (qIdx > 0) {
        const prevQ = QUARTERS[qIdx - 1];
        const prevQRecords = getFilteredData(allRecords, { ...dimFilters, fiscalYear: fy, quarter: prevQ });
        prevActual = sumField(prevQRecords, 'actualRevenue');
      } else {
        // Q1: compare with Q4 of prior FY
        const FYIdx = FYS.indexOf(fy);
        if (FYIdx > 0) {
          const prevFYRecords = getFilteredData(allRecords, { ...dimFilters, fiscalYear: FYS[FYIdx - 1], quarter: 'Q4' });
          prevActual = sumField(prevFYRecords, 'actualRevenue');
        }
      }

      const qoqPct = prevActual > 0 ? ((actual - prevActual) / prevActual) * 100 : null;

      result.push({
        fy,
        quarter: q,
        label: `${q} ${fy}`,
        aop,
        actual,
        target,
        clusterProj,
        prevActual,
        qoqPct,
        aopPct: aop > 0 ? (actual / aop) * 100 : 0,
        qoqIncRev: actual - prevActual,
      });
    });
  });

  return result;
}

// ─── AOP performance by quarter (for AOP view) ────────────────────────────
export function getAOPPerformance(allRecords, filters) {
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const baseFilters = { ...filters, quarter: 'All' };

  return QUARTERS.map((q) => {
    const qRecords = getFilteredData(allRecords, { ...baseFilters, quarter: q });
    const actual = sumField(qRecords, 'actualRevenue');
    const aop = sumField(qRecords, 'aop');
    const target = sumField(qRecords, 'target');
    const clusterProj = sumField(qRecords, 'clusterProjection');

    // QoQ vs prior quarter in same FY
    const qIdx = QUARTERS.indexOf(q);
    let prevActual = 0;
    if (qIdx > 0) {
      const prevQ = QUARTERS[qIdx - 1];
      const prevRecs = getFilteredData(allRecords, { ...baseFilters, quarter: prevQ });
      prevActual = sumField(prevRecs, 'actualRevenue');
    }

    return {
      quarter: q,
      aop,
      actual,
      target,
      clusterProj,
      aopPct: aop > 0 ? (actual / aop) * 100 : 0,
      qoqPct: prevActual > 0 ? ((actual - prevActual) / prevActual) * 100 : null,
      qoqIncRev: actual - prevActual,
    };
  });
}

// ─── Weekly performance ────────────────────────────────────────────────────
export function getWeeklyPerformance(allRecords, filters) {
  const weekFilters = { ...filters };
  const weekRecords = getFilteredData(allRecords, weekFilters);

  const byWeek = groupByKey(weekRecords, 'week');
  const weeks = Object.keys(byWeek).sort((a, b) => {
    const numA = parseInt(a.replace('W', ''));
    const numB = parseInt(b.replace('W', ''));
    return numA - numB;
  });

  return weeks.map((week) => {
    const wRecs = byWeek[week];
    const sample = wRecs[0];
    return {
      week,
      weekLabel: sample?.weekLabel || week,
      weekDate:  sample?.weekDate  || week,
      actual:      sumField(wRecs, 'actualRevenue'),
      aop:         sumField(wRecs, 'aop'),
      target:      sumField(wRecs, 'target'),
      clusterProj: sumField(wRecs, 'clusterProjection'),
      bgProj:      sumField(wRecs, 'bgProjection'),
      suProj:      sumField(wRecs, 'subUnitProjection'),
    };
  });
}

// ─── Dimensional breakdowns ────────────────────────────────────────────────
function buildBreakdown(allRecords, filters, groupField, labelField) {
  const filtered = getFilteredData(allRecords, filters);
  const byDim = groupByKey(filtered, groupField);

  return Object.entries(byDim).map(([key, recs]) => {
    const sample = recs[0];
    const actual = sumField(recs, 'actualRevenue');
    const aop = sumField(recs, 'aop');
    const target = sumField(recs, 'target');
    const clusterProj = sumField(recs, 'clusterProjection');
    const bgProj = sumField(recs, 'bgProjection');
    const suProj = sumField(recs, 'subUnitProjection');
    const prev = sumField(recs, 'prevPeriodRevenue');

    return {
      id: key,
      label: sample?.[labelField] || key,
      actual,
      aop,
      target,
      clusterProjection: clusterProj,
      bgProjection: bgProj,
      subUnitProjection: suProj,
      gapWithTarget: actual - target,
      gapWithAOP: actual - aop,
      aopPct: aop > 0 ? (actual / aop) * 100 : 0,
      targetPct: target > 0 ? (actual / target) * 100 : 0,
      yoyPct: prev > 0 ? ((actual - prev) / prev) * 100 : null,
    };
  }).sort((a, b) => b.actual - a.actual);
}

export function getClusterBreakdown(allRecords, filters) {
  return buildBreakdown(allRecords, filters, 'bgCluster', 'bgClusterLabel');
}

export function getBGBreakdown(allRecords, filters) {
  return buildBreakdown(allRecords, filters, 'bg', 'bgLabel');
}

export function getSubUnitBreakdown(allRecords, filters) {
  return buildBreakdown(allRecords, filters, 'subUnit', 'subUnitLabel');
}

export function getGeoBreakdown(allRecords, filters) {
  return buildBreakdown(allRecords, filters, 'geo', 'geo');
}

export function getAccountBreakdown(allRecords, filters) {
  return buildBreakdown(allRecords, filters, 'groupClient', 'groupClient');
}

// ─── Multi-year cluster/geo/account tables ─────────────────────────────────
/**
 * Returns per-dimension breakdown for multiple fiscal years
 * Used in Annual Performance tables
 */
export function getMultiYearBreakdown(allRecords, filters, groupField, labelField) {
  const FYS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
  const dimFilters = { ...filters, fiscalYear: 'All', quarter: 'All' };
  const allFiltered = getFilteredData(allRecords, dimFilters);

  // Get unique dimension values
  const dims = [...new Set(allFiltered.map((r) => r[groupField]))];

  return dims.map((dim) => {
    const dimRecs = allFiltered.filter((r) => r[groupField] === dim);
    const sample = dimRecs[0];

    const byFY = {};
    FYS.forEach((fy) => {
      const fyRecs = dimRecs.filter((r) => r.fiscalYear === fy);
      const prevFyIdx = FYS.indexOf(fy) - 1;
      const prevFyRecs = prevFyIdx >= 0 ? dimRecs.filter((r) => r.fiscalYear === FYS[prevFyIdx]) : [];
      const actual = sumField(fyRecs, 'actualRevenue');
      const aop = sumField(fyRecs, 'aop');
      const prevActual = sumField(prevFyRecs, 'actualRevenue');
      byFY[fy] = {
        actual,
        aop,
        aopPct: aop > 0 ? (actual / aop) * 100 : 0,
        yoyPct: prevActual > 0 ? ((actual - prevActual) / prevActual) * 100 : null,
      };
    });

    return {
      id: dim,
      label: sample?.[labelField] || dim,
      byFY,
    };
  }).sort((a, b) => {
    const aVal = a.byFY['FY26']?.actual || 0;
    const bVal = b.byFY['FY26']?.actual || 0;
    return bVal - aVal;
  });
}

// ─── AOP performance tables (multi-quarter) ─────────────────────────────────
export function getMultiQuarterBreakdown(allRecords, filters, groupField, labelField) {
  const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
  const baseFilters = { ...filters, quarter: 'All' };
  const allFiltered = getFilteredData(allRecords, baseFilters);

  const dims = [...new Set(allFiltered.map((r) => r[groupField]))];

  return dims.map((dim) => {
    const dimRecs = allFiltered.filter((r) => r[groupField] === dim);
    const sample = dimRecs[0];

    const byQ = {};
    QUARTERS.forEach((q, qIdx) => {
      const qRecs = dimRecs.filter((r) => r.quarter === q);
      const prevQRecs = qIdx > 0 ? dimRecs.filter((r) => r.quarter === QUARTERS[qIdx - 1]) : [];
      const actual = sumField(qRecs, 'actualRevenue');
      const aop = sumField(qRecs, 'aop');
      const prevActual = sumField(prevQRecs, 'actualRevenue');
      byQ[q] = {
        actual,
        aop,
        aopPct: aop > 0 ? (actual / aop) * 100 : 0,
        qoqPct: prevActual > 0 ? ((actual - prevActual) / prevActual) * 100 : null,
        qoqIncRev: actual - prevActual,
      };
    });

    return {
      id: dim,
      label: sample?.[labelField] || dim,
      byQ,
    };
  }).sort((a, b) => {
    const aVal = a.byQ['Q2']?.actual || 0;
    const bVal = b.byQ['Q2']?.actual || 0;
    return bVal - aVal;
  });
}

// ─── Weekly matrix tables ──────────────────────────────────────────────────
export function getWeeklyBreakdown(allRecords, filters, groupField, labelField) {
  const filtered = getFilteredData(allRecords, filters);
  const weeks = [...new Set(filtered.map((r) => r.week))].sort((a, b) => {
    return parseInt(a.replace('W', '')) - parseInt(b.replace('W', ''));
  });

  const dims = [...new Set(filtered.map((r) => r[groupField]))];

  return {
    weeks,
    rows: dims.map((dim) => {
      const dimRecs = filtered.filter((r) => r[groupField] === dim);
      const sample = dimRecs[0];

      const byWeek = {};
      weeks.forEach((w) => {
        const wRecs = dimRecs.filter((r) => r.week === w);
        byWeek[w] = sumField(wRecs, 'actualRevenue');
      });

      const total = sumField(dimRecs, 'actualRevenue');

      return {
        id: dim,
        label: sample?.[labelField] || dim,
        byWeek,
        total,
      };
    }).sort((a, b) => b.total - a.total),
  };
}

// ─── Gap matrix (cluster × product) ────────────────────────────────────────
export function getGapMatrix(allRecords, filters) {
  const filtered = getFilteredData(allRecords, filters);
  const clusters = [...new Set(filtered.map((r) => r.bgClusterLabel))];

  // Use subUnit as product dimension in gap matrix
  const products = [...new Set(filtered.map((r) => r.subUnitLabel))];

  const rows = clusters.map((cluster) => {
    const clusterRecs = filtered.filter((r) => r.bgClusterLabel === cluster);
    const gaps = {};
    products.forEach((product) => {
      const prodRecs = clusterRecs.filter((r) => r.subUnitLabel === product);
      const actual = sumField(prodRecs, 'actualRevenue');
      const target = sumField(prodRecs, 'target');
      gaps[product] = actual - target;
    });
    const totalActual = sumField(clusterRecs, 'actualRevenue');
    const totalTarget = sumField(clusterRecs, 'target');
    return {
      cluster,
      gaps,
      totalGap: totalActual - totalTarget,
    };
  });

  return { products, rows };
}

// ─── Smart Insights generation ──────────────────────────────────────────────
export function generateInsights(allRecords, filters) {
  const filtered = getFilteredData(allRecords, filters);
  if (!filtered.length) return [];

  const insights = [];

  // 1. Best performing cluster
  const clusterData = getClusterBreakdown(allRecords, filters);
  if (clusterData.length) {
    const best = clusterData.reduce((a, b) => (a.aopPct > b.aopPct ? a : b));
    insights.push({
      type: 'positive',
      text: `${best.label} leads AOP achievement at ${best.aopPct.toFixed(1)}%`,
    });
  }

  // 2. Biggest gap risk
  const worst = clusterData.reduce((a, b) => (a.aopPct < b.aopPct ? a : b), clusterData[0]);
  if (worst && worst.aopPct < 95) {
    insights.push({
      type: 'warning',
      text: `${worst.label} is below AOP target at ${worst.aopPct.toFixed(1)}%`,
    });
  }

  // 3. Best geo
  const geoData = getGeoBreakdown(allRecords, filters);
  if (geoData.length) {
    const bestGeo = geoData.reduce((a, b) => (a.actual > b.actual ? a : b));
    insights.push({
      type: 'neutral',
      text: `${bestGeo.label} is the highest revenue geography`,
    });
  }

  // 4. YoY trend
  const kpis = calculateKPIs(filtered);
  if (kpis && kpis.yoyGrowthPct !== 0) {
    const dir = kpis.yoyGrowthPct >= 0 ? 'grew' : 'declined';
    insights.push({
      type: kpis.yoyGrowthPct >= 0 ? 'positive' : 'negative',
      text: `Overall revenue ${dir} ${Math.abs(kpis.yoyGrowthPct).toFixed(1)}% vs prior period`,
    });
  }

  return insights.slice(0, 4);
}

// ─── Available filter options from live data ───────────────────────────────
export function getAvailableFilterValues(allRecords, currentFilters, field) {
  // Apply all upstream filters except the field itself and downstream fields
  const FIELD_ORDER = ['fiscalYear', 'quarter', 'bgCluster', 'bg', 'subUnit', 'geo', 'groupClient'];
  const fieldIdx = FIELD_ORDER.indexOf(field);

  const upstreamFilters = {};
  FIELD_ORDER.forEach((f, i) => {
    if (i < fieldIdx) upstreamFilters[f] = currentFilters[f];
  });

  const filtered = getFilteredData(allRecords, { ...upstreamFilters });
  const fieldMap = {
    bgCluster: 'bgCluster',
    bg: 'bg',
    subUnit: 'subUnit',
    geo: 'geo',
    groupClient: 'groupClient',
  };

  const rawField = fieldMap[field] || field;
  const values = [...new Set(filtered.map((r) => r[rawField]))].filter(Boolean).sort();
  return values;
}
