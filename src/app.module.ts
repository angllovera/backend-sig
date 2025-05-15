import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { PagoModule } from './pago/pago.module';
import { Pago } from './pago/entities/pago.entity'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '8960406',
      database: 'backend_sig',
      entities: [User, Pago],
      synchronize: true,
    }),
    AuthModule,
    PagoModule,
  ],
})
export class AppModule {}
