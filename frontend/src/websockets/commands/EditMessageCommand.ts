import { Socket } from 'socket.io-client';
import type { ICommand } from './SendMessageCommand';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

export class EditMessageCommand implements ICommand {
  private socket: Socket;
  private roomId: string;
  private messageId: string;
  private text: string;
  private previousText: string;

  constructor(socket: Socket, roomId: string, messageId: string, text: string, previousText: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.messageId = messageId;
    this.text = text;
    this.previousText = previousText;
  }

  execute(): void {
    this.emit(this.text);
  }

  /** Restores the text the message had before this edit */
  undo(): void {
    this.emit(this.previousText);
  }

  private emit(message: string): void {
    this.socket.emit(SOCKET_EVENTS.EDIT_MESSAGE, {
      roomId: this.roomId,
      messageId: this.messageId,
      message,
    });
  }
}
