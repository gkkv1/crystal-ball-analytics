// src/App.jsx
// Main application router — landing ↔ revenue ↔ finance ↔ sales ↔ deg navigation
// AI Intelligence Hub mounted at root level — available across all modules.

import { useState, Suspense, useCallback } from 'react';
import { DashboardFilterProvider, useDashboardFilters } from './context/DashboardFilterContext.jsx';
import { FinanceFilterProvider, useFinanceFilters }   from './context/FinanceFilterContext.jsx';
import { SalesFilterProvider, useSalesFilters }     from './context/SalesFilterContext.jsx';
import { ThemeProvider }           from './context/ThemeContext.jsx';
import LandingPage                 from './pages/LandingPage.jsx';
import Header                      from './components/layout/Header.jsx';
import TabNav                      from './components/navigation/TabNav.jsx';
import AnnualPerformance           from './pages/AnnualPerformance.jsx';
import AOPPerformance              from './pages/AOPPerformance.jsx';
import CurrentQuarterAnalysis      from './pages/CurrentQuarterAnalysis.jsx';
import WeeklyTrendAnalysis         from './pages/WeeklyTrendAnalysis.jsx';
import FinanceDashboard            from './pages/FinanceDashboard.jsx';
import SalesDashboard              from './pages/SalesDashboard.jsx';
import DegDashboard                from './pages/DegDashboard.jsx';
import RmgDashboard                from './pages/RmgDashboard.jsx';
import AccountDashboard            from './pages/AccountDashboard.jsx';
import AiHub                       from './ai/components/AiHub.jsx';

function LoadingFallback({ color = 'blue' }) {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 border-2 border-${color}-200 border-t-${color}-600 rounded-full animate-spin`} />
        Loading analytics…
      </div>
    </div>
  );
}

// ─── Revenue Dashboard ────────────────────────────────────────────────────
const REVENUE_TAB_PAGES = {
  annual:  AnnualPerformance,
  aop:     AOPPerformance,
  curqtr:  CurrentQuarterAnalysis,
  weekly:  WeeklyTrendAnalysis,
};

function RevenueDashboard({ onHome, presentationMode, onTogglePresentation, onAiOpen, aiOpen }) {
  const [activeTab, setActiveTab] = useState('annual');
  const ActivePage = REVENUE_TAB_PAGES[activeTab] || AnnualPerformance;

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${presentationMode ? 'presentation-mode' : ''}`}>
      <Header
        onHome={onHome}
        showHome={true}
        presentationMode={presentationMode}
        onTogglePresentation={onTogglePresentation}
        moduleLabel="Revenue Performance"
        onAiOpen={onAiOpen}
        aiOpen={aiOpen}
      />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto bg-slate-50" style={{ background: 'var(--bg-base)' }}>
        <Suspense fallback={<LoadingFallback />}>
          <ActivePage />
        </Suspense>
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────
function AppContent() {
  const [page, setPage] = useState('landing'); // 'landing' | 'revenue' | 'finance' | 'sales' | 'deg' | 'rmg' | 'account'
  const [presentationMode, setPresentationMode] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Read filters from context for AI
  const { filters, setFilter: setRevenueFilter } = useDashboardFilters();
  const { setFilter: setFinanceFilter } = useFinanceFilters();
  const { setFilter: setSalesFilter }   = useSalesFilters();

  const goHome = () => setPage('landing');
  const togglePresentation = () => setPresentationMode((v) => !v);
  const openAi  = useCallback(() => setAiOpen(true), []);
  const closeAi = useCallback(() => setAiOpen(false), []);

  // AI navigation — navigates to any module page seamlessly in all cases
  const handleAiNavigate = useCallback((dest) => {
    if (!dest) return;
    const clean = String(dest).toLowerCase().trim();
    if (clean.includes('rev')) setPage('revenue');
    else if (clean.includes('fin')) setPage('finance');
    else if (clean.includes('sal')) setPage('sales');
    else if (clean.includes('deg') || clean.includes('csi')) setPage('deg');
    else if (clean.includes('rmg') || clean.includes('headcount')) setPage('rmg');
    else if (clean.includes('acc')) setPage('account');
    else if (clean.includes('home') || clean.includes('land')) setPage('landing');
    else setPage(dest);
  }, []);

  // AI filter setter — broadcasts filter changes to active contexts
  const handleAiSetFilter = useCallback((key, value) => {
    if (!key || !value) return;
    try { setRevenueFilter && setRevenueFilter(key, value); } catch (_) {}
    try { setFinanceFilter && setFinanceFilter(key, value); } catch (_) {}
    try { setSalesFilter && setSalesFilter(key, value); }     catch (_) {}
  }, [setRevenueFilter, setFinanceFilter, setSalesFilter]);

  // Determine current module label for AI context
  const currentModuleLabel = {
    revenue: 'Revenue Performance',
    finance: 'Finance Performance',
    sales:   'Sales Performance',
    deg:     'DEG Performance',
    rmg:     'RMG Performance',
    account: 'Account Management',
  }[page] || null;

  const aiProps = {
    onAiOpen: page !== 'landing' ? openAi : undefined,
    aiOpen,
  };

  const headerProps = {
    onHome: goHome,
    showHome: true,
    presentationMode,
    onTogglePresentation: togglePresentation,
    ...aiProps,
  };

  return (
    <>
      {page === 'landing' && (
        <LandingPage onNavigate={(dest) => setPage(dest)} />
      )}

      {page === 'revenue' && (
        <RevenueDashboard
          onHome={goHome}
          presentationMode={presentationMode}
          onTogglePresentation={togglePresentation}
          onAiOpen={openAi}
          aiOpen={aiOpen}
        />
      )}

      {page === 'finance' && (
        <FinanceDashboard
          onHome={goHome}
          presentationMode={presentationMode}
          onTogglePresentation={togglePresentation}
          onAiOpen={openAi}
          aiOpen={aiOpen}
        />
      )}

      {page === 'sales' && (
        <SalesDashboard onNavigate={(dest) => setPage(dest)} onAiOpen={openAi} aiOpen={aiOpen} />
      )}

      {page === 'deg' && (
        <DegDashboard onNavigate={(dest) => setPage(dest)} onAiOpen={openAi} aiOpen={aiOpen} />
      )}

      {page === 'rmg' && (
        <RmgDashboard onNavigate={(dest) => setPage(dest)} onAiOpen={openAi} aiOpen={aiOpen} />
      )}

      {page === 'account' && (
        <AccountDashboard onNavigate={(dest) => setPage(dest)} onAiOpen={openAi} aiOpen={aiOpen} />
      )}

      {/* AI Intelligence Hub — mounted at root, always available */}
      <AiHub
        isOpen={aiOpen}
        onClose={closeAi}
        filters={filters || {}}
        currentModule={page !== 'landing' ? page : null}
        onNavigate={handleAiNavigate}
        onSetFilter={handleAiSetFilter}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardFilterProvider>
        <FinanceFilterProvider>
          <SalesFilterProvider>
            <AppContent />
          </SalesFilterProvider>
        </FinanceFilterProvider>
      </DashboardFilterProvider>
    </ThemeProvider>
  );
}
