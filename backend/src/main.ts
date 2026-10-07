import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { ServerResponse } from 'http';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { resolveUploadsRoot, UPLOADS_URL_PREFIX } from './common/uploads';
import { isS3Driver } from './storage/storage.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);

  // Local driver only: with S3 the files are served by the bucket/CDN
  if (!isS3Driver(configService)) {
    // Uploaded files. Names are random per upload, so they can be cached forever.
    // Helmet's default Cross-Origin-Resource-Policy (same-origin) would block the
    // frontend origin from showing them, so it is relaxed for this path only.
    app.useStaticAssets(resolveUploadsRoot(configService.get('UPLOADS_DIR')), {
      prefix: `${UPLOADS_URL_PREFIX}/`,
      maxAge: '365d',
      immutable: true,
      index: false,
      setHeaders: (res: ServerResponse) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    });
  }

  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Chat API')
      .setVersion('1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('PORT');
  if (!port) {
    throw new Error('PORT not defined in environment variables');
  }

  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
});
