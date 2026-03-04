import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common'; 
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  
  const configService = app.get(ConfigService);
  
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'),
    credentials: true,
  });



  const swaggerConfig = new DocumentBuilder()
    .setTitle(' Chat API')
    .setDescription('API documentation for the chat application')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
    
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT');
  if(!port) {
    throw new Error("PORT not defined in environment variables");
  }
  
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();