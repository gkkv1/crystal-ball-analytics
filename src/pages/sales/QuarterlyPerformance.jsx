// src/pages/sales/QuarterlyPerformance.jsx
// Tab 2: Quarterly TCV Trend, Qualified Pipeline, Offering breakdown + all dimensional tables

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSalesFilters } from '../../context/SalesFilterContext.jsx';
import {
  calculateSalesKPIs, getTCVByQuarter, getNewDealByQuarter,
  getPipelineByQuarter, getOfferingBreakdown,
  getClusterTCVPerformance, getSubUnitTCVPerformance, getGeoTCVPerformance,
} from '../../utils/salesCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import SalesFilterBar from '../../components/layout/SalesFilterBar.jsx';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Download } from 'lucide-react';

const ACC  = 'sales-accent';
const fmtM = v => (v != null ? `$${Number(v).toFixed(1)}M` : '—');
const fmtP = v => (v != null ? `${Number(v).toFixed(1)}%` : '—');
const pColor = pct => pct >= 100 ? { color: 'var(--success)', fontWeight: 700 } : pct >= 80 ? { color: 'var(--warning)', fontWeight: 700 } : { color: 'var(--danger)', fontWeight: 700 };

// ─── Quarterly TCV bar+line (reused shape) ─────────────────────────────
function QtrBarLineChart({ data, xField = 'label', color1, color2, lineColor, f1, l1, f2, l2, lf, ll }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;margin-bottom:4px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          const v = p.seriesName === ll ? `${Number(p.value).toFixed(0)}%` : `$${Number(p.value).toFixed(1)}M`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${v}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 44, right: 60, bottom: 48, left: 68 },
    xAxis: { type: 'category', data: data.map(d => d[xField]), axisLine: ct.axisLine, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, rotate: 40, fontSize: 10 } },
    yAxis: [
      { type: 'value', name: 'TCV ($Mn)', nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
      { type: 'value', name: '%', min: 0, max: 150, nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` } },
    ],
    series: [
      { name: l1, type: 'bar', yAxisIndex: 0, data: data.map(d => d[f1]), barMaxWidth: 30, itemStyle: { color: color1, borderRadius: [3, 3, 0, 0] } },
      { name: l2, type: 'bar', yAxisIndex: 0, data: data.map(d => d[f2]), barMaxWidth: 30, itemStyle: { color: color2, borderRadius: [3, 3, 0, 0] } },
      { name: ll, type: 'line', yAxisIndex: 1, smooth: true, data: data.map(d => d[lf]), symbol: 'circle', symbolSize: 6, lineStyle: { color: lineColor, width: 2.5 }, itemStyle: { color: lineColor, borderWidth: 2, borderColor: ct.bg } },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Qualified Pipeline horizontal bar ───────────────────────────────────
function PipelineChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const recent = data.slice(-8);
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;margin-bottom:4px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach(p => { const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`; html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b>$${Number(p.value).toFixed(1)}M</b></div>`; });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 36, right: 20, bottom: 48, left: 70 },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
    yAxis: { type: 'category', data: recent.map(d => d.label), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, fontSize: 10 } },
    series: [
      { name: 'Overall Pipeline', type: 'bar', data: recent.map(d => d.overall), barMaxWidth: 14, itemStyle: { color: ct.colors.blue, borderRadius: [0, 3, 3, 0] } },
      { name: 'Qualified Pipeline', type: 'bar', data: recent.map(d => d.qualified), barMaxWidth: 14, itemStyle: { color: ct.colors.teal, borderRadius: [0, 3, 3, 0] } },
      { name: 'Shelved & Scrapped', type: 'bar', data: recent.map(d => d.shelved), barMaxWidth: 14, itemStyle: { color: ct.colors.red, borderRadius: [0, 3, 3, 0] } },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Offering breakdown horizontal ───────────────────────────────────────
function OfferingChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const top10 = data.slice(0, 10);
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item', ...ct.tooltip,
      formatter(p) { return `<div style="font-weight:700;color:${ct.textPrimary}">${p.name}</div><div style="font-size:12px;color:${ct.textSec}">Won: <b>$${Number(p.value).toFixed(1)}M</b></div>`; },
    },
    grid: { top: 8, right: 60, bottom: 8, left: 210 },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
    yAxis: { type: 'category', data: top10.map(d => d.subSP).reverse(), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, fontSize: 10 } },
    series: [{
      name: 'TCV Won', type: 'bar', data: top10.map(d => d.tcvWon).reverse(),
      barMaxWidth: 18,
      itemStyle: { color: (params) => { const colors = [ct.colors.blue,ct.colors.teal,ct.colors.amber,ct.colors.violet,ct.colors.orange,ct.colors.green,ct.colors.indigo]; return colors[params.dataIndex % colors.length]; }, borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', fontSize: 10, fontWeight: '700', color: ct.textSec, formatter: p => `$${Number(p.value).toFixed(0)}M` },
    }],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Generic perf table ───────────────────────────────────────────────────
function PerfTable({ data, labelHdr = 'Dimension' }) {
  if (!data?.rows?.length) return <EmptyState />;
  const { rows, periods } = data;
  const visP = periods.slice(-2);

  return (
    <div className="overflow-auto" style={{ maxHeight: 300 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th className="text-left" style={{ minWidth: 140 }}>{labelHdr}</th>
            {visP.map(p => <th key={p} colSpan={3} style={{ textAlign: 'center', minWidth: 200, borderLeft: '1px solid var(--border)' }}>{p}</th>)}
          </tr>
          <tr>
            <th />
            {visP.map(p => (<><th key={`${p}-a`} style={{ minWidth: 75, borderLeft: '1px solid var(--border)' }}>AOP($M)</th><th key={`${p}-w`}>Won($M)</th><th key={`${p}-p`}>%</th></>))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td className="font-semibold">{row.label}</td>
              {visP.map(p => { const d = row.byPeriod[p] || {}; return (<><td key={`${p}-a`} style={{ borderLeft: '1px solid var(--border)' }}>{fmtM(d.tcvAOP)}</td><td key={`${p}-w`}>{fmtM(d.tcvWon)}</td><td key={`${p}-p`} style={pColor(d.achievedPct)}>{fmtP(d.achievedPct)}</td></>); })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function QuarterlyPerformance() {
  const { allData, filteredData, filters } = useSalesFilters();
  const ct = useChartTheme();

  const kpis      = useMemo(() => calculateSalesKPIs(filteredData), [filteredData]);
  const qtrTCV    = useMemo(() => getTCVByQuarter(allData, filters), [allData, filters]);
  const qtrND     = useMemo(() => getNewDealByQuarter(allData, filters), [allData, filters]);
  const pipeD     = useMemo(() => getPipelineByQuarter(allData, filters), [allData, filters]);
  const offeringD = useMemo(() => getOfferingBreakdown(allData, filters), [allData, filters]);
  const clusterD  = useMemo(() => getClusterTCVPerformance(allData, filters), [allData, filters]);
  const suD       = useMemo(() => getSubUnitTCVPerformance(allData, filters), [allData, filters]);
  const geoD      = useMemo(() => getGeoTCVPerformance(allData, filters), [allData, filters]);

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <SalesFilterBar showQuarter={true} showFY={true} showAiNr={true} />

      {/* KPIs */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard label="TCV AOP"      value={kpis.tcvAOP}      unit="$Mn" type="primary" />
          <KPICard label="TCV Won"      value={kpis.tcvWon}      unit="$Mn" type="primary" />
          <KPICard label="% Achieved"   value={kpis.achievedPct} isPct type={kpis.achievedPct >= 100 ? 'positive' : 'negative'} />
          <KPICard label="Pipeline"     value={kpis.tcvPipeline} unit="$Mn" type="neutral" />
          <KPICard label="Qualified"    value={kpis.tcvQual}     unit="$Mn" type="neutral" />
          <KPICard label="New Deal Won" value={kpis.newDealWon}  unit="$Mn" type="primary" />
        </div>
      ) : <EmptyState />}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Quarterly TCV Trend ($Mn)</SectionTitle>
          <div style={{ height: 280 }}>
            <QtrBarLineChart data={qtrTCV.slice(-12)} color1={ct.colors.blue} color2={ct.colors.orange} lineColor={ct.colors.amber} f1="tcvAOP" l1="TCV AOP" f2="tcvWon" l2="TCV Won" lf="achievedPct" ll="% Achieved" />
          </div>
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Quarterly New Deal TCV Trend ($Mn)</SectionTitle>
          <div style={{ height: 280 }}>
            <QtrBarLineChart data={qtrND.slice(-12)} color1={ct.colors.teal} color2={ct.colors.violet} lineColor={ct.colors.amber} f1="newDealAOP" l1="ND AOP" f2="newDealWon" l2="ND Won" lf="achievedPct" ll="% Achieved ND" />
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Qualified Pipeline ($Mn)</SectionTitle>
          <div style={{ height: 300 }}>
            <PipelineChart data={pipeD} />
          </div>
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACC}>New Deal TCV WON by Offering ($Mn)</SectionTitle>
          <div style={{ height: 300 }}>
            <OfferingChart data={offeringD} />
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="card card-padded">
        <SectionTitle accent={ACC}>BG Cluster Wise TCV Performance</SectionTitle>
        <PerfTable data={clusterD} labelHdr="BG Cluster" />
      </div>
      <div className="card card-padded">
        <SectionTitle accent={ACC}>Sub Unit Wise TCV Performance</SectionTitle>
        <PerfTable data={suD} labelHdr="Sub Unit" />
      </div>
      <div className="card card-padded">
        <SectionTitle accent={ACC}>Geo Wise TCV Performance</SectionTitle>
        <PerfTable data={geoD} labelHdr="Sales Geo" />
      </div>
    </div>
  );
}
