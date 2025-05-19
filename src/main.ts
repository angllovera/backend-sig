import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedDistribuidores } from './distribuidor/distribuidor.seed';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Distribuidor } from './distribuidor/entities/distribuidor.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: 'http://localhost:5173', // dirección de tu frontend
    credentials: true,
  });

  // Ejecutar el seeder de distribuidores si está vacío
  const distribuidorRepo = app.get(getRepositoryToken(Distribuidor));
  await seedDistribuidores(distribuidorRepo);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
