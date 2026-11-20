/**
 * Safe mathematical expression evaluator for the calculator.
 * Implements a Pratt/recursive-descent parser — NEVER uses eval() or new Function().
 *
 * Grammar (BODMAS):
 *   expression := term (('+'|'-'|'mod') term)*
 *   term       := unary (('×'|'÷'|'*'|'/') unary)*        (implicit multiplication supported)
 *   unary      := ('-'|'+')? postfix
 *   postfix    := primary ('!' | '²' | '³' | '%')*
 *   power      : right-associative '^' handled between unary and postfix via power()
 *   primary    := number | constant | '(' expression ')' | func '(' expr ')' | func primary
 */

export type AngleMode = 'deg' | 'rad';

export interface EvalResult {
  ok: true;
  value: number;
}

export interface EvalError {
  ok: false;
  error: string;
}

export type EvalOutcome = EvalResult | EvalError;

/** Custom error carrying a user-friendly message. */
class CalcError extends Error { }

const PI = Math.PI;
const E = Math.E;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toRad(x: number, mode: AngleMode): number {
  return mode === 'deg' ? (x * PI) / 180 : x;
}

function fromRad(x: number, mode: AngleMode): number {
  return mode === 'deg' ? (x * 180) / PI : x;
}

/** Factorial — only defined for non-negative integers 0..170. */
export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new CalcError('Factorial needs a non-negative whole number');
  }
  if (n > 170) throw new CalcError('Factorial too large');
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Greatest common divisor (integers). */
export function gcd(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    throw new CalcError('GCD needs whole numbers');
  }
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Least common multiple (integers). */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcd(a, b)) * b);
}

/** nPr — permutations. */
export function nPr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new CalcError('nPr needs whole numbers with r ≤ n');
  }
  if (n > 170) throw new CalcError('nPr too large');
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}

/** nCr — combinations. */
export function nCr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new CalcError('nCr needs whole numbers with r ≤ n');
  }
  if (n > 340) throw new CalcError('nCr too large');
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return Math.round(result * 1e9) / 1e9;
}

/** Cube root that handles negative inputs correctly. */
function cbrt(x: number): number {
  return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
}

/** Trig wrappers that normalise tiny floating point noise to clean values. */
function clean(x: number): number {
  if (!Number.isFinite(x)) return x;
  // e.g. sin(30°) can be 0.49999999999999994 — round at 12 significant digits
  const r = Number(x.toPrecision(12));
  return Object.is(r, -0) ? 0 : r;
}

/* ------------------------------------------------------------------ */
/* Tokenizer                                                           */
/* ------------------------------------------------------------------ */

type TokenType =
  | 'number'
  | 'op'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'ident';

interface Token {
  type: TokenType;
  value: string;
}

const FUNCTIONS: Record<string, (args: number[], mode: AngleMode) => number> = {
  sin: ([x], m) => clean(Math.sin(toRad(x, m))),
  cos: ([x], m) => clean(Math.cos(toRad(x, m))),
  tan: ([x], m) => {
    const r = toRad(x, m);
    // tan is undefined at 90° (π/2) + k·π
    const norm = ((r % PI) + PI) % PI;
    if (Math.abs(norm - PI / 2) < 1e-12) throw new CalcError('tan undefined at this angle');
    return clean(Math.tan(r));
  },
  asin: ([x], m) => {
    if (x < -1 || x > 1) throw new CalcError('sin⁻¹ needs a value between -1 and 1');
    return clean(fromRad(Math.asin(x), m));
  },
  acos: ([x], m) => {
    if (x < -1 || x > 1) throw new CalcError('cos⁻¹ needs a value between -1 and 1');
    return clean(fromRad(Math.acos(x), m));
  },
  atan: ([x], m) => clean(fromRad(Math.atan(x), m)),
  sinh: ([x]) => clean(Math.sinh(x)),
  cosh: ([x]) => clean(Math.cosh(x)),
  tanh: ([x]) => clean(Math.tanh(x)),
  log: ([x]) => {
    if (x <= 0) throw new CalcError('log needs a positive number');
    return clean(Math.log10(x));
  },
  ln: ([x]) => {
    if (x <= 0) throw new CalcError('ln needs a positive number');
    return clean(Math.log(x));
  },
  sqrt: ([x]) => {
    if (x < 0) throw new CalcError('√ of a negative number is not real');
    return clean(Math.sqrt(x));
  },
  cbrt: ([x]) => clean(cbrt(x)),
  abs: ([x]) => Math.abs(x),
  exp: ([x]) => clean(Math.exp(x)),
  exp10: ([x]) => {
    const r = Math.pow(10, x);
    if (!Number.isFinite(r)) throw new CalcError('Result too large');
    return clean(r);
  },
  fact: ([x]) => factorial(x),
  round: ([x]) => clean(Math.round(x)),
  gcd: (args) => args.reduce((a, b) => gcd(a, b)),
  lcm: (args) => args.reduce((a, b) => lcm(a, b)),
  npr: ([n, r]) => nPr(n, r),
  ncr: ([n, r]) => nCr(n, r),
  perm: ([n, r]) => nPr(n, r),
  comb: ([n, r]) => nCr(n, r),
};

const CONSTANTS: Record<string, number> = {
  pi: PI,
  e: E,
};

const OPERATORS = new Set(['+', '-', '*', '/', '^', '%', '!']);

/** Internal multi-char operator names used during parsing. */
const MULTI_OPS = new Set(['mod']);

const FUNCS_WITH_ARGCOUNT: Record<string, number> = {
  gcd: 2, lcm: 2, npr: 2, ncr: 2, perm: 2, comb: 2,
};

/** Converts the calculator display string into tokens. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3');

  while (i < s.length) {
    const ch = s[i];

    if (ch === ' ' || ch === '\t') { i++; continue; }

    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      if ((num.match(/\./g) || []).length > 1) {
        throw new CalcError('A number can only have one decimal point');
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      let name = '';
      while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) name += s[i++];
      const lower = name.toLowerCase();
      if (MULTI_OPS.has(lower)) {
        tokens.push({ type: 'op', value: 'mod' });
      } else if (/^mod[0-9]/.test(lower)) {
        // "mod3" typed without spaces: keyword then number
        tokens.push({ type: 'op', value: 'mod' });
        i -= (name.length - 3);
      } else if (FUNCTIONS[lower]) {
        tokens.push({ type: 'ident', value: lower });
      } else if (CONSTANTS[lower]) {
        tokens.push({ type: 'ident', value: lower });
      } else {
        throw new CalcError(`Unknown symbol "${name}"`);
      }
      continue;
    }

    if (ch === '(') { tokens.push({ type: 'lparen', value: ch }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'rparen', value: ch }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'comma', value: ch }); i++; continue; }
    if (ch === '%') {
      // '%': postfix percent when nothing follows, modulo when followed by an operand
      const rest = s.slice(i + 1);
      const isBinary = /^[ \t]*[0-9.a-zA-Z(]/.test(rest);
      tokens.push({ type: 'op', value: isBinary ? 'mod' : '%' });
      i++;
      continue;
    }
    if (OPERATORS.has(ch)) { tokens.push({ type: 'op', value: ch }); i++; continue; }

    throw new CalcError(`Unexpected character "${ch}"`);
  }

  return tokens;
}

/* ------------------------------------------------------------------ */
/* Parser / Evaluator (recursive descent)                              */
/* ------------------------------------------------------------------ */

class Parser {
  private pos = 0;

  constructor(
    private tokens: Token[],
    private mode: AngleMode,
  ) { }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parse(): number {
    if (this.tokens.length === 0) throw new CalcError('Enter an expression first');
    const value = this.expression();
    if (this.pos < this.tokens.length) {
      throw new CalcError('Unexpected end of expression — check brackets and operators');
    }
    return value;
  }

  /** expression := term (('+'|'-'|'mod') term)* */
  private expression(): number {
    let left = this.term();
    for (; ;) {
      const t = this.peek();
      if (t && t.type === 'op' && (t.value === '+' || t.value === '-' || t.value === 'mod')) {
        this.next();
        const right = this.term();
        left =
          t.value === '+' ? left + right
            : t.value === '-' ? left - right
              : this.mod(left, right);
      } else break;
    }
    return left;
  }

  private mod(a: number, b: number): number {
    if (b === 0) throw new CalcError('Cannot take mod by zero');
    return a % b;
  }

  /** term := unary (('*'|'/') unary)* — also inserts implicit multiplication. */
  private term(): number {
    let left = this.unary();
    for (; ;) {
      const t = this.peek();
      if (t && t.type === 'op' && (t.value === '*' || t.value === '/')) {
        this.next();
        const right = this.unary();
        if (t.value === '*') left = left * right;
        else {
          if (right === 0) throw new CalcError('Cannot divide by zero');
          left = left / right;
        }
      } else if (
        t &&
        (t.type === 'number' || t.type === 'lparen' ||
          (t.type === 'ident' && (FUNCTIONS[t.value] || CONSTANTS[t.value] !== undefined)))
      ) {
        // Implicit multiplication: 2(3+4), 2π, 3sin(30)
        const right = this.unary();
        left = left * right;
      } else break;
    }
    return left;
  }

  /** unary := ('-'|'+')? power */
  private unary(): number {
    const t = this.peek();
    if (t && t.type === 'op' && (t.value === '-' || t.value === '+')) {
      this.next();
      const v = this.unary();
      return t.value === '-' ? -v : v;
    }
    return this.power();
  }

  /** power := postfix ('^' unary)? — right associative, binds tighter than unary minus's operand. */
  private power(): number {
    const base = this.postfix();
    const t = this.peek();
    if (t && t.type === 'op' && t.value === '^') {
      this.next();
      const exp = this.unary(); // right-associative: 2^3^2 = 2^(3^2)
      const result = Math.pow(base, exp);
      if (!Number.isFinite(result) && Number.isFinite(base) && Number.isFinite(exp)) {
        throw new CalcError('Result too large');
      }
      if (base < 0 && !Number.isInteger(exp)) {
        throw new CalcError('Negative base with fractional power is not real');
      }
      return clean(result);
    }
    return base;
  }

  /** postfix := primary ('!' | '%')*  — factorial & percent postfix. */
  private postfix(): number {
    let value = this.primary();
    for (;;) {
      const t = this.peek();
      if (t && t.type === 'op' && t.value === '!') {
        this.next();
        value = factorial(value);
      } else if (t && t.type === 'op' && t.value === '%') {
        // Postfix percent: 50% → 0.5. Binary "a % b" arrives as token 'mod'.
        this.next();
        value = value / 100;
      } else break;
    }
    return value;
  }

  /** primary := number | constant | '(' expr ')' | func(args) | func primary */
  private primary(): number {
    const t = this.next();
    if (!t) throw new CalcError('Expression is incomplete');

    if (t.type === 'number') {
      const n = Number(t.value);
      if (Number.isNaN(n)) throw new CalcError('Invalid number');
      return n;
    }

    if (t.type === 'ident') {
      if (CONSTANTS[t.value] !== undefined) {
        const constVal = CONSTANTS[t.value];
        // π(e)² etc: constants behave like numbers in term()'s implicit mult
        return constVal;
      }
      const fn = FUNCTIONS[t.value];
      const argCount = FUNCS_WITH_ARGCOUNT[t.value] ?? 1;

      const nt = this.peek();
      let args: number[];

      if (nt && nt.type === 'lparen') {
        this.next();
        args = [this.expression()];
        while (this.peek()?.type === 'comma') {
          this.next();
          args.push(this.expression());
        }
        const close = this.next();
        if (!close || close.type !== 'rparen') {
          throw new CalcError('Missing closing bracket');
        }
      } else {
        // Function without brackets: sin30, √ style — take a single unary value
        args = [this.unary()];
      }

      if (args.length !== argCount && argCount !== 1) {
        throw new CalcError(`${t.value.toUpperCase()} needs ${argCount} arguments`);
      }
      const result = fn(args, this.mode);
      this.checkFinite(result);
      return result;
    }

    if (t.type === 'lparen') {
      const value = this.expression();
      const close = this.next();
      if (!close || close.type !== 'rparen') {
        throw new CalcError('Missing closing bracket');
      }
      return value;
    }

    if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
      // e.g. "(2)(-3)" edge — handled via unary above; reaching here is an error
      throw new CalcError('Operator in an unexpected place');
    }

    throw new CalcError('Expression is incomplete');
  }

  private checkFinite(v: number): void {
    if (Number.isNaN(v)) throw new CalcError('Result is not a number');
    if (!Number.isFinite(v)) throw new CalcError('Result is too large');
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Safely evaluate a display expression. Never throws — returns an outcome. */
export function evaluateExpression(expression: string, mode: AngleMode = 'deg'): EvalOutcome {
  try {
    if (!expression.trim()) {
      return { ok: false, error: 'Enter an expression first' };
    }
    const tokens = tokenize(expression);
    const parser = new Parser(tokens, mode);
    const value = parser.parse();
    if (Number.isNaN(value)) return { ok: false, error: 'Result is not a number' };
    if (!Number.isFinite(value)) return { ok: false, error: 'Result is too large' };
    return { ok: true, value: clean(value) };
  } catch (err) {
    if (err instanceof CalcError) return { ok: false, error: err.message };
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: 'Invalid expression' };
  }
}

/** Human-friendly number formatting; switches to scientific notation for extremes. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  if (value === 0) return '0';

  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-9) {
    // scientific notation, e.g. 1.234×10¹²
    const exp = value.toExponential(8).replace(/e([+-])(\d+)/, 'e$1$2');
    const [mantissa, exponent] = exp.split('e');
    const trimmed = mantissa.replace(/\.?0+$/, '');
    return `${trimmed}e${exponent}`;
  }

  // Trim floating point noise: 0.1+0.2 → 0.3
  const rounded = Number(value.toPrecision(12));
  const str = String(rounded);
  return str;
}
