import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Body,
  Request,
  Post,
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
  async getMisPedidos(@Request() req) {
    return this.pedidoService.getPedidosPorDistribuidor(req.user.userId);
  }

  // 🔧 NUEVO: Endpoint ligero para verificación rápida de cambios
  @Get('verificar-cambios')
  async verificarCambios(@Request() req) {
    const distribuidorId = req.user.userId;
    
    try {
      const pedidosPendientes = await this.pedidoService.contarPedidosPendientes(distribuidorId);
      const ultimaEntrega = await this.pedidoService.getUltimaEntrega(distribuidorId);
      
      return {
        pedidosPendientes,
        ultimaEntrega: ultimaEntrega ? {
          id: ultimaEntrega.id,
          fecha: ultimaEntrega.fecha,
          latitud: ultimaEntrega.latitud,
          longitud: ultimaEntrega.longitud,
        } : null,
        timestamp: new Date().getTime(),
        distribuidorId,
      };
    } catch (error) {
      console.error('❌ Error en verificarCambios:', error);
      return {
        pedidosPendientes: 0,
        ultimaEntrega: null,
        timestamp: new Date().getTime(),
        error: 'Error al verificar cambios'
      };
    }
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.pedidoService.getById(+id);
  }

  @Patch(':id/entrega')
  registrarEntrega(
    @Param('id') id: string,
    @Body()
    body: {
      estado: string;
      observacion?: string;
      latitud: number;
      longitud: number;
    },
  ) {
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
  async calcularRuta(
    @Body() body: { lat: number; lng: number },
    @Request() req,
  ) {
    return this.pedidoService.calcularRuta(req.user.userId, body.lat, body.lng);
  }

  @Post('calcular-ruta-personalizada')
  async calcularRutaPersonalizada(
    @Body() body: {
      lat: number;
      lng: number;
      pedidoIds: number[];
    },
    @Request() req,
  ) {
    return this.pedidoService.calcularRutaPersonalizada(
      req.user.userId,
      body.lat,
      body.lng,
      body.pedidoIds,
    );
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
    return this.pedidoService.getEstadisticasDistribuidor(req.user.userId);
  }

  @Get('historial/entregas')
  async getHistorialEntregas(@Request() req) {
    return this.pedidoService.getHistorialEntregas(req.user.userId);
  }

  // 🔧 NUEVO: Endpoint para forzar recálculo de ruta
  @Post('forzar-recalculo')
  async forzarRecalculo(@Request() req) {
    const distribuidorId = req.user.userId;
    
    try {
      // Obtener última ubicación del distribuidor
      const ultimaEntrega = await this.pedidoService.getUltimaEntrega(distribuidorId);
      
      if (ultimaEntrega && ultimaEntrega.latitud && ultimaEntrega.longitud) {
        // Recalcular desde última entrega
        return this.pedidoService.calcularRuta(
          distribuidorId, 
          ultimaEntrega.latitud, 
          ultimaEntrega.longitud
        );
      } else {
        return {
          mensaje: 'No se puede recalcular ruta: no hay ubicación de referencia',
          success: false
        };
      }
    } catch (error) {
      console.error('❌ Error forzando recálculo:', error);
      return {
        mensaje: 'Error al forzar recálculo de ruta',
        success: false,
        error: error.message
      };
    }
  }
}