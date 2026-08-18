const PALETTE = [
  '#AF9EF2', // lavender (matches --color-series-existing)
  '#ECC0B6', // blush (matches --color-series-organic)
  '#9D626E', // maroon (matches --color-series-paid)
  '#8FB8DE', // soft blue
  '#9FCBA0', // soft green
  '#E3B04B', // soft amber
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
