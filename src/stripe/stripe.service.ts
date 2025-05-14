import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe('sk_test_51ROVXK4IgZQzA85xXL35jSKmBhVfx8R5eZasEHB7Q4EzhMBAiGvYX3KJMn4xeC2UjBrTmPi62q0D1zlaTUUe3nHQ00pk9RJxkj', {
    });
  }

  async crearPago(monto: number, moneda: string = 'usd') {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: monto * 100, 
      currency: moneda,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  }
}
