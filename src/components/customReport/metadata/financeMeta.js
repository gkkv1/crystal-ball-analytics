// src/components/customReport/metadata/financeMeta.js
// Chart metadata definitions for Finance Performance module

const NUM = (key, label) => ({ key, label, type: 'measure', dataType: 'number', aggregations: ['sum','avg','min','max'] });
const PCT = (key, label) => ({ key, label, type: 'measure', dataType: 'percentage', aggregations: ['avg','min','max'] });
const DIM = (key, label) => ({ key, label, type: 'dimension', dataType: 'string' });

export const FINANCE_FY_DIMENSIONS = [
  DIM('fy', 'Fiscal Year'),
];

export const FINANCE_PERIOD_DIMENSIONS = [
  DIM('label',   'Quarter Period'),
  DIM('fy',      'Fiscal Year'),
  DIM('quarter', 'Quarter'),
];

export const FINANCE_MARGIN_META = {
  chartId: 'finance-revenue-gm',
  module: 'finance',
  title: 'Revenue & Gross Margin % by Fiscal Year',
  dimensions: FINANCE_FY_DIMENSIONS,
  measures: [
    NUM('revenue',        'Revenue (Cr)'),
    NUM('grossMargin',    'Gross Margin (Cr)'),
    PCT('grossMarginPct', 'Gross Margin %'),
  ],
  defaultConfig: {
    visualType: 'combo',
    xAxis: 'fy',
    yAxis: ['revenue', 'grossMarginPct'],
    secondaryYAxis: ['grossMarginPct'],
    aggregation: { revenue: 'sum', grossMargin: 'sum', grossMarginPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Revenue & Gross Margin % by Fiscal Year',
  },
};

export const FINANCE_COST_PCT_META = {
  chartId: 'finance-cost-pct',
  module: 'finance',
  title: 'Cost as % of Revenue by Fiscal Year',
  dimensions: FINANCE_FY_DIMENSIONS,
  measures: [
    PCT('totalCostPct',  'Total Cost %'),
    PCT('boughtOutPct',  'Bought Out %'),
    PCT('manPowerPct',   'Man Power %'),
    PCT('airFarePct',    'Air Fare %'),
    PCT('othersPct',     'Others %'),
  ],
  defaultConfig: {
    visualType: 'line',
    xAxis: 'fy',
    yAxis: ['totalCostPct', 'boughtOutPct', 'manPowerPct', 'airFarePct', 'othersPct'],
    secondaryYAxis: [],
    aggregation: { totalCostPct: 'avg', boughtOutPct: 'avg', manPowerPct: 'avg', airFarePct: 'avg', othersPct: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Cost as % of Revenue by Fiscal Year',
  },
};

export const FINANCE_YEARLY_REALIZ_META = {
  chartId: 'finance-yearly-realiz',
  module: 'finance',
  title: 'Yearly Realization Trend',
  dimensions: FINANCE_FY_DIMENSIONS,
  measures: [
    NUM('offshoreRealization', 'Offshore Realization'),
    NUM('onsiteRealization',   'Onsite Realization'),
  ],
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'fy',
    yAxis: ['offshoreRealization', 'onsiteRealization'],
    secondaryYAxis: [],
    aggregation: { offshoreRealization: 'avg', onsiteRealization: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Yearly Realization Trend',
  },
};

export const FINANCE_YEARLY_BTA_META = {
  chartId: 'finance-yearly-bta',
  module: 'finance',
  title: 'Yearly BTA Trend',
  dimensions: FINANCE_FY_DIMENSIONS,
  measures: [
    PCT('offshoreBTA', 'Offshore BTA %'),
    PCT('onsiteBTA',   'Onsite BTA %'),
    PCT('adjustedBTA', 'Adjusted BTA %'),
  ],
  defaultConfig: {
    visualType: 'bar',
    xAxis: 'fy',
    yAxis: ['offshoreBTA', 'onsiteBTA', 'adjustedBTA'],
    secondaryYAxis: [],
    aggregation: { offshoreBTA: 'avg', onsiteBTA: 'avg', adjustedBTA: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Yearly BTA Trend',
  },
};

export const FINANCE_QTR_REALIZ_META = {
  chartId: 'finance-qtr-realiz',
  module: 'finance',
  title: 'Quarterly Realization Trend',
  dimensions: FINANCE_PERIOD_DIMENSIONS,
  measures: [
    NUM('offshoreRealization', 'Offshore Realization'),
    NUM('onsiteRealization',   'Onsite Realization'),
  ],
  defaultConfig: {
    visualType: 'line',
    xAxis: 'label',
    yAxis: ['offshoreRealization', 'onsiteRealization'],
    secondaryYAxis: [],
    aggregation: { offshoreRealization: 'avg', onsiteRealization: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly Realization Trend',
  },
};

export const FINANCE_QTR_BTA_META = {
  chartId: 'finance-qtr-bta',
  module: 'finance',
  title: 'Quarterly Adjusted BTA Trend',
  dimensions: FINANCE_PERIOD_DIMENSIONS,
  measures: [
    PCT('adjustedBTA', 'Adjusted BTA %'),
    PCT('offshoreBTA', 'Offshore BTA %'),
    PCT('onsiteBTA',   'Onsite BTA %'),
  ],
  defaultConfig: {
    visualType: 'line',
    xAxis: 'label',
    yAxis: ['adjustedBTA'],
    secondaryYAxis: [],
    aggregation: { adjustedBTA: 'avg', offshoreBTA: 'avg', onsiteBTA: 'avg' },
    sort: { field: 'xAxis', direction: 'asc' },
    showLegend: true,
    showDataLabels: true,
    showGridlines: true,
    title: 'Quarterly Adjusted BTA Trend',
  },
};
