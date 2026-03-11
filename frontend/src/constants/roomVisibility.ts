export const RoomVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;

export type RoomVisibilityType = (typeof RoomVisibility)[keyof typeof RoomVisibility];
