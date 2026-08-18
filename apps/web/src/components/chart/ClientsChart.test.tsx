import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Company } from '@nevis/shared';
import fixture from '../../test/fixtures/clients-payload.json' with { type: 'json' };
import { ClientsChart } from './ClientsChart.js';
import { toChartData } from './toChartData.js';
import { CHART_LEGEND_LABELS } from './chartTheme.js';

const company: Company = fixture;

function mockPrefersReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

describe('ClientsChart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a bar rect per non-zero series/month segment and the legend labels', () => {
    const data = toChartData(company);

    // 12 months x 3 series = 36 possible segments. Recharts does not render
    // a <rect> for a stacked segment whose value is 0, so the exact count is
    // 36 minus the zero-value segments in the real fixture: organic is 0 in
    // Feb 2024 and Jun 2024 (2 zeros), paid is 0 in Feb 2024, Mar 2024, and
    // Aug 2024 (3 zeros), existing is never 0. Expected: 36 - 5 = 31.
    const zeroSegments = data.reduce((count, bucket) => {
      return (
        count +
        (bucket.existing === 0 ? 1 : 0) +
        (bucket.organic === 0 ? 1 : 0) +
        (bucket.paid === 0 ? 1 : 0)
      );
    }, 0);
    const expectedRectCount = data.length * 3 - zeroSegments;
    expect(zeroSegments).toBe(5);
    expect(expectedRectCount).toBe(31);

    const { container } = render(<ClientsChart data={data} width={800} height={400} />);

    // Recharts skips rendering a `.recharts-bar-rectangle` wrapper entirely
    // for a zero-value stacked segment (there's nothing to draw a shape
    // animation for), so this element count already reflects the filtering
    // described above.
    const rects = container.querySelectorAll('.recharts-bar-rectangle');
    expect(rects).toHaveLength(expectedRectCount);

    expect(screen.getByText(CHART_LEGEND_LABELS.existing)).toBeInTheDocument();
    expect(screen.getByText(CHART_LEGEND_LABELS.organic)).toBeInTheDocument();
    expect(screen.getByText(CHART_LEGEND_LABELS.paid)).toBeInTheDocument();
  });

  it('rounds only the top-most non-zero segment of each month (12 rounded bar rects)', () => {
    // Under prefers-reduced-motion, ClientsChart sets isAnimationActive=false,
    // so Recharts skips its entrance animation and renders each bar rect's
    // final `d` path directly instead of an interpolated/animated one — the
    // only way to get real, assertable rounded-corner geometry out of
    // Recharts under jsdom (which has no layout/animation engine).
    mockPrefersReducedMotion(true);

    const data = toChartData(company);
    const { container } = render(<ClientsChart data={data} width={800} height={400} />);

    const rectPaths = Array.from(container.querySelectorAll('.recharts-bar-rectangle path'));
    // A rounded-corner rect path draws its corners with SVG arc ('A')
    // commands; a plain (unrounded, radius 0) rect path does not.
    const roundedPaths = rectPaths.filter((path) => path.getAttribute('d')?.includes('A'));

    // One rounded segment per month: segmentRadius() only rounds the
    // top-most non-zero series for that month (see ClientsChart.tsx), and
    // the fixture has 12 months.
    expect(roundedPaths).toHaveLength(12);
  });
});
