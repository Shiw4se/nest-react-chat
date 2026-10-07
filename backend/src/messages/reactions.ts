/** Quick reactions offered in the UI; anything else is rejected by validation. */
export const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

export type ReactionEmoji = (typeof ALLOWED_REACTIONS)[number];
