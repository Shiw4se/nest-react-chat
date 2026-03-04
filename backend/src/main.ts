import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common'; // Добавь VersioningType
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', 
  });

  const port = configService.get<number>('PORT');
  if(!port) {
    throw new Error("PORT not defined in environment variables");
  }
  
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();