import type { ChatMessagePayload } from '../../types/message';

export class MessageBuilder {
    private payload: Partial<ChatMessagePayload> = {};

    setRoom(roomId: string): this {
        this.payload.roomId = roomId; 
        return this;
    }

    setMessage(message: string): this {
        this.payload.message = message;
        return this;
    }

    build(): ChatMessagePayload {
        if (!this.payload.roomId || !this.payload.message) {
            throw new Error('MessageBuilder: Room ID and message are required fields');
        }

        return this.payload as ChatMessagePayload;
    }
}