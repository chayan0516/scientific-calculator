export type CalculatorMode = 'standard' | 'scientific' | 'advanced';

export interface KeyDef {
  /** What appears on the button (also the accessible label unless `aria` overrides) */
  label: string;
  /** What gets appended into the expression string */
  insert?: string;
  /** Special action name */
  action?: string;
  /** Visual style bucket */
  style: 'num' | 'op' | 'fn' | 'eq' | 'util' | 'mem';
  /** Optional accessible label override */
  aria?: string;
}

const k = (
  label: string,
  style: KeyDef['style'],
  extra: Partial<KeyDef> = {},
): KeyDef => ({ label, style, ...extra });

/** Shared numeric/basic grid — bottom section in every mode. */
export const BASIC_KEYS: KeyDef[] = [
  k('AC', 'util', { action: 'clear' }),
  k('( )', 'util', { action: 'bracket', aria: 'Auto bracket' }),
  k('%', 'util', { insert: '%' }),
  k('÷', 'op', { insert: '÷' }),

  k('7', 'num', { insert: '7' }),
  k('8', 'num', { insert: '8' }),
  k('9', 'num', { insert: '9' }),
  k('×', 'op', { insert: '×' }),

  k('4', 'num', { insert: '4' }),
  k('5', 'num', { insert: '5' }),
  k('6', 'num', { insert: '6' }),
  k('-', 'op', { insert: '-' }),

  k('1', 'num', { insert: '1' }),
  k('2', 'num', { insert: '2' }),
  k('3', 'num', { insert: '3' }),
  k('+', 'op', { insert: '+' }),

  k('±', 'num', { action: 'negate' }),
  k('0', 'num', { insert: '0' }),
  k('.', 'num', { insert: '.' }),
  k('=', 'eq', { action: 'equals' }),
];

/** Memory row — shown in every mode. */
export const MEMORY_KEYS: KeyDef[] = [
  k('MC', 'mem', { action: 'memClear' }),
  k('MR', 'mem', { action: 'memRecall' }),
  k('M+', 'mem', { action: 'memAdd' }),
  k('M-', 'mem', { action: 'memSubtract' }),
];

/** Scientific rows — Scientific & Advanced modes. */
const SCI_ROWS: KeyDef[] = [
  k('sin', 'fn', { insert: 'sin(' }),
  k('cos', 'fn', { insert: 'cos(' }),
  k('tan', 'fn', { insert: 'tan(' }),
  k('sin⁻¹', 'fn', { insert: 'asin(' }),
  k('cos⁻¹', 'fn', { insert: 'acos(' }),
  k('tan⁻¹', 'fn', { insert: 'atan(' }),

  k('√', 'fn', { insert: 'sqrt(' }),
  k('∛', 'fn', { insert: 'cbrt(' }),
  k('x²', 'fn', { insert: '^2' }),
  k('x³', 'fn', { insert: '^3' }),
  k('xʸ', 'fn', { insert: '^' }),
  k('⌫', 'fn', { action: 'backspace', aria: 'Delete last character' }),

  k('ln', 'fn', { insert: 'ln(' }),
  k('log', 'fn', { insert: 'log(' }),
  k('eˣ', 'fn', { insert: 'exp(' }),
  k('10ˣ', 'fn', { insert: 'exp10(' }),
  k('1/x', 'fn', { action: 'reciprocal' }),
  k('n!', 'fn', { insert: '!' }),
];

/** Advanced-only rows — Advanced mode. */
const ADV_ROWS: KeyDef[] = [
  k('sinh', 'fn', { insert: 'sinh(' }),
  k('cosh', 'fn', { insert: 'cosh(' }),
  k('tanh', 'fn', { insert: 'tanh(' }),
  k('|x|', 'fn', { insert: 'abs(' }),
  k('π', 'fn', { insert: 'pi' }),
  k('e', 'fn', { insert: 'e' }),

  k('mod', 'fn', { insert: 'mod' }),
  k('nPr', 'fn', { insert: 'npr(' }),
  k('nCr', 'fn', { insert: 'ncr(' }),
  k('GCD', 'fn', { insert: 'gcd(' }),
  k('LCM', 'fn', { insert: 'lcm(' }),
  k('Rand', 'fn', { action: 'random' }),

  k('deg', 'fn', { action: 'toDeg', aria: 'Convert radians to degrees' }),
  k('rad', 'fn', { action: 'toRad', aria: 'Convert degrees to radians' }),
  k('RND', 'fn', { action: 'roundExpr', aria: 'Round expression' }),
  k('Ans', 'fn', { action: 'answer', aria: 'Insert last answer' }),
];

export function getKeysForMode(mode: CalculatorMode): KeyDef[] {
  if (mode === 'standard') return [...MEMORY_KEYS, ...BASIC_KEYS];
  if (mode === 'scientific') return [...MEMORY_KEYS, ...SCI_ROWS, ...BASIC_KEYS];
  return [...MEMORY_KEYS, ...SCI_ROWS, ...ADV_ROWS, ...BASIC_KEYS];
}
