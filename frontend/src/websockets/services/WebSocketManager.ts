import { io, Socket } from 'socket.io-client';

export class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  public socket: Socket;

  private constructor() {
    // Empty = same origin (the Docker image proxies /socket.io through nginx)
    const baseURL: string | undefined =
      import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || undefined;
    const options = { autoConnect: false, transports: ['websocket'] };

    this.socket = baseURL ? io(baseURL, options) : io(options);
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /** Attaches the JWT to the handshake and connects if not connected yet. */
  public connectWithToken(token: string | null): void {
    this.socket.auth = { token };
    this.connect();
  }

  public connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}
