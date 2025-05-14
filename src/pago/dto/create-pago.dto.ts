export class CreatePagoDto {
  tipo: 'qr' | 'transferencia' | 'efectivo';
  monto: number;
  compraId: number;
}
