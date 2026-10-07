import { readFileSync } from 'node:fs';
import pg from 'pg';
import { USERS_FILE } from './global-setup';

/**
 * Removes this run's users (rooms they own and their messages cascade).
 * Tests delete their rooms through the API first, so uploaded files are
 * cleaned up by the backend. Skipped when no database URL is reachable.
 */
export default async function globalTeardown() {
  const url = process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/chat';
  let run: string;
  try {
    run = JSON.parse(readFileSync(USERS_FILE, 'utf8')).run;
  } catch {
    return;
  }

  const client = new pg.Client(url);
  try {
    await client.connect();
    const pattern = `e2e_${run}_%`;
    await client.query(
      'DELETE FROM "Room" WHERE "ownerId" IN (SELECT id FROM "User" WHERE username LIKE $1)',
      [pattern],
    );
    await client.query('DELETE FROM "User" WHERE username LIKE $1', [pattern]);
  } catch (error) {
    console.warn(`e2e teardown skipped: ${(error as Error).message}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}
