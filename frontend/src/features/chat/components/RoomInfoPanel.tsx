import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { RoomsApi } from '../../../api/services/roomsApi';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { useUIStore } from '../../../store/useUIStore';
import { nameOf } from '../../../utils/displayName';
import type { RoomDetails } from '../../../types/room';

interface Props {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
  onInvite: () => void;
}

/** Telegram-style room profile: avatar, type, members, leave / delete actions. */
export const RoomInfoPanel: React.FC<Props> = ({ isOpen, roomId, onClose, onInvite }) => {
  const { t, i18n } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);
  const deleteRoom = useRoomStore((s) => s.deleteRoom);
  const openProfile = useUIStore((s) => s.openProfile);

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const panelRef = useFocusTrap(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await RoomsApi.getRoom(roomId);
        if (!cancelled) setRoom(data);
      } catch {
        if (!cancelled) setRoom(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const isOwner = room?.ownerId === currentUserId;
  const isPrivate = room?.type === 'PRIVATE';
  const membersCount = room?.members.length ?? 0;

  const handleConfirm = async () => {
    if (!confirm) return;
    setIsBusy(true);
    const ok = confirm === 'leave' ? await leaveRoom(roomId) : await deleteRoom(roomId);
    setIsBusy(false);
    setConfirm(null);
    if (ok) onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-info-title"
        className="fixed z-50 inset-y-0 right-0 w-full md:w-[380px] bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right"
      >
        <header className="flex items-center gap-2 px-3 py-3 border-b border-slate-700/70 shrink-0">
          <Button variant="icon" onClick={onClose} aria-label={t('common.close', 'Close')}>
            <Icon name="close" />
          </Button>
          <h2 id="room-info-title" className="text-base font-semibold text-white">
            {t('room.info', 'Room info')}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading && !room ? (
            <div className="p-8 text-center text-slate-500 animate-pulse" role="status">
              {t('chat.loading')}
            </div>
          ) : !room ? (
            <div className="p-8 text-center text-slate-500">{t('room.load_error')}</div>
          ) : (
            <>
              <section className="flex flex-col items-center text-center px-6 pt-8 pb-6 bg-gradient-to-b from-slate-800 to-slate-800/0">
                <Avatar name={room.name} size="xl" shape="rounded" className="shadow-xl" />
                <h3 className="mt-4 text-xl font-bold text-white break-all">{room.name}</h3>
                <p className="mt-1 text-sm text-slate-400 flex items-center gap-1.5">
                  <Icon name={isPrivate ? 'lock' : 'globe'} size={14} />
                  {isPrivate ? t('chat.room_private') : t('chat.room_public')} ·{' '}
                  {t('room.members_count', { count: membersCount })}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {t('room.created')}{' '}
                  {new Date(room.createdAt).toLocaleDateString(i18n.language, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>

                {isOwner && isPrivate && (
                  <Button
                    variant="secondary"
                    onClick={onInvite}
                    className="mt-5 min-h-[44px] px-5"
                    aria-haspopup="dialog"
                  >
                    <Icon name="link" size={16} />
                    {t('room.invite', 'Invite')}
                  </Button>
                )}
              </section>

              <section className="border-t border-slate-700/70">
                <h4 className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Icon name="users" size={14} />
                  {t('room.members')} · {membersCount}
                </h4>
                <ul className="pb-4">
                  {room.members.map((m) => (
                    <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => openProfile(m.id)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-slate-700/40 focus:outline-none focus-visible:bg-slate-700/60"
                    >
                      <Avatar name={nameOf(m)} seed={m.username} src={m.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-100 truncate flex items-center gap-1.5">
                          {nameOf(m)}
                          {m.id === currentUserId && (
                            <span className="text-[10px] font-normal text-slate-500">
                              ({t('room.you')})
                            </span>
                          )}
                        </p>
                        {m.displayName && (
                          <p className="text-xs text-slate-500 truncate">@{m.username}</p>
                        )}
                      </div>
                      {m.isOwner && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-400">
                          <Icon name="crown" size={13} />
                          {t('room.owner')}
                        </span>
                      )}
                    </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        {room && (
          <footer className="p-3 border-t border-slate-700/70 shrink-0 pb-safe">
            {isOwner ? (
              <Button
                variant="danger"
                onClick={() => setConfirm('delete')}
                className="w-full min-h-[44px]"
              >
                <Icon name="trash" size={16} />
                {t('room.delete')}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => setConfirm('leave')}
                className="w-full min-h-[44px]"
              >
                <Icon name="logout" size={16} />
                {t('room.leave')}
              </Button>
            )}
          </footer>
        )}
      </aside>

      <ConfirmDialog
        isOpen={confirm !== null}
        title={confirm === 'delete' ? t('room.delete_confirm_title') : t('room.leave_confirm_title')}
        description={
          confirm === 'delete'
            ? t('room.delete_confirm_text', { name: room?.name ?? '' })
            : t('room.leave_confirm_text', { name: room?.name ?? '' })
        }
        confirmLabel={confirm === 'delete' ? t('room.delete') : t('room.leave')}
        isLoading={isBusy}
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
};
