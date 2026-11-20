import { History, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '../engine/history';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onUse: (value: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export default function HistoryPanel({
  history,
  onUse,
  onDelete,
  onClearAll,
  onClose,
  theme = 'dark',
}: HistoryPanelProps) {
  const dark = theme === 'dark';
  return (
    <div className={`border-b backdrop-blur animate-fadeIn transition-colors duration-300 ${
      dark ? 'border-neutral-800/80 bg-ink/60' : 'border-neutral-200 bg-neutral-100/80'
    }`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>
          <History className="w-3.5 h-3.5 text-accent" /> History
        </h2>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              aria-label="Clear all history"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-44 overflow-y-auto px-3 pb-3 space-y-1.5">
        {history.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">No calculations yet</p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              data-history-item
              role="button"
              tabIndex={0}
              aria-label={`Use result ${entry.result} from ${entry.expression}`}
              onClick={() => onUse(entry.result)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUse(entry.result);
                }
              }}
              className={`group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                dark
                  ? 'bg-charcoal/80 border-neutral-800 hover:border-accent/50'
                  : 'bg-white border-neutral-200 hover:border-accent/60'
              }`}
            >
              <div className="min-w-0 text-right flex-1">
                <p className="text-[11px] text-neutral-500 truncate">{entry.expression} =</p>
                <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-neutral-900'}`}>{entry.result}</p>
              </div>
              <button
                type="button"
                aria-label={`Delete history item ${entry.expression}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="p-1 rounded text-neutral-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
