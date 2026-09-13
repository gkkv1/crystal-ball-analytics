// src/pages/finance/RealizationBta.jsx
// Finance Tab 2: Yearly/Quarterly Realization & BTA trends + dimensional tables

import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useFinanceFilters } from '../../context/FinanceFilterContext.jsx';
import {
  calculateFinanceKPIs,
  getYearlyRealizationTrend,
  getYearlyBTATrend,
  getQuarterlyRealizationTrend,
  getQuarterlyBTATrend,
  getClusterBTA,
  getGeoBTA,
  getSubUnitBTA,
  getClusterRealization,
  getGeoRealization,
  getSubUnitRealization,
} from '../../utils/financeCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import FinanceFilterBar from '../../components/layout/FinanceFilterBar.jsx';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Download } from 'lucide-react';
import ChartCard from '../../components/customReport/ChartCard.jsx';
import {
  FINANCE_YEARLY_REALIZ_META,
  FINANCE_YEARLY_BTA_META,
  FINANCE_QTR_REALIZ_META,
  FINANCE_QTR_BTA_META,
} from '../../components/customReport/metadata/financeMeta.js';

const ACCENT = 'finance-bta-accent';
const FYS    = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const fmt    = (v, d = 1) => (v != null ? Number(v).toFixed(d) : '—');

// ─── Yearly Realization grouped bar ──────────────────────────────────────
function YearlyRealizChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;margin-bottom:5px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach((p) => {
          if (p.value == null) return;
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${fmt(p.value)}</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid:   { top: 36, right: 20, bottom: 36, left: 55 },
    xAxis: {
      type: 'category', data: data.map((d) => d.fy),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value', min: 0,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: ct.axisLabel,
    },
    series: [
      {
        name: 'Offshore Realization', type: 'bar', barMaxWidth: 40,
        data: data.map((d) => d.offshoreRealization),
        itemStyle: { color: ct.colors.blue, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.blue, formatter: (p) => fmt(p.value) },
      },
      {
        name: 'Onsite Realization', type: 'bar', barMaxWidth: 40,
        data: data.map((d) => d.onsiteRealization),
        itemStyle: { color: ct.colors.teal, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.teal, formatter: (p) => fmt(p.value) },
      },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Yearly BTA grouped bar ───────────────────────────────────────────────
function YearlyBTAChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;margin-bottom:5px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach((p) => {
          if (p.value == null) return;
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${fmt(p.value)}%</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid:   { top: 36, right: 20, bottom: 36, left: 60 },
    xAxis: {
      type: 'category', data: data.map((d) => d.fy),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, fontWeight: '700' },
    },
    yAxis: {
      type: 'value', min: 88, max: 108,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => `${v}%` },
    },
    series: [
      {
        name: 'Offshore BTA', type: 'bar', barMaxWidth: 36,
        data: data.map((d) => d.offshoreBTA),
        itemStyle: { color: ct.colors.blue, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.blue, formatter: (p) => `${fmt(p.value)}%` },
      },
      {
        name: 'Onsite BTA', type: 'bar', barMaxWidth: 36,
        data: data.map((d) => d.onsiteBTA),
        itemStyle: { color: ct.colors.teal, borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.teal, formatter: (p) => `${fmt(p.value)}%` },
      },
      {
        name: 'Adjusted BTA', type: 'line', smooth: true,
        data: data.map((d) => d.adjustedBTA),
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: ct.colors.amber, width: 2.5 },
        itemStyle: { color: ct.colors.amber, borderWidth: 2, borderColor: ct.bg },
        label: { show: true, position: 'top', fontSize: 10, fontWeight: '700', color: ct.colors.amber, formatter: (p) => `${fmt(p.value)}%` },
      },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Quarterly Realization grouped bar ───────────────────────────────────
function QuarterlyRealizChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', ...ct.tooltip },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid:   { top: 36, right: 20, bottom: 44, left: 55 },
    xAxis: {
      type: 'category', data: data.map((d) => d.label),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value', min: 55,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle }, axisLabel: ct.axisLabel,
    },
    series: [
      {
        name: 'Offshore Realization', type: 'bar', barMaxWidth: 20,
        data: data.map((d) => d.offshoreRealization),
        itemStyle: { color: ct.colors.blue, borderRadius: [2, 2, 0, 0] },
      },
      {
        name: 'Onsite Realization', type: 'bar', barMaxWidth: 20,
        data: data.map((d) => d.onsiteRealization),
        itemStyle: { color: ct.colors.teal, borderRadius: [2, 2, 0, 0] },
      },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Quarterly BTA multi-line chart ──────────────────────────────────────
function QuarterlyBTAChart({ data }) {
  const ct = useChartTheme();
  if (!data?.length) return <EmptyState />;
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', ...ct.tooltip,
      formatter(params) {
        let html = `<div style="font-weight:700;margin-bottom:5px;color:${ct.textPrimary}">${params[0]?.axisValue}</div>`;
        params.forEach((p) => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:5px"></span>`;
          html += `<div style="font-size:12px;color:${ct.textSec}">${dot}${p.seriesName}: <b style="color:${ct.textPrimary}">${fmt(p.value)}%</b></div>`;
        });
        return html;
      },
    },
    legend: { top: 0, right: 0, textStyle: ct.legendText },
    grid:   { top: 36, right: 20, bottom: 44, left: 60 },
    xAxis: {
      type: 'category', data: data.map((d) => d.label),
      axisLine: ct.axisLine, axisTick: { show: false },
      axisLabel: { ...ct.axisLabel, rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value', min: 88, max: 110,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: ct.splitLineStyle },
      axisLabel: { ...ct.axisLabel, formatter: (v) => `${v}%` },
    },
    series: [
      {
        name: 'Offshore Adj BTA', type: 'line', smooth: true,
        data: data.map((d) => d.offshoreBTA),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: ct.colors.blue, width: 2 },
        itemStyle: { color: ct.colors.blue },
      },
      {
        name: 'Onsite Adj BTA', type: 'line', smooth: true,
        data: data.map((d) => d.onsiteBTA),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: ct.colors.teal, width: 2 },
        itemStyle: { color: ct.colors.teal },
      },
      {
        name: 'Cluster Adjusted BTA', type: 'line', smooth: true,
        data: data.map((d) => d.adjustedBTA),
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: ct.colors.amber, width: 2.5, type: 'dashed' },
        itemStyle: { color: ct.colors.amber },
      },
    ],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Generic BTA table ────────────────────────────────────────────────────
function BTATable({ data, title, filename }) {
  if (!data?.length) return <EmptyState />;
  function exportCSV() {
    const headers = ['Dimension', ...FYS.flatMap((fy) => [`${fy} Offshore BTA`, `${fy} Onsite BTA`, `${fy} Adj BTA`])];
    const rows = data.map((r) => [r.label, ...FYS.flatMap((fy) => {
      const d = r.byFY[fy] || {};
      return [d.offshoreBTA?.toFixed(1) || '—', d.onsiteBTA?.toFixed(1) || '—', d.adjustedBTA?.toFixed(1) || '—'];
    })]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  const btaColor = (v) => {
    if (v == null) return {};
    if (v >= 100) return { color: 'var(--success)', fontWeight: 700 };
    if (v >= 95)  return { color: 'var(--warning)', fontWeight: 700 };
    return { color: 'var(--danger)', fontWeight: 700 };
  };
  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{data.length} rows</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />CSV</button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 260 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>Dimension</th>
              {FYS.map((fy) => (
                <th key={fy} colSpan={3} style={{ textAlign: 'center', minWidth: 210, borderLeft: '1px solid var(--border)' }}>
                  {fy}
                </th>
              ))}
            </tr>
            <tr>
              <th />
              {FYS.map((fy) => (
                <>
                  <th key={`${fy}-off`} style={{ minWidth: 75, borderLeft: '1px solid var(--border)' }}>Offshore</th>
                  <th key={`${fy}-on`}  style={{ minWidth: 65 }}>Onsite</th>
                  <th key={`${fy}-adj`} style={{ minWidth: 60 }}>Adj BTA</th>
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
                      <td key={`${fy}-off`} style={{ ...btaColor(d.offshoreBTA), borderLeft: '1px solid var(--border)' }}>
                        {d.offshoreBTA != null ? `${fmt(d.offshoreBTA)}%` : '—'}
                      </td>
                      <td key={`${fy}-on`} style={btaColor(d.onsiteBTA)}>
                        {d.onsiteBTA != null ? `${fmt(d.onsiteBTA)}%` : '—'}
                      </td>
                      <td key={`${fy}-adj`} style={btaColor(d.adjustedBTA)}>
                        {d.adjustedBTA != null ? `${fmt(d.adjustedBTA)}%` : '—'}
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

// ─── Generic Realization table ────────────────────────────────────────────
function RealizationTable({ data, filename }) {
  if (!data?.length) return <EmptyState />;
  function exportCSV() {
    const headers = ['Dimension', ...FYS.flatMap((fy) => [`${fy} Offshore`, `${fy} Onsite`])];
    const rows = data.map((r) => [r.label, ...FYS.flatMap((fy) => {
      const d = r.byFY[fy] || {};
      return [d.offshoreRealization?.toFixed(1) || '—', d.onsiteRealization?.toFixed(1) || '—'];
    })]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div>
      <div className="table-toolbar">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{data.length} rows</span>
        <button onClick={exportCSV} className="export-btn"><Download className="w-3.5 h-3.5" />CSV</button>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 240 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 150 }}>Dimension</th>
              {FYS.map((fy) => (
                <th key={fy} colSpan={2} style={{ textAlign: 'center', minWidth: 140, borderLeft: '1px solid var(--border)' }}>{fy}</th>
              ))}
            </tr>
            <tr>
              <th />
              {FYS.map((fy) => (
                <>
                  <th key={`${fy}-off`} style={{ minWidth: 75, borderLeft: '1px solid var(--border)' }}>Offshore</th>
                  <th key={`${fy}-on`}  style={{ minWidth: 65 }}>Onsite</th>
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
                      <td key={`${fy}-off`} style={{ fontWeight: 600, color: 'var(--text-primary)', borderLeft: '1px solid var(--border)' }}>
                        {d.offshoreRealization != null ? fmt(d.offshoreRealization) : '—'}
                      </td>
                      <td key={`${fy}-on`} style={{ color: 'var(--text-sec)' }}>
                        {d.onsiteRealization != null ? fmt(d.onsiteRealization) : '—'}
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

// ─── Segmented table selector ─────────────────────────────────────────────
const TABLE_SEGMENTS = ['Cluster', 'Geo', 'Sub Unit'];

// ─── Main Page ────────────────────────────────────────────────────────────
export default function RealizationBta() {
  const { allData, filteredData, filters } = useFinanceFilters();
  const [btaSegment,    setBTASegment]    = useState('Cluster');
  const [realizSegment, setRealizSegment] = useState('Cluster');

  const kpis          = useMemo(() => calculateFinanceKPIs(filteredData),              [filteredData]);
  const yearlyRealiz  = useMemo(() => getYearlyRealizationTrend(allData, filters),    [allData, filters]);
  const yearlyBTA     = useMemo(() => getYearlyBTATrend(allData, filters),             [allData, filters]);
  const qtrRealiz     = useMemo(() => getQuarterlyRealizationTrend(allData, filters), [allData, filters]);
  const qtrBTA        = useMemo(() => getQuarterlyBTATrend(allData, filters),          [allData, filters]);

  const clusterBTAData  = useMemo(() => getClusterBTA(allData, filters),       [allData, filters]);
  const geoBTAData      = useMemo(() => getGeoBTA(allData, filters),           [allData, filters]);
  const suBTAData       = useMemo(() => getSubUnitBTA(allData, filters),       [allData, filters]);
  const clusterRealiz   = useMemo(() => getClusterRealization(allData, filters), [allData, filters]);
  const geoRealiz       = useMemo(() => getGeoRealization(allData, filters),   [allData, filters]);
  const suRealiz        = useMemo(() => getSubUnitRealization(allData, filters), [allData, filters]);

  const btaTableData    = btaSegment    === 'Cluster' ? clusterBTAData  : btaSegment    === 'Geo' ? geoBTAData  : suBTAData;
  const realizTableData = realizSegment === 'Cluster' ? clusterRealiz   : realizSegment === 'Geo' ? geoRealiz   : suRealiz;

  function SegmentPills({ value, onChange }) {
    return (
      <div className="pill-group">
        {TABLE_SEGMENTS.map((s) => (
          <button key={s} className={`pill ${value === s ? 'active' : ''}`} onClick={() => onChange(s)}>
            {s}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <FinanceFilterBar showQuarter={true} showFY={true} />

      {/* KPI Row */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPICard label="Offshore Realization" value={kpis.offshoreRealizAvg}  type="primary" size="md" />
          <KPICard label="Onsite Realization"   value={kpis.onsiteRealizAvg}    type="primary" size="md" />
          <KPICard label="Offshore BTA"         value={kpis.offshoreBTAAvg}    isPct
            type={kpis.offshoreBTAAvg >= 100 ? 'positive' : 'negative'} />
          <KPICard label="Onsite BTA"           value={kpis.onsiteBTAAvg}      isPct
            type={kpis.onsiteBTAAvg >= 100 ? 'positive' : 'negative'} />
          <KPICard label="Adjusted BTA"         value={kpis.adjustedBTAAvg}    isPct
            type={kpis.adjustedBTAAvg >= 100 ? 'positive' : 'negative'} />
        </div>
      ) : <EmptyState message="No data for selected filters." />}

      {/* Yearly charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Yearly Realization Trend" accent={ACCENT} chartMeta={FINANCE_YEARLY_REALIZ_META} data={yearlyRealiz} height={260}>
          <YearlyRealizChart data={yearlyRealiz} />
        </ChartCard>
        <ChartCard title="Yearly BTA Trend" accent={ACCENT} chartMeta={FINANCE_YEARLY_BTA_META} data={yearlyBTA} height={260}>
          <YearlyBTAChart data={yearlyBTA} />
        </ChartCard>
      </div>

      {/* Quarterly charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Quarterly Realization Trend" accent={ACCENT} chartMeta={FINANCE_QTR_REALIZ_META} data={qtrRealiz} height={280}>
          <QuarterlyRealizChart data={qtrRealiz} />
        </ChartCard>
        <ChartCard title="Quarterly Adjusted BTA Trend" accent={ACCENT} chartMeta={FINANCE_QTR_BTA_META} data={qtrBTA} height={280}>
          <QuarterlyBTAChart data={qtrBTA} />
        </ChartCard>
      </div>

      {/* BTA Tables with segment control */}
      <div className="card card-padded">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <SectionTitle accent={ACCENT} noMargin>BTA Analysis</SectionTitle>
          <SegmentPills value={btaSegment} onChange={setBTASegment} />
        </div>
        <BTATable
          data={btaTableData}
          title={`${btaSegment} Wise BTA`}
          filename={`${btaSegment.toLowerCase()}_bta.csv`}
        />
      </div>

      {/* Realization Tables with segment control */}
      <div className="card card-padded">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <SectionTitle accent={ACCENT} noMargin>Realization Analysis</SectionTitle>
          <SegmentPills value={realizSegment} onChange={setRealizSegment} />
        </div>
        <RealizationTable
          data={realizTableData}
          filename={`${realizSegment.toLowerCase()}_realization.csv`}
        />
      </div>
    </div>
  );
}
