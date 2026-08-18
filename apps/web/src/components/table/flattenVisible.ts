import type { TreeNode } from '@nevis/shared';

export interface VisibleRow {
  node: TreeNode;
  depth: number;
  isExpandable: boolean;
  isExpanded: boolean;
  posInSet: number;
  setSize: number;
}

/**
 * Depth-first flatten of a TreeNode into the rows that should currently be
 * rendered, given a set of expanded node ids. A node's children are only
 * included when the node itself is in `expanded` — collapsing a parent hides
 * all descendants regardless of their own membership in `expanded`.
 */
export function flattenVisible(root: TreeNode, expanded: ReadonlySet<string>): VisibleRow[] {
  const rows: VisibleRow[] = [];

  function visit(node: TreeNode, depth: number, posInSet: number, setSize: number): void {
    const isExpandable = node.children.length > 0;
    const isExpanded = isExpandable && expanded.has(node.id);

    rows.push({ node, depth, isExpandable, isExpanded, posInSet, setSize });

    if (!isExpanded) {
      return;
    }

    const childCount = node.children.length;
    node.children.forEach((child, index) => {
      visit(child, depth + 1, index + 1, childCount);
    });
  }

  visit(root, 0, 1, 1);

  return rows;
}
