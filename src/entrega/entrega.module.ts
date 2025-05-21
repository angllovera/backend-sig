import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntregaController } from './entrega.controller';
import { EntregaService } from './entrega.service';
import { Entrega } from './entities/entrega.entity';
import { PedidoModule } from '../pedido/pedido.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entrega]),
    PedidoModule, // Importamos el módulo de Pedido para poder usar su servicio
  ],
  controllers: [EntregaController],
  providers: [EntregaService],
  exports: [EntregaService], // Exportamos el servicio para que pueda ser usado en otros módulos
})
export class EntregaModule {}
