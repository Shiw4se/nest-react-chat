import { readFileSync } from 'node:fs';
import { test as base, type Browser, type Page } from '@playwright/test';
import type { TestUser } from './api';
import { USERS_FILE } from './global-setup';

interface Users {
  alice: TestUser;
  bob: TestUser;
}

const users = (): Users => JSON.parse(readFileSync(USERS_FILE, 'utf8'));

/**
 * Opens the app already signed in as `user`, the same way the SPA restores a
 * session: the persisted zustand stores in localStorage. The onboarding tour
 * is marked as seen and the language fixed to English for stable selectors.
 */
export async function pageAs(
  browser: Browser,
  baseURL: string,
  user: TestUser,
  theme: 'dark' | 'light' | 'system' = 'dark',
): Promise<Page> {
  const origin = new URL(baseURL).origin;
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [
        {
          origin,
          localStorage: [
            {
              name: 'auth-storage',
              value: JSON.stringify({
                state: { user: { id: user.id, username: user.username }, token: user.token },
                version: 0,
              }),
            },
            {
              name: 'ui-storage',
              value: JSON.stringify({
                state: { hasSeenTour: { [user.username]: true }, isSidebarOpen: true, theme },
                version: 0,
              }),
            },
            { name: 'i18nextLng', value: 'en' },
          ],
        },
      ],
    },
  });
  const page = await context.newPage();
  await page.goto('/');
  return page;
}

export const test = base.extend<{ alice: Page; bob: Page; users: Users }>({
  // eslint-disable-next-line no-empty-pattern
  users: async ({}, use) => use(users()),
  alice: async ({ browser, baseURL, users }, use) => {
    const page = await pageAs(browser, baseURL!, users.alice);
    await use(page);
    await page.context().close();
  },
  bob: async ({ browser, baseURL, users }, use) => {
    const page = await pageAs(browser, baseURL!, users.bob);
    await use(page);
    await page.context().close();
  },
});

export { expect } from '@playwright/test';

/** Selects a room in the sidebar, switching to the Public tab if needed. */
export async function openRoom(page: Page, name: string, tab: 'My Chats' | 'Public' = 'My Chats') {
  await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
  await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(name)}`) }).click();
  await page.getByRole('textbox', { name: 'Type a message' }).waitFor();
}

export async function send(page: Page, text: string) {
  const input = page.getByRole('textbox', { name: 'Type a message' });
  await input.fill(text);
  await input.press('Enter');
}

export const bubble = (page: Page, text: string) =>
  page.getByTestId('message-bubble').filter({ hasText: text });

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Valid 2x2 PNG (blue) for upload tests */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGOwbvoGRAwQCgAstgbNk8YhFAAAAABJRU5ErkJggg==',
  'base64',
);
