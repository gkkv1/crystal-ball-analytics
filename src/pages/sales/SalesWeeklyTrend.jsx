// src/pages/sales/SalesWeeklyTrend.jsx
// Tab 4: Weekly TCV trend analysis (Sales-specific — distinct from Revenue's WeeklyTrendAnalysis)

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSalesFilters } from '../../context/SalesFilterContext.jsx';
import { calculateSalesKPIs, getWeeklyTrend } from '../../utils/salesCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import SalesFilterBar from '../../components/layout/SalesFilterBar.jsx';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Download } from 'lucide-react';

const ACC = 'sales-accent';
const fmtM = v => (v != null ? `$${Number(v).toFixed(2)}M` : '—');
const fmtP = v => (v != null ? `${Number(v).toFixed(1)}%` : '—');

// ─── Weekly Cumulative chart ─────────────────────────────────────────────
function WeeklyCumulativeChart({ data }) {
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
          const v = p.seriesName.includes('%') ? `${Number(p.value).toFixed(1)}%` : `$${Number(p.value).toFixed(2)}M`;
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${v}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 44, right: 68, bottom: 44, left: 68 },
    xAxis: { type: 'category', data: data.map(d => d.week), axisLine: ct.axisLine, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, rotate: 40, fontSize: 10 } },
    yAxis: [
      { type: 'value', name: 'TCV ($Mn)', nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
      { type: 'value', name: '% Achieved', min: 0, max: 120, nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { ...ct.axisLabel, formatter: v => `${v}%` } },
    ],
    series: [
      { name: 'Cumulative TCV Won', type: 'line', yAxisIndex: 0, smooth: true, data: data.map(d => d.cumulativeWon), symbol: 'circle', symbolSize: 6, lineStyle: { color: ct.colors.blue, width: 2.5 }, itemStyle: { color: ct.colors.blue }, areaStyle: { color: `${ct.colors.blue}18` } },
      { name: 'TCV AOP Cumulative', type: 'line', yAxisIndex: 0, smooth: false, data: data.map(d => d.tcvAOP), symbol: 'none', lineStyle: { color: ct.colors.orange, width: 2, type: 'dashed' }, itemStyle: { color: ct.colors.orange } },
      { name: '% Achieved (Weekly)', type: 'line', yAxisIndex: 1, smooth: true, data: data.map(d => d.achievedPct), symbol: 'circle', symbolSize: 5, lineStyle: { color: ct.colors.amber, width: 2 }, itemStyle: { color: ct.colors.amber } },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Weekly bar chart (weekly increment) ─────────────────────────────────
function WeeklyIncrementChart({ data }) {
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
          html += `<div style="font-size:11px;color:${ct.textSec}">${dot}${p.seriesName}: <b>$${Number(p.value).toFixed(2)}M</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid: { top: 40, right: 20, bottom: 44, left: 68 },
    xAxis: { type: 'category', data: data.map(d => d.week), axisLine: ct.axisLine, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, rotate: 40, fontSize: 10 } },
    yAxis: { type: 'value', name: 'Weekly TCV ($Mn)', nameTextStyle: { color: ct.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
    series: [
      { name: 'Weekly TCV Won', type: 'bar', data: data.map(d => d.weeklyWon), barMaxWidth: 28, itemStyle: { color: (p) => p.value >= 0 ? ct.colors.blue : ct.colors.red, borderRadius: [4, 4, 0, 0] } },
      { name: 'Weekly New Deal', type: 'bar', data: data.map(d => d.newDealWeeklyWon), barMaxWidth: 28, itemStyle: { color: ct.colors.teal, borderRadius: [4, 4, 0, 0] } },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Pipeline Remaining trend ─────────────────────────────────────────────
function PipelineRemainingChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...ct.tooltip },
    grid: { top: 24, right: 20, bottom: 44, left: 68 },
    xAxis: { type: 'category', data: data.map(d => d.week), axisLine: ct.axisLine, axisTick: { show: false }, axisLabel: { ...ct.axisLabel, rotate: 40, fontSize: 10 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: { ...ct.axisLabel, formatter: v => `$${v}` } },
    series: [{
      name: 'Pipeline Remaining', type: 'line', smooth: true,
      data: data.map(d => d.pipelineRemaining),
      lineStyle: { color: ct.colors.violet, width: 2 },
      itemStyle: { color: ct.colors.violet },
      areaStyle: { color: `${ct.colors.violet}18` },
      symbol: 'circle', symbolSize: 5,
    }],
    animation: true,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Weekly table ─────────────────────────────────────────────────────────
function WeeklyTable({ data }) {
  if (!data?.length) return <EmptyState />;
  function exportCSV() {
    const h = ['Week', 'Weekly Won ($M)', 'Cumulative Won ($M)', 'TCV AOP Cum ($M)', '% Achieved', 'New Deal Weekly', 'Pipeline Remaining'];
    const r = data.map(d => [d.week, d.weeklyWon, d.cumulativeWon, d.tcvAOP, d.achievedPct, d.newDealWeeklyWon, d.pipelineRemaining]);
    const csv = [h, ...r].map(x => x.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'weekly_trend.csv'; a.click();
  }
  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>13 weeks</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />CSV</button>
      </div>
      <div className="overflow-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Weekly Won ($M)</th>
              <th>Cumulative Won ($M)</th>
              <th>AOP Cumulative ($M)</th>
              <th>% Achieved</th>
              <th>ND Weekly ($M)</th>
              <th>Pipeline Rem. ($M)</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => {
              const pCol = d.achievedPct >= 100 ? { color: 'var(--success)', fontWeight: 700 } : d.achievedPct >= 80 ? { color: 'var(--warning)', fontWeight: 700 } : { color: 'var(--danger)', fontWeight: 700 };
              return (
                <tr key={d.week}>
                  <td style={{ fontWeight: 700 }}>{d.week}</td>
                  <td>{fmtM(d.weeklyWon)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmtM(d.cumulativeWon)}</td>
                  <td>{fmtM(d.tcvAOP)}</td>
                  <td style={pCol}>{fmtP(d.achievedPct)}</td>
                  <td>{fmtM(d.newDealWeeklyWon)}</td>
                  <td>{fmtM(d.pipelineRemaining)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function SalesWeeklyTrend() {
  const { allData, filteredData, filters } = useSalesFilters();

  const kpis   = useMemo(() => calculateSalesKPIs(filteredData), [filteredData]);
  const weekly = useMemo(() => getWeeklyTrend(allData, filters), [allData, filters]);

  const lastWeek = weekly[weekly.length - 1] || {};

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <SalesFilterBar showQuarter={true} showFY={true} showAiNr={false} />

      {/* KPIs */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <KPICard label="Qtr TCV AOP"       value={kpis.tcvAOP}              unit="$Mn" type="primary" />
          <KPICard label="Qtr TCV Won"        value={kpis.tcvWon}              unit="$Mn" type="primary" />
          <KPICard label="% Achieved to Date" value={lastWeek.achievedPct}     isPct type={lastWeek.achievedPct >= 100 ? 'positive' : 'negative'} />
          <KPICard label="Qtr ND AOP"         value={kpis.newDealAOP}          unit="$Mn" type="primary" />
          <KPICard label="ND Won to Date"     value={kpis.newDealWon}          unit="$Mn" type="primary" />
        </div>
      ) : <EmptyState />}

      {/* Cumulative trend */}
      <div className="card card-padded">
        <SectionTitle accent={ACC}>Weekly Cumulative TCV vs AOP ($Mn)</SectionTitle>
        <div style={{ height: 300 }}>
          <WeeklyCumulativeChart data={weekly} />
        </div>
      </div>

      {/* Weekly increment + pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Weekly TCV Won (Incremental) ($Mn)</SectionTitle>
          <div style={{ height: 260 }}>
            <WeeklyIncrementChart data={weekly} />
          </div>
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Pipeline Remaining ($Mn)</SectionTitle>
          <div style={{ height: 260 }}>
            <PipelineRemainingChart data={weekly} />
          </div>
        </div>
      </div>

      {/* Weekly detail table */}
      <div className="card card-padded">
        <SectionTitle accent={ACC}>Weekly Performance Detail</SectionTitle>
        <WeeklyTable data={weekly} />
      </div>
    </div>
  );
}
