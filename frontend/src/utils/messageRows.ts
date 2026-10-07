import type { ChatMessage } from '../types/chat';

export type MessageRow =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'message'; key: string; message: ChatMessage; showMeta: boolean };

export interface DateLabels {
  today: string;
  yesterday: string;
  locale: string;
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const DAY_MS = 86_400_000;

const dayLabel = (date: Date, labels: DateLabels): string => {
  const now = new Date();
  const day = date.toDateString();
  if (day === now.toDateString()) return labels.today;
  if (day === new Date(now.getTime() - DAY_MS).toDateString()) return labels.yesterday;
  return date.toLocaleDateString(labels.locale, { day: 'numeric', month: 'long' });
};

/**
 * Turns a flat message list into render rows: a date chip whenever the day
 * changes, and `showMeta` only on the first message of a run from one author
 * (Telegram-style grouping).
 */
export const buildMessageRows = (messages: ChatMessage[], labels: DateLabels): MessageRow[] => {
  const rows: MessageRow[] = [];
  let lastDay = '';
  let prev: ChatMessage | null = null;

  for (const msg of messages) {
    const date = new Date(msg.createdAt);
    const day = date.toDateString();

    if (day !== lastDay) {
      rows.push({ kind: 'date', key: `d-${day}`, label: dayLabel(date, labels) });
      lastDay = day;
      prev = null;
    }

    const sameAuthor = prev?.user.username === msg.user.username;
    const closeInTime =
      !!prev && date.getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;

    rows.push({
      kind: 'message',
      key: msg.id ?? `${msg.user.username}-${msg.createdAt}`,
      message: msg,
      showMeta: !(sameAuthor && closeInTime),
    });
    prev = msg;
  }

  return rows;
};
