// src/components/customReport/metadata/degMeta.js

const NUM = (key, label) => ({ key, label, type: 'measure', dataType: 'number', aggregations: ['sum','avg','min','max'] });
const PCT = (key, label) => ({ key, label, type: 'measure', dataType: 'percentage', aggregations: ['avg','min','max'] });
const DIM = (key, label) => ({ key, label, type: 'dimension', dataType: 'string' });

export const DEG_DIMENSIONS = [
  DIM('period',    'Period (H1/H2)'),
  DIM('bgCluster', 'BG Cluster'),
  DIM('subUnit',   'Sub Unit'),
];

export const DEG_MEASURES = [
  PCT('csiScore',    'CSI Score %'),
  NUM('totalProjects','Total Projects'),
  NUM('csi100Count', '100% CSI Count'),
  PCT('csi100Pct',   '100% CSI %'),
  NUM('lowCsiCount', 'Low CSI Count'),
  PCT('loyaltyPct',  'Loyalty %'),
];

export const DEG_CSI_TREND_META = {
  chartId: 'deg-csi-trend',
  module: 'deg',
  title: 'CSI% Trend across Periods',
  dimensions: DEG_DIMENSIONS,
  measures: DEG_MEASURES,
  defaultConfig: {
    visualType: 'line',
    xAxis: 'period',
    yAxis: ['csiScore'],
    secondaryYAxis: [],
    aggregation: { csiScore: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: false,
    showDataLabels: true,
    showGridlines: true,
    title: 'CSI% Trend across Periods',
  },
};

export const DEG_CSI_PROJECT_META = {
  chartId: 'deg-csi-project',
  module: 'deg',
  title: 'Total Projects vs 100% CSI',
  dimensions: DEG_DIMENSIONS,
  measures: DEG_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'period',
    yAxis: ['totalProjects', 'csi100Count'],
    secondaryYAxis: [],
    aggregation: { totalProjects: 'sum', csi100Count: 'sum' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Total Projects vs 100% CSI',
  },
};

export const DEG_CSI_SUBUNIT_META = {
  chartId: 'deg-csi-subunit',
  module: 'deg',
  title: 'CSI% Trend by Sub Unit',
  dimensions: DEG_DIMENSIONS,
  measures: DEG_MEASURES,
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'period',
    yAxis: ['csiScore'],
    secondaryYAxis: [],
    aggregation: { csiScore: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'CSI% Trend by Sub Unit',
  },
};
