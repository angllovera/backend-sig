import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { SimulacionService } from './simulacion.service';

@Controller('simulacion')
export class SimulacionController {
  constructor(private readonly simulacionService: SimulacionService) {}

  @Post('crear-pedido')
  crearPedidoCompleto(@Body() body: {
    lat: number;
    lng: number;
    cliente: string;
    producto: string;
    cantidad: number;
    precio_unitario: number;
    descripcion: string;
  }) {
    return this.simulacionService.crearPedidoCompleto(body);
  }

  @Get('pedidos')
  listarPedidos() {
    return this.simulacionService.listarPedidos();
  }

  @Get('debug/distribuidores')
  verificarDistribuidores() {
    return this.simulacionService.verificarDistribuidores();
  }

  @Delete('pedido/:id')
  eliminarPedido(@Param('id') id: string) {
    return this.simulacionService.eliminarPedido(+id);
  }
}
