// src/components/kpi/KPICard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber, formatPct, formatGap } from '../../utils/formatters.js';
import clsx from 'clsx';

export default function KPICard({
  label,
  value,
  subLabel,
  subValue,
  type = 'neutral', // 'positive' | 'negative' | 'neutral' | 'primary'
  isGap = false,
  isPct = false,
  size = 'md',
  unit = '',
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  const autoType = isGap
    ? numericValue >= 0 ? 'positive' : 'negative'
    : type;

  const displayValue = isGap
    ? formatGap(numericValue)
    : isPct
    ? formatPct(numericValue, { decimals: 1 })
    : formatNumber(numericValue);

  const valueColor = {
    positive: 'var(--success)',
    negative: 'var(--danger)',
    primary:  'var(--accent-blue)',
    neutral:  'var(--text-primary)',
  }[autoType] || 'var(--text-primary)';

  const Icon = autoType === 'positive' ? TrendingUp : autoType === 'negative' ? TrendingDown : Minus;

  const iconColor = {
    positive: 'var(--success)',
    negative: 'var(--danger)',
    primary:  'var(--accent-blue)',
    neutral:  'var(--text-muted)',
  }[autoType] || 'var(--text-muted)';

  const kpiSizeClass = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-3xl';

  return (
    <div className={clsx('kpi-card flex flex-col gap-2', `kpi-${autoType}`)}>
      <div className="flex items-start justify-between">
        <p className="kpi-label" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: iconColor }} />
      </div>

      <div className="flex items-end gap-2 flex-wrap">
        <span
          className={clsx('kpi-value font-extrabold tabular-nums leading-none', kpiSizeClass)}
          style={{ color: valueColor }}
        >
          {displayValue}
        </span>
        {unit && (
          <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{unit}</span>
        )}
      </div>

      {subLabel && (
        <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
          {subLabel}
        </p>
      )}

      {subLabel && subValue !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tabular-nums" style={{ color: valueColor }}>
            {isPct ? formatPct(subValue, { decimals: 1 }) : subValue}
          </span>
        </div>
      )}
    </div>
  );
}
