import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
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
  create(@Body() dto: CreateSalidaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('platoId') platoId?: string,
  ) {
    return this.service.findAll({ desde, hasta, platoId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}