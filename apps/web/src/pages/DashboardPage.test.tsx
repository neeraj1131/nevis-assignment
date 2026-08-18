import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { renderWithClient } from '../test/renderWithClient.js';
import { server } from '../test/server.js';
import { DashboardPage } from './DashboardPage.js';

async function renderDashboard() {
  renderWithClient(<DashboardPage />);
  await waitFor(() => screen.getByRole('table'));
}

/** Finds the <tr> that contains a cell/rowheader with this exact name text. */
function findRow(name: string): HTMLElement {
  const cell = screen.getByText(name);
  const row = cell.closest('tr');
  if (!row) {
    throw new Error(`No <tr> ancestor found for text "${name}"`);
  }
  return row;
}

describe('DashboardPage', () => {
  describe('expand/collapse (Step 17)', () => {
    it('shows the company and its branches by default, with employees hidden', async () => {
      await renderDashboard();

      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Branch 1')).toBeInTheDocument();
      expect(screen.getByText('Branch 2')).toBeInTheDocument();
      expect(screen.getByText('Branch 3')).toBeInTheDocument();

      expect(screen.queryByText('Anna Blackwood')).not.toBeInTheDocument();
      expect(screen.queryByText('James Walker')).not.toBeInTheDocument();
    });

    it('expands Branch 1 to reveal its 5 employees in order, and collapses again on a second click', async () => {
      const user = userEvent.setup();
      await renderDashboard();

      await user.click(screen.getByRole('button', { name: 'Expand Branch 1' }));

      const employeeNames = [
        'Anna Blackwood',
        'James Walker',
        'Maria Gutierrez',
        'Robert Chen',
        'Sarah Smith',
      ];
      const allRows = screen.getAllByRole('row');
      const employeeIndices = employeeNames.map((name) => allRows.indexOf(findRow(name)));

      const isStrictlyIncreasing = employeeIndices.every((index, position) => {
        if (position === 0) {
          return true;
        }
        const previous: number | undefined = employeeIndices[position - 1];
        return previous !== undefined && index > previous;
      });
      expect(isStrictlyIncreasing).toBe(true);

      expect(screen.getByRole('button', { name: 'Collapse Branch 1' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );

      await user.click(screen.getByRole('button', { name: 'Collapse Branch 1' }));

      employeeNames.forEach((name) => {
        expect(screen.queryByText(name)).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: 'Expand Branch 1' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('Branch 2 and Branch 3 have no toggle button, nor do channel rows', async () => {
      const user = userEvent.setup();
      await renderDashboard();

      expect(screen.queryByRole('button', { name: /Branch 2/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Branch 3/ })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Expand Branch 1' }));
      await user.click(screen.getByRole('button', { name: 'Expand Anna Blackwood' }));

      expect(screen.queryByRole('button', { name: /Existing clients/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /New organic/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /New paid/ })).not.toBeInTheDocument();
    });

    it('expands Anna Blackwood to reveal her channel rows', async () => {
      const user = userEvent.setup();
      await renderDashboard();

      await user.click(screen.getByRole('button', { name: 'Expand Branch 1' }));
      await user.click(screen.getByRole('button', { name: 'Expand Anna Blackwood' }));

      expect(screen.getByText('Existing clients')).toBeInTheDocument();
      expect(screen.getByText('New organic')).toBeInTheDocument();
      expect(screen.getByText('New paid')).toBeInTheDocument();
    });

    it('supports keyboard interaction: tab to a toggle, Enter and Space both toggle it', async () => {
      const user = userEvent.setup();
      await renderDashboard();

      let toggle: Element | null = null;
      for (let i = 0; i < 20 && !toggle; i += 1) {
        await user.tab();
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          active.tagName === 'BUTTON' &&
          active.getAttribute('aria-label') === 'Expand Branch 1'
        ) {
          toggle = active;
        }
      }
      expect(toggle).not.toBeNull();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Anna Blackwood')).toBeInTheDocument();
      expect(document.activeElement).toHaveAttribute('aria-expanded', 'true');

      await user.keyboard(' ');
      expect(screen.queryByText('Anna Blackwood')).not.toBeInTheDocument();
      expect(document.activeElement).toHaveAttribute('aria-expanded', 'false');
    });

    it('renders semantic column headers for all 12 months and known cell values', async () => {
      await renderDashboard();

      const table = screen.getByRole('table');
      const columnHeaders = within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent);

      expect(columnHeaders).toEqual([
        'Name',
        'Feb 2024',
        'Mar 2024',
        'Apr 2024',
        'May 2024',
        'Jun 2024',
        'Jul 2024',
        'Aug 2024',
        'Sep 2024',
        'Oct 2024',
        'Nov 2024',
        'Dec 2024',
        'Jan 2025',
      ]);

      const branch2Cells = within(findRow('Branch 2'))
        .getAllByRole('cell')
        .map((cell) => cell.textContent);

      expect(branch2Cells[0]).toBe('76');
      expect(branch2Cells[branch2Cells.length - 1]).toBe('91');
    });

    it('exposes the hierarchy to assistive tech via visually-hidden text in the Branch 2 rowheader', async () => {
      await renderDashboard();

      const branch2Row = findRow('Branch 2');
      const rowheader = within(branch2Row).getByRole('rowheader');
      expect(rowheader.textContent).toContain('level 2, 2 of 3');
    });
  });

  describe('chart wiring (Step 18)', () => {
    it('feeds real client data into the chart', async () => {
      await renderDashboard();

      // The sr-only chart description is rendered outside <ResponsiveContainer>,
      // so it reflects real data even though jsdom reports a 0x0 container
      // (see ClientsChart.test.tsx for the pixel-level bar/legend assertions).
      expect(
        screen.getByText(/Stacked bar chart of clients by month, from Feb 2024 to Jan 2025\./),
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows role="status" while the request is in flight', () => {
      server.use(
        http.get('/api/v1/clients', async () => {
          await delay('infinite');
          return HttpResponse.json({});
        }),
      );

      renderWithClient(<DashboardPage />);

      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('shows an error card with Retry, and Retry recovers once the handler succeeds again', async () => {
      server.use(
        http.get('/api/v1/clients', () => {
          return HttpResponse.json({ error: 'boom' }, { status: 500 });
        }),
      );

      const user = userEvent.setup();
      renderWithClient(<DashboardPage />);

      const retryButton = await screen.findByRole('button', { name: 'Retry' });
      expect(
        screen.getByText('Something went wrong while loading client data.'),
      ).toBeInTheDocument();

      server.resetHandlers();

      await user.click(retryButton);

      await waitFor(() => screen.getByRole('table'));
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });
  });
});
