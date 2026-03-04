export interface ChatMessage {
  id?: string;
  message: string;
  room: string;
  user: { username: string };
  createdAt?: string;
}