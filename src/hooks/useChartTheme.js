// src/hooks/useChartTheme.js
// Returns ECharts-compatible theme tokens for dark/light mode
// Usage: const ct = useChartTheme(); — then use ct.tooltip, ct.axis, ct.colors, etc.

import { useTheme } from '../context/ThemeContext.jsx';

export function useChartTheme() {
  const { isDark } = useTheme();

  return {
    isDark,
    bg:       isDark ? '#1A2540' : '#FFFFFF',
    textPrimary: isDark ? '#E2E8F0' : '#0F172A',
    textMuted:   isDark ? '#64748B' : '#94A3B8',
    textSec:     isDark ? '#94A3B8' : '#475569',
    splitLine:   isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',

    // Main series palette (works on both themes)
    colors: {
      blue:   '#3B82F6',
      teal:   '#14B8A6',
      amber:  '#F59E0B',
      violet: '#8B5CF6',
      green:  '#10B981',
      red:    '#EF4444',
      indigo: '#6366F1',
      orange: '#F97316',
    },

    tooltip: {
      backgroundColor: isDark ? '#1E2D4A' : '#FFFFFF',
      borderColor:     isDark ? '#334155'  : '#E2E8F0',
      textStyle: { color: isDark ? '#E2E8F0' : '#0F172A', fontSize: 12 },
    },

    axisLabel: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11 },
    axisLine:  { lineStyle: { color: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' } },
    splitLineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', type: 'dashed' },

    legendText: { color: isDark ? '#94A3B8' : '#475569', fontSize: 11 },
  };
}
