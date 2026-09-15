// src/ai/engine/intentParser.js
// Maps a user's natural language question → structured intent + tool list
// Pure function — no side effects. Keyword-based matching.
// Future: replace matching logic with LLM intent classification.

import { INTENTS } from '../types/ai.types.js';

// ─── Keyword maps ─────────────────────────────────────────────────────────────
const KEYWORD_MAP = [
  // Revenue
  { keywords: ['revenue down', 'revenue decline', 'revenue falling', 'why.*revenue', 'revenue.*why', 'revenue.*drop'],
    intent: INTENTS.REVENUE_DECLINE, tools: ['getRevenueSummary', 'getRevenueByGeo', 'getRevenueByCluster'] },
  { keywords: ['best.*geo', 'geo.*best', 'best.*region', 'region.*best', 'top.*geography', 'geography.*best', 'best.*country', 'performing.*region', 'which region', 'which geo'],
    intent: INTENTS.BEST_GEOGRAPHY, tools: ['getRevenueByGeo'] },
  { keywords: ['worst.*geo', 'underperform.*region', 'worst.*region', 'below target.*geo', 'geo.*miss'],
    intent: INTENTS.WORST_GEOGRAPHY, tools: ['getRevenueByGeo'] },
  { keywords: ['revenue.*cluster', 'cluster.*revenue', 'cluster.*performance', 'which cluster'],
    intent: INTENTS.REVENUE_BY_CLUSTER, tools: ['getRevenueByCluster'] },
  { keywords: ['yoy', 'year over year', 'year-on-year', 'growth.*revenue', 'revenue.*growth'],
    intent: INTENTS.REVENUE_YOY, tools: ['getRevenueYoYComparison'] },
  { keywords: ['what changed', 'what.*different', 'compare.*quarter', 'prior quarter', 'last quarter', 'previous quarter'],
    intent: INTENTS.WHAT_CHANGED, tools: ['getRevenueSummary', 'getRevenueYoYComparison'] },
  { keywords: ['revenue summary', 'revenue status', 'revenue performance', 'how.*revenue', 'revenue.*doing', 'revenue.*today'],
    intent: INTENTS.REVENUE_SUMMARY, tools: ['getRevenueSummary', 'getRevenueByGeo'] },

  // Finance
  { keywords: ['margin down', 'margin decline', 'margin.*drop', 'why.*margin', 'margin.*why', 'gross margin.*low'],
    intent: INTENTS.MARGIN_DECLINE, tools: ['getFinanceSummary', 'getMarginAnalysis'] },
  { keywords: ['margin trend', 'margin.*trend', 'margin.*history', 'margin.*over time'],
    intent: INTENTS.MARGIN_TREND, tools: ['getMarginAnalysis'] },
  { keywords: ['realization', 'bta', 'billing rate', 'offshore rate'],
    intent: INTENTS.REALIZATION_SUMMARY, tools: ['getFinanceSummary', 'getRealizationTrend'] },
  { keywords: ['cost breakdown', 'cost.*structure', 'manpower', 'bought out', 'air fare'],
    intent: INTENTS.COST_BREAKDOWN, tools: ['getCostTrend'] },
  { keywords: ['finance summary', 'finance status', 'finance performance', 'financial.*performance', 'how.*finance', 'finance.*doing'],
    intent: INTENTS.FINANCE_SUMMARY, tools: ['getFinanceSummary'] },

  // Sales
  { keywords: ['large deal', 'big deal', 'large deal.*attention', 'deals.*need', 'focus.*deal', 'which deal'],
    intent: INTENTS.LARGE_DEALS, tools: ['getSalesLargeDeals'] },
  { keywords: ['pipeline', 'tcv.*pipeline', 'qualified.*pipeline', 'sales.*pipeline'],
    intent: INTENTS.PIPELINE_STATUS, tools: ['getSalesSummary', 'getPipelineAnalysis'] },
  { keywords: ['sales.*risk', 'pipeline.*risk', 'deal.*risk', 'revenue.*risk.*sales'],
    intent: INTENTS.SALES_RISK, tools: ['getSalesSummary', 'getSalesLargeDeals'] },
  { keywords: ['sales summary', 'sales status', 'sales performance', 'tcv', 'how.*sales', 'sales.*doing'],
    intent: INTENTS.SALES_SUMMARY, tools: ['getSalesSummary'] },

  // DEG / CSI
  { keywords: ['csi', 'customer satisfaction', 'customer score', 'satisfaction.*score', 'deg'],
    intent: INTENTS.DEG_SUMMARY, tools: ['getDegSummary', 'getCsiTrendAnalysis'] },
  { keywords: ['csi.*trend', 'satisfaction.*trend', 'csi.*over time', 'csi.*declining', 'csi.*improving'],
    intent: INTENTS.CSI_TREND, tools: ['getCsiTrendData', 'getCsiTrendAnalysis'] },
  { keywords: ['csi.*risk', 'satisfaction.*risk', 'low.*csi', 'csi.*warning'],
    intent: INTENTS.CSI_RISK, tools: ['getDegSummary'] },

  // RMG
  { keywords: ['won hc', 'won headcount', 'headcount', 'hc.*trend', 'rmg'],
    intent: INTENTS.RMG_SUMMARY, tools: ['getRmgSummary', 'getWonHCAnalysis'] },
  { keywords: ['won hc.*cluster', 'cluster.*won hc', 'which cluster.*hc', 'hc.*cluster'],
    intent: INTENTS.WON_HC_CLUSTER, tools: ['getWonHCByCluster'] },

  // Account
  { keywords: ['client meeting', 'meeting', 'client.*visit', 'customer.*engagement', 'engagement.*trend', 'client.*engagement'],
    intent: INTENTS.CLIENT_MEETINGS, tools: ['getMeetingsActivity', 'getMeetingsTrendAnalysis'] },
  { keywords: ['account.*performance', 'account.*revenue', 'top.*account', 'account.*summary', 'which account'],
    intent: INTENTS.ACCOUNT_SUMMARY, tools: ['getAccountSummary', 'getTopAccountsByMeetings'] },
  { keywords: ['engagement.*trend', 'engagement.*increasing', 'engagement.*declining', 'how.*engagement'],
    intent: INTENTS.ENGAGEMENT_TREND, tools: ['getMeetingsTrendAnalysis'] },

  // Cross-module
  { keywords: ['biggest risk', 'top risk', 'main risk', 'key risk', 'what.*risk', 'risk.*business', 'concern'],
    intent: INTENTS.BIGGEST_RISKS, tools: ['getAllModuleSummaries', 'getRiskSummary'] },
  { keywords: ['executive summary', 'executive brief', 'management summary', 'generate.*summary', 'business brief'],
    intent: INTENTS.EXECUTIVE_SUMMARY, tools: ['getAllModuleSummaries'] },
  { keywords: ['what.*focus', 'focus.*quarter', 'should.*focus', 'priority', 'focus.*management', 'what.*pay attention', 'pay attention'],
    intent: INTENTS.FOCUS_RECOMMENDATION, tools: ['getAllModuleSummaries', 'getRiskSummary'] },
  { keywords: ['overview', 'complete view', 'full view', 'entire business', 'all modules', 'everything'],
    intent: INTENTS.CROSS_MODULE_OVERVIEW, tools: ['getAllModuleSummaries'] },

  // AI features
  { keywords: ['forecast', 'predict', 'next quarter', 'projection', 'what.*happen'],
    intent: INTENTS.FORECAST_REVENUE, tools: ['getForecastableTimeSeries'] },
  { keywords: ['anomal', 'unusual', 'outlier', 'weird', 'strange', 'irregular'],
    intent: INTENTS.ANOMALY_CHECK, tools: ['getAnomalies'] },
];

// ─── Parse Intent ─────────────────────────────────────────────────────────────
export function parseIntent(question) {
  const q = question.toLowerCase().trim();
  const cleanPunctuation = q.replace(/[^a-z0-9\s]/g, ' ').trim();
  const words = cleanPunctuation.split(/\s+/).filter(Boolean);

  // 1. Conversational greetings (e.g. "hi", "hello", "hey", "good morning")
  const greetingWords = ['hi', 'hello', 'hey', 'howdy', 'greetings', 'hola', 'yo', 'sup'];
  if (greetingWords.includes(words[0]) && words.length <= 4) {
    return {
      intent: INTENTS.GREETING,
      tools: ['getRevenueSummary'],
      confidence: 'high',
      originalQuestion: question,
    };
  }
  if (
    cleanPunctuation.startsWith('good morning') ||
    cleanPunctuation.startsWith('good afternoon') ||
    cleanPunctuation.startsWith('good evening') ||
    cleanPunctuation === 'how are you' ||
    cleanPunctuation === 'how are you doing'
  ) {
    return {
      intent: INTENTS.GREETING,
      tools: ['getRevenueSummary'],
      confidence: 'high',
      originalQuestion: question,
    };
  }

  // 2. Capabilities / Identity / Help
  if (
    cleanPunctuation === 'help' ||
    cleanPunctuation.includes('what can you do') ||
    cleanPunctuation.includes('who are you') ||
    cleanPunctuation.includes('what are you') ||
    cleanPunctuation.includes('how does this work') ||
    cleanPunctuation.includes('how to use') ||
    cleanPunctuation.includes('what is this') ||
    cleanPunctuation.includes('capabilities') ||
    cleanPunctuation.includes('guide me') ||
    cleanPunctuation.includes('commands')
  ) {
    return {
      intent: INTENTS.CAPABILITIES,
      tools: ['getAllModuleSummaries'],
      confidence: 'high',
      originalQuestion: question,
    };
  }

  // 3. Appreciation / Gratitude
  if (
    cleanPunctuation.includes('thank you') ||
    cleanPunctuation.includes('thanks') ||
    cleanPunctuation.includes('thx') ||
    cleanPunctuation.includes('appreciate') ||
    cleanPunctuation.includes('good job') ||
    cleanPunctuation.includes('awesome') ||
    cleanPunctuation.includes('great work')
  ) {
    return {
      intent: INTENTS.APPRECIATION,
      tools: [],
      confidence: 'high',
      originalQuestion: question,
    };
  }

  // 4. Farewell
  if (words[0] === 'bye' || words[0] === 'goodbye' || cleanPunctuation.includes('see you later')) {
    return {
      intent: INTENTS.FAREWELL,
      tools: [],
      confidence: 'high',
      originalQuestion: question,
    };
  }

  for (const entry of KEYWORD_MAP) {
    const matched = entry.keywords.some(kw => {
      // If keyword contains regex chars, use regex match
      if (kw.includes('.*') || kw.includes('\\')) {
        try {
          return new RegExp(kw).test(q);
        } catch {
          return false;
        }
      }
      return q.includes(kw);
    });

    if (matched) {
      return {
        intent: entry.intent,
        tools: entry.tools,
        confidence: 'high',
        originalQuestion: question,
      };
    }
  }

  // Fallback: try to guess from single keywords
  if (q.includes('revenue'))  return { intent: INTENTS.REVENUE_SUMMARY,  tools: ['getRevenueSummary'],  confidence: 'low', originalQuestion: question };
  if (q.includes('finance'))  return { intent: INTENTS.FINANCE_SUMMARY,  tools: ['getFinanceSummary'],  confidence: 'low', originalQuestion: question };
  if (q.includes('sales'))    return { intent: INTENTS.SALES_SUMMARY,    tools: ['getSalesSummary'],    confidence: 'low', originalQuestion: question };
  if (q.includes('csi') || q.includes('deg')) return { intent: INTENTS.DEG_SUMMARY, tools: ['getDegSummary'], confidence: 'low', originalQuestion: question };
  if (q.includes('rmg') || q.includes('hc'))  return { intent: INTENTS.RMG_SUMMARY, tools: ['getRmgSummary'], confidence: 'low', originalQuestion: question };

  return {
    intent: INTENTS.UNKNOWN,
    tools: [],
    confidence: 'none',
    originalQuestion: question,
  };
}

// ─── Module focus detector ────────────────────────────────────────────────────
// Returns which module is most relevant to this question
export function detectModuleFocus(question) {
  const q = question.toLowerCase();
  if (q.includes('revenue') || q.includes('geo') || q.includes('cluster') || q.includes('yoy')) return 'revenue';
  if (q.includes('margin') || q.includes('finance') || q.includes('bta') || q.includes('realization') || q.includes('cost')) return 'finance';
  if (q.includes('sales') || q.includes('deal') || q.includes('pipeline') || q.includes('tcv')) return 'sales';
  if (q.includes('csi') || q.includes('satisfaction') || q.includes('deg')) return 'deg';
  if (q.includes('hc') || q.includes('headcount') || q.includes('rmg') || q.includes('won')) return 'rmg';
  if (q.includes('meeting') || q.includes('account') || q.includes('client') || q.includes('engagement')) return 'account';
  return null;
}
