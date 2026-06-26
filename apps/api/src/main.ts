import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({
    origin: (reqOrigin, callback) => {
      const allowed = origin.split(',').map((o) => o.trim());
      // Permitir peticiones sin origin (apps móviles, curl) o de Vercel
      if (!reqOrigin || allowed.includes(reqOrigin) || reqOrigin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido: ${reqOrigin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
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