import { expect, pageAs, test } from './fixtures';

test('theme toggle cycles and survives a reload', async ({ browser, baseURL, users }) => {
  const page = await pageAs(browser, baseURL!, users.alice, 'system');
  const html = page.locator('html');
  const toggle = page.getByTestId('theme-toggle');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(toggle).toHaveAccessibleName('Theme: system');
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.getByTestId('theme-toggle')).toHaveAccessibleName('Theme: light');

  await page.context().close();
});

test('"system" follows the operating system', async ({ browser, baseURL, users }) => {
  const page = await pageAs(browser, baseURL!, users.alice, 'system');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.context().close();
});
