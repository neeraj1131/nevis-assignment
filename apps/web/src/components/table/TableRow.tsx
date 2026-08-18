import type { VisibleRow } from './flattenVisible.js';
import { Avatar } from '../ui/Avatar.js';

const INDENT_STEP_PX = 24;
const BASE_PADDING_PX = 16;

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      width="10"
      height="10"
      className="shrink-0"
      style={{
        transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 120ms ease',
      }}
    >
      <path
        d="M2.5 4.5 L6 8 L9.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface TableRowProps {
  row: VisibleRow;
  onToggle: (id: string) => void;
  monthCount: number;
}

export function TableRow({ row, onToggle, monthCount }: TableRowProps) {
  const { node, depth, isExpandable, isExpanded } = row;
  const isCompany = node.kind === 'company';
  const isEmployee = node.kind === 'employee';

  const paddingLeft = BASE_PADDING_PX + depth * INDENT_STEP_PX;

  return (
    <tr className="border-t border-black/5 hover:bg-black/[0.02]">
      <th
        scope="row"
        className={`h-[52px] whitespace-nowrap px-4 text-left text-sm font-normal text-[var(--color-text-primary)] ${
          isCompany ? 'font-semibold' : ''
        }`}
        style={{ paddingLeft }}
      >
        <span className="flex items-center gap-2">
          {isExpandable ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label={(isExpanded ? 'Collapse ' : 'Expand ') + node.name}
              onClick={() => {
                onToggle(node.id);
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--color-text-secondary)] hover:bg-black/5"
            >
              <ChevronIcon expanded={isExpanded} />
            </button>
          ) : (
            <span aria-hidden="true" className="h-5 w-5 shrink-0" />
          )}
          {isEmployee ? <Avatar id={node.id} name={node.name} /> : null}
          <span>{node.name}</span>
        </span>
      </th>
      {Array.from({ length: monthCount }, (_, index) => (
        <td
          key={`${node.id}-${String(index)}`}
          className="h-[52px] px-4 text-right text-sm tabular-nums text-[var(--color-text-primary)]"
        >
          {node.values[index] ?? 0}
        </td>
      ))}
    </tr>
  );
}
