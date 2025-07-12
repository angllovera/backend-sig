// src/stripe/stripe.service.ts
import Stripe from 'stripe';
import * as QRCode from 'qrcode';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from '../pedido/entities/pedido.entity';
import { Pago } from '../pago/entities/pago.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2022-11-15',
    });
  }

  /**
   * Genera una sesión de checkout en Stripe y retorna el URL y QR del pago.
   */
  async crearCheckout(pedidoId: number, descripcion: string, montoBs: number) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'BOB',
            product_data: { name: descripcion },
            unit_amount: montoBs * 100, // Convertir Bs a centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        pedidoId: pedidoId.toString(),
      },
      success_url: `${process.env.SUCCESS_URL}/pago-exito?pedidoId=${pedidoId}`,
      cancel_url: `${process.env.CANCEL_URL}/pago-cancelado?pedidoId=${pedidoId}`,
    });

    const qrImage = await QRCode.toDataURL(session.url!); // Genera la imagen QR

    return {
      url: session.url,
      qrImage,
    };
  }

  /**
   * Procesa el webhook enviado por Stripe cuando se completa el pago.
   */
  async handleWebhook(request: Request, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const rawBody = request['rawBody'];

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const pedidoId = Number(session.metadata?.pedidoId);

      if (!pedidoId) {
        throw new BadRequestException('pedidoId no encontrado en metadata');
      }

      const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
      if (!pedido) throw new NotFoundException(`Pedido ${pedidoId} no encontrado`);

      // Crear el pago confirmado
      const nuevoPago = this.pagoRepo.create({
        pedido,
        metodo: 'qr',
        monto: pedido.total,
        qrUrl: session.url ?? '',
      });
      await this.pagoRepo.save(nuevoPago);

      // Actualizar pedido
      pedido.estado = 'pagado';
      pedido.entregado = true;
      pedido.observacion = 'Pago confirmado por Stripe';
      await this.pedidoRepo.save(pedido);

      console.log(`✅ Pedido ${pedidoId} actualizado tras pago Stripe.`);
    }

    return { received: true };
  }
}
