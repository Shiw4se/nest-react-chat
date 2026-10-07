import { Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { FileStorage, SAFE_KEY } from './file-storage';

export interface S3StorageOptions {
  bucket: string;
  /** Public base URL of the bucket, e.g. https://pub-xxx.r2.dev or a CDN domain */
  publicUrl: string;
}

/**
 * Any S3-compatible object store: AWS S3, Cloudflare R2, Backblaze B2, MinIO.
 * Needed on hosts whose disk is wiped on every deploy or restart.
 */
export class S3FileStorage implements FileStorage {
  private readonly logger = new Logger(S3FileStorage.name);
  private readonly publicUrl: string;

  constructor(
    private readonly client: S3Client,
    private readonly options: S3StorageOptions,
  ) {
    this.publicUrl = options.publicUrl.replace(/\/+$/, '');
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are unique per upload, so objects never change
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async delete(url: string): Promise<void> {
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) return;
    const key = url.slice(prefix.length);
    if (!SAFE_KEY.test(key)) return;
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }),
      );
    } catch (error) {
      this.logger.warn(`Could not delete ${key}: ${String(error)}`);
    }
  }
}
