import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

export interface ICommand {
  execute(): void;
  undo(): void;
}

export class SendMessageCommand implements ICommand {
  private socket: Socket;
  private roomId: string;
  private text: string;

  constructor(socket: Socket, roomId: string, text: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.text = text;
  }

  execute(): void {
    this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      roomId: this.roomId,
      message: this.text,
    });
    this.socket.emit(SOCKET_EVENTS.TYPING, {
      roomId: this.roomId,
      isTyping: false,
    });
  }

  undo(): void {
    console.log(`Undo action: attempt to delete message "${this.text}"`);
  }
}
