import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { resolveUploadsRoot, UPLOADS_URL_PREFIX } from '../common/uploads';

export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const AVATAR_URL_PREFIX = `${UPLOADS_URL_PREFIX}/avatars/`;
// Only names this service generates: <uuid>-<hex>.webp
const SAFE_FILENAME = /^[0-9a-f-]{36}-[0-9a-f]{12}\.webp$/;

/**
 * Stores avatars on the local disk. Every upload is re-encoded by sharp,
 * which both normalises the image and rejects anything that is not one.
 */
@Injectable()
export class AvatarStorageService implements OnModuleInit {
  private readonly logger = new Logger(AvatarStorageService.name);
  private readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = path.join(
      resolveUploadsRoot(config.get<string>('UPLOADS_DIR')),
      'avatars',
    );
  }

  async onModuleInit() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  /** Crops to a centred square, resizes and saves as WebP. Returns the public URL. */
  async save(userId: string, input: Buffer): Promise<string> {
    let output: Buffer;
    try {
      output = await sharp(input, { limitInputPixels: 40_000_000 })
        .rotate() // respect EXIF orientation from phone cameras
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
          fit: 'cover',
          position: 'attention',
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException('Unsupported or corrupted image');
    }

    // A fresh name on every upload lets browsers cache avatars forever.
    const filename = `${userId}-${randomBytes(6).toString('hex')}.webp`;
    await fs.writeFile(path.join(this.dir, filename), output);
    return `${AVATAR_URL_PREFIX}${filename}`;
  }

  /** Deletes a previously stored avatar. Ignores URLs this service did not create. */
  async remove(url: string | null | undefined): Promise<void> {
    if (!url?.startsWith(AVATAR_URL_PREFIX)) return;
    const filename = url.slice(AVATAR_URL_PREFIX.length);
    if (!SAFE_FILENAME.test(filename)) return;
    try {
      await fs.unlink(path.join(this.dir, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(
          `Could not delete avatar ${filename}: ${String(error)}`,
        );
      }
    }
  }
}
