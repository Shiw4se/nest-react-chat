// 1. Создаем обычный JavaScript объект и "замораживаем" его через as const
export const ModalMode = {
  CREATE: 'create',
  JOIN: 'join',
} as const;

// 2. Вытягиваем из него TypeScript-тип (этот код "сотрется" при сборке)
export type ModalModeType = (typeof ModalMode)[keyof typeof ModalMode];
