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

  // Función para generar QR con Stripe
  async generarPagoQR(pedidoId: number): Promise<{ qrUrl: string; qrImage: string }> {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const descripcion = pedido.producto;
    const monto = pedido.total;

    const { url, qrImage } = await this.stripeService.crearCheckout(pedidoId, descripcion, monto);

    return { qrUrl: url ?? '', qrImage };
  }

  async create(dto: CreatePagoDto): Promise<Pago | { url: string; qrImage: string }> {
    const pedido = await this.pedidoRepo.findOne({ where: { id: dto.pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const metodoStripe = ['qr', 'stripe'];
    const monto = typeof dto.monto === 'number' && dto.monto > 0 ? dto.monto : pedido.total;

    if (metodoStripe.includes(dto.metodo)) {
      const { url, qrImage } = await this.stripeService.crearCheckout(pedido.id, pedido.producto, monto);

      const pago = this.pagoRepo.create({
        metodo: dto.metodo,
        monto,
        pedido,
        qrUrl: url,
        estado: 'pendiente',
      });

      await this.pagoRepo.save(pago);

    return { url: url!, qrImage };

    }

    // Métodos locales
    const pago = this.pagoRepo.create({
      metodo: dto.metodo,
      monto,
      pedido,
      estado: 'completado',
    });

    return this.pagoRepo.save(pago);
  }



  async findAll(): Promise<Pago[]> {
    return this.pagoRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagoRepo.findOne({ where: { id } });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    return pago;
  }

  async findByPedido(pedidoId: number): Promise<Pago[]> {
    return this.pagoRepo.find({
      where: { pedido: { id: pedidoId } },
      order: { fecha: 'DESC' },
    });
  }
}
