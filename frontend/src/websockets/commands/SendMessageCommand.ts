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
  private replyToId?: string;

  constructor(socket: Socket, roomId: string, text: string, replyToId?: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.text = text;
    this.replyToId = replyToId;
  }

  execute(): void {
    this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      roomId: this.roomId,
      message: this.text,
      ...(this.replyToId && { replyToId: this.replyToId }),
    });
    this.socket.emit(SOCKET_EVENTS.TYPING, {
      roomId: this.roomId,
      isTyping: false,
    });
  }

  undo(): void {
    // Sent messages are undone through DeleteMessageCommand once the server
    // has assigned an id; nothing to roll back locally.
  }
}
