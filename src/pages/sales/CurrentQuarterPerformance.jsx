// src/pages/sales/CurrentQuarterPerformance.jsx
// Tab 3: Current-quarter focus — KPIs, gauge, pipeline funnel, opportunity stage breakdown

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSalesFilters } from '../../context/SalesFilterContext.jsx';
import {
  calculateSalesKPIs, getClusterTCVPerformance, getGeoTCVPerformance, getOfferingBreakdown,
} from '../../utils/salesCalculations.js';
import { SALES_OPPORTUNITIES } from '../../data/salesData.js';
import { getFilteredOpps } from '../../utils/salesCalculations.js';
import { useChartTheme } from '../../hooks/useChartTheme.js';
import SalesFilterBar from '../../components/layout/SalesFilterBar.jsx';
import KPICard from '../../components/kpi/KPICard.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const ACC  = 'sales-accent';
const fmtM = v => (v != null ? `$${Number(v).toFixed(1)}M` : '—');
const fmtP = v => (v != null ? `${Number(v).toFixed(1)}%` : '—');

// ─── Achievement Gauge chart ─────────────────────────────────────────────
function AchievementGauge({ achievedPct, title, color }) {
  const ct = useChartTheme();
  const clampedPct = Math.min(achievedPct || 0, 150);
  const option = {
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 205, endAngle: -25,
      min: 0, max: 150,
      splitNumber: 5,
      radius: '88%',
      center: ['50%', '60%'],
      axisLine: {
        lineStyle: { width: 14, color: [[clampedPct / 150, color], [1, ct.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9']] },
      },
      pointer: { icon: 'path://M12.8,0.7l12.3,0.3L25,29.5l-12.3,0.3-0.5-16.7z', length: '56%', width: 10, offsetCenter: [0, '-40%'], itemStyle: { color } },
      axisTick:  { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { offsetCenter: [0, '-18%'], fontSize: 11, fontWeight: '600', color: ct.textSec },
      detail:    {
        offsetCenter: [0, '20%'], fontSize: 26, fontWeight: '900', color,
        formatter: v => `${Number(v).toFixed(0)}%`,
      },
      data: [{ value: clampedPct, name: title }],
    }],
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Stage Donut ─────────────────────────────────────────────────────────
function StageDonut({ opps }) {
  const ct = useChartTheme();
  if (!opps?.length) return <EmptyState />;

  const STAGE_COLORS = {
    Won: ct.colors.green, Qualified: ct.colors.blue, Scoping: ct.colors.teal,
    Proposal: ct.colors.violet, Negotiation: ct.colors.amber,
    Lost: ct.colors.red, Shelved: ct.textMuted,
  };

  const stageMap = {};
  opps.forEach(o => {
    if (!stageMap[o.salesStage]) stageMap[o.salesStage] = { name: o.salesStage, value: 0 };
    stageMap[o.salesStage].value += o.tcv;
  });
  const data = Object.values(stageMap)
    .sort((a, b) => b.value - a.value)
    .map(d => ({ ...d, value: Math.round(d.value * 10) / 10 }));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item', ...ct.tooltip,
      formatter: p => `<b>${p.name}</b>: $${Number(p.value).toFixed(1)}M (${p.percent?.toFixed(1)}%)`,
    },
    legend: { orient: 'vertical', left: 'right', top: 'center', textStyle: ct.legendText },
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['38%', '50%'],
      data: data.map(d => ({ ...d, itemStyle: { color: STAGE_COLORS[d.name] || ct.colors.indigo } })),
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, fontWeight: '600', color: ct.textSec },
      labelLine: { length: 10, length2: 14 },
    }],
    animation: true, animationDuration: 600,
  };
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

// ─── Offering mini-table ──────────────────────────────────────────────────
function OfferingTable({ data }) {
  if (!data?.length) return <EmptyState />;
  return (
    <div className="overflow-auto" style={{ maxHeight: 260 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th className="text-left" style={{ minWidth: 200 }}>Offering / Sub SP</th>
            <th>TCV Won ($M)</th>
            <th>AOP ($M)</th>
            <th>% Achieved</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 12).map(row => {
            const pct = row.pct;
            const pcol = pct >= 100 ? { color: 'var(--success)', fontWeight: 700 } : pct >= 80 ? { color: 'var(--warning)', fontWeight: 700 } : { color: 'var(--danger)', fontWeight: 700 };
            return (
              <tr key={row.subSP}>
                <td className="text-left font-semibold" style={{ color: 'var(--text-primary)' }}>{row.subSP}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmtM(row.tcvWon)}</td>
                <td>{fmtM(row.tcvAOP)}</td>
                <td style={pcol}>{fmtP(row.pct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Opportunity list table ───────────────────────────────────────────────
function OppTable({ opps }) {
  if (!opps?.length) return <EmptyState />;
  const STAGE_BADGE = {
    Won:         { bg: 'var(--success-bg)',  color: 'var(--success)'  },
    Lost:        { bg: 'var(--danger-bg)',   color: 'var(--danger)'   },
    Qualified:   { bg: '#EFF6FF',           color: '#2563EB'          },
    Scoping:     { bg: '#F0FDF4',           color: '#16A34A'          },
    Proposal:    { bg: '#FFF7ED',           color: '#EA580C'          },
    Negotiation: { bg: 'var(--warning-bg)', color: 'var(--warning)'  },
    Shelved:     { bg: '#F8FAFC',           color: '#94A3B8'          },
  };
  return (
    <div className="overflow-auto" style={{ maxHeight: 280 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th className="text-left" style={{ minWidth: 200 }}>Opportunity</th>
            <th className="text-left">Account</th>
            <th className="text-left">Sales Geo</th>
            <th>Stage</th>
            <th>TCV ($M)</th>
            <th>New/Renew</th>
            <th>AI</th>
          </tr>
        </thead>
        <tbody>
          {opps.slice(0, 20).map(o => {
            const sb = STAGE_BADGE[o.salesStage] || {};
            return (
              <tr key={o.id}>
                <td className="text-left font-semibold" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.opportunityName}</td>
                <td className="text-left">{o.accountName}</td>
                <td className="text-left">{o.salesGeo}</td>
                <td><span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: sb.bg, color: sb.color }}>{o.salesStage}</span></td>
                <td style={{ fontWeight: 700 }}>{fmtM(o.tcv)}</td>
                <td style={{ color: o.newRenew === 'New' ? 'var(--success)' : 'var(--text-sec)', fontWeight: 600 }}>{o.newRenew}</td>
                <td style={{ color: o.ai === 'Yes' ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 600 }}>{o.ai}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CurrentQuarterPerformance() {
  const { allData, filteredData, filters } = useSalesFilters();
  const ct = useChartTheme();

  const kpis      = useMemo(() => calculateSalesKPIs(filteredData), [filteredData]);
  const opps      = useMemo(() => getFilteredOpps(SALES_OPPORTUNITIES, filters), [filters]);
  const offeringD = useMemo(() => getOfferingBreakdown(allData, filters), [allData, filters]);

  const achievedPct  = kpis?.achievedPct  || 0;
  const ndAchievePct = kpis?.newDealPct   || 0;

  return (
    <div className="flex flex-col gap-5 p-5 fade-in overflow-auto">
      <SalesFilterBar showQuarter={true} showFY={true} showAiNr={true} />

      {/* KPIs */}
      {kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <KPICard label="TCV AOP"       value={kpis.tcvAOP}      unit="$Mn" type="primary" />
          <KPICard label="TCV Won"       value={kpis.tcvWon}      unit="$Mn" type="primary" />
          <KPICard label="% Achieved"    value={kpis.achievedPct} isPct type={kpis.achievedPct >= 100 ? 'positive' : 'negative'} />
          <KPICard label="Pipeline"      value={kpis.tcvPipeline} unit="$Mn" type="neutral" />
          <KPICard label="New Deal AOP"  value={kpis.newDealAOP}  unit="$Mn" type="primary" />
          <KPICard label="ND Won"        value={kpis.newDealWon}  unit="$Mn" type="primary" />
          <KPICard label="ND % Achieved" value={kpis.newDealPct}  isPct type={kpis.newDealPct >= 100 ? 'positive' : 'negative'} />
        </div>
      ) : <EmptyState />}

      {/* Gauges + Stage donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card card-padded">
          <SectionTitle accent={ACC}>TCV Achievement</SectionTitle>
          <div style={{ height: 200 }}>
            <AchievementGauge achievedPct={achievedPct} title="TCV % Achieved" color={achievedPct >= 100 ? ct.colors.green : achievedPct >= 80 ? ct.colors.amber : ct.colors.red} />
          </div>
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACC}>New Deal Achievement</SectionTitle>
          <div style={{ height: 200 }}>
            <AchievementGauge achievedPct={ndAchievePct} title="ND % Achieved" color={ndAchievePct >= 100 ? ct.colors.green : ndAchievePct >= 80 ? ct.colors.amber : ct.colors.red} />
          </div>
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Opportunity Stage Mix</SectionTitle>
          <div style={{ height: 200 }}>
            <StageDonut opps={opps} />
          </div>
        </div>
      </div>

      {/* Offering table + Opportunity list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card card-padded">
          <SectionTitle accent={ACC}>TCV by Offering / Sub SP</SectionTitle>
          <OfferingTable data={offeringD} />
        </div>
        <div className="card card-padded">
          <SectionTitle accent={ACC}>Opportunity Details ({opps.length})</SectionTitle>
          <OppTable opps={opps} />
        </div>
      </div>
    </div>
  );
}
