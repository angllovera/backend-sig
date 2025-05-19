// src/distribuidor/distribuidor.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistribuidorService } from './distribuidor.service';
import { DistribuidorController } from './distribuidor.controller';
import { Distribuidor } from './entities/distribuidor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Distribuidor])],
  controllers: [DistribuidorController],
  providers: [DistribuidorService],
})
export class DistribuidorModule {}
