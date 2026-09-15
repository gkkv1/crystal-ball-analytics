// src/ai/components/AlertPanel.jsx
// AI Business Watchtower — prioritized, ranked alert cards with navigation

import { useState, useEffect } from 'react';
import { RefreshCw, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { generateAlerts } from '../engine/alertEngine.js';
import { SEVERITY_CONFIG } from '../types/ai.types.js';

function AlertCard({ alert, onInvestigate }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 9,
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{alert.title}</span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            padding: '1px 6px',
            borderRadius: 20,
            background: cfg.border,
            color: cfg.color,
            flexShrink: 0,
          }}>
            {alert.moduleLabel?.split(' ')[0] || alert.module}
          </span>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {alert.summary}
        </p>
        {alert.recommendedAction && alert.severity !== 'ok' && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontStyle: 'italic' }}>
            → {alert.recommendedAction}
          </p>
        )}
        <button
          onClick={() => onInvestigate && onInvestigate(alert)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            border: `1px solid ${cfg.border}`,
            background: 'transparent',
            color: cfg.color,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {alert.investigateLabel || 'Investigate'}
          <ArrowRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
    </div>
  );
}

export default function AlertPanel({ filters = {}, onNavigate, onSetFilter }) {
  const [alerts, setAlerts] = useState(null);
  const [scanning, setScanning] = useState(false);

  function runScan() {
    setScanning(true);
    setTimeout(() => {
      try {
        const result = generateAlerts(filters);
        setAlerts(result);
      } catch (e) {
        console.error('[AlertPanel] Scan error:', e);
        setAlerts({ all: [], summary: { criticalCount: 0, highCount: 0, mediumCount: 0, totalIssues: 0, positiveCount: 0 }, critical: [], high: [], medium: [], low: [], ok: [] });
      }
      setScanning(false);
    }, 1000);
  }

  useEffect(() => { runScan(); }, []); // eslint-disable-line

  function handleInvestigate(alert) {
    if (alert.navigateTo && onNavigate) {
      onNavigate(alert.navigateTo);
    }
    if (alert.filterPreset && onSetFilter) {
      Object.entries(alert.filterPreset).forEach(([key, val]) => onSetFilter(key, val));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield style={{ width: 14, height: 14, color: '#2563EB' }} />
            Business Watchtower
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            AI-monitored alerts ranked by business impact
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            border: '1px solid var(--border)', background: 'var(--bg-muted)',
            color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
            cursor: scanning ? 'default' : 'pointer', opacity: scanning ? 0.7 : 1,
          }}
        >
          <RefreshCw style={{ width: 12, height: 12, animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
          {scanning ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {scanning && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto 8px' }} />
          Scanning all business modules...
        </div>
      )}

      {!scanning && alerts && (
        <>
          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--bg-muted)', border: '1px solid var(--border)',
          }}>
            {[
              { label: 'Critical', count: alerts.summary.criticalCount, color: '#DC2626' },
              { label: 'High',     count: alerts.summary.highCount,     color: '#EA580C' },
              { label: 'Medium',   count: alerts.summary.mediumCount,   color: '#D97706' },
              { label: 'OK',       count: alerts.summary.positiveCount, color: '#059669' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {alerts.summary.totalIssues > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Issues Requiring Attention ({alerts.summary.totalIssues})
              </div>
              {[...alerts.critical, ...alerts.high, ...alerts.medium, ...alerts.low].map(a => (
                <AlertCard key={a.id} alert={a} onInvestigate={handleInvestigate} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '16px 0',
              border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--bg-muted)', color: 'var(--text-secondary)', fontSize: 12,
            }}>
              ✅ No significant issues detected
            </div>
          )}

          {/* Positive signals */}
          {alerts.ok.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
                Positive Signals ({alerts.ok.length})
              </div>
              {alerts.ok.map(a => (
                <AlertCard key={a.id} alert={a} onInvestigate={handleInvestigate} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
