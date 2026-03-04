import React from 'react';
import { Button } from '../../../components/ui/Button';

interface Props {
  room: string;
  username: string;
  onLeave: () => void;
}

export const ChatHeader: React.FC<Props> = ({ room, username, onLeave }) => (
  <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-sm z-10">
    <div>
      <h2 className="text-xl font-bold text-white">Room: <span className="text-blue-400">{room}</span></h2>
      <p className="text-sm text-slate-400">Logged in as {username}</p>
    </div>
    <Button onClick={onLeave} variant="danger">Leave</Button>
  </header>
);