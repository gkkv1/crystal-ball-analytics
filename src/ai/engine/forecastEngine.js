// src/ai/engine/forecastEngine.js
// Predictive forecasting using exponential smoothing (Holt's method)
// Applied to quarterly revenue, sales TCV, and WON HC time series.
// All inputs come from existing analytics tools — no separate dataset.

import { getRevenueQuarterlyTrend } from '../tools/revenueTools.js';
import { getSalesTCVQuarterly } from '../tools/salesTools.js';
import { getWonHCTrendData } from '../tools/rmgTools.js';
import { getMeetingsTrendData } from '../tools/accountTools.js';

// ─── Exponential Smoothing (Holt's double exponential) ───────────────────────
// α = level smoothing, β = trend smoothing
function holtSmoothing(series, alpha = 0.4, beta = 0.2, periods = 2) {
  if (series.length < 2) return { smoothed: series, forecast: [], trend: 0 };

  let level = series[0];
  let trendVal = series[1] - series[0];
  const smoothed = [level];

  for (let i = 1; i < series.length; i++) {
    const newLevel = alpha * series[i] + (1 - alpha) * (level + trendVal);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trendVal;
    level = newLevel;
    trendVal = newTrend;
    smoothed.push(Math.max(0, level));
  }

  const forecast = [];
  for (let h = 1; h <= periods; h++) {
    forecast.push(Math.max(0, level + h * trendVal));
  }

  return { smoothed, forecast, trendVal };
}

// Compute confidence band based on residual standard deviation
function computeConfidenceBand(actuals, smoothed, forecast, zScore = 1.28) {
  if (actuals.length < 3) return forecast.map(f => ({ low: f * 0.88, high: f * 1.12 }));

  const residuals = actuals.map((a, i) => a - (smoothed[i] || a));
  const variance = residuals.reduce((s, r) => s + r * r, 0) / residuals.length;
  const stdDev = Math.sqrt(variance);

  return forecast.map((f, h) => ({
    low:  Math.max(0, f - zScore * stdDev * Math.sqrt(h + 1)),
    high: f + zScore * stdDev * Math.sqrt(h + 1),
  }));
}

function round2(v) { return Math.round(v * 100) / 100; }

// ─── Revenue Forecast ─────────────────────────────────────────────────────────
export function forecastRevenue(filters = {}) {
  try {
    const quarterly = getRevenueQuarterlyTrend(filters);
    if (quarterly.length < 4) return null;

    const historical = quarterly.map(d => ({ label: d.label, value: d.actual, aop: d.aop, fy: d.fy, quarter: d.quarter }));
    const values = historical.map(d => d.value);

    const { smoothed, forecast, trendVal } = holtSmoothing(values, 0.35, 0.2, 2);
    const bands = computeConfidenceBand(values, smoothed, forecast);

    const lastActual = values[values.length - 1];
    const firstForecast = forecast[0];
    const growthPct = lastActual > 0 ? ((firstForecast - lastActual) / lastActual) * 100 : 0;

    // Generate future period labels
    const last = quarterly[quarterly.length - 1];
    const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
    const FISCAL_YEARS = ['FY23', 'FY24', 'FY25', 'FY26', 'FY27', 'FY28'];
    const lastQIdx = QUARTERS.indexOf(last.quarter);
    const lastFYIdx = FISCAL_YEARS.indexOf(last.fy);

    const forecastPeriods = forecast.map((_, h) => {
      const qi = (lastQIdx + h + 1) % 4;
      const fi = lastFYIdx + Math.floor((lastQIdx + h + 1) / 4);
      return `${QUARTERS[qi]} ${FISCAL_YEARS[fi] || 'FY28'}`;
    });

    return {
      metric:     'Revenue',
      unit:       '₹ Cr',
      historical: historical.slice(-8), // show last 8 quarters
      smoothed:   smoothed.slice(-8).map(round2),
      forecastLabels: forecastPeriods,
      forecast:   forecast.map(round2),
      confidenceLow:  bands.map(b => round2(b.low)),
      confidenceHigh: bands.map(b => round2(b.high)),
      lastActual:  round2(lastActual),
      firstForecast: round2(firstForecast),
      growthPct:   round2(growthPct),
      trendDirection: trendVal >= 0 ? 'positive' : 'negative',
      method:      'Holt\'s Double Exponential Smoothing (α=0.35, β=0.2)',
    };
  } catch (e) {
    console.error('[ForecastEngine] Revenue forecast error:', e);
    return null;
  }
}

// ─── Sales TCV Forecast ───────────────────────────────────────────────────────
export function forecastSalesTCV(filters = {}) {
  try {
    const quarterly = getSalesTCVQuarterly(filters);
    if (quarterly.length < 4) return null;

    const historical = quarterly.map(d => ({ label: d.label, value: d.value }));
    const values = historical.map(d => d.value);

    const { smoothed, forecast, trendVal } = holtSmoothing(values, 0.3, 0.15, 2);
    const bands = computeConfidenceBand(values, smoothed, forecast);

    const lastActual = values[values.length - 1];
    const firstForecast = forecast[0];
    const growthPct = lastActual > 0 ? ((firstForecast - lastActual) / lastActual) * 100 : 0;

    return {
      metric:     'Sales TCV',
      unit:       '$ Mn',
      historical: historical.slice(-8),
      smoothed:   smoothed.slice(-8).map(v => round2(v)),
      forecastLabels: ['Next Period', 'Period +2'],
      forecast:   forecast.map(round2),
      confidenceLow:  bands.map(b => round2(b.low)),
      confidenceHigh: bands.map(b => round2(b.high)),
      lastActual:  round2(lastActual),
      firstForecast: round2(firstForecast),
      growthPct:   round2(growthPct),
      trendDirection: trendVal >= 0 ? 'positive' : 'negative',
      method:      'Holt\'s Double Exponential Smoothing',
    };
  } catch (e) {
    console.error('[ForecastEngine] Sales TCV forecast error:', e);
    return null;
  }
}

// ─── WON HC Forecast ──────────────────────────────────────────────────────────
export function forecastWonHC(filters = {}) {
  try {
    const weekly = getWonHCTrendData(filters);
    if (weekly.length < 4) return null;

    const historical = weekly.map(d => ({ label: d.weekDate, value: d.wonHC }));
    const values = historical.map(d => d.value);

    const { smoothed, forecast, trendVal } = holtSmoothing(values, 0.4, 0.2, 2);
    const bands = computeConfidenceBand(values, smoothed, forecast);

    const lastActual = values[values.length - 1];
    const firstForecast = forecast[0];
    const growthPct = lastActual > 0 ? ((firstForecast - lastActual) / lastActual) * 100 : 0;

    return {
      metric:     'WON HC',
      unit:       'Headcount',
      historical: historical,
      smoothed:   smoothed.map(v => round2(v)),
      forecastLabels: ['Next Week', 'Week +2'],
      forecast:   forecast.map(v => Math.round(v)),
      confidenceLow:  bands.map(b => Math.round(b.low)),
      confidenceHigh: bands.map(b => Math.round(b.high)),
      lastActual:  Math.round(lastActual),
      firstForecast: Math.round(firstForecast),
      growthPct:   round2(growthPct),
      trendDirection: trendVal >= 0 ? 'positive' : 'negative',
      method:      'Holt\'s Double Exponential Smoothing',
    };
  } catch (e) {
    console.error('[ForecastEngine] WON HC forecast error:', e);
    return null;
  }
}

// ─── Meetings Forecast ────────────────────────────────────────────────────────
export function forecastMeetings(filters = {}) {
  try {
    const monthly = getMeetingsTrendData(filters);
    if (monthly.length < 4) return null;

    const historical = monthly.map(d => ({ label: d.fullLabel || d.label, value: d.count }));
    const values = historical.map(d => d.value);

    const { smoothed, forecast, trendVal } = holtSmoothing(values, 0.35, 0.2, 2);
    const bands = computeConfidenceBand(values, smoothed, forecast);

    const lastActual = values[values.length - 1];
    const firstForecast = forecast[0];
    const growthPct = lastActual > 0 ? ((firstForecast - lastActual) / lastActual) * 100 : 0;

    return {
      metric:     'Client Meetings',
      unit:       'Meetings/Month',
      historical: historical,
      smoothed:   smoothed.map(v => round2(v)),
      forecastLabels: ['Next Month', 'Month +2'],
      forecast:   forecast.map(v => Math.round(v)),
      confidenceLow:  bands.map(b => Math.round(b.low)),
      confidenceHigh: bands.map(b => Math.round(b.high)),
      lastActual:  Math.round(lastActual),
      firstForecast: Math.round(firstForecast),
      growthPct:   round2(growthPct),
      trendDirection: trendVal >= 0 ? 'positive' : 'negative',
      method:      'Holt\'s Double Exponential Smoothing',
    };
  } catch (e) {
    console.error('[ForecastEngine] Meetings forecast error:', e);
    return null;
  }
}

// ─── Forecast explanation generator ──────────────────────────────────────────
export function explainForecast(result) {
  if (!result) return 'Insufficient data for forecast.';

  const { metric, unit, lastActual, firstForecast, growthPct, trendDirection, method } = result;
  const dir = growthPct >= 0 ? 'increase' : 'decrease';
  const sentimentWord = trendDirection === 'positive' ? 'supported by recent momentum' : 'reflecting recent headwinds';

  return `${metric} is projected to ${dir} by ${Math.abs(growthPct).toFixed(1)}% in the next period `
    + `(from ${unit === '₹ Cr' ? '₹' + lastActual?.toFixed(1) + ' Cr' : lastActual + ' ' + unit} to `
    + `${unit === '₹ Cr' ? '₹' + firstForecast?.toFixed(1) + ' Cr' : firstForecast + ' ' + unit}), `
    + `${sentimentWord}. Forecast computed using ${method} on the synthetic analytics dataset.`;
}

// ─── All forecasts (for forecast panel metric selector) ───────────────────────
export const FORECAST_METRICS = [
  { id: 'revenue',  label: 'Revenue',         fn: forecastRevenue },
  { id: 'sales_tcv', label: 'Sales TCV',      fn: forecastSalesTCV },
  { id: 'won_hc',  label: 'WON Headcount',    fn: forecastWonHC },
  { id: 'meetings', label: 'Client Meetings',  fn: forecastMeetings },
];
