// src/components/charts/AOPYoYChart.jsx
// AOP YoY performance dual-line trend chart
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { getAOPYoYTrend } from '../../utils/calculations.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import EmptyState from '../common/EmptyState.jsx';

export default function AOPYoYChart() {
  const { allData, filters } = useDashboardFilters();
  const ct = useChartTheme();
  const data = useMemo(() => getAOPYoYTrend(allData, filters), [allData, filters]);

  if (!data.length) return <EmptyState />;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter: (params) => {
        const fy = params[0]?.axisValue;
        let html = `<div style="font-weight:700;margin-bottom:6px;color:${ct.textPrimary}">${fy}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`;
          html += `<div style="display:flex;justify-content:space-between;gap:20px;font-size:12px;color:${ct.textSec}">
            <span>${dot}${p.seriesName}</span>
            <span style="font-weight:700;color:${ct.textPrimary}">${p.value !== null ? p.value.toFixed(1) + '%' : '—'}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      top: 0, right: 0,
      itemWidth: 20, itemHeight: 2,
      textStyle: ct.legendText,
    },
    grid: { top: 40, right: 20, bottom: 40, left: 60 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.fy),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => `${v.toFixed(0)}%` },
    },
    series: [
      {
        name: 'AOP Achievement %',
        type: 'line',
        smooth: true,
        data: data.map((d) => Math.round(d.aopPct * 10) / 10),
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: ct.colors.blue, width: 2.5 },
        itemStyle: { color: ct.colors.blue, borderWidth: 2, borderColor: ct.bg },
        label: { show: true, formatter: (p) => `${p.value?.toFixed(1)}%`, fontSize: 11, color: ct.colors.blue, fontWeight: '700', position: 'top' },
      },
      {
        name: 'YoY Growth %',
        type: 'line',
        smooth: true,
        data: data.map((d) => d.yoyPct !== null ? Math.round(d.yoyPct * 10) / 10 : null),
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: ct.colors.amber, width: 2.5, type: 'dashed' },
        itemStyle: { color: ct.colors.amber, borderWidth: 2, borderColor: ct.bg },
        label: { show: true, formatter: (p) => p.value !== null ? `${p.value?.toFixed(1)}%` : '', fontSize: 11, color: ct.colors.amber, fontWeight: '700', position: 'bottom' },
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
