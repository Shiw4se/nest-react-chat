// Plain object frozen with `as const`, so values stay literal types
export const ModalMode = {
  CREATE: 'create',
  JOIN: 'join',
} as const;

// Union type derived from the object (erased at build time)
export type ModalModeType = (typeof ModalMode)[keyof typeof ModalMode];
