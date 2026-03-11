import React from 'react';
import { Sidebar } from './chat/components/Sidebar';
import { ChatRoom } from './ChatRoom';
import { useRoomStore } from '../store/useRoomStore'; 

export const Dashboard: React.FC = () => {
  const activeRoomId = useRoomStore((state) => state.activeRoomId);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-900">
      <Sidebar />
      
      <div className={`flex-1 ${!activeRoomId ? 'hidden md:flex' : 'flex'} flex-col w-full overflow-hidden`}>
        <ChatRoom />
      </div>
    </div>
  );
};