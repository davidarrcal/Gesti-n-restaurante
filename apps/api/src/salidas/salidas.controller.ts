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
import { SalidasService } from './salidas.service';
import { CreateSalidaDto } from './dto/create-salida.dto';

@Controller('salidas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SalidasController {
  constructor(private readonly service: SalidasService) {}

  @Post()
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  create(@Body() dto: CreateSalidaDto, @Request() req: any) {
    return this.service.create(dto, req.user.restauranteId);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('platoId') platoId?: string,
  ) {
    return this.service.findAll({ desde, hasta, platoId }, req.user.restauranteId);
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