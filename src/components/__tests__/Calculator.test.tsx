import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from '../Calculator';

/** Render in Advanced mode so AC / memory keys are available. */
const setup = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<Calculator />);
  await user.click(screen.getByRole('button', { name: 'Advanced' }));
  return user;
};

/** Click calculator buttons by their accessible label. */
const press = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByRole('button', { name: label }));
};

describe('Calculator component interactions', () => {
  it('renders display and basic buttons', async () => {
    const user = userEvent.setup();
    await setup(user);
    expect(screen.getByRole('button', { name: 'AC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '=' })).toBeInTheDocument();
  });

  it('computes 25+35=60 via clicks', async () => {
    const user = userEvent.setup();
    await setup(user);
    await press(user, '2');
    await press(user, '5');
    await press(user, '+');
    await press(user, '3');
    await press(user, '5');
    await press(user, '=');
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
  });

  it('AC clears the display', async () => {
    const user = userEvent.setup();
    await setup(user);
    await press(user, '7');
    await press(user, 'AC');
    expect(screen.getByTestId('display-value').textContent).toBe('0');
  });

  it('backspace deletes last character', async () => {
    const user = userEvent.setup();
    await setup(user);
    await press(user, '7');
    await press(user, '8');
    await press(user, 'Delete last character');
    expect(screen.getByTestId('display-value').textContent).toBe('7');
  });

  it('division by zero shows friendly error, display not crashed', async () => {
    const user = userEvent.setup();
    await setup(user);
    await press(user, '5');
    await press(user, '÷');
    await press(user, '0');
    await press(user, '=');
    expect(screen.getByText(/divide by zero/i)).toBeInTheDocument();
  });

  it('keyboard input works: 12*3 Enter → 36', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('12*3{Enter}');
    expect(screen.getByTestId('display-value').textContent).toBe('36');
  });

  it('keyboard Escape clears', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('9{Escape}');
    expect(screen.getByTestId('display-value').textContent).toBe('0');
  });

  it('keyboard Backspace deletes', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('78{Backspace}');
    expect(screen.getByTestId('display-value').textContent).toBe('7');
  });

  it('unsupported keys do nothing', async () => {
    const user = userEvent.setup();
    const err = vi.spyOn(console, 'error');
    await setup(user);
    await user.keyboard('abc!@#');
    expect(screen.getByTestId('display-value').textContent).toBe('0');
    expect(err).not.toHaveBeenCalled();
  });

  it('history persists via localStorage', async () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem,
      clear: vi.fn(),
    });
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('2+2{Enter}');
    // history component saves via localStorage.setItem
    expect(setItem).toHaveBeenCalled();
    // history saves empty array on mount, then the entry after equals
    const calls = setItem.mock.calls.filter((c) => c[0] === 'sci-calc-history');
    expect(calls.length).toBeGreaterThan(0);
    const stored = JSON.parse(calls[calls.length - 1][1]);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].result).toBe('4');
    vi.unstubAllGlobals();
  });

  it('clicking a history item reuses its result', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('6*7{Enter}');
    fireEvent.click(screen.getByRole('button', { name: 'Toggle calculation history' }));
    const historyItem = screen.getAllByLabelText(/Use result 42/)[0];
    fireEvent.click(historyItem);
    expect(screen.getByTestId('display-value').textContent).toBe('42');
  });

  it('memory M+ / MR works', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('8{Enter}');
    await press(user, 'M+');
    await press(user, 'AC');
    await press(user, 'MR');
    expect(screen.getByTestId('display-value').textContent).toBe('8');
  });

  it('M- subtracts from memory', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('10{Enter}');
    await press(user, 'M+');
    await user.keyboard('3{Enter}');
    await press(user, 'M-');
    await press(user, 'AC');
    await press(user, 'MR');
    expect(screen.getByTestId('display-value').textContent).toBe('7');
  });

  it('MC clears memory', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('10{Enter}');
    await press(user, 'M+');
    await press(user, 'MC');
    // memory indicator disappears
    expect(screen.queryByText(/Memory:/)).not.toBeInTheDocument();
  });

  it('DEG/RAD toggle switches label', async () => {
    const user = userEvent.setup();
    await setup(user);
    const toggle = screen.getByLabelText(/Angle mode/);
    const before = toggle.textContent;
    await user.click(toggle);
    expect(toggle.textContent).not.toBe(before);
  });

  it('mode switch changes keypad', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await user.click(screen.getByRole('button', { name: 'Standard' }));
    expect(screen.getByRole('button', { name: 'AC' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'sin' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Scientific' }));
    expect(screen.getByRole('button', { name: 'sin' })).toBeInTheDocument();
  });

  it('error state recovers on next input', async () => {
    const user = userEvent.setup();
    await setup(user);
    await user.keyboard('5/0{Enter}');
    await press(user, 'AC');
    await press(user, '9');
    expect(screen.queryByText(/divide by zero/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('display-value').textContent).toBe('9');
  });
});
