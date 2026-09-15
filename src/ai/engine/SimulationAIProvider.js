// src/ai/engine/SimulationAIProvider.js
// Implements the AIProvider interface using deterministic simulation.
// Future: Replace with LLMAIProvider (Azure OpenAI / AWS Bedrock) without touching UI.
//
// Interface contract:
//   answerQuestion(question, filters, module) → AIResponse
//   explainAnomaly(anomaly) → string
//   explainForecast(forecastResult) → string
//   generateExecutiveSummary(filters) → ExecutiveBrief

import { parseIntent, detectModuleFocus } from './intentParser.js';
import { generateResponse } from './responseGenerator.js';
import { getAllModuleSummaries, getRiskSummary } from '../tools/crossModuleTools.js';
import { getRevenueSummary, getBestAndWorstGeo, getBestAndWorstCluster, getRevenueYoYComparison } from '../tools/revenueTools.js';
import { getFinanceSummary, getMarginAnalysis, getRealizationTrend, getCostTrend } from '../tools/financeTools.js';
import { getSalesSummary, getSalesLargeDeals, getPipelineAnalysis } from '../tools/salesTools.js';
import { getDegSummary, getCsiTrendAnalysis, getCsiTrendData } from '../tools/degTools.js';
import { getRmgSummary, getWonHCAnalysis, getWonHCByCluster } from '../tools/rmgTools.js';
import { getAccountSummary, getMeetingsTrendAnalysis, getTopAccountsByMeetings } from '../tools/accountTools.js';
import { explainForecast } from './forecastEngine.js';
import { generateExecutiveBrief } from './executiveBriefEngine.js';
import { INTENTS, MODULES } from '../types/ai.types.js';

// ─── Tool registry ────────────────────────────────────────────────────────────
// Maps tool name → function so the engine can call tools by name
function buildToolRegistry(filters) {
  const revF = { fiscalYear: 'FY27', quarter: 'All', bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All', ...filters };
  const dimF = { bgCluster: 'All', bg: 'All', subUnit: 'All', geo: 'All', groupClient: 'All', ...filters };
  const salesF = { ...revF, salesGeo: 'All', ai: 'All', newRenew: 'All' };

  return {
    getRevenueSummary:    () => getRevenueSummary(revF),
    getRevenueByGeo:      () => getBestAndWorstGeo(revF),
    getRevenueByCluster:  () => getBestAndWorstCluster(revF),
    getRevenueYoYComparison: () => getRevenueYoYComparison(revF),
    getFinanceSummary:    () => getFinanceSummary(dimF),
    getMarginAnalysis:    () => getMarginAnalysis(dimF),
    getRealizationTrend:  () => getRealizationTrend(dimF),
    getCostTrend:         () => getCostTrend(dimF),
    getSalesSummary:      () => getSalesSummary(salesF),
    getSalesLargeDeals:   () => getSalesLargeDeals(salesF),
    getPipelineAnalysis:  () => getPipelineAnalysis(salesF),
    getDegSummary:        () => getDegSummary(dimF),
    getCsiTrendAnalysis:  () => getCsiTrendAnalysis(dimF),
    getCsiTrendData:      () => getCsiTrendData(dimF),
    getRmgSummary:        () => getRmgSummary(dimF),
    getWonHCAnalysis:     () => getWonHCAnalysis(dimF),
    getWonHCByCluster:    () => getWonHCByCluster(dimF),
    getAccountSummary:    () => getAccountSummary(dimF),
    getMeetingsTrendAnalysis: () => getMeetingsTrendAnalysis(dimF),
    getTopAccountsByMeetings: () => getTopAccountsByMeetings(dimF),
    getAllModuleSummaries: () => getAllModuleSummaries(filters),
    getRiskSummary:       () => getRiskSummary(filters),
  };
}

// ─── Execute tools ────────────────────────────────────────────────────────────
function executeTools(toolNames, registry) {
  const results = {};
  toolNames.forEach(name => {
    if (registry[name]) {
      try {
        results[name] = registry[name]();
      } catch (e) {
        console.error(`[SimulationAIProvider] Tool ${name} failed:`, e);
        results[name] = null;
      }
    }
  });
  return results;
}

// ─── Build tool result summary ────────────────────────────────────────────────
// Assembles data from multiple tool calls into a unified object for responseGenerator
function buildToolResultSummary(intent, toolResults) {
  switch (intent) {
    case INTENTS.REVENUE_SUMMARY:
    case INTENTS.REVENUE_YOY:
      return { kpis: toolResults.getRevenueSummary };

    case INTENTS.REVENUE_DECLINE:
    case INTENTS.WHAT_CHANGED:
      return {
        kpis:    toolResults.getRevenueSummary,
        geo:     toolResults.getRevenueByGeo,
        cluster: toolResults.getRevenueByCluster,
      };

    case INTENTS.BEST_GEOGRAPHY:
    case INTENTS.WORST_GEOGRAPHY:
      return toolResults.getRevenueByGeo || {};

    case INTENTS.REVENUE_BY_CLUSTER:
      return { kpis: toolResults.getRevenueSummary, ...toolResults.getRevenueByCluster };

    case INTENTS.FINANCE_SUMMARY:
    case INTENTS.REALIZATION_SUMMARY:
    case INTENTS.COST_BREAKDOWN:
      return { kpis: toolResults.getFinanceSummary };

    case INTENTS.MARGIN_TREND:
    case INTENTS.MARGIN_DECLINE:
      return { margin: toolResults.getMarginAnalysis, kpis: toolResults.getFinanceSummary };

    case INTENTS.SALES_SUMMARY:
    case INTENTS.PIPELINE_STATUS:
    case INTENTS.SALES_RISK:
      return { kpis: toolResults.getSalesSummary, pipeline: toolResults.getPipelineAnalysis };

    case INTENTS.LARGE_DEALS:
      return toolResults.getSalesLargeDeals || [];

    case INTENTS.DEG_SUMMARY:
    case INTENTS.CSI_TREND:
    case INTENTS.CSI_RISK:
      return { kpis: toolResults.getDegSummary, csi: toolResults.getCsiTrendAnalysis };

    case INTENTS.RMG_SUMMARY:
    case INTENTS.WON_HC_TREND:
      return { kpis: toolResults.getRmgSummary, wonHC: toolResults.getWonHCAnalysis };

    case INTENTS.WON_HC_CLUSTER:
      return { kpis: toolResults.getRmgSummary };

    case INTENTS.ACCOUNT_SUMMARY:
    case INTENTS.CLIENT_MEETINGS:
    case INTENTS.ENGAGEMENT_TREND:
      return {
        kpis:     toolResults.getAccountSummary,
        meetings: toolResults.getMeetingsTrendAnalysis,
      };

    case INTENTS.CROSS_MODULE_OVERVIEW:
    case INTENTS.EXECUTIVE_SUMMARY:
      return toolResults.getAllModuleSummaries || {};

    case INTENTS.BIGGEST_RISKS:
    case INTENTS.FOCUS_RECOMMENDATION:
      return {
        risks: toolResults.getRiskSummary || [],
        all:   toolResults.getAllModuleSummaries,
      };

    default:
      return toolResults;
  }
}

// ─── SimulationAIProvider ─────────────────────────────────────────────────────
export const SimulationAIProvider = {
  mode: 'ENTERPRISE_AI',

  /**
   * Answer a natural language question using the analytics data.
   * @param {string} question
   * @param {object} filters - current dashboard filters
   * @param {string} currentModule - which module the user is viewing
   * @returns {object} AIResponse
   */
  answerQuestion(question, filters = {}, currentModule = null) {
    const parsed  = parseIntent(question);
    const registry = buildToolRegistry(filters);

    // Use current module focus as context hint for generic questions
    let { intent, tools } = parsed;
    if (intent === INTENTS.UNKNOWN && currentModule) {
      const moduleIntentMap = {
        revenue: INTENTS.REVENUE_SUMMARY,
        finance: INTENTS.FINANCE_SUMMARY,
        sales:   INTENTS.SALES_SUMMARY,
        deg:     INTENTS.DEG_SUMMARY,
        rmg:     INTENTS.RMG_SUMMARY,
        account: INTENTS.ACCOUNT_SUMMARY,
      };
      intent = moduleIntentMap[currentModule] || INTENTS.UNKNOWN;
      tools  = ['getAllModuleSummaries'];
    }

    const toolResults = executeTools(tools, registry);
    const summary     = buildToolResultSummary(intent, toolResults);
    const response    = generateResponse(intent, summary, question);

    return {
      question,
      intent,
      confidence: parsed.confidence,
      ...response,
      toolsUsed: tools,
      filters,
      currentModule,
    };
  },

  /**
   * Generate natural language explanation for a detected anomaly.
   */
  explainAnomaly(anomaly) {
    if (!anomaly) return 'No anomaly data provided.';
    const { title, description, driver, magnitude, recommendedAction, severity, affectedDimension } = anomaly;

    return [
      `**What happened:** ${description}`,
      `**Magnitude:** ${magnitude}`,
      `**Affected dimension:** ${affectedDimension}`,
      driver ? `**Likely driver:** ${driver}` : null,
      `**Recommended action:** ${recommendedAction}`,
    ].filter(Boolean).join('\n\n');
  },

  /**
   * Generate explanation for a forecast result.
   */
  explainForecast(forecastResult) {
    return explainForecast(forecastResult);
  },

  /**
   * Generate structured executive brief.
   */
  generateExecutiveSummary(filters = {}) {
    return generateExecutiveBrief(filters);
  },
};

export default SimulationAIProvider;
