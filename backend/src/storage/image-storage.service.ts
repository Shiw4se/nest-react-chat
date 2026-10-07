import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { FILE_STORAGE, type FileStorage } from './file-storage';

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
/** Longest side of a chat image after resizing */
export const ATTACHMENT_MAX_SIDE = 1600;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export interface StoredImage {
  url: string;
  width: number;
  height: number;
}

/**
 * Turns uploads into normalized WebP files and hands them to the storage
 * driver. Re-encoding is also the content check: anything sharp cannot
 * decode is rejected, whatever the declared MIME type says.
 */
@Injectable()
export class ImageStorageService {
  constructor(@Inject(FILE_STORAGE) private readonly storage: FileStorage) {}

  assertImageType(mimetype: string) {
    if (!IMAGE_MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP or GIF images');
    }
  }

  /** Square 256x256 crop, focused on the most interesting area. */
  async saveAvatar(userId: string, input: Buffer): Promise<string> {
    const output = await this.process(input, (img) =>
      img.resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: 'cover',
        position: 'attention',
      }),
    );
    return this.storage.put(
      this.key('avatars', userId),
      output.data,
      'image/webp',
    );
  }

  /** Keeps the aspect ratio, never upscales, returns the final size for layout. */
  async saveAttachment(userId: string, input: Buffer): Promise<StoredImage> {
    const output = await this.process(input, (img) =>
      img.resize(ATTACHMENT_MAX_SIDE, ATTACHMENT_MAX_SIDE, {
        fit: 'inside',
        withoutEnlargement: true,
      }),
    );
    const url = await this.storage.put(
      this.key('attachments', userId),
      output.data,
      'image/webp',
    );
    return { url, width: output.info.width, height: output.info.height };
  }

  async remove(url: string | null | undefined): Promise<void> {
    if (url) await this.storage.delete(url);
  }

  private async process(
    input: Buffer,
    transform: (img: sharp.Sharp) => sharp.Sharp,
  ) {
    try {
      // rotate(): respect EXIF orientation from phone cameras
      return await transform(
        sharp(input, { limitInputPixels: 40_000_000 }).rotate(),
      )
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException('Unsupported or corrupted image');
    }
  }

  /** A fresh name per upload lets browsers and CDNs cache forever. */
  private key(folder: 'avatars' | 'attachments', userId: string) {
    return `${folder}/${userId}-${randomBytes(6).toString('hex')}.webp`;
  }
}
