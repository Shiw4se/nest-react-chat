import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  const make = (queryRaw: jest.Mock) =>
    new HealthController({ $queryRaw: queryRaw } as unknown as PrismaService);

  it('reports ok when the database answers', async () => {
    const result = await make(jest.fn().mockResolvedValue([1])).check();
    expect(result).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('returns 503 when the database is down', async () => {
    await expect(
      make(jest.fn().mockRejectedValue(new Error('ECONNREFUSED'))).check(),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
