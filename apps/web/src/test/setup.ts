import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server.js';

// Recharts' <ResponsiveContainer> measures its DOM node to size the chart;
// jsdom has no layout engine, so it relies on a ResizeObserver to react to
// size changes. jsdom doesn't implement ResizeObserver at all, so we stub a
// no-op class purely to prevent a ReferenceError during render.
class ResizeObserverStub {
  observe(): void {
    // no-op: jsdom has no layout, nothing to observe.
  }

  unobserve(): void {
    // no-op
  }

  disconnect(): void {
    // no-op
  }
}

globalThis.ResizeObserver = ResizeObserverStub;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
