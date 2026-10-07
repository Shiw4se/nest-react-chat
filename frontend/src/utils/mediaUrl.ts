/**
 * Turns a path the backend returns (e.g. `/uploads/avatars/x.webp`) into a URL
 * the browser can load. Absolute URLs pass through unchanged.
 */
export const mediaUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${import.meta.env.VITE_API_URL ?? ''}${path}`;
};
