/**
 * Series colors mirror the CSS custom properties defined in `src/index.css`
 * (`@theme` block). Recharts needs literal color values (SVG fill/stroke
 * can't resolve Tailwind's `var(--color-*)` utility classes at the point
 * Recharts computes them), so we duplicate the sampled hex values here and
 * document the mapping back to the CSS tokens.
 */
export const CHART_COLORS = {
  /** Mirrors --color-series-existing */
  existing: '#AF9EF2',
  /** Mirrors --color-series-organic */
  organic: '#ECC0B6',
  /** Mirrors --color-series-paid */
  paid: '#9D626E',
} as const;

export const CHART_LEGEND_LABELS = {
  existing: 'Existing clients',
  organic: 'New organic',
  paid: 'New paid',
} as const;
