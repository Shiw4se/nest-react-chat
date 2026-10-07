export interface ReplyPreview {
  id: string;
  message: string;
  userId: string;
  user: { username: string; displayName?: string | null };
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  roomId: string;
  userId: string;
  user: { username: string; displayName?: string | null; avatarUrl?: string | null };
  createdAt: string;
  editedAt?: string | null;
  replyToId?: string | null;
  replyTo?: ReplyPreview | null;
  reactions?: Reaction[];
}
