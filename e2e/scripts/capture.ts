/**
 * Captures README / portfolio media from the running app with demo data:
 *   docs/screenshots/*.png and docs/demo.gif (two users chatting side by side).
 *
 *   cd backend && npm run db:seed     # fresh demo data
 *   cd e2e && npm run capture          # backend :3000 and Vite :5173 running
 *   cd backend && npm run db:seed     # optional: reset the demo afterwards
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234';
const DOCS = new URL('../../docs/', import.meta.url);
const SHOTS = new URL('screenshots/', DOCS);

interface Session {
  token: string;
  user: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function login(username: string): Promise<Session> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${API}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: PASSWORD }),
    });
    if (res.status === 429) {
      await sleep(21_000);
      continue;
    }
    if (!res.ok) throw new Error(`login ${username}: ${res.status} (did you run db:seed?)`);
    const data = await res.json();
    return { token: data.accessToken, user: data.user };
  }
  throw new Error('rate limited');
}

interface PageOptions {
  theme?: 'dark' | 'light';
  width?: number;
  height?: number;
  scale?: number;
  mobile?: boolean;
}

async function open(browser: Browser, session: Session | null, o: PageOptions = {}): Promise<Page> {
  const localStorage = [
    { name: 'i18nextLng', value: 'en' },
    {
      name: 'ui-storage',
      value: JSON.stringify({
        state: {
          hasSeenTour: session ? { [session.user.username]: true } : {},
          isSidebarOpen: true,
          theme: o.theme ?? 'dark',
        },
        version: 0,
      }),
    },
  ];
  if (session) {
    localStorage.push({
      name: 'auth-storage',
      value: JSON.stringify({ state: { user: session.user, token: session.token }, version: 0 }),
    });
  }
  const context = await browser.newContext({
    viewport: { width: o.width ?? 1280, height: o.height ?? 800 },
    deviceScaleFactor: o.scale ?? 2,
    isMobile: o.mobile ?? false,
    hasTouch: o.mobile ?? false,
    colorScheme: o.theme ?? 'dark',
    storageState: { cookies: [], origins: [{ origin: new URL(BASE).origin, localStorage }] },
  });
  const page = await context.newPage();
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  return page;
}

async function openRoom(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click();
  await page.getByRole('textbox', { name: 'Type a message' }).waitFor();
  await page.waitForLoadState('networkidle');
  await sleep(600); // smooth scroll to the newest message
}

/** Full-resolution capture downscaled to `width` for reasonable file sizes. */
async function shot(page: Page, file: string, width = 1600) {
  const png = await page.screenshot();
  const out = await sharp(png).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(new URL(file, SHOTS), out);
  console.log(`  ${file}  ${(out.length / 1024).toFixed(0)} KB`);
}

async function screenshots(browser: Browser, demo: Session) {
  console.log('Screenshots');

  const loginPage = await open(browser, null);
  await shot(loginPage, 'login.png');
  await loginPage.context().close();

  for (const theme of ['dark', 'light'] as const) {
    const page = await open(browser, demo, { theme });
    await openRoom(page, 'General');
    await shot(page, `chat-${theme}.png`);

    if (theme === 'dark') {
      await page.getByRole('button', { name: 'Open room info' }).click();
      await page.getByRole('dialog').getByRole('heading', { name: /^Members/ }).waitFor();
      await sleep(400);
      await shot(page, 'room-info.png');

      await page.getByRole('dialog').getByRole('button', { name: /Maria Kovalenko/ }).click();
      await page.getByRole('dialog', { name: 'Profile' }).getByText('About', { exact: true }).waitFor();
      await page.waitForLoadState('networkidle');
      await sleep(400);
      await shot(page, 'profile.png');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');

      await openRoom(page, 'Weekend Hike');
      await shot(page, 'photo-message.png');
    }
    await page.context().close();
  }

  const mobile = await open(browser, demo, { width: 390, height: 844, scale: 3, mobile: true });
  await shot(mobile, 'mobile-rooms.png', 780);
  await openRoom(mobile, 'General');
  await shot(mobile, 'mobile-chat.png', 780);
  await mobile.context().close();
}

// ---- GIF: demo (left) and alex (right) chatting live

const FRAME = { width: 640, height: 720 };
const GIF_WIDTH = 1100;

async function demoGif(browser: Browser, demo: Session, alex: Session) {
  console.log('GIF');
  const opts = { width: FRAME.width, height: FRAME.height, scale: 1 };
  const left = await open(browser, demo, opts);
  const right = await open(browser, alex, opts);
  // Narrow windows show the mobile layout; open the room in both
  await openRoom(left, 'Frontend Team');
  await openRoom(right, 'Frontend Team');

  const frames: Buffer[] = [];
  const delays: number[] = [];
  const divider = await sharp({
    create: { width: 6, height: FRAME.height, channels: 3, background: '#020617' },
  }).png().toBuffer();

  const frame = async (delay: number) => {
    const [a, b] = await Promise.all([left.screenshot(), right.screenshot()]);
    frames.push(
      await sharp({
        create: { width: FRAME.width * 2 + 6, height: FRAME.height, channels: 3, background: '#020617' },
      })
        .composite([
          { input: a, left: 0, top: 0 },
          { input: divider, left: FRAME.width, top: 0 },
          { input: b, left: FRAME.width + 6, top: 0 },
        ])
        .png()
        .toBuffer()
        // Scale each frame here: resizing after join collapses the animation
        .then((buf) => sharp(buf).resize({ width: GIF_WIDTH }).png().toBuffer()),
    );
    delays.push(delay);
  };

  await frame(1200);

  // Alex types: the typing indicator appears on the left
  const alexInput = right.getByRole('textbox', { name: 'Type a message' });
  const text = 'Release build is green, shipping tonight 🚀';
  for (const chunk of text.match(/.{1,6}/gu) ?? []) {
    await alexInput.pressSequentially(chunk);
    await frame(110);
  }
  await frame(500);
  await alexInput.press('Enter');
  await sleep(500);
  await frame(1300);

  // Demo reacts with 🔥
  const msg = left.getByTestId('message-bubble').filter({ hasText: 'shipping tonight' });
  await msg.hover();
  await frame(500);
  await left.getByRole('button', { name: 'React' }).last().click();
  await frame(700);
  await left.getByRole('menuitem', { name: '🔥' }).click();
  await sleep(400);
  await frame(1200);

  // Demo replies
  await msg.hover();
  await left.getByRole('button', { name: 'Reply' }).last().click();
  await frame(600);
  const demoInput = left.getByRole('textbox', { name: 'Type a message' });
  for (const chunk of "Nice! I'll smoke-test it after dinner".match(/.{1,6}/gu) ?? []) {
    await demoInput.pressSequentially(chunk);
    await frame(100);
  }
  await demoInput.press('Enter');
  await sleep(500);
  await frame(2800);

  const gif = await sharp(frames, { join: { animated: true } })
    .gif({ delay: delays, loop: 0, effort: 8, colours: 128, dither: 0.6 })
    .toBuffer();
  const pages = (await sharp(gif, { animated: true }).metadata()).pages;
  if (pages !== frames.length) throw new Error(`GIF has ${pages} pages, expected ${frames.length}`);
  writeFileSync(new URL('demo.gif', DOCS), gif);
  console.log(`  demo.gif  ${frames.length} frames, ${(gif.length / 1024).toFixed(0)} KB`);

  await left.context().close();
  await right.context().close();
}

mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
try {
  const demo = await login('demo');
  const alex = await login('alex');
  await screenshots(browser, demo);
  await demoGif(browser, demo, alex);
} finally {
  await browser.close();
}
