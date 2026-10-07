import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Boots the full application with Prisma mocked out, so the suite runs
 * without a database. Covers routing, versioning, validation and auth guards.
 */
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'e2e-secret';
    process.env.DATABASE_URL ??= 'postgresql://u:p@localhost:5432/db';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique: jest.fn().mockResolvedValue(null) } })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/rooms/my without token returns 401', () => {
    return request(app.getHttpServer()).get('/v1/rooms/my').expect(401);
  });

  it('POST /v1/auth/login with invalid body returns 400', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'ab', password: 'short' })
      .expect(400);
  });

  it('POST /v1/auth/login with unknown user returns 401', () => {
    return request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ username: 'nobody', password: 'Password1' })
      .expect(401);
  });
});
