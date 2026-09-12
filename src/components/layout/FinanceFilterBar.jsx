// src/components/layout/FinanceFilterBar.jsx
// Identical in structure and design to FilterBar.jsx
// but consumes FinanceFilterContext instead of DashboardFilterContext

import { RotateCcw, Filter } from 'lucide-react';
import { useFinanceFilters } from '../../context/FinanceFilterContext.jsx';
import clsx from 'clsx';

const FISCAL_YEARS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS     = ['Q1',  'Q2',  'Q3',  'Q4'];

function SelectFilter({ label, field, options }) {
  const { filters, setFilter } = useFinanceFilters();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">{label}</label>
      <select
        className="filter-select"
        value={filters[field]}
        onChange={(e) => setFilter(field, e.target.value)}
        aria-label={label}
      >
        <option value="All">All</option>
        {options.map((opt) => (
          <option
            key={typeof opt === 'object' ? opt.id : opt}
            value={typeof opt === 'object' ? opt.id : opt}
          >
            {typeof opt === 'object' ? opt.label : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function PillFilter({ label, field, options }) {
  const { filters, setFilter } = useFinanceFilters();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="pill-group">
        <button
          className={clsx('pill', { active: filters[field] === 'All' })}
          onClick={() => setFilter(field, 'All')}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            className={clsx('pill', { active: filters[field] === opt })}
            onClick={() => setFilter(field, opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FinanceFilterBar({ showQuarter = true, showFY = true }) {
  const { availableOptions, filterSummary, hasActiveFilters, resetFilters } = useFinanceFilters();

  const cap = (id) => id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const bgOptions     = availableOptions.bgCluster.map((id) => ({ id, label: cap(id) }));
  const bgGroupOptions = availableOptions.bg.map((id)       => ({ id, label: cap(id) }));
  const suOptions     = availableOptions.subUnit.map((id)   => ({ id, label: cap(id) }));
  const geoOptions    = availableOptions.geo;
  const clientOptions = availableOptions.groupClient;

  return (
    <div className="filter-bar bg-white border-b border-slate-200 px-6 py-3 shrink-0">
      <div className="flex items-end gap-4 flex-wrap">
        <SelectFilter label="BG Cluster"   field="bgCluster"   options={bgOptions}      />
        <SelectFilter label="BG"           field="bg"          options={bgGroupOptions}  />
        <SelectFilter label="Sub Unit"     field="subUnit"     options={suOptions}       />
        <SelectFilter label="Geo"          field="geo"         options={geoOptions}      />
        <SelectFilter label="Group Client" field="groupClient" options={clientOptions}   />

        <div className="h-10 w-px bg-slate-200 self-end hidden lg:block" />

        {showFY && (
          <PillFilter label="Fiscal Year" field="fiscalYear" options={FISCAL_YEARS} />
        )}
        {showQuarter && (
          <PillFilter label="Quarter" field="quarter" options={QUARTERS} />
        )}

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
            Reset Filters
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
