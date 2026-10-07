/** Mirrors the backend (ImageStorageService) so users get instant feedback */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Returns an i18n key describing the problem, or null if the file is fine. */
export const imageFileError = (file: File, maxBytes = ATTACHMENT_MAX_BYTES): string | null => {
  if (!IMAGE_TYPES.includes(file.type)) return 'attachment.type_error';
  if (file.size > maxBytes) return 'attachment.size_error';
  return null;
};

/** First image among dropped or pasted files */
export const firstImage = (files: FileList | File[] | null | undefined): File | null =>
  Array.from(files ?? []).find((f) => f.type.startsWith('image/')) ?? null;
