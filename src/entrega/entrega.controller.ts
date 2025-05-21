import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { EntregaService } from './entrega.service';
import { CreateEntregaDto } from './dto/create-entrega.dto';
import { UpdateEntregaDto } from './dto/update-entrega.dto';
import { Entrega } from './entities/entrega.entity';

@Controller('entregas')
export class EntregaController {
  constructor(private readonly entregaService: EntregaService) {}

  @Post()
  async create(
    @Body() createEntregaDto: CreateEntregaDto,
  ): Promise<{ success: boolean; mensaje: string; data: Entrega }> {
    const entrega = await this.entregaService.create(createEntregaDto);
    return {
      success: true,
      mensaje: 'Entrega creada exitosamente',
      data: entrega,
    };
  }

  @Get()
  async findAll(): Promise<{
    success: boolean;
    cantidad: number;
    data: Entrega[];
  }> {
    const entregas = await this.entregaService.findAll();
    return {
      success: true,
      cantidad: entregas.length,
      data: entregas,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; data: Entrega }> {
    const entrega = await this.entregaService.findOne(id);
    return {
      success: true,
      data: entrega,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEntregaDto: UpdateEntregaDto,
  ): Promise<{ success: boolean; mensaje: string; data: Entrega }> {
    const entrega = await this.entregaService.update(id, updateEntregaDto);
    return {
      success: true,
      mensaje: 'Entrega actualizada exitosamente',
      data: entrega,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; mensaje: string; data: Entrega }> {
    const entrega = await this.entregaService.remove(id);
    return {
      success: true,
      mensaje: 'Entrega eliminada exitosamente',
      data: entrega,
    };
  }

  @Get('estado/:estado')
  async findByEstado(
    @Param('estado') estado: string,
  ): Promise<{ success: boolean; cantidad: number; data: Entrega[] }> {
    const entregas = await this.entregaService.findByEstado(estado);
    return {
      success: true,
      cantidad: entregas.length,
      data: entregas,
    };
  }

  @Get('pedido/:pedidoId')
  async findByPedido(
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ): Promise<{ success: boolean; data: Entrega }> {
    const entrega = await this.entregaService.findByPedido(pedidoId);
    return {
      success: true,
      data: entrega,
    };
  }
}
