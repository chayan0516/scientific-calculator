import { describe, it, expect } from 'vitest';
import {
  evaluateExpression,
  formatNumber,
  factorial,
  gcd,
  lcm,
  nPr,
  nCr,
  type EvalError,
} from './calculator';

const evalOk = (expr: string, mode: 'deg' | 'rad' = 'deg'): number => {
  const r = evaluateExpression(expr, mode);
  if (!r.ok) throw new Error(`Expected ok for "${expr}" but got: ${(r as EvalError).error}`);
  return r.value;
};

const evalErr = (expr: string, mode: 'deg' | 'rad' = 'deg'): string => {
  const r = evaluateExpression(expr, mode);
  if (r.ok) throw new Error(`Expected error for "${expr}" but got ${r.value}`);
  return r.error;
};

const closeTo = (a: number, b: number, digits = 10) => Math.abs(a - b) < Math.pow(10, -digits);

describe('required calculation examples', () => {
  it.each([
    ['25+35', 60],
    ['100/4', 25],
    ['5*(3+2)', 25],
    ['sqrt(144)', 12],
    ['2^3', 8],
    ['2³', 8],
    ['log(100)', 2],
    ['ln(e)', 1],
    ['5!', 120],
    ['fact(5)', 120],
    ['2^-1', 0.5],
    ['10 % 3', 1],
    ['10mod3', 1],
    ['2+3*4', 14],
  ])('%s = %s', (expr, expected) => {
    expect(closeTo(evalOk(expr), expected)).toBe(true);
  });

  it('sin(30°) = 0.5 in DEG mode', () => {
    expect(closeTo(evalOk('sin(30)', 'deg'), 0.5)).toBe(true);
  });
  it('cos(60°) = 0.5 in DEG mode', () => {
    expect(closeTo(evalOk('cos(60)', 'deg'), 0.5)).toBe(true);
  });
  it('tan(45°) = 1 in DEG mode', () => {
    expect(closeTo(evalOk('tan(45)', 'deg'), 1)).toBe(true);
  });
  it('trig switches with RAD mode: sin(π/2) = 1', () => {
    expect(closeTo(evalOk('sin(pi/2)', 'rad'), 1)).toBe(true);
  });
  it('sin(90°) in RAD mode ≈ 0.893996664 (mode actually applied)', () => {
    const v = evalOk('sin(90)', 'rad');
    expect(Math.abs(v - 0.8939966636)).toBeLessThan(1e-9);
  });
});

describe('error handling', () => {
  it('division by zero', () => {
    expect(evalErr('5/0')).toMatch(/divide by zero/i);
  });
  it('empty input', () => {
    expect(evalErr('')).toMatch(/enter an expression/i);
    expect(evalErr('   ')).toMatch(/enter an expression/i);
  });
  it('invalid expression', () => {
    expect(evalErr('2++*3')).toBeTruthy();
    expect(evalErr('(2+3')).toMatch(/closing bracket/i);
    expect(evalErr('2+3)')).toBeTruthy();
  });
  it('multiple decimal points', () => {
    expect(evalErr('1.2.3')).toMatch(/decimal point/i);
  });
  it('log of zero and negatives', () => {
    expect(evalErr('log(0)')).toMatch(/positive/i);
    expect(evalErr('ln(-5)')).toMatch(/positive/i);
  });
  it('sqrt of negative', () => {
    expect(evalErr('sqrt(-9)')).toMatch(/negative/i);
  });
  it('invalid inverse trig', () => {
    expect(evalErr('asin(2)')).toMatch(/between -1 and 1/i);
    expect(evalErr('acos(-1.5)')).toMatch(/between -1 and 1/i);
  });
  it('factorial of negative and non-integer', () => {
    expect(evalErr('(-3)!')).toMatch(/non-negative whole/i);
    expect(evalErr('(2.5)!')).toMatch(/non-negative whole/i);
    expect(evalErr('fact(-1)')).toMatch(/non-negative whole/i);
  });
  it('modulo by zero', () => {
    expect(evalErr('5mod0')).toMatch(/mod by zero/i);
  });
  it('NaN/Infinity never returned as ok', () => {
    const r = evaluateExpression('0/0');
    expect(r.ok).toBe(false);
  });
  it('unknown symbol rejected', () => {
    expect(evalErr('2@3')).toBeTruthy();
    expect(evalErr('foo(3)')).toMatch(/unknown/i);
  });
});

describe('operators & precedence', () => {
  it('BODMAS precedence', () => {
    expect(closeTo(evalOk('2+3*4^2'), 50)).toBe(true);
    expect(closeTo(evalOk('(2+3)*4'), 20)).toBe(true);
  });
  it('right-associative power', () => {
    expect(closeTo(evalOk('2^3^2'), 512)).toBe(true);
  });
  it('negative numbers', () => {
    expect(closeTo(evalOk('-5+3'), -2)).toBe(true);
    expect(closeTo(evalOk('2*-3'), -6)).toBe(true);
    expect(closeTo(evalOk('(-2)*3'), -6)).toBe(true);
  });
  it('nested brackets', () => {
    expect(closeTo(evalOk('((2+3)*(4-1))/5'), 3)).toBe(true);
  });
  it('implicit multiplication', () => {
    expect(closeTo(evalOk('2(3+4)'), 14)).toBe(true);
    expect(closeTo(evalOk('2pi'), 2 * Math.PI)).toBe(true);
    expect(closeTo(evalOk('3sin(30)'), 1.5)).toBe(true);
  });
  it('percentage postfix', () => {
    expect(closeTo(evalOk('50%'), 0.5)).toBe(true);
  });
  it('unary minus after operators', () => {
    expect(closeTo(evalOk('5--3'), 8)).toBe(true);
  });
});

describe('scientific functions', () => {
  it('hyperbolic', () => {
    expect(closeTo(evalOk('sinh(1)'), 1.1752011936)).toBe(true);
    expect(closeTo(evalOk('cosh(0)'), 1)).toBe(true);
    expect(closeTo(evalOk('tanh(1)'), 0.761594156)).toBe(true);
  });
  it('inverse trig', () => {
    expect(closeTo(evalOk('asin(0.5)'), 30)).toBe(true);
    expect(closeTo(evalOk('atan(1)'), 45)).toBe(true);
  });
  it('roots and powers', () => {
    expect(closeTo(evalOk('cbrt(27)'), 3)).toBe(true);
    expect(closeTo(evalOk('cbrt(-27)'), -3)).toBe(true);
    expect(closeTo(evalOk('exp(1)'), Math.E)).toBe(true);
    expect(closeTo(evalOk('exp10(2)'), 100)).toBe(true);
  });
  it('reciprocal & abs', () => {
    expect(closeTo(evalOk('1/8'), 0.125)).toBe(true);
    expect(closeTo(evalOk('abs(-7)'), 7)).toBe(true);
  });
  it('constants', () => {
    expect(closeTo(evalOk('pi'), Math.PI)).toBe(true);
    expect(closeTo(evalOk('e'), Math.E)).toBe(true);
  });
  it('floating point noise cleaned (0.1+0.2 = 0.3)', () => {
    expect(evalOk('0.1+0.2')).toBe(0.3);
  });
});

describe('advanced functions', () => {
  it('nPr / nCr', () => {
    expect(closeTo(evalOk('npr(5,2)'), 20)).toBe(true);
    expect(closeTo(evalOk('ncr(5,2)'), 10)).toBe(true);
    expect(nPr(5, 2)).toBe(20);
    expect(nCr(10, 3)).toBe(120);
  });
  it('gcd / lcm', () => {
    expect(evalOk('gcd(12,18)')).toBe(6);
    expect(evalOk('lcm(4,6)')).toBe(12);
    expect(gcd(12, 18)).toBe(6);
    expect(lcm(4, 6)).toBe(12);
  });
  it('gcd/lcm reject non-integers', () => {
    expect(evalErr('gcd(2.5,3)')).toMatch(/whole/i);
  });
  it('factorial helper', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(6)).toBe(720);
    expect(() => factorial(-1)).toThrow();
    expect(() => factorial(2.5)).toThrow();
  });
});

describe('formatNumber', () => {
  it('formats ordinary numbers', () => {
    expect(formatNumber(60)).toBe('60');
    expect(formatNumber(0.5)).toBe('0.5');
  });
  it('uses scientific notation for extremes', () => {
    expect(formatNumber(1.5e15)).toMatch(/e/i);
    expect(formatNumber(1e-12)).toMatch(/e/i);
  });
  it('handles non-finite safely', () => {
    expect(formatNumber(NaN)).toBe('Error');
    expect(formatNumber(Infinity)).toBe('Error');
  });
});

describe('angle conversion helpers exposed via expressions', () => {
  it('180/pi returns 57.29… regardless of mode (pure division)', () => {
    expect(Math.abs(evalOk('180/pi', 'rad') - 57.295779513)).toBeLessThan(1e-6);
  });
});

// ---- Tests for theme persistence (see theme.test.ts) ----
