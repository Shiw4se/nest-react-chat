/** Injection token for the active FileStorage driver */
export const FILE_STORAGE = Symbol('FILE_STORAGE');

/**
 * Where uploaded files live. Keys look like `avatars/<name>.webp`; the
 * driver decides the public URL. Swap drivers with STORAGE_DRIVER.
 */
export interface FileStorage {
  /** Stores the file and returns the URL clients should load it from. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  /** Deletes a file previously returned by put(); ignores foreign URLs. */
  delete(url: string): Promise<void>;
}

/** Keys this app generates: <folder>/<uuid>-<12 hex>.webp */
export const SAFE_KEY =
  /^(avatars|attachments)\/[0-9a-f-]{36}-[0-9a-f]{12}\.webp$/;
