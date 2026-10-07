import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRoomStore, sortByActivity } from '../useRoomStore';
import type { MessagePreview, Room } from '../../types/room';

vi.mock('../../api/services/roomsApi', () => ({
  RoomsApi: { getMyRooms: vi.fn().mockResolvedValue([]) },
}));

const preview = (id: string, createdAt: string): MessagePreview => ({
  id,
  message: `text ${id}`,
  createdAt,
  userId: 'u2',
  user: { username: 'bob' },
});

const room = (id: string, lastAt: string | null, unreadCount = 0): Room => ({
  id,
  name: id,
  type: 'PUBLIC',
  createdAt: '2026-01-01T00:00:00Z',
  lastMessage: lastAt ? preview(`${id}-m`, lastAt) : null,
  unreadCount,
});

describe('useRoomStore activity', () => {
  beforeEach(() => {
    useRoomStore.setState({
      myRooms: [room('a', '2026-10-07T10:00:00Z'), room('b', '2026-10-07T09:00:00Z', 2)],
    });
  });

  it('moves the active room to the top and bumps unread', () => {
    useRoomStore.getState().applyActivity('b', preview('new', '2026-10-07T11:00:00Z'), true);

    const [first, second] = useRoomStore.getState().myRooms;
    expect(first.id).toBe('b');
    expect(first.unreadCount).toBe(3);
    expect(first.lastMessage?.id).toBe('new');
    expect(second.id).toBe('a');
  });

  it('updates the preview without counting own messages', () => {
    useRoomStore.getState().applyActivity('a', preview('mine', '2026-10-07T12:00:00Z'), false);
    expect(useRoomStore.getState().myRooms[0]).toMatchObject({ id: 'a', unreadCount: 0 });
  });

  it('reloads the list for an unknown room', () => {
    const fetchMyRooms = vi.spyOn(useRoomStore.getState(), 'fetchMyRooms');
    useRoomStore.getState().applyActivity('zzz', null, true);
    expect(fetchMyRooms).toHaveBeenCalled();
  });

  it('clears unread', () => {
    useRoomStore.getState().clearUnread('b');
    expect(useRoomStore.getState().myRooms.find((r) => r.id === 'b')?.unreadCount).toBe(0);
  });

  it('sorts rooms without messages by creation time', () => {
    const sorted = sortByActivity([room('old', null), room('new', '2026-10-07T00:00:00Z')]);
    expect(sorted.map((r) => r.id)).toEqual(['new', 'old']);
  });
});
