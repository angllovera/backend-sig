import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class PagoService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * 🔧 NUEVO: Marcar pedido como entregado después del pago
   */
  private async marcarPedidoComoEntregado(
    pedido: Pedido, 
    metodoPago: string,
    latitud?: number,
    longitud?: number
  ): Promise<void> {
    console.log(`✅ Marcando pedido ${pedido.id} como entregado (${metodoPago})`);
    
    // Actualizar estado del pedido
    pedido.estado = 'entregado';
    pedido.entregado = true;
    pedido.observacion = `Entregado automáticamente tras pago con ${metodoPago}`;
    
    // Si se proporciona ubicación, actualizar coordenadas de entrega
    if (latitud && longitud) {
      pedido.latitud = latitud;
      pedido.longitud = longitud;
      console.log(`📍 Ubicación de entrega registrada: ${latitud}, ${longitud}`);
    }
    
    await this.pedidoRepo.save(pedido);
    console.log(`✅ Pedido ${pedido.id} marcado como entregado exitosamente`);
  }

  /**
   * Función para generar QR con Stripe
   */
  async generarPagoQR(pedidoId: number): Promise<{ qrUrl: string; qrImage: string }> {
    console.log(`🔄 Generando QR para pedido ${pedidoId}`);
    
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const descripcion = pedido.producto || `Pedido #${pedido.id}`;
    const monto = pedido.total;

    console.log(`💰 Generando QR: ${descripcion} - Bs ${monto}`);
    
    const { url, qrImage } = await this.stripeService.crearCheckout(pedidoId, descripcion, monto);

    // 🔧 MEJORADO: Crear registro de pago QR pendiente
    const pago = this.pagoRepo.create({
      metodo: 'qr',
      monto,
      pedido,
      qrUrl: url,
      estado: 'pendiente', // Se completará via webhook
    });

    await this.pagoRepo.save(pago);
    console.log(`✅ QR generado y pago registrado como pendiente`);

    return { qrUrl: url ?? '', qrImage };
  }

  /**
   * 🔧 MEJORADO: Crear pago y marcar como entregado automáticamente
   */
  async create(dto: CreatePagoDto): Promise<Pago | { url: string; qrImage: string }> {
    console.log(`🔄 Procesando pago: ${JSON.stringify(dto)}`);
    
    const pedido = await this.pedidoRepo.findOne({ where: { id: dto.pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const metodoStripe = ['qr', 'stripe'];
    const monto = typeof dto.monto === 'number' && dto.monto > 0 ? dto.monto : pedido.total;

    console.log(`💰 Procesando pago de Bs ${monto} con método: ${dto.metodo}`);

    // === MÉTODOS QUE USAN STRIPE (QR Y STRIPE) ===
    if (metodoStripe.includes(dto.metodo)) {
      console.log(`🔄 Creando checkout de Stripe para ${dto.metodo}`);
      
      const { url, qrImage } = await this.stripeService.crearCheckout(
        pedido.id, 
        pedido.producto || `Pedido #${pedido.id}`, 
        monto
      );

      // Crear registro de pago pendiente
      const pago = this.pagoRepo.create({
        metodo: dto.metodo,
        monto,
        pedido,
        qrUrl: url,
        estado: 'pendiente', // Se completará via webhook cuando el usuario pague
      });

      await this.pagoRepo.save(pago);
      console.log(`✅ Pago ${dto.metodo} registrado como pendiente - se completará via webhook`);

      return { url: url!, qrImage };
    }

    // === MÉTODOS LOCALES (EFECTIVO Y TRANSFERENCIA) ===
    console.log(`💵 Procesando pago local: ${dto.metodo}`);
    
    // Crear registro de pago completado
    const pago = this.pagoRepo.create({
      metodo: dto.metodo,
      monto,
      pedido,
      estado: 'completado', // Los pagos locales se marcan como completados inmediatamente
    });

    const pagoGuardado = await this.pagoRepo.save(pago);
    console.log(`✅ Pago ${dto.metodo} registrado como completado`);

    // 🔧 NUEVO: Marcar automáticamente como entregado para pagos locales
    await this.marcarPedidoComoEntregado(
      pedido, 
      dto.metodo,
      dto.latitud,
      dto.longitud
    );

    return pagoGuardado;
  }

  /**
   * 🔧 NUEVO: Método para confirmar pago y marcar como entregado (usado por webhook)
   */
  async confirmarPagoYEntregar(
    pedidoId: number, 
    metodoPago: string,
    qrUrl?: string,
    latitud?: number,
    longitud?: number
  ): Promise<Pago> {
    console.log(`🔄 Confirmando pago para pedido ${pedidoId}`);
    
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException(`Pedido ${pedidoId} no encontrado`);

    // Buscar pago pendiente
    let pago = await this.pagoRepo.findOne({
      where: { 
        pedido: { id: pedidoId },
        estado: 'pendiente'
      }
    });

    if (!pago) {
      // Si no existe pago pendiente, crear uno nuevo (caso del webhook)
      pago = this.pagoRepo.create({
        pedido,
        metodo: metodoPago as any,
        monto: pedido.total,
        qrUrl,
        estado: 'completado',
      });
    } else {
      // Actualizar pago existente
      pago.estado = 'completado';
      if (qrUrl) pago.qrUrl = qrUrl;
    }

    const pagoConfirmado = await this.pagoRepo.save(pago);
    console.log(`✅ Pago confirmado para pedido ${pedidoId}`);

    // 🔧 NUEVO: Marcar como entregado automáticamente
    await this.marcarPedidoComoEntregado(pedido, metodoPago, latitud, longitud);

    return pagoConfirmado;
  }

  /**
   * Obtener todos los pagos
   */
  async findAll(): Promise<Pago[]> {
    return this.pagoRepo.find({ 
      relations: ['pedido'],
      order: { id: 'DESC' } 
    });
  }

  /**
   * Obtener un pago por ID
   */
  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagoRepo.findOne({ 
      where: { id },
      relations: ['pedido']
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    return pago;
  }

  /**
   * Obtener pagos por pedido
   */
  async findByPedido(pedidoId: number): Promise<Pago[]> {
    return this.pagoRepo.find({
      where: { pedido: { id: pedidoId } },
      relations: ['pedido'],
      order: { fecha: 'DESC' },
    });
  }

  /**
   * 🔧 NUEVO: Verificar si un pedido está pagado
   */
  async isPedidoPagado(pedidoId: number): Promise<boolean> {
    const pagosCompletados = await this.pagoRepo.count({
      where: { 
        pedido: { id: pedidoId },
        estado: 'completado'
      }
    });
    
    return pagosCompletados > 0;
  }

  /**
   * 🔧 NUEVO: Obtener estadísticas de pagos
   */
  async getEstadisticasPagos(): Promise<{
    totalPagos: number;
    pagosCompletados: number;
    pagosPendientes: number;
    montoTotal: number;
  }> {
    const totalPagos = await this.pagoRepo.count();
    const pagosCompletados = await this.pagoRepo.count({ where: { estado: 'completado' } });
    const pagosPendientes = await this.pagoRepo.count({ where: { estado: 'pendiente' } });
    
    const result = await this.pagoRepo
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.estado = :estado', { estado: 'completado' })
      .getRawOne();
    
    const montoTotal = parseFloat(result?.total || '0');

    return {
      totalPagos,
      pagosCompletados,
      pagosPendientes,
      montoTotal,
    };
  }
}