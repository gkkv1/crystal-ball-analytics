// src/context/AccountFilterContext.jsx
// Filter context for Account Management / Account Performance module
// Powers both Performance Analysis and Client Visit tabs with shared state.

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS } from '../data/accountData.js';
import {
  getFilteredAccountPerf,
  getFilteredVisits,
  getAccountFilterOptions,
} from '../utils/accountCalculations.js';

export const ACCOUNT_DEFAULT_FILTERS = {
  bgCluster:  'All',
  groupClient:'All',
  iaeBdd:     'All',
  iaeBrm:     'All',
  iaeGeoHead: 'All',
};

const AccountFilterContext = createContext(null);

export function AccountFilterProvider({ children }) {
  const [filters, setFilters] = useState(ACCOUNT_DEFAULT_FILTERS);
  const [businessDomain, setBusinessDomain] = useState('revenue');

  const setFilter = useCallback((field, value) => {
    setFilters(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'bgCluster') {
        next.groupClient = 'All';
        next.iaeBdd = 'All';
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(ACCOUNT_DEFAULT_FILTERS);
  }, []);

  const availableOptions = useMemo(() => ({
    bgCluster:   getAccountFilterOptions(RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS, filters, 'bgCluster'),
    groupClient: getAccountFilterOptions(RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS, filters, 'groupClient'),
    iaeBdd:      getAccountFilterOptions(RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS, filters, 'iaeBdd'),
    iaeBrm:      getAccountFilterOptions(RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS, filters, 'iaeBrm'),
    iaeGeoHead:  getAccountFilterOptions(RAW_ACCOUNT_PERFORMANCE, RAW_CLIENT_VISITS, filters, 'iaeGeoHead'),
  }), [filters]);

  const filteredPerf = useMemo(
    () => getFilteredAccountPerf(RAW_ACCOUNT_PERFORMANCE, filters),
    [filters]
  );

  const filteredVisits = useMemo(
    () => getFilteredVisits(RAW_CLIENT_VISITS, filters),
    [filters]
  );

  const filterSummary = useMemo(() => {
    const cap = s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const parts = [];
    if (filters.bgCluster   !== 'All') parts.push(cap(filters.bgCluster));
    if (filters.groupClient !== 'All') parts.push(filters.groupClient);
    if (filters.iaeBdd      !== 'All') parts.push(`BDD: ${filters.iaeBdd}`);
    if (filters.iaeBrm      !== 'All') parts.push(`BRM: ${filters.iaeBrm}`);
    if (filters.iaeGeoHead  !== 'All') parts.push(`Geo Head: ${filters.iaeGeoHead}`);
    return parts.length ? parts.join(' · ') : 'All Accounts';
  }, [filters]);

  const hasActiveFilters = useMemo(() =>
    Object.entries(filters).some(([k, v]) => v !== ACCOUNT_DEFAULT_FILTERS[k]),
  [filters]);

  return (
    <AccountFilterContext.Provider value={{
      filters, setFilter, resetFilters,
      businessDomain, setBusinessDomain,
      availableOptions,
      filteredPerf,
      filteredVisits,
      filterSummary,
      hasActiveFilters,
    }}>
      {children}
    </AccountFilterContext.Provider>
  );
}

export function useAccountFilters() {
  const ctx = useContext(AccountFilterContext);
  if (!ctx) throw new Error('useAccountFilters must be inside AccountFilterProvider');
  return ctx;
}
