import { IsDateString, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreatePedidoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  cliente: string;

  @IsDateString()
  fecha: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  estado: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  producto: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  precio_unitario: number;
}