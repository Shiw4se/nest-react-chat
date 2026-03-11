import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useRoomStore } from '../../../store/useRoomStore';
import { RoomsApi } from '../../../api/services/roomsApi';
import { ModalMode, type ModalModeType } from '../../../constants/modalMode';
import { RoomVisibility, type RoomVisibilityType } from '../../../constants/roomVisibility';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createAndJoinRoom, fetchMyRooms, setActiveRoom } = useRoomStore();

  const [mode, setMode] = useState<ModalModeType>(ModalMode.CREATE);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomVisibilityType>(RoomVisibility.PUBLIC);
  const [inviteToken, setInviteToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const modalRef = useFocusTrap(isOpen, onClose);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsLoading(true);
    try {
      await createAndJoinRoom(roomName, roomType);
      onClose();
      setRoomName('');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t('modal.create_error', 'Failed to create room'),
      );
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          &times;
        </button>

        <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
          {mode === ModalMode.CREATE ? t('modal.create_title') : t('modal.join_title')}
        </h2>

        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
          <Button
            variant={mode === ModalMode.CREATE ? 'primary' : 'text'}
            onClick={() => setMode(ModalMode.CREATE)}
            className="flex-1 text-sm py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500"
          >
            {t('modal.create_tab')}
          </Button>
          <Button
            variant={mode === ModalMode.JOIN ? 'primary' : 'text'}
            onClick={() => setMode(ModalMode.JOIN)}
            className="flex-1 text-sm py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500"
          >
            {t('modal.join_tab')}
          </Button>
        </div>

        {mode === ModalMode.CREATE && (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              placeholder={t('modal.room_name_placeholder')}
              value={roomName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomName(e.target.value)}
              required
              aria-required="true"
              maxLength={50}
              className="focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            <div className="flex gap-4 items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer py-1">
                <input
                  type="radio"
                  checked={roomType === RoomVisibility.PUBLIC}
                  onChange={() => setRoomType(RoomVisibility.PUBLIC)}
                  className="accent-blue-500 w-4 h-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                />
                {t('modal.public_type')}
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer py-1">
                <input
                  type="radio"
                  checked={roomType === RoomVisibility.PRIVATE}
                  onChange={() => setRoomType(RoomVisibility.PRIVATE)}
                  className="accent-blue-500 w-4 h-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                />
                {t('modal.private_type')}
              </label>
            </div>
            <p className="text-xs text-slate-400 px-1">
              {roomType === RoomVisibility.PUBLIC
                ? t('modal.public_hint')
                : t('modal.private_hint')}
            </p>
            <Button type="submit" className="w-full mt-2 min-h-[44px] focus:ring-2 focus:ring-blue-500" disabled={isLoading || !roomName.trim()}>
              {isLoading ? t('modal.creating') : t('modal.create_btn')}
            </Button>
          </form>
        )}

        {mode === ModalMode.JOIN && (
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              placeholder={t('modal.token_placeholder')}
              value={inviteToken}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteToken(e.target.value)}
              required
              aria-required="true"
              className="focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
            <Button
              type="submit"
              className="w-full mt-2 min-h-[44px] focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !inviteToken.trim()}
            >
              {isLoading ? t('modal.joining') : t('modal.join_btn')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};