import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateEntregaDto {
  @IsInt()
  @IsNotEmpty()
  pedidoId: number;

  @IsString()
  @IsNotEmpty()
  ubicacion: string;

  @IsString()
  @IsNotEmpty()
  estado: string;

  @IsDateString()
  @IsOptional()
  hora?: Date;

  @IsDateString()
  @IsOptional()
  horaEntrega?: Date;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
