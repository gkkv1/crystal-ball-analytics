// src/utils/customReportValidation.js
// Validation engine for Custom Report configuration
// Returns { valid: boolean, reason?: string } for chart type + data combinations

const CHART_RULES = {
  bar:          { minMeasures: 1, maxMeasures: 10 },
  horizontalBar:{ minMeasures: 1, maxMeasures: 10 },
  line:         { minMeasures: 1, maxMeasures: 6 },
  area:         { minMeasures: 1, maxMeasures: 6 },
  stackedBar:   { minMeasures: 2, maxMeasures: 8 },
  combo:        { minMeasures: 2, maxMeasures: 4 },
  pie:          { minMeasures: 1, maxMeasures: 1, maxLabels: 12 },
  donut:        { minMeasures: 1, maxMeasures: 1, maxLabels: 12 },
  scatter:      { minMeasures: 2, maxMeasures: 2 },
  radar:        { minMeasures: 1, maxMeasures: 6 },
  heatmap:      { minMeasures: 1, maxMeasures: 1 },
  kpi:          { minMeasures: 1, maxMeasures: 10 },
  table:        { minMeasures: 1, maxMeasures: 10 },
  pivot:        { minMeasures: 1, maxMeasures: 6 },
};

/**
 * Validate a CustomReportConfig against current data
 * @param {object} config - CustomReportConfig
 * @param {string[]} labels - current x-axis labels
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateConfig(config, labels = []) {
  const { visualType, xAxis, yAxis = [] } = config;

  if (!xAxis) {
    return { valid: false, reason: 'Please select an X-axis field.' };
  }
  if (!yAxis.length) {
    return { valid: false, reason: 'Please select at least one metric for the Y-axis.' };
  }

  const rule = CHART_RULES[visualType];
  if (!rule) return { valid: true };

  if (yAxis.length < rule.minMeasures) {
    return {
      valid: false,
      reason: `${getChartLabel(visualType)} requires at least ${rule.minMeasures} metric${rule.minMeasures > 1 ? 's' : ''}.`,
    };
  }
  if (yAxis.length > rule.maxMeasures) {
    return {
      valid: false,
      reason: `${getChartLabel(visualType)} supports at most ${rule.maxMeasures} metric${rule.maxMeasures > 1 ? 's' : ''}.`,
    };
  }
  if (rule.maxLabels && labels.length > rule.maxLabels) {
    return {
      valid: false,
      reason: `${getChartLabel(visualType)} works best with ${rule.maxLabels} or fewer categories. Current X-axis has ${labels.length} - try a higher-level grouping.`,
    };
  }

  return { valid: true };
}

/**
 * Check whether a chart type is available given current yAxis selection count
 */
export function isChartTypeAvailable(visualType, yAxisCount, labelCount = 0) {
  const rule = CHART_RULES[visualType];
  if (!rule) return { available: true, reason: null };

  if (yAxisCount < rule.minMeasures) {
    return {
      available: false,
      reason: `Requires ${rule.minMeasures}+ metrics selected`,
    };
  }
  if (yAxisCount > rule.maxMeasures) {
    return {
      available: false,
      reason: `Supports max ${rule.maxMeasures} metric${rule.maxMeasures > 1 ? 's' : ''}`,
    };
  }
  if (rule.maxLabels && labelCount > rule.maxLabels) {
    return {
      available: false,
      reason: `X-axis has ${labelCount} values; max ${rule.maxLabels} for this chart`,
    };
  }

  return { available: true, reason: null };
}

function getChartLabel(type) {
  const LABELS = {
    bar: 'Bar Chart', horizontalBar: 'Horizontal Bar', line: 'Line Chart',
    area: 'Area Chart', stackedBar: 'Stacked Bar', combo: 'Combo Chart',
    pie: 'Pie Chart', donut: 'Donut Chart', scatter: 'Scatter Plot',
    radar: 'Radar Chart', heatmap: 'Heatmap', kpi: 'KPI Cards',
    table: 'Data Table', pivot: 'Pivot Grid',
  };
  return LABELS[type] || type;
}

export const CHART_TYPES = [
  { key: 'bar',           label: 'Bar' },
  { key: 'horizontalBar', label: 'Horiz. Bar' },
  { key: 'line',          label: 'Line' },
  { key: 'area',          label: 'Area' },
  { key: 'stackedBar',    label: 'Stacked' },
  { key: 'combo',         label: 'Combo' },
  { key: 'pie',           label: 'Pie' },
  { key: 'donut',         label: 'Donut' },
  { key: 'scatter',       label: 'Scatter' },
  { key: 'radar',         label: 'Radar' },
  { key: 'heatmap',       label: 'Heatmap' },
  { key: 'kpi',           label: 'KPI Cards' },
  { key: 'table',         label: 'Table' },
  { key: 'pivot',         label: 'Pivot' },
];
