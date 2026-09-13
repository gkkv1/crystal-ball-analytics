// src/components/customReport/ConfigPanel.jsx
// Left configuration panel for Visual Explorer
// Renders all controls: axes, aggregation, sort, toggles, title

import VisualTypePicker from './VisualTypePicker.jsx';
import { transformData } from '../../utils/customReportTransform.js';

const AGG_OPTIONS = [
  { value: 'sum',   label: 'Sum' },
  { value: 'avg',   label: 'Average' },
  { value: 'min',   label: 'Min' },
  { value: 'max',   label: 'Max' },
  { value: 'count', label: 'Count' },
];

const SORT_FIELD_LABEL = 'X Axis';

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
      <path d="M3 2v6h6"/>
      <path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
    </svg>
  );
}

export default function ConfigPanel({ config, setConfig, chartMeta, rawData, onReset }) {
  const { dimensions = [], measures = [] } = chartMeta || {};

  function set(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function setAgg(measureKey, aggValue) {
    setConfig((prev) => ({
      ...prev,
      aggregation: { ...prev.aggregation, [measureKey]: aggValue },
    }));
  }

  function addMetric() {
    const available = measures.filter((m) => !config.yAxis.includes(m.key));
    if (available.length) {
      set('yAxis', [...config.yAxis, available[0].key]);
    }
  }

  function removeMetric(key) {
    if (config.yAxis.length <= 1) return;
    set('yAxis', config.yAxis.filter((k) => k !== key));
    if (config.secondaryYAxis?.includes(key)) {
      set('secondaryYAxis', (config.secondaryYAxis || []).filter((k) => k !== key));
    }
  }

  function toggleSecondaryAxis(measureKey) {
    const sec = config.secondaryYAxis || [];
    if (sec.includes(measureKey)) {
      set('secondaryYAxis', sec.filter((k) => k !== measureKey));
    } else {
      set('secondaryYAxis', [...sec, measureKey]);
    }
  }

  function changeMetric(idx, newKey) {
    const newYAxis = [...config.yAxis];
    newYAxis[idx] = newKey;
    set('yAxis', newYAxis);
  }

  // Compute current label count to inform chart type picker
  const currentLabelCount = (() => {
    if (!rawData?.length || !config?.xAxis) return 0;
    const { labels } = transformData(rawData, config, measures);
    return labels.length;
  })();

  const showSecondaryAxis = config.visualType === 'combo';
  const availableToAdd = measures.filter((m) => !config.yAxis.includes(m.key));

  return (
    <div className="ve-config-panel">
      {/* Visual Type */}
      <VisualTypePicker
        value={config.visualType}
        onChange={(v) => set('visualType', v)}
        yAxisCount={config.yAxis.length}
        labelCount={currentLabelCount}
      />

      <div className="ve-divider" />

      {/* X Axis */}
      <div className="ve-section">
        <div className="ve-label">X Axis</div>
        <select
          className="ve-select"
          value={config.xAxis}
          onChange={(e) => set('xAxis', e.target.value)}
          aria-label="X Axis field"
        >
          {dimensions.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Y Axis Metrics */}
      <div className="ve-section">
        <div className="ve-label">Y Axis (Metrics)</div>
        <div className="ve-metric-list">
          {config.yAxis.map((key, idx) => {
            const measure = measures.find((m) => m.key === key);
            const isSecondary = (config.secondaryYAxis || []).includes(key);
            return (
              <div key={key} className="ve-metric-row">
                <select
                  className="ve-select ve-select--metric"
                  value={key}
                  onChange={(e) => changeMetric(idx, e.target.value)}
                  aria-label={`Metric ${idx + 1}`}
                >
                  {measures
                    .filter((m) => m.key === key || !config.yAxis.includes(m.key))
                    .map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                </select>
                {showSecondaryAxis && (
                  <button
                    className={`ve-axis-toggle ${isSecondary ? 've-axis-toggle--active' : ''}`}
                    onClick={() => toggleSecondaryAxis(key)}
                    title={isSecondary ? 'Move to primary axis' : 'Move to secondary axis'}
                  >
                    {isSecondary ? 'Y2' : 'Y1'}
                  </button>
                )}
                <button
                  className="ve-metric-remove"
                  onClick={() => removeMetric(key)}
                  disabled={config.yAxis.length <= 1}
                  title="Remove metric"
                  aria-label={`Remove ${measure?.label || key}`}
                >
                  <RemoveIcon />
                </button>
              </div>
            );
          })}
          {availableToAdd.length > 0 && (
            <button className="ve-add-metric" onClick={addMetric} aria-label="Add metric">
              + Add Metric
            </button>
          )}
        </div>
      </div>

      {/* Aggregation */}
      <div className="ve-section">
        <div className="ve-label">Aggregation</div>
        {config.yAxis.map((key) => {
          const measure = measures.find((m) => m.key === key);
          const availableAggs = measure?.aggregations || ['sum', 'avg'];
          return (
            <div key={key} className="ve-agg-row">
              <span className="ve-agg-label">{measure?.label || key}</span>
              <select
                className="ve-select ve-select--sm"
                value={config.aggregation?.[key] || 'sum'}
                onChange={(e) => setAgg(key, e.target.value)}
                aria-label={`Aggregation for ${measure?.label || key}`}
              >
                {AGG_OPTIONS.filter((a) => availableAggs.includes(a.value)).map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="ve-divider" />

      {/* Sort */}
      <div className="ve-section">
        <div className="ve-label">Sort By</div>
        <div className="ve-row-2col">
          <select
            className="ve-select"
            value={config.sort?.field || 'xAxis'}
            onChange={(e) => set('sort', { ...config.sort, field: e.target.value })}
            aria-label="Sort field"
          >
            <option value="xAxis">{SORT_FIELD_LABEL}</option>
            {config.yAxis.map((key) => {
              const m = measures.find((ms) => ms.key === key);
              return <option key={key} value={key}>{m?.label || key}</option>;
            })}
          </select>
          <select
            className="ve-select"
            value={config.sort?.direction || 'asc'}
            onChange={(e) => set('sort', { ...config.sort, direction: e.target.value })}
            aria-label="Sort direction"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className="ve-divider" />

      {/* Toggles */}
      <div className="ve-section">
        <div className="ve-label">Display Options</div>
        {[
          { key: 'showLegend',     label: 'Legend' },
          { key: 'showDataLabels', label: 'Data Labels' },
          { key: 'showGridlines',  label: 'Gridlines' },
        ].map(({ key, label }) => (
          <label key={key} className="ve-toggle-row">
            <span className="ve-toggle-label">{label}</span>
            <span
              role="checkbox"
              aria-checked={!!config[key]}
              tabIndex={0}
              className={`ve-toggle ${config[key] ? 've-toggle--on' : ''}`}
              onClick={() => set(key, !config[key])}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(key, !config[key]); } }}
            >
              <span className="ve-toggle-thumb" />
            </span>
          </label>
        ))}
      </div>

      <div className="ve-divider" />

      {/* Chart Title */}
      <div className="ve-section">
        <div className="ve-label">Chart Title</div>
        <input
          className="ve-input"
          type="text"
          value={config.title || ''}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Enter chart title..."
          aria-label="Chart title"
        />
      </div>

      {/* Reset */}
      <div className="ve-reset-section">
        <button className="ve-reset-btn" onClick={onReset} aria-label="Reset to original configuration">
          <ResetIcon /> Reset to Original
        </button>
      </div>
    </div>
  );
}
