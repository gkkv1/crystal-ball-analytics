// src/components/customReport/metadata/salesMeta.js

const NUM = (key, label) => ({ key, label, type: 'measure', dataType: 'number', aggregations: ['sum','avg','min','max'] });
const PCT = (key, label) => ({ key, label, type: 'measure', dataType: 'percentage', aggregations: ['avg','min','max'] });
const DIM = (key, label) => ({ key, label, type: 'dimension', dataType: 'string' });

export const SALES_DIMENSIONS = [
  DIM('label',       'Quarter Period'),
  DIM('fy',          'Fiscal Year'),
  DIM('quarter',     'Quarter'),
  DIM('bgCluster',   'BG Cluster'),
  DIM('bg',          'Business Group'),
  DIM('subUnit',     'Sub Unit'),
  DIM('salesGeo',    'Geography'),
  DIM('groupClient', 'Group Client'),
];

export const SALES_MEASURES = [
  NUM('tcvAOP',      'TCV AOP'),
  NUM('tcvWon',      'TCV Won'),
  NUM('tcvPipeline', 'TCV Pipeline'),
  PCT('achievedPct', 'Achievement %'),
  NUM('newDealAOP',  'New Deal AOP'),
  NUM('newDealWon',  'New Deal Won'),
];

export const SALES_FY_TCV_META = {
  chartId: 'sales-fy-tcv',
  module: 'sales',
  title: 'FY TCV Trend',
  dimensions: SALES_DIMENSIONS,
  measures: SALES_MEASURES,
  defaultConfig: {
    visualType: 'combo',
    xAxis: 'fy',
    yAxis: ['tcvAOP', 'tcvWon', 'achievedPct'],
    secondaryYAxis: ['achievedPct'],
    aggregation: { tcvAOP: 'sum', tcvWon: 'sum', achievedPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'FY TCV Trend',
  },
};

export const SALES_FY_NEW_DEAL_META = {
  chartId: 'sales-fy-new-deal',
  module: 'sales',
  title: 'FY New Deal Trend',
  dimensions: SALES_DIMENSIONS,
  measures: SALES_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'fy',
    yAxis: ['newDealAOP', 'newDealWon'],
    secondaryYAxis: [],
    aggregation: { newDealAOP: 'sum', newDealWon: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'FY New Deal Trend',
  },
};

export const SALES_QTR_TCV_META = {
  chartId: 'sales-qtr-tcv',
  module: 'sales',
  title: 'Quarterly TCV Performance',
  dimensions: SALES_DIMENSIONS,
  measures: SALES_MEASURES,
  defaultConfig: {
    visualType: 'combo',
    xAxis: 'label',
    yAxis: ['tcvAOP', 'tcvWon', 'achievedPct'],
    secondaryYAxis: ['achievedPct'],
    aggregation: { tcvAOP: 'sum', tcvWon: 'sum', achievedPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly TCV Performance',
  },
};

export const SALES_QTR_NEW_DEAL_META = {
  chartId: 'sales-qtr-new-deal',
  module: 'sales',
  title: 'Quarterly New Deal TCV Trend',
  dimensions: SALES_DIMENSIONS,
  measures: SALES_MEASURES,
  defaultConfig: {
    visualType: 'combo',
    xAxis: 'label',
    yAxis: ['newDealAOP', 'newDealWon', 'achievedPct'],
    secondaryYAxis: ['achievedPct'],
    aggregation: { newDealAOP: 'sum', newDealWon: 'sum', achievedPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly New Deal TCV Trend',
  },
};
