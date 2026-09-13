// src/components/customReport/metadata/revenueMeta.js
// Chart metadata definitions for Revenue Performance module

const NUM = (key, label, aggs) => ({ key, label, type: 'measure', dataType: 'number', aggregations: aggs || ['sum','avg','min','max'] });
const PCT = (key, label) => ({ key, label, type: 'measure', dataType: 'percentage', aggregations: ['avg','min','max'] });
const DIM = (key, label) => ({ key, label, type: 'dimension', dataType: 'string' });

export const REVENUE_DIMENSIONS = [
  DIM('fy',         'Fiscal Year'),
  DIM('quarter',    'Quarter'),
  DIM('bgCluster',  'BG Cluster'),
  DIM('bg',         'Business Group'),
  DIM('subUnit',    'Sub Unit'),
  DIM('geo',        'Geography'),
  DIM('groupClient','Group Client'),
];

export const REVENUE_MEASURES = [
  NUM('aop',              'AOP'),
  NUM('actual',           'Revenue Actual'),
  NUM('target',           'Target'),
  NUM('clusterProj',      'Cluster Projection'),
  NUM('prevActual',       'Prior Period Revenue'),
  PCT('aopPct',           'AOP Achievement %'),
  PCT('yoyPct',           'YoY Growth %'),
];

export const REVENUE_FY_META = {
  chartId: 'revenue-fy-performance',
  module: 'revenue',
  title: 'FY Revenue Performance',
  dimensions: REVENUE_DIMENSIONS,
  measures: REVENUE_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'fy',
    yAxis: ['aop', 'actual'],
    secondaryYAxis: [],
    aggregation: { aop: 'sum', actual: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'FY Revenue Performance',
  },
};

export const REVENUE_AOP_YOY_META = {
  chartId: 'revenue-aop-yoy',
  module: 'revenue',
  title: 'AOP & YoY Trend',
  dimensions: REVENUE_DIMENSIONS,
  measures: REVENUE_MEASURES,
  defaultConfig: {
    visualType: 'line',
    xAxis: 'fy',
    yAxis: ['aopPct', 'yoyPct'],
    secondaryYAxis: [],
    aggregation: { aopPct: 'avg', yoyPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'AOP & YoY Trend',
  },
};

export const REVENUE_QUARTERLY_META = {
  chartId: 'revenue-quarterly-mix',
  module: 'revenue',
  title: 'Quarterly Performance',
  dimensions: REVENUE_DIMENSIONS,
  measures: REVENUE_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'quarter',
    yAxis: ['aop', 'actual'],
    secondaryYAxis: [],
    aggregation: { aop: 'sum', actual: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly Performance',
  },
};

export const REVENUE_WEEKLY_META = {
  chartId: 'revenue-weekly-run-rate',
  module: 'revenue',
  title: 'Projected, Quarterly Target and AOP by Week Number',
  dimensions: [
    DIM('week',      'Week Number'),
    DIM('weekLabel', 'Week Label'),
    DIM('weekDate',  'Week Date'),
  ],
  measures: [
    NUM('clusterProj', 'Cluster Projection'),
    NUM('target',      'Target'),
    NUM('aop',         'AOP'),
    NUM('actual',      'Actual Revenue'),
    NUM('bgProj',      'BG Projection'),
    NUM('suProj',      'Sub Unit Projection'),
  ],
  defaultConfig: {
    visualType: 'line',
    xAxis: 'week',
    yAxis: ['clusterProj', 'target', 'aop'],
    secondaryYAxis: [],
    aggregation: { clusterProj: 'sum', target: 'sum', aop: 'sum', actual: 'sum', bgProj: 'sum', suProj: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Projected, Quarterly Target and AOP by Week Number',
  },
};

export const REVENUE_AOP_QTR_META = {
  chartId: 'revenue-aop-quarterly',
  module: 'revenue',
  title: 'Quarterly AOP% & QoQ% Trend',
  dimensions: REVENUE_DIMENSIONS,
  measures: REVENUE_MEASURES,
  defaultConfig: {
    visualType: 'line',
    xAxis: 'quarter',
    yAxis: ['aopPct', 'qoqPct'],
    secondaryYAxis: [],
    aggregation: { aopPct: 'avg', qoqPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly AOP% & QoQ% Trend',
  },
};

export const REVENUE_CUR_QTR_META = {
  chartId: 'revenue-cur-qtr-compare',
  module: 'revenue',
  title: 'Quarterly Performance  -  All Projections',
  dimensions: REVENUE_DIMENSIONS,
  measures: REVENUE_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'quarter',
    yAxis: ['aop', 'actual', 'target'],
    secondaryYAxis: [],
    aggregation: { aop: 'sum', actual: 'sum', target: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly Performance  -  All Projections',
  },
};
