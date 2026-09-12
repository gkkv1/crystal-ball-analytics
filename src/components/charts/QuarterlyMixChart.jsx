// src/components/charts/QuarterlyMixChart.jsx
// Quarterly grouped bars + QoQ% overlay line across all FY quarters
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { getQuarterlyPerformance } from '../../utils/calculations.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import EmptyState from '../common/EmptyState.jsx';

export default function QuarterlyMixChart() {
  const { allData, filters } = useDashboardFilters();
  const ct = useChartTheme();
  const data = useMemo(() => getQuarterlyPerformance(allData, filters), [allData, filters]);

  if (!data.length) return <EmptyState />;

  const labels = data.map((d) => d.label);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...ct.tooltip,
      formatter: (params) => {
        const label = params[0]?.axisValue;
        let html = `<div style="font-weight:700;margin-bottom:6px;color:${ct.textPrimary}">${label}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:${p.seriesType === 'line' ? '50%' : '2px'};background:${p.color};margin-right:6px"></span>`;
          const val = p.seriesName === 'QoQ %'
            ? (p.value !== null ? `${p.value?.toFixed(1)}%` : '—')
            : `₹${(p.value / 1000).toFixed(1)}K Cr`;
          html += `<div style="display:flex;justify-content:space-between;gap:20px;font-size:12px;color:${ct.textSec}">
            <span>${dot}${p.seriesName}</span><span style="font-weight:700;color:${ct.textPrimary}">${val}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      top: 0, right: 0,
      itemWidth: 12, itemHeight: 12,
      textStyle: ct.legendText,
    },
    grid: { top: 40, right: 60, bottom: 48, left: 60 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontSize: 10, rotate: data.length > 12 ? 30 : 0, interval: 0 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Revenue (Cr)',
        nameTextStyle: { color: ct.textMuted, fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: ct.splitLineStyle },
        axisLabel: { ...ct.axisLabel, fontSize: 10, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v },
      },
      {
        type: 'value',
        name: 'QoQ %',
        nameTextStyle: { color: ct.colors.amber, fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: ct.colors.amber, fontSize: 10, formatter: (v) => `${v.toFixed(0)}%` },
      },
    ],
    series: [
      {
        name: 'AOP',
        type: 'bar',
        barWidth: '28%',
        data: data.map((d) => Math.round(d.aop)),
        itemStyle: { color: ct.colors.blue, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Actual / Projection',
        type: 'bar',
        barWidth: '28%',
        data: data.map((d) => Math.round(d.actual)),
        itemStyle: { color: ct.colors.teal, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'QoQ %',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.map((d) => d.qoqPct !== null ? Math.round(d.qoqPct * 10) / 10 : null),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: ct.colors.amber, width: 2 },
        itemStyle: { color: ct.colors.amber, borderWidth: 2, borderColor: ct.bg },
        connectNulls: false,
      },
    ],
    animation: true,
    animationDuration: 600,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
