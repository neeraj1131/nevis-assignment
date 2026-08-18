const numberFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });

/** Formats a plain integer with en-locale thousands grouping (e.g. 1234 -> "1,234"). */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
