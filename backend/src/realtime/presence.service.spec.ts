import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let presence: PresenceService;

  beforeEach(() => {
    presence = new PresenceService();
  });

  it('goes online on the first socket only', () => {
    expect(presence.connect('u1', 's1')).toBe(true);
    expect(presence.connect('u1', 's2')).toBe(false);
    expect(presence.isOnline('u1')).toBe(true);
  });

  it('goes offline only after the last socket closes', () => {
    presence.connect('u1', 's1');
    presence.connect('u1', 's2');

    expect(presence.disconnect('u1', 's1')).toBe(false);
    expect(presence.isOnline('u1')).toBe(true);

    expect(presence.disconnect('u1', 's2')).toBe(true);
    expect(presence.isOnline('u1')).toBe(false);
  });

  it('ignores unknown disconnects', () => {
    expect(presence.disconnect('ghost', 's1')).toBe(false);
  });

  it('lists online users', () => {
    presence.connect('u1', 's1');
    presence.connect('u2', 's2');
    expect(presence.onlineUserIds().sort()).toEqual(['u1', 'u2']);
  });
});
