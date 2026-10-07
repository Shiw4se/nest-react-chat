export interface MessagePreview {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  user: { username: string; displayName?: string | null };
}

export interface Room {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  ownerId?: string;
  inviteToken?: string;
  createdAt?: string;
  lastMessage?: MessagePreview | null;
  unreadCount?: number;
  _count?: {
    members: number;
  };
}

export interface RoomMember {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  lastSeenAt?: string | null;
  isOnline?: boolean;
  joinedAt: string;
  isOwner: boolean;
}

export interface RoomDetails {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  ownerId: string;
  createdAt: string;
  members: RoomMember[];
}
