import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ProductosModule } from './productos/productos.module';
import { EntradasModule } from './entradas/entradas.module';
import { SalidasModule } from './salidas/salidas.module';
import { EscandallosModule } from './escandallos/escandallos.module';
import { AlertasModule } from './alertas/alertas.module';
import { InformesModule } from './informes/informes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    PrismaModule,
    HealthModule,
    ProveedoresModule,
    ProductosModule,
    EntradasModule,
    SalidasModule,
    EscandallosModule,
    AlertasModule,
    InformesModule,
    AuthModule,
  ],
})
export class AppModule {}