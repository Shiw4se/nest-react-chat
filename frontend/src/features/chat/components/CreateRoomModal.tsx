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

const ROOM_NAME_MAX = 50;

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

  const switchMode = (next: ModalModeType) => {
    setMode(next);
    setRoomName('');
    setInviteToken('');
    setRoomType(RoomVisibility.PUBLIC);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsLoading(true);
    try {
      await createAndJoinRoom(roomName, roomType);
      onClose();
      setRoomName('');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('modal.create_error', 'Failed to create room'));
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
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('modal.join_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteToken = async () => {
    if (!navigator.clipboard) return;
    try {
      const text = await navigator.clipboard.readText();
      setInviteToken(text.trim());
    } catch {
      // clipboard access denied — do nothing
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
            onClick={() => switchMode(ModalMode.CREATE)}
            className="flex-1 text-sm py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500"
          >
            {t('modal.create_tab')}
          </Button>
          <Button
            variant={mode === ModalMode.JOIN ? 'primary' : 'text'}
            onClick={() => switchMode(ModalMode.JOIN)}
            className="flex-1 text-sm py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500"
          >
            {t('modal.join_tab')}
          </Button>
        </div>

        {mode === ModalMode.CREATE && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Input
                placeholder={t('modal.room_name_placeholder')}
                value={roomName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomName(e.target.value)}
                required
                aria-required="true"
                maxLength={ROOM_NAME_MAX}
                className="focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              <p className={`text-xs mt-1 text-right pr-1 ${roomName.length >= ROOM_NAME_MAX ? 'text-red-400' : 'text-slate-500'}`}>
                {roomName.length}/{ROOM_NAME_MAX}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('modal.room_type_label', 'Room type')}>
              {([RoomVisibility.PUBLIC, RoomVisibility.PRIVATE] as RoomVisibilityType[]).map((type) => {
                const isSelected = roomType === type;
                const isPublic = type === RoomVisibility.PUBLIC;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setRoomType(type)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">{isPublic ? '🌐' : '🔒'}</span>
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-400' : 'text-slate-300'}`}>
                      {t(isPublic ? 'modal.public_type' : 'modal.private_type')}
                    </span>
                    <span className="text-xs text-slate-500 text-left leading-tight">
                      {t(isPublic ? 'modal.public_hint' : 'modal.private_hint')}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 min-h-[44px] focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !roomName.trim()}
            >
              {isLoading ? t('modal.creating') : t('modal.create_btn')}
            </Button>
          </form>
        )}

        {mode === ModalMode.JOIN && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="relative">
              <Input
                placeholder={t('modal.token_placeholder')}
                value={inviteToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteToken(e.target.value)}
                required
                aria-required="true"
                className="focus:ring-2 focus:ring-blue-500 min-h-[44px] pr-20"
              />
              <button
                type="button"
                onClick={handlePasteToken}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('common.paste', 'Paste')}
              </button>
            </div>
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
