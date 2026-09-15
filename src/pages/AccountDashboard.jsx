// src/pages/AccountDashboard.jsx
// Account Management / Account Performance Shell
// EXACTLY TWO TABS: 1. Performance Analysis, 2. Client Visit
// Reuses the application design system, header, navigation, and theme tokens.

import { useState, Suspense } from 'react';
import { LineChart, Users } from 'lucide-react';
import clsx from 'clsx';

import Header from '../components/layout/Header.jsx';
import { AccountFilterProvider } from '../context/AccountFilterContext.jsx';
import PerformanceAnalysis from './account/PerformanceAnalysis.jsx';
import ClientVisit from './account/ClientVisit.jsx';

const ACCOUNT_TABS = [
  { id: 'performance',  label: 'Performance Analysis', icon: LineChart, accent: '#3B82F6' },
  { id: 'client-visit', label: 'Client Visit',          icon: Users,     accent: '#06B6D4' },
];

function AccountTabNav({ activeTab, onTabChange }) {
  return (
    <div
      className="flex items-center px-6 py-2.5 shrink-0 gap-4"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Two tabs */}
      <div className="flex items-center gap-1.5">
        {ACCOUNT_TABS.map(({ id, label, icon: Icon, accent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                isActive
                  ? 'bg-blue-600/90 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
              style={isActive ? { borderBottom: `2px solid ${accent}` } : {}}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto text-2xs font-semibold text-slate-400 tracking-wider uppercase hidden sm:block">
        Account Management Intelligence
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        Loading account analytics…
      </div>
    </div>
  );
}

export default function AccountDashboard({ onNavigate, onAiOpen, aiOpen }) {
  const [activeTab, setActiveTab] = useState('performance');

  return (
    <AccountFilterProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <Header
          onHome={() => onNavigate('landing')}
          showHome={true}
          moduleLabel="Account Performance"
          onAiOpen={onAiOpen}
          aiOpen={aiOpen}
        />

        {/* Tab Navigation: EXACTLY TWO TABS */}
        <AccountTabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content View */}
        <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'performance' && <PerformanceAnalysis />}
            {activeTab === 'client-visit' && <ClientVisit />}
          </Suspense>
        </main>
      </div>
    </AccountFilterProvider>
  );
}
