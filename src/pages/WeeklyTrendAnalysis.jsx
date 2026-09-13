// src/pages/WeeklyTrendAnalysis.jsx
// View 4: Revenue Weekly Trend Analysis — Violet accent theme

import { useMemo } from 'react';
import { useDashboardFilters } from '../context/DashboardFilterContext.jsx';
import {
  calculateKPIs,
  getWeeklyBreakdown,
  getClusterBreakdown,
  getGeoBreakdown,
  getAccountBreakdown,
  getWeeklyPerformance,
} from '../utils/calculations.js';
import FilterBar from '../components/layout/FilterBar.jsx';
import KPICard from '../components/kpi/KPICard.jsx';
import WeeklyRunRateChart from '../components/charts/WeeklyRunRateChart.jsx';
import WeeklyMatrixTable from '../components/tables/WeeklyMatrixTable.jsx';
import SectionTitle from '../components/common/SectionTitle.jsx';
import SmartInsights from '../components/common/SmartInsights.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatNumber, formatPct, getDeltaClass } from '../utils/formatters.js';
import { Download } from 'lucide-react';
import clsx from 'clsx';
import ChartCard from '../components/customReport/ChartCard.jsx';
import { REVENUE_WEEKLY_META } from '../components/customReport/metadata/revenueMeta.js';

const ACCENT = 'weekly-accent';

// Revenue Gap with Target summary strip
function GapSummaryStrip({ kpis }) {
  if (!kpis) return null;
  const items = [
    { label: 'AOP',           value: kpis.aop,            isGap: false },
    { label: 'Target',        value: kpis.target,          isGap: false },
    { label: 'Actual / Proj', value: kpis.actualRevenue,   isGap: false },
    { label: 'Gap vs AOP',    value: kpis.gapWithAOP,      isGap: true  },
    { label: 'Gap vs Target', value: kpis.gapWithTarget,   isGap: true  },
    { label: 'AOP Achieve.',  value: kpis.aopAchievementPct, isPct: true },
  ];
  return (
    <div className="card card-padded py-4">
      <SectionTitle accent={ACCENT}>Rev Gap With Target — Summary</SectionTitle>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {items.map(({ label, value, isGap, isPct }) => {
          const colorStyle = isGap
            ? { color: value >= 0 ? 'var(--success)' : 'var(--danger)' }
            : isPct
            ? { color: value >= 95 ? 'var(--success)' : value >= 80 ? 'var(--warning)' : 'var(--danger)' }
            : { color: 'var(--text-primary)' };
          return (
            <div key={label} className="text-center">
              <p className="text-xl font-extrabold tabular-nums" style={colorStyle}>
                {isGap
                  ? (value >= 0 ? '+' : '') + formatNumber(value)
                  : isPct
                  ? formatPct(value)
                  : formatNumber(value)}
              </p>
              <p className="kpi-label mt-1">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// AOP Performance summary table
function AOPSummaryTable({ data, label }) {
  if (!data?.length) return <EmptyState />;

  function exportCSV() {
    const headers = [label, 'AOP', 'Actual/Proj', 'AOP%', 'YoY%', 'Gap with AOP'];
    const rows = data.map((r) => [r.label, r.aop?.toFixed(1), r.actual?.toFixed(1), r.aopPct?.toFixed(1), r.yoyPct?.toFixed(1) ?? '', r.gapWithAOP?.toFixed(1)]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${label.toLowerCase()}_aop.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totals = {
    actual: data.reduce((s, r) => s + r.actual, 0),
    aop: data.reduce((s, r) => s + r.aop, 0),
    gapWithAOP: data.reduce((s, r) => s + r.gapWithAOP, 0),
  };

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{data.length} rows</span>
        <button onClick={exportCSV} className="export-btn">
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 220 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>{label}</th>
              <th>AOP</th>
              <th>Actual / Proj</th>
              <th style={{ minWidth: 90 }}>AOP%</th>
              <th>YoY%</th>
              <th>Gap with AOP</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                <td>{formatNumber(row.aop)}</td>
                <td className="font-semibold">{formatNumber(row.actual)}</td>
                <td className={clsx('font-bold', getDeltaClass(row.aopPct - 100))}>
                  {formatPct(row.aopPct)}
                </td>
                <td className={clsx('font-bold', row.yoyPct !== null ? getDeltaClass(row.yoyPct) : '')}>
                  {row.yoyPct !== null ? (row.yoyPct >= 0 ? '+' : '') + formatPct(row.yoyPct) : '—'}
                </td>
                <td>
                  <span
                    className={row.gapWithAOP >= 0 ? 'gap-cell-pos' : 'gap-cell-neg'}
                    style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 5, fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    {row.gapWithAOP >= 0 ? '+' : ''}{formatNumber(row.gapWithAOP)}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="totals-row">
              <td>Total</td>
              <td>{formatNumber(totals.aop)}</td>
              <td>{formatNumber(totals.actual)}</td>
              <td className={getDeltaClass(totals.aop > 0 ? (totals.actual / totals.aop * 100) - 100 : 0)}>
                {totals.aop > 0 ? formatPct(totals.actual / totals.aop * 100) : '—'}
              </td>
              <td>—</td>
              <td>
                <span
                  className={totals.gapWithAOP >= 0 ? 'gap-cell-pos' : 'gap-cell-neg'}
                  style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 5, fontSize: '0.78rem', fontWeight: 700 }}
                >
                  {totals.gapWithAOP >= 0 ? '+' : ''}{formatNumber(totals.gapWithAOP)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WeeklyTrendAnalysis() {
  const { allData, filteredData, filters } = useDashboardFilters();

  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const clusterData = useMemo(() => getClusterBreakdown(allData, filters), [allData, filters]);
  const geoData = useMemo(() => getGeoBreakdown(allData, filters), [allData, filters]);
  const accountData = useMemo(() => getAccountBreakdown(allData, filters), [allData, filters]);

  const clusterWeekly = useMemo(
    () => getWeeklyBreakdown(allData, filters, 'bgCluster', 'bgClusterLabel'),
    [allData, filters]
  );
  const suWeekly = useMemo(
    () => getWeeklyBreakdown(allData, filters, 'subUnit', 'subUnitLabel'),
    [allData, filters]
  );
  const geoWeekly = useMemo(
    () => getWeeklyBreakdown(allData, filters, 'geo', 'geo'),
    [allData, filters]
  );

  const weeklyPerfData = useMemo(
    () => getWeeklyPerformance(allData, filters),
    [allData, filters]
  );

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <FilterBar showQuarter={true} showFY={true} />
      <SmartInsights />

      {/* KPI row */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Cluster Projection" value={kpis.clusterProjection} unit="Cr" type="primary" />
          <KPICard label="AOP Achievement" value={kpis.aopAchievementPct} isPct type={kpis.aopAchievementPct >= 95 ? 'positive' : 'negative'} />
          <KPICard label="Gap with Target" value={kpis.gapWithTarget} isGap unit="Cr" />
          <KPICard label="YoY Growth" value={kpis.yoyGrowthPct} isPct isGap />
        </div>
      ) : <EmptyState message="No data for selected filters." />}

      {/* Weekly Run-Rate chart */}
      <ChartCard title="Projected, Quarterly Target and AOP by Week Number" accent={ACCENT} chartMeta={REVENUE_WEEKLY_META} data={weeklyPerfData} height={340}>
        <WeeklyRunRateChart />
      </ChartCard>

      {/* Gap Summary Strip */}
      <GapSummaryStrip kpis={kpis} />

      {/* Cluster Wise Weekly Matrix */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Cluster Wise Quarterly Revenue Analysis (by Week)</SectionTitle>
        <WeeklyMatrixTable data={clusterWeekly} />
      </div>

      {/* Sub Unit Wise Weekly Matrix */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Sub Unit Wise Quarterly Revenue Analysis (by Week)</SectionTitle>
        <WeeklyMatrixTable data={suWeekly} />
      </div>

      {/* Geo Wise Weekly Matrix */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Geo Wise Quarterly Revenue Analysis (by Week)</SectionTitle>
        <WeeklyMatrixTable data={geoWeekly} />
      </div>

      {/* AOP Performance summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card card-padded">
          <SectionTitle accent={ACCENT}>Cluster Wise AOP Performance</SectionTitle>
          <AOPSummaryTable data={clusterData} label="Cluster" />
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACCENT}>Geo Wise AOP Performance</SectionTitle>
          <AOPSummaryTable data={geoData} label="Geography" />
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACCENT}>Account Wise AOP Performance</SectionTitle>
          <AOPSummaryTable data={accountData} label="Account" />
        </div>
      </div>
    </div>
  );
}
