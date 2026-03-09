export interface ChatMessagePayload {
    room: string;
    message: string;
}

export class MessageBuilder {
    private payload: Partial<ChatMessagePayload> = {};

    setRoom(room: string): this {
        this.payload.room = room;
        return this;
    }

    setMessage(message: string): this {
        this.payload.message = message;
        return this;
    }

    build(): ChatMessagePayload {
        if (!this.payload.room || !this.payload.message) {
            throw new Error('MessageBuilder: Room and message are required fields');
        }

        return this.payload as ChatMessagePayload;
    }
}