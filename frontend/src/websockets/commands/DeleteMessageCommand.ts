import { Socket } from 'socket.io-client';
import type { ICommand } from './SendMessageCommand';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

export class DeleteMessageCommand implements ICommand {
    private socket: Socket;
    private room: string;
    private messageId: string;

    constructor(socket: Socket, room: string, messageId: string) {
        this.socket = socket;
        this.room = room;
        this.messageId = messageId;
    }

    execute(): void {
        this.socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, {
            room: this.room,
            messageId: this.messageId
        });
    }

    undo(): void {
    }
}