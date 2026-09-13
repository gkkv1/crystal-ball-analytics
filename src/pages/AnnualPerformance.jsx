// src/pages/AnnualPerformance.jsx
// View 1: Revenue Annual Performance — Blue accent theme

import { useMemo } from 'react';
import { useDashboardFilters } from '../context/DashboardFilterContext.jsx';
import {
  calculateKPIs,
  getMultiYearBreakdown,
  getAnnualPerformance,
  getAOPYoYTrend,
  getQuarterlyPerformance,
} from '../utils/calculations.js';
import FilterBar from '../components/layout/FilterBar.jsx';
import KPICard from '../components/kpi/KPICard.jsx';
import FYPerformanceChart from '../components/charts/FYPerformanceChart.jsx';
import AOPYoYChart from '../components/charts/AOPYoYChart.jsx';
import QuarterlyMixChart from '../components/charts/QuarterlyMixChart.jsx';
import PerformanceTable from '../components/tables/PerformanceTable.jsx';
import SectionTitle from '../components/common/SectionTitle.jsx';
import SmartInsights from '../components/common/SmartInsights.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ChartCard from '../components/customReport/ChartCard.jsx';
import { REVENUE_FY_META, REVENUE_AOP_YOY_META, REVENUE_QUARTERLY_META } from '../components/customReport/metadata/revenueMeta.js';

// View accent = Blue
const ACCENT = 'annual-accent';

export default function AnnualPerformance() {
  const { allData, filteredData, filters } = useDashboardFilters();

  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);

  const clusterTable = useMemo(
    () => getMultiYearBreakdown(allData, filters, 'bgCluster', 'bgClusterLabel'),
    [allData, filters]
  );
  const geoTable = useMemo(
    () => getMultiYearBreakdown(allData, filters, 'geo', 'geo'),
    [allData, filters]
  );
  const accountTable = useMemo(
    () => getMultiYearBreakdown(allData, filters, 'groupClient', 'groupClient'),
    [allData, filters]
  );

  // Data snapshots for Visual Explorer
  const fyChartData = useMemo(() => getAnnualPerformance(allData, filters), [allData, filters]);
  const aopYoYData  = useMemo(() => getAOPYoYTrend(allData, filters), [allData, filters]);
  const qtrData     = useMemo(() => getQuarterlyPerformance(allData, filters), [allData, filters]);

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      {/* Filter Bar */}
      <FilterBar showQuarter={true} showFY={true} />

      {/* Smart Insights */}
      <SmartInsights />

      {/* KPI Row */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard label="Total Revenue" value={kpis.actualRevenue} unit="Cr" size="md" type="primary" />
          <KPICard label="AOP Achievement" value={kpis.aopAchievementPct} isPct type={kpis.aopAchievementPct >= 95 ? 'positive' : 'negative'} />
          <KPICard label="Gap with AOP" value={kpis.gapWithAOP} isGap unit="Cr" />
          <KPICard label="Gap with Target" value={kpis.gapWithTarget} isGap unit="Cr" />
          <KPICard label="YoY Growth" value={kpis.yoyGrowthPct} isPct isGap type={kpis.yoyGrowthPct >= 0 ? 'positive' : 'negative'} />
        </div>
      ) : (
        <EmptyState message="No data for selected filters." />
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="FY Revenue Performance" accent={ACCENT} chartMeta={REVENUE_FY_META} data={fyChartData} height={260}>
          <FYPerformanceChart />
        </ChartCard>
        <ChartCard title="AOP & YoY Trend" accent={ACCENT} chartMeta={REVENUE_AOP_YOY_META} data={aopYoYData} height={260}>
          <AOPYoYChart />
        </ChartCard>
      </div>

      {/* Quarterly Performance chart */}
      <ChartCard title="Quarterly Performance — All Fiscal Years" accent={ACCENT} chartMeta={REVENUE_QUARTERLY_META} data={qtrData} height={280}>
        <QuarterlyMixChart />
      </ChartCard>

      {/* Cluster Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Cluster Wise Revenue Performance</SectionTitle>
        <PerformanceTable data={clusterTable} mode="annual" />
      </div>

      {/* Geo Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Geo Wise Revenue Performance</SectionTitle>
        <PerformanceTable data={geoTable} mode="annual" />
      </div>

      {/* Account Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Account Wise Revenue Performance</SectionTitle>
        <PerformanceTable data={accountTable} mode="annual" />
      </div>
    </div>
  );
}
