import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseGuards
} from '@nestjs/common';
import { DistribuidorService } from './distribuidor.service';
import { CreateDistribuidorDto } from './dto/create-distribuidor.dto';
import { UpdateDistribuidorDto } from './dto/update-distribuidor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('distribuidores')
export class DistribuidorController {
  constructor(private readonly service: DistribuidorService) {}

  @Post()
  create(@Body() dto: CreateDistribuidorDto) {
    return this.service.create(dto);
  }

  @Patch(':id/ubicacion')
  @UseGuards(JwtAuthGuard)
  updateUbicacion(
    @Param('id') id: number,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.service.updateUbicacion(id, body.lat, body.lng);
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

  @Get('buscar/:nombre')
  buscarPorNombre(@Param('nombre') nombre: string) {
    return this.service.buscarPorNombre(nombre);
  }

  @Get('capacidad/:min')
  filtrarPorCapacidad(@Param('min') min: string) {
    return this.service.filtrarPorCapacidad(parseInt(min));
  }
}
