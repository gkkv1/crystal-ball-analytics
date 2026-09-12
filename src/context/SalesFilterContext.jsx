// src/context/SalesFilterContext.jsx
// Filter state for the Sales Performance module
// Mirrors DashboardFilterContext / FinanceFilterContext pattern

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RAW_SALES_RECORDS } from '../data/salesData.js';
import { getFilteredSales, getSalesFilterOptions } from '../utils/salesCalculations.js';

export const SALES_DEFAULT_FILTERS = {
  fiscalYear:  'FY27',
  quarter:     'All',
  bgCluster:   'All',
  bg:          'All',
  subUnit:     'All',
  salesGeo:    'All',
  groupClient: 'All',
  ai:          'All',
  newRenew:    'All',
};

const SalesFilterContext = createContext(null);

const DOWNSTREAM = {
  fiscalYear:  [],
  quarter:     [],
  bgCluster:   ['bg', 'subUnit', 'salesGeo', 'groupClient'],
  bg:          ['subUnit', 'salesGeo', 'groupClient'],
  subUnit:     ['salesGeo', 'groupClient'],
  salesGeo:    ['groupClient'],
  groupClient: [],
  ai:          [],
  newRenew:    [],
};

export function SalesFilterProvider({ children }) {
  const [filters, setFilters] = useState(SALES_DEFAULT_FILTERS);

  const setFilter = useCallback((field, value) => {
    setFilters(prev => {
      const next = { ...prev, [field]: value };
      DOWNSTREAM[field]?.forEach(ds => { next[ds] = 'All'; });
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(SALES_DEFAULT_FILTERS), []);

  const availableOptions = useMemo(() => ({
    bgCluster:   getSalesFilterOptions(RAW_SALES_RECORDS, filters, 'bgCluster'),
    bg:          getSalesFilterOptions(RAW_SALES_RECORDS, filters, 'bg'),
    subUnit:     getSalesFilterOptions(RAW_SALES_RECORDS, filters, 'subUnit'),
    salesGeo:    getSalesFilterOptions(RAW_SALES_RECORDS, filters, 'salesGeo'),
    groupClient: getSalesFilterOptions(RAW_SALES_RECORDS, filters, 'groupClient'),
  }), [filters]);

  const filteredData = useMemo(
    () => getFilteredSales(RAW_SALES_RECORDS, filters),
    [filters]
  );

  const filterSummary = useMemo(() => {
    const cap = s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const parts = [];
    if (filters.fiscalYear  !== 'All') parts.push(filters.fiscalYear);
    if (filters.quarter     !== 'All') parts.push(filters.quarter);
    if (filters.bgCluster   !== 'All') parts.push(cap(filters.bgCluster));
    if (filters.bg          !== 'All') parts.push(cap(filters.bg));
    if (filters.subUnit     !== 'All') parts.push(cap(filters.subUnit));
    if (filters.salesGeo    !== 'All') parts.push(filters.salesGeo);
    if (filters.groupClient !== 'All') parts.push(filters.groupClient);
    if (filters.ai          !== 'All') parts.push(`AI: ${filters.ai}`);
    if (filters.newRenew    !== 'All') parts.push(filters.newRenew);
    return parts.length ? parts.join(' · ') : 'All Data';
  }, [filters]);

  const hasActiveFilters = useMemo(() =>
    Object.entries(filters).some(([k, v]) => v !== SALES_DEFAULT_FILTERS[k]),
  [filters]);

  return (
    <SalesFilterContext.Provider value={{
      filters, setFilter, resetFilters,
      availableOptions, filteredData,
      allData: RAW_SALES_RECORDS,
      filterSummary, hasActiveFilters,
    }}>
      {children}
    </SalesFilterContext.Provider>
  );
}

export function useSalesFilters() {
  const ctx = useContext(SalesFilterContext);
  if (!ctx) throw new Error('useSalesFilters must be inside SalesFilterProvider');
  return ctx;
}
