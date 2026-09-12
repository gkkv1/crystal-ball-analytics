// src/components/tables/WeeklyMatrixTable.jsx
// Week-by-week matrix table with search, CSV export, and sticky first column

import { useState, useMemo } from 'react';
import { formatNumber } from '../../utils/formatters.js';
import EmptyState from '../common/EmptyState.jsx';
import { Search, Download } from 'lucide-react';

function exportCSV(data) {
  const { weeks, rows } = data;
  const headers = ['Dimension', ...weeks, 'Total'];
  const csvRows = rows.map((r) => [
    r.label,
    ...weeks.map((w) => (r.byWeek[w] || 0).toFixed(1)),
    r.total.toFixed(1),
  ]);
  const grandRow = ['Total', ...weeks.map((w) => rows.reduce((s, r) => s + (r.byWeek[w] || 0), 0).toFixed(1)), rows.reduce((s, r) => s + r.total, 0).toFixed(1)];
  const csv = [headers, ...csvRows, grandRow].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'weekly_matrix.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function WeeklyMatrixTable({ data }) {
  const [search, setSearch] = useState('');

  if (!data?.rows?.length) return <EmptyState />;

  const { weeks, rows } = data;

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.label?.toLowerCase().includes(q));
  }, [rows, search]);

  // find max for intensity shading
  const allValues = rows.flatMap((r) => weeks.map((w) => r.byWeek[w] || 0));
  const maxVal = Math.max(...allValues, 1);

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search…"
            className="table-search pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => exportCSV(data)} className="export-btn">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 260 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 160 }}>Dimension</th>
              {weeks.map((w) => <th key={w} style={{ minWidth: 80 }}>{w}</th>)}
              <th style={{ borderLeft: '2px solid var(--border-strong)', minWidth: 90 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.label}</td>
                {weeks.map((w) => {
                  const val = row.byWeek[w] || 0;
                  const intensity = val / maxVal;
                  return (
                    <td
                      key={w}
                      className="tabular-nums text-right"
                      style={{
                        fontWeight: val > 0 ? 500 : 400,
                        color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: val > 0
                          ? `rgba(59,130,246,${0.04 + intensity * 0.1})`
                          : 'transparent',
                      }}
                    >
                      {val > 0 ? formatNumber(val) : '—'}
                    </td>
                  );
                })}
                <td
                  className="font-bold"
                  style={{ borderLeft: '2px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {formatNumber(row.total)}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="totals-row">
              <td>Total</td>
              {weeks.map((w) => {
                const wTotal = rows.reduce((s, r) => s + (r.byWeek[w] || 0), 0);
                return <td key={w}>{formatNumber(wTotal)}</td>;
              })}
              <td style={{ borderLeft: '2px solid var(--border-strong)' }}>
                {formatNumber(rows.reduce((s, r) => s + r.total, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
