/**
 * Fills the database with demo users, rooms and a lively conversation.
 *
 *   npm run db:seed          (builds, then runs dist/seed/seed.js)
 *
 * Idempotent: removes the previous demo users (and everything they own)
 * before recreating them. Real users are never touched. Runs inside a Nest
 * application context, so images go through the configured storage driver
 * (local disk or S3) exactly like uploads do.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { ImageStorageService } from '../storage/image-storage.service';
import { ALLOWED_REACTIONS } from '../messages/reactions';
import {
  DEMO_PASSWORD,
  DEMO_ROOMS,
  DEMO_USERS,
  type DemoUser,
} from './demo-data';

const logger = new Logger('Seed');
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

/** Abstract "blob" avatar from three colours; no text, so no font issues. */
const avatarImage = ([a, b, c]: [string, string, string]) =>
  sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
      </linearGradient></defs>
      <rect width="512" height="512" fill="url(#g)"/>
      <circle cx="380" cy="130" r="120" fill="${c}" opacity="0.55"/>
      <circle cx="140" cy="400" r="160" fill="${c}" opacity="0.3"/>
      <circle cx="256" cy="230" r="70" fill="#ffffff" opacity="0.85"/>
      <ellipse cx="256" cy="430" rx="150" ry="110" fill="#ffffff" opacity="0.85"/>
    </svg>`),
  )
    .png()
    .toBuffer();

/** A mountain landscape for the photo message. */
const landscapeImage = () =>
  sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1e3a8a"/><stop offset="0.55" stop-color="#f97316"/><stop offset="1" stop-color="#fde68a"/>
        </linearGradient>
        <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#312e81"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#sky)"/>
      <circle cx="1150" cy="560" r="110" fill="#fef3c7" opacity="0.9"/>
      <path d="M0 720 L260 430 L430 590 L700 300 L980 640 L1180 470 L1600 760 L1600 1000 L0 1000Z" fill="url(#far)" opacity="0.85"/>
      <path d="M0 820 L320 600 L560 760 L860 520 L1120 780 L1360 640 L1600 820 L1600 1000 L0 1000Z" fill="#1e1b4b"/>
      <path d="M700 300 L760 370 L730 365 L700 400 L670 360 L640 370Z" fill="#f8fafc" opacity="0.9"/>
    </svg>`),
  )
    .jpeg()
    .toBuffer();

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const prisma = app.get(PrismaService);
  const images = app.get(ImageStorageService);

  try {
    const usernames = DEMO_USERS.map((u) => u.username);

    // ---- clean up the previous run (files first, then rows)
    const old = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true, avatarUrl: true },
    });
    const oldIds = old.map((u) => u.id);
    const oldFiles = await prisma.message.findMany({
      where: {
        OR: [{ userId: { in: oldIds } }, { room: { ownerId: { in: oldIds } } }],
        attachmentUrl: { not: null },
      },
      select: { attachmentUrl: true },
    });
    await Promise.allSettled([
      ...old.map((u) => images.remove(u.avatarUrl)),
      ...oldFiles.map((m) => images.remove(m.attachmentUrl)),
    ]);
    await prisma.room.deleteMany({ where: { ownerId: { in: oldIds } } });
    await prisma.user.deleteMany({ where: { id: { in: oldIds } } });

    // ---- users
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const ids = new Map<string, string>();
    for (const [index, u] of DEMO_USERS.entries()) {
      const user = await prisma.user.create({
        data: {
          username: u.username,
          password: passwordHash,
          displayName: u.displayName,
          bio: u.bio,
          createdAt: minutesAgo(30 * 24 * 60 - index * 600),
          lastSeenAt: minutesAgo(5 + index * 37),
        },
      });
      ids.set(u.username, user.id);
      if (u.avatar) {
        const url = await images.saveAvatar(
          user.id,
          await avatarImage(u.avatar),
        );
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: url },
        });
      }
    }
    const idOf = (username: string) => {
      const id = ids.get(username);
      if (!id) throw new Error(`Unknown demo user ${username}`);
      return id;
    };

    // ---- rooms, members and messages
    const photo = await landscapeImage();
    let messageCount = 0;
    for (const room of DEMO_ROOMS) {
      const oldest = Math.max(...room.messages.map((m) => m.minutesAgo)) + 60;
      const created = await prisma.room.create({
        data: {
          name: room.name,
          type: room.type,
          ownerId: idOf(room.owner),
          inviteToken:
            room.type === 'PRIVATE'
              ? crypto.randomUUID().replace(/-/g, '')
              : null,
          createdAt: minutesAgo(oldest),
        },
      });

      for (const member of room.members) {
        const isDemo = member === 'demo';
        await prisma.roomMember.create({
          data: {
            roomId: created.id,
            userId: idOf(member),
            joinedAt: minutesAgo(oldest),
            // Everyone has read everything, except "demo" in rooms with unread messages
            lastReadAt:
              isDemo && room.demoReadMinutesAgo !== undefined
                ? minutesAgo(room.demoReadMinutesAgo)
                : new Date(),
          },
        });
      }

      const keyToId = new Map<string, string>();
      for (const m of [...room.messages].sort(
        (a, b) => b.minutesAgo - a.minutesAgo,
      )) {
        const createdAt = minutesAgo(m.minutesAgo);
        const attachment = m.photo
          ? await images.saveAttachment(idOf(m.from), photo)
          : null;
        const message = await prisma.message.create({
          data: {
            roomId: created.id,
            userId: idOf(m.from),
            message: m.text,
            createdAt,
            editedAt: m.edited ? new Date(createdAt.getTime() + 90_000) : null,
            replyToId: m.replyTo ? keyToId.get(m.replyTo) : undefined,
            attachmentUrl: attachment?.url,
            attachmentWidth: attachment?.width,
            attachmentHeight: attachment?.height,
          },
        });
        if (m.key) keyToId.set(m.key, message.id);
        messageCount++;

        for (const [emoji, users] of Object.entries(m.reactions ?? {})) {
          if (!(ALLOWED_REACTIONS as readonly string[]).includes(emoji))
            continue;
          for (const username of users) {
            await prisma.reaction.create({
              data: {
                messageId: message.id,
                userId: idOf(username),
                emoji,
                createdAt,
              },
            });
          }
        }
      }
    }

    const accounts = DEMO_USERS.map((u: DemoUser) => u.username).join(', ');
    console.log(
      `Seeded ${DEMO_USERS.length} users, ${DEMO_ROOMS.length} rooms, ${messageCount} messages.`,
    );
    console.log(`Log in as any of: ${accounts} (password: ${DEMO_PASSWORD})`);
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
