const DAY = 86_400_000;

/**
 * Time label for the room list, like Telegram: "14:05" today, a weekday
 * within the last week, otherwise a short date.
 */
export const formatListTime = (iso: string, now: number, locale: string): string => {
  const date = new Date(iso);
  const today = new Date(now);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  if (now - date.getTime() < 6 * DAY) {
    return date.toLocaleDateString(locale, { weekday: 'short' });
  }
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: '2-digit' }),
  });
};
