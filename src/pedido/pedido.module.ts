import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { Pedido } from './entities/pedido.entity';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Distribuidor])],
  controllers: [PedidoController],
  providers: [PedidoService],
  exports: [PedidoService],
})
export class PedidoModule {}
