import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

afterEach(() => {
  cleanup();
  globalThis.localStorage?.clear();
  vi.restoreAllMocks();
});
