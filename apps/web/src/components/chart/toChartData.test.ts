import { describe, expect, it } from 'vitest';
import { MONTHS, type Company } from '@nevis/shared';
import fixture from '../../test/fixtures/clients-payload.json' with { type: 'json' };
import { toChartData } from './toChartData.js';

const company: Company = fixture;

describe('toChartData', () => {
  it('returns 12 buckets in MONTHS order', () => {
    const result = toChartData(company);

    expect(result).toHaveLength(12);
    result.forEach((bucket, index) => {
      expect(bucket.month).toBe(MONTHS[index]);
    });
  });

  it('sums "New organic" and "New paid" channel nodes across the whole tree', () => {
    const result = toChartData(company);

    // Real fixture: only Anna Blackwood (Branch 1) has channels.
    // New organic: [0, 1, 1, 1, 0, 2, 2, 1, 1, 1, 1, 2]
    // New paid:    [0, 0, 1, 1, 2, 1, 0, 2, 1, 1, 1, 2]
    const expectedOrganic = [0, 1, 1, 1, 0, 2, 2, 1, 1, 1, 1, 2];
    const expectedPaid = [0, 0, 1, 1, 2, 1, 0, 2, 1, 1, 1, 2];

    result.forEach((bucket, index) => {
      expect(bucket.organic).toBe(expectedOrganic[index]);
      expect(bucket.paid).toBe(expectedPaid[index]);
    });
  });

  it('derives existing as company total minus organic minus paid, so the stack totals the company figure', () => {
    const result = toChartData(company);

    result.forEach((bucket, index) => {
      const companyTotal = company.values[index] ?? 0;
      expect(bucket.existing + bucket.organic + bucket.paid).toBe(companyTotal);
    });
  });

  it('treats a tree with zero channel nodes as existing = company total', () => {
    const noChannelsCompany: Company = {
      id: 'c1',
      name: 'No Channels Co',
      values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
      branches: [
        {
          id: 'b1',
          name: 'Branch 1',
          values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
          employees: [
            {
              id: 'e1',
              name: 'Employee 1',
              values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
            },
          ],
        },
      ],
    };

    const result = toChartData(noChannelsCompany);

    result.forEach((bucket, index) => {
      expect(bucket.organic).toBe(0);
      expect(bucket.paid).toBe(0);
      expect(bucket.existing).toBe(noChannelsCompany.values[index]);
    });
  });

  it('clamps existing at zero when organic + paid exceed the company total defensively', () => {
    const overshootCompany: Company = {
      id: 'c1',
      name: 'Overshoot Co',
      values: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      branches: [
        {
          id: 'b1',
          name: 'Branch 1',
          values: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          employees: [
            {
              id: 'e1',
              name: 'Employee 1',
              values: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              channels: [
                {
                  id: 'ch1',
                  name: 'New organic',
                  values: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                },
                {
                  id: 'ch2',
                  name: 'New paid',
                  values: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = toChartData(overshootCompany);

    expect(result[0]?.existing).toBe(0);
    expect(result[0]?.organic).toBe(3);
    expect(result[0]?.paid).toBe(10);
  });
});
