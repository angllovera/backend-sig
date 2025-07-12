import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';
import { Pago } from './entities/pago.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Pedido]), StripeModule],
  controllers: [PagoController],
  providers: [PagoService],
})
export class PagoModule {}
