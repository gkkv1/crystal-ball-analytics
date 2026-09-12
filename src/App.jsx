// src/App.jsx
// Main application router — landing ↔ revenue ↔ finance ↔ sales ↔ deg navigation

import { useState, Suspense } from 'react';
import { DashboardFilterProvider } from './context/DashboardFilterContext.jsx';
import { FinanceFilterProvider }   from './context/FinanceFilterContext.jsx';
import { SalesFilterProvider }     from './context/SalesFilterContext.jsx';
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

function RevenueDashboard({ onHome, presentationMode, onTogglePresentation }) {
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
export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'revenue' | 'finance' | 'sales' | 'deg'
  const [presentationMode, setPresentationMode] = useState(false);

  const goHome = () => setPage('landing');
  const togglePresentation = () => setPresentationMode((v) => !v);

  return (
    <ThemeProvider>
      <DashboardFilterProvider>
        <FinanceFilterProvider>
          <SalesFilterProvider>

            {page === 'landing' && (
              <LandingPage onNavigate={(dest) => setPage(dest)} />
            )}

            {page === 'revenue' && (
              <RevenueDashboard
                onHome={goHome}
                presentationMode={presentationMode}
                onTogglePresentation={togglePresentation}
              />
            )}

            {page === 'finance' && (
              <FinanceDashboard
                onHome={goHome}
                presentationMode={presentationMode}
                onTogglePresentation={togglePresentation}
              />
            )}

            {page === 'sales' && (
              <SalesDashboard onNavigate={(dest) => setPage(dest)} />
            )}

            {page === 'deg' && (
              <DegDashboard onNavigate={(dest) => setPage(dest)} />
            )}

            {page === 'rmg' && (
              <RmgDashboard onNavigate={(dest) => setPage(dest)} />
            )}

            {page === 'account' && (
              <AccountDashboard onNavigate={(dest) => setPage(dest)} />
            )}

          </SalesFilterProvider>
        </FinanceFilterProvider>
      </DashboardFilterProvider>
    </ThemeProvider>
  );
}
