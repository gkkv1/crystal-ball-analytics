// src/pages/account/PerformanceAnalysis.jsx
// Tab 1 of Account Management: Performance Analysis
// Multi-year & quarterly account performance with business domain selector (Revenue, Finance, Sales, RMG, DEG)

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { RotateCcw, Filter, TrendingUp, Target, DollarSign, Building2, Download } from 'lucide-react';
import clsx from 'clsx';

import { useAccountFilters } from '../../context/AccountFilterContext.jsx';
import { BUSINESS_DOMAINS } from '../../data/accountData.js';
import {
  calculatePerformanceKPIs,
  getFYPerformanceData,
  getAOPYoYData,
  getQuarterlyPerformanceData,
  getYearlyPerformanceTable,
} from '../../utils/accountCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const ACC = 'account-accent';
const fn = v => (v != null ? Number(v).toLocaleString() : '0');

export default function PerformanceAnalysis() {
  const {
    filters,
    setFilter,
    resetFilters,
    availableOptions,
    filteredPerf,
    filterSummary,
    hasActiveFilters,
    businessDomain,
    setBusinessDomain,
  } = useAccountFilters();

  const ct = useChartTheme();

  const kpis = useMemo(() => calculatePerformanceKPIs(filteredPerf), [filteredPerf]);
  const fyData = useMemo(() => getFYPerformanceData(filteredPerf, businessDomain), [filteredPerf, businessDomain]);
  const aopYoYData = useMemo(() => getAOPYoYData(filteredPerf, businessDomain), [filteredPerf, businessDomain]);
  const quarterlyData = useMemo(() => getQuarterlyPerformanceData(filteredPerf, businessDomain), [filteredPerf, businessDomain]);
  const tableData = useMemo(() => getYearlyPerformanceTable(filteredPerf, businessDomain), [filteredPerf, businessDomain]);

  const activeDomain = BUSINESS_DOMAINS.find(d => d.id === businessDomain) || BUSINESS_DOMAINS[0];

  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const clusterOpts = availableOptions.bgCluster.map(id => ({ id, label: cap(id) }));

  // ─── Chart 1: FY Performance (Dual Bar) ──────────────────────────────────
  const fyOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${fn(p.value)} ${activeDomain.unit}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 36, right: 24, bottom: 36, left: 56 },
    xAxis: {
      type: 'category',
      data: fyData.map(d => d.fiscalYear),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v },
    },
    series: [
      {
        name: 'AOP Target',
        type: 'bar',
        barMaxWidth: 32,
        data: fyData.map(d => d.aop),
        itemStyle: { color: ct.colors.blue, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: `${activeDomain.label} Act/Proj`,
        type: 'bar',
        barMaxWidth: 32,
        data: fyData.map(d => d.actual),
        itemStyle: { color: ct.colors.teal, borderRadius: [4, 4, 0, 0] },
      },
    ],
    animation: true,
    animationDuration: 600,
  };

  // ─── Chart 2: AOP YoY Performance (Dual Line) ────────────────────────────
  const aopYoYOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${Number(p.value).toFixed(1)}%</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 36, right: 24, bottom: 36, left: 50 },
    xAxis: {
      type: 'category',
      data: aopYoYData.map(d => d.fiscalYear),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` },
    },
    series: [
      {
        name: 'AOP%',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: aopYoYData.map(d => d.aopPct),
        lineStyle: { width: 2.5, color: ct.colors.blue },
        itemStyle: { color: ct.colors.blue },
      },
      {
        name: 'YoY%',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: aopYoYData.map(d => d.yoyPct),
        lineStyle: { width: 2.5, color: ct.colors.amber },
        itemStyle: { color: ct.colors.amber },
      },
    ],
    animation: true,
    animationDuration: 600,
  };

  // ─── Chart 3: Quarterly Performance (Bar + Line) ─────────────────────────
  const qtrOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          const val = p.seriesType === 'line' ? `${p.value}%` : `${fn(p.value)} ${activeDomain.unit}`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${val}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 40, right: 48, bottom: 44, left: 56 },
    xAxis: {
      type: 'category',
      data: quarterlyData.map(d => d.label),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontSize: 10, fontWeight: '700' },
    },
    yAxis: [
      {
        type: 'value',
        name: activeDomain.unit,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: ct.splitLineStyle },
        axisLabel: { ...ct.axisLabel, formatter: v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v },
      },
      {
        type: 'value',
        name: 'Ach%',
        min: 0,
        max: 130,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` },
      },
    ],
    series: [
      {
        name: 'AOP Target',
        type: 'bar',
        barMaxWidth: 24,
        data: quarterlyData.map(d => d.aop),
        itemStyle: { color: ct.colors.blue, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Actual/Proj',
        type: 'bar',
        barMaxWidth: 24,
        data: quarterlyData.map(d => d.actual),
        itemStyle: { color: ct.colors.teal, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Achievement %',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: quarterlyData.map(d => d.achievement),
        lineStyle: { width: 2, color: ct.colors.amber },
        itemStyle: { color: ct.colors.amber },
      },
    ],
    animation: true,
    animationDuration: 600,
  };

  // Export Yearly Table
  function exportCSV() {
    const fys = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
    const headers = ['Sub Unit', ...fys.flatMap(fy => [`${fy} AOP`, `${fy} Act`, `${fy} AOP%`, `${fy} YoY%`])];
    const body = tableData.rows.map(r => [
      r.subUnit,
      ...fys.flatMap(fy => [
        r.fyMetrics[fy]?.aop || 0,
        r.fyMetrics[fy]?.actual || 0,
        `${r.fyMetrics[fy]?.aopPct || 0}%`,
        `${r.fyMetrics[fy]?.yoyPct || 0}%`,
      ]),
    ]);

    const csv = [headers, ...body].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `account_yearly_performance_${activeDomain.id}.csv`;
    a.click();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="filter-bar bg-white border-b border-slate-200 px-6 py-3 shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[140px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">BG Cluster</label>
            <select
              className="filter-select"
              value={filters.bgCluster}
              onChange={e => setFilter('bgCluster', e.target.value)}
              aria-label="BG Cluster"
            >
              <option value="All">All Clusters</option>
              {clusterOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[160px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">Group Client</label>
            <select
              className="filter-select"
              value={filters.groupClient}
              onChange={e => setFilter('groupClient', e.target.value)}
              aria-label="Group Client"
            >
              <option value="All">All Clients</option>
              {availableOptions.groupClient.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[150px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">IAE BDD</label>
            <select
              className="filter-select"
              value={filters.iaeBdd}
              onChange={e => setFilter('iaeBdd', e.target.value)}
              aria-label="IAE BDD"
            >
              <option value="All">All BDDs</option>
              {availableOptions.iaeBdd.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

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

      {/* ─── Scrollable Content ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 p-5 overflow-auto fade-in">

        {/* ─── Business Domain Selector (Revenue | Finance | Sales | RMG | DEG) ─── */}
        <div className="card px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cross-Module Lens:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {BUSINESS_DOMAINS.map(d => {
                const isActive = businessDomain === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setBusinessDomain(d.id)}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-xs font-bold transition-all',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <span className="text-2xs text-slate-400 font-medium">
            Active metric: <strong className="text-slate-700 dark:text-slate-200">{activeDomain.label} ({activeDomain.unit})</strong>
          </span>
        </div>

        {/* ─── KPI Summary ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue (FY26)"
            value={`₹ ${fn(kpis.totalRevenue)} Cr`}
            subValue={`AOP: ₹ ${fn(kpis.totalRevenueAop)} Cr`}
            type="primary"
          />
          <KPICard
            label="AOP Achievement"
            value={kpis.aopAchievement}
            isPct
            type={kpis.aopAchievement >= 95 ? 'positive' : kpis.aopAchievement >= 85 ? 'neutral' : 'negative'}
          />
          <KPICard
            label="Total Sales TCV"
            value={`$ ${fn(kpis.totalSalesTCV)} M`}
            subValue="Contracted Value"
            type="primary"
          />
          <KPICard
            label="Active Accounts"
            value={kpis.activeAccounts}
            subValue="Key Clients & Engagements"
            type="neutral"
          />
        </div>

        {/* ─── Top Charts: FY Performance & AOP YoY ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card card-padded">
            <SectionTitle accent={ACC}>
              FY Performance — {activeDomain.label}
            </SectionTitle>
            <div style={{ height: 260 }}>
              <ReactECharts option={fyOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>

          <div className="card card-padded">
            <SectionTitle accent={ACC}>
              AOP YoY Performance — {activeDomain.label}
            </SectionTitle>
            <div style={{ height: 260 }}>
              <ReactECharts option={aopYoYOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
        </div>

        {/* ─── Middle Chart: Quarterly Performance ─── */}
        <div className="card card-padded">
          <SectionTitle accent={ACC}>
            Quarterly Performance — {activeDomain.label}
          </SectionTitle>
          <div style={{ height: 270 }}>
            <ReactECharts option={qtrOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* ─── Bottom Table: Yearly Performance ─── */}
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle accent={ACC}>
              Yearly Performance by Sub Unit ({activeDomain.label})
            </SectionTitle>
            <button onClick={exportCSV} className="export-btn">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>

          <div className="overflow-auto max-h-[380px] border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="data-table w-full text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 160 }}>Sub Unit</th>
                  {['FY23', 'FY24', 'FY25', 'FY26', 'FY27'].map(fy => (
                    <th key={fy} colSpan={4} className="text-center py-2 px-2 border-l border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-700/60">
                      {fy}
                    </th>
                  ))}
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700 text-2xs text-slate-500">
                  <th className="text-left py-1.5 px-3">Dimension</th>
                  {['FY23', 'FY24', 'FY25', 'FY26', 'FY27'].flatMap(fy => [
                    <th key={`${fy}-aop`} className="text-right py-1.5 px-1.5 border-l border-slate-200 dark:border-slate-700">AOP</th>,
                    <th key={`${fy}-act`} className="text-right py-1.5 px-1.5">Act/Proj</th>,
                    <th key={`${fy}-aopp`} className="text-right py-1.5 px-1.5">AOP%</th>,
                    <th key={`${fy}-yoy`} className="text-right py-1.5 px-1.5">YoY%</th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map(row => (
                  <tr key={row.subUnit} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="text-left font-semibold py-2 px-3" style={{ color: 'var(--text-primary)' }}>
                      {row.subUnit}
                    </td>
                    {['FY23', 'FY24', 'FY25', 'FY26', 'FY27'].flatMap(fy => {
                      const m = row.fyMetrics[fy] || {};
                      return [
                        <td key={`${fy}-a`} className="text-right py-2 px-1.5 border-l border-slate-200 dark:border-slate-800 text-slate-500">{fn(m.aop)}</td>,
                        <td key={`${fy}-b`} className="text-right py-2 px-1.5 font-medium" style={{ color: 'var(--text-primary)' }}>{fn(m.actual)}</td>,
                        <td key={`${fy}-c`} className="text-right py-2 px-1.5" style={{ color: m.aopPct >= 95 ? 'var(--success)' : m.aopPct >= 85 ? 'var(--warning)' : 'var(--danger)', fontWeight: 600 }}>{m.aopPct ? `${m.aopPct}%` : '—'}</td>,
                        <td key={`${fy}-d`} className="text-right py-2 px-1.5 text-blue-600 dark:text-blue-400 font-semibold">{m.yoyPct ? `${m.yoyPct}%` : '—'}</td>,
                      ];
                    })}
                  </tr>
                ))}

                {/* Grand Total */}
                <tr className="sticky bottom-0 bg-slate-100 dark:bg-slate-800 border-t-2 border-blue-500 font-bold z-10">
                  <td className="text-left py-2.5 px-3" style={{ color: 'var(--text-primary)' }}>
                    Grand Total
                  </td>
                  {['FY23', 'FY24', 'FY25', 'FY26', 'FY27'].flatMap(fy => {
                    const m = tableData.grandTotal.fyMetrics[fy] || {};
                    return [
                      <td key={`${fy}-ta`} className="text-right py-2.5 px-1.5 border-l border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">{fn(m.aop)}</td>,
                      <td key={`${fy}-tb`} className="text-right py-2.5 px-1.5 text-blue-600 dark:text-blue-400 font-extrabold">{fn(m.actual)}</td>,
                      <td key={`${fy}-tc`} className="text-right py-2.5 px-1.5 text-emerald-600 dark:text-emerald-400">{m.aopPct ? `${m.aopPct}%` : '—'}</td>,
                      <td key={`${fy}-td`} className="text-right py-2.5 px-1.5 text-amber-600 dark:text-amber-400">{m.yoyPct ? `${m.yoyPct}%` : '—'}</td>,
                    ];
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
