import React from 'react';
import { Sidebar } from './chat/components/Sidebar';
import { ChatRoom } from './ChatRoom';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900">
      <Sidebar />
      <ChatRoom />
    </div>
  );
};