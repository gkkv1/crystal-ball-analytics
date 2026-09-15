// src/ai/components/AiHub.jsx
// Main AI Intelligence Hub — right-side drawer with tabbed panels
// Mounts at App.jsx root level so it's available globally across all modules

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Bot, AlertTriangle, TrendingUp, ShieldCheck, FileText, Presentation } from 'lucide-react';
import AiCopilot from './AiCopilot.jsx';
import AnomalyPanel from './AnomalyPanel.jsx';
import ForecastPanel from './ForecastPanel.jsx';
import AlertPanel from './AlertPanel.jsx';
import ExecutiveBrief from './ExecutiveBrief.jsx';
import PresentationGenerator from './PresentationGenerator.jsx';

const TABS = [
  { id: 'copilot',   label: 'Copilot',    icon: Bot,          desc: 'Conversational Enterprise Copilot' },
  { id: 'anomalies', label: 'Anomalies',  icon: AlertTriangle,desc: 'Statistical Anomaly Detection' },
  { id: 'forecast',  label: 'Forecast',   icon: TrendingUp,   desc: 'Predictive Projections' },
  { id: 'alerts',    label: 'Watchtower', icon: ShieldCheck,  desc: 'Business Risk Alerts' },
  { id: 'brief',     label: 'Brief',      icon: FileText,     desc: 'Executive Summary' },
  { id: 'ppt',       label: 'Slides',     icon: Presentation, desc: 'PowerPoint Deck (.pptx)' },
];

export default function AiHub({ isOpen, onClose, filters = {}, currentModule, onNavigate, onSetFilter }) {
  const [activeTab, setActiveTab] = useState('copilot');
  const [showBriefForPPT, setShowBriefForPPT] = useState(false);
  const drawerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  function switchTab(tab) {
    setActiveTab(tab);
  }

  if (!isOpen) return null;

  const tab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <>
      {/* Backdrop — subtle overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.15)',
          backdropFilter: 'blur(1px)',
          animation: 'ai-fadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 420,
          zIndex: 1001,
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
          animation: 'ai-slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, rgba(30,58,95,0.95), rgba(37,99,235,0.85))',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}>
                <Sparkles style={{ width: 14, height: 14, color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
                  AI Intelligence Hub
                </div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Crystal Ball Analytics
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Enterprise AI status badge */}
              <div style={{
                padding: '3px 9px', borderRadius: 20,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: 9.5, fontWeight: 700, color: 'white',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
                Enterprise AI
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Module context */}
          {currentModule && (
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              Viewing: <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'capitalize' }}>{currentModule.replace(/-/g, ' ')}</span>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
          overflowX: 'auto',
        }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                title={t.desc}
                style={{
                  flex: 1,
                  padding: '8px 2px 7px',
                  border: 'none',
                  background: isActive ? 'rgba(37,99,235,0.06)' : 'none',
                  borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
                  color: isActive ? '#2563EB' : 'var(--text-muted)',
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{
                  width: 26, height: 26,
                  borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}>
                  <Icon size={15} strokeWidth={isActive ? 2.4 : 1.8} style={{ color: isActive ? '#2563EB' : 'var(--text-secondary)' }} />
                </div>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Panel content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          {activeTab === 'copilot' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
              <AiCopilot
                filters={filters}
                currentModule={currentModule}
                onNavigate={onNavigate}
                onSetFilter={onSetFilter}
                onSwitchTab={switchTab}
              />
            </div>
          )}
          {activeTab === 'anomalies' && (
            <AnomalyPanel filters={filters} onNavigate={onNavigate} onSetFilter={onSetFilter} />
          )}
          {activeTab === 'forecast' && (
            <ForecastPanel filters={filters} />
          )}
          {activeTab === 'alerts' && (
            <AlertPanel filters={filters} onNavigate={onNavigate} onSetFilter={onSetFilter} />
          )}
          {activeTab === 'brief' && (
            <ExecutiveBrief filters={filters} onGeneratePPT={() => switchTab('ppt')} />
          )}
          {activeTab === 'ppt' && (
            <PresentationGenerator filters={filters} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-muted)',
        }}>
          <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
            ◉ Enterprise Analytics Intelligence · Real-time Executive Insights · Crystal Ball Engine
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.6 }}>v1.0</span>
        </div>
      </div>
    </>
  );
}
