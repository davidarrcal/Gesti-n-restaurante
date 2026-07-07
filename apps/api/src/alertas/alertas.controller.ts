import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertasService } from './alertas.service';

@Controller('alertas')
@UseGuards(AuthGuard('jwt'))
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get()
  findAll(@Request() req: any, @Query('diasProximo') diasProximo?: string) {
    return this.service.findAll(
      req.user.restauranteId,
      diasProximo ? Number(diasProximo) : 7,
    );
  }

  @Get('metricas')
  metricas(@Request() req: any) {
    return this.service.metricas(req.user.restauranteId);
  }
}