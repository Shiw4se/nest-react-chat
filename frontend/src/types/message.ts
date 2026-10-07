export interface ChatMessagePayload {
  roomId: string;
  message: string;
  replyToId?: string;
}
