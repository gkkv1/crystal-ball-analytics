// src/components/charts/FYPerformanceChart.jsx
// Annual FY grouped bar chart: AOP vs Actual/Projection
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { getAnnualPerformance } from '../../utils/calculations.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import { formatNumber } from '../../utils/formatters.js';
import EmptyState from '../common/EmptyState.jsx';

export default function FYPerformanceChart() {
  const { allData, filters } = useDashboardFilters();
  const ct = useChartTheme();

  const data = useMemo(() => getAnnualPerformance(allData, filters), [allData, filters]);

  if (!data.length) return <EmptyState />;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...ct.tooltip,
      formatter: (params) => {
        const fy = params[0]?.axisValue;
        let html = `<div style="font-weight:700;margin-bottom:6px;color:${ct.textPrimary}">${fy}</div>`;
        params.forEach((p) => {
          const val = formatNumber(p.value);
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`;
          html += `<div style="display:flex;justify-content:space-between;gap:20px;font-size:12px;color:${ct.textSec}">
            <span>${dot}${p.seriesName}</span>
            <span style="font-weight:700;color:${ct.textPrimary}">₹${val} Cr</span>
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
    grid: { top: 40, right: 20, bottom: 40, left: 60, containLabel: false },
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
      splitLine: { lineStyle: { ...ct.splitLineStyle } },
      axisLabel: {
        ...ct.axisLabel,
        formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
      },
    },
    series: [
      {
        name: 'AOP',
        type: 'bar',
        barWidth: '28%',
        data: data.map((d) => Math.round(d.aop * 10) / 10),
        itemStyle: { color: ct.colors.blue, borderRadius: [4, 4, 0, 0] },
        label: {
          show: true, position: 'top', fontSize: 10, color: ct.textSec,
          formatter: (p) => p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}K` : p.value.toFixed(0),
        },
      },
      {
        name: 'Actual / Projection',
        type: 'bar',
        barWidth: '28%',
        data: data.map((d) => Math.round(d.actual * 10) / 10),
        itemStyle: { color: ct.colors.teal, borderRadius: [4, 4, 0, 0] },
        label: {
          show: true, position: 'top', fontSize: 10, color: ct.textSec,
          formatter: (p) => p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}K` : p.value.toFixed(0),
        },
      },
    ],
    animation: true,
    animationDuration: 600,
    animationEasing: 'cubicOut',
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
