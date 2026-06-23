import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineaEscandalloDto {
  @IsUUID()
  productoId: string;

  @IsNumber()
  @Min(0)
  cantidad: number; // neta por ración en subunidad (g, mL, uds)

  @IsOptional()
  @IsNumber()
  @Min(0)
  mermaPorcentaje?: number; // %
}

export class CreatePlatoDto {
  @IsString()
  @MaxLength(160)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(1)
  numRaciones: number;

  @IsNumber()
  @Min(0)
  precioVenta: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaEscandalloDto)
  lineas: LineaEscandalloDto[];
}