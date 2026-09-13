// src/components/customReport/VisualRenderer.jsx
// Unified ECharts renderer for all Custom Report chart types
// Uses useChartTheme() for full dark/light mode consistency

import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import { transformData, transformPieData } from '../../utils/customReportTransform.js';

const SERIES_COLORS = (ct) => [
  ct.colors.blue, ct.colors.teal, ct.colors.amber,
  ct.colors.violet, ct.colors.green, ct.colors.orange,
  ct.colors.red, ct.colors.indigo,
];

function fmtVal(v, dataType) {
  if (v == null || isNaN(v)) return '-';
  if (dataType === 'percentage') return `${v.toFixed(1)}%`;
  if (v >= 10000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(1);
}

function buildBarOption(labels, series, config, ct, horizontal = false) {
  const colors = SERIES_COLORS(ct);
  const isStacked = config.visualType === 'stackedBar';
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...ct.tooltip, axisPointer: { type: 'shadow' } },
    legend: config.showLegend ? { top: 0, right: 0, textStyle: ct.legendText } : { show: false },
    grid: { top: config.showLegend ? 40 : 16, right: 20, bottom: 40, left: horizontal ? 100 : 60, containLabel: horizontal },
    [horizontal ? 'yAxis' : 'xAxis']: {
      type: 'category', data: labels,
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', rotate: horizontal ? 0 : (labels.length > 8 ? 35 : 0) },
    },
    [horizontal ? 'xAxis' : 'yAxis']: {
      type: 'value', axisLine: { show: false }, axisTick: { show: false },
      splitLine: config.showGridlines ? { lineStyle: ct.splitLineStyle } : { show: false },
      axisLabel: ct.axisLabel,
    },
    series: series.map((s, i) => ({
      name: s.name, type: 'bar', stack: isStacked ? 'total' : undefined,
      barMaxWidth: horizontal ? undefined : Math.max(20, Math.min(44, 280 / (labels.length * series.length + 1))),
      data: s.data,
      itemStyle: { color: colors[i % colors.length], borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] },
      label: config.showDataLabels ? {
        show: true, position: horizontal ? 'right' : 'top', fontSize: 10, fontWeight: '700',
        color: colors[i % colors.length],
        formatter: (p) => fmtVal(p.value, s.dataType),
      } : { show: false },
    })),
    animation: true, animationDuration: 500,
  };
}

function buildLineOption(labels, series, config, ct, area = false) {
  const colors = SERIES_COLORS(ct);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...ct.tooltip },
    legend: config.showLegend ? { top: 0, right: 0, textStyle: ct.legendText } : { show: false },
    grid: { top: config.showLegend ? 40 : 16, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category', data: labels,
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value', axisLine: { show: false }, axisTick: { show: false },
      splitLine: config.showGridlines ? { lineStyle: ct.splitLineStyle } : { show: false },
      axisLabel: ct.axisLabel,
    },
    series: series.map((s, i) => ({
      name: s.name, type: 'line', smooth: true,
      symbol: 'circle', symbolSize: 7,
      data: s.data,
      lineStyle: { color: colors[i % colors.length], width: 2.5 },
      itemStyle: { color: colors[i % colors.length], borderWidth: 2, borderColor: ct.bg },
      areaStyle: area ? { color: `${colors[i % colors.length]}22` } : undefined,
      label: config.showDataLabels ? {
        show: true, position: 'top', fontSize: 10, fontWeight: '700',
        color: colors[i % colors.length],
        formatter: (p) => fmtVal(p.value, s.dataType),
      } : { show: false },
    })),
    animation: true, animationDuration: 500,
  };
}

function buildComboOption(labels, series, config, ct) {
  const colors = SERIES_COLORS(ct);
  const secondary = config.secondaryYAxis || [];
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...ct.tooltip },
    legend: config.showLegend ? { top: 0, right: 0, textStyle: ct.legendText } : { show: false },
    grid: { top: config.showLegend ? 40 : 16, right: secondary.length ? 60 : 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category', data: labels,
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: [
      {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: config.showGridlines ? { lineStyle: ct.splitLineStyle } : { show: false },
        axisLabel: ct.axisLabel,
      },
      secondary.length ? {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { ...ct.axisLabel, formatter: (v) => `${v}%` },
      } : null,
    ].filter(Boolean),
    series: series.map((s, i) => {
      const isSecondary = secondary.includes(s.key);
      return {
        name: s.name,
        type: isSecondary ? 'line' : 'bar',
        yAxisIndex: isSecondary && secondary.length ? 1 : 0,
        smooth: isSecondary,
        symbol: isSecondary ? 'circle' : undefined,
        symbolSize: isSecondary ? 7 : undefined,
        barMaxWidth: isSecondary ? undefined : 44,
        data: s.data,
        itemStyle: {
          color: colors[i % colors.length],
          borderRadius: !isSecondary ? [3, 3, 0, 0] : undefined,
          borderWidth: isSecondary ? 2 : undefined,
          borderColor: isSecondary ? ct.bg : undefined,
        },
        lineStyle: isSecondary ? { color: colors[i % colors.length], width: 2.5 } : undefined,
        label: config.showDataLabels ? {
          show: true, position: 'top', fontSize: 10, fontWeight: '700',
          color: colors[i % colors.length],
          formatter: (p) => fmtVal(p.value, s.dataType),
        } : { show: false },
      };
    }),
    animation: true, animationDuration: 500,
  };
}

function buildPieOption(pieData, config, ct, donut = false) {
  const colors = SERIES_COLORS(ct);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...ct.tooltip, formatter: '{b}: {c} ({d}%)' },
    legend: config.showLegend ? { bottom: 0, textStyle: ct.legendText } : { show: false },
    series: [{
      name: config.title,
      type: 'pie',
      radius: donut ? ['40%', '68%'] : '68%',
      center: ['50%', config.showLegend ? '45%' : '50%'],
      data: pieData,
      itemStyle: { borderRadius: 4, borderColor: ct.bg, borderWidth: 2 },
      label: config.showDataLabels ? {
        show: true, fontSize: 11, fontWeight: '600',
        formatter: (p) => `${p.name}: ${fmtVal(p.value, 'number')}`,
        color: ct.textPrimary,
      } : { show: false },
      emphasis: { itemStyle: { shadowBlur: 12, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' } },
      color: pieData.map((_, i) => colors[i % colors.length]),
    }],
    animation: true, animationDuration: 500,
  };
}

function buildScatterOption(labels, series, config, ct) {
  const colors = SERIES_COLORS(ct);
  const xSeries = series[0]?.data || [];
  const ySeries = series[1]?.data || [];
  const scatterData = xSeries.map((x, i) => [x, ySeries[i] ?? 0]);
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item', ...ct.tooltip,
      formatter: (p) => `${labels[p.dataIndex] || ''}<br/>${series[0]?.name}: ${fmtVal(p.value[0])}<br/>${series[1]?.name}: ${fmtVal(p.value[1])}`,
    },
    xAxis: {
      type: 'value', name: series[0]?.name || 'X',
      axisLine: ct.axisLine, axisTick: { show: false },
      splitLine: config.showGridlines ? { lineStyle: ct.splitLineStyle } : { show: false },
      axisLabel: ct.axisLabel,
    },
    yAxis: {
      type: 'value', name: series[1]?.name || 'Y',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: config.showGridlines ? { lineStyle: ct.splitLineStyle } : { show: false },
      axisLabel: ct.axisLabel,
    },
    series: [{ type: 'scatter', data: scatterData, symbolSize: 10, itemStyle: { color: colors[0], opacity: 0.8 } }],
    animation: true, animationDuration: 500,
  };
}

function buildRadarOption(labels, series, config, ct) {
  const colors = SERIES_COLORS(ct);
  const allVals = series.flatMap((s) => s.data.filter((v) => v != null));
  const maxVal = Math.max(...allVals, 1);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', ...ct.tooltip },
    legend: config.showLegend ? { bottom: 0, textStyle: ct.legendText } : { show: false },
    radar: {
      indicator: labels.map((l) => ({ name: l, max: maxVal })),
      splitLine: { lineStyle: { color: ct.splitLineStyle?.color || '#444', opacity: 0.4 } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: ct.splitLineStyle?.color || '#444', opacity: 0.3 } },
      axisName: { color: ct.textSec, fontSize: 11 },
    },
    series: series.map((s, i) => ({
      name: s.name, type: 'radar',
      data: [{ value: s.data, name: s.name }],
      areaStyle: { opacity: 0.1 },
      lineStyle: { color: colors[i % colors.length], width: 2 },
      itemStyle: { color: colors[i % colors.length] },
    })),
    animation: true, animationDuration: 500,
  };
}

// KPI Cards renderer
function KPICardsView({ labels, series, config, ct }) {
  const colors = [
    '#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#22c55e', '#f97316',
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', padding: '16px', height: '100%', overflowY: 'auto' }}>
      {series.map((s, i) => {
        const total = s.data.reduce((acc, v) => acc + (v || 0), 0);
        const avg = s.data.length ? total / s.data.filter((v) => v != null).length : 0;
        const displayVal = s.dataType === 'percentage' ? avg : total;
        return (
          <div key={s.key} style={{
            background: `linear-gradient(135deg, ${colors[i % colors.length]}18, ${colors[i % colors.length]}08)`,
            border: `1px solid ${colors[i % colors.length]}33`,
            borderRadius: '12px', padding: '16px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: ct.textSec, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {s.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: colors[i % colors.length] }}>
              {fmtVal(displayVal, s.dataType)}
            </div>
            <div style={{ fontSize: 10, color: ct.textSec, marginTop: 4 }}>
              {s.dataType === 'percentage' ? 'avg' : 'total'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Data Table renderer
function DataTableView({ labels, series, config, ct }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const filtered = labels
    .map((label, i) => ({ label, values: series.map((s) => s.data[i]) }))
    .filter((row) => row.label.toString().toLowerCase().includes(search.toLowerCase()));

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: 12 }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${ct.splitLineStyle?.color || '#333'}` }}>
        <input
          style={{
            background: 'rgba(255,255,255,0.07)', border: `1px solid ${ct.splitLineStyle?.color || '#444'}`,
            borderRadius: 6, padding: '4px 10px', color: ct.textPrimary, fontSize: 12, width: '100%',
          }}
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: ct.textSec, fontWeight: 700, borderBottom: `1px solid ${ct.splitLineStyle?.color || '#333'}` }}>
                {config.xAxis}
              </th>
              {series.map((s) => (
                <th key={s.key} style={{ padding: '8px 12px', textAlign: 'right', color: ct.textSec, fontWeight: 700, borderBottom: `1px solid ${ct.splitLineStyle?.color || '#333'}` }}>
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${ct.splitLineStyle?.color || '#333'}22` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '7px 12px', color: ct.textPrimary, fontWeight: 600 }}>{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: '7px 12px', textAlign: 'right', color: ct.textSec }}>
                    {fmtVal(v, series[j]?.dataType)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '8px', borderTop: `1px solid ${ct.splitLineStyle?.color || '#333'}` }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: 'rgba(255,255,255,0.08)', color: ct.textPrimary, cursor: 'pointer' }}>
            Prev
          </button>
          <span style={{ color: ct.textSec, lineHeight: '26px' }}>{page + 1} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
            style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: 'rgba(255,255,255,0.08)', color: ct.textPrimary, cursor: 'pointer' }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function VisualRenderer({ rawData, config, chartMeta, style }) {
  const ct = useChartTheme();

  // Non-chart renderers (kpi, table, pivot) handled separately
  const isTableType = ['kpi', 'table', 'pivot'].includes(config?.visualType);

  const tableData = useMemo(() => {
    if (!isTableType || !rawData?.length) return null;
    const { labels, series } = transformData(rawData, config, chartMeta?.measures);
    return { labels, series };
  }, [isTableType, rawData, config, chartMeta]);

  const { option, isEmpty } = useMemo(() => {
    if (isTableType) return { option: null, isEmpty: false };
    if (!rawData?.length || !config?.yAxis?.length) return { option: null, isEmpty: true };

    const { visualType } = config;

    if (visualType === 'pie' || visualType === 'donut') {
      const pieData = transformPieData(rawData, config, chartMeta?.measures);
      if (!pieData.length) return { option: null, isEmpty: true };
      return { option: buildPieOption(pieData, config, ct, visualType === 'donut'), isEmpty: false };
    }

    const { labels, series } = transformData(rawData, config, chartMeta?.measures);
    if (!labels.length || !series.length) return { option: null, isEmpty: true };

    let opt;
    switch (visualType) {
      case 'line':          opt = buildLineOption(labels, series, config, ct, false); break;
      case 'area':          opt = buildLineOption(labels, series, config, ct, true); break;
      case 'horizontalBar': opt = buildBarOption(labels, series, config, ct, true); break;
      case 'stackedBar':    opt = buildBarOption(labels, series, config, ct, false); break;
      case 'combo':         opt = buildComboOption(labels, series, config, ct); break;
      case 'scatter':       opt = buildScatterOption(labels, series, config, ct); break;
      case 'radar':         opt = buildRadarOption(labels, series, config, ct); break;
      default:              opt = buildBarOption(labels, series, config, ct, false);
    }
    return { option: opt, isEmpty: false };
  }, [rawData, config, chartMeta, ct, isTableType]);

  // Table/KPI renderers
  if (isTableType && tableData) {
    const { labels, series } = tableData;
    if (!labels.length || !series.length) {
      return <div className="ve-empty-preview"><span>No data to display.</span></div>;
    }
    if (config.visualType === 'kpi') {
      return (
        <div className="ve-chart-title-area" style={style}>
          {config.title && <div className="ve-preview-title">{config.title}</div>}
          <KPICardsView labels={labels} series={series} config={config} ct={ct} />
        </div>
      );
    }
    return (
      <div className="ve-chart-title-area" style={{ ...style, display: 'flex', flexDirection: 'column' }}>
        {config.title && <div className="ve-preview-title">{config.title}</div>}
        <DataTableView labels={labels} series={series} config={config} ct={ct} />
      </div>
    );
  }

  if (isEmpty || !option) {
    return (
      <div className="ve-empty-preview">
        <span>No data to display - adjust your configuration.</span>
      </div>
    );
  }

  return (
    <div className="ve-chart-title-area" style={style}>
      {config.title && (
        <div className="ve-preview-title">{config.title}</div>
      )}
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge={true}
      />
    </div>
  );
}
