// src/components/customReport/VisualTypePicker.jsx
// Visual type selector with smart enable/disable based on metric count
import { CHART_TYPES, isChartTypeAvailable } from '../../utils/customReportValidation.js';

const CHART_ICONS = {
  bar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="10" width="5" height="12" rx="1"/><rect x="9.5" y="6" width="5" height="16" rx="1"/><rect x="17" y="3" width="5" height="19" rx="1"/>
    </svg>
  ),
  horizontalBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="4" width="12" height="4" rx="1"/><rect x="2" y="10" width="18" height="4" rx="1"/><rect x="2" y="16" width="8" height="4" rx="1"/>
    </svg>
  ),
  line: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <polyline points="3,17 8,10 13,14 19,6"/><circle cx="3" cy="17" r="1.5" fill="currentColor"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="13" cy="14" r="1.5" fill="currentColor"/><circle cx="19" cy="6" r="1.5" fill="currentColor"/>
    </svg>
  ),
  area: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <polyline points="3,17 8,10 13,14 19,6"/><path d="M3,17 L19,17" strokeDasharray="none"/><path d="M3,17 L3,17 L8,10 L13,14 L19,6 L19,17 Z" fill="currentColor" fillOpacity="0.15" stroke="none"/>
    </svg>
  ),
  stackedBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="3" y="12" width="5" height="10" rx="1"/><rect x="3" y="7" width="5" height="5" rx="0" fill="currentColor" fillOpacity="0.3"/>
      <rect x="10" y="9" width="5" height="13" rx="1"/><rect x="10" y="4" width="5" height="5" rx="0" fill="currentColor" fillOpacity="0.3"/>
      <rect x="17" y="5" width="5" height="17" rx="1"/><rect x="17" y="2" width="5" height="3" rx="0" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ),
  combo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="10" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.2"/><rect x="10" y="6" width="4" height="16" rx="1" fill="currentColor" fillOpacity="0.2"/><rect x="18" y="3" width="4" height="19" rx="1" fill="currentColor" fillOpacity="0.2"/>
      <polyline points="4,8 12,5 20,9" strokeWidth="2.5"/>
      <circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="20" cy="9" r="1.5" fill="currentColor"/>
    </svg>
  ),
  pie: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <circle cx="12" cy="12" r="9"/><path d="M12 3 A9 9 0 0 1 21 12 L12 12 Z" fill="currentColor" fillOpacity="0.25"/><path d="M12 3 L12 12" strokeWidth="1.5"/>
    </svg>
  ),
  donut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3 A9 9 0 0 1 21 12 L16.5 12 A4.5 4.5 0 0 0 12 7.5 Z" fill="currentColor" fillOpacity="0.25" stroke="none"/>
    </svg>
  ),
  scatter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <circle cx="7" cy="16" r="2" fill="currentColor" fillOpacity="0.5"/><circle cx="13" cy="9" r="2" fill="currentColor" fillOpacity="0.5"/><circle cx="19" cy="5" r="2" fill="currentColor" fillOpacity="0.5"/>
      <circle cx="4" cy="20" r="1.5" fill="currentColor"/><circle cx="17" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  ),
  radar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <polygon points="12,3 20.5,8.5 20.5,15.5 12,21 3.5,15.5 3.5,8.5"/><polygon points="12,7 17,10.5 17,13.5 12,17 7,13.5 7,10.5" fill="currentColor" fillOpacity="0.15"/>
    </svg>
  ),
  heatmap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="3" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.8"/><rect x="10" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.3"/><rect x="17" y="3" width="4" height="4" fill="currentColor" fillOpacity="0.6"/>
      <rect x="3" y="10" width="4" height="4" fill="currentColor" fillOpacity="0.2"/><rect x="10" y="10" width="4" height="4" fill="currentColor" fillOpacity="0.9"/><rect x="17" y="10" width="4" height="4" fill="currentColor" fillOpacity="0.4"/>
      <rect x="3" y="17" width="4" height="4" fill="currentColor" fillOpacity="0.5"/><rect x="10" y="17" width="4" height="4" fill="currentColor" fillOpacity="0.1"/><rect x="17" y="17" width="4" height="4" fill="currentColor" fillOpacity="0.7"/>
    </svg>
  ),
  kpi: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="12" x2="8" y2="17"/><line x1="12" y1="8" x2="12" y2="17"/><line x1="16" y1="5" x2="16" y2="17"/>
    </svg>
  ),
  table: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="16" x2="22" y2="16"/><line x1="9" y1="9" x2="9" y2="22"/>
    </svg>
  ),
  pivot: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="8" y1="2" x2="8" y2="22"/><rect x="8" y="8" width="7" height="7" fill="currentColor" fillOpacity="0.1"/>
    </svg>
  ),
};

export default function VisualTypePicker({ value, onChange, yAxisCount, labelCount }) {
  return (
    <div className="ve-section">
      <div className="ve-label">Visual Type</div>
      <div className="ve-chart-grid">
        {CHART_TYPES.map(({ key, label }) => {
          const { available, reason } = isChartTypeAvailable(key, yAxisCount, labelCount);
          const Icon = CHART_ICONS[key];
          const isActive = value === key;
          return (
            <button
              key={key}
              className={['ve-chart-btn', isActive ? 've-chart-btn--active' : '', !available ? 've-chart-btn--disabled' : ''].filter(Boolean).join(' ')}
              onClick={() => available && onChange(key)}
              disabled={!available}
              title={!available ? reason : label}
              aria-pressed={isActive}
              aria-label={label}
            >
              <span className="ve-chart-icon">{Icon ? <Icon /> : null}</span>
              <span className="ve-chart-label">{label}</span>
              {!available && (
                <span className="ve-chart-disabled-badge" title={reason}>!</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
