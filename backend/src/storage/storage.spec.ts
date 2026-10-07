import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { LocalFileStorage } from './local-file-storage';
import { S3FileStorage } from './s3-file-storage';
import {
  ATTACHMENT_MAX_SIDE,
  AVATAR_SIZE,
  ImageStorageService,
} from './image-storage.service';
import type { FileStorage } from './file-storage';

const USER_ID = '8236fc8c-c46b-4fa0-937f-c63ecd306399';

const png = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: '#3366ff' },
  })
    .png()
    .toBuffer();

/** In-memory driver: lets the image tests inspect what would be stored */
class MemoryStorage implements FileStorage {
  files = new Map<string, Buffer>();
  put(key: string, body: Buffer) {
    this.files.set(key, body);
    return Promise.resolve(`mem://${key}`);
  }
  delete(url: string) {
    this.files.delete(url.replace('mem://', ''));
    return Promise.resolve();
  }
}

describe('ImageStorageService', () => {
  let memory: MemoryStorage;
  let images: ImageStorageService;

  beforeEach(() => {
    memory = new MemoryStorage();
    images = new ImageStorageService(memory);
  });

  const stored = async (url: string) =>
    sharp(memory.files.get(url.replace('mem://', ''))).metadata();

  it('crops avatars to a WebP square', async () => {
    const url = await images.saveAvatar(USER_ID, await png(800, 400));
    expect(url).toMatch(/^mem:\/\/avatars\/[0-9a-f-]{36}-[0-9a-f]{12}\.webp$/);
    expect(await stored(url)).toMatchObject({
      format: 'webp',
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
    });
  });

  it('shrinks large attachments, keeps aspect ratio and reports size', async () => {
    const result = await images.saveAttachment(USER_ID, await png(4000, 2000));
    expect(result.width).toBe(ATTACHMENT_MAX_SIDE);
    expect(result.height).toBe(ATTACHMENT_MAX_SIDE / 2);
    expect(await stored(result.url)).toMatchObject({ format: 'webp' });
  });

  it('never upscales small attachments', async () => {
    const result = await images.saveAttachment(USER_ID, await png(300, 200));
    expect(result).toMatchObject({ width: 300, height: 200 });
  });

  it('rejects data that is not an image', async () => {
    await expect(
      images.saveAttachment(USER_ID, Buffer.from('not an image')),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported MIME types', () => {
    expect(() => images.assertImageType('application/pdf')).toThrow(
      BadRequestException,
    );
  });
});

describe('LocalFileStorage', () => {
  let root: string;
  let storage: LocalFileStorage;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-'));
    storage = new LocalFileStorage(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('writes under the key and returns an /uploads URL', async () => {
    const key = `attachments/${USER_ID}-0123456789ab.webp`;
    const url = await storage.put(key, Buffer.from('x'));
    expect(url).toBe(`/uploads/${key}`);
    await expect(fs.readFile(path.join(root, key), 'utf8')).resolves.toBe('x');
  });

  it('deletes its own files and ignores foreign or traversal paths', async () => {
    const key = `avatars/${USER_ID}-0123456789ab.webp`;
    const url = await storage.put(key, Buffer.from('x'));

    await storage.delete('/uploads/avatars/../../secret.txt');
    await storage.delete('https://example.com/avatars/a.webp');
    await expect(fs.access(path.join(root, key))).resolves.toBeUndefined();

    await storage.delete(url);
    await expect(fs.access(path.join(root, key))).rejects.toThrow();
  });
});

describe('S3FileStorage', () => {
  const send = jest.fn<Promise<object>, [unknown]>().mockResolvedValue({});
  const storage = new S3FileStorage({ send } as never, {
    bucket: 'chat',
    publicUrl: 'https://cdn.example.com/',
  });

  beforeEach(() => send.mockClear());

  it('uploads with an immutable cache header and returns the public URL', async () => {
    const key = `avatars/${USER_ID}-0123456789ab.webp`;
    const url = await storage.put(key, Buffer.from('x'), 'image/webp');

    expect(url).toBe(`https://cdn.example.com/${key}`);
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: 'chat',
      Key: key,
      ContentType: 'image/webp',
      CacheControl: expect.stringContaining('immutable') as string,
    });
  });

  it('deletes only keys it generated under its own URL', async () => {
    await storage.delete('https://other.com/avatars/x.webp');
    await storage.delete('https://cdn.example.com/../secret');
    expect(send).not.toHaveBeenCalled();

    const key = `attachments/${USER_ID}-0123456789ab.webp`;
    await storage.delete(`https://cdn.example.com/${key}`);
    const command = send.mock.calls[0][0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({ Bucket: 'chat', Key: key });
  });
});
