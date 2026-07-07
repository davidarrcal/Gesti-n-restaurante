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
  Request,
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
  create(@Body() dto: CreateProductoDto, @Request() req: any) {
    return this.service.create(dto, req.user.restauranteId);
  }

  @Get()
  findAll(@Query() f: FiltroProductoDto, @Request() req: any) {
    return this.service.findAll(f, req.user.restauranteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.restauranteId);
  }

  @Get(':id/historial')
  historial(
    @Param('id') id: string,
    @Request() req: any,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.historial(id, req.user.restauranteId, desde, hasta);
  }

  @Patch(':id')
  @Roles(RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductoDto,
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