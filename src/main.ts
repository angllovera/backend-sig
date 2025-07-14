import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedDistribuidores } from './distribuidor/distribuidor.seed';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Distribuidor } from './distribuidor/entities/distribuidor.entity';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { json } from 'express';
import { join } from 'path';
import * as hbs from 'hbs'; // 🔧 AGREGAR: Importar hbs

async function bootstrap() {
  try {
    console.log('🔄 Iniciando aplicación...');
    
    // 🔧 CAMBIO: Especificar tipo NestExpressApplication
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    console.log('✅ Aplicación NestJS creada');

    // Middleware necesario para recibir body en JSON
    app.use(express.json());
    console.log('✅ JSON middleware configurado');

    // Webhook de Stripe (si lo usas)
    app.use(
      '/stripe/webhook',
      json({
        verify: (req: any, res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    console.log('✅ Webhook middleware configurado');

    // Middleware para imprimir peticiones entrantes
    app.use((req, res, next) => {
      console.log(`📨 ${req.method} ${req.originalUrl}`);
      if (req.method !== 'GET') {
        console.log('📦 Body:', req.body);
      }
      next();
    });
    console.log('✅ Request logger configurado');

    // Validaciones globales
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    console.log('✅ Validation pipe configurado');

    // CORS para Flutter/web
    app.enableCors({
      origin: '*',
      credentials: true,
    });
    console.log('✅ CORS configurado');

    // 🔧 CONFIGURACIÓN PARA TEMPLATES HTML DEL ADMIN PANEL
    try {
      const publicPath = join(__dirname, '..', 'public');
      const viewsPath = join(__dirname, '..', 'src/admin/views');
      
      console.log('🗂️ Configurando rutas:');
      console.log('   📁 Public:', publicPath);
      console.log('   📁 Views:', viewsPath);
      
      app.useStaticAssets(publicPath);
      app.setBaseViewsDir(viewsPath);
      app.setViewEngine('hbs');

      // 🔧 NUEVA CONFIGURACIÓN: Registrar helpers de Handlebars
      hbs.registerHelper('eq', function (a, b) {
        return a === b;
      });

      hbs.registerHelper('ne', function (a, b) {
        return a !== b;
      });

      hbs.registerHelper('gt', function (a, b) {
        return a > b;
      });

      hbs.registerHelper('lt', function (a, b) {
        return a < b;
      });

      hbs.registerHelper('gte', function (a, b) {
        return a >= b;
      });

      hbs.registerHelper('lte', function (a, b) {
        return a <= b;
      });

      hbs.registerHelper('and', function (a, b) {
        return a && b;
      });

      hbs.registerHelper('or', function (a, b) {
        return a || b;
      });

      hbs.registerHelper('not', function (a) {
        return !a;
      });

      // Helper para formatear fechas
      hbs.registerHelper('formatDate', function (date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-BO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      });

      // Helper para formatear números
      hbs.registerHelper('formatNumber', function (num) {
        if (!num) return '0';
        return parseFloat(num).toFixed(2);
      });

      console.log('✅ Templates HTML y helpers configurados');
    } catch (viewError) {
      console.error('❌ Error configurando templates:', viewError);
      // Continuar sin templates si hay error
    }

    // Ejecutar seeder
    try {
      console.log('🌱 Ejecutando seeder...');
      const distribuidorRepo = app.get(getRepositoryToken(Distribuidor));
      await seedDistribuidores(distribuidorRepo);
      console.log('✅ Seeder ejecutado');
    } catch (seedError) {
      console.error('❌ Error en seeder:', seedError);
      // Continuar sin seeder si hay error
    }

    // Iniciar servidor
    const port = process.env.PORT ?? 3000;
    console.log(`🔄 Iniciando servidor en puerto ${port}...`);
    
    await app.listen(port, '0.0.0.0');
    
    // 🔧 ESTOS LOGS DEBERÍAN APARECER SI TODO FUNCIONA
    console.log('🚀 ========================================');
    console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE');
    console.log('🚀 ========================================');
    console.log(`🌐 Servidor: http://localhost:${port}`);
    console.log(`📊 Admin panel: http://localhost:${port}/admin`);
    console.log(`🔍 Health check: http://localhost:${port}/auth/ping`);
    console.log('🚀 ========================================');
    
  } catch (error) {
    console.error('💥 ERROR FATAL EN BOOTSTRAP:');
    console.error(error);
    process.exit(1);
  }
}

// 🔧 MANEJAR ERRORES NO CAPTURADOS
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
  process.exit(1);
});

bootstrap();