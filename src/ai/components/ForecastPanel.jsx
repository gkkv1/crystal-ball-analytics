// src/ai/components/ForecastPanel.jsx
// Predictive Forecast panel — metric selector + chart + explanation

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { FORECAST_METRICS, explainForecast } from '../engine/forecastEngine.js';

function ForecastChart({ result }) {
  if (!result) return null;

  const { historical, smoothed, forecast, confidenceLow, confidenceHigh, forecastLabels, unit } = result;
  const allValues = [...(historical.map(d => d.value)), ...forecast, ...confidenceHigh];
  const maxVal = Math.max(...allValues.filter(v => v > 0));
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const histLen = historical.length;
  const totalPoints = histLen + forecast.length;
  const chartWidth = 340;
  const chartHeight = 120;
  const padL = 10, padR = 10, padT = 10, padB = 30;
  const w = chartWidth - padL - padR;
  const h = chartHeight - padT - padB;

  function xPos(i) { return padL + (i / (totalPoints - 1)) * w; }
  function yPos(v) { return padT + h - ((v - minVal) / range) * h; }

  // Historical line points
  const histPoints = historical.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(' ');
  // Smoothed trend points (last 5)
  const smoothStart = Math.max(0, histLen - 6);
  const smoothedLine = smoothed.slice(smoothStart).map((v, i) => `${xPos(smoothStart + i)},${yPos(v)}`).join(' ');

  // Confidence band
  const bandPath = [
    ...confidenceHigh.map((v, i) => `${i === 0 ? 'M' : 'L'}${xPos(histLen + i)},${yPos(v)}`).join(' '),
    ...confidenceLow.map((v, i) => `L${xPos(histLen + confidenceLow.length - 1 - i)},${yPos(confidenceLow[confidenceLow.length - 1 - i])}`).join(' '),
    'Z',
  ].join(' ');

  // Forecast dashed line (from last historical point)
  const forecastPoints = [
    `${xPos(histLen - 1)},${yPos(historical[histLen - 1]?.value || 0)}`,
    ...forecast.map((v, i) => `${xPos(histLen + i)},${yPos(v)}`),
  ].join(' ');

  // X-axis labels
  const labelIndices = [];
  const step = Math.ceil(totalPoints / 5);
  for (let i = 0; i < histLen; i += step) labelIndices.push(i);
  labelIndices.push(histLen - 1);
  forecastLabels.forEach((_, i) => labelIndices.push(histLen + i));
  const uniqueLabels = [...new Set(labelIndices)].filter(i => i < totalPoints);

  return (
    <div style={{ background: 'var(--bg-muted)', borderRadius: 10, padding: 12, marginTop: 12 }}>
      <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible', maxWidth: '100%' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac, i) => (
          <line key={i}
            x1={padL} x2={padL + w}
            y1={padT + h * (1 - frac)} y2={padT + h * (1 - frac)}
            stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3,3"
          />
        ))}

        {/* Forecast divider */}
        <line
          x1={xPos(histLen - 1)} x2={xPos(histLen - 1)}
          y1={padT} y2={padT + h}
          stroke="rgba(37,99,235,0.3)" strokeWidth={1} strokeDasharray="4,3"
        />

        {/* Confidence band */}
        <path d={bandPath} fill="rgba(37,99,235,0.07)" />

        {/* Historical line */}
        <polyline points={histPoints} fill="none" stroke="#2563EB" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Forecast dashed line */}
        <polyline points={forecastPoints} fill="none" stroke="#2563EB" strokeWidth={2} strokeDasharray="6,4" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points for historical (last 3) */}
        {historical.slice(-3).map((d, i) => {
          const globalI = histLen - 3 + i;
          return <circle key={i} cx={xPos(globalI)} cy={yPos(d.value)} r={3} fill="#2563EB" stroke="white" strokeWidth={1.5} />;
        })}

        {/* Forecast points */}
        {forecast.map((v, i) => (
          <circle key={i} cx={xPos(histLen + i)} cy={yPos(v)} r={4} fill="white" stroke="#2563EB" strokeWidth={2} />
        ))}

        {/* Labels */}
        {uniqueLabels.map(i => {
          const isFC = i >= histLen;
          const label = isFC
            ? forecastLabels[i - histLen] || ''
            : historical[i]?.label?.split(' ')[0] || '';
          const shortLabel = label.length > 7 ? label.slice(0, 7) : label;
          return (
            <text key={i}
              x={xPos(i)} y={chartHeight - 6}
              textAnchor="middle"
              fontSize={8}
              fill={isFC ? '#2563EB' : 'var(--text-muted)'}
              fontWeight={isFC ? 700 : 400}
            >
              {shortLabel}
            </text>
          );
        })}

        {/* FORECAST label */}
        <text x={xPos(histLen - 1) + 6} y={padT + 8} fontSize={7.5} fill="rgba(37,99,235,0.7)" fontWeight={700} textTransform="uppercase">
          FORECAST →
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
        {[
          { color: '#2563EB', dash: false, label: 'Historical' },
          { color: '#2563EB', dash: true, label: 'Forecast' },
          { color: 'rgba(37,99,235,0.15)', dash: false, label: 'Confidence band', isRect: true },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {item.isRect
              ? <div style={{ width: 14, height: 8, borderRadius: 2, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }} />
              : <svg width={20} height={4}><line x1={0} y1={2} x2={20} y2={2} stroke={item.color} strokeWidth={2} strokeDasharray={item.dash ? '5,3' : 'none'} /></svg>
            }
            <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForecastPanel({ filters = {} }) {
  const [selectedMetric, setSelectedMetric] = useState(FORECAST_METRICS[0].id);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const metric = FORECAST_METRICS.find(m => m.id === selectedMetric);
      if (metric) {
        try {
          setResult(metric.fn(filters));
        } catch (e) {
          console.error('[ForecastPanel]', e);
          setResult(null);
        }
      }
      setLoading(false);
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetric]);

  const TrendIcon = result?.trendDirection === 'positive' ? TrendingUp : result?.trendDirection === 'negative' ? TrendingDown : Minus;
  const trendColor = result?.trendDirection === 'positive' ? '#059669' : result?.trendDirection === 'negative' ? '#DC2626' : '#64748B';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>Predictive Forecast</h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Holt's exponential smoothing on historical data</p>
      </div>

      {/* Metric selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FORECAST_METRICS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMetric(m.id)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: selectedMetric === m.id ? '1.5px solid #2563EB' : '1px solid var(--border)',
              background: selectedMetric === m.id ? 'rgba(37,99,235,0.08)' : 'var(--bg-muted)',
              color: selectedMetric === m.id ? '#2563EB' : 'var(--text-secondary)',
              fontSize: 11.5,
              fontWeight: selectedMetric === m.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12 }}>
          Computing forecast...
        </div>
      ) : !result ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 12, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-muted)' }}>
          Insufficient data for forecast in current filter context.
        </div>
      ) : (
        <>
          {/* KPI summary */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Last Actual', value: `${result.unit === '₹ Cr' ? '₹' : ''}${result.lastActual?.toFixed(result.unit === 'Headcount' || result.unit === 'Meetings/Month' ? 0 : 1)}${result.unit !== '₹ Cr' ? ' ' + result.unit.split('/')[0] : ' Cr'}` },
              { label: 'Forecast', value: `${result.unit === '₹ Cr' ? '₹' : ''}${result.firstForecast?.toFixed(result.unit === 'Headcount' || result.unit === 'Meetings/Month' ? 0 : 1)}${result.unit !== '₹ Cr' ? ' ' + result.unit.split('/')[0] : ' Cr'}` },
              { label: 'Expected Change', value: `${result.growthPct >= 0 ? '+' : ''}${result.growthPct?.toFixed(1)}%` },
            ].map((kpi, i) => (
              <div key={i} style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
              }}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: i === 2 ? trendColor : 'var(--text-primary)',
                  marginTop: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {i === 2 && <TrendIcon style={{ width: 13, height: 13 }} />}
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <ForecastChart result={result} />

          {/* AI explanation */}
          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(37,99,235,0.04)',
            border: '1px solid rgba(37,99,235,0.15)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 600, color: '#2563EB', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
              ✦ AI Explanation
            </span>
            {explainForecast(result)}
          </div>

          {/* Method note */}
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Method: {result.method} · Confidence: 80% interval (z=1.28)
          </p>
        </>
      )}
    </div>
  );
}
