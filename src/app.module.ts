import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { PagoModule } from './pago/pago.module';
import { DistribuidorModule } from './distribuidor/distribuidor.module';

import { User } from './auth/entities/user.entity';
import { Pago } from './pago/entities/pago.entity';
import { Distribuidor } from './distribuidor/entities/distribuidor.entity';

import { PedidoModule } from './pedido/pedido.module';
import { Pedido } from './pedido/entities/pedido.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Pago, Distribuidor, Pedido],
      synchronize: true,
    }),
    AuthModule,
    PagoModule,
    DistribuidorModule,
    PedidoModule,
  ],
})
export class AppModule {}
