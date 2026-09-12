// src/pages/SalesDashboard.jsx
// Sales Performance module shell — 4 tabs
// FY Performance | Quarterly Performance | Current Qtr Performance | Weekly Trend Analysis

import { useState } from 'react';
import Header from '../components/layout/Header.jsx';
import FYPerformance from './sales/FYPerformance.jsx';
import QuarterlyPerformance from './sales/QuarterlyPerformance.jsx';
import CurrentQuarterPerformance from './sales/CurrentQuarterPerformance.jsx';
import SalesWeeklyTrend from './sales/SalesWeeklyTrend.jsx';
import { Home, TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'fy',        label: 'FY Performance'           },
  { id: 'quarterly', label: 'Quarterly Performance'     },
  { id: 'curqtr',    label: 'Current Qtr Performance'  },
  { id: 'weekly',    label: 'Weekly Trend Analysis'     },
];

export default function SalesDashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('fy');

  const renderTab = () => {
    switch (activeTab) {
      case 'fy':        return <FYPerformance />;
      case 'quarterly': return <QuarterlyPerformance />;
      case 'curqtr':    return <CurrentQuarterPerformance />;
      case 'weekly':    return <SalesWeeklyTrend />;
      default:          return <FYPerformance />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Header moduleLabel="Sales Performance" />

      {/* Tab nav — same dark gradient style as Revenue / Finance */}
      <nav style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #0D2040 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        flexWrap: 'wrap',
      }}>
        {/* Back to landing */}
        <button
          onClick={() => onNavigate('landing')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            color: 'rgba(255,255,255,0.55)', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: '0.75rem',
            fontWeight: 600, padding: '10px 12px 10px 4px',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            marginRight: 8, transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
        >
          <Home style={{ width: 13, height: 13 }} />
          Home
        </button>

        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 16px',
              height: 46,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            {tab.label}
            {/* active indicator */}
            {activeTab === tab.id && (
              <span style={{
                position: 'absolute', bottom: 0, left: 8, right: 8,
                height: 2, borderRadius: 2,
                background: '#F97316',
              }} />
            )}
          </button>
        ))}

        {/* Module badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp style={{ width: 13, height: 13, color: '#F97316' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Sales Analytics
          </span>
        </div>
      </nav>

      {/* Tab content — scrollable */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-app)' }}>
        {renderTab()}
      </main>
    </div>
  );
}
