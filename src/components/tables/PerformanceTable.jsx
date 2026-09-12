// src/components/tables/PerformanceTable.jsx
// Enhanced multi-year/quarter analytical table with:
//   - In-table instant search
//   - CSV export
//   - In-cell AOP% progress bars
//   - Sticky first column
//   - Alternating rows + hover
//   - Period header color accents

import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import { formatNumber, formatPct, getDeltaClass } from '../../utils/formatters.js';
import EmptyState from '../common/EmptyState.jsx';
import clsx from 'clsx';

// mini bar colors
function aopBarColor(pct) {
  if (pct == null) return '#94A3B8';
  if (pct >= 100) return '#10B981';
  if (pct >= 85)  return '#F59E0B';
  return '#EF4444';
}

function MiniBar({ pct }) {
  if (pct == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const filled = Math.min(Math.max(pct, 0), 150); // cap visual at 150%
  const pctWidth = Math.min((filled / 150) * 100, 100);
  const color = aopBarColor(pct);
  return (
    <div className="mini-bar-wrap">
      <span className="font-bold tabular-nums" style={{ color, fontSize: '0.8rem' }}>
        {formatPct(pct)}
      </span>
      <div className="mini-bar-track">
        <div
          className="mini-bar-fill"
          style={{ width: `${pctWidth}%`, background: color }}
        />
      </div>
    </div>
  );
}

function exportCSV(data, periods, mode, periodKey) {
  const growthKey = mode === 'annual' ? 'yoyPct' : 'qoqPct';
  const growthLabel = mode === 'annual' ? 'YoY%' : 'QoQ%';
  const headers = ['Dimension', ...periods.flatMap((p) => [
    `${p} AOP`, `${p} Actual`, `${p} AOP%`, `${p} ${growthLabel}`
  ])];
  const rows = data.map((row) => [
    row.label,
    ...periods.flatMap((p) => {
      const d = row[periodKey]?.[p] || {};
      return [
        (d.aop || 0).toFixed(1),
        (d.actual || 0).toFixed(1),
        d.aopPct != null ? d.aopPct.toFixed(1) : '',
        d[growthKey] != null ? d[growthKey].toFixed(1) : '',
      ];
    })
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `performance_${mode}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// period → CSS class for header accent
const PERIOD_ACCENT = {
  FY23: 'th-fy23', FY24: 'th-fy24', FY25: 'th-fy25', FY26: 'th-fy26', FY27: 'th-fy27',
  Q1: 'th-q1', Q2: 'th-q2', Q3: 'th-q3', Q4: 'th-q4',
};

// mode: 'annual' | 'quarterly'
export default function PerformanceTable({ data, mode = 'annual', periods, accentClass = '' }) {
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');

  const PERIODS = periods || (mode === 'annual'
    ? ['FY23', 'FY24', 'FY25', 'FY26', 'FY27']
    : ['Q1', 'Q2', 'Q3', 'Q4']);

  const periodKey = mode === 'annual' ? 'byFY' : 'byQ';

  function handleSort(field) {
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) => r.label?.toLowerCase().includes(q));
  }, [data, search]);

  const sortedData = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const [period, metric] = sortField.split('__');
      const aVal = a[periodKey]?.[period]?.[metric] ?? -Infinity;
      const bVal = b[periodKey]?.[period]?.[metric] ?? -Infinity;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filtered, sortField, sortDir, periodKey]);

  const handleExport = useCallback(() => {
    exportCSV(data, PERIODS, mode, periodKey);
  }, [data, PERIODS, mode, periodKey]);

  if (!data?.length) return <EmptyState />;

  // Totals
  const totals = {};
  PERIODS.forEach((p) => {
    totals[p] = {
      actual: data.reduce((s, r) => s + (r[periodKey]?.[p]?.actual || 0), 0),
      aop:    data.reduce((s, r) => s + (r[periodKey]?.[p]?.aop || 0), 0),
    };
    if (totals[p].aop > 0) totals[p].aopPct = (totals[p].actual / totals[p].aop) * 100;
  });

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30 inline" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 inline" style={{ color: 'var(--accent-blue)' }} />
      : <ChevronUp className="w-3 h-3 inline" style={{ color: 'var(--accent-blue)' }} />;
  }

  function GrowthCell({ value }) {
    if (value === null || value === undefined)
      return <td className="data-table td" style={{ color: 'var(--text-muted)' }}>—</td>;
    return (
      <td className={clsx('data-table td font-bold tabular-nums', getDeltaClass(value))}>
        {value >= 0 ? '+' : ''}{formatPct(value)}
      </td>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search dimension…"
            className="table-search pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={handleExport} className="export-btn">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 300 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" rowSpan={2} style={{ width: 160, minWidth: 140 }}>Dimension</th>
              {PERIODS.map((p) => (
                <th
                  key={p}
                  colSpan={4}
                  className={clsx('text-center', PERIOD_ACCENT[p])}
                  style={{ borderLeft: '2px solid var(--border-strong)' }}
                >
                  {p}
                </th>
              ))}
            </tr>
            <tr>
              {PERIODS.map((p) => (
                <>
                  <th key={`${p}-aop`}
                    onClick={() => handleSort(`${p}__aop`)}
                    className="cursor-pointer select-none"
                    style={{ borderLeft: '2px solid var(--border-strong)' }}
                  >
                    <div className="flex items-center justify-end gap-1">AOP <SortIcon field={`${p}__aop`} /></div>
                  </th>
                  <th key={`${p}-actual`}
                    onClick={() => handleSort(`${p}__actual`)}
                    className="cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-end gap-1">Rev/Proj <SortIcon field={`${p}__actual`} /></div>
                  </th>
                  <th key={`${p}-aopPct`}
                    onClick={() => handleSort(`${p}__aopPct`)}
                    className="cursor-pointer select-none"
                    style={{ minWidth: 100 }}
                  >
                    <div className="flex items-center justify-end gap-1">AOP% <SortIcon field={`${p}__aopPct`} /></div>
                  </th>
                  <th key={`${p}-growth`}
                    onClick={() => handleSort(mode === 'annual' ? `${p}__yoyPct` : `${p}__qoqPct`)}
                    className="cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      {mode === 'annual' ? 'YoY%' : 'QoQ%'}
                      <SortIcon field={mode === 'annual' ? `${p}__yoyPct` : `${p}__qoqPct`} />
                    </div>
                  </th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                {PERIODS.map((p) => {
                  const d = row[periodKey]?.[p] || {};
                  const growthVal = mode === 'annual' ? d.yoyPct : d.qoqPct;
                  return (
                    <>
                      <td key={`${p}-aop`} style={{ borderLeft: '2px solid var(--border-subtle)' }}>
                        {formatNumber(d.aop)}
                      </td>
                      <td key={`${p}-actual`} className="font-semibold">
                        {formatNumber(d.actual)}
                      </td>
                      <td key={`${p}-aopPct`}>
                        <MiniBar pct={d.aopPct} />
                      </td>
                      <GrowthCell key={`${p}-growth`} value={growthVal} />
                    </>
                  );
                })}
              </tr>
            ))}

            {/* Totals row */}
            <tr className="totals-row">
              <td>Total</td>
              {PERIODS.map((p) => (
                <>
                  <td key={`${p}-aop`} style={{ borderLeft: '2px solid var(--border-strong)' }}>
                    {formatNumber(totals[p].aop)}
                  </td>
                  <td key={`${p}-actual`}>{formatNumber(totals[p].actual)}</td>
                  <td key={`${p}-aopPct`}>
                    <MiniBar pct={totals[p].aopPct} />
                  </td>
                  <td key={`${p}-growth`} style={{ color: 'var(--text-muted)' }}>—</td>
                </>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
