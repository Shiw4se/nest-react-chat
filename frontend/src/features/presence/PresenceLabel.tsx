import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePresence } from '../../store/usePresenceStore';
import { useNow } from '../../hooks/useNow';
import { formatLastSeen } from '../../utils/lastSeen';

interface Props {
  userId: string;
  /** Values from the REST response, used until live presence arrives */
  isOnline?: boolean;
  lastSeenAt?: string | null;
  className?: string;
}

/** "online" in accent colour, otherwise "last seen …" that keeps itself up to date. */
export const PresenceLabel: React.FC<Props> = ({ userId, isOnline, lastSeenAt, className = '' }) => {
  const { t, i18n } = useTranslation();
  const presence = usePresence(userId, { isOnline, lastSeenAt });
  const now = useNow();

  if (presence.isOnline) {
    return <span className={`text-sky-400 ${className}`}>{t('presence.online')}</span>;
  }
  return (
    <span className={`text-slate-500 ${className}`}>
      {formatLastSeen(presence.lastSeenAt, now, t, i18n.language)}
    </span>
  );
};
