import type { FC } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDatum } from './toChartData.js';
import { CHART_COLORS, CHART_LEGEND_LABELS } from './chartTheme.js';
import { formatNumber } from '../../lib/formatNumber.js';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

export interface ClientsChartProps {
  data: ChartDatum[];
  /**
   * Fixed pixel dimensions that bypass <ResponsiveContainer>. Test-only
   * affordance: ResponsiveContainer measures its parent via ResizeObserver,
   * which reports a 0x0 box under jsdom (no real layout engine), so
   * component tests wouldn't otherwise get a chart with real dimensions.
   * Leave unset in the app so production keeps the responsive behavior.
   */
  width?: number;
  height?: number;
}

const Y_AXIS_TICKS = [0, 100, 200, 300, 400];

interface LegendPayloadEntry {
  value?: string;
  color?: string;
}

function ChartLegend({ payload }: { payload?: LegendPayloadEntry[] }) {
  if (!payload) {
    return null;
  }

  return (
    <ul className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
  name?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-[var(--color-card)] px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-[var(--color-text-primary)]">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="flex items-center gap-2 text-[var(--color-text-secondary)]"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name} {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

type SeriesKey = 'existing' | 'organic' | 'paid';

// Visual stacking order, top to bottom (Bar order in JSX below is bottom to
// top, so this is the reverse of that render order).
const STACK_ORDER_TOP_DOWN: readonly SeriesKey[] = ['paid', 'organic', 'existing'];

function isTopMostNonZeroSegment(datum: ChartDatum, key: SeriesKey): boolean {
  const topMostNonZeroKey = STACK_ORDER_TOP_DOWN.find((candidate) => datum[candidate] > 0);
  return topMostNonZeroKey === key;
}

type RectRadius = number | [number, number, number, number];

/**
 * M3: `paid` is 0 in Feb/Mar/Aug, so a fixed `radius` on the `paid` Bar alone
 * renders a flat top those months. Recharts' `radius` prop is fixed per
 * `<Bar>`, so per-month variation needs a `<Cell>` child per data point
 * (deliberately *not* Recharts' `shape` prop: setting a custom `shape`
 * disables Recharts' own built-in "don't render a rectangle for a
 * zero-value segment" filtering, which would re-introduce phantom rects for
 * the zero months this fix is about). `radius` isn't in `Cell`'s declared
 * prop type — Bar's rectangle-building code reads it off `Cell`'s raw props
 * regardless (the same mechanism used for per-cell `fill`) — so this narrow
 * cast documents that gap instead of silently widening Cell's props.
 *
 * `Cell` itself is marked `@deprecated` upstream (recharts steers new code
 * toward `shape`/`content`), but `shape` is unusable here for the reason
 * above — this is a deliberate, narrow exception, not an oversight.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- see comment above
const RoundableCell = Cell as unknown as FC<{ key: string; radius: RectRadius }>;

function segmentRadius(datum: ChartDatum, seriesKey: SeriesKey): RectRadius {
  return isTopMostNonZeroSegment(datum, seriesKey) ? [4, 4, 0, 0] : 0;
}

function describeChart(data: ChartDatum[]): string {
  if (data.length === 0) {
    return 'No client data available.';
  }

  const totals = data.map((bucket) => bucket.existing + bucket.organic + bucket.paid);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const first = data[0];
  const last = data[data.length - 1];

  return (
    `Stacked bar chart of clients by month, from ${first?.month ?? ''} to ${last?.month ?? ''}. ` +
    `Each bar splits into existing clients, new organic clients, and new paid clients. ` +
    `Monthly totals range from ${String(min)} to ${String(max)}.`
  );
}

export function ClientsChart({ data, width, height }: ClientsChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isAnimationActive = !prefersReducedMotion;

  const chart = (
    <BarChart
      data={data}
      {...(width !== undefined && height !== undefined ? { width, height } : {})}
      accessibilityLayer
      barCategoryGap="20%"
      margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
    >
      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E1D8" />
      <XAxis
        dataKey="month"
        axisLine={false}
        tickLine={false}
        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
      />
      <YAxis
        ticks={Y_AXIS_TICKS}
        domain={[0, 400]}
        axisLine={false}
        tickLine={false}
        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
      />
      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
      <Legend content={<ChartLegend />} position="bottom" />
      <Bar
        dataKey="existing"
        name={CHART_LEGEND_LABELS.existing}
        stackId="clients"
        fill={CHART_COLORS.existing}
        isAnimationActive={isAnimationActive}
      >
        {data.map((datum) => (
          <RoundableCell key={datum.month} radius={segmentRadius(datum, 'existing')} />
        ))}
      </Bar>
      <Bar
        dataKey="organic"
        name={CHART_LEGEND_LABELS.organic}
        stackId="clients"
        fill={CHART_COLORS.organic}
        isAnimationActive={isAnimationActive}
      >
        {data.map((datum) => (
          <RoundableCell key={datum.month} radius={segmentRadius(datum, 'organic')} />
        ))}
      </Bar>
      <Bar
        dataKey="paid"
        name={CHART_LEGEND_LABELS.paid}
        stackId="clients"
        fill={CHART_COLORS.paid}
        isAnimationActive={isAnimationActive}
      >
        {data.map((datum) => (
          <RoundableCell key={datum.month} radius={segmentRadius(datum, 'paid')} />
        ))}
      </Bar>
    </BarChart>
  );

  return (
    <div>
      <p className="sr-only">{describeChart(data)}</p>
      {width !== undefined && height !== undefined ? (
        chart
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          {chart}
        </ResponsiveContainer>
      )}
    </div>
  );
}
