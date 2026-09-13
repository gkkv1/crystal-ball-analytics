// src/pages/finance/MarginPerformance.jsx
// Finance Tab 1: Revenue & Gross Margin, Cost %, Cluster/SubUnit tables

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useFinanceFilters } from '../../context/FinanceFilterContext.jsx';
import {
  calculateFinanceKPIs,
  getMarginByFY,
  getCostPctByFY,
  getClusterMarginByFY,
  getSubUnitMarginByQuarter,
} from '../../utils/financeCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import FinanceFilterBar from '../../components/layout/FinanceFilterBar.jsx';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Download } from 'lucide-react';
import clsx from 'clsx';
import ChartCard from '../../components/customReport/ChartCard.jsx';
import { FINANCE_MARGIN_META, FINANCE_COST_PCT_META } from '../../components/customReport/metadata/financeMeta.js';

const ACCENT = 'finance-margin-accent';
const fmt  = (v, d = 1) => (v ?? 0).toFixed(d);
const fmtK = (v) => {
  if (!v) return '—';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
};

// ─── Revenue & Gross Margin % combo chart ─────────────────────────────────
function RevenueGMChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        const fy = params[0]?.axisValue;
        let html = `<div style="font-weight:700;margin-bottom:5px;color:${ct.textPrimary}">${fy}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          const val = p.seriesName === 'Gross Margin %'
            ? `${fmt(p.value)}%`
            : `₹${fmtK(p.value)} Cr`;
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${val}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid:   { top: 40, right: 60, bottom: 36, left: 70 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.fy),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: [
      {
        type: 'value', name: 'Revenue (Cr)',
        nameTextStyle: { color: ct.textMuted, fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: ct.splitLineStyle },
        axisLabel: { ...ct.axisLabel, formatter: (v) => `₹${fmtK(v)}` },
      },
      {
        type: 'value', name: 'GM %', min: 25, max: 60,
        nameTextStyle: { color: ct.textMuted, fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { ...ct.axisLabel, formatter: (v) => `${v}%` },
      },
    ],
    series: [
      {
        name: 'Revenue', type: 'bar', yAxisIndex: 0,
        data: data.map((d) => d.revenue),
        barMaxWidth: 48,
        itemStyle: { color: ct.colors.blue, borderRadius: [4, 4, 0, 0] },
        label: {
          show: true, position: 'top', fontSize: 11, fontWeight: '700',
          color: ct.textSec, formatter: (p) => `₹${fmtK(p.value)}`,
        },
      },
      {
        name: 'Gross Margin %', type: 'line', yAxisIndex: 1, smooth: true,
        data: data.map((d) => d.grossMarginPct),
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: ct.colors.amber, width: 2.5 },
        itemStyle: { color: ct.colors.amber, borderWidth: 2, borderColor: ct.bg },
        label: {
          show: true, position: 'top', fontSize: 11, fontWeight: '700',
          color: ct.colors.amber, formatter: (p) => `${fmt(p.value)}%`,
        },
      },
    ],
    animation: true, animationDuration: 600,
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Cost as % of Revenue chart ────────────────────────────────────────────
function CostPctChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const seriesDef = [
    { key: 'boughtOutPct', name: 'Bought Out %', color: ct.colors.blue   },
    { key: 'manPowerPct',  name: 'Man Power %',  color: ct.colors.teal   },
    { key: 'airFarePct',   name: 'Air Fare %',   color: ct.colors.amber  },
    { key: 'othersPct',    name: 'Others %',     color: ct.colors.violet },
    { key: 'totalCostPct', name: 'Total Cost %', color: ct.colors.red, lineType: 'dashed' },
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        const fy = params[0]?.axisValue;
        let html = `<div style="font-weight:700;margin-bottom:5px;color:${ct.textPrimary}">${fy}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${fmt(p.value)}%</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText, type: 'scroll' },
    grid:   { top: 40, right: 20, bottom: 36, left: 60 },
    xAxis: {
      type: 'category', data: data.map((d) => d.fy),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value', min: 0, max: 70,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => `${v}%` },
    },
    series: seriesDef.map(({ key, name, color, lineType }) => ({
      name, type: 'line', smooth: true,
      data: data.map((d) => d[key]),
      symbol: 'circle', symbolSize: 7,
      lineStyle: { color, width: lineType === 'dashed' ? 2.5 : 2, type: lineType || 'solid' },
      itemStyle: { color, borderWidth: 2, borderColor: ct.bg },
      label: { show: true, fontSize: 10, fontWeight: '700', color, formatter: (p) => `${fmt(p.value)}%` },
    })),
    animation: true, animationDuration: 600,
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Cluster Wise Yearly table ─────────────────────────────────────────────
function ClusterMarginTable({ data }) {
  const FYS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
  if (!data?.length) return <EmptyState />;

  function gmColor(pct) {
    if (!pct) return {};
    if (pct >= 46) return { color: 'var(--success)', fontWeight: 700 };
    if (pct >= 40) return { color: 'var(--warning)', fontWeight: 700 };
    return { color: 'var(--danger)', fontWeight: 700 };
  }

  function exportCSV() {
    const headers = ['Cluster', ...FYS.flatMap((fy) => [`${fy} Revenue`, `${fy} GM%`])];
    const rows = data.map((r) => [
      r.label,
      ...FYS.flatMap((fy) => [r.byFY[fy]?.revenue?.toFixed(1) || 0, r.byFY[fy]?.grossMarginPct?.toFixed(1) || 0]),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cluster_margin.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{data.length} clusters</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />Export CSV</button>
      </div>
      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>Cluster</th>
              {FYS.map((fy) => (
                <th key={fy} colSpan={2} style={{ textAlign: 'center', minWidth: 140, borderLeft: '1px solid var(--border)' }}>
                  {fy}
                </th>
              ))}
            </tr>
            <tr>
              <th />
              {FYS.map((fy) => (
                <>
                  <th key={`${fy}-rev`} style={{ minWidth: 80, borderLeft: '1px solid var(--border)' }}>Revenue</th>
                  <th key={`${fy}-gm`}  style={{ minWidth: 70 }}>GM %</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                {FYS.map((fy) => {
                  const d = row.byFY[fy] || {};
                  return (
                    <>
                      <td key={`${fy}-rev`} style={{ borderLeft: '1px solid var(--border)' }}>
                        {d.revenue ? `₹${fmtK(d.revenue)}` : '—'}
                      </td>
                      <td key={`${fy}-gm`} style={gmColor(d.grossMarginPct)}>
                        {d.grossMarginPct != null ? `${fmt(d.grossMarginPct)}%` : '—'}
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub Unit Wise Quarterly table ────────────────────────────────────────
function SubUnitMarginTable({ data }) {
  if (!data?.rows?.length) return <EmptyState />;
  const { periods, rows } = data;

  function exportCSV() {
    const headers = ['Sub Unit', ...periods.flatMap((p) => [`${p} Revenue`, `${p} GM%`, `${p} AOP%`])];
    const rowsData = rows.map((r) => [
      r.label,
      ...periods.flatMap((p) => {
        const d = r.byPeriod[p] || {};
        return [d.revenue?.toFixed(1) || 0, d.grossMarginPct?.toFixed(1) || 0, d.aopPct?.toFixed(1) || 0];
      }),
    ]);
    const csv = [headers, ...rowsData].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subunit_margin_qtr.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function aopColor(pct) {
    if (!pct) return {};
    if (pct >= 100) return { color: 'var(--success)', fontWeight: 700 };
    if (pct >= 85)  return { color: 'var(--warning)', fontWeight: 700 };
    return { color: 'var(--danger)', fontWeight: 700 };
  }

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rows.length} sub units</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />Export CSV</button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 320 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>Sub Unit</th>
              {periods.map((p) => (
                <th key={p} colSpan={3} style={{ textAlign: 'center', minWidth: 210, borderLeft: '1px solid var(--border)' }}>
                  {p}
                </th>
              ))}
            </tr>
            <tr>
              <th />
              {periods.map((p) => (
                <>
                  <th key={`${p}-rev`} style={{ minWidth: 80, borderLeft: '1px solid var(--border)' }}>Revenue</th>
                  <th key={`${p}-gm`}  style={{ minWidth: 65 }}>GM %</th>
                  <th key={`${p}-aop`} style={{ minWidth: 65 }}>AOP %</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                {periods.map((p) => {
                  const d = row.byPeriod[p] || {};
                  return (
                    <>
                      <td key={`${p}-rev`} style={{ borderLeft: '1px solid var(--border)' }}>
                        {d.revenue ? `₹${fmtK(d.revenue)}` : '—'}
                      </td>
                      <td key={`${p}-gm`} style={{ color: d.grossMarginPct >= 40 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {d.grossMarginPct != null ? `${fmt(d.grossMarginPct)}%` : '—'}
                      </td>
                      <td key={`${p}-aop`} style={aopColor(d.aopPct)}>
                        {d.aopPct != null ? `${fmt(d.aopPct)}%` : '—'}
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function MarginPerformance() {
  const { allData, filteredData, filters } = useFinanceFilters();

  const kpis         = useMemo(() => calculateFinanceKPIs(filteredData),       [filteredData]);
  const marginByFY   = useMemo(() => getMarginByFY(allData, filters),          [allData, filters]);
  const costByFY     = useMemo(() => getCostPctByFY(allData, filters),         [allData, filters]);
  const clusterTable = useMemo(() => getClusterMarginByFY(allData, filters),   [allData, filters]);
  const suTable      = useMemo(() => getSubUnitMarginByQuarter(allData, filters), [allData, filters]);

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <FinanceFilterBar showQuarter={false} showFY={true} />

      {/* KPI Row */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard label="Total Revenue"     value={kpis.revenue}        unit="Cr"  type="primary" size="md" />
          <KPICard label="Gross Margin"      value={kpis.grossMargin}    unit="Cr"  type="primary" size="md" />
          <KPICard label="Gross Margin %"    value={kpis.grossMarginPct}  isPct
            type={kpis.grossMarginPct >= 44 ? 'positive' : kpis.grossMarginPct >= 38 ? 'neutral' : 'negative'} />
          <KPICard label="Total Cost %"      value={kpis.totalCostPctAvg} isPct
            type={kpis.totalCostPctAvg <= 56 ? 'positive' : 'negative'} />
          <KPICard label="Bought Out %"      value={kpis.boughtOutPctAvg} isPct />
          <KPICard label="Man Power %"       value={kpis.manPowerPctAvg}  isPct />
        </div>
      ) : (
        <EmptyState message="No data for selected filters." />
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Revenue &amp; Gross Margin % by Fiscal Year" accent={ACCENT} chartMeta={FINANCE_MARGIN_META} data={marginByFY} height={280}>
          <RevenueGMChart data={marginByFY} />
        </ChartCard>
        <ChartCard title="Cost as % of Revenue by Fiscal Year" accent={ACCENT} chartMeta={FINANCE_COST_PCT_META} data={costByFY} height={280}>
          <CostPctChart data={costByFY} />
        </ChartCard>
      </div>

      {/* Cluster Wise Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Cluster Wise Yearly Revenue and Gross Margin</SectionTitle>
        <ClusterMarginTable data={clusterTable} />
      </div>

      {/* Sub Unit Quarterly Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACCENT}>Sub Unit Wise Quarterly Revenue and Gross Margin</SectionTitle>
        <SubUnitMarginTable data={suTable} />
      </div>
    </div>
  );
}
