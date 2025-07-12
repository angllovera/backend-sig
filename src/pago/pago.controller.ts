import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PagoService } from './pago.service';
import { CreatePagoDto } from './dto/create-pago.dto';

@Controller('pago')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  // Crear un nuevo pago (efectivo, transferencia, stripe o qr)
  @Post()
  create(@Body() dto: CreatePagoDto) {
    return this.pagoService.create(dto);
  }

  // Obtener todos los pagos
  @Get()
  findAll() {
    return this.pagoService.findAll();
  }

  // Obtener un pago por su ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagoService.findOne(+id);
  }

  // Obtener pagos por ID de pedido
  @Get('pedido/:pedidoId')
  findByPedido(@Param('pedidoId') pedidoId: string) {
    return this.pagoService.findByPedido(+pedidoId);
  }

  // Generar QR para pago de un pedido (opcional si el frontend llama directamente a POST /pago con metodo = 'qr')
  @Post('qr')
  generarPagoQR(@Body() body: { pedidoId: number }) {
    return this.pagoService.generarPagoQR(body.pedidoId);
  }
}
