// src/pages/AOPPerformance.jsx
// View 2: Revenue AOP Performance — Teal/Emerald accent theme

import { useMemo } from 'react';
import { useDashboardFilters } from '../context/DashboardFilterContext.jsx';
import {
  calculateKPIs,
  getAOPPerformance,
  getMultiQuarterBreakdown,
} from '../utils/calculations.js';
import FilterBar from '../components/layout/FilterBar.jsx';
import KPICard from '../components/kpi/KPICard.jsx';
import CurQtrCompareChart from '../components/charts/CurQtrCompareChart.jsx';
import PerformanceTable from '../components/tables/PerformanceTable.jsx';
import SectionTitle from '../components/common/SectionTitle.jsx';
import SmartInsights from '../components/common/SmartInsights.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatPct } from '../utils/formatters.js';
import ReactECharts from 'echarts-for-react';
import { useChartTheme } from '../hooks/useChartTheme.js';
import ChartCard from '../components/customReport/ChartCard.jsx';
import { REVENUE_AOP_QTR_META, REVENUE_CUR_QTR_META } from '../components/customReport/metadata/revenueMeta.js';

// AOP% and QoQ% dual-line per quarter
function AOPQuarterlyTrendChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter: (params) => {
        let html = `<div style="font-weight:700;margin-bottom:4px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${p.value !== null ? p.value?.toFixed(1) + '%' : '—'}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 36, right: 20, bottom: 36, left: 60 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.quarter),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => `${v.toFixed(0)}%` },
    },
    series: [
      {
        name: 'AOP %',
        type: 'line', smooth: true,
        data: data.map((d) => Math.round(d.aopPct * 10) / 10),
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: ct.colors.teal, width: 2.5 },
        itemStyle: { color: ct.colors.teal, borderWidth: 2, borderColor: ct.bg },
        label: { show: true, formatter: (p) => `${p.value?.toFixed(1)}%`, fontSize: 11, color: ct.colors.teal, fontWeight: '700', position: 'top' },
      },
      {
        name: 'QoQ %',
        type: 'line', smooth: true,
        data: data.map((d) => d.qoqPct !== null ? Math.round(d.qoqPct * 10) / 10 : null),
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: ct.colors.amber, width: 2.5, type: 'dashed' },
        itemStyle: { color: ct.colors.amber, borderWidth: 2, borderColor: ct.bg },
        label: { show: true, formatter: (p) => p.value !== null ? `${p.value?.toFixed(1)}%` : '', fontSize: 11, color: ct.colors.amber, fontWeight: '700', position: 'bottom' },
      },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

const ACCENT = 'aop-accent';

export default function AOPPerformance() {
  const { allData, filteredData, filters } = useDashboardFilters();

  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const qtrData = useMemo(() => getAOPPerformance(allData, filters), [allData, filters]);

  const clusterQtr = useMemo(
    () => getMultiQuarterBreakdown(allData, filters, 'bgCluster', 'bgClusterLabel'),
    [allData, filters]
  );
  const geoQtr = useMemo(
    () => getMultiQuarterBreakdown(allData, filters, 'geo', 'geo'),
    [allData, filters]
  );
  const accountQtr = useMemo(
    () => getMultiQuarterBreakdown(allData, filters, 'groupClient', 'groupClient'),
    [allData, filters]
  );

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <FilterBar showQuarter={false} showFY={true} />
      <SmartInsights />

      {/* KPI row */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Total Revenue" value={kpis.actualRevenue} unit="Cr" type="primary" />
          <KPICard label="AOP Achievement" value={kpis.aopAchievementPct} isPct type={kpis.aopAchievementPct >= 95 ? 'positive' : 'negative'} />
          <KPICard label="Gap with AOP" value={kpis.gapWithAOP} isGap unit="Cr" />
          <KPICard label="Gap with Target" value={kpis.gapWithTarget} isGap unit="Cr" />
        </div>
      ) : <EmptyState message="No data for selected filters." />}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Quarterly Performance — AOP vs Actual" accent={ACCENT} chartMeta={REVENUE_CUR_QTR_META} data={qtrData} height={260}>
          <CurQtrCompareChart />
        </ChartCard>
        <ChartCard title="Quarterly AOP% &amp; QoQ% Trend" accent={ACCENT} chartMeta={REVENUE_AOP_QTR_META} data={qtrData} height={260}>
          <AOPQuarterlyTrendChart data={qtrData} />
        </ChartCard>
      </div>

      {/* Cluster Wise AOP */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Cluster Wise AOP Performance</SectionTitle>
        <PerformanceTable data={clusterQtr} mode="quarterly" />
      </div>

      {/* Geo Wise AOP */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Geo Wise AOP Performance</SectionTitle>
        <PerformanceTable data={geoQtr} mode="quarterly" />
      </div>

      {/* Account Wise AOP */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Account Wise AOP Performance</SectionTitle>
        <PerformanceTable data={accountQtr} mode="quarterly" />
      </div>
    </div>
  );
}
