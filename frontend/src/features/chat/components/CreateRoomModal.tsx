import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useRoomStore } from '../../../store/useRoomStore';
import { RoomsApi } from '../../../api/services/roomsApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createAndJoinRoom, fetchMyRooms, setActiveRoom } = useRoomStore();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [inviteToken, setInviteToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsLoading(true);
    try {
      await createAndJoinRoom(roomName, roomType);
      onClose();
      setRoomName('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;
    setIsLoading(true);
    try {
      const joinedRoom = await RoomsApi.joinByToken(inviteToken);
      await fetchMyRooms();
      setActiveRoom(joinedRoom.id);
      toast.success(t('modal.join_success'));
      onClose();
      setInviteToken('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('modal.join_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold leading-none"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {mode === 'create' ? t('modal.create_title') : t('modal.join_title')}
        </h2>

        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
          <Button
            variant={mode === 'create' ? 'primary' : 'text'}
            onClick={() => setMode('create')}
            className="flex-1 text-sm py-1.5"
          >
            {t('modal.create_tab')}
          </Button>
          <Button
            variant={mode === 'join' ? 'primary' : 'text'}
            onClick={() => setMode('join')}
            className="flex-1 text-sm py-1.5"
          >
            {t('modal.join_tab')}
          </Button>
        </div>

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              placeholder={t('modal.room_name_placeholder')}
              value={roomName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomName(e.target.value)}
              required
              maxLength={50}
            />
            <div className="flex gap-4 items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="radio" checked={roomType === 'PUBLIC'} onChange={() => setRoomType('PUBLIC')} className="accent-blue-500" />
                {t('modal.public_type')}
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input type="radio" checked={roomType === 'PRIVATE'} onChange={() => setRoomType('PRIVATE')} className="accent-blue-500" />
                {t('modal.private_type')}
              </label>
            </div>
            <p className="text-xs text-slate-400 px-1">
              {roomType === 'PUBLIC' ? t('modal.public_hint') : t('modal.private_hint')}
            </p>
            <Button type="submit" className="w-full mt-2" disabled={isLoading || !roomName.trim()}>
              {isLoading ? t('modal.creating') : t('modal.create_btn')}
            </Button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              placeholder={t('modal.token_placeholder')}
              value={inviteToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteToken(e.target.value)}
              required
            />
            <Button type="submit" className="w-full mt-2" disabled={isLoading || !inviteToken.trim()}>
              {isLoading ? t('modal.joining') : t('modal.join_btn')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};