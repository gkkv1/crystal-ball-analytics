// src/components/tables/GapMatrixTable.jsx
// Revenue Gap With Target — Cluster × Product matrix with conditional heatmap shading

import { useState, useMemo } from 'react';
import { formatGap } from '../../utils/formatters.js';
import EmptyState from '../common/EmptyState.jsx';
import { Search, Download } from 'lucide-react';

function GapCell({ value }) {
  const isEmpty = value === 0;
  if (isEmpty) {
    return (
      <td className="tabular-nums text-center" style={{ color: 'var(--text-muted)', padding: '8px 12px' }}>—</td>
    );
  }
  const isPos = value > 0;
  return (
    <td style={{ padding: '6px 10px', textAlign: 'right' }}>
      <span
        className={isPos ? 'gap-cell-pos' : 'gap-cell-neg'}
        style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: 6,
          fontSize: '0.78rem',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          width: '100%',
          textAlign: 'right',
        }}
      >
        {formatGap(value)}
      </span>
    </td>
  );
}

function exportCSV(data, products) {
  const headers = ['Cluster', ...products, 'Total Gap'];
  const rows = data.rows.map((r) => [
    r.cluster,
    ...products.map((p) => (r.gaps[p] || 0).toFixed(1)),
    r.totalGap.toFixed(1),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'gap_matrix.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function GapMatrixTable({ data }) {
  const [search, setSearch] = useState('');

  if (!data?.rows?.length) return <EmptyState />;

  const { products, rows } = data;

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.cluster?.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div>
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search cluster…"
            className="table-search pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => exportCSV(data, products)}
          className="export-btn"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 220 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-left" style={{ minWidth: 180 }}>Cluster</th>
              {products.map((p) => <th key={p} style={{ minWidth: 100 }}>{p}</th>)}
              <th style={{ borderLeft: '2px solid var(--border-strong)', minWidth: 110 }}>Total Gap</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.cluster}>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{row.cluster}</td>
                {products.map((p) => (
                  <GapCell key={p} value={row.gaps[p] || 0} />
                ))}
                <td style={{ borderLeft: '2px solid var(--border-subtle)', padding: '6px 10px', textAlign: 'right' }}>
                  <span
                    className={row.totalGap >= 0 ? 'gap-cell-pos' : 'gap-cell-neg'}
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {formatGap(row.totalGap)}
                  </span>
                </td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="totals-row">
              <td>Total</td>
              {products.map((p) => {
                const total = rows.reduce((s, r) => s + (r.gaps[p] || 0), 0);
                return <GapCell key={p} value={total} />;
              })}
              <td style={{ borderLeft: '2px solid var(--border-strong)', padding: '6px 10px', textAlign: 'right' }}>
                <span
                  className={rows.reduce((s, r) => s + r.totalGap, 0) >= 0 ? 'gap-cell-pos' : 'gap-cell-neg'}
                  style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}
                >
                  {formatGap(rows.reduce((s, r) => s + r.totalGap, 0))}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
