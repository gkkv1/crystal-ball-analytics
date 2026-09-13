// src/pages/sales/FYPerformance.jsx
// Tab 1: FY TCV Trend + FY New Deal Trend + Quarterly charts + Cluster/Geo tables

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSalesFilters } from '../../context/SalesFilterContext.jsx';
import {
  calculateSalesKPIs, getTCVByFY, getNewDealByFY,
  getTCVByQuarter, getNewDealByQuarter,
  getClusterTCVPerformance, getGeoTCVPerformance,
} from '../../utils/salesCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import SalesFilterBar from '../../components/layout/SalesFilterBar.jsx';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Download } from 'lucide-react';
import ChartCard from '../../components/customReport/ChartCard.jsx';
import {
  SALES_FY_TCV_META,
  SALES_FY_NEW_DEAL_META,
  SALES_QTR_TCV_META,
  SALES_QTR_NEW_DEAL_META,
} from '../../components/customReport/metadata/salesMeta.js';

const ACC  = 'sales-accent';
const fmtM = v => (v != null ? `$${Number(v).toFixed(1)}M` : '—');
const fmtP = v => (v != null ? `${Number(v).toFixed(1)}%` : '—');

// ─── Shared chart helper ─────────────────────────────────────────────────
function TCVBarLineChart({ data, xField, barField1, barLabel1, barField2, barLabel2, lineField, lineLabel, barColor1, barColor2, lineColor, yLabel = 'TCV ($Mn)' }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;margin-bottom:5px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach(p => {
          if (p.value == null) return;
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          const v = p.seriesName === lineLabel ? fmtP(p.value) : fmtM(p.value);
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${v}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 44, right: 64, bottom: 36, left: 72 },
    xAxis: { type: 'category', data: data.map(d => d[xField]), axisLine: ct.axisLine, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, fontWeight: '700' } },
    yAxis: [
      { type: 'value', name: yLabel, nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
      { type: 'value', name: '% Achieved', min: 0, max: 160, nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` } },
    ],
    series: [
      { name: barLabel1, type: 'bar', yAxisIndex: 0, data: data.map(d => d[barField1]), barMaxWidth: 44, itemStyle: { color: barColor1, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: barColor1, formatter: p => p.value > 0 ? `$${Number(p.value).toFixed(0)}` : '' } },
      { name: barLabel2, type: 'bar', yAxisIndex: 0, data: data.map(d => d[barField2]), barMaxWidth: 44, itemStyle: { color: barColor2, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: barColor2, formatter: p => p.value > 0 ? `$${Number(p.value).toFixed(0)}` : '' } },
      { name: lineLabel, type: 'line', yAxisIndex: 1, smooth: true, data: data.map(d => d[lineField]), symbol: 'circle', symbolSize: 8, lineStyle: { color: lineColor, width: 2.5 }, itemStyle: { color: lineColor, borderWidth: 2, borderColor: ct.bg }, label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: lineColor, formatter: p => p.value > 0 ? `${Number(p.value).toFixed(0)}%` : '' } },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Cluster Table ────────────────────────────────────────────────────────
function ClusterTable({ data }) {
  if (!data?.rows?.length) return <EmptyState />;
  const { rows, periods } = data;
  const maxP = 2; // show max 2 periods side-by-side to avoid overflow
  const visP = periods.slice(-maxP);

  function pColor(pct) {
    if (pct >= 100) return { color: 'var(--success)', fontWeight: 700 };
    if (pct >= 80)  return { color: 'var(--warning)', fontWeight: 700 };
    return { color: 'var(--danger)', fontWeight: 700 };
  }
  function exportCSV() {
    const h = ['Cluster',...visP.flatMap(p=>[`${p} AOP`,`${p} Won`,`${p} %`]),'Total AOP','Total Won','Total %'];
    const r = rows.map(row=>[row.label,...visP.flatMap(p=>{const d=row.byPeriod[p]||{};return[d.tcvAOP||0,d.tcvWon||0,d.achievedPct||0];}),row.totals.tcvAOP,row.totals.tcvWon,row.totals.achievedPct]);
    const csv=[h,...r].map(x=>x.join(',')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='cluster_tcv.csv';a.click();
  }

  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rows.length} clusters</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />CSV</button>
      </div>
      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>BG Cluster</th>
              {visP.map(p => <th key={p} colSpan={3} style={{ textAlign: 'center', minWidth: 200, borderLeft: '1px solid var(--border)' }}>{p}</th>)}
              <th colSpan={3} style={{ textAlign: 'center', minWidth: 200, borderLeft: '2px solid var(--accent-blue)' }}>Total</th>
            </tr>
            <tr>
              <th />
              {visP.map(p => (<><th key={`${p}-a`} style={{ minWidth: 75, borderLeft: '1px solid var(--border)' }}>AOP ($M)</th><th key={`${p}-w`}>Won ($M)</th><th key={`${p}-p`}>% Ach</th></>))}
              <th style={{ minWidth: 75, borderLeft: '2px solid var(--accent-blue)' }}>AOP ($M)</th><th>Won ($M)</th><th>% Ach</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                {visP.map(p => { const d = row.byPeriod[p] || {}; return (<><td key={`${p}-a`} style={{ borderLeft: '1px solid var(--border)' }}>{fmtM(d.tcvAOP)}</td><td key={`${p}-w`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtM(d.tcvWon)}</td><td key={`${p}-p`} style={pColor(d.achievedPct)}>{fmtP(d.achievedPct)}</td></>); })}
                <td style={{ fontWeight: 700, color: 'var(--text-primary)', borderLeft: '2px solid var(--accent-blue)' }}>{fmtM(row.totals.tcvAOP)}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmtM(row.totals.tcvWon)}</td>
                <td style={pColor(row.totals.achievedPct)}>{fmtP(row.totals.achievedPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Geo Table ─────────────────────────────────────────────────────────────
function GeoTable({ data }) {
  if (!data?.rows?.length) return <EmptyState />;
  const { rows, periods } = data;
  const visP = periods.slice(-2);

  function pColor(pct) {
    if (pct >= 100) return { color: 'var(--success)', fontWeight: 700 };
    if (pct >= 80)  return { color: 'var(--warning)', fontWeight: 700 };
    return { color: 'var(--danger)', fontWeight: 700 };
  }

  return (
    <div className="overflow-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="text-left" style={{ minWidth: 120 }}>Sales Geo</th>
            {visP.map(p => <th key={p} colSpan={3} style={{ textAlign: 'center', minWidth: 200, borderLeft: '1px solid var(--border)' }}>{p}</th>)}
            <th colSpan={3} style={{ textAlign: 'center', minWidth: 200, borderLeft: '2px solid var(--accent-blue)' }}>Total</th>
          </tr>
          <tr>
            <th />
            {visP.map(p => (<><th key={`${p}-a`} style={{ minWidth: 75, borderLeft: '1px solid var(--border)' }}>AOP ($M)</th><th key={`${p}-w`}>Won ($M)</th><th key={`${p}-p`}>%</th></>))}
            <th style={{ minWidth: 75, borderLeft: '2px solid var(--accent-blue)' }}>AOP ($M)</th><th>Won ($M)</th><th>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td className="font-semibold">{row.label}</td>
              {visP.map(p => { const d = row.byPeriod[p] || {}; return (<><td key={`${p}-a`} style={{ borderLeft: '1px solid var(--border)' }}>{fmtM(d.tcvAOP)}</td><td key={`${p}-w`}>{fmtM(d.tcvWon)}</td><td key={`${p}-p`} style={pColor(d.achievedPct)}>{fmtP(d.achievedPct)}</td></>); })}
              <td style={{ fontWeight: 700, borderLeft: '2px solid var(--accent-blue)' }}>{fmtM(row.totals.tcvAOP)}</td>
              <td style={{ fontWeight: 700 }}>{fmtM(row.totals.tcvWon)}</td>
              <td style={pColor(row.totals.achievedPct)}>{fmtP(row.totals.achievedPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function FYPerformance() {
  const { allData, filteredData, filters } = useSalesFilters();
  const ct = useChartTheme();

  const kpis      = useMemo(() => calculateSalesKPIs(filteredData), [filteredData]);
  const fyTCV     = useMemo(() => getTCVByFY(allData, filters), [allData, filters]);
  const fyND      = useMemo(() => getNewDealByFY(allData, filters), [allData, filters]);
  const qtrTCV    = useMemo(() => getTCVByQuarter(allData, filters), [allData, filters]);
  const qtrND     = useMemo(() => getNewDealByQuarter(allData, filters), [allData, filters]);
  const clusterD  = useMemo(() => getClusterTCVPerformance(allData, filters), [allData, filters]);
  const geoD      = useMemo(() => getGeoTCVPerformance(allData, filters), [allData, filters]);

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <SalesFilterBar showQuarter={false} showFY={true} showAiNr={true} />

      {/* KPIs */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <KPICard label="TCV AOP"          value={kpis.tcvAOP}          unit="$Mn" type="primary"  />
          <KPICard label="TCV Won"          value={kpis.tcvWon}          unit="$Mn" type="primary"  />
          <KPICard label="% Achieved"       value={kpis.achievedPct}     isPct type={kpis.achievedPct >= 100 ? 'positive' : kpis.achievedPct >= 80 ? 'neutral' : 'negative'} />
          <KPICard label="TCV Pipeline"     value={kpis.tcvPipeline}     unit="$Mn" type="neutral"  />
          <KPICard label="New Deal AOP"     value={kpis.newDealAOP}      unit="$Mn" type="primary"  />
          <KPICard label="New Deal Won"     value={kpis.newDealWon}      unit="$Mn" type="primary"  />
          <KPICard label="ND % Achieved"    value={kpis.newDealPct}      isPct type={kpis.newDealPct >= 100 ? 'positive' : 'negative'} />
        </div>
      ) : <EmptyState message="No data for selected filters." />}

      {/* FY Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="FY TCV Trend ($Mn)" accent={ACC} chartMeta={SALES_FY_TCV_META} data={fyTCV} height={280}>
          <TCVBarLineChart data={fyTCV} xField="fy" barField1="tcvAOP" barLabel1="TCV AOP" barField2="tcvWon" barLabel2="TCV Won" lineField="achievedPct" lineLabel="% Achieved" barColor1={ct.colors.blue} barColor2={ct.colors.orange} lineColor={ct.colors.amber} />
        </ChartCard>
        <ChartCard title="FY New Deal TCV Trend ($Mn)" accent={ACC} chartMeta={SALES_FY_NEW_DEAL_META} data={fyND} height={280}>
          <TCVBarLineChart data={fyND} xField="fy" barField1="newDealAOP" barLabel1="ND AOP" barField2="newDealWon" barLabel2="ND Won" lineField="achievedPct" lineLabel="% Achieved ND" barColor1={ct.colors.teal} barColor2={ct.colors.violet} lineColor={ct.colors.amber} />
        </ChartCard>
      </div>

      {/* Quarterly Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Quarterly TCV Trend ($Mn)" accent={ACC} chartMeta={SALES_QTR_TCV_META} data={qtrTCV} height={280}>
          <TCVBarLineChart data={qtrTCV.slice(-12)} xField="label" barField1="tcvAOP" barLabel1="TCV AOP" barField2="tcvWon" barLabel2="TCV Won" lineField="achievedPct" lineLabel="% Achieved" barColor1={ct.colors.blue} barColor2={ct.colors.orange} lineColor={ct.colors.amber} />
        </ChartCard>
        <ChartCard title="Quarterly New Deal TCV Trend ($Mn)" accent={ACC} chartMeta={SALES_QTR_NEW_DEAL_META} data={qtrND} height={280}>
          <TCVBarLineChart data={qtrND.slice(-12)} xField="label" barField1="newDealAOP" barLabel1="ND AOP" barField2="newDealWon" barLabel2="ND Won" lineField="achievedPct" lineLabel="% Achieved ND" barColor1={ct.colors.teal} barColor2={ct.colors.violet} lineColor={ct.colors.amber} />
        </ChartCard>
      </div>

      {/* Cluster Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACC}>BG Cluster Wise TCV Performance</SectionTitle>
        <ClusterTable data={clusterD} />
      </div>

      {/* Geo Table */}
      <div className="card card-padded">
        <SectionTitle accent={ACC}>Geo Wise TCV Performance</SectionTitle>
        <GeoTable data={geoD} />
      </div>
    </div>
  );
}
