import { describe, it, expect } from 'vitest';
import { groupReactions } from './reactions';

describe('groupReactions', () => {
  it('counts per emoji in first-seen order and marks mine', () => {
    const groups = groupReactions(
      [
        { emoji: '🔥', userId: 'a' },
        { emoji: '👍', userId: 'me' },
        { emoji: '🔥', userId: 'me' },
        { emoji: '🔥', userId: 'b' },
      ],
      'me',
    );
    expect(groups).toEqual([
      { emoji: '🔥', count: 3, mine: true },
      { emoji: '👍', count: 1, mine: true },
    ]);
  });

  it('handles missing reactions', () => {
    expect(groupReactions(undefined, 'me')).toEqual([]);
  });
});
