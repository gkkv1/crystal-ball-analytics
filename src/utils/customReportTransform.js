// src/utils/customReportTransform.js
// Data transformation engine for Custom Report / Visual Explorer
// Converts flat data arrays into { labels, series } format for any chart type
// Pure functions — no side effects, no React, no UI dependencies

/**
 * Apply aggregation function to an array of values
 */
export function aggregate(values, aggType = 'sum') {
  if (!values.length) return 0;
  const nums = values.filter((v) => v != null && !isNaN(v));
  if (!nums.length) return 0;
  switch (aggType) {
    case 'sum':   return nums.reduce((a, b) => a + b, 0);
    case 'avg':   return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min':   return Math.min(...nums);
    case 'max':   return Math.max(...nums);
    case 'count': return nums.length;
    default:      return nums.reduce((a, b) => a + b, 0);
  }
}

function groupBy(data, key) {
  return data.reduce((acc, row) => {
    const k = String(row[key] ?? '(unknown)');
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});
}

function sortLabels(labels, direction = 'asc') {
  const sorted = [...labels].sort((a, b) => {
    if (/^FY\d+$/.test(a) && /^FY\d+$/.test(b)) return parseInt(a.slice(2)) - parseInt(b.slice(2));
    if (/^Q[1-4]$/.test(a) && /^Q[1-4]$/.test(b)) return parseInt(a[1]) - parseInt(b[1]);
    if (/^W\d+$/.test(a) && /^W\d+$/.test(b)) return parseInt(a.slice(1)) - parseInt(b.slice(1));
    const qFyA = a.match(/^Q([1-4])\s*FY(\d+)$/i);
    const qFyB = b.match(/^Q([1-4])\s*FY(\d+)$/i);
    if (qFyA && qFyB) {
      const fyDiff = parseInt(qFyA[2]) - parseInt(qFyB[2]);
      if (fyDiff !== 0) return fyDiff;
      return parseInt(qFyA[1]) - parseInt(qFyB[1]);
    }
    const fyQA = a.match(/^FY(\d+)\s*Q([1-4])$/i);
    const fyQB = b.match(/^FY(\d+)\s*Q([1-4])$/i);
    if (fyQA && fyQB) {
      const fyDiff = parseInt(fyQA[1]) - parseInt(fyQB[1]);
      if (fyDiff !== 0) return fyDiff;
      return parseInt(fyQA[2]) - parseInt(fyQB[2]);
    }
    const fyHA = a.match(/^FY(\d+)\s*H([1-2])$/i);
    const fyHB = b.match(/^FY(\d+)\s*H([1-2])$/i);
    if (fyHA && fyHB) {
      const fyDiff = parseInt(fyHA[1]) - parseInt(fyHB[1]);
      if (fyDiff !== 0) return fyDiff;
      return parseInt(fyHA[2]) - parseInt(fyHB[2]);
    }
    const numA = parseFloat(a.replace(/[^\d.]/g, '')) || 0;
    const numB = parseFloat(b.replace(/[^\d.]/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Main transform: rawData[] + config ? { labels, series }
 */
export function transformData(rawData, config, measures) {
  if (!rawData?.length || !config?.xAxis || !config?.yAxis?.length) {
    return { labels: [], series: [], rawGrouped: {} };
  }
  const { xAxis, yAxis, aggregation = {}, sort } = config;
  const grouped = groupBy(rawData, xAxis);
  const sortDir = sort?.direction || 'asc';
  const sortField = sort?.field;
  let labels = sortField === 'xAxis' || !sortField
    ? sortLabels(Object.keys(grouped), sortDir)
    : Object.keys(grouped);

  const series = yAxis.map((measureKey) => {
    const measure = measures?.find((m) => m.key === measureKey);
    const aggType = aggregation[measureKey] || 'sum';
    const seriesData = labels.map((label) => {
      const rows = grouped[label] || [];
      const values = rows.map((r) => r[measureKey]);
      return Math.round(aggregate(values, aggType) * 100) / 100;
    });
    return {
      key: measureKey,
      name: measure?.label || measureKey,
      data: seriesData,
      dataType: measure?.dataType || 'number',
    };
  });

  // Sort by measure value if sort field is a measure
  if (sortField && sortField !== 'xAxis') {
    const targetSeries = series.find((s) => s.key === sortField) || series[0];
    if (targetSeries) {
      const paired = labels.map((label, i) => ({
        label,
        idx: i,
        val: targetSeries.data[i] ?? 0,
      }));
      paired.sort((a, b) => sortDir === 'desc' ? b.val - a.val : a.val - b.val);
      const newOrder = paired.map((p) => p.label);
      const indexMap = paired.map((p) => p.idx);
      labels.splice(0, labels.length, ...newOrder);
      series.forEach((s) => {
        const reordered = indexMap.map((i) => s.data[i]);
        s.data.splice(0, s.data.length, ...reordered);
      });
    }
  }

  return { labels, series, rawGrouped: grouped };
}

export function transformPieData(rawData, config, measures) {
  const { labels, series } = transformData(rawData, config, measures);
  if (!series.length) return [];
  const primary = series[0];
  return labels.map((label, i) => ({ name: label, value: primary.data[i] ?? 0 }));
}

export function transformScatterData(rawData, config, measures) {
  const { labels, series } = transformData(rawData, config, measures);
  if (series.length < 2) return [];
  return labels.map((label, i) => ({
    name: label,
    value: [series[0].data[i] ?? 0, series[1].data[i] ?? 0],
  }));
}
