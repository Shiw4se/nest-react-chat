import type { TFunction } from 'i18next';

const MINUTE = 60_000;
const DAY = 86_400_000;

/**
 * Telegram-style "last seen" text: just now, N minutes ago, today at 14:05,
 * yesterday at 09:30, or a date. `null` means the server never recorded it.
 */
export const formatLastSeen = (
  lastSeenAt: string | null | undefined,
  now: number,
  t: TFunction,
  locale: string,
): string => {
  if (!lastSeenAt) return t('presence.recently');

  const date = new Date(lastSeenAt);
  const diff = now - date.getTime();
  if (diff < MINUTE) return t('presence.just_now');
  if (diff < 60 * MINUTE) {
    return t('presence.minutes_ago', { count: Math.floor(diff / MINUTE) });
  }

  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now);
  if (date.toDateString() === today.toDateString()) return t('presence.today_at', { time });
  if (date.toDateString() === new Date(now - DAY).toDateString()) {
    return t('presence.yesterday_at', { time });
  }

  const sameYear = date.getFullYear() === today.getFullYear();
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return t('presence.on_date', { date: day });
};
