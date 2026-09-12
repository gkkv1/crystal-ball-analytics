// src/components/navigation/TabNav.jsx
import clsx from 'clsx';
import { BarChart3, Target, PieChart, TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'annual',  label: 'Annual Performance',   shortLabel: 'Annual',   icon: BarChart3,  accent: '#3B82F6' },
  { id: 'aop',     label: 'AOP Performance',       shortLabel: 'AOP',     icon: Target,     accent: '#14B8A6' },
  { id: 'curqtr',  label: 'Current Quarter',        shortLabel: 'Qtr',     icon: PieChart,   accent: '#F59E0B' },
  { id: 'weekly',  label: 'Weekly Trend',           shortLabel: 'Weekly',  icon: TrendingUp, accent: '#8B5CF6' },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <div
      className="flex items-center px-5 py-2 shrink-0 gap-4"
      style={{
        background: 'linear-gradient(135deg, #1B3358 0%, #0D2040 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="tab-bar flex-1">
        {TABS.map(({ id, label, shortLabel, icon: Icon, accent }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              data-tab={id}
              className={clsx('tab-item flex items-center gap-2', { active: isActive })}
              onClick={() => onTabChange(id)}
              aria-current={isActive ? 'page' : undefined}
              style={isActive ? { '--tab-accent': accent } : {}}
            >
              <Icon
                className="w-3.5 h-3.5 shrink-0"
                style={isActive ? { color: accent } : {}}
              />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="text-slate-500 text-xs font-medium shrink-0 hidden lg:block">
        All Revenue in Beacon INR Cr.
      </div>
    </div>
  );
}
