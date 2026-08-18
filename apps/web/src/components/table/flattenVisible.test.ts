import { describe, expect, it } from 'vitest';
import type { TreeNode } from '@nevis/shared';
import { flattenVisible } from './flattenVisible.js';

function channel(id: string, name: string): TreeNode {
  return { id, name, values: [0], kind: 'channel', children: [] };
}

function employee(id: string, name: string, children: TreeNode[] = []): TreeNode {
  return { id, name, values: [0], kind: 'employee', children };
}

function branch(id: string, name: string, children: TreeNode[] = []): TreeNode {
  return { id, name, values: [0], kind: 'branch', children };
}

function buildTree(): TreeNode {
  const anna = employee('anna', 'Anna Blackwood', [
    channel('ch1', 'Existing clients'),
    channel('ch2', 'New organic'),
    channel('ch3', 'New paid'),
  ]);
  const branch1 = branch('branch1', 'Branch 1', [
    anna,
    employee('james', 'James Walker'),
    employee('maria', 'Maria Gutierrez'),
    employee('robert', 'Robert Chen'),
    employee('sarah', 'Sarah Smith'),
  ]);
  const branch2 = branch('branch2', 'Branch 2');
  const branch3 = branch('branch3', 'Branch 3');

  return {
    id: 'company',
    name: 'Company',
    values: [0],
    kind: 'company',
    children: [branch1, branch2, branch3],
  };
}

describe('flattenVisible', () => {
  it('returns just the root row when the company is collapsed', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set());

    expect(rows).toHaveLength(1);
    expect(rows[0]?.node.id).toBe('company');
    expect(rows[0]?.isExpandable).toBe(true);
    expect(rows[0]?.isExpanded).toBe(false);
  });

  it('returns company + 3 branches when the company is expanded', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set(['company']));

    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.node.id)).toEqual(['company', 'branch1', 'branch2', 'branch3']);
  });

  it('expanding Branch 1 adds its 5 employees in order right after it', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set(['company', 'branch1']));

    expect(rows.map((row) => row.node.id)).toEqual([
      'company',
      'branch1',
      'anna',
      'james',
      'maria',
      'robert',
      'sarah',
      'branch2',
      'branch3',
    ]);
  });

  it('Branch 2 and Branch 3 are not expandable since they have no children', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set(['company']));

    const branch2Row = rows.find((row) => row.node.id === 'branch2');
    const branch3Row = rows.find((row) => row.node.id === 'branch3');

    expect(branch2Row?.isExpandable).toBe(false);
    expect(branch3Row?.isExpandable).toBe(false);
  });

  it('expanding Anna adds her 3 channels right after her row', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set(['company', 'branch1', 'anna']));

    expect(rows.map((row) => row.node.id)).toEqual([
      'company',
      'branch1',
      'anna',
      'ch1',
      'ch2',
      'ch3',
      'james',
      'maria',
      'robert',
      'sarah',
      'branch2',
      'branch3',
    ]);
  });

  it('collapsing a parent hides all descendants even if their own expanded flags remain set', () => {
    const root = buildTree();
    // anna and branch1 are "expanded" in the set, but company itself is not.
    const rows = flattenVisible(root, new Set(['branch1', 'anna']));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.node.id).toBe('company');
  });

  it('computes posInSet/setSize correctly for siblings', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set(['company', 'branch1']));

    const company = rows.find((row) => row.node.id === 'company');
    expect(company).toMatchObject({ posInSet: 1, setSize: 1 });

    const branch1 = rows.find((row) => row.node.id === 'branch1');
    const branch2 = rows.find((row) => row.node.id === 'branch2');
    const branch3 = rows.find((row) => row.node.id === 'branch3');
    expect(branch1).toMatchObject({ posInSet: 1, setSize: 3 });
    expect(branch2).toMatchObject({ posInSet: 2, setSize: 3 });
    expect(branch3).toMatchObject({ posInSet: 3, setSize: 3 });

    const anna = rows.find((row) => row.node.id === 'anna');
    const sarah = rows.find((row) => row.node.id === 'sarah');
    expect(anna).toMatchObject({ posInSet: 1, setSize: 5 });
    expect(sarah).toMatchObject({ posInSet: 5, setSize: 5 });
  });

  it('reports depth matching the row nesting level', () => {
    const root = buildTree();
    const rows = flattenVisible(root, new Set(['company', 'branch1', 'anna']));

    expect(rows.find((row) => row.node.id === 'company')?.depth).toBe(0);
    expect(rows.find((row) => row.node.id === 'branch1')?.depth).toBe(1);
    expect(rows.find((row) => row.node.id === 'anna')?.depth).toBe(2);
    expect(rows.find((row) => row.node.id === 'ch1')?.depth).toBe(3);
  });
});
