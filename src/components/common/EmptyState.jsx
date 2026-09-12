// src/components/common/EmptyState.jsx
import { SearchX } from 'lucide-react';

export default function EmptyState({ message = 'No data available for the selected filters.' }) {
  return (
    <div className="empty-state">
      <SearchX className="w-10 h-10 text-slate-300 mb-3" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters.</p>
    </div>
  );
}
