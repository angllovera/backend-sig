import {
  Controller, Get, Param, UseGuards,
  Patch, Body, Request, Post
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pedido')
@UseGuards(JwtAuthGuard)
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Get()
  getAll() {
    return this.pedidoService.getAll();
  }

  @Get('mis-pedidos')
  getMisPedidos(@Request() req) {
    return this.pedidoService.getPedidosPorDistribuidor(req.user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.pedidoService.getById(+id);
  }

  @Patch(':id/entrega')
  registrarEntrega(@Param('id') id: string, @Body() body: {
    estado: string;
    observacion?: string;
    latitud: number;
    longitud: number;
  }) {
    return this.pedidoService.registrarEntrega(+id, body);
  }

  @Post('asignar')
  asignarPedidos() {
    return this.pedidoService.asignarPedidos();
  }

  @Post('asignar-automatico')
  async asignarPedidosAutomatico() {
    return this.pedidoService.asignarPedidosPendientesManual();
  }

  @Post('calcular-ruta')
  async calcularRuta(@Body() body: { lat: number; lng: number }, @Request() req) {
    try {
      console.log(`🗺️ Calculando ruta para distribuidor ID: ${req.user.id}`);
      console.log(`📍 Coordenadas recibidas: ${body.lat}, ${body.lng}`);
      
      const ruta = await this.pedidoService.calcularRuta(req.user.id, body.lat, body.lng);
      
      console.log(`✅ Ruta calculada exitosamente`);
      return ruta;
    } catch (error) {
      console.error(`❌ Error calculando ruta: ${error.message}`);
      throw error;
    }
  }

  @Get(':id/detalle')
  async getDetallePedido(@Param('id') id: string) {
    return this.pedidoService.getDetalleConPagos(+id);
  }

  @Get(':id/estado')
  async estadoPedido(@Param('id') id: string) {
    return this.pedidoService.getEstadoPedido(+id);
  }

  @Get('estadisticas/distribuidor')
  async getEstadisticasDistribuidor(@Request() req) {
    try {
      const stats = await this.pedidoService.getEstadisticasDistribuidor(req.user.id);
      return stats;
    } catch (error) {
      console.error(`❌ Error obteniendo estadísticas: ${error.message}`);
      throw error;
    }
  }

  @Get('historial/entregas')
  async getHistorialEntregas(@Request() req) {
    try {
      const historial = await this.pedidoService.getHistorialEntregas(req.user.id);
      return historial;
    } catch (error) {
      console.error(`❌ Error obteniendo historial: ${error.message}`);
      throw error;
    }
  }
}
