import { useEffect, useRef } from 'react';
import { AlertTriangle, Sigma, MemoryStick, CircleDot } from 'lucide-react';
import { formatNumber, type AngleMode } from '../engine/calculator';

interface DisplayProps {
  expression: string;
  result: number | null;
  error: string | null;
  angleMode: AngleMode;
  memory: number;
  theme?: 'dark' | 'light';
}

export default function Display({ expression, result, error, angleMode, memory, theme = 'dark' }: DisplayProps) {
  const dark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [expression, result]);

  const showResult = result !== null && !error;
  const historyExpr = showResult ? `${expression} =` : '';

  return (
    <section
      aria-label="Calculator display"
      className={`relative overflow-hidden border-b px-4 pt-4 pb-5 transition-colors duration-300 ${
        dark
          ? 'bg-gradient-to-b from-panel to-charcoal border-neutral-800/80'
          : 'bg-gradient-to-b from-white to-neutral-50 border-neutral-200'
      }`}
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl ${dark ? 'bg-accent/10' : 'bg-accent/5'}`}
      />
      {/* subtle grid texture */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${dark ? 'opacity-[0.05]' : 'opacity-[0.06]'}`}
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* status chips */}
      <div className="relative flex items-center justify-between text-[11px] mb-3 min-h-[20px]">
        <div className="flex gap-1.5">
          <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent font-semibold tracking-wide">
            <CircleDot className="h-2.5 w-2.5" />
            {angleMode.toUpperCase()}
          </span>
          {memory !== 0 && (
            <span className="flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-neutral-300 font-semibold tracking-wide">
              <MemoryStick className="h-2.5 w-2.5" />
              M
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/60 px-2 py-0.5 text-neutral-500 font-semibold tracking-wide">
            <Sigma className="h-2.5 w-2.5" />
            SCI
          </span>
        </div>
        {historyExpr && (
          <span className="text-neutral-500 max-w-[70%] truncate font-medium">{historyExpr}</span>
        )}
      </div>

      {/* current input / result */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto whitespace-nowrap scrollbar-none"
        aria-live="polite"
      >
        {error ? (
          <div className="flex items-center gap-2 text-rose-400 text-base font-medium animate-fadeIn">
            <AlertTriangle className="w-5 h-5 shrink-0 drop-shadow-[0_6px_rgba(251,113,133,0.6)]" />
            <span>{error}</span>
          </div>
        ) : (
          <p
            className={`font-bold tracking-tight animate-popIn ${showResult
              ? 'text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2 drop-shadow-[0_0_18px_rgba(255,121,0,0.35)]'
              : dark
                ? 'text-white text-3xl sm:text-4xl'
                : 'text-neutral-900 text-3xl sm:text-4xl'
              }`}
            data-testid="display-value"
          >
            {showResult
              ? formatNumber(result)
              : expression || <span className={dark ? 'text-neutral-600' : 'text-neutral-400'}>0</span>}
          </p>
        )}
      </div>
    </section>
  );
}
