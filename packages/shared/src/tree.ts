import type { Branch, Channel, Company, Employee } from './schema.js';

export interface TreeNode {
  id: string;
  name: string;
  values: readonly number[];
  kind: 'company' | 'branch' | 'employee' | 'channel';
  children: TreeNode[];
}

function channelToNode(channel: Channel): TreeNode {
  return {
    id: channel.id,
    name: channel.name,
    values: channel.values,
    kind: 'channel',
    children: [],
  };
}

function employeeToNode(employee: Employee): TreeNode {
  return {
    id: employee.id,
    name: employee.name,
    values: employee.values,
    kind: 'employee',
    children: (employee.channels ?? []).map((channel) => channelToNode(channel)),
  };
}

function branchToNode(branch: Branch): TreeNode {
  return {
    id: branch.id,
    name: branch.name,
    values: branch.values,
    kind: 'branch',
    children: (branch.employees ?? []).map((employee) => employeeToNode(employee)),
  };
}

export function toTreeNodes(company: Company): TreeNode {
  return {
    id: company.id,
    name: company.name,
    values: company.values,
    kind: 'company',
    children: company.branches.map((branch) => branchToNode(branch)),
  };
}
