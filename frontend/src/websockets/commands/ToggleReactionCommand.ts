import { Socket } from 'socket.io-client';
import type { ICommand } from './SendMessageCommand';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

/** Toggling is its own inverse, so undo simply toggles again. */
export class ToggleReactionCommand implements ICommand {
  private socket: Socket;
  private roomId: string;
  private messageId: string;
  private emoji: string;

  constructor(socket: Socket, roomId: string, messageId: string, emoji: string) {
    this.socket = socket;
    this.roomId = roomId;
    this.messageId = messageId;
    this.emoji = emoji;
  }

  execute(): void {
    this.socket.emit(SOCKET_EVENTS.TOGGLE_REACTION, {
      roomId: this.roomId,
      messageId: this.messageId,
      emoji: this.emoji,
    });
  }

  undo(): void {
    this.execute();
  }
}
