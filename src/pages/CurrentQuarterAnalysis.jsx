// src/pages/CurrentQuarterAnalysis.jsx
// View 3: Revenue Current Quarter Analysis — Amber accent theme

import { useMemo } from 'react';
import { useDashboardFilters } from '../context/DashboardFilterContext.jsx';
import {
  calculateKPIs,
  getClusterBreakdown,
  getSubUnitBreakdown,
  getGeoBreakdown,
  getGapMatrix,
} from '../utils/calculations.js';
import FilterBar from '../components/layout/FilterBar.jsx';
import KPICard from '../components/kpi/KPICard.jsx';
import CurQtrCompareChart from '../components/charts/CurQtrCompareChart.jsx';
import GapMatrixTable from '../components/tables/GapMatrixTable.jsx';
import SectionTitle from '../components/common/SectionTitle.jsx';
import SmartInsights from '../components/common/SmartInsights.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatNumber, formatPct, getDeltaClass } from '../utils/formatters.js';
import { Search, Download } from 'lucide-react';
import clsx from 'clsx';

const ACCENT = 'curqtr-accent';

// Inline quarterly analysis table (cluster/su/geo with all projection columns)
function QuarterlyAnalysisTable({ data, label }) {
  if (!data?.length) return <EmptyState />;

  const totals = {
    actual: data.reduce((s, r) => s + r.actual, 0),
    aop: data.reduce((s, r) => s + r.aop, 0),
    target: data.reduce((s, r) => s + r.target, 0),
    bgProjection: data.reduce((s, r) => s + r.bgProjection, 0),
    clusterProjection: data.reduce((s, r) => s + r.clusterProjection, 0),
    subUnitProjection: data.reduce((s, r) => s + r.subUnitProjection, 0),
    gapWithTarget: data.reduce((s, r) => s + r.gapWithTarget, 0),
  };

  function exportCSV() {
    const headers = [label, 'AOP', 'Target', 'BG Proj', 'Cluster Proj', 'SU Proj', 'AOP%', 'Target%', 'Gap vs Target'];
    const rows = data.map((r) => [r.label, r.aop, r.target, r.bgProjection, r.clusterProjection, r.subUnitProjection, r.aopPct?.toFixed(1), r.targetPct?.toFixed(1), r.gapWithTarget?.toFixed(1)]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${label.toLowerCase()}_qtr.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{data.length} rows</span>
        <button onClick={exportCSV} className="export-btn">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 240 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>{label}</th>
              <th>AOP</th>
              <th>Target</th>
              <th>BG Proj</th>
              <th>Cluster Proj</th>
              <th>SU Proj</th>
              <th style={{ minWidth: 90 }}>AOP%</th>
              <th style={{ minWidth: 90 }}>Target%</th>
              <th style={{ minWidth: 100 }}>Gap vs Target</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                <td>{formatNumber(row.aop)}</td>
                <td>{formatNumber(row.target)}</td>
                <td>{formatNumber(row.bgProjection)}</td>
                <td>{formatNumber(row.clusterProjection)}</td>
                <td>{formatNumber(row.subUnitProjection)}</td>
                <td className={clsx('font-bold', getDeltaClass(row.aopPct - 100))}>{formatPct(row.aopPct)}</td>
                <td className={clsx('font-bold', getDeltaClass(row.targetPct - 100))}>{formatPct(row.targetPct)}</td>
                <td>
                  <span
                    className={row.gapWithTarget >= 0 ? 'gap-cell-pos' : 'gap-cell-neg'}
                    style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 5, fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    {row.gapWithTarget >= 0 ? '+' : ''}{formatNumber(row.gapWithTarget)}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="totals-row">
              <td>Total</td>
              <td>{formatNumber(totals.aop)}</td>
              <td>{formatNumber(totals.target)}</td>
              <td>{formatNumber(totals.bgProjection)}</td>
              <td>{formatNumber(totals.clusterProjection)}</td>
              <td>{formatNumber(totals.subUnitProjection)}</td>
              <td className={clsx(getDeltaClass(totals.aop > 0 ? (totals.actual / totals.aop * 100) - 100 : 0))}>
                {totals.aop > 0 ? formatPct(totals.actual / totals.aop * 100) : '—'}
              </td>
              <td className={clsx(getDeltaClass(totals.target > 0 ? (totals.actual / totals.target * 100) - 100 : 0))}>
                {totals.target > 0 ? formatPct(totals.actual / totals.target * 100) : '—'}
              </td>
              <td>
                <span
                  className={totals.gapWithTarget >= 0 ? 'gap-cell-pos' : 'gap-cell-neg'}
                  style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 5, fontSize: '0.78rem', fontWeight: 700 }}
                >
                  {totals.gapWithTarget >= 0 ? '+' : ''}{formatNumber(totals.gapWithTarget)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CurrentQuarterAnalysis() {
  const { allData, filteredData, filters } = useDashboardFilters();

  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);
  const clusterData = useMemo(() => getClusterBreakdown(allData, filters), [allData, filters]);
  const subUnitData = useMemo(() => getSubUnitBreakdown(allData, filters), [allData, filters]);
  const geoData = useMemo(() => getGeoBreakdown(allData, filters), [allData, filters]);
  const gapMatrix = useMemo(() => getGapMatrix(allData, filters), [allData, filters]);

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <FilterBar showQuarter={true} showFY={true} />
      <SmartInsights />

      {/* Hero layout: chart left, KPI panel right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quarterly Performance chart — 2/3 width */}
        <div className="card card-padded lg:col-span-2">
          <SectionTitle accent={ACCENT}>Quarterly Performance — All Projections</SectionTitle>
          <div style={{ height: 280 }}>
            <CurQtrCompareChart />
          </div>
        </div>

        {/* KPI panel — 1/3 width */}
        <div className="flex flex-col gap-3">
          {kpis ? (
            <>
              <KPICard
                label="Cluster Projection"
                value={kpis.clusterProjection}
                unit="Cr"
                type="primary"
                size="lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <KPICard
                  label="Gap with AOP"
                  value={kpis.gapWithAOP}
                  isGap unit="Cr"
                  subLabel={`${formatPct(kpis.aopAchievementPct)} AOP%`}
                />
                <KPICard
                  label="Gap with Target"
                  value={kpis.gapWithTarget}
                  isGap unit="Cr"
                  subLabel={`${formatPct(kpis.targetAchievementPct)} Tgt%`}
                />
                <KPICard
                  label="Gap with BG Proj"
                  value={kpis.gapWithBGProj}
                  isGap unit="Cr"
                />
                <KPICard
                  label="Gap with SU Proj"
                  value={kpis.gapWithSUProj}
                  isGap unit="Cr"
                />
              </div>
              {/* Secondary KPI strip */}
              <div className="card card-padded py-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  {[
                    { label: 'AOP Achievement', val: kpis.aopAchievementPct },
                    { label: 'Target Achievement', val: kpis.targetAchievementPct },
                    { label: 'YoY Growth', val: kpis.yoyGrowthPct },
                    { label: 'BG Proj Achievement', val: kpis.bgProjection > 0 ? (kpis.actualRevenue / kpis.bgProjection) * 100 : 0 },
                  ].map(({ label, val }) => (
                    <div key={label} className="py-1">
                      <p className="text-2xl font-extrabold tabular-nums" style={{ color: val >= 95 ? 'var(--success)' : val >= 80 ? 'var(--warning)' : 'var(--danger)' }}>
                        {val.toFixed(1)}%
                      </p>
                      <p className="kpi-label mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : <EmptyState />}
        </div>
      </div>

      {/* Gap Matrix */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Revenue Gap With Target (Cluster × Practice)</SectionTitle>
        <GapMatrixTable data={gapMatrix} />
      </div>

      {/* Three quarterly analysis tables */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Cluster Wise Quarterly Revenue Analysis</SectionTitle>
        <QuarterlyAnalysisTable data={clusterData} label="Cluster" />
      </div>

      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Sub Unit Wise Quarterly Revenue Analysis</SectionTitle>
        <QuarterlyAnalysisTable data={subUnitData} label="Sub Unit" />
      </div>

      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Geo Wise Quarterly Revenue Analysis</SectionTitle>
        <QuarterlyAnalysisTable data={geoData} label="Geography" />
      </div>
    </div>
  );
}
