// src/ai/types/ai.types.js
// Shared constants, intent definitions, and conceptual AIProvider interface
// This file documents the architecture — SimulationAIProvider implements these contracts.

// ─── AI Response Types ───────────────────────────────────────────────────────
export const AI_RESPONSE_TYPE = {
  TEXT:         'text',
  KPI:          'kpi',
  INSIGHT_CARD: 'insight_card',
  RECOMMENDATION:'recommendation',
  NAV_ACTION:   'nav_action',
  CHART_REF:    'chart_ref',
  ANOMALY:      'anomaly',
  FORECAST:     'forecast',
  MULTI:        'multi',
};

// ─── Intent Registry ─────────────────────────────────────────────────────────
export const INTENTS = {
  // Revenue
  REVENUE_SUMMARY:          'revenue_summary',
  REVENUE_DECLINE:          'revenue_decline',
  BEST_GEOGRAPHY:           'best_geography',
  WORST_GEOGRAPHY:          'worst_geography',
  REVENUE_BY_CLUSTER:       'revenue_by_cluster',
  REVENUE_YOY:              'revenue_yoy',
  WHAT_CHANGED:             'what_changed',

  // Finance
  FINANCE_SUMMARY:          'finance_summary',
  MARGIN_TREND:             'margin_trend',
  MARGIN_DECLINE:           'margin_decline',
  REALIZATION_SUMMARY:      'realization_summary',
  COST_BREAKDOWN:           'cost_breakdown',

  // Sales
  SALES_SUMMARY:            'sales_summary',
  LARGE_DEALS:              'large_deals',
  PIPELINE_STATUS:          'pipeline_status',
  SALES_RISK:               'sales_risk',

  // DEG
  DEG_SUMMARY:              'deg_summary',
  CSI_TREND:                'csi_trend',
  CSI_RISK:                 'csi_risk',

  // RMG
  RMG_SUMMARY:              'rmg_summary',
  WON_HC_TREND:             'won_hc_trend',
  WON_HC_CLUSTER:           'won_hc_cluster',

  // Account
  ACCOUNT_SUMMARY:          'account_summary',
  CLIENT_MEETINGS:          'client_meetings',
  ENGAGEMENT_TREND:         'engagement_trend',

  // Cross-module
  CROSS_MODULE_OVERVIEW:    'cross_module_overview',
  BIGGEST_RISKS:            'biggest_risks',
  EXECUTIVE_SUMMARY:        'executive_summary',
  FOCUS_RECOMMENDATION:     'focus_recommendation',

  // AI features
  FORECAST_REVENUE:         'forecast_revenue',
  ANOMALY_CHECK:            'anomaly_check',

  // Conversational & System
  GREETING:                 'greeting',
  CAPABILITIES:             'capabilities',
  APPRECIATION:             'appreciation',
  FAREWELL:                 'farewell',

  // Unknown
  UNKNOWN:                  'unknown',
};

// ─── Severity Levels ─────────────────────────────────────────────────────────
export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH:     'high',
  MEDIUM:   'medium',
  LOW:      'low',
  OK:       'ok',
};

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)', icon: '🔴' },
  high:     { label: 'High',     color: '#EA580C', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.25)', icon: '🟠' },
  medium:   { label: 'Medium',   color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', icon: '🟡' },
  low:      { label: 'Low',      color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.25)', icon: '🟢' },
  ok:       { label: 'OK',       color: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.2)',  icon: '✅' },
};

// ─── Module Registry ─────────────────────────────────────────────────────────
export const MODULES = {
  REVENUE: 'revenue',
  FINANCE: 'finance',
  SALES:   'sales',
  DEG:     'deg',
  RMG:     'rmg',
  ACCOUNT: 'account',
};

export const MODULE_CONFIG = {
  revenue: { label: 'Revenue Performance', weight: 1.0,  color: '#2563EB' },
  finance: { label: 'Finance Performance', weight: 0.9,  color: '#059669' },
  sales:   { label: 'Sales Performance',   weight: 0.8,  color: '#7C3AED' },
  deg:     { label: 'DEG Performance',     weight: 0.65, color: '#0891B2' },
  rmg:     { label: 'RMG Performance',     weight: 0.6,  color: '#D97706' },
  account: { label: 'Account Management',  weight: 0.7,  color: '#DC2626' },
};

// ─── Demo Scenarios ──────────────────────────────────────────────────────────
export const DEMO_SCENARIOS = [
  {
    id: 'revenue_downturn',
    label: 'Revenue Downturn',
    description: 'Explore Europe underperformance driving overall revenue shortfall',
    preloadQuestion: 'Why is revenue declining this quarter?',
    icon: '📉',
  },
  {
    id: 'sales_pipeline_risk',
    label: 'Sales Pipeline Risk',
    description: 'Large deals at risk and declining qualified pipeline',
    preloadQuestion: 'Which large deals need my attention?',
    icon: '⚠️',
  },
  {
    id: 'finance_margin_risk',
    label: 'Finance Margin Risk',
    description: 'Gross margin erosion across Hi-Tech cluster',
    preloadQuestion: 'Why is gross margin declining?',
    icon: '💰',
  },
  {
    id: 'customer_engagement',
    label: 'Customer Engagement Growth',
    description: 'Client meeting activity increasing across clusters',
    preloadQuestion: 'How is customer engagement trending?',
    icon: '🤝',
  },
  {
    id: 'positive_forecast',
    label: 'Positive Revenue Forecast',
    description: 'Strong growth trajectory projected for next two quarters',
    preloadQuestion: 'Forecast next quarter revenue.',
    icon: '🚀',
  },
];

// ─── Suggested Prompts (shown in Copilot) ────────────────────────────────────
export const SUGGESTED_PROMPTS = [
  'Why is revenue declining?',
  'Which region is performing best?',
  'Show me the biggest risks.',
  'Which large deals need attention?',
  'How is customer engagement trending?',
  'Give me an executive summary.',
  'What should management focus on?',
  'Forecast next quarter revenue.',
  'Why did gross margin decline?',
  'Which cluster has the highest WON HC?',
];

// ─── AIProvider Interface (conceptual) ───────────────────────────────────────
// Future LLMAIProvider must implement these same methods.
// SimulationAIProvider is the current implementation.
//
// interface AIProvider {
//   answerQuestion(question: string, filters: object, module: string): Promise<AIResponse>
//   explainAnomaly(anomaly: Anomaly): string
//   explainForecast(result: ForecastResult): string
//   generateExecutiveSummary(filters: object): ExecutiveBrief
// }
