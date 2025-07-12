import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedDistribuidores } from './distribuidor/distribuidor.seed';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Distribuidor } from './distribuidor/entities/distribuidor.entity';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware necesario para recibir body en JSON
  app.use(express.json());

  // Webhook de Stripe (si lo usas)
  app.use(
    '/stripe/webhook',
    json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // Middleware para imprimir peticiones entrantes
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.originalUrl}`);
    if (req.method !== 'GET') {
      console.log('📦 Body:', req.body);
    }
    next();
  });

  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS para Flutter/web
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Ejecutar seeder
  const distribuidorRepo = app.get(getRepositoryToken(Distribuidor));
  await seedDistribuidores(distribuidorRepo);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
