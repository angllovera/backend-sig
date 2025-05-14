import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { StripeService } from '../stripe/stripe.service';
@Injectable()
export class PagoService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    private readonly stripeService: StripeService,
  ) {}

  async create(dto: CreatePagoDto) {
    let clientSecret: string | null = null;

    // Genera un PaymentIntent si el tipo de pago es "qr"
    if (dto.tipo === 'qr') {
      const stripeData = await this.stripeService.crearPago(dto.monto);
      clientSecret = stripeData.clientSecret;
    }

    const pago = this.pagoRepo.create({
      ...dto,
      estado: 'pendiente',
    });

    const saved = await this.pagoRepo.save(pago);

    // Devolvemos el pago con el clientSecret si aplica
    return {
      ...saved,
      clientSecret,
    };
  }

  findAll() {
    return this.pagoRepo.find();
  }

  findOne(id: number) {
    return this.pagoRepo.findOneBy({ id });
  }

  async update(id: number, dto: UpdatePagoDto) {
    await this.pagoRepo.update(id, dto);
    return this.findOne(id);
  }
}
