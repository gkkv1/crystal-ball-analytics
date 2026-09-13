// src/components/customReport/VisualExplorer.jsx
// Full-screen modal: left config panel + right live preview
// Isolated state — closing discards all changes, original dashboard untouched

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ConfigPanel from './ConfigPanel.jsx';
import VisualRenderer from './VisualRenderer.jsx';
import { validateConfig } from '../../utils/customReportValidation.js';
import { transformData } from '../../utils/customReportTransform.js';

// Inline icon components (avoids any encoding issues)
function BarChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

export default function VisualExplorer({ isOpen, onClose, chartMeta, snapshotData }) {
  const [config, setConfig] = useState(null);
  const initialConfig = useRef(null);

  // Initialise config from chartMeta.defaultConfig when opened
  useEffect(() => {
    if (isOpen && chartMeta?.defaultConfig) {
      const initial = { ...chartMeta.defaultConfig };
      initialConfig.current = initial;
      setConfig({ ...initial });
    }
  }, [isOpen, chartMeta]);

  const handleReset = useCallback(() => {
    if (initialConfig.current) {
      setConfig({ ...initialConfig.current });
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !config) return null;

  // Compute validation
  const { labels: currentLabels } = transformData(snapshotData, config, chartMeta?.measures);
  const validation = validateConfig(config, currentLabels);

  // Export PNG handler
  const handleExportPNG = () => {
    const canvas = document.querySelector('.ve-preview-area canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${(config.title || chartMeta?.title || 'chart').replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const { labels, series } = transformData(snapshotData, config, chartMeta?.measures);
    if (!labels.length) return;
    const headers = [config.xAxis, ...series.map((s) => s.name)];
    const rows = labels.map((label, i) => [label, ...series.map((s) => s.data[i] ?? '')]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(config.title || chartMeta?.title || 'chart').replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  const modal = (
    <div
      className="ve-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Custom View Report - ${config.title || chartMeta?.title || 'Chart'}`}
    >
      {/* Backdrop */}
      <div className="ve-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="ve-modal">
        {/* Header */}
        <div className="ve-header">
          <div className="ve-header-left">
            <span className="ve-header-icon"><BarChartIcon /></span>
            <div>
              <div className="ve-header-title">Custom View Report</div>
              <div className="ve-header-subtitle">{chartMeta?.title || 'Chart Customization'}</div>
            </div>
          </div>
          <div className="ve-header-right">
            <button className="ve-export-btn" onClick={handleExportPNG} title="Export as PNG image">
              <CameraIcon /> PNG
            </button>
            <button className="ve-export-btn" onClick={handleExportCSV} title="Export data as CSV">
              <DownloadIcon /> CSV
            </button>
            <span className="ve-snapshot-badge" title="Working with a snapshot of the data at the time you opened the explorer">
              <DatabaseIcon /> {snapshotData?.length || 0} rows
            </span>
            <button className="ve-close-btn" onClick={onClose} aria-label="Close Visual Explorer">
              <XIcon /> Close
            </button>
          </div>
        </div>

        {/* Body: Config Panel + Preview */}
        <div className="ve-body">
          {/* Left: Config Panel */}
          <div className="ve-config-col">
            <ConfigPanel
              config={config}
              setConfig={setConfig}
              chartMeta={chartMeta}
              rawData={snapshotData}
              onReset={handleReset}
            />
          </div>

          {/* Right: Live Preview */}
          <div className="ve-preview-col">
            <div className="ve-preview-header">
              <span className="ve-preview-label">Live Preview</span>
              <span className="ve-preview-meta">
                {snapshotData?.length || 0} records &middot; {currentLabels.length} {config.xAxis || 'x'} values
              </span>
            </div>
            <div className="ve-preview-area">
              {!validation.valid ? (
                <div className="ve-validation-msg">
                  <span className="ve-validation-icon"><AlertIcon /></span>
                  <span>{validation.reason}</span>
                </div>
              ) : (
                <VisualRenderer
                  rawData={snapshotData}
                  config={config}
                  chartMeta={chartMeta}
                  style={{ height: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
