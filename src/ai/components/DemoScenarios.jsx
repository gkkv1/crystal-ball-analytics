import { TrendingDown, AlertTriangle, DollarSign, Users, TrendingUp, Sparkles } from 'lucide-react';
import { DEMO_SCENARIOS } from '../types/ai.types.js';

const SCENARIO_ICONS = {
  revenue_downturn:    { icon: TrendingDown,  color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  sales_pipeline_risk: { icon: AlertTriangle, color: '#EA580C', bg: 'rgba(234,88,12,0.1)' },
  finance_margin_risk: { icon: DollarSign,    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  customer_engagement: { icon: Users,         color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  positive_forecast:   { icon: TrendingUp,    color: '#059669', bg: 'rgba(5,150,105,0.1)' },
};

export default function DemoScenarios({ onSelectScenario }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>Demo Scenarios</h4>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
          Click a scenario to pre-load a demo context into the Copilot
        </p>
      </div>
      {DEMO_SCENARIOS.map(scenario => {
        const iconCfg = SCENARIO_ICONS[scenario.id] || { icon: Sparkles, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' };
        const IconComp = iconCfg.icon;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelectScenario(scenario)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)';
              e.currentTarget.style.background = 'rgba(37,99,235,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--bg-muted)';
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: iconCfg.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconComp size={16} strokeWidth={2.2} style={{ color: iconCfg.color }} />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{scenario.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{scenario.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
