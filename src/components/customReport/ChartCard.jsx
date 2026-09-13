// src/components/customReport/ChartCard.jsx
// Drop-in replacement for <div className="card card-padded"> on chart sections
// Renders the original chart children unchanged, adds "Customize Visual" button
// Uses snapshot pattern: data is captured at open-time, global filters unaffected

import { useState, useCallback } from 'react';
import VisualExplorer from './VisualExplorer.jsx';
import SectionTitle from '../common/SectionTitle.jsx';

// Sparkles icon (inline SVG, no extra dep needed)
function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}

export default function ChartCard({
  title,
  accent,
  chartMeta,
  data,             // pre-computed flat data array for the explorer
  height = 260,
  children,         // original chart component — rendered unchanged
  className = '',
  headerRight,      // optional slot for extra header content (e.g. subtitle badges)
}) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [snapshotData, setSnapshotData] = useState(null);

  // Capture snapshot when opening
  const openExplorer = useCallback(() => {
    // Deep copy the current data to prevent mutation
    const snapshot = data ? JSON.parse(JSON.stringify(data)) : [];
    setSnapshotData(snapshot);
    setExplorerOpen(true);
  }, [data]);

  const closeExplorer = useCallback(() => {
    setExplorerOpen(false);
  }, []);

  return (
    <>
      <div className={`card card-padded chart-card-wrapper ${className}`}>
        {/* Card Header */}
        <div className="chart-card-header">
          <div className="chart-card-title-area">
            {title && <SectionTitle accent={accent}>{title}</SectionTitle>}
            {headerRight && <div className="chart-card-header-right">{headerRight}</div>}
          </div>
          {chartMeta && data && (
            <button
              className="ve-trigger-btn"
              onClick={openExplorer}
              title="Open Custom View Report to customize this chart"
              aria-label={`Customize visual: ${title || chartMeta?.title || 'chart'}`}
            >
              <span className="ve-trigger-icon"><SparklesIcon /></span>
              <span className="ve-trigger-label">Customize</span>
            </button>
          )}
        </div>

        {/* Original chart — completely untouched */}
        <div style={{ height }}>
          {children}
        </div>
      </div>

      {/* Visual Explorer modal (portal, isolated state) */}
      {explorerOpen && (
        <VisualExplorer
          isOpen={explorerOpen}
          onClose={closeExplorer}
          chartMeta={title && chartMeta ? { ...chartMeta, title, defaultConfig: { ...chartMeta.defaultConfig, title } } : chartMeta}
          snapshotData={snapshotData}
        />
      )}
    </>
  );
}
