// src/pages/RmgDashboard.jsx
// RMG Performance — SINGLE DASHBOARD VIEW: WON-HC Report
// Follows the same design system, color palette, and layout as Revenue, Finance, Sales, and DEG.

import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { RotateCcw, Filter, Download, Search, Users, TrendingUp, Calendar } from 'lucide-react';
import clsx from 'clsx';

import { RmgFilterProvider, useRmgFilters } from '../context/RmgFilterContext.jsx';
import {
  calculateRmgKPIs,
  getWonHCTrend,
  getBgClusterWiseTrend,
  getSubUnitWiseTrend,
  getBgClusterWonTable,
  getAccountWiseWonTable,
} from '../utils/rmgCalculations.js';
import { useChartTheme } from '../hooks/useChartTheme.js';
import Header from '../components/layout/Header.jsx';
import SectionTitle from '../components/common/SectionTitle.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ChartCard from '../components/customReport/ChartCard.jsx';
import { RMG_TREND_META, RMG_CLUSTER_TREND_META, RMG_SUBUNIT_TREND_META } from '../components/customReport/metadata/rmgMeta.js';

const ACC = 'rmg-accent';
const fn = v => (v != null ? Number(v).toLocaleString() : '0');

/* ═══════════════════════════════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════════════════════════════ */
function SelectFilter({ label, field, options }) {
  const { filters, setFilter } = useRmgFilters();
  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex flex-col gap-1 min-w-[130px] flex-1">
      <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">{label}</label>
      <select
        className="filter-select"
        value={filters[field]}
        onChange={e => setFilter(field, e.target.value)}
        aria-label={label}
      >
        <option value="All">All</option>
        {options.map(o => {
          const val = typeof o === 'object' ? o.id : o;
          const lbl = typeof o === 'object' ? o.label : cap(o);
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}

function RmgFilterBar() {
  const { availableOptions, filterSummary, hasActiveFilters, resetFilters } = useRmgFilters();
  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const clusterOpts = availableOptions.bgCluster.map(id => ({ id, label: cap(id) }));
  const bgOpts      = availableOptions.bg.map(id       => ({ id, label: cap(id) }));
  const suOpts      = availableOptions.subUnit.map(id  => ({ id, label: cap(id) }));

  return (
    <div className="filter-bar bg-white border-b border-slate-200 px-6 py-3 shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-end gap-3 flex-wrap">
        <SelectFilter label="BG Cluster"   field="bgCluster"   options={clusterOpts} />
        <SelectFilter label="BG"           field="bg"          options={bgOpts} />
        <SelectFilter label="Sub Unit"     field="subUnit"     options={suOpts} />
        <SelectFilter label="Geo"          field="geo"         options={availableOptions.geo} />
        <SelectFilter label="Group Client" field="groupClient" options={availableOptions.groupClient} />

        <div className="flex flex-col justify-end self-end ml-auto">
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border',
              hasActiveFilters
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700 dark:bg-blue-600 dark:border-blue-500'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Clear All Filters
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <Filter className="w-3 h-3 text-slate-400" />
        <span className="text-xs text-slate-500" style={{ color: 'var(--text-muted)' }}>
          Viewing: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{filterSummary}</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHART 1: WON HC TREND (Weekly Bar Chart)
═══════════════════════════════════════════════════════════════════════════ */
function WonHCTrendChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState message="No RMG trend data available" />;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        const p = params[0];
        if (!p) return '';
        const item = data[p.dataIndex];
        return `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${item?.fullLabel || p.axisValue}</div>
          <div style="font-size:12px;color:${ct.textSec}">Headcount: <b style="color:${ct.colors.blue}">${fn(p.value)}</b></div>`;
      },
    },
    grid: { top: 32, right: 24, bottom: 44, left: 56 },
    xAxis: {
      type: 'category',
      data: data.map(d => `${d.weekDate}\n${d.weekId}`),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontSize: 10, fontWeight: '700', interval: 0 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v },
    },
    series: [{
      name: 'WON HC',
      type: 'bar',
      barMaxWidth: 42,
      data: data.map(d => d.wonHC),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: ct.colors.blue },
            { offset: 1, color: '#1E3A8A' }
          ]
        },
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        fontWeight: '700',
        color: ct.colors.blue,
        formatter: p => fn(p.value),
      },
    }],
    animation: true,
    animationDuration: 600,
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHART 2: BG CLUSTER WISE WON HC TREND (Line Chart)
═══════════════════════════════════════════════════════════════════════════ */
function BgClusterTrendChart({ data }) {
  const ct = useChartTheme();
  if (!data?.series?.length) return <EmptyState message="No Cluster trend data available" />;

  const CLUSTER_COLORS = [
    ct.colors.blue,
    ct.colors.teal,
    ct.colors.amber,
    ct.colors.violet,
    ct.colors.rose || '#E11D48',
    ct.colors.orange || '#F97316',
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:6px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`;
          html += `<div style="font-size:11px;color:${ct.textSec};display:flex;justify-content:space-between;gap:12px;margin-bottom:2px">
            <span>${dot}${p.seriesName}</span>
            <b style="color:${ct.textPrimary}">${fn(p.value)}</b>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: ct.legendText,
      itemWidth: 14,
      itemHeight: 8,
    },
    grid: { top: 40, right: 24, bottom: 44, left: 56 },
    xAxis: {
      type: 'category',
      data: data.weeks,
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v },
    },
    series: data.series.map((s, i) => ({
      name: s.label,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: s.data,
      lineStyle: { width: 2.5, color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] },
      itemStyle: { color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] },
    })),
    animation: true,
    animationDuration: 600,
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHART 3: SUB UNIT WISE WON HC TREND (Line Chart)
═══════════════════════════════════════════════════════════════════════════ */
function SubUnitTrendChart({ data }) {
  const ct = useChartTheme();
  if (!data?.series?.length) return <EmptyState message="No Sub Unit trend data available" />;

  const SU_COLORS = [
    ct.colors.teal,
    ct.colors.blue,
    ct.colors.amber,
    ct.colors.violet,
    ct.colors.orange || '#EA580C',
    ct.colors.green || '#10B981',
    ct.colors.pink || '#EC4899',
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:6px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`;
          html += `<div style="font-size:11px;color:${ct.textSec};display:flex;justify-content:space-between;gap:12px;margin-bottom:2px">
            <span>${dot}${p.seriesName}</span>
            <b style="color:${ct.textPrimary}">${fn(p.value)}</b>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: ct.legendText,
      itemWidth: 14,
      itemHeight: 8,
    },
    grid: { top: 40, right: 24, bottom: 44, left: 56 },
    xAxis: {
      type: 'category',
      data: data.weeks,
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v },
    },
    series: data.series.map((s, i) => ({
      name: s.label,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: s.data,
      lineStyle: { width: 2, color: SU_COLORS[i % SU_COLORS.length] },
      itemStyle: { color: SU_COLORS[i % SU_COLORS.length] },
    })),
    animation: true,
    animationDuration: 600,
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABLE 1: BG CLUSTER WON HC TABLE
═══════════════════════════════════════════════════════════════════════════ */
function BgClusterWonTable({ tableData }) {
  if (!tableData?.rows?.length) return <EmptyState message="No Cluster table data available" />;
  const { weeks, rows, grandTotal } = tableData;

  function exportCSV() {
    const headers = ['BG Cluster', ...weeks.map(w => w.id), 'Grand Total'];
    const body = rows.map(r => [
      r.label,
      ...weeks.map(w => r.weekValues[w.id] || 0),
      r.rowTotal,
    ]);
    body.push(['Grand Total', ...weeks.map(w => grandTotal.weekValues[w.id] || 0), grandTotal.total]);

    const csv = [headers, ...body].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'bg_cluster_won_hc.csv';
    a.click();
  }

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          {rows.length} Clusters across {weeks.length} Weeks
        </span>
        <button onClick={exportCSV} className="export-btn">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      <div className="overflow-auto max-h-[360px] border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="data-table w-full text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
            <tr>
              <th className="text-left py-2.5 px-3" style={{ minWidth: 180 }}>BG Cluster</th>
              {weeks.map(w => (
                <th key={w.id} className="text-right py-2.5 px-2" style={{ minWidth: 72 }}>
                  {w.id}
                </th>
              ))}
              <th className="text-right py-2.5 px-3 bg-slate-200 dark:bg-slate-700 font-bold" style={{ minWidth: 90 }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <td className="text-left font-semibold py-2 px-3" style={{ color: 'var(--text-primary)' }}>
                  {row.label}
                </td>
                {weeks.map(w => (
                  <td key={w.id} className="text-right py-2 px-2" style={{ color: 'var(--text-sec)' }}>
                    {fn(row.weekValues[w.id])}
                  </td>
                ))}
                <td className="text-right font-bold py-2 px-3 bg-slate-50/70 dark:bg-slate-800/40" style={{ color: 'var(--accent-blue)' }}>
                  {fn(row.rowTotal)}
                </td>
              </tr>
            ))}

            {/* Grand Total Row */}
            <tr className="sticky bottom-0 bg-slate-100 dark:bg-slate-800 border-t-2 border-blue-500 font-bold">
              <td className="text-left py-2.5 px-3" style={{ color: 'var(--text-primary)' }}>
                Grand Total
              </td>
              {weeks.map(w => (
                <td key={w.id} className="text-right py-2.5 px-2" style={{ color: 'var(--text-primary)' }}>
                  {fn(grandTotal.weekValues[w.id])}
                </td>
              ))}
              <td className="text-right py-2.5 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold">
                {fn(grandTotal.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABLE 2: ACCOUNT WISE WON HC TABLE
═══════════════════════════════════════════════════════════════════════════ */
function AccountWiseWonTable({ tableData }) {
  const [searchTerm, setSearchTerm] = useState('');
  if (!tableData?.rows?.length) return <EmptyState message="No Account table data available" />;
  const { weeks, rows, grandTotal } = tableData;

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(r =>
      r.accountName.toLowerCase().includes(term) ||
      r.groupClient.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  function exportCSV() {
    const headers = ['Account Name', 'Group Client', ...weeks.map(w => w.id), 'Grand Total'];
    const body = filteredRows.map(r => [
      r.accountName,
      r.groupClient,
      ...weeks.map(w => r.weekValues[w.id] || 0),
      r.rowTotal,
    ]);
    body.push(['Grand Total', 'ALL', ...weeks.map(w => grandTotal.weekValues[w.id] || 0), grandTotal.total]);

    const csv = [headers, ...body].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'account_wise_won_hc.csv';
    a.click();
  }

  return (
    <div>
      <div className="table-toolbar flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search account or client…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
            />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Showing {filteredRows.length} of {rows.length} Accounts
          </span>
        </div>

        <button onClick={exportCSV} className="export-btn">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      <div className="overflow-auto max-h-[420px] border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="data-table w-full text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
            <tr>
              <th className="text-left py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20" style={{ minWidth: 220 }}>
                Account Name
              </th>
              {weeks.map(w => (
                <th key={w.id} className="text-right py-2.5 px-2" style={{ minWidth: 68 }}>
                  {w.id}
                </th>
              ))}
              <th className="text-right py-2.5 px-3 bg-slate-200 dark:bg-slate-700 font-bold" style={{ minWidth: 84 }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(row => (
              <tr key={row.accountName} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <td className="text-left font-medium py-2 px-3 sticky left-0 bg-white dark:bg-slate-900 z-10" style={{ color: 'var(--text-primary)' }}>
                  <div>{row.accountName}</div>
                  <div className="text-2xs text-slate-400">{row.groupClient}</div>
                </td>
                {weeks.map(w => (
                  <td key={w.id} className="text-right py-2 px-2" style={{ color: 'var(--text-sec)' }}>
                    {fn(row.weekValues[w.id])}
                  </td>
                ))}
                <td className="text-right font-bold py-2 px-3 bg-slate-50/70 dark:bg-slate-800/40" style={{ color: 'var(--accent-blue)' }}>
                  {fn(row.rowTotal)}
                </td>
              </tr>
            ))}

            {/* Grand Total Row */}
            <tr className="sticky bottom-0 bg-slate-100 dark:bg-slate-800 border-t-2 border-blue-500 font-bold z-20">
              <td className="text-left py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30" style={{ color: 'var(--text-primary)' }}>
                Grand Total ({filteredRows.length} Accounts)
              </td>
              {weeks.map(w => (
                <td key={w.id} className="text-right py-2.5 px-2" style={{ color: 'var(--text-primary)' }}>
                  {fn(grandTotal.weekValues[w.id])}
                </td>
              ))}
              <td className="text-right py-2.5 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold">
                {fn(grandTotal.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RMG CONTENT (Consumes Context)
═══════════════════════════════════════════════════════════════════════════ */
function RmgContent() {
  const { filteredData } = useRmgFilters();

  const kpis          = useMemo(() => calculateRmgKPIs(filteredData), [filteredData]);
  const wonHCTrend    = useMemo(() => getWonHCTrend(filteredData), [filteredData]);
  const clusterTrend  = useMemo(() => getBgClusterWiseTrend(filteredData), [filteredData]);
  const subUnitTrend  = useMemo(() => getSubUnitWiseTrend(filteredData), [filteredData]);
  const clusterTable  = useMemo(() => getBgClusterWonTable(filteredData), [filteredData]);
  const accountTable  = useMemo(() => getAccountWiseWonTable(filteredData), [filteredData]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cascading Filter Bar */}
      <RmgFilterBar />

      {/* Scrollable Main Dashboard Body */}
      <div className="flex flex-col gap-5 p-5 overflow-auto fade-in">

        {/* ── Top Section: WON HC Trend (75%) + KPIs (25%) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Main Trend Bar Chart */}
          <ChartCard title="WON HC Trend" accent={ACC} chartMeta={RMG_TREND_META} data={wonHCTrend} height={260} className="xl:col-span-8 2xl:col-span-9 flex flex-col">
            <WonHCTrendChart data={wonHCTrend} />
          </ChartCard>

          {/* Right Column: Key Metric KPI Cards */}
          <div className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-4 justify-between">
            {/* KPI 1: Current Quarter WON Addition */}
            <div
              className="card card-padded flex-1 flex flex-col justify-center relative overflow-hidden"
              style={{
                borderLeft: '4px solid #3B82F6',
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59,130,246,0.04) 100%)',
              }}
            >
              <div className="flex items-center gap-2 mb-1 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Current Quarter WON Addition
              </div>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight my-1 text-slate-900 dark:text-white">
                {kpis.currentQuarterAddition >= 0 ? `+${fn(kpis.currentQuarterAddition)}` : fn(kpis.currentQuarterAddition)}
              </div>
              <div className="text-2xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                Q2 FY27 Net Additions
              </div>
            </div>

            {/* KPI 2: Current Week WON Addition */}
            <div
              className="card card-padded flex-1 flex flex-col justify-center relative overflow-hidden"
              style={{
                borderLeft: '4px solid #10B981',
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16,185,129,0.04) 100%)',
              }}
            >
              <div className="flex items-center gap-2 mb-1 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Current Week WON Addition
              </div>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight my-1 text-slate-900 dark:text-white">
                {kpis.currentWeekAddition >= 0 ? `+${fn(kpis.currentWeekAddition)}` : fn(kpis.currentWeekAddition)}
              </div>
              <div className="text-2xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                Wk30 (13-Jul-26) Additions
              </div>
            </div>
          </div>
        </div>

        {/* ── Mid Section 1: BG Cluster Wise WON HC Trend ── */}
        <ChartCard title="BG Cluster Wise WON HC Trend" accent={ACC} chartMeta={RMG_CLUSTER_TREND_META} data={filteredData} height={260}>
          <BgClusterTrendChart data={clusterTrend} />
        </ChartCard>

        {/* ── Mid Section 2: Sub Unit Wise WON HC Trend ── */}
        <ChartCard title="Sub Unit Wise WON HC Trend" accent={ACC} chartMeta={RMG_SUBUNIT_TREND_META} data={filteredData} height={260}>
          <SubUnitTrendChart data={subUnitTrend} />
        </ChartCard>

        {/* ── Bottom Section 1: BG Cluster WON HC Table ── */}
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle accent={ACC}>BG Cluster WON HC</SectionTitle>
            <span className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">
              Cluster × Weekly Matrix
            </span>
          </div>
          <BgClusterWonTable tableData={clusterTable} />
        </div>

        {/* ── Bottom Section 2: Account Wise WON HC Table ── */}
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle accent={ACC}>Account Wise WON HC</SectionTitle>
            <span className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">
              Client Account Drilldown
            </span>
          </div>
          <AccountWiseWonTable tableData={accountTable} />
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RMG DASHBOARD SHELL
═══════════════════════════════════════════════════════════════════════════ */
export default function RmgDashboard({ onNavigate }) {
  return (
    <RmgFilterProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header with full corporate branding, dark mode, and home button */}
        <Header
          onHome={() => onNavigate('landing')}
          showHome={true}
          moduleLabel="RMG Performance"
        />

        {/* Sub Navigation strip for single WON-HC Report view */}
        <nav
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Active View Badge: WON-HC Report */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 6,
              padding: '4px 12px',
              color: '#60A5FA',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Users style={{ width: 14, height: 14 }} />
            WON-HC Report
          </div>

          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Resource Management Group · Headcount Analytics
          </span>
        </nav>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            overflow: 'hidden',
            background: 'var(--bg-app)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <RmgContent />
        </main>
      </div>
    </RmgFilterProvider>
  );
}
