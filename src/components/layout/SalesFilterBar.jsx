// src/components/layout/SalesFilterBar.jsx
// Filter bar for Sales module — same design as FilterBar / FinanceFilterBar

import { RotateCcw, Filter } from 'lucide-react';
import { useSalesFilters } from '../../context/SalesFilterContext.jsx';
import clsx from 'clsx';

const FISCAL_YEARS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27'];
const QUARTERS     = ['Q1', 'Q2', 'Q3', 'Q4'];
const AI_OPTIONS   = ['Yes', 'No'];
const NR_OPTIONS   = ['New', 'Renew'];

function SelectFilter({ label, field, options }) {
  const { filters, setFilter } = useSalesFilters();
  const val = filters[field];
  return (
    <div className="flex flex-col gap-1">
      <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">{label}</label>
      <select className="filter-select" value={val} onChange={e => setFilter(field, e.target.value)} aria-label={label}>
        <option value="All">All</option>
        {options.map(o => (
          <option key={typeof o === 'object' ? o.id : o} value={typeof o === 'object' ? o.id : o}>
            {typeof o === 'object' ? o.label : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function PillFilter({ label, field, options }) {
  const { filters, setFilter } = useSalesFilters();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="pill-group">
        <button className={clsx('pill', { active: filters[field] === 'All' })} onClick={() => setFilter(field, 'All')}>All</button>
        {options.map(o => (
          <button key={o} className={clsx('pill', { active: filters[field] === o })} onClick={() => setFilter(field, o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

export default function SalesFilterBar({ showQuarter = true, showFY = true, showAiNr = true }) {
  const { availableOptions, filterSummary, hasActiveFilters, resetFilters } = useSalesFilters();
  const cap = id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const clusterOpts = availableOptions.bgCluster.map(id => ({ id, label: cap(id) }));
  const bgOpts      = availableOptions.bg.map(id       => ({ id, label: cap(id) }));
  const suOpts      = availableOptions.subUnit.map(id  => ({ id, label: cap(id) }));
  const geoOpts     = availableOptions.salesGeo;
  const clientOpts  = availableOptions.groupClient;

  return (
    <div className="filter-bar bg-white border-b border-slate-200 px-6 py-3 shrink-0">
      <div className="flex items-end gap-4 flex-wrap">
        <SelectFilter label="BG Cluster"   field="bgCluster"   options={clusterOpts} />
        <SelectFilter label="BG"           field="bg"          options={bgOpts}      />
        <SelectFilter label="Sub Unit"     field="subUnit"     options={suOpts}      />
        <SelectFilter label="Sales Geo"    field="salesGeo"    options={geoOpts}     />
        <SelectFilter label="Group Client" field="groupClient" options={clientOpts}  />

        <div className="h-10 w-px bg-slate-200 self-end hidden lg:block" />

        {showAiNr && <PillFilter label="AI"        field="ai"       options={AI_OPTIONS} />}
        {showAiNr && <PillFilter label="New/Renew" field="newRenew" options={NR_OPTIONS} />}

        <div className="h-10 w-px bg-slate-200 self-end hidden xl:block" />

        {showFY      && <PillFilter label="Fiscal Year" field="fiscalYear" options={FISCAL_YEARS} />}
        {showQuarter && <PillFilter label="Quarter"     field="quarter"    options={QUARTERS}     />}

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
