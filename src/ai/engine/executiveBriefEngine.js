// src/ai/engine/executiveBriefEngine.js
// Generates structured executive brief content from all module summaries.
// Future: this output can be sent as context to an LLM for narrative generation.

import { getAllModuleSummaries, getRiskSummary } from '../tools/crossModuleTools.js';
import { detectAllAnomalies } from './anomalyEngine.js';

function round1(v) { return v != null ? Math.round(v * 10) / 10 : null; }
function fmtCr(n) { if (n == null) return 'N/A'; if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`; return `₹${n.toFixed(1)} Cr`; }
function sentiment(val, goodThreshold, warnThreshold) {
  if (val == null) return 'neutral';
  return val >= goodThreshold ? 'positive' : val >= warnThreshold ? 'neutral' : 'negative';
}

export function generateExecutiveBrief(filters = {}) {
  try {
    const all    = getAllModuleSummaries(filters);
    const risks  = getRiskSummary(filters);
    const anomalies = detectAllAnomalies(filters);

    if (!all) return null;

    // ─── Revenue ───────────────────────────────────────────────────────────
    const revKpis = all.revenue?.kpis;
    const revAopPct = revKpis?.aopAchievementPct;
    const revYoY = revKpis?.yoyGrowthPct;
    const topGeo = all.revenue?.geo?.best?.geo || 'N/A';
    const worstGeo = all.revenue?.geo?.worst?.geo || 'N/A';

    // ─── Finance ───────────────────────────────────────────────────────────
    const finKpis = all.finance?.kpis;
    const marginPct = finKpis?.grossMarginPct;
    const marginChange = all.finance?.margin?.change;

    // ─── Sales ─────────────────────────────────────────────────────────────
    const salesKpis = all.sales?.kpis;
    const salesAchPct = salesKpis?.achievedPct;
    const pipelineDir = all.sales?.pipeline?.pipelineDirection || 'stable';

    // ─── DEG ───────────────────────────────────────────────────────────────
    const degKpis = all.deg?.kpis;
    const csiScore = degKpis?.csiScore;
    const csiDir = all.deg?.csi?.direction || 'stable';

    // ─── RMG ───────────────────────────────────────────────────────────────
    const rmgKpis = all.rmg?.kpis;
    const wonHCQtd = rmgKpis?.currentQuarterAddition;
    const wonHCDir = all.rmg?.wonHC?.direction || 'stable';

    // ─── Account ───────────────────────────────────────────────────────────
    const accKpis = all.account?.kpis;
    const meetingsDir = all.account?.meetings?.direction || 'stable';
    const meetingChangePct = all.account?.meetings?.changePct;

    // ─── Recommended focus ─────────────────────────────────────────────────
    const focusAreas = [];
    if (worstGeo && all.revenue?.geo?.worst?.aopPct < 85) focusAreas.push(`${worstGeo} Revenue Recovery`);
    if (marginChange != null && marginChange < -1.5)        focusAreas.push('Gross Margin Stabilization');
    if (salesAchPct != null && salesAchPct < 80)            focusAreas.push('Sales Pipeline Acceleration');
    if (csiScore != null && csiScore < 92)                  focusAreas.push('Customer Satisfaction Improvement');
    if (!focusAreas.length)                                  focusAreas.push('Sustain current growth momentum');

    return {
      generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      filters,

      // Revenue block
      revenue: {
        achievement: round1(revAopPct),
        achievementLabel: fmtCr(revKpis?.actualRevenue),
        aop: fmtCr(revKpis?.aop),
        yoyGrowth: round1(revYoY),
        sentiment: sentiment(revAopPct, 95, 85),
        status: revAopPct >= 95 ? 'On Track' : revAopPct >= 85 ? 'Below Target' : 'At Risk',
      },

      // Finance block
      finance: {
        grossMargin: round1(marginPct),
        marginChange: round1(marginChange),
        sentiment: sentiment(marginPct, 40, 36),
        status: marginChange != null && marginChange < -1.5 ? 'Under Pressure' : 'Stable',
        offshoreRealization: round1(finKpis?.offshoreRealizAvg),
      },

      // Sales block
      sales: {
        achievement: round1(salesAchPct),
        tcvWon: salesKpis?.tcvWon,
        pipelineStatus: pipelineDir,
        sentiment: sentiment(salesAchPct, 90, 75),
        status: salesAchPct >= 90 ? 'On Track' : salesAchPct >= 70 ? 'Below Target' : 'At Risk',
        outlook: pipelineDir === 'increasing' ? 'Positive' : 'Cautious',
      },

      // DEG block
      deg: {
        csiScore: round1(csiScore),
        direction: csiDir,
        sentiment: sentiment(csiScore, 93, 90),
        status: csiScore >= 93 ? 'Healthy' : csiScore >= 90 ? 'Acceptable' : 'At Risk',
      },

      // RMG block
      rmg: {
        wonHCQtd: wonHCQtd != null ? Math.round(wonHCQtd) : null,
        direction: wonHCDir,
        sentiment: wonHCDir === 'increasing' ? 'positive' : wonHCDir === 'stable' ? 'neutral' : 'negative',
      },

      // Account/Engagement block
      account: {
        totalMeetings: all.account?.meetings?.totalMeetings,
        direction: meetingsDir,
        changePct: round1(meetingChangePct),
        sentiment: meetingsDir === 'increasing' ? 'positive' : meetingsDir === 'stable' ? 'neutral' : 'negative',
        status: meetingsDir === 'increasing' ? 'Increasing' : meetingsDir === 'stable' ? 'Stable' : 'Declining',
      },

      // Top findings
      topGeo,
      worstGeo,
      primaryRisk: risks[0]?.title || 'No critical risks identified',
      primaryRiskModule: risks[0]?.module || null,

      // Recommendations
      focusAreas,
      riskCount: anomalies.length,
      criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
    };
  } catch (e) {
    console.error('[ExecutiveBriefEngine] Error:', e);
    return null;
  }
}
