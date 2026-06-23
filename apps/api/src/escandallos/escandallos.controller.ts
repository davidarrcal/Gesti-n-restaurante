import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
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
  create(@Body() dto: CreatePlatoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePlatoDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/lineas')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  updateLineas(
    @Param('id') id: string,
    @Body() body: { lineas: LineaEscandalloDto[] },
  ) {
    return this.service.updateLineas(id, body.lineas ?? []);
  }

  @Post(':id/duplicar')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  duplicate(@Param('id') id: string) {
    return this.service.duplicate(id);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}