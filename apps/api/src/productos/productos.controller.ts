import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltroProductoDto } from './dto/filtro-producto.dto';

@Controller('productos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Post()
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  create(@Body() dto: CreateProductoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() f: FiltroProductoDto) {
    return this.service.findAll(f);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/historial')
  historial(
    @Param('id') id: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.historial(id, desde, hasta);
  }

  @Patch(':id')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}