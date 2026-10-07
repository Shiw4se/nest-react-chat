export interface Room {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  ownerId?: string;
  inviteToken?: string;
  createdAt?: string;
  _count?: {
    members: number;
  };
}

export interface RoomMember {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
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
