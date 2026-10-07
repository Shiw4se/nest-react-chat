import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../config/i18n';
import { formatLastSeen } from './lastSeen';
import { usePresenceStore } from '../store/usePresenceStore';

const now = new Date('2026-10-07T15:00:00').getTime();
const ago = (ms: number) => new Date(now - ms).toISOString();
const MIN = 60_000;

describe('formatLastSeen', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });
  const fmt = (iso: string | null) => formatLastSeen(iso, now, i18n.t, 'en');

  it('handles unknown, just now and minutes', () => {
    expect(fmt(null)).toBe('last seen recently');
    expect(fmt(ago(20_000))).toBe('last seen just now');
    expect(fmt(ago(1 * MIN))).toBe('last seen 1 minute ago');
    expect(fmt(ago(5 * MIN))).toBe('last seen 5 minutes ago');
  });

  it('uses today / yesterday / date', () => {
    expect(fmt(ago(3 * 60 * MIN))).toMatch(/^last seen today at /);
    expect(fmt(new Date('2026-10-06T10:00:00').toISOString())).toMatch(/^last seen yesterday at /);
    expect(fmt(new Date('2026-09-01T10:00:00').toISOString())).toBe('last seen Sep 1');
    expect(fmt(new Date('2025-09-01T10:00:00').toISOString())).toBe('last seen Sep 1, 2025');
  });

  it('applies Ukrainian plural forms', () => {
    const t = i18n.getFixedT('uk');
    expect(formatLastSeen(ago(3 * MIN), now, t, 'uk')).toBe('був(ла) 3 хвилини тому');
    expect(formatLastSeen(ago(11 * MIN), now, t, 'uk')).toBe('був(ла) 11 хвилин тому');
  });
});

describe('usePresenceStore', () => {
  it('tracks snapshots and live changes', () => {
    const store = usePresenceStore.getState();
    store.setSnapshot(['a', 'b']);
    store.setPresence('b', false, '2026-10-07T10:00:00.000Z');
    store.setPresence('c', true);

    const state = usePresenceStore.getState();
    expect(Object.keys(state.online).sort()).toEqual(['a', 'c']);
    expect(state.lastSeen.b).toBe('2026-10-07T10:00:00.000Z');
    expect(state.hasSnapshot).toBe(true);

    state.reset();
    expect(usePresenceStore.getState().hasSnapshot).toBe(false);
  });
});
