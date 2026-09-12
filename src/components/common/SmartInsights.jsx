// src/components/common/SmartInsights.jsx
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { generateInsights } from '../../utils/calculations.js';
import { useDashboardFilters } from '../../context/DashboardFilterContext.jsx';

const TYPE_CONFIG = {
  positive: { icon: TrendingUp,    cls: 'insight-positive' },
  negative: { icon: TrendingDown,  cls: 'insight-negative' },
  warning:  { icon: AlertTriangle, cls: 'insight-warning'  },
  neutral:  { icon: Info,          cls: 'insight-neutral'  },
};

export default function SmartInsights() {
  const { allData, filters } = useDashboardFilters();
  const insights = generateInsights(allData, filters);

  if (!insights.length) return null;

  return (
    <div
      className="flex items-center gap-3 flex-wrap py-2.5 px-4 rounded-xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-1.5 shrink-0" style={{ color: 'var(--text-muted)' }}>
        <Lightbulb className="w-3.5 h-3.5" />
        <span className="section-title">Smart Insights</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {insights.map((insight, i) => {
          const { icon: Icon, cls } = TYPE_CONFIG[insight.type] || TYPE_CONFIG.neutral;
          return (
            <span key={i} className={`insight-chip ${cls}`}>
              <Icon className="w-3 h-3" />
              {insight.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
