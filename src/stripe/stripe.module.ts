import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Pago } from '../pago/entities/pago.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoModule } from '../pedido/pedido.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Pago]), // ✅ acceso a repositorios
    PedidoModule, // ✅ acceso a PedidoService (si se usa)
  ],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}
