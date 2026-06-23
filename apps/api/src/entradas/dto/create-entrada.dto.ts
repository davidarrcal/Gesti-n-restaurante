import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineaEntradaDto {
  @IsUUID()
  productoId: string;

  @IsNumber()
  @Min(0.001)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioCompra: number; // por unidad de medida
}

export class CreateEntradaDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  numeroFactura?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => LineaEntradaDto)
  lineas: LineaEntradaDto[];
}