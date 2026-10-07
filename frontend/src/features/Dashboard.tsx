import React from 'react';
import { Sidebar } from './chat/components/Sidebar';
import { ChatRoom } from './ChatRoom';
import { ProfilePanel } from './profile/ProfilePanel';
import { useRoomStore } from '../store/useRoomStore';
import { useUIStore } from '../store/useUIStore';

export const Dashboard: React.FC = () => {
  const activeRoomId = useRoomStore((state) => state.activeRoomId);
  const profileUserId = useUIStore((state) => state.profileUserId);
  const closeProfile = useUIStore((state) => state.closeProfile);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-900">
      <Sidebar />

      <div
        className={`flex-1 ${!activeRoomId ? 'hidden md:flex' : 'flex'} flex-col w-full overflow-hidden`}
      >
        <ChatRoom />
      </div>

      {profileUserId && (
        // key resets the panel's local state when switching between users
        <ProfilePanel key={profileUserId} userId={profileUserId} onClose={closeProfile} />
      )}
    </div>
  );
};
