import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // 🔧 CAMBIO: Importar JwtModule en lugar de JwtService
import { ConfigModule, ConfigService } from '@nestjs/config'; // 🔧 AGREGAR: ConfigService

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity';
import { User } from '../auth/entities/user.entity';
import { Pago } from '../pago/entities/pago.entity';
import { AuthService } from '../auth/auth.service';
import { PedidoService } from '../pedido/pedido.service';
import { DistribuidorService } from '../distribuidor/distribuidor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Distribuidor, User, Pago]),
    // 🔧 NUEVA CONFIGURACIÓN: Configurar JWT con la clave secreta
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '3600s'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AuthService,
    PedidoService,
    DistribuidorService,
  ],
})
export class AdminModule {}