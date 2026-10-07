import type { NamedUser } from '../types/user';

/** The name to show for a user: display name when set, otherwise the username. */
export const nameOf = (user: NamedUser): string => user.displayName?.trim() || user.username;
