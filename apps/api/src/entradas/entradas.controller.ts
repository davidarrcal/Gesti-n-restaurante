import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';
import { EntradasService } from './entradas.service';
import { CreateEntradaDto } from './dto/create-entrada.dto';

@Controller('entradas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EntradasController {
  constructor(private readonly service: EntradasService) {}

  @Post()
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  create(@Body() dto: CreateEntradaDto, @Request() req: any) {
    return this.service.create(dto, req.user.restauranteId);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.service.findAll({ desde, hasta, proveedorId }, req.user.restauranteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.restauranteId);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.restauranteId);
  }
}