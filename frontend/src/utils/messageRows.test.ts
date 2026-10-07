import { describe, it, expect } from 'vitest';
import { buildMessageRows } from './messageRows';
import type { ChatMessage } from '../types/chat';

const labels = { today: 'Today', yesterday: 'Yesterday', locale: 'en' };

const msg = (id: string, username: string, createdAt: string): ChatMessage => ({
  id,
  message: `m-${id}`,
  roomId: 'room',
  userId: username,
  user: { username },
  createdAt,
});

describe('buildMessageRows', () => {
  it('inserts a date chip per day and groups consecutive messages by author', () => {
    const rows = buildMessageRows(
      [
        msg('1', 'ann', '2026-01-01T10:00:00Z'),
        msg('2', 'ann', '2026-01-01T10:01:00Z'),
        msg('3', 'bob', '2026-01-01T10:02:00Z'),
        msg('4', 'bob', '2026-01-02T10:02:00Z'),
      ],
      labels,
    );

    expect(rows.map((r) => r.kind)).toEqual([
      'date',
      'message',
      'message',
      'message',
      'date',
      'message',
    ]);
    const metas = rows.filter((r) => r.kind === 'message').map((r) => r.showMeta);
    expect(metas).toEqual([true, false, true, true]);
  });

  it('breaks a group when messages are far apart in time', () => {
    const rows = buildMessageRows(
      [msg('1', 'ann', '2026-01-01T10:00:00Z'), msg('2', 'ann', '2026-01-01T10:30:00Z')],
      labels,
    );
    const metas = rows.filter((r) => r.kind === 'message').map((r) => r.showMeta);
    expect(metas).toEqual([true, true]);
  });

  it('labels the current day as today', () => {
    const rows = buildMessageRows([msg('1', 'ann', new Date().toISOString())], labels);
    expect(rows[0]).toMatchObject({ kind: 'date', label: 'Today' });
  });
});
