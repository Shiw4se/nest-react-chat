import { mkdirSync, writeFileSync } from 'node:fs';
import { createUser } from './api';

export const USERS_FILE = new URL('../.auth/users.json', import.meta.url);

/**
 * Two fresh users per run, created through the API once (auth endpoints are
 * rate limited, so tests reuse these tokens instead of logging in each time).
 */
export default async function globalSetup() {
  const run = Date.now().toString(36);
  const alice = await createUser(`e2e_${run}_alice`);
  const bob = await createUser(`e2e_${run}_bob`);

  mkdirSync(new URL('../.auth/', import.meta.url), { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify({ run, alice, bob }, null, 2));
}
