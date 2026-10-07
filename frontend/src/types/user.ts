export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  isOnline?: boolean;
  createdAt: string;
  stats: {
    rooms: number;
    ownedRooms: number;
    messages: number;
  };
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
}

/** Anything that carries a username and an optional display name. */
export interface NamedUser {
  username: string;
  displayName?: string | null;
}
