import * as path from 'path';

/** URL prefix under which uploaded files are served. */
export const UPLOADS_URL_PREFIX = '/uploads';

/**
 * Directory that holds uploaded files. Relative values (and the default)
 * resolve against the backend's working directory.
 */
export const resolveUploadsRoot = (configured?: string): string =>
  path.resolve(process.cwd(), configured || 'uploads');
