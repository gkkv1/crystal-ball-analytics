// src/pages/FinanceDashboard.jsx
// Finance module shell — two tabs: Margin Performance & Realization & BTA
// Mirrors RevenueDashboard pattern in App.jsx

import { useState, Suspense } from 'react';
import Header from '../components/layout/Header.jsx';
import MarginPerformance from './finance/MarginPerformance.jsx';
import RealizationBta from './finance/RealizationBta.jsx';
import clsx from 'clsx';

const FINANCE_TABS = [
  { id: 'margin',      label: 'Margin Performance'  },
  { id: 'realization', label: 'Realization & BTA'   },
];

function FinanceTabNav({ activeTab, onTabChange }) {
  const FINANCE_TAB_ACCENTS = {
    margin:      '#10B981',
    realization: '#0EA5E9',
  };

  return (
    <div
      className="flex items-center px-5 py-2 shrink-0 gap-4"
      style={{
        background: 'linear-gradient(135deg, #1B3358 0%, #0D2040 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="tab-bar flex-1">
        {FINANCE_TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          const accent = FINANCE_TAB_ACCENTS[id];
          return (
            <button
              key={id}
              className={clsx('tab-item', { active: isActive })}
              onClick={() => onTabChange(id)}
              aria-selected={isActive}
              role="tab"
              style={isActive ? { '--tab-accent': accent } : {}}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="text-slate-500 text-xs font-medium shrink-0 hidden lg:block">
        All Revenue in Beacon INR Cr.
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        Loading analytics…
      </div>
    </div>
  );
}

export default function FinanceDashboard({ onHome, presentationMode, onTogglePresentation }) {
  const [activeTab, setActiveTab] = useState('margin');
  const ActivePage = activeTab === 'margin' ? MarginPerformance : RealizationBta;

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${presentationMode ? 'presentation-mode' : ''}`}>
      <Header
        onHome={onHome}
        showHome={true}
        presentationMode={presentationMode}
        onTogglePresentation={onTogglePresentation}
        moduleLabel="Finance Performance"
      />
      <FinanceTabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto" style={{ background: 'var(--bg-base)' }}>
        <Suspense fallback={<LoadingFallback />}>
          <ActivePage />
        </Suspense>
      </div>
    </div>
  );
}
