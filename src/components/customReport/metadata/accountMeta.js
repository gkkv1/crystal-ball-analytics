// src/components/customReport/metadata/accountMeta.js
// Chart metadata definitions for Account Management module

const NUM = (key, label) => ({ key, label, type: 'measure', dataType: 'number', aggregations: ['sum','avg','min','max'] });
const PCT = (key, label) => ({ key, label, type: 'measure', dataType: 'percentage', aggregations: ['avg','min','max'] });
const DIM = (key, label) => ({ key, label, type: 'dimension', dataType: 'string' });

export const ACCOUNT_FY_DIMENSIONS = [
  DIM('fiscalYear', 'Fiscal Year'),
];

export const ACCOUNT_QTR_DIMENSIONS = [
  DIM('label',      'Quarter Period'),
  DIM('fiscalYear', 'Fiscal Year'),
  DIM('quarter',    'Quarter'),
];

export const ACCOUNT_DIMENSIONS = ACCOUNT_QTR_DIMENSIONS;

export const ACCOUNT_MEASURES = [
  NUM('aop',         'AOP Target'),
  NUM('actual',      'Actual / Projected'),
  PCT('achievement', 'Achievement %'),
  PCT('aopPct',      'AOP Achievement %'),
  PCT('yoyPct',      'YoY Growth %'),
];

export const ACCOUNT_FY_META = {
  chartId: 'account-fy-performance',
  module: 'account',
  title: 'FY Performance',
  dimensions: ACCOUNT_FY_DIMENSIONS,
  measures: [
    NUM('aop',    'AOP Target'),
    NUM('actual', 'Actual / Projected'),
  ],
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'fiscalYear',
    yAxis: ['aop', 'actual'],
    secondaryYAxis: [],
    aggregation: { aop: 'sum', actual: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'FY Performance',
  },
};

export const ACCOUNT_AOP_YOY_META = {
  chartId: 'account-aop-yoy',
  module: 'account',
  title: 'AOP & YoY Trend',
  dimensions: ACCOUNT_FY_DIMENSIONS,
  measures: [
    PCT('aopPct', 'AOP Achievement %'),
    PCT('yoyPct', 'YoY Growth %'),
  ],
  defaultConfig: {
    visualType: 'line',
    xAxis: 'fiscalYear',
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

export const ACCOUNT_QUARTERLY_META = {
  chartId: 'account-quarterly',
  module: 'account',
  title: 'Quarterly Performance',
  dimensions: ACCOUNT_QTR_DIMENSIONS,
  measures: [
    NUM('aop',         'AOP Target'),
    NUM('actual',      'Actual / Projected'),
    PCT('achievement', 'Achievement %'),
  ],
  defaultConfig: {
    visualType: 'combo',
    xAxis: 'label',
    yAxis: ['aop', 'actual', 'achievement'],
    secondaryYAxis: ['achievement'],
    aggregation: { aop: 'sum', actual: 'sum', achievement: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly Performance',
  },
};
