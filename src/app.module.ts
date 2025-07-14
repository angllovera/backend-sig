import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; 

import { AuthModule } from './auth/auth.module';
import { DistribuidorModule } from './distribuidor/distribuidor.module';
import { PedidoModule } from './pedido/pedido.module';
import { SimulacionModule } from './simulacion/simulacion.module';
import { PagoModule } from './pago/pago.module';
import { PagesModule } from './pages/pages.module'; // 🔧 NUEVO IMPORT

import { User } from './auth/entities/user.entity';
import { Distribuidor } from './distribuidor/entities/distribuidor.entity';
import { Pedido } from './pedido/entities/pedido.entity';
import { Pago } from './pago/entities/pago.entity';
import { AppController } from './app.controller';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), 
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Distribuidor, Pedido, Pago],
      synchronize: true, // solo para desarrollo
    }),
    AuthModule,
    DistribuidorModule,
    PedidoModule,
    SimulacionModule,
    PagoModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}