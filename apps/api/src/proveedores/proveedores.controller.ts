import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Controller('proveedores')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Post()
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  create(@Body() dto: CreateProveedorDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('q') q?: string) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProveedorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}