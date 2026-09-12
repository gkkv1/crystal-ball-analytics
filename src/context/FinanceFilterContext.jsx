// src/context/FinanceFilterContext.jsx
// Mirrors DashboardFilterContext but scoped to Finance module
// Uses RAW_FINANCE_RECORDS + same dimension hierarchy

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RAW_FINANCE_RECORDS } from '../data/financeData.js';
import { getFilteredData, getAvailableFilterValues } from '../utils/calculations.js';

export const FINANCE_DEFAULT_FILTERS = {
  fiscalYear:  'FY26',
  quarter:     'All',
  bgCluster:   'All',
  bg:          'All',
  subUnit:     'All',
  geo:         'All',
  groupClient: 'All',
};

const FinanceFilterContext = createContext(null);

export function FinanceFilterProvider({ children }) {
  const [filters, setFilters] = useState(FINANCE_DEFAULT_FILTERS);

  const DOWNSTREAM = {
    fiscalYear:  [],
    quarter:     [],
    bgCluster:   ['bg', 'subUnit', 'geo', 'groupClient'],
    bg:          ['subUnit', 'geo', 'groupClient'],
    subUnit:     ['geo', 'groupClient'],
    geo:         ['groupClient'],
    groupClient: [],
  };

  const setFilter = useCallback((field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      DOWNSTREAM[field]?.forEach((ds) => { next[ds] = 'All'; });
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(FINANCE_DEFAULT_FILTERS);
  }, []);

  // Cascading available options from live finance data
  const availableOptions = useMemo(() => {
    const getOptions = (field) =>
      getAvailableFilterValues(RAW_FINANCE_RECORDS, filters, field);
    return {
      bgCluster:   getOptions('bgCluster'),
      bg:          getOptions('bg'),
      subUnit:     getOptions('subUnit'),
      geo:         getOptions('geo'),
      groupClient: getOptions('groupClient'),
    };
  }, [filters]);

  // Pre-filtered dataset consumed by Finance pages
  const filteredData = useMemo(
    () => getFilteredData(RAW_FINANCE_RECORDS, filters),
    [filters]
  );

  // Active filter summary string (same logic as Revenue)
  const filterSummary = useMemo(() => {
    const parts = [];
    const cap = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (filters.fiscalYear !== 'All')  parts.push(filters.fiscalYear);
    if (filters.quarter    !== 'All')  parts.push(filters.quarter);
    if (filters.bgCluster  !== 'All')  parts.push(cap(filters.bgCluster));
    if (filters.bg         !== 'All')  parts.push(cap(filters.bg));
    if (filters.subUnit    !== 'All')  parts.push(cap(filters.subUnit));
    if (filters.geo        !== 'All')  parts.push(filters.geo);
    if (filters.groupClient!== 'All')  parts.push(filters.groupClient);
    return parts.length > 0 ? parts.join(' · ') : 'All Data';
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(
      ([k, v]) => v !== FINANCE_DEFAULT_FILTERS[k]
    );
  }, [filters]);

  return (
    <FinanceFilterContext.Provider value={{
      filters, setFilter, resetFilters,
      availableOptions, filteredData,
      allData: RAW_FINANCE_RECORDS,
      filterSummary, hasActiveFilters,
    }}>
      {children}
    </FinanceFilterContext.Provider>
  );
}

export function useFinanceFilters() {
  const ctx = useContext(FinanceFilterContext);
  if (!ctx) throw new Error('useFinanceFilters must be used inside FinanceFilterProvider');
  return ctx;
}
