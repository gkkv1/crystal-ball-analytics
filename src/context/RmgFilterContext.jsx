// src/context/RmgFilterContext.jsx
// Filter state provider for RMG Performance module
// Enforces cascading hierarchy: bgCluster -> bg -> subUnit -> geo -> groupClient

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RAW_RMG_RECORDS } from '../data/rmgData.js';
import { getFilteredRmg, getRmgFilterOptions } from '../utils/rmgCalculations.js';

export const RMG_DEFAULT_FILTERS = {
  bgCluster:   'All',
  bg:          'All',
  subUnit:     'All',
  geo:         'All',
  groupClient: 'All',
};

const RmgFilterContext = createContext(null);

const DOWNSTREAM = {
  bgCluster:   ['bg', 'subUnit', 'geo', 'groupClient'],
  bg:          ['subUnit', 'geo', 'groupClient'],
  subUnit:     ['geo', 'groupClient'],
  geo:         ['groupClient'],
  groupClient: [],
};

export function RmgFilterProvider({ children }) {
  const [filters, setFilters] = useState(RMG_DEFAULT_FILTERS);

  const setFilter = useCallback((field, value) => {
    setFilters(prev => {
      const next = { ...prev, [field]: value };
      DOWNSTREAM[field]?.forEach(ds => { next[ds] = 'All'; });
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(RMG_DEFAULT_FILTERS), []);

  const availableOptions = useMemo(() => ({
    bgCluster:   getRmgFilterOptions(RAW_RMG_RECORDS, filters, 'bgCluster'),
    bg:          getRmgFilterOptions(RAW_RMG_RECORDS, filters, 'bg'),
    subUnit:     getRmgFilterOptions(RAW_RMG_RECORDS, filters, 'subUnit'),
    geo:         getRmgFilterOptions(RAW_RMG_RECORDS, filters, 'geo'),
    groupClient: getRmgFilterOptions(RAW_RMG_RECORDS, filters, 'groupClient'),
  }), [filters]);

  const filteredData = useMemo(
    () => getFilteredRmg(RAW_RMG_RECORDS, filters),
    [filters]
  );

  const filterSummary = useMemo(() => {
    const cap = s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const parts = [];
    if (filters.bgCluster   !== 'All') parts.push(cap(filters.bgCluster));
    if (filters.bg          !== 'All') parts.push(cap(filters.bg));
    if (filters.subUnit     !== 'All') parts.push(cap(filters.subUnit));
    if (filters.geo         !== 'All') parts.push(filters.geo);
    if (filters.groupClient !== 'All') parts.push(filters.groupClient);
    return parts.length ? parts.join(' · ') : 'All Data';
  }, [filters]);

  const hasActiveFilters = useMemo(() =>
    Object.entries(filters).some(([k, v]) => v !== RMG_DEFAULT_FILTERS[k]),
  [filters]);

  return (
    <RmgFilterContext.Provider value={{
      filters, setFilter, resetFilters,
      availableOptions, filteredData,
      allData: RAW_RMG_RECORDS,
      filterSummary, hasActiveFilters,
    }}>
      {children}
    </RmgFilterContext.Provider>
  );
}

export function useRmgFilters() {
  const ctx = useContext(RmgFilterContext);
  if (!ctx) throw new Error('useRmgFilters must be inside RmgFilterProvider');
  return ctx;
}
