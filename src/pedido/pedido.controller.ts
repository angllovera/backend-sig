import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { Pedido } from './entities/pedido.entity';

@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  async create(@Body() createPedidoDto: CreatePedidoDto): Promise<{ success: boolean; mensaje: string; data: Pedido }> {
    const pedido = await this.pedidoService.create(createPedidoDto);
    return {
      success: true,
      mensaje: 'Pedido creado exitosamente',
      data: pedido,
    };
  }

  @Get()
  async findAll(): Promise<{ success: boolean; cantidad: number; data: Pedido[] }> {
    const pedidos = await this.pedidoService.findAll();
    return {
      success: true,
      cantidad: pedidos.length,
      data: pedidos,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ success: boolean; data: Pedido }> {
    const pedido = await this.pedidoService.findOne(+id);
    return {
      success: true,
      data: pedido,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ): Promise<{ success: boolean; mensaje: string; data: Pedido }> {
    const pedido = await this.pedidoService.update(+id, updatePedidoDto);
    return {
      success: true,
      mensaje: 'Pedido actualizado exitosamente',
      data: pedido,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean; mensaje: string; data: Pedido }> {
    const pedido = await this.pedidoService.remove(+id);
    return {
      success: true,
      mensaje: 'Pedido eliminado exitosamente',
      data: pedido,
    };
  }

  @Get('cliente/:cliente')
  async findByCliente(@Param('cliente') cliente: string): Promise<{ success: boolean; cantidad: number; data: Pedido[] }> {
    const pedidos = await this.pedidoService.findByCliente(cliente);
    return {
      success: true,
      cantidad: pedidos.length,
      data: pedidos,
    };
  }

  @Get('estado/:estado')
  async findByEstado(@Param('estado') estado: string): Promise<{ success: boolean; cantidad: number; data: Pedido[] }> {
    const pedidos = await this.pedidoService.findByEstado(estado);
    return {
      success: true,
      cantidad: pedidos.length,
      data: pedidos,
    };
  }
}