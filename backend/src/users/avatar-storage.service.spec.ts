import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import { AVATAR_SIZE, AvatarStorageService } from './avatar-storage.service';

const USER_ID = '8236fc8c-c46b-4fa0-937f-c63ecd306399';

describe('AvatarStorageService', () => {
  let root: string;
  let storage: AvatarStorageService;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'avatars-'));
    const config = { get: () => root } as unknown as ConfigService;
    storage = new AvatarStorageService(config);
    await storage.onModuleInit();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const fileFor = (url: string) =>
    path.join(root, 'avatars', url.split('/').pop()!);

  it('crops any image to a square WebP', async () => {
    const wide = await sharp({
      create: { width: 800, height: 400, channels: 3, background: '#3366ff' },
    })
      .png()
      .toBuffer();

    const url = await storage.save(USER_ID, wide);

    expect(url).toMatch(
      /^\/uploads\/avatars\/[0-9a-f-]{36}-[0-9a-f]{12}\.webp$/,
    );
    // read into memory: sharp keeps files opened by path locked on Windows
    const meta = await sharp(await fs.readFile(fileFor(url))).metadata();
    expect(meta).toMatchObject({
      format: 'webp',
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
    });
  });

  it('rejects data that is not an image', async () => {
    await expect(
      storage.save(USER_ID, Buffer.from('definitely not an image')),
    ).rejects.toThrow(BadRequestException);
  });

  it('removes its own files and ignores foreign or traversal paths', async () => {
    const img = await sharp({
      create: { width: 10, height: 10, channels: 3, background: '#000' },
    })
      .png()
      .toBuffer();
    const url = await storage.save(USER_ID, img);

    await storage.remove('/uploads/avatars/../../secret.txt');
    await storage.remove('https://example.com/a.webp');
    await expect(fs.access(fileFor(url))).resolves.toBeUndefined();

    await storage.remove(url);
    await expect(fs.access(fileFor(url))).rejects.toThrow();
  });
});
