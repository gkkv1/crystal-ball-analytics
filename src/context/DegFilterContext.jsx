// src/context/DegFilterContext.jsx
// Filter state for DEG Performance module

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RAW_DEG_RECORDS } from '../data/degData.js';
import { getFilteredDeg, getDegFilterOptions } from '../utils/degCalculations.js';

export const DEG_DEFAULT_FILTERS = {
  bgCluster:   'All',
  bg:          'All',
  subUnit:     'All',
  geo:         'All',
  groupClient: 'All',
};

const DegFilterContext = createContext(null);

const DOWNSTREAM = {
  bgCluster:   ['bg', 'subUnit', 'geo', 'groupClient'],
  bg:          ['subUnit', 'geo', 'groupClient'],
  subUnit:     ['geo', 'groupClient'],
  geo:         ['groupClient'],
  groupClient: [],
};

export function DegFilterProvider({ children }) {
  const [filters, setFilters] = useState(DEG_DEFAULT_FILTERS);

  const setFilter = useCallback((field, value) => {
    setFilters(prev => {
      const next = { ...prev, [field]: value };
      DOWNSTREAM[field]?.forEach(ds => { next[ds] = 'All'; });
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(DEG_DEFAULT_FILTERS), []);

  const availableOptions = useMemo(() => ({
    bgCluster:   getDegFilterOptions(RAW_DEG_RECORDS, filters, 'bgCluster'),
    bg:          getDegFilterOptions(RAW_DEG_RECORDS, filters, 'bg'),
    subUnit:     getDegFilterOptions(RAW_DEG_RECORDS, filters, 'subUnit'),
    geo:         getDegFilterOptions(RAW_DEG_RECORDS, filters, 'geo'),
    groupClient: getDegFilterOptions(RAW_DEG_RECORDS, filters, 'groupClient'),
  }), [filters]);

  const filteredData = useMemo(
    () => getFilteredDeg(RAW_DEG_RECORDS, filters),
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
    Object.entries(filters).some(([k, v]) => v !== DEG_DEFAULT_FILTERS[k]),
  [filters]);

  return (
    <DegFilterContext.Provider value={{
      filters, setFilter, resetFilters,
      availableOptions, filteredData,
      allData: RAW_DEG_RECORDS,
      filterSummary, hasActiveFilters,
    }}>
      {children}
    </DegFilterContext.Provider>
  );
}

export function useDegFilters() {
  const ctx = useContext(DegFilterContext);
  if (!ctx) throw new Error('useDegFilters must be inside DegFilterProvider');
  return ctx;
}
