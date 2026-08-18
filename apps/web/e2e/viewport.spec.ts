import { expect, test } from '@playwright/test';

// Cheap, high-signal regression guard for the "nothing may overflow at
// 375px" constraint: loads the dashboard at a narrow mobile viewport and
// asserts the document never grows wider than the viewport itself, both in
// the default (collapsed) state and after expanding every row it can find.
test.describe('375px containment', { tag: '@viewport' }, () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('dashboard does not horizontally overflow at 375px, default and fully expanded', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

    expect(await scrollWidth()).toBeLessThanOrEqual(375);

    // Expand every expandable row, repeatedly — expanding a row can reveal
    // further "Expand" buttons for its children (branches -> employees ->
    // channels), so keep clicking the first one left until none remain.
    const expandButton = page.getByRole('button', { name: /^Expand / });
    for (let guard = 0; guard < 20; guard += 1) {
      const count = await expandButton.count();
      if (count === 0) break;
      await expandButton.first().click();
    }

    await expect(expandButton).toHaveCount(0);
    expect(await scrollWidth()).toBeLessThanOrEqual(375);
  });
});
