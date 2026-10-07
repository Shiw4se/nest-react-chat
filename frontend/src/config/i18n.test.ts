import { describe, it, expect } from 'vitest';
import i18n from './i18n';

describe('i18n plural rules', () => {
  const members = (lng: string, count: number) => i18n.getFixedT(lng)('room.members_count', { count });

  it('uses Ukrainian one/few/many forms', () => {
    expect(members('uk', 1)).toBe('1 учасник');
    expect(members('uk', 3)).toBe('3 учасники');
    expect(members('uk', 5)).toBe('5 учасників');
  });

  it('uses Polish forms', () => {
    expect(members('pl', 1)).toBe('1 członek');
    expect(members('pl', 5)).toBe('5 członków');
  });

  it('uses English one/other', () => {
    expect(members('en', 1)).toBe('1 member');
    expect(members('en', 2)).toBe('2 members');
  });
});
