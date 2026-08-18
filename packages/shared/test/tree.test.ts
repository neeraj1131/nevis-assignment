import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CompanySchema } from '../src/schema.js';
import { toTreeNodes } from '../src/tree.js';

const fixturePath = fileURLToPath(new URL('./fixtures/clients-payload.json', import.meta.url));
const fixture: unknown = JSON.parse(readFileSync(fixturePath, 'utf-8'));
const company = CompanySchema.parse(fixture);

describe('toTreeNodes', () => {
  it('builds a company root node', () => {
    const root = toTreeNodes(company);
    expect(root.kind).toBe('company');
    expect(root.id).toBe(company.id);
    expect(root.name).toBe(company.name);
    expect(root.values).toEqual(company.values);
  });

  it('gives every branch a branch child', () => {
    const root = toTreeNodes(company);
    expect(root.children).toHaveLength(company.branches.length);
    for (const branchNode of root.children) {
      expect(branchNode.kind).toBe('branch');
    }
  });

  it('gives a branch without employees an empty children array', () => {
    const root = toTreeNodes(company);
    const branch2 = root.children.find((b) => b.name === 'Branch 2');
    expect(branch2).toBeDefined();
    expect(branch2?.children).toEqual([]);
  });

  it('gives every child of a branch kind employee', () => {
    const root = toTreeNodes(company);
    const branch1 = root.children.find((b) => b.name === 'Branch 1');
    expect(branch1).toBeDefined();
    for (const employeeNode of branch1?.children ?? []) {
      expect(employeeNode.kind).toBe('employee');
    }
  });

  it('gives an employee without channels an empty children array', () => {
    const root = toTreeNodes(company);
    const branch1 = root.children.find((b) => b.name === 'Branch 1');
    const james = branch1?.children.find((e) => e.name === 'James Walker');
    expect(james).toBeDefined();
    expect(james?.children).toEqual([]);
  });

  it('gives channels kind channel, only under Anna Blackwood', () => {
    const root = toTreeNodes(company);
    const branch1 = root.children.find((b) => b.name === 'Branch 1');
    const anna = branch1?.children.find((e) => e.name === 'Anna Blackwood');
    expect(anna).toBeDefined();
    expect(anna?.children.length).toBeGreaterThan(0);
    for (const channelNode of anna?.children ?? []) {
      expect(channelNode.kind).toBe('channel');
    }
  });

  it('never recomputes values from children', () => {
    const root = toTreeNodes(company);
    expect(root.values).toEqual(company.values);
  });
});
