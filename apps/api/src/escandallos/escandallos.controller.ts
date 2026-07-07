import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';
import { EscandallosService } from './escandallos.service';
import { CreatePlatoDto } from './dto/create-plato.dto';
import { UpdatePlatoDto } from './dto/update-plato.dto';
import { LineaEscandalloDto } from './dto/create-plato.dto';

@Controller('platos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EscandallosController {
  constructor(private readonly service: EscandallosService) {}

  @Post()
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  create(@Body() dto: CreatePlatoDto, @Request() req: any) {
    return this.service.create(dto, req.user.restauranteId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.restauranteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.restauranteId);
  }

  @Patch(':id')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlatoDto,
    @Request() req: any,
  ) {
    return this.service.update(id, dto, req.user.restauranteId);
  }

  @Patch(':id/lineas')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  updateLineas(
    @Param('id') id: string,
    @Body() body: { lineas: LineaEscandalloDto[] },
    @Request() req: any,
  ) {
    return this.service.updateLineas(id, body.lineas ?? [], req.user.restauranteId);
  }

  @Post(':id/duplicar')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  duplicate(@Param('id') id: string, @Request() req: any) {
    return this.service.duplicate(id, req.user.restauranteId);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.restauranteId);
  }
}