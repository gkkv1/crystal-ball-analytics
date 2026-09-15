// src/ai/engine/alertEngine.js
// AI Business Watchtower — scans all modules and produces ranked, prioritized alerts
// Deterministic scoring: business_impact × deviation × persistence
// Each alert includes navigation action using existing App.jsx routing

import { detectAllAnomalies } from './anomalyEngine.js';
import { getAllModuleSummaries } from '../tools/crossModuleTools.js';
import { SEVERITY, MODULE_CONFIG } from '../types/ai.types.js';

// ─── Alert scoring ────────────────────────────────────────────────────────────
function computeAlertScore(anomaly) {
  const moduleWeight = MODULE_CONFIG[anomaly.module]?.weight || 0.5;
  const deviationScore = Math.min(1, Math.abs(anomaly.deviationPct || 0) / 30);
  const severityBonus = { critical: 0.4, high: 0.3, medium: 0.15, low: 0 }[anomaly.severity] || 0;
  return moduleWeight * deviationScore + severityBonus;
}

// ─── Convert anomaly to alert ─────────────────────────────────────────────────
function anomalyToAlert(anomaly) {
  const modConfig = MODULE_CONFIG[anomaly.module] || {};
  return {
    id:           anomaly.id,
    module:       anomaly.module,
    moduleLabel:  modConfig.label || anomaly.module,
    moduleColor:  modConfig.color || '#6B7280',
    severity:     anomaly.severity,
    title:        anomaly.title,
    summary:      anomaly.description,
    magnitude:    anomaly.magnitude,
    driver:       anomaly.driver,
    recommendedAction: anomaly.recommendedAction,
    navigateTo:   anomaly.navigateTo,
    filterPreset: anomaly.filterPreset || {},
    investigateLabel: `Investigate ${modConfig.label || anomaly.module}`,
    score:        computeAlertScore(anomaly),
  };
}

// ─── Generate positive signals ────────────────────────────────────────────────
function generatePositiveAlerts(allData) {
  const positives = [];

  if (!allData) return positives;

  // Revenue positive
  if (allData.revenue?.kpis?.aopAchievementPct >= 95) {
    positives.push({
      id:           'pos-revenue-ok',
      module:       'revenue',
      moduleLabel:  'Revenue Performance',
      moduleColor:  '#2563EB',
      severity:     SEVERITY.OK,
      title:        `Revenue at ${allData.revenue.kpis.aopAchievementPct.toFixed(1)}% of AOP`,
      summary:      'Revenue is meeting or exceeding the Annual Operating Plan.',
      magnitude:    'On track',
      driver:       null,
      recommendedAction: 'Sustain current trajectory.',
      navigateTo:   'revenue',
      filterPreset: {},
      investigateLabel: 'View Revenue',
      score:        0,
    });
  }

  // Account engagement positive
  if (allData.account?.meetings?.direction === 'increasing') {
    positives.push({
      id:           'pos-engagement-ok',
      module:       'account',
      moduleLabel:  'Account Management',
      moduleColor:  '#DC2626',
      severity:     SEVERITY.OK,
      title:        'Client Engagement Increasing',
      summary:      `Meeting activity up ${Math.abs(allData.account.meetings.changePct || 0).toFixed(1)}% — positive relationship signal.`,
      magnitude:    `+${Math.abs(allData.account.meetings.changePct || 0).toFixed(1)}%`,
      driver:       null,
      recommendedAction: 'Leverage increased engagement for upselling opportunities.',
      navigateTo:   'account',
      filterPreset: {},
      investigateLabel: 'View Accounts',
      score:        0,
    });
  }

  // CSI positive
  if (allData.deg?.kpis?.csiScore >= 93.5) {
    positives.push({
      id:           'pos-csi-ok',
      module:       'deg',
      moduleLabel:  'DEG Performance',
      moduleColor:  '#0891B2',
      severity:     SEVERITY.OK,
      title:        `CSI Score Healthy at ${allData.deg.kpis.csiScore.toFixed(1)}%`,
      summary:      'Customer satisfaction above threshold — strong delivery quality.',
      magnitude:    'Healthy',
      driver:       null,
      recommendedAction: 'Maintain current delivery standards.',
      navigateTo:   'deg',
      filterPreset: {},
      investigateLabel: 'View DEG',
      score:        0,
    });
  }

  return positives;
}

// ─── Main Alert Scanner ───────────────────────────────────────────────────────
export function generateAlerts(filters = {}) {
  const anomalies = detectAllAnomalies(filters);
  const alerts = anomalies.map(anomalyToAlert);

  // Sort by score descending
  alerts.sort((a, b) => b.score - a.score);

  // Add positive signals
  let allData = null;
  try {
    allData = getAllModuleSummaries(filters);
  } catch (e) {
    // Non-fatal
  }
  const positives = generatePositiveAlerts(allData);

  return {
    critical: alerts.filter(a => a.severity === SEVERITY.CRITICAL),
    high:     alerts.filter(a => a.severity === SEVERITY.HIGH),
    medium:   alerts.filter(a => a.severity === SEVERITY.MEDIUM),
    low:      alerts.filter(a => a.severity === SEVERITY.LOW),
    ok:       positives,
    all:      [...alerts, ...positives],
    summary: {
      criticalCount: alerts.filter(a => a.severity === SEVERITY.CRITICAL).length,
      highCount:     alerts.filter(a => a.severity === SEVERITY.HIGH).length,
      mediumCount:   alerts.filter(a => a.severity === SEVERITY.MEDIUM).length,
      totalIssues:   alerts.length,
      positiveCount: positives.length,
    },
  };
}
