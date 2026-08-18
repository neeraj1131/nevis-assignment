import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary.js';

function Bomb(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders a friendly fallback with a reload button when a child throws', () => {
    // React logs the caught error to the console by default during tests;
    // silence it so the expected failure doesn't look like a test problem.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText('Something went wrong while displaying this page.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('reloads the page when the reload button is clicked', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', { href: window.location.href, reload: reloadSpy });

    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: 'Reload page' }));

    expect(reloadSpy).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
