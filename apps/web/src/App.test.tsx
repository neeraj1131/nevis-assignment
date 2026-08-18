import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';

describe('App', () => {
  beforeEach(() => {
    // Prevent a real network call from jsdom during this smoke test; the
    // data-layer behavior itself is covered by client.ts / toChartData tests.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('error', { status: 500 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the Clients heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument();
  });
});
