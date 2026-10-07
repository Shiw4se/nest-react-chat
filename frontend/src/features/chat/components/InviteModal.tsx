import React, { useState, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getApiErrorMessage } from '../../../api/axios';
import { RoomsApi } from '../../../api/services/roomsApi';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const InviteModal: React.FC<Props> = ({ isOpen, onClose, roomId }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'link' | 'username'>('link');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useFocusTrap(isOpen, onClose);

  const handleGetLink = async () => {
    if (inviteToken) return;
    setIsLoading(true);
    try {
      const res = await RoomsApi.getInviteToken(roomId);
      setInviteToken(res.inviteToken);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('invite.token_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateLink = async () => {
    setIsLoading(true);
    try {
      const res = await RoomsApi.regenerateInviteToken(roomId);
      setInviteToken(res.inviteToken);
      toast.success(t('invite.regenerate_success', 'Token regenerated!'));
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('invite.token_error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'link' && !inviteToken) {
      handleGetLink();
    }
    // Only re-run when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!inviteToken) return;
    navigator.clipboard.writeText(inviteToken);
    toast.success(t('invite.copied'));
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    try {
      const res = await RoomsApi.inviteByUsername(roomId, username.trim());
      toast.success(res.message || t('invite.invite_success'));
      setUsername('');
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('invite.invite_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = (newMode: 'link' | 'username') => {
    setMode(newMode);
    if (newMode === 'link' && !inviteToken) {
      handleGetLink();
    }
  };

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
          {t('invite.title')}
        </h2>

        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
          <Button variant={mode === 'link' ? 'primary' : 'text'} onClick={() => handleSwitchMode('link')} className="flex-1 text-sm py-2 focus:ring-2 focus:ring-blue-500">
            {t('invite.link_tab')}
          </Button>
          <Button variant={mode === 'username' ? 'primary' : 'text'} onClick={() => handleSwitchMode('username')} className="flex-1 text-sm py-2 focus:ring-2 focus:ring-blue-500">
            {t('invite.username_tab')}
          </Button>
        </div>

        {mode === 'link' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">{t('invite.link_hint')}</p>
            {isLoading ? (
              <div className="text-center text-slate-500 animate-pulse py-4">{t('invite.loading_token')}</div>
            ) : inviteToken ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={inviteToken}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm font-mono truncate outline-none min-h-[44px] focus:ring-2 focus:ring-blue-500"
                  aria-label="Invite Token"
                />
                <div className="flex gap-2">
                  <Button onClick={handleCopyLink} className="flex-1 sm:flex-none px-4 min-h-[44px] focus:ring-2 focus:ring-blue-500">
                    {t('invite.copy_btn')}
                  </Button>
                  <Button
                    onClick={handleRegenerateLink}
                    variant="text"
                    className="px-3 shrink-0 text-slate-400 hover:text-red-400 min-h-[44px] border border-slate-600 sm:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Regenerate invite token"
                    title="Revoke and generate new token"
                  >
                    🔄
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleGetLink} className="w-full min-h-[44px] focus:ring-2 focus:ring-blue-500">
                {t('invite.get_token_btn')}
              </Button>
            )}
          </div>
        )}

        {mode === 'username' && (
          <form onSubmit={handleInviteUser} className="space-y-4">
            <p className="text-slate-400 text-sm">{t('invite.username_hint')}</p>
            <Input
              placeholder={t('invite.username_placeholder')}
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
              aria-required="true"
              className="focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" className="w-full min-h-[44px] focus:ring-2 focus:ring-blue-500" disabled={isLoading || !username.trim()}>
              {isLoading ? t('invite.inviting') : t('invite.invite_btn')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};