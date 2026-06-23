import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MotivoSalida } from '@prisma/client';

export class LineaSalidaDto {
  @IsUUID()
  productoId: string;

  @IsNumber()
  @Min(0.001)
  cantidad: number;
}

export class CreateSalidaDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsEnum(MotivoSalida)
  motivo?: MotivoSalida;

  @IsOptional()
  @IsString()
  motivoTexto?: string;

  @IsOptional()
  @IsUUID()
  platoId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => LineaSalidaDto)
  lineas: LineaSalidaDto[];
}