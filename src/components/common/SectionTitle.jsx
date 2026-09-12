// src/components/common/SectionTitle.jsx
// Enhanced section title with colored left-border accent
import clsx from 'clsx';

export default function SectionTitle({ children, className, action, accent }) {
  return (
    <div className={clsx('section-title-bar', className, accent)}>
      <h3 className="section-title flex-1" style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
        {children}
      </h3>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
