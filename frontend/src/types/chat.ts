export interface ChatMessage {
  id: string;
  message: string;
  roomId: string;
  userId: string;
  user: { username: string; displayName?: string | null; avatarUrl?: string | null };
  createdAt: string;
}
