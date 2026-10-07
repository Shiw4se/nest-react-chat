/** Thin REST client for test setup; the UI itself is driven through the browser. */
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

export interface TestUser {
  id: string;
  username: string;
  password: string;
  token: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function api<T = unknown>(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_URL}/v1${path}`, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    // Auth routes are rate limited (5/min by default); wait it out locally
    if (res.status === 429 && attempt < 3) {
      await sleep(21_000);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

export async function createUser(username: string, password = 'E2ePass123'): Promise<TestUser> {
  await api('POST', '/auth/register', undefined, { username, password });
  const login = await api<{ accessToken: string; user: { id: string } }>(
    'POST',
    '/auth/login',
    undefined,
    { username, password },
  );
  return { id: login.user.id, username, password, token: login.accessToken };
}

export const createRoom = (owner: TestUser, name: string, type: 'PUBLIC' | 'PRIVATE' = 'PUBLIC') =>
  api<{ id: string; name: string }>('POST', '/rooms', owner.token, { name, type });

export const deleteRoom = (owner: TestUser, roomId: string) =>
  api('DELETE', `/rooms/${roomId}`, owner.token).catch(() => undefined);
