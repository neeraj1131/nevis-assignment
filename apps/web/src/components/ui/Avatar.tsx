// Darkened variants of the chart theme's hues, chosen so white avatar text
// clears WCAG AA's 4.5:1 contrast ratio (verified against #ffffff) — the
// lighter chart colors themselves read fine as chart fills, but fail
// contrast once used as a background behind white initials.
const PALETTE = [
  '#6E5FC7', // lavender (darkened --color-series-existing)
  '#A85C50', // blush (darkened --color-series-organic)
  '#7A3B47', // maroon (matches --color-series-paid)
  '#3E6FA0', // soft blue
  '#2E7A48', // soft green
  '#A3690A', // soft amber
] as const;

function hashId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : (words[0]?.[1] ?? '');
  return (first + second).toUpperCase();
}

export interface AvatarProps {
  id: string;
  name: string;
}

/**
 * Deterministic initials avatar. The payload has no avatar images, so we
 * derive two-letter initials from the name and a background color from the
 * node id, keeping the same person always rendered the same way.
 */
export function Avatar({ id, name }: AvatarProps) {
  const color = PALETTE[hashId(id) % PALETTE.length];

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initialsFromName(name)}
    </span>
  );
}
