import { MONTHS, toTreeNodes, type Company, type Month, type TreeNode } from '@nevis/shared';

export interface ChartDatum {
  month: Month;
  existing: number;
  organic: number;
  paid: number;
}

const ORGANIC_CHANNEL_NAME = 'New organic';
const PAID_CHANNEL_NAME = 'New paid';

/**
 * Sums every channel node in the tree matching `channelName`, per month.
 * Generic over any tree shape — the real fixture only puts channels under
 * Anna Blackwood, but this walks the whole tree regardless of depth.
 */
function sumChannelByName(node: TreeNode, channelName: string, totals: number[]): void {
  if (node.kind === 'channel' && node.name === channelName) {
    node.values.forEach((value, index) => {
      totals[index] = (totals[index] ?? 0) + value;
    });
  }

  for (const child of node.children) {
    sumChannelByName(child, channelName, totals);
  }
}

/**
 * Maps a Company tree to per-month chart buckets (Assumption A3, binding):
 * `organic` and `paid` are the sums of "New organic" / "New paid" channel
 * nodes anywhere in the tree; `existing` is the company total minus those
 * two, clamped at zero, so the stack always totals the company figure.
 */
export function toChartData(company: Company): ChartDatum[] {
  const root = toTreeNodes(company);

  const organicTotals: number[] = new Array<number>(MONTHS.length).fill(0);
  const paidTotals: number[] = new Array<number>(MONTHS.length).fill(0);

  sumChannelByName(root, ORGANIC_CHANNEL_NAME, organicTotals);
  sumChannelByName(root, PAID_CHANNEL_NAME, paidTotals);

  return MONTHS.map((month, index) => {
    const companyTotal = company.values[index] ?? 0;
    const organic = organicTotals[index] ?? 0;
    const paid = paidTotals[index] ?? 0;
    const existing = Math.max(0, companyTotal - organic - paid);

    return { month, existing, organic, paid };
  });
}
