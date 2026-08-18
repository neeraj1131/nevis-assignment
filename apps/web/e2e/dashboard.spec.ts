import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('clients dashboard', () => {
  test('journey: chart + table load, expand branch and employee reveals nested rows, keyboard toggles too', async ({
    page,
  }) => {
    await page.goto('/');

    // Chart renders (Recharts draws an SVG with the accessibility layer's
    // role/description) and the table renders with the company row.
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
    await expect(page.locator('.recharts-surface')).toBeVisible();
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByText('Company')).toBeVisible();
    await expect(table.getByText('Branch 1')).toBeVisible();

    // Anna Blackwood is hidden until Branch 1 is expanded.
    await expect(table.getByText('Anna Blackwood')).toHaveCount(0);

    const expandBranch1 = page.getByRole('button', { name: 'Expand Branch 1' });
    await expandBranch1.click();
    await expect(table.getByText('Anna Blackwood')).toBeVisible();

    // Expanding Anna reveals her channels, including "New organic".
    await expect(table.getByText('New organic')).toHaveCount(0);
    const expandAnna = page.getByRole('button', { name: 'Expand Anna Blackwood' });
    await expandAnna.click();
    await expect(table.getByText('New organic')).toBeVisible();

    // Keyboard variant: collapsing Branch 1 via focus + Enter hides Anna
    // Blackwood (and her now-expanded channel rows) again.
    const collapseBranch1 = page.getByRole('button', { name: 'Collapse Branch 1' });
    await collapseBranch1.focus();
    await expect(collapseBranch1).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(table.getByText('Anna Blackwood')).toHaveCount(0);
    await expect(table.getByText('New organic')).toHaveCount(0);
  });

  test('a11y: no serious/critical violations in the default or fully-expanded state', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    const defaultScan = await new AxeBuilder({ page }).analyze();
    const defaultSerious = defaultScan.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(defaultSerious, JSON.stringify(defaultSerious, null, 2)).toEqual([]);

    await page.getByRole('button', { name: 'Expand Branch 1' }).click();
    await page.getByRole('button', { name: 'Expand Anna Blackwood' }).click();
    await expect(page.getByRole('table').getByText('New organic')).toBeVisible();

    const expandedScan = await new AxeBuilder({ page }).analyze();
    const expandedSerious = expandedScan.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(expandedSerious, JSON.stringify(expandedSerious, null, 2)).toEqual([]);
  });
});
