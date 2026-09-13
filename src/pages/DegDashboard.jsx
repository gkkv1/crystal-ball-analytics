// src/pages/DegDashboard.jsx
// DEG Performance — SINGLE DASHBOARD VIEW
// No sub-tabs: all sections are on one scrollable page.

import { Fragment, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { RotateCcw, Filter, ChevronDown, ChevronRight, Download } from 'lucide-react';
import clsx from 'clsx';

import { DegFilterProvider, useDegFilters } from '../context/DegFilterContext.jsx';
import {
  calculateDegKPIs, getCsiTrend, getCsiBySubUnit, getCsiTable,
} from '../utils/degCalculations.js';
import { useChartTheme } from '../hooks/useChartTheme.js';
import Header from '../components/layout/Header.jsx';
import KPICard from '../components/kpi/KPICard.jsx';
import SectionTitle from '../components/common/SectionTitle.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ChartCard from '../components/customReport/ChartCard.jsx';
import { DEG_CSI_TREND_META, DEG_CSI_PROJECT_META, DEG_CSI_SUBUNIT_META } from '../components/customReport/metadata/degMeta.js';


const ACC = 'deg-accent';
const f1  = v => (v != null ? `${Number(v).toFixed(1)}%` : '—');
const fn  = v => (v != null ? Number(v).toLocaleString() : '—');

/* ═══════════════════════════════════════════════════════════════════════════
   FILTER BAR
═══════════════════════════════════════════════════════════════════════════ */
function SelectFilter({ label, field, options }) {
  const { filters, setFilter } = useDegFilters();
  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div className="flex flex-col gap-1">
      <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">{label}</label>
      <select className="filter-select" value={filters[field]} onChange={e => setFilter(field, e.target.value)} aria-label={label}>
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

function DegFilterBar() {
  const { availableOptions, filterSummary, hasActiveFilters, resetFilters } = useDegFilters();
  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const clusterOpts = availableOptions.bgCluster.map(id => ({ id, label: cap(id) }));
  const bgOpts      = availableOptions.bg.map(id       => ({ id, label: cap(id) }));
  const suOpts      = availableOptions.subUnit.map(id  => ({ id, label: cap(id) }));

  return (
    <div className="filter-bar bg-white border-b border-slate-200 px-6 py-3 shrink-0">
      <div className="flex items-end gap-4 flex-wrap">
        <SelectFilter label="BG Cluster"   field="bgCluster"   options={clusterOpts}                    />
        <SelectFilter label="BG"           field="bg"          options={bgOpts}                         />
        <SelectFilter label="Sub Unit"     field="subUnit"     options={suOpts}                         />
        <SelectFilter label="Geo"          field="geo"         options={availableOptions.geo}            />
        <SelectFilter label="Group Client" field="groupClient" options={availableOptions.groupClient}    />
        <div className="flex flex-col justify-end self-end ml-auto">
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border',
              hasActiveFilters
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Clear All Filters
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2.5">
        <Filter className="w-3 h-3 text-slate-400" />
        <span className="text-xs text-slate-500">
          Viewing: <span className="font-semibold text-slate-700">{filterSummary}</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSI % TREND — line/area chart across H1/H2 periods
═══════════════════════════════════════════════════════════════════════════ */
function CsiTrendChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        const p = params[0];
        return `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${p.axisValue}</div>
          <div style="font-size:12px;color:${ct.textSec}">CSI%: <b style="color:${ct.colors.blue}">${Number(p.value).toFixed(1)}%</b></div>`;
      },
    },
    grid: { top: 36, right: 30, bottom: 44, left: 64 },
    xAxis: {
      type: 'category', data: data.map(d => d.period),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: v => Math.floor(v.min - 3),
      max: v => Math.ceil(v.max  + 3),
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` },
    },
    series: [{
      name: 'CSI%',
      type: 'line', smooth: true,
      data: data.map(d => Number(d.csiScore.toFixed(1))),
      symbol: 'circle', symbolSize: 9,
      lineStyle: { color: ct.colors.blue, width: 3 },
      itemStyle: { color: ct.colors.blue, borderWidth: 2, borderColor: ct.bg },
      areaStyle: { color: `${ct.colors.blue}20` },
      label: {
        show: true, position: 'top', fontSize: 11, fontWeight: '800',
        color: ct.colors.blue, formatter: p => `${Number(p.value).toFixed(1)}%`,
      },
      markLine: {
        data: [{ type: 'average', name: 'Avg' }],
        lineStyle: { type: 'dashed', color: ct.colors.amber, width: 1.5 },
        label: { formatter: p => `Avg: ${Number(p.value).toFixed(1)}%`, color: ct.colors.amber, fontSize: 10 },
      },
    }],
    animation: true, animationDuration: 700,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOTAL PROJECTS vs 100% CSI — grouped bar
═══════════════════════════════════════════════════════════════════════════ */
function CsiProjectChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${fn(p.value)}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 36, right: 24, bottom: 44, left: 60 },
    xAxis: {
      type: 'category', data: data.map(d => d.period),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 11 },
    },
    yAxis: {
      type: 'value', axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: ct.axisLabel,
    },
    series: [
      {
        name: 'Total Projects', type: 'bar', barMaxWidth: 36,
        data: data.map(d => d.totalProjects),
        itemStyle: { color: ct.colors.blue, borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.blue },
      },
      {
        name: '100% CSI', type: 'bar', barMaxWidth: 36,
        data: data.map(d => d.csi100Count),
        itemStyle: { color: ct.colors.teal, borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.teal },
      },
    ],
    animation: true, animationDuration: 700,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSI % TREND BY SUB UNIT — grouped bar (up to 6 sub units shown)
═══════════════════════════════════════════════════════════════════════════ */
function CsiSubUnitChart({ data }) {
  const ct = useChartTheme();
  if (!data?.subUnits?.length) return <EmptyState />;

  // limit to top 6 sub units by total projects
  const topSUs = [...data.subUnits]
    .sort((a, b) => b.periods.reduce((s, p) => s + p.totalProjects, 0) - a.periods.reduce((s, p) => s + p.totalProjects, 0))
    .slice(0, 6);

  const CHART_COLORS = [ct.colors.blue, ct.colors.teal, ct.colors.amber, ct.colors.violet, ct.colors.orange, ct.colors.green];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;color:${ct.textPrimary};margin-bottom:4px">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          if (p.value <= 0) return;
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b>${Number(p.value).toFixed(1)}%</b></div>`;
        });
        return html;
      },
    },
    legend: {
      top: 0, right: 0,
      data: topSUs.map(s => s.label),
      textStyle: ct.legendText,
      itemWidth: 12, itemHeight: 8,
    },
    grid: { top: 44, right: 24, bottom: 48, left: 56 },
    xAxis: {
      type: 'category', data: data.periods,
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700', fontSize: 11 },
    },
    yAxis: {
      type: 'value', min: 75, max: 100, name: 'CSI%',
      nameTextStyle: { color: ct.textMuted, fontSize: 10 },
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` },
    },
    series: topSUs.map((su, i) => ({
      name: su.label, type: 'bar', barMaxWidth: 28,
      data: su.periods.map(p => p.csiScore > 0 ? p.csiScore : null),
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderRadius: [3, 3, 0, 0] },
      label: { show: true, position: 'top', fontSize: 9, fontWeight: '700', color: CHART_COLORS[i % CHART_COLORS.length], formatter: p => p.value ? `${Number(p.value).toFixed(0)}%` : '' },
    })),
    animation: true, animationDuration: 700,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSI TABLE — expandable rows: Sub Unit → Period rows
═══════════════════════════════════════════════════════════════════════════ */
function CsiTable({ tableData }) {
  const [expanded, setExpanded] = useState({});
  if (!tableData?.rows?.length) return <EmptyState message="No DEG data for selected filters." />;
  const { rows, grandTotal } = tableData;

  const toggle = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  function pct(v) { return v != null ? `${Number(v).toFixed(1)}%` : '—'; }
  function num(v) { return v != null ? fn(v) : '—'; }
  function csiColor(v) {
    if (v >= 95) return { color: 'var(--success)', fontWeight: 700 };
    if (v >= 90) return { color: 'var(--warning)', fontWeight: 700 };
    return { color: 'var(--danger)', fontWeight: 700 };
  }

  function exportCSV() {
    const h = ['Sub Unit', 'Period', 'Total Projects', 'CSI Score', '100% CSI', '100% CSI%', '100% Response%', 'Low CSI', 'Low CSI%', 'Loyalty', 'Loyalty%', 'Ranking', 'Ranking%'];
    const body = [];
    rows.forEach(row => {
      body.push([row.label, 'TOTAL', row.totals.totalProjects, row.totals.csiScore, row.totals.csi100Count, row.totals.csi100Pct, '', row.totals.lowCsiCount, row.totals.lowCsiPct, row.totals.loyaltyCount, row.totals.loyaltyPct, row.totals.rankingCount, row.totals.rankingPct]);
      row.byPeriod.forEach(p => {
        body.push(['', p.period, p.totalProjects, p.csiScore, p.csi100Count, p.csi100Pct, p.csi100RespPct, p.lowCsiCount, p.lowCsiPct, p.loyaltyCount, p.loyaltyPct, p.rankingCount, p.rankingPct]);
      });
    });
    body.push(['Total', 'ALL', grandTotal.totalProjects, grandTotal.csiScore, grandTotal.csi100Count, grandTotal.csi100Pct, '', grandTotal.lowCsiCount, grandTotal.lowCsiPct, grandTotal.loyaltyCount, grandTotal.loyaltyPct, grandTotal.rankingCount, grandTotal.rankingPct]);
    const csv = [h, ...body].map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'csi_table.csv'; a.click();
  }

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rows.length} sub units · {rows.reduce((a, r) => a + r.byPeriod.length, 0)} period rows</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />CSV</button>
      </div>
      <div className="overflow-auto">
        <table className="data-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>Sub Unit / Period</th>
              <th style={{ minWidth: 80 }}>Total Projects</th>
              <th style={{ minWidth: 90 }}>CSI Score</th>
              <th style={{ minWidth: 80 }}>100% CSI</th>
              <th style={{ minWidth: 90 }}>100% CSI%</th>
              <th style={{ minWidth: 100 }}>100% CSI Resp%</th>
              <th style={{ minWidth: 80 }}>Low CSI</th>
              <th style={{ minWidth: 80 }}>Low CSI%</th>
              <th style={{ minWidth: 80 }}>Loyalty</th>
              <th style={{ minWidth: 100 }}>Loyalty%</th>
              <th style={{ minWidth: 80 }}>Ranking</th>
              <th style={{ minWidth: 90 }}>Ranking%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isOpen = expanded[row.id];
              return (
                <Fragment key={row.id}>
                  {/* Sub Unit header row */}
                  <tr
                    onClick={() => toggle(row.id)}
                    style={{
                      cursor: 'pointer',
                      background: 'var(--bg-muted)',
                      borderTop: '2px solid var(--border)',
                    }}
                  >
                    <td className="text-left font-bold" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />
                        : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      }
                      {row.label}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{num(row.totals.totalProjects)}</td>
                    <td style={csiColor(row.totals.csiScore)}>{pct(row.totals.csiScore)}</td>
                    <td>{num(row.totals.csi100Count)}</td>
                    <td>{pct(row.totals.csi100Pct)}</td>
                    <td>—</td>
                    <td>{num(row.totals.lowCsiCount)}</td>
                    <td style={{ color: row.totals.lowCsiPct > 12 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600 }}>{pct(row.totals.lowCsiPct)}</td>
                    <td>{num(row.totals.loyaltyCount)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{pct(row.totals.loyaltyPct)}</td>
                    <td>{num(row.totals.rankingCount)}</td>
                    <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{pct(row.totals.rankingPct)}</td>
                  </tr>

                  {/* Period sub-rows */}
                  {isOpen && row.byPeriod.map(p => (
                    <tr key={`${row.id}-${p.period}`} style={{ background: 'var(--bg-card)' }}>
                      <td className="text-left" style={{ paddingLeft: 30, color: 'var(--text-sec)', fontSize: '0.78rem' }}>
                        {p.period}
                      </td>
                      <td>{num(p.totalProjects)}</td>
                      <td style={csiColor(p.csiScore)}>{pct(p.csiScore)}</td>
                      <td>{num(p.csi100Count)}</td>
                      <td>{pct(p.csi100Pct)}</td>
                      <td>{pct(p.csi100RespPct)}</td>
                      <td>{num(p.lowCsiCount)}</td>
                      <td style={{ color: p.lowCsiPct > 12 ? 'var(--danger)' : 'inherit' }}>{pct(p.lowCsiPct)}</td>
                      <td>{num(p.loyaltyCount)}</td>
                      <td style={{ color: 'var(--success)' }}>{pct(p.loyaltyPct)}</td>
                      <td>{num(p.rankingCount)}</td>
                      <td style={{ color: 'var(--accent-blue)' }}>{pct(p.rankingPct)}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}

            {/* Grand total */}
            <tr style={{ background: 'var(--bg-muted)', borderTop: '2px solid var(--accent-blue)', fontWeight: 800 }}>
              <td className="text-left" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Total</td>
              <td style={{ color: 'var(--text-primary)' }}>{num(grandTotal.totalProjects)}</td>
              <td style={{ ...csiColor(grandTotal.csiScore), fontWeight: 800 }}>{pct(grandTotal.csiScore)}</td>
              <td>{num(grandTotal.csi100Count)}</td>
              <td>{pct(grandTotal.csi100Pct)}</td>
              <td>—</td>
              <td>{num(grandTotal.lowCsiCount)}</td>
              <td>{pct(grandTotal.lowCsiPct)}</td>
              <td>{num(grandTotal.loyaltyCount)}</td>
              <td style={{ color: 'var(--success)' }}>{pct(grandTotal.loyaltyPct)}</td>
              <td>{num(grandTotal.rankingCount)}</td>
              <td style={{ color: 'var(--accent-blue)' }}>{pct(grandTotal.rankingPct)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INNER CONTENT (consumes context)
═══════════════════════════════════════════════════════════════════════════ */
function DegContent() {
  const { allData, filteredData, filters } = useDegFilters();

  const kpis       = useMemo(() => calculateDegKPIs(filteredData), [filteredData]);
  const csiTrend   = useMemo(() => getCsiTrend(allData, filters),   [allData, filters]);
  const suData     = useMemo(() => getCsiBySubUnit(allData, filters),[allData, filters]);
  const tableData  = useMemo(() => getCsiTable(allData, filters),    [allData, filters]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter bar */}
      <DegFilterBar />

      {/* Scrollable content */}
      <div className="flex flex-col gap-5 p-5 overflow-auto fade-in">

        {/* ── KPI Row ── */}
        {kpis ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard label="Overall CSI Score"   value={kpis.csiScore}      isPct type={kpis.csiScore >= 95 ? 'positive' : kpis.csiScore >= 90 ? 'neutral' : 'negative'} />
            <KPICard label="Total Projects"      value={kpis.totalProjects} type="primary" />
            <KPICard label="100% CSI Projects"   value={kpis.csi100Count}   type="primary" />
            <KPICard label="Low CSI Count"       value={kpis.lowCsiCount}   type={kpis.lowCsiPct <= 10 ? 'positive' : 'negative'} />
            <KPICard label="Customer Loyalty%"   value={kpis.loyaltyPct}    isPct type="positive" />
            <KPICard label="Ranking%"            value={kpis.rankingPct}    isPct type="primary" />
          </div>
        ) : (
          <EmptyState message="No DEG data for selected filters. Try adjusting your filters." />
        )}

        {/* ── Row 1: CSI % Trend + Total vs 100% CSI ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="CSI% Trend across Periods" accent={ACC} chartMeta={DEG_CSI_TREND_META} data={filteredData} height={280}>
            <CsiTrendChart data={csiTrend} />
          </ChartCard>
          <ChartCard title="Total Projects vs 100% CSI by Period" accent={ACC} chartMeta={DEG_CSI_PROJECT_META} data={filteredData} height={280}>
            <CsiProjectChart data={csiTrend} />
          </ChartCard>
        </div>

        {/* ── Row 2: CSI% by Sub Unit ── */}
        <ChartCard title="CSI% Trend by Sub Unit (Top 6)" accent={ACC} chartMeta={DEG_CSI_SUBUNIT_META} data={filteredData} height={300}>
          <CsiSubUnitChart data={suData} />
        </ChartCard>

        {/* ── CSI Table ── */}
        <div className="card card-padded">
          <SectionTitle accent={ACC}>CSI Detail Table (Click Sub Unit to expand)</SectionTitle>
          <CsiTable tableData={tableData} />
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEG DASHBOARD SHELL
═══════════════════════════════════════════════════════════════════════════ */
export default function DegDashboard({ onNavigate }) {
  return (
    <DegFilterProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <Header
          onHome={() => onNavigate('landing')}
          showHome={true}
          moduleLabel="DEG Performance"
        />

        {/* Nav strip — minimal, just Home button since single view */}
        <nav style={{
          background: 'linear-gradient(135deg, #134E4A 0%, #0D3D3A 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
            DEG Performance Dashboard
          </span>

          <span style={{
            marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Customer Satisfaction Intelligence
          </span>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
          <DegContent />
        </main>
      </div>
    </DegFilterProvider>
  );
}
