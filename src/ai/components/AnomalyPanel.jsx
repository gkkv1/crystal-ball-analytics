// src/ai/components/AnomalyPanel.jsx
// AI Anomaly Detection panel — shows detected anomalies with severity cards
// Each card has an [Investigate] button that navigates to the relevant module

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { detectAllAnomalies } from '../engine/anomalyEngine.js';
import { SEVERITY_CONFIG } from '../types/ai.types.js';

function renderMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function AnomalyCard({ anomaly, onInvestigate }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.medium;

  return (
    <div style={{
      border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      background: cfg.bg,
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      {/* Card header */}
      <div
        style={{ padding: '10px 13px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: cfg.color, lineHeight: 1.3 }}>
              {anomaly.title}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '2px 7px',
              borderRadius: 20,
              background: cfg.border,
              color: cfg.color,
              flexShrink: 0,
            }}>
              {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            {renderMarkdown(anomaly.description)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
              Module: <span style={{ color: cfg.color }}>{anomaly.module?.toUpperCase()}</span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{anomaly.magnitude}</span>
          </div>
        </div>
        <span style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown style={{ width: 13, height: 13 }} /> : <ChevronRight style={{ width: 13, height: 13 }} />}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 13px 12px 38px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderTop: `1px solid ${cfg.border}`,
          paddingTop: 10,
          marginTop: 0,
        }}>
          {anomaly.driver && (
            <div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Likely Driver</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{anomaly.driver}</p>
            </div>
          )}
          {anomaly.affectedDimension && (
            <div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Affected Dimension</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{anomaly.affectedDimension}</p>
            </div>
          )}
          {anomaly.recommendedAction && (
            <div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Action</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{anomaly.recommendedAction}</p>
            </div>
          )}
          <button
            onClick={() => onInvestigate && onInvestigate(anomaly)}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: 7,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              color: cfg.color,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🔍 Investigate
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnomalyPanel({ filters = {}, onNavigate, onSetFilter }) {
  const [anomalies, setAnomalies] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  function runScan() {
    setScanning(true);
    // Small delay for UX — gives the impression of scanning
    setTimeout(() => {
      try {
        const found = detectAllAnomalies(filters);
        setAnomalies(found);
      } catch (e) {
        console.error('[AnomalyPanel] Scan error:', e);
        setAnomalies([]);
      }
      setScanning(false);
      setScanned(true);
    }, 800);
  }

  useEffect(() => {
    runScan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInvestigate(anomaly) {
    if (anomaly.navigateTo && onNavigate) {
      onNavigate(anomaly.navigateTo);
    }
    if (anomaly.filterPreset && onSetFilter) {
      Object.entries(anomaly.filterPreset).forEach(([key, value]) => {
        onSetFilter(key, value);
      });
    }
  }

  const bySeverity = {
    critical: anomalies.filter(a => a.severity === 'critical'),
    high:     anomalies.filter(a => a.severity === 'high'),
    medium:   anomalies.filter(a => a.severity === 'medium'),
    low:      anomalies.filter(a => a.severity === 'low'),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Anomaly Detection</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {scanned ? `${anomalies.length} anomalies detected across all modules` : 'Scanning business data...'}
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--bg-muted)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: scanning ? 'default' : 'pointer',
            opacity: scanning ? 0.7 : 1,
          }}
        >
          <RefreshCw style={{ width: 12, height: 12, animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
          {scanning ? 'Scanning...' : 'Rescan'}
        </button>
      </div>

      {scanning && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <RefreshCw style={{ width: 20, height: 20, animation: 'spin 1s linear infinite', color: '#2563EB', margin: '0 auto' }} />
          </div>
          Scanning Revenue · Finance · Sales · DEG · RMG · Account...
        </div>
      )}

      {!scanning && scanned && anomalies.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '24px 0',
          color: 'var(--text-secondary)', fontSize: 12,
          border: '1px solid var(--border)', borderRadius: 10,
          background: 'var(--bg-muted)',
        }}>
          <CheckCircle style={{ width: 24, height: 24, color: '#059669', margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No anomalies detected</p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>All business metrics are within acceptable thresholds.</p>
        </div>
      )}

      {!scanning && (
        <>
          {bySeverity.critical.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#DC2626', marginBottom: 6 }}>Critical</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bySeverity.critical.map(a => <AnomalyCard key={a.id} anomaly={a} onInvestigate={handleInvestigate} />)}
              </div>
            </div>
          )}
          {bySeverity.high.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#EA580C', marginBottom: 6 }}>High</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bySeverity.high.map(a => <AnomalyCard key={a.id} anomaly={a} onInvestigate={handleInvestigate} />)}
              </div>
            </div>
          )}
          {bySeverity.medium.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#D97706', marginBottom: 6 }}>Medium</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bySeverity.medium.map(a => <AnomalyCard key={a.id} anomaly={a} onInvestigate={handleInvestigate} />)}
              </div>
            </div>
          )}
          {bySeverity.low.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#059669', marginBottom: 6 }}>Low / Informational</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bySeverity.low.map(a => <AnomalyCard key={a.id} anomaly={a} onInvestigate={handleInvestigate} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
