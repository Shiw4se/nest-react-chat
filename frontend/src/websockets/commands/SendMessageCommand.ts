import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import type { UserData } from '../../types/auth';

export interface ICommand {
    execute(): void;
    undo(): void;
}

export class SendMessageCommand implements ICommand {
    private socket: Socket;
    private user: UserData;
    private text: string;

    constructor(socket: Socket, user: UserData, text: string) {
        this.socket = socket;
        this.user = user;
        this.text = text;
    }

    execute(): void {
        this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
            room: this.user.room,
            message: this.text
        });

        this.socket.emit(SOCKET_EVENTS.TYPING, {
            room: this.user.room,
            isTyping: false
        });
    }

    undo(): void {
        console.log(`Undo action: attempt to delete message "${this.text}"`);
    }
}