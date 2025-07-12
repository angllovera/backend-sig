// src/stripe/stripe.controller.ts
import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req, signature);
  }
}
