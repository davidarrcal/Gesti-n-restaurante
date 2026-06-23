import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({ origin: origin.split(',') });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  Logger.log(`API lista en http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();