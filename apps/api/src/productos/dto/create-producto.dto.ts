import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { UnidadMedida } from '@prisma/client';

export class CreateProductoDto {
  @IsString()
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoria?: string;

  @IsEnum(UnidadMedida)
  unidad: UnidadMedida;

  @IsNumber()
  @Min(0)
  pesoUnitario: number; // gramos o ml por unidad

  @IsNumber()
  @Min(0)
  precioUnitario: number; // por unidad de medida

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimo?: number;

  @IsOptional()
  @IsDateString()
  fechaCaducidad?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;
}