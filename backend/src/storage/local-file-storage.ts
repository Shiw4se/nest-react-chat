import { Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { UPLOADS_URL_PREFIX } from '../common/uploads';
import { FileStorage, SAFE_KEY } from './file-storage';

/**
 * Files on the backend's disk, served by main.ts under /uploads.
 * Fine for local development and single servers with a persistent disk.
 */
export class LocalFileStorage implements FileStorage {
  private readonly logger = new Logger(LocalFileStorage.name);

  constructor(private readonly root: string) {}

  async put(key: string, body: Buffer): Promise<string> {
    const file = path.join(this.root, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
    return `${UPLOADS_URL_PREFIX}/${key}`;
  }

  async delete(url: string): Promise<void> {
    const prefix = `${UPLOADS_URL_PREFIX}/`;
    if (!url.startsWith(prefix)) return;
    const key = url.slice(prefix.length);
    // Only names we generated: blocks ../ traversal and arbitrary deletes
    if (!SAFE_KEY.test(key)) return;
    try {
      await fs.unlink(path.join(this.root, key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Could not delete ${key}: ${String(error)}`);
      }
    }
  }
}
