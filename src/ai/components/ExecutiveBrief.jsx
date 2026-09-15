// src/ai/components/ExecutiveBrief.jsx
// Executive Summary panel — one-page structured brief from all modules

import { useState, useEffect } from 'react';
import { generateExecutiveBrief } from '../engine/executiveBriefEngine.js';
import { TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';

function MetricBlock({ label, value, change, status, sentiment, unit, icon }) {
  const sentColors = {
    positive: { bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.2)', text: '#059669', label: '#047857' },
    neutral:  { bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.15)', text: 'var(--text-secondary)', label: 'var(--text-muted)' },
    negative: { bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.18)', text: '#DC2626', label: '#B91C1C' },
  };
  const c = sentColors[sentiment] || sentColors.neutral;

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: 10,
      border: `1px solid ${c.border}`,
      background: c.bg,
    }}>
      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 2 }}>
        {value}{unit && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
      </div>
      {status && (
        <div style={{ fontSize: 11, fontWeight: 600, color: c.label }}>
          {status}
        </div>
      )}
    </div>
  );
}

export default function ExecutiveBrief({ filters = {}, onGeneratePPT }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        setBrief(generateExecutiveBrief(filters));
      } catch (e) {
        console.error('[ExecutiveBrief]', e);
        setBrief(null);
      }
      setLoading(false);
    }, 600);
  }, []); // eslint-disable-line

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 12 }}>
      <FileText style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.4 }} />
      Generating executive brief...
    </div>
  );

  if (!brief) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
      Unable to generate brief. Please check filter context.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Executive Brief</h3>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Generated: {brief.generatedAt}</p>
        </div>
        <button
          onClick={onGeneratePPT}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid rgba(37,99,235,0.3)',
            background: 'rgba(37,99,235,0.06)',
            color: '#2563EB', fontSize: 11.5, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <FileText style={{ width: 12, height: 12 }} />
          Generate PPT
        </button>
      </div>

      {/* Revenue & Finance */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>Financial Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MetricBlock label="Revenue AOP" value={`${brief.revenue.achievement?.toFixed(1)}%`} status={brief.revenue.status} sentiment={brief.revenue.sentiment} />
          <MetricBlock label="YoY Growth" value={`${brief.revenue.yoyGrowth >= 0 ? '+' : ''}${brief.revenue.yoyGrowth?.toFixed(1)}%`} status={brief.revenue.yoyGrowth >= 0 ? 'Positive' : 'Negative'} sentiment={brief.revenue.yoyGrowth >= 0 ? 'positive' : 'negative'} />
          <MetricBlock label="Gross Margin" value={`${brief.finance.grossMargin?.toFixed(1)}%`} status={brief.finance.status} sentiment={brief.finance.sentiment} />
          <MetricBlock label="Sales TCV" value={`${brief.sales.achievement?.toFixed(1)}%`} unit="of AOP" status={brief.sales.status} sentiment={brief.sales.sentiment} />
        </div>
      </div>

      {/* Operations */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>Operations & Customer</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MetricBlock label="CSI Score" value={`${brief.deg.csiScore?.toFixed(1)}%`} status={brief.deg.status} sentiment={brief.deg.sentiment} />
          <MetricBlock label="WON HC (QTD)" value={brief.rmg.wonHCQtd || 'N/A'} status={brief.rmg.direction} sentiment={brief.rmg.sentiment} />
          <MetricBlock label="Client Engagement" value={brief.account.status} status={brief.account.changePct != null ? `${brief.account.changePct >= 0 ? '+' : ''}${brief.account.changePct?.toFixed(1)}%` : ''} sentiment={brief.account.sentiment} />
          <MetricBlock label="Issues Detected" value={`${brief.riskCount}`} status={brief.criticalAnomalies > 0 ? `${brief.criticalAnomalies} Critical` : 'No Critical'} sentiment={brief.criticalAnomalies > 0 ? 'negative' : 'positive'} />
        </div>
      </div>

      {/* Geography */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.2)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Geography</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#059669', marginTop: 3 }}>🏆 {brief.topGeo}</div>
        </div>
        <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)' }}>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Needs Attention</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', marginTop: 3 }}>⚠️ {brief.worstGeo}</div>
        </div>
      </div>

      {/* Primary risk */}
      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)' }}>
        <div style={{ fontSize: 9.5, color: '#DC2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Primary Risk</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{brief.primaryRisk}</div>
      </div>

      {/* Focus areas */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>Management Focus</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {brief.focusAreas.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 800, flexShrink: 0 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
