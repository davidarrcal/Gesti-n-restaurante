import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { UnidadMedida } from '@prisma/client';

export enum FiltroCaducidad {
  TODOS = 'TODOS',
  CADUCADOS = 'CADUCADOS',
  PROXIMOS = 'PROXIMOS',
}

export class FiltroProductoDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsOptional()
  @IsEnum(UnidadMedida)
  unidad?: UnidadMedida;

  @IsOptional()
  @IsEnum(FiltroCaducidad)
  caducidad?: FiltroCaducidad;
}