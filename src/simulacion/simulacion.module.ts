import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulacionController } from './simulacion.controller';
import { SimulacionService } from './simulacion.service';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Distribuidor } from '../distribuidor/entities/distribuidor.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Distribuidor])], 
  controllers: [SimulacionController],
  providers: [SimulacionService],
})
export class SimulacionModule {}