import React from 'react';
import { Button } from '../../../components/ui/Button';
import { useChatStore } from '../../../store/useChatStore';

interface Props {
  room: string;
  username: string;
  onLeave: () => void;
}

export const ChatHeader: React.FC<Props> = ({ room, username, onLeave }) => {
  const isConnected = useChatStore((state) => state.isConnected);
  const isReconnecting = useChatStore((state) => state.isReconnecting);

  return (
    <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          {isReconnecting && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${
            isConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500' : 'bg-red-500'
          }`}></span>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">
            Room: <span className="text-blue-400">{room}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isConnected ? `Connected as ${username}` : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
          </p>
        </div>
      </div>
      
      <Button 
        onClick={onLeave} 
        variant="danger" 
        className="text-xs px-3 py-1.5"
      >
        Leave
      </Button>
    </header>
  );
};