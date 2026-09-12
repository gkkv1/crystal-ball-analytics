// src/components/charts/CurQtrCompareChart.jsx
// Current Quarter multi-projection comparison bar chart
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { getAOPPerformance } from '../../utils/calculations.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import { formatNumber } from '../../utils/formatters.js';
import EmptyState from '../common/EmptyState.jsx';

export default function CurQtrCompareChart() {
  const { allData, filters } = useDashboardFilters();
  const ct = useChartTheme();
  const data = useMemo(() => getAOPPerformance(allData, filters), [allData, filters]);

  if (!data.length) return <EmptyState />;

  const quarters = data.map((d) => d.quarter);

  const series = [
    { name: 'AOP',           key: 'aop',         color: ct.colors.blue   },
    { name: 'Target',        key: 'target',       color: ct.colors.amber  },
    { name: 'Cluster Proj',  key: 'clusterProj',  color: ct.colors.violet },
    { name: 'Actual / Proj', key: 'actual',       color: ct.colors.teal   },
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...ct.tooltip,
      formatter: (params) => {
        const q = params[0]?.axisValue;
        let html = `<div style="font-weight:700;margin-bottom:6px;color:${ct.textPrimary}">${q}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};margin-right:6px"></span>`;
          html += `<div style="display:flex;justify-content:space-between;gap:20px;font-size:12px;color:${ct.textSec}">
            <span>${dot}${p.seriesName}</span>
            <span style="font-weight:700;color:${ct.textPrimary}">₹${formatNumber(p.value)} Cr</span>
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
    grid: { top: 40, right: 20, bottom: 40, left: 70 },
    xAxis: {
      type: 'category',
      data: quarters,
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v },
    },
    series: series.map(({ name, key, color }) => ({
      name,
      type: 'bar',
      barWidth: '18%',
      data: data.map((d) => Math.round(d[key] || 0)),
      itemStyle: { color, borderRadius: [3, 3, 0, 0] },
    })),
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
