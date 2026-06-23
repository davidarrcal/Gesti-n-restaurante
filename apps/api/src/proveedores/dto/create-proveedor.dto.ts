import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;
}