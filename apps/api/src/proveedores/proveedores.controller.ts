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
  Request,
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
  create(@Body() dto: CreateProveedorDto, @Request() req: any) {
    return this.service.create(dto, req.user.restauranteId);
  }

  @Get()
  findAll(@Query('q') q: string | undefined, @Request() req: any) {
    return this.service.findAll(q, req.user.restauranteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.restauranteId);
  }

  @Patch(':id')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProveedorDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.restauranteId);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.restauranteId);
  }
}