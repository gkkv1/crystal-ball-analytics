// src/components/charts/WeeklyRunRateChart.jsx
// Weekly projection vs target vs AOP run-rate area/line chart
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { getWeeklyPerformance } from '../../utils/calculations.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import { formatNumber } from '../../utils/formatters.js';
import EmptyState from '../common/EmptyState.jsx';

export default function WeeklyRunRateChart() {
  const { allData, filters } = useDashboardFilters();
  const ct = useChartTheme();
  const data = useMemo(() => getWeeklyPerformance(allData, filters), [allData, filters]);

  if (!data.length) return <EmptyState />;

  // X-axis: only show week number; date shown in tooltip
  const labels = data.map((d) => d.weekLabel || d.week);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter: (params) => {
        const idx = params[0]?.dataIndex;
        const d = data[idx];
        if (!d) return '';
        const gap = d.actual - d.target;
        return `
          <div style="font-weight:700;margin-bottom:6px;color:${ct.textPrimary}">${d.weekLabel} · ${d.weekDate}</div>
          <div style="font-size:12px;display:grid;grid-template-columns:auto auto;gap:3px 16px;color:${ct.textSec}">
            <span>Projection</span><span style="font-weight:700;color:${ct.textPrimary}">₹${formatNumber(d.clusterProj)} Cr</span>
            <span>Target</span><span style="font-weight:700;color:${ct.textPrimary}">₹${formatNumber(d.target)} Cr</span>
            <span>AOP</span><span style="font-weight:700;color:${ct.textPrimary}">₹${formatNumber(d.aop)} Cr</span>
            <span>Actual</span><span style="font-weight:700;color:${ct.textPrimary}">₹${formatNumber(d.actual)} Cr</span>
            <span>Gap</span><span style="font-weight:700;color:${gap >= 0 ? ct.colors.green : ct.colors.red}">${gap >= 0 ? '+' : ''}${formatNumber(gap)} Cr</span>
          </div>
        `;
      },
    },
    legend: {
      top: 0, right: 0,
      itemWidth: 20, itemHeight: 2,
      textStyle: ct.legendText,
    },
    grid: { top: 40, right: 20, bottom: 70, left: 70 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: {
        ...ct.axisLabel,
        fontSize: 10,
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v },
    },
    series: [
      {
        name: 'Cluster Projection',
        type: 'line',
        smooth: true,
        data: data.map((d) => Math.round(d.clusterProj * 10) / 10),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: ct.colors.violet, width: 2.5 },
        itemStyle: { color: ct.colors.violet, borderWidth: 2, borderColor: ct.bg },
        areaStyle: { color: ct.isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)' },
        label: { show: true, position: 'top', fontSize: 10, color: ct.colors.violet, fontWeight: '700', formatter: (p) => formatNumber(p.value) },
      },
      {
        name: 'Target',
        type: 'line',
        smooth: false,
        data: data.map((d) => Math.round(d.target * 10) / 10),
        symbol: 'none',
        lineStyle: { color: ct.colors.amber, width: 2, type: 'dashed' },
        itemStyle: { color: ct.colors.amber },
      },
      {
        name: 'AOP',
        type: 'line',
        smooth: false,
        data: data.map((d) => Math.round(d.aop * 10) / 10),
        symbol: 'none',
        lineStyle: { color: ct.colors.blue, width: 1.5, type: 'dotted' },
        itemStyle: { color: ct.colors.blue },
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
