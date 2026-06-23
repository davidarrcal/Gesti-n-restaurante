import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AlertasService } from './alertas.service';

@Controller('alertas')
@UseGuards(AuthGuard('jwt'))
export class AlertasController {
  constructor(private readonly service: AlertasService) {}

  @Get()
  findAll(@Query('diasProximo') diasProximo?: string) {
    return this.service.findAll(
      diasProximo ? Number(diasProximo) : 7,
    );
  }

  @Get('metricas')
  metricas() {
    return this.service.metricas();
  }
}