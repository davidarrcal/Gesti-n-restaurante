import { Module } from '@nestjs/common';
import { ProductosModule } from '../productos/productos.module';
import { ProveedoresModule } from '../proveedores/proveedores.module';
import { EntradasModule } from '../entradas/entradas.module';
import { SalidasModule } from '../salidas/salidas.module';
import { EscandallosModule } from '../escandallos/escandallos.module';
import { AlertasModule } from '../alertas/alertas.module';
import { InformesModule } from '../informes/informes.module';
import { AsistenteController } from './asistente.controller';
import { AsistenteService } from './asistente.service';
import { ToolExecutorService } from './ia.tool-executor';

@Module({
  imports: [
    ProductosModule,
    ProveedoresModule,
    EntradasModule,
    SalidasModule,
    EscandallosModule,
    AlertasModule,
    InformesModule,
  ],
  controllers: [AsistenteController],
  providers: [AsistenteService, ToolExecutorService],
})
export class AsistenteModule {}