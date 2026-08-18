import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere below it in the tree and shows a
 * friendly fallback instead of an unmounted, blank page. React only supports
 * this via a class component (there is no hook equivalent for
 * componentDidCatch), so this stays a class despite the rest of the app
 * being function components.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // console.error is otherwise banned in this codebase (pino/no stray
    // logs), but componentDidCatch has no hook-based alternative for
    // reporting to the browser console/devtools, and this is the one place
    // in the app where a caught render error needs to be surfaced somewhere
    // for local debugging. Kept dev-only so production consoles stay clean.
    if (import.meta.env.DEV) {
      console.error('Uncaught error in DashboardPage:', error, errorInfo);
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-sm">
          <p className="text-[var(--color-text-primary)]">
            Something went wrong while displaying this page.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-4 rounded-full bg-[var(--color-series-existing)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-series-existing)] focus-visible:ring-offset-2"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
