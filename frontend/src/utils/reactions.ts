import type { Reaction } from '../types/chat';

/** Must match ALLOWED_REACTIONS on the backend */
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

export interface ReactionGroup {
  emoji: string;
  count: number;
  /** The current user is among the reactors */
  mine: boolean;
}

/** Groups raw reaction rows into chips, keeping the order emojis first appeared. */
export const groupReactions = (reactions: Reaction[] | undefined, myId: string | undefined): ReactionGroup[] => {
  const groups = new Map<string, ReactionGroup>();
  for (const r of reactions ?? []) {
    const group = groups.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    group.count += 1;
    if (r.userId === myId) group.mine = true;
    groups.set(r.emoji, group);
  }
  return Array.from(groups.values());
};
