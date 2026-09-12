// src/pages/account/ClientVisit.jsx
// Tab 2 of Account Management: Client Visit
// Meeting category KPIs, monthly time-series trend, client × month matrix, and searchable detail table.

import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { RotateCcw, Filter, Users, Calendar, Download, Search, Briefcase } from 'lucide-react';
import clsx from 'clsx';

import { useAccountFilters } from '../../context/AccountFilterContext.jsx';
import { MEETING_CATEGORIES } from '../../data/accountData.js';
import {
  calculateVisitKPIs,
  getMeetingsTrend,
  getMeetingMatrix,
} from '../../utils/accountCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const ACC = 'account-accent';
const fn = v => (v != null ? Number(v).toLocaleString() : '0');

export default function ClientVisit() {
  const {
    filters,
    setFilter,
    resetFilters,
    availableOptions,
    filteredVisits,
    filterSummary,
    hasActiveFilters,
  } = useAccountFilters();

  const ct = useChartTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const kpis = useMemo(() => calculateVisitKPIs(filteredVisits), [filteredVisits]);
  const trendData = useMemo(() => getMeetingsTrend(filteredVisits), [filteredVisits]);
  const matrixData = useMemo(() => getMeetingMatrix(filteredVisits), [filteredVisits]);

  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const clusterOpts = availableOptions.bgCluster.map(id => ({ id, label: cap(id) }));

  // Search filtered visits
  const searchedVisits = useMemo(() => {
    if (!searchTerm.trim()) return filteredVisits;
    const term = searchTerm.toLowerCase();
    return filteredVisits.filter(v =>
      v.groupClient.toLowerCase().includes(term) ||
      v.customerName.toLowerCase().includes(term) ||
      v.meetingType.toLowerCase().includes(term) ||
      v.tcsAttendees.toLowerCase().includes(term)
    );
  }, [filteredVisits, searchTerm]);

  // ─── Chart: Total Meetings Trend (Line with Area Gradient) ────────────────
  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...ct.tooltip,
      formatter(params) {
        const p = params[0];
        if (!p) return '';
        const item = trendData[p.dataIndex];
        return `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${item?.fullLabel || p.axisValue}</div>
          <div style="font-size:12px;color:${ct.textSec}">Meetings: <b style="color:${ct.colors.blue}">${p.value}</b></div>`;
      },
    },
    grid: { top: 32, right: 24, bottom: 44, left: 48 },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.label),
      axisLine: ct.axisLine,
      axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontSize: 10, fontWeight: '700', interval: 0 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: ct.axisLabel,
    },
    series: [{
      name: 'Total Meetings',
      type: 'line',
      smooth: true,
      data: trendData.map(d => d.count),
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: ct.colors.blue },
      itemStyle: { color: ct.colors.blue, borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${ct.colors.blue}40` },
            { offset: 1, color: `${ct.colors.blue}05` },
          ],
        },
      },
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        fontWeight: '800',
        color: ct.colors.blue,
      },
    }],
    animation: true,
    animationDuration: 600,
  };

  // Export Matrix CSV
  function exportMatrixCSV() {
    const headers = ['Group Client', 'BG Cluster', ...matrixData.months, 'Total'];
    const body = matrixData.rows.map(r => [
      r.groupClient,
      r.bgCluster,
      ...matrixData.months.map(m => r.byMonth[m] || 0),
      r.total,
    ]);
    body.push(['Grand Total', 'ALL', ...matrixData.months.map(m => matrixData.grandTotal.byMonth[m] || 0), matrixData.grandTotal.total]);

    const csv = [headers, ...body].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'client_visits_matrix.csv';
    a.click();
  }

  // Export Details CSV
  function exportDetailsCSV() {
    const headers = ['Group Client', 'BG Cluster', 'Meeting Date', 'Customer Name', 'Meeting Type', 'TCS Attendees', 'Status'];
    const body = searchedVisits.map(v => [
      v.groupClient,
      v.bgClusterLabel,
      v.meetingDate,
      v.customerName,
      v.meetingType,
      v.tcsAttendees,
      v.status,
    ]);

    const csv = [headers, ...body].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'client_visit_details.csv';
    a.click();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="filter-bar bg-white border-b border-slate-200 px-6 py-3 shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[130px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">BG Cluster</label>
            <select
              className="filter-select"
              value={filters.bgCluster}
              onChange={e => setFilter('bgCluster', e.target.value)}
              aria-label="BG Cluster"
            >
              <option value="All">All</option>
              {clusterOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[150px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">Group Client</label>
            <select
              className="filter-select"
              value={filters.groupClient}
              onChange={e => setFilter('groupClient', e.target.value)}
              aria-label="Group Client"
            >
              <option value="All">All</option>
              {availableOptions.groupClient.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[130px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">IAE BDD</label>
            <select
              className="filter-select"
              value={filters.iaeBdd}
              onChange={e => setFilter('iaeBdd', e.target.value)}
              aria-label="IAE BDD"
            >
              <option value="All">All</option>
              {availableOptions.iaeBdd.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[130px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">IAE BRM</label>
            <select
              className="filter-select"
              value={filters.iaeBrm}
              onChange={e => setFilter('iaeBrm', e.target.value)}
              aria-label="IAE BRM"
            >
              <option value="All">All</option>
              {availableOptions.iaeBrm.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1 min-w-[130px] flex-1">
            <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">IAE Geo Head</label>
            <select
              className="filter-select"
              value={filters.iaeGeoHead}
              onChange={e => setFilter('iaeGeoHead', e.target.value)}
              aria-label="IAE Geo Head"
            >
              <option value="All">All</option>
              {availableOptions.iaeGeoHead.map(g => <option key={g} value={g}>{g}</option>)}
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

        {/* ─── Meeting Category KPI Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Meetings Card */}
          <div
            className="card card-padded flex flex-col justify-center items-center text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(59,130,246,0.3)',
            }}
          >
            <div className="text-2xs uppercase tracking-wider font-bold text-blue-200 mb-1">
              Total Meetings
            </div>
            <div className="text-3xl font-black">{kpis.total}</div>
            <div className="text-2xs text-blue-300 mt-1">All Categories</div>
          </div>

          {/* Category Cards */}
          {MEETING_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className="card card-padded flex flex-col justify-center items-center text-center relative overflow-hidden"
              style={{ borderTop: `3px solid ${cat.color}` }}
            >
              <div className="text-2xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
                {cat.label}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {kpis.catCounts[cat.id] || 0}
              </div>
              <div className="text-2xs text-slate-400 mt-1">
                {kpis.total > 0 ? `${Math.round(((kpis.catCounts[cat.id] || 0) / kpis.total) * 100)}% share` : '0%'}
              </div>
            </div>
          ))}
        </div>

        {/* ─── Total Meetings Trend Line Chart ─── */}
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle accent={ACC}>
              Total Meetings by FY Year, Quarter and Month
            </SectionTitle>
            <span className="text-2xs text-slate-400 font-semibold uppercase tracking-wider">
              Engagement Trajectory
            </span>
          </div>
          <div style={{ height: 260 }}>
            <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* ─── Meeting Monthly Matrix Table (Group Client × Month) ─── */}
        <div className="card card-padded">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle accent={ACC}>
              Meeting Schedule Matrix by Group Client
            </SectionTitle>
            <button onClick={exportMatrixCSV} className="export-btn">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>

          <div className="overflow-auto max-h-[360px] border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="data-table w-full text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr>
                  <th className="text-left py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20" style={{ minWidth: 160 }}>
                    Group Client
                  </th>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 140 }}>BG Cluster</th>
                  {matrixData.months.map(m => (
                    <th key={m} className="text-center py-2.5 px-1.5" style={{ minWidth: 50 }}>
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="text-right py-2.5 px-3 bg-slate-200 dark:bg-slate-700 font-bold" style={{ minWidth: 60 }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixData.rows.map(row => (
                  <tr key={row.groupClient} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="text-left font-semibold py-2 px-3 sticky left-0 bg-white dark:bg-slate-900 z-10" style={{ color: 'var(--text-primary)' }}>
                      {row.groupClient}
                    </td>
                    <td className="text-left py-2 px-3 text-slate-500">{row.bgCluster}</td>
                    {matrixData.months.map(m => {
                      const count = row.byMonth[m] || 0;
                      return (
                        <td
                          key={m}
                          className="text-center py-2 px-1.5 font-bold"
                          style={{
                            background: count >= 3 ? 'rgba(59,130,246,0.22)' : count > 0 ? 'rgba(59,130,246,0.08)' : 'transparent',
                            color: count > 0 ? 'var(--accent-blue)' : 'var(--text-muted)',
                          }}
                        >
                          {count > 0 ? count : '·'}
                        </td>
                      );
                    })}
                    <td className="text-right font-bold py-2 px-3 bg-slate-50/70 dark:bg-slate-800/40" style={{ color: 'var(--accent-blue)' }}>
                      {row.total}
                    </td>
                  </tr>
                ))}

                {/* Grand Total */}
                <tr className="sticky bottom-0 bg-slate-100 dark:bg-slate-800 border-t-2 border-blue-500 font-bold z-20">
                  <td className="text-left py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30" style={{ color: 'var(--text-primary)' }}>
                    Grand Total
                  </td>
                  <td className="text-left py-2.5 px-3 text-slate-500">ALL</td>
                  {matrixData.months.map(m => (
                    <td key={m} className="text-center py-2.5 px-1.5 font-extrabold text-blue-600 dark:text-blue-400">
                      {matrixData.grandTotal.byMonth[m] || 0}
                    </td>
                  ))}
                  <td className="text-right py-2.5 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold">
                    {matrixData.grandTotal.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Client Visit Detail Table ─── */}
        <div className="card card-padded">
          <div className="table-toolbar flex justify-between items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search client, customer, attendee…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Showing {searchedVisits.length} of {filteredVisits.length} visits
              </span>
            </div>

            <button onClick={exportDetailsCSV} className="export-btn">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>

          <div className="overflow-auto max-h-[380px] border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="data-table w-full text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 150 }}>Group Client</th>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 100 }}>Month</th>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 110 }}>Meeting Date</th>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 140 }}>Customer Name</th>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 150 }}>Meeting Type</th>
                  <th className="text-left py-2.5 px-3" style={{ minWidth: 260 }}>TCS Attendees</th>
                  <th className="text-center py-2.5 px-3" style={{ minWidth: 90 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {searchedVisits.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="text-left font-semibold py-2 px-3" style={{ color: 'var(--text-primary)' }}>
                      <div>{v.groupClient}</div>
                      <div className="text-2xs text-slate-400">{v.bgClusterLabel}</div>
                    </td>
                    <td className="text-left py-2 px-3 text-slate-500">{v.month} ({v.quarter})</td>
                    <td className="text-left py-2 px-3 font-mono text-2xs text-slate-600 dark:text-slate-300">{v.meetingDate}</td>
                    <td className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>{v.customerName}</td>
                    <td className="text-left py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {v.meetingType}
                      </span>
                    </td>
                    <td className="text-left py-2 px-3 text-2xs text-slate-500 dark:text-slate-400">
                      {v.tcsAttendees}
                    </td>
                    <td className="text-center py-2 px-3">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-2xs font-bold',
                          v.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        )}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
