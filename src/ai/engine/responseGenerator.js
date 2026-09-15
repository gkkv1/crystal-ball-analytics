// src/ai/engine/responseGenerator.js
// Converts tool output into concise, data-backed executive-style AI responses.
// All responses include REAL numbers from the synthetic dataset.
// Future: replace template logic with LLM call using tool outputs as context.

import { INTENTS } from '../types/ai.types.js';

function fmt(n, dec = 1) {
  if (n == null) return 'N/A';
  return Math.abs(n).toFixed(dec);
}
function fmtCr(n) {
  if (n == null) return 'N/A';
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
  return `₹${n.toFixed(1)} Cr`;
}
function fmtPct(n, dec = 1) {
  if (n == null) return 'N/A';
  return `${n >= 0 ? '+' : ''}${n.toFixed(dec)}%`;
}
function trend(pct) {
  return pct >= 2 ? 'strong growth' : pct >= 0 ? 'modest growth' : pct >= -5 ? 'mild decline' : 'significant decline';
}

// ─── Response generators per intent ──────────────────────────────────────────

function generateRevenueSummary(data) {
  const { kpis } = data;
  if (!kpis) return { text: 'No revenue data available for current filter context.', actions: [] };

  const { actualRevenue, aop, aopAchievementPct, targetAchievementPct, yoyGrowthPct, gapWithAOP } = kpis;

  const sentiment = aopAchievementPct >= 100 ? 'exceeding' : aopAchievementPct >= 90 ? 'on track toward' : 'below';
  const gapDir = gapWithAOP >= 0 ? 'above' : 'below';
  const gapAbs = Math.abs(gapWithAOP);

  const lines = [
    `Revenue stands at **${fmtCr(actualRevenue)}**, ${sentiment} the AOP target of ${fmtCr(aop)} at **${fmt(aopAchievementPct)}% achievement**.`,
    `The current gap vs AOP is **${fmtCr(gapAbs)} ${gapDir} plan**.`,
    yoyGrowthPct != null
      ? `Year-over-year, revenue shows **${fmtPct(yoyGrowthPct)} growth** — ${trend(yoyGrowthPct)}.`
      : null,
  ].filter(Boolean).join(' ');

  const actions = aopAchievementPct < 90
    ? [{ label: 'View Revenue Dashboard', navigate: 'revenue', icon: '📊' }]
    : [];

  return { text: lines, actions, kpis: [
    { label: 'Revenue', value: fmtCr(actualRevenue) },
    { label: 'AOP Achievement', value: `${fmt(aopAchievementPct)}%`, sentiment: aopAchievementPct >= 95 ? 'positive' : 'negative' },
    { label: 'YoY Growth', value: fmtPct(yoyGrowthPct), sentiment: (yoyGrowthPct || 0) >= 0 ? 'positive' : 'negative' },
  ]};
}

function generateRevenueDecline(data) {
  const { kpis, geo, cluster } = data;
  if (!kpis) return { text: 'No revenue data available.', actions: [] };

  const worstGeo     = geo?.worst;
  const worstCluster = cluster?.worst;
  const aopPct       = kpis.aopAchievementPct || 0;
  const avgPct       = aopPct;

  let text = `Revenue is at **${fmt(aopPct)}% of AOP** target. `;

  if (worstGeo && worstGeo.aopPct < aopPct - 5) {
    text += `The primary drag is **${worstGeo.geo}**, which is at **${fmt(worstGeo.aopPct)}% of AOP** — ${fmt(aopPct - worstGeo.aopPct)}pp below the portfolio average. `;
  }

  if (worstCluster && worstCluster.aopPct < aopPct - 3) {
    text += `At cluster level, **${worstCluster.cluster}** is the weakest at **${fmt(worstCluster.aopPct)}%**, contributing to the shortfall.`;
  }

  const actions = [];
  if (worstGeo) {
    actions.push({
      label: `View ${worstGeo.geo} Performance`,
      navigate: 'revenue',
      filterKey: 'geo',
      filterValue: worstGeo.geo,
      icon: '🔍',
    });
  }

  return { text, actions, highlight: worstGeo?.geo };
}

function generateBestGeo(data) {
  const { best, worst, all } = data;
  if (!best) return { text: 'No geographic data available.', actions: [] };

  const text = `**${best.geo}** leads geography performance at **${fmt(best.aopPct)}% of AOP** with revenue of ${fmtCr(best.actual)}. `
    + (worst && worst.aopPct < best.aopPct - 10
      ? `By contrast, **${worst.geo}** is the weakest at **${fmt(worst.aopPct)}%** — ${fmt(best.aopPct - worst.aopPct)}pp behind the leader.`
      : `All geographies are within ${fmt(best.aopPct - (worst?.aopPct || 0))}pp of each other.`
    );

  return {
    text,
    actions: [{ label: `Focus on ${best.geo}`, navigate: 'revenue', filterKey: 'geo', filterValue: best.geo, icon: '🌍' }],
    kpis: all?.slice(0, 4).map(g => ({ label: g.geo, value: `${fmt(g.aopPct)}%`, sentiment: g.aopPct >= 95 ? 'positive' : g.aopPct >= 80 ? 'neutral' : 'negative' })),
  };
}

function generateFinanceSummary(data) {
  const kpis = data.kpis || data;
  if (!kpis) return { text: 'No finance data available.', actions: [] };

  const { grossMarginPct, offshoreRealizAvg, onsiteRealizAvg, adjustedBTAAvg } = kpis;

  const marginSentiment = grossMarginPct >= 42 ? 'healthy' : grossMarginPct >= 38 ? 'acceptable' : 'under pressure';

  return {
    text: `Gross margin stands at **${fmt(grossMarginPct)}%** — ${marginSentiment}. `
      + `Offshore realization averages **₹${offshoreRealizAvg?.toFixed(1)}K/PM** vs onsite at **₹${onsiteRealizAvg?.toFixed(1)}K/PM**. `
      + `Adjusted BTA is at **${fmt(adjustedBTAAvg)}%**.`,
    actions: [{ label: 'View Finance Dashboard', navigate: 'finance', icon: '💹' }],
    kpis: [
      { label: 'Gross Margin', value: `${fmt(grossMarginPct)}%`, sentiment: grossMarginPct >= 40 ? 'positive' : 'negative' },
      { label: 'Offshore Realiz.', value: `₹${offshoreRealizAvg?.toFixed(1)}K` },
      { label: 'Adjusted BTA', value: `${fmt(adjustedBTAAvg)}%`, sentiment: adjustedBTAAvg >= 100 ? 'positive' : 'negative' },
    ],
  };
}

function generateMarginDecline(data) {
  const margin = data.margin || data;
  if (!margin) return { text: 'No margin data available.', actions: [] };

  const { current, prior, change, direction } = margin;
  const dir = change < 0 ? 'declined' : 'improved';

  return {
    text: `Gross margin has **${dir} by ${fmt(Math.abs(change))}pp** from ${fmt(prior)}% to **${fmt(current)}%**. `
      + (change < -1.5
        ? `This represents a meaningful erosion that warrants attention on cost controls, particularly manpower and bought-out components.`
        : `The decline is modest but worth monitoring.`),
    actions: [{ label: 'View Margin Trend', navigate: 'finance', icon: '📉' }],
  };
}

function generateSalesSummary(data) {
  const kpis = data.kpis || data;
  if (!kpis) return { text: 'No sales data available.', actions: [] };

  const { tcvAOP, tcvWon, achievedPct, tcvPipeline, tcvQual } = kpis;

  const sentiment = achievedPct >= 100 ? 'ahead of' : achievedPct >= 80 ? 'tracking toward' : 'behind';

  return {
    text: `TCV Won stands at **$${tcvWon?.toFixed(1)}M** — ${sentiment} the AOP of $${tcvAOP?.toFixed(1)}M at **${fmt(achievedPct)}% achievement**. `
      + `Active pipeline is **$${tcvPipeline?.toFixed(1)}M** with **$${tcvQual?.toFixed(1)}M** qualified.`,
    actions: [{ label: 'View Sales Dashboard', navigate: 'sales', icon: '📈' }],
    kpis: [
      { label: 'TCV Won', value: `$${tcvWon?.toFixed(1)}M`, sentiment: achievedPct >= 90 ? 'positive' : 'negative' },
      { label: 'AOP Achievement', value: `${fmt(achievedPct)}%`, sentiment: achievedPct >= 90 ? 'positive' : 'negative' },
      { label: 'Pipeline', value: `$${tcvPipeline?.toFixed(1)}M` },
    ],
  };
}

function generateLargeDeals(data) {
  const deals = Array.isArray(data) ? data : data.deals || [];
  if (!deals.length) return { text: 'No large deals found in the current context.', actions: [] };

  const top3 = deals.slice(0, 3);
  const atRisk = deals.filter(d => d.status === 'Active' && d.stage !== 'Won').slice(0, 2);

  const text = `Found **${deals.length} large deals** (≥$40M). Top deal: **${top3[0]?.opportunityName?.slice(0, 45)}** at $${top3[0]?.tcv?.toFixed(0)}M. `
    + (atRisk.length
      ? `**${atRisk.length} active deal(s)** require attention: ${atRisk.map(d => d.opportunityName?.slice(0, 30)).join('; ')}.`
      : '');

  return {
    text,
    actions: [{ label: 'View Large Deals', navigate: 'sales', icon: '🎯' }],
    kpis: top3.map(d => ({ label: d.opportunityName?.slice(0, 25) + '...', value: `$${d.tcv?.toFixed(0)}M`, sentiment: d.stage === 'Won' ? 'positive' : 'neutral' })),
  };
}

function generateDegSummary(data) {
  const kpis = data.kpis || data;
  if (!kpis) return { text: 'No DEG data available.', actions: [] };

  const { csiScore, csi100Pct, lowCsiPct, totalProjects } = kpis;
  const csiSentiment = csiScore >= 94 ? 'strong' : csiScore >= 90 ? 'acceptable' : 'concerning';

  return {
    text: `CSI score is **${fmt(csiScore, 1)}%** across **${totalProjects} projects** — ${csiSentiment} customer experience. `
      + `${fmt(csi100Pct, 1)}% of projects achieved 100% CSI. Low-CSI projects represent **${fmt(lowCsiPct, 1)}%** of the portfolio.`,
    actions: [{ label: 'View DEG Dashboard', navigate: 'deg', icon: '⭐' }],
    kpis: [
      { label: 'CSI Score', value: `${fmt(csiScore)}%`, sentiment: csiScore >= 93 ? 'positive' : 'negative' },
      { label: 'CSI 100%', value: `${fmt(csi100Pct)}%`, sentiment: 'positive' },
      { label: 'Low CSI', value: `${fmt(lowCsiPct)}%`, sentiment: lowCsiPct < 5 ? 'positive' : 'negative' },
    ],
  };
}

function generateRmgSummary(data) {
  const kpis = data.kpis || data;
  if (!kpis) return { text: 'No RMG data available.', actions: [] };

  const { currentQuarterAddition, currentWeekAddition, totalWonHC } = kpis;

  return {
    text: `WON HC this quarter: **${currentQuarterAddition?.toFixed(0)} headcount**. Current week addition: **${currentWeekAddition?.toFixed(0)} HC**. Total WON HC in scope: **${totalWonHC?.toFixed(0)} HC**.`,
    actions: [{ label: 'View RMG Dashboard', navigate: 'rmg', icon: '👥' }],
    kpis: [
      { label: 'QTD WON HC', value: `${currentQuarterAddition?.toFixed(0)}`, sentiment: 'neutral' },
      { label: 'This Week', value: `${currentWeekAddition?.toFixed(0)} HC` },
    ],
  };
}

function generateAccountSummary(data) {
  const kpis = data.kpis || data;
  const meetings = data.meetings;
  if (!kpis) return { text: 'No account data available.', actions: [] };

  const { totalRevenue, aopAchievement, activeAccounts, avgDegScore } = kpis;
  const engDir = meetings?.direction;
  const engTxt = engDir ? `, with client meetings **${engDir}** ${meetings?.changePct ? `(${fmtPct(meetings.changePct)})` : ''}` : '';

  return {
    text: `Active accounts: **${activeAccounts}** with combined revenue of ${fmtCr(totalRevenue)} at **${fmt(aopAchievement)}% AOP achievement**. Average DEG score: **${avgDegScore?.toFixed(1)}%**${engTxt}.`,
    actions: [{ label: 'View Account Dashboard', navigate: 'account', icon: '🏢' }],
    kpis: [
      { label: 'Active Accounts', value: `${activeAccounts}` },
      { label: 'AOP Achievement', value: `${fmt(aopAchievement)}%`, sentiment: aopAchievement >= 90 ? 'positive' : 'negative' },
      { label: 'Avg DEG Score', value: `${avgDegScore?.toFixed(1)}%`, sentiment: 'positive' },
    ],
  };
}

function generateCrossModuleOverview(data) {
  if (!data) return { text: 'Unable to retrieve cross-module data.', actions: [] };

  const lines = [];

  if (data.revenue?.kpis) {
    const aop = data.revenue.kpis.aopAchievementPct;
    lines.push(`**Revenue** ${aop >= 95 ? '✅' : '⚠️'}: ${fmt(aop)}% of AOP — ${aop >= 95 ? 'on track' : 'below target'}.`);
  }
  if (data.finance?.kpis) {
    const gm = data.finance.kpis.grossMarginPct;
    lines.push(`**Finance** ${gm >= 40 ? '✅' : '⚠️'}: Gross margin at ${fmt(gm)}%.`);
  }
  if (data.sales?.kpis) {
    const pct = data.sales.kpis.achievedPct;
    lines.push(`**Sales** ${pct >= 80 ? '✅' : '⚠️'}: TCV achievement at ${fmt(pct)}%.`);
  }
  if (data.deg?.kpis) {
    const csi = data.deg.kpis.csiScore;
    lines.push(`**DEG** ${csi >= 93 ? '✅' : '⚠️'}: CSI score ${fmt(csi, 1)}%.`);
  }
  if (data.rmg?.kpis) {
    const hc = data.rmg.kpis.currentQuarterAddition;
    lines.push(`**RMG** ✅: ${hc?.toFixed(0)} WON HC this quarter.`);
  }
  if (data.account?.meetings) {
    const dir = data.account.meetings.direction;
    lines.push(`**Account** ${dir === 'increasing' ? '✅' : '➡️'}: Client engagement ${dir}.`);
  }

  return {
    text: lines.join('\n\n'),
    actions: [],
    isMultiLine: true,
  };
}

function generateBiggestRisks(data) {
  const risks = Array.isArray(data) ? data : data.risks || [];
  if (!risks.length) {
    return { text: 'No significant risks detected across all modules. Business metrics are within acceptable thresholds.', actions: [] };
  }

  const lines = risks.slice(0, 4).map((r, i) => `${i + 1}. **${r.title}** (${r.module}): ${r.detail}`);
  const text = `**${risks.length} business risk(s) detected:**\n\n${lines.join('\n\n')}`;

  return {
    text,
    actions: risks.slice(0, 2).map(r => ({
      label: `Investigate ${r.module.charAt(0).toUpperCase() + r.module.slice(1)}`,
      navigate: r.module,
      icon: '🔍',
    })),
    isMultiLine: true,
  };
}

function generateFocusRecommendation(data) {
  const risks = Array.isArray(data) ? data : data.risks || [];
  const all = data.all;

  const highRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high');

  let text = '**Management focus recommendation for this period:**\n\n';

  if (highRisks.length > 0) {
    text += `🔴 **Immediate attention required:** ${highRisks.map(r => r.title).join('; ')}.\n\n`;
  }

  // Add positive signals
  if (all?.account?.meetings?.direction === 'increasing') {
    text += `✅ **Positive signal:** Client engagement is increasing — maintain momentum.\n\n`;
  }

  if (risks.length === 0) {
    text += '✅ Business metrics are healthy across all modules. Focus on sustaining growth.';
  } else {
    text += `📌 **Priority actions:** Review ${highRisks.slice(0, 2).map(r => r.module).join(' and ')} performance and identify corrective measures.`;
  }

  return { text, actions: [], isMultiLine: true };
}

function generateForecastResponse(data) {
  return {
    text: 'Opening the **Predictive Forecast** panel where you can view revenue, sales TCV, and WON HC projections with confidence bands.',
    actions: [{ label: 'Open Forecast Panel', tab: 'forecast', icon: 'trending-up' }],
  };
}

function generateGreeting(data) {
  const kpis = data?.kpis;
  return {
    text: `Hello! I am your **Enterprise AI Analytics Copilot**. I have live, real-time intelligence across Revenue, Finance, Sales, DEG, RMG, and Account Management.\n\nAsk me any analytical question, request an executive summary, or jump directly into any business dashboard below:`,
    isMultiLine: true,
    kpis: kpis ? [
      { label: 'Revenue', value: fmtCr(kpis.actualRevenue) },
      { label: 'AOP Achieved', value: `${fmt(kpis.aopAchievementPct)}%`, sentiment: kpis.aopAchievementPct >= 95 ? 'positive' : 'negative' },
      { label: 'YoY Growth', value: fmtPct(kpis.yoyGrowthPct), sentiment: (kpis.yoyGrowthPct || 0) >= 0 ? 'positive' : 'negative' },
    ] : null,
    actions: [
      { label: 'View Revenue Dashboard', navigate: 'revenue', icon: 'bar-chart' },
      { label: 'Executive Brief', tab: 'brief', icon: 'file-text' },
      { label: 'Predictive Forecast', tab: 'forecast', icon: 'trending-up' },
      { label: 'Risk Watchtower', tab: 'alerts', icon: 'shield' },
    ],
    suggestions: [
      'Give me an executive summary.',
      'Why is revenue declining?',
      'Show me the biggest risks.',
      'Which large deals need attention?',
      'Forecast next quarter revenue.',
    ],
  };
}

function generateCapabilities() {
  return {
    text: `Here are my core enterprise analytical capabilities across your business:\n\n` +
      `• **Revenue Intelligence:** Track AOP achievement, quarterly variance, geographic trends, and cluster breakdowns.\n` +
      `• **Finance & Margin Analytics:** Monitor gross margin, realization rates (onsite vs offshore), adjusted BTA, and cost breakdowns.\n` +
      `• **Sales Pipeline:** Identify deals at risk, evaluate pipeline coverage, and inspect large deal health.\n` +
      `• **Customer Satisfaction (DEG):** Track CSI metrics, spot accounts with declining satisfaction, and trigger remediation.\n` +
      `• **RMG & Talent Allocation:** Monitor WON headcount, weekly trends, and cluster demand.\n` +
      `• **Account Engagement:** Track executive client meetings and engagement momentum.\n\n` +
      `You can also use the AI tabs above to run automated **Anomaly Detection**, generate **Predictive Forecasts**, or build a 5-slide **PowerPoint Presentation** (.pptx).`,
    isMultiLine: true,
    actions: [
      { label: 'View Revenue Dashboard', navigate: 'revenue', icon: 'bar-chart' },
      { label: 'View Finance Dashboard', navigate: 'finance', icon: 'dollar-sign' },
      { label: 'View Sales Dashboard', navigate: 'sales', icon: 'target' },
      { label: 'Executive Briefing', tab: 'brief', icon: 'file-text' },
    ],
    suggestions: [
      'Give me an executive summary.',
      'What should management focus on?',
      'Show me the biggest risks.',
    ],
  };
}

function generateAppreciation() {
  return {
    text: `You're very welcome! I'm here to support your executive decision-making. Would you like to dive deeper into any specific cluster, run a forecast, or export an executive presentation?`,
    actions: [
      { label: 'Export PPT Presentation', tab: 'ppt', icon: 'presentation' },
      { label: 'View Forecast', tab: 'forecast', icon: 'trending-up' },
    ],
    suggestions: [
      'Give me an executive summary.',
      'Forecast next quarter revenue.',
      'Show me the biggest risks.',
    ],
  };
}

function generateFarewell() {
  return {
    text: `Goodbye! Feel free to return anytime for real-time executive analytics, anomaly monitoring, or board-ready briefing materials. Have a great day!`,
    actions: [],
    suggestions: [
      'Give me an executive summary.',
    ],
  };
}

function generateUnknown(question) {
  return {
    text: `I'm analyzing your request against our cross-functional datasets. To get the most precise insights, try asking about **revenue performance**, **gross margin erosion**, **sales pipeline**, **large deals**, **CSI satisfaction**, **WON headcount**, or **client meetings**.\n\nYou can also explore the quick navigation shortcuts below:`,
    isMultiLine: true,
    actions: [
      { label: 'View Revenue Dashboard', navigate: 'revenue', icon: 'bar-chart' },
      { label: 'Executive Brief', tab: 'brief', icon: 'file-text' },
      { label: 'Detect Anomalies', tab: 'anomalies', icon: 'alert-triangle' },
    ],
    suggestions: [
      'What is the revenue performance?',
      'Show me the biggest risks.',
      'Which region is performing best?',
      'Which large deals need attention?',
    ],
  };
}

// ─── Main Response Generator ──────────────────────────────────────────────────
export function generateResponse(intent, toolResults, originalQuestion) {
  try {
    switch (intent) {
      case INTENTS.GREETING:              return generateGreeting(toolResults);
      case INTENTS.CAPABILITIES:          return generateCapabilities();
      case INTENTS.APPRECIATION:          return generateAppreciation();
      case INTENTS.FAREWELL:              return generateFarewell();
      case INTENTS.REVENUE_SUMMARY:       return generateRevenueSummary(toolResults);
      case INTENTS.REVENUE_DECLINE:       return generateRevenueDecline(toolResults);
      case INTENTS.WHAT_CHANGED:          return generateRevenueDecline(toolResults);
      case INTENTS.BEST_GEOGRAPHY:        return generateBestGeo(toolResults);
      case INTENTS.WORST_GEOGRAPHY:       return generateBestGeo(toolResults);
      case INTENTS.REVENUE_BY_CLUSTER:    return generateRevenueSummary(toolResults);
      case INTENTS.REVENUE_YOY:           return generateRevenueSummary(toolResults);
      case INTENTS.FINANCE_SUMMARY:       return generateFinanceSummary(toolResults);
      case INTENTS.MARGIN_TREND:          return generateMarginDecline(toolResults);
      case INTENTS.MARGIN_DECLINE:        return generateMarginDecline(toolResults);
      case INTENTS.REALIZATION_SUMMARY:   return generateFinanceSummary(toolResults);
      case INTENTS.COST_BREAKDOWN:        return generateFinanceSummary(toolResults);
      case INTENTS.SALES_SUMMARY:         return generateSalesSummary(toolResults);
      case INTENTS.LARGE_DEALS:           return generateLargeDeals(toolResults);
      case INTENTS.PIPELINE_STATUS:       return generateSalesSummary(toolResults);
      case INTENTS.SALES_RISK:            return generateSalesSummary(toolResults);
      case INTENTS.DEG_SUMMARY:           return generateDegSummary(toolResults);
      case INTENTS.CSI_TREND:             return generateDegSummary(toolResults);
      case INTENTS.CSI_RISK:              return generateDegSummary(toolResults);
      case INTENTS.RMG_SUMMARY:           return generateRmgSummary(toolResults);
      case INTENTS.WON_HC_TREND:          return generateRmgSummary(toolResults);
      case INTENTS.WON_HC_CLUSTER:        return generateRmgSummary(toolResults);
      case INTENTS.ACCOUNT_SUMMARY:       return generateAccountSummary(toolResults);
      case INTENTS.CLIENT_MEETINGS:       return generateAccountSummary(toolResults);
      case INTENTS.ENGAGEMENT_TREND:      return generateAccountSummary(toolResults);
      case INTENTS.CROSS_MODULE_OVERVIEW: return generateCrossModuleOverview(toolResults);
      case INTENTS.BIGGEST_RISKS:         return generateBiggestRisks(toolResults);
      case INTENTS.EXECUTIVE_SUMMARY:     return generateCrossModuleOverview(toolResults);
      case INTENTS.FOCUS_RECOMMENDATION:  return generateFocusRecommendation(toolResults);
      case INTENTS.FORECAST_REVENUE:      return generateForecastResponse(toolResults);
      case INTENTS.ANOMALY_CHECK:         return { text: 'Opening **Anomaly Detection** panel to show unusual patterns in the current data.', actions: [{ label: 'View Anomalies', tab: 'anomalies', icon: 'alert-triangle' }] };
      default:                            return generateUnknown(originalQuestion);
    }
  } catch (e) {
    console.error('[ResponseGenerator] Error:', e);
    return generateUnknown(originalQuestion);
  }
}
