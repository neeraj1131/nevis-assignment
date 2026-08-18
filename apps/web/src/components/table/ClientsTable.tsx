import type { TreeNode } from '@nevis/shared';
import { flattenVisible } from './flattenVisible.js';
import { TableRow } from './TableRow.js';
import { useExpansion } from './useExpansion.js';

export interface ClientsTableProps {
  root: TreeNode;
  months: readonly string[];
}

export function ClientsTable({ root, months }: ClientsTableProps) {
  const { expanded, toggle } = useExpansion([root.id]);
  const rows = flattenVisible(root, expanded);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            <th
              scope="col"
              className="px-4 pb-3 text-left text-sm font-normal text-[var(--color-text-secondary)]"
            >
              <span className="sr-only">Name</span>
            </th>
            {months.map((month) => (
              <th
                key={month}
                scope="col"
                className="whitespace-nowrap px-4 pb-3 text-right text-sm font-normal text-[var(--color-text-secondary)]"
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow key={row.node.id} row={row} onToggle={toggle} monthCount={months.length} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
