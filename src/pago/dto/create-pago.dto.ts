import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePagoDto {
  @IsNumber()
  pedidoId: number;

  @IsIn(['efectivo', 'transferencia', 'qr', 'stripe'])
  metodo: 'efectivo' | 'transferencia' | 'qr' | 'stripe';

  @IsNumber()
  monto: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @IsNumber()
  longitud?: number;
}
