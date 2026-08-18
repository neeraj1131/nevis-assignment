import type { Branch, Channel, Company, Employee } from './schema.js';

export interface TreeNode {
  id: string;
  name: string;
  values: readonly number[];
  depth: number;
  kind: 'company' | 'branch' | 'employee' | 'channel';
  children: TreeNode[];
}

function channelToNode(channel: Channel, depth: number): TreeNode {
  return {
    id: channel.id,
    name: channel.name,
    values: channel.values,
    depth,
    kind: 'channel',
    children: [],
  };
}

function employeeToNode(employee: Employee, depth: number): TreeNode {
  return {
    id: employee.id,
    name: employee.name,
    values: employee.values,
    depth,
    kind: 'employee',
    children: (employee.channels ?? []).map((channel) => channelToNode(channel, depth + 1)),
  };
}

function branchToNode(branch: Branch, depth: number): TreeNode {
  return {
    id: branch.id,
    name: branch.name,
    values: branch.values,
    depth,
    kind: 'branch',
    children: (branch.employees ?? []).map((employee) => employeeToNode(employee, depth + 1)),
  };
}

export function toTreeNodes(company: Company): TreeNode {
  return {
    id: company.id,
    name: company.name,
    values: company.values,
    depth: 0,
    kind: 'company',
    children: company.branches.map((branch) => branchToNode(branch, 1)),
  };
}
