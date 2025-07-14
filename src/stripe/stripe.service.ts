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
    console.log(`🔄 Creando sesión de Stripe para pedido ${pedidoId}`);
    console.log(`💰 Descripción: ${descripcion}, Monto: Bs ${montoBs}`);
    
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'BOB', // Bolivianos
              product_data: { 
                name: descripcion || `Pedido #${pedidoId}`,
                description: `Pago por pedido #${pedidoId}`,
              },
              unit_amount: Math.round(montoBs * 100), // Convertir Bs a centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        metadata: {
          pedidoId: pedidoId.toString(),
          monto: montoBs.toString(),
        },
        success_url: `${process.env.SUCCESS_URL}?pedidoId=${pedidoId}&status=success`,
        cancel_url: `${process.env.CANCEL_URL}?pedidoId=${pedidoId}&status=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Expira en 1 hora
      });

      console.log(`✅ Sesión de Stripe creada: ${session.id}`);
      console.log(`🔗 URL de pago: ${session.url}`);

      // Generar QR de la URL de pago
      const qrImage = await QRCode.toDataURL(session.url!, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      });

      console.log(`📱 QR generado exitosamente`);

      return {
        url: session.url,
        qrImage,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('❌ Error creando sesión de Stripe:', error);
      throw new BadRequestException(`Error creando sesión de pago: ${error.message}`);
    }
  }

  /**
   * 🔧 MEJORADO: Procesa el webhook enviado por Stripe cuando se completa el pago.
   */
  async handleWebhook(request: Request, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const rawBody = request['rawBody'];

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      console.log(`📨 Webhook recibido: ${event.type}`);
    } catch (err: any) {
      console.error('❌ Error verificando webhook:', err.message);
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }

    // Procesar evento de pago completado
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const pedidoId = Number(session.metadata?.pedidoId);
      const montoMetadata = Number(session.metadata?.monto);

      console.log(`💳 Pago completado para pedido ${pedidoId}`);
      console.log(`💰 Monto: Bs ${montoMetadata}`);

      if (!pedidoId) {
        console.error('❌ pedidoId no encontrado en metadata del webhook');
        throw new BadRequestException('pedidoId no encontrado en metadata');
      }

      const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
      if (!pedido) {
        console.error(`❌ Pedido ${pedidoId} no encontrado`);
        throw new NotFoundException(`Pedido ${pedidoId} no encontrado`);
      }

      // 🔧 MEJORADO: Usar el método del PagoService para confirmar y marcar como entregado
      // Necesitaremos inyectar PagoService aquí o crear el registro directamente
      
      // Verificar si ya existe un pago para este pedido
      const pagoExistente = await this.pagoRepo.findOne({
        where: { 
          pedido: { id: pedidoId },
          estado: 'pendiente'
        }
      });

      if (pagoExistente) {
        // Actualizar pago existente
        pagoExistente.estado = 'completado';
        pagoExistente.qrUrl = session.url ?? '';
        await this.pagoRepo.save(pagoExistente);
        console.log(`✅ Pago existente ${pagoExistente.id} actualizado a completado`);
      } else {
        // Crear nuevo pago si no existe
        const nuevoPago = this.pagoRepo.create({
          pedido,
          metodo: 'qr', // Asumimos que es QR si viene de webhook
          monto: montoMetadata || pedido.total,
          qrUrl: session.url ?? '',
          estado: 'completado',
        });
        await this.pagoRepo.save(nuevoPago);
        console.log(`✅ Nuevo pago creado y marcado como completado`);
      }

      // 🔧 NUEVO: Marcar pedido como entregado automáticamente
      pedido.estado = 'entregado';
      pedido.entregado = true;
      pedido.observacion = `Entregado automáticamente tras pago confirmado por Stripe (${session.id})`;
      await this.pedidoRepo.save(pedido);

      console.log(`✅ Pedido ${pedidoId} marcado como entregado tras confirmación de Stripe`);
    }

    // Procesar otros eventos si es necesario
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const pedidoId = Number(session.metadata?.pedidoId);
      
      console.log(`⏰ Sesión de pago expirada para pedido ${pedidoId}`);
      
      // Marcar pago como rechazado si existe
      const pagoExpirado = await this.pagoRepo.findOne({
        where: { 
          pedido: { id: pedidoId },
          estado: 'pendiente'
        }
      });

      if (pagoExpirado) {
        pagoExpirado.estado = 'rechazado';
        await this.pagoRepo.save(pagoExpirado);
        console.log(`❌ Pago ${pagoExpirado.id} marcado como rechazado por expiración`);
      }
    }

    return { received: true };
  }

  /**
   * 🔧 NUEVO: Verificar estado de una sesión de pago
   */
  async verificarEstadoSesion(sessionId: string): Promise<{
    status: string;
    pedidoId?: number;
    monto?: number;
  }> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      return {
        status: session.status || 'unknown',
        pedidoId: Number(session.metadata?.pedidoId),
        monto: Number(session.metadata?.monto),
      };
    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      throw new BadRequestException(`Error verificando sesión: ${error.message}`);
    }
  }

  /**
   * 🔧 NUEVO: Cancelar una sesión de pago
   */
  async cancelarSesion(sessionId: string): Promise<boolean> {
    try {
      const session = await this.stripe.checkout.sessions.expire(sessionId);
      console.log(`🚫 Sesión ${sessionId} cancelada`);
      return session.status === 'expired';
    } catch (error) {
      console.error('❌ Error cancelando sesión:', error);
      return false;
    }
  }
}