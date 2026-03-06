import { io, Socket } from 'socket.io-client';

export class WebSocketManager {
    private static instance: WebSocketManager | null = null;
    public socket: Socket;

    private constructor() {
        const baseURL = import.meta.env.VITE_API_URL;

        this.socket = io(baseURL, {
            autoConnect: false,
        });
    }

    public static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
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