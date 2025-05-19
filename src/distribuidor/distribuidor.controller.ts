// src/distribuidor/distribuidor.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { DistribuidorService } from './distribuidor.service';
import { CreateDistribuidorDto } from './dto/create-distribuidor.dto';
import { UpdateDistribuidorDto } from './dto/update-distribuidor.dto';

@Controller('distribuidores')
export class DistribuidorController {
  constructor(private readonly service: DistribuidorService) {}

  @Post()
  create(@Body() dto: CreateDistribuidorDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDistribuidorDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  // En distribuidor.controller.ts
  @Get('buscar/:nombre')
  buscarPorNombre(@Param('nombre') nombre: string) {
    return this.service.buscarPorNombre(nombre);
  }

  // En distribuidor.controller.ts
  @Get('capacidad/:min')
  filtrarPorCapacidad(@Param('min') min: string) {
    return this.service.filtrarPorCapacidad(parseInt(min));
  }
}
