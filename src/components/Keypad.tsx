import type { KeyDef } from '../engine/keypad';

interface KeypadProps {
  keys: KeyDef[];
  onKey: (key: KeyDef) => void;
  theme?: 'dark' | 'light';
}

const STYLE_CLASSES: Record<KeyDef['style'], string> = {
  num: 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700',
  op: 'bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 hover:border-accent/60 font-semibold',
  fn: 'bg-neutral-800/70 text-accent2 hover:bg-neutral-700/70 active:bg-neutral-600/70 text-sm',
  eq: 'bg-gradient-to-br from-accent to-accent2 text-ink font-bold shadow-glow hover:shadow-glow hover:brightness-110',
  util: 'bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 text-sm',
  mem: 'bg-purple-500/10 text-purple-300 border border-purple-400/25 hover:bg-purple-500/20 text-sm',
};

const STYLE_CLASSES_LIGHT: Record<KeyDef['style'], string> = {
  num: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-100 active:bg-neutral-200',
  op: 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 hover:border-accent/60 font-semibold',
  fn: 'bg-neutral-100 text-accent border border-neutral-200 hover:bg-neutral-200/70 active:bg-neutral-200 text-sm',
  eq: 'bg-gradient-to-br from-accent to-accent2 text-white font-bold shadow-glow hover:shadow-glow hover:brightness-110',
  util: 'bg-rose-500/10 text-rose-500 border border-rose-400/30 hover:bg-rose-500/20 text-sm',
  mem: 'bg-purple-500/10 text-purple-600 border border-purple-400/30 hover:bg-purple-500/20 text-sm',
};

export default function Keypad({ keys, onKey, theme = 'dark' }: KeypadProps) {
  const styles = theme === 'dark' ? STYLE_CLASSES : STYLE_CLASSES_LIGHT;
  return (
    <div
      className="grid grid-cols-4 gap-2 sm:gap-2.5 p-3 sm:p-4"
      role="group"
      aria-label="Calculator keypad"
    >
      {keys.map((key, i) => (
        <button
          key={`${key.label}-${i}`}
          type="button"
          onClick={() => onKey(key)}
          aria-label={key.aria ?? key.label}
          className={`key-btn group relative select-none overflow-hidden rounded-2xl py-3 sm:py-3.5 text-base sm:text-lg font-medium
            transition-all duration-100 ease-out
            hover:-translate-y-0.5 active:translate-y-0 active:scale-95
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
            shadow-md shadow-black/40 ${styles[key.style]}`}
        >
          {/* sheen sweep on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
          />
          <span className="relative">{key.label}</span>
        </button>
      ))}
    </div>
  );
}
