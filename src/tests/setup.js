import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock scrollIntoView as it's not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Runs cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
