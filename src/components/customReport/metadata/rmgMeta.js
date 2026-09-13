// src/components/customReport/metadata/rmgMeta.js

const NUM = (key, label) => ({ key, label, type: 'measure', dataType: 'number', aggregations: ['sum','avg','min','max'] });
const DIM = (key, label) => ({ key, label, type: 'dimension', dataType: 'string' });

export const RMG_DIMENSIONS = [
  DIM('weekId',      'Week'),
  DIM('bgCluster',   'BG Cluster'),
  DIM('subUnit',     'Sub Unit'),
  DIM('geo',         'Geography'),
  DIM('groupClient', 'Group Client'),
];

export const RMG_MEASURES = [
  NUM('wonHC', 'WON HC'),
];

export const RMG_TREND_META = {
  chartId: 'rmg-won-hc-trend',
  module: 'rmg',
  title: 'WON HC Trend',
  dimensions: RMG_DIMENSIONS,
  measures: RMG_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'weekId',
    yAxis: ['wonHC'],
    secondaryYAxis: [],
    aggregation: { wonHC: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: false,
    showDataLabels: true,
    showGridlines: true,
    title: 'WON HC Trend',
  },
};

export const RMG_CLUSTER_TREND_META = {
  chartId: 'rmg-cluster-trend',
  module: 'rmg',
  title: 'BG Cluster Wise WON HC Trend',
  dimensions: RMG_DIMENSIONS,
  measures: RMG_MEASURES,
  defaultConfig: {
    visualType: 'line',
    xAxis: 'weekId',
    yAxis: ['wonHC'],
    secondaryYAxis: [],
    aggregation: { wonHC: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: false,
    showGridlines: true,
    title: 'BG Cluster Wise WON HC Trend',
  },
};

export const RMG_SUBUNIT_TREND_META = {
  chartId: 'rmg-subunit-trend',
  module: 'rmg',
  title: 'Sub Unit Wise WON HC Trend',
  dimensions: RMG_DIMENSIONS,
  measures: RMG_MEASURES,
  defaultConfig: {
    visualType: 'line',
    xAxis: 'weekId',
    yAxis: ['wonHC'],
    secondaryYAxis: [],
    aggregation: { wonHC: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: false,
    showGridlines: true,
    title: 'Sub Unit Wise WON HC Trend',
  },
};
