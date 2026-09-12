// src/context/DashboardFilterContext.jsx
// Centralized filter state with full cascading logic
// All pages/charts/tables consume this context

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RAW_REVENUE_RECORDS } from '../data/revenueData.js';
import { getFilteredData, getAvailableFilterValues } from '../utils/calculations.js';

export const DEFAULT_FILTERS = {
  fiscalYear: 'FY27',
  quarter: 'All',
  bgCluster: 'All',
  bg: 'All',
  subUnit: 'All',
  geo: 'All',
  groupClient: 'All',
};

const DashboardFilterContext = createContext(null);

export function DashboardFilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Cascading setter — changing an upstream filter resets downstream ones
  const DOWNSTREAM = {
    fiscalYear: [],
    quarter: [],
    bgCluster: ['bg', 'subUnit', 'geo', 'groupClient'],
    bg: ['subUnit', 'geo', 'groupClient'],
    subUnit: ['geo', 'groupClient'],
    geo: ['groupClient'],
    groupClient: [],
  };

  const setFilter = useCallback((field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      // Reset downstream filters
      DOWNSTREAM[field]?.forEach((downstream) => {
        next[downstream] = 'All';
      });
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Compute available options for each cascading filter
  const availableOptions = useMemo(() => {
    const getOptions = (field) => getAvailableFilterValues(RAW_REVENUE_RECORDS, filters, field);
    return {
      bgCluster: getOptions('bgCluster'),
      bg: getOptions('bg'),
      subUnit: getOptions('subUnit'),
      geo: getOptions('geo'),
      groupClient: getOptions('groupClient'),
    };
  }, [filters]);

  // The filtered dataset consumed by all pages
  const filteredData = useMemo(
    () => getFilteredData(RAW_REVENUE_RECORDS, filters),
    [filters]
  );

  // Active filter summary string
  const filterSummary = useMemo(() => {
    const parts = [];
    if (filters.fiscalYear !== 'All') parts.push(filters.fiscalYear);
    if (filters.quarter !== 'All') parts.push(filters.quarter);
    if (filters.bgCluster !== 'All') {
      const label = filters.bgCluster.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      parts.push(label);
    }
    if (filters.bg !== 'All') parts.push(filters.bg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    if (filters.subUnit !== 'All') parts.push(filters.subUnit.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    if (filters.geo !== 'All') parts.push(filters.geo);
    if (filters.groupClient !== 'All') parts.push(filters.groupClient);
    return parts.length > 0 ? parts.join(' · ') : 'All Data';
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([k, v]) => v !== 'All' && v !== DEFAULT_FILTERS[k]);
  }, [filters]);

  const value = {
    filters,
    setFilter,
    resetFilters,
    availableOptions,
    filteredData,
    allData: RAW_REVENUE_RECORDS,
    filterSummary,
    hasActiveFilters,
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error('useDashboardFilters must be used inside DashboardFilterProvider');
  return ctx;
}
