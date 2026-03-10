import { Socket } from 'socket.io-client';
import type { ICommand } from './SendMessageCommand';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

export class DeleteMessageCommand implements ICommand {
  private socket: Socket;
  private roomId: string;
  private messageId: string;

  constructor(socket: Socket, roomId: string, messageId: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.messageId = messageId;
  }

  execute(): void {
    this.socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, {
      roomId: this.roomId,  
      messageId: this.messageId,
    });
  }

  undo(): void {}
}