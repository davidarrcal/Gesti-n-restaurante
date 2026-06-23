import { Module } from '@nestjs/common';
import { EscandallosController } from './escandallos.controller';
import { EscandallosService } from './escandallos.service';

@Module({
  controllers: [EscandallosController],
  providers: [EscandallosService],
  exports: [EscandallosService],
})
export class EscandallosModule {}