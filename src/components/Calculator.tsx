import { useEffect, useMemo, useState } from 'react';
import { Calculator as CalcIcon, History as HistoryIcon, Keyboard, Moon, Sigma, Sun } from 'lucide-react';
import { loadTheme, saveTheme, type Theme } from '../engine/history';
import Display from './Display';
import Keypad from './Keypad';
import HistoryPanel from './HistoryPanel';
import { evaluateExpression, formatNumber, type AngleMode } from '../engine/calculator';
import { getKeysForMode, type KeyDef } from '../engine/keypad';
import { loadHistory, saveHistory, type HistoryEntry } from '../engine/history';
import type { CalculatorMode } from '../engine/keypad';

const MODES: { id: CalculatorMode; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'scientific', label: 'Scientific' },
  { id: 'advanced', label: 'Advanced' },
];

function applyAction(
  action: string,
  expr: string,
  setResult: (v: number | null) => void,
  history: HistoryEntry[] = [],
): string {
  switch (action) {
    case 'clear':
      setResult(null);
      return '';
    case 'backspace':
      return expr.slice(0, -1);
    case 'bracket': {
      const opens = (expr.match(/\(/g) || []).length;
      const closes = (expr.match(/\)/g) || []).length;
      if (closes < opens && /[0-9)]$/.test(expr)) return expr + ')';
      return expr + '(';
    }
    case 'negate': {
      if (!expr) return '-';
      // wrap the trailing number in parentheses with a minus
      const m = expr.match(/(\d+\.?\d*)$/);
      if (m) {
        const start = expr.length - m[1].length;
        const before = expr.slice(0, start);
        if (before.endsWith('-') && (before.length === 1 || /[+\-×÷*/^(]$/.test(before.slice(0, -1)))) {
          return before.slice(0, -1) + m[1]; // remove an existing sign
        }
        return before + '-' + m[1];
      }
      return expr + '-';
    }
    case 'equals':
      return expr; // handled by caller
    case 'reciprocal': {
      const r = evaluateExpression(expr || '0');
      if (r.ok) {
        if (r.value === 0) return expr; // error shown by caller on equals
        return formatNumber(1 / r.value);
      }
      return expr;
    }
    case 'random':
      return expr + String(Math.random()).replace(/0\./, '').slice(0, 8);
    case 'toDeg': {
      const r = evaluateExpression(expr || '0', 'rad');
      return r.ok ? formatNumber((r.value * 180) / Math.PI) : expr;
    }
    case 'toRad': {
      const r = evaluateExpression(expr || '0', 'deg');
      return r.ok ? formatNumber((r.value * Math.PI) / 180) : expr;
    }
    case 'roundExpr': {
      const r = evaluateExpression(expr || '0');
      return r.ok ? formatNumber(Math.round(r.value)) : expr;
    }
    case 'answer': {
      const lastAnswer = history[0];
      return lastAnswer ? expr + lastAnswer.result : expr;
    }
    case 'memAdd':
    case 'memSubtract':
    case 'memClear':
    case 'memRecall':
      return expr; // handled by caller via memory callbacks
    default:
      return expr;
  }
}

export default function Calculator() {
  const [mode, setMode] = useState<CalculatorMode>('scientific');
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [memory, setMemory] = useState(0);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      return next;
    });
  };

  const keys = useMemo(() => getKeysForMode(mode), [mode]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleEquals = () => {
    if (!expression.trim()) {
      setError('Enter an expression first');
      return;
    }
    const outcome = evaluateExpression(expression, angleMode);
    if (outcome.ok) {
      setResult(outcome.value);
      setError(null);
      setJustEvaluated(true);
      setHistory((h) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          expression,
          result: formatNumber(outcome.value),
          timestamp: Date.now(),
        },
        ...h,
      ]);
    } else {
      setError(outcome.error);
      setResult(null);
    }
  };

  const handleKey = (key: KeyDef) => {
    setError(null);
    if (key.action === 'equals') {
      handleEquals();
      return;
    }
    if (key.action) {
      // memory actions
      if (key.action.startsWith('mem')) {
        const current = evaluateExpression(expression || '0', angleMode);
        const value = current.ok ? current.value : 0;
        switch (key.action) {
          case 'memClear':
            setMemory(0);
            break;
          case 'memAdd':
            setMemory((m) => m + value);
            break;
          case 'memSubtract':
            setMemory((m) => m - value);
            break;
          case 'memRecall':
            if (justEvaluated || !expression) {
              setExpression(memory === 0 ? '0' : formatNumber(memory));
              setJustEvaluated(false);
            } else {
              setExpression((e) => e + formatNumber(memory));
            }
            break;
        }
        return;
      }
      const next = applyAction(key.action, expression, setResult, history);
      setExpression(next);
      setJustEvaluated(false);
      return;
    }
    if (key.insert !== undefined) {
      // If we just evaluated, starting a new number/function begins fresh; operators continue.
      const base = justEvaluated && /^[0-9.]$/.test(key.insert) ? '' : expression;
      setExpression(base + key.insert);
      setJustEvaluated(false);
      setResult(null);
    }
  };

  const handleKeyboard = (e: KeyboardEvent) => {
    const map: Record<string, string> = {
      '+': '+', '-': '-', '*': '×', '/': '÷', '^': '^', '(': '(', ')': ')',
      '%': '%', '.': '.', 'e': 'e',
    };
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleKey({ label: e.key, style: 'num', insert: e.key });
      return;
    }
    if (map[e.key]) {
      e.preventDefault();
      handleKey({ label: map[e.key], style: 'op', insert: map[e.key] });
      return;
    }
    switch (e.key) {
      case 'Enter':
      case '=':
        e.preventDefault();
        handleEquals();
        break;
      case 'Backspace':
        e.preventDefault();
        handleKey({ label: '⌫', style: 'fn', action: 'backspace' });
        break;
      case 'Escape':
        e.preventDefault();
        handleKey({ label: 'AC', style: 'util', action: 'clear' });
        break;
      default:
        break; // unsupported keys ignored
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  });

  const useResult = (value: string) => {
    setExpression(value);
    setResult(null);
    setJustEvaluated(false);
    setError(null);
  };

  const deleteHistoryItem = (id: string) =>
    setHistory((h) => h.filter((entry) => entry.id !== id));
  const clearHistory = () => setHistory([]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 sm:p-6 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-ink text-white'
        : 'bg-neutral-100 text-neutral-900'
    }`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-glow flex items-center justify-center">
              <Sigma className="w-5 h-5 text-ink" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">SciCalc</h1>
              <p className="text-[11px] text-neutral-400 leading-tight">Advanced Scientific</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'light'}
              className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-charcoal border-neutral-800 text-neutral-300 hover:border-accent/50'
                  : 'bg-white border-neutral-300 text-neutral-600 hover:border-accent'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-accent" /> Dark
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-accent" /> Light
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              aria-label="Toggle calculation history"
              aria-expanded={historyOpen}
              className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition-colors ${historyOpen
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-charcoal border-neutral-800 text-neutral-300 hover:border-accent/50'
                }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" /> History
            </button>
          </div>
        </header>

        {/* Mode selector */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex bg-charcoal border border-neutral-800 rounded-full p-1 flex-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`flex-1 text-xs py-1.5 rounded-full transition-all ${mode === m.id
                    ? 'bg-accent text-ink font-semibold shadow-glow-sm'
                    : 'text-neutral-400 hover:text-white'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAngleMode((a) => (a === 'deg' ? 'rad' : 'deg'))}
            aria-label={`Angle mode: ${angleMode}. Click to switch`}
            className={`text-xs font-bold px-4 py-2 rounded-full border transition-all ${angleMode === 'deg'
                ? 'bg-accent/15 border-accent/60 text-accent'
                : 'bg-accent2/15 border-accent2/60 text-accent2'
              }`}
          >
            {angleMode.toUpperCase()}
          </button>
        </div>

        {/* Main panel */}
        <div className={`relative backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-charcoal/80 border border-neutral-800/80 shadow-black/60'
            : 'bg-white border border-neutral-200 shadow-neutral-400/30'
        }`}>
          {/* top edge glow line */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
          />
          <Display
            expression={expression}
            result={result}
            error={error}
            angleMode={angleMode}
            memory={memory}
            theme={theme}
          />
          {historyOpen && (
            <HistoryPanel
              history={history}
              onUse={useResult}
              onDelete={deleteHistoryItem}
              onClearAll={clearHistory}
              onClose={() => setHistoryOpen(false)}
              theme={theme}
            />
          )}
          {memory !== 0 && (
            <div className="flex items-center gap-1.5 px-4 pb-1 text-[11px] text-accent">
              <CalcIcon className="w-3 h-3" /> Memory: {formatNumber(memory)}
            </div>
          )}
          <Keypad keys={keys} onKey={handleKey} theme={theme} />
        </div>

        <p className={`flex items-center justify-center gap-1.5 text-[11px] mt-3 ${
          theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'
        }`}>
          <Keyboard className="w-3.5 h-3.5" /> Keyboard supported — numbers, + − × ÷, Enter, Backspace, Esc
        </p>
      </div>
    </div>
  );
}
