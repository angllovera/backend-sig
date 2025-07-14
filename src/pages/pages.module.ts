import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesController } from './pages.controller';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Pago } from '../pago/entities/pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Pago]),
  ],
  controllers: [PagesController],
})
export class PagesModule {}