import { create } from 'zustand';

interface PresenceState {
  /** Users with at least one open socket */
  online: Record<string, true>;
  /** Last disconnect time per user, as reported live by the server */
  lastSeen: Record<string, string>;
  /** True once the server sent the initial online list for this connection */
  hasSnapshot: boolean;

  setSnapshot: (userIds: string[]) => void;
  setPresence: (userId: string, online: boolean, lastSeenAt?: string) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  online: {},
  lastSeen: {},
  hasSnapshot: false,

  setSnapshot: (userIds) =>
    set({
      online: Object.fromEntries(userIds.map((id) => [id, true as const])),
      hasSnapshot: true,
    }),

  setPresence: (userId, online, lastSeenAt) =>
    set((state) => {
      const nextOnline = { ...state.online };
      if (online) nextOnline[userId] = true;
      else delete nextOnline[userId];
      return {
        online: nextOnline,
        lastSeen: lastSeenAt ? { ...state.lastSeen, [userId]: lastSeenAt } : state.lastSeen,
      };
    }),

  reset: () => set({ online: {}, lastSeen: {}, hasSnapshot: false }),
}));

/**
 * Live presence for one user. REST data (`fallback`) is used until the socket
 * delivers the first snapshot; after that the live store wins.
 */
export const usePresence = (
  userId: string | undefined,
  fallback: { isOnline?: boolean; lastSeenAt?: string | null } = {},
) => {
  // Primitive selectors: zustand v5 re-renders forever if a selector
  // returns a new object on every call.
  const liveOnline = usePresenceStore((s) => (userId ? !!s.online[userId] : false));
  const hasSnapshot = usePresenceStore((s) => s.hasSnapshot);
  const liveLastSeen = usePresenceStore((s) => (userId ? s.lastSeen[userId] : undefined));

  if (!userId) return { isOnline: false, lastSeenAt: null };
  return {
    isOnline: hasSnapshot ? liveOnline : !!fallback.isOnline,
    lastSeenAt: liveLastSeen ?? fallback.lastSeenAt ?? null,
  };
};
