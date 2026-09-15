// src/ai/components/InsightCard.jsx
// Reusable insight card for AI responses
// Renders text with markdown-style bold support, KPI chips, and action buttons.

import {
  ExternalLink, ArrowRight, BarChart3, TrendingUp, TrendingDown,
  DollarSign, Target, Shield, FileText, Presentation, Compass,
  AlertTriangle, Building2, Users, Check
} from 'lucide-react';

function resolveActionIcon(icon) {
  if (!icon) return null;
  const map = {
    'bar-chart': BarChart3,
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'dollar-sign': DollarSign,
    'target': Target,
    'shield': Shield,
    'file-text': FileText,
    'presentation': Presentation,
    'alert-triangle': AlertTriangle,
    'building': Building2,
    'users': Users,
    'compass': Compass,
    '📊': BarChart3,
    '💹': DollarSign,
    '📈': TrendingUp,
    '📉': TrendingDown,
    '🎯': Target,
    '⭐': Target,
    '👥': Users,
    '🏢': Building2,
    '🌍': Compass,
    '🔍': AlertTriangle,
    '🛡️': Shield,
    '📄': FileText,
  };
  const IconComp = map[icon];
  if (IconComp) return <IconComp style={{ width: 13, height: 13, flexShrink: 0 }} />;
  if (typeof icon === 'string' && icon.length > 2) return null;
  return <span style={{ fontSize: 13 }}>{icon}</span>;
}

function renderMarkdown(text) {
  if (!text) return null;
  // Simple bold: **text**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part}</strong> : part
  );
}

export function KPIChip({ label, value, sentiment }) {
  const colors = {
    positive: { bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.25)', text: '#059669' },
    negative: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)', text: '#DC2626' },
    neutral:  { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', text: 'var(--text-secondary)' },
  };
  const c = colors[sentiment] || colors.neutral;

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      padding: '6px 10px',
      borderRadius: 8,
      background: c.bg,
      border: `1px solid ${c.border}`,
      minWidth: 70,
    }}>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{value}</span>
    </div>
  );
}

export function ActionButton({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        border: '1px solid rgba(37,99,235,0.25)',
        background: 'rgba(37,99,235,0.06)',
        color: '#2563EB',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(37,99,235,0.12)';
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(37,99,235,0.06)';
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)';
      }}
    >
      {resolveActionIcon(icon)}
      {label}
      <ArrowRight style={{ width: 12, height: 12 }} />
    </button>
  );
}

export default function InsightCard({ text, kpis, actions, suggestions, isMultiLine, onAction, style }) {
  const lines = isMultiLine && text ? text.split('\n\n') : null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '14px 16px',
      fontSize: 13,
      color: 'var(--text-secondary)',
      lineHeight: 1.65,
      ...style,
    }}>
      {/* Text content */}
      {lines ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((line, i) => (
            <p key={i} style={{ margin: 0 }}>{renderMarkdown(line)}</p>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0 }}>{renderMarkdown(text)}</p>
      )}

      {/* KPI chips */}
      {kpis && kpis.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {kpis.map((kpi, i) => (
            <KPIChip key={i} label={kpi.label} value={kpi.value} sentiment={kpi.sentiment} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {actions.map((action, i) => (
            <ActionButton
              key={i}
              label={action.label}
              icon={action.icon}
              onClick={() => onAction && onAction(action)}
            />
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Try asking:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onAction && onAction({ type: 'suggest', question: s })}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
