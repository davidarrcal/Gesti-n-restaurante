import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolUsuario } from '@prisma/client';
import { InformesService, TipoInforme } from './informes.service';

@Controller('informes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InformesController {
  constructor(private readonly service: InformesService) {}

  @Get()
  @Roles(RolUsuario.GERENTE, RolUsuario.ADMIN)
  async generate(
    @Query('tipo') tipo: TipoInforme = 'movimientos',
    @Query('productoId') productoId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    switch (tipo) {
      case 'movimientos':
        if (!productoId) {
          throw new BadRequestException(
            'productoId es obligatorio para el informe de movimientos',
          );
        }
        return this.service.movimientos(productoId, desde, hasta);
      case 'escandallos':
        return this.service.escandallos();
      case 'caducidades':
        return this.service.caducidades(desde, hasta);
      default:
        throw new BadRequestException(
          `Tipo de informe no válido: ${tipo}`,
        );
    }
  }
}