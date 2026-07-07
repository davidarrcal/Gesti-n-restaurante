import { Injectable, ForbiddenException } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { ProductosService } from '../productos/productos.service';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { EntradasService } from '../entradas/entradas.service';
import { SalidasService } from '../salidas/salidas.service';
import { EscandallosService } from '../escandallos/escandallos.service';
import { AlertasService } from '../alertas/alertas.service';
import { InformesService } from '../informes/informes.service';

@Injectable()
export class ToolExecutorService {
  constructor(
    private productos: ProductosService,
    private proveedores: ProveedoresService,
    private entradas: EntradasService,
    private salidas: SalidasService,
    private escandallos: EscandallosService,
    private alertas: AlertasService,
    private informes: InformesService,
  ) {}

  async execute(
    name: string,
    args: Record<string, any>,
    user: { id: string; rol: RolUsuario; restauranteId: string },
  ): Promise<any> {
    const rid = user.restauranteId;
    switch (name) {
      case 'listar_productos':
        return this.productos.findAll({ q: args.q, categoria: args.categoria }, rid);

      case 'obtener_producto':
        return this.productos.findOne(args.id, rid);

      case 'crear_producto':
        this.requireRole(user.rol, [RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN]);
        return this.productos.create({
          nombre: args.nombre,
          categoria: args.categoria,
          unidad: args.unidad,
          pesoUnitario: args.pesoUnitario,
          precioUnitario: args.precioUnitario,
          stockMinimo: args.stockMinimo,
          fechaCaducidad: args.fechaCaducidad,
          proveedorId: args.proveedorId,
        }, rid);

      case 'actualizar_producto':
        this.requireRole(user.rol, [RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN]);
        return this.productos.update(args.id, {
          nombre: args.nombre,
          categoria: args.categoria,
          precioUnitario: args.precioUnitario,
          stockMinimo: args.stockMinimo,
          fechaCaducidad: args.fechaCaducidad,
          proveedorId: args.proveedorId,
        }, rid);

      case 'listar_proveedores':
        return this.proveedores.findAll(args.q, rid);

      case 'registrar_entrada':
        this.requireRole(user.rol, [RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN]);
        return this.entradas.create({
          proveedorId: args.proveedorId,
          numeroFactura: args.numeroFactura,
          lineas: args.lineas,
        }, rid);

      case 'registrar_salida':
        this.requireRole(user.rol, [RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN]);
        return this.salidas.create({
          motivo: args.motivo,
          motivoTexto: args.motivoTexto,
          platoId: args.platoId,
          lineas: args.lineas,
        }, rid);

      case 'listar_entradas':
        return this.entradas.findAll({ desde: args.desde, hasta: args.hasta, proveedorId: args.proveedorId }, rid);

      case 'listar_salidas':
        return this.salidas.findAll({ desde: args.desde, hasta: args.hasta, platoId: args.platoId }, rid);

      case 'listar_platos':
        return this.escandallos.findAll(rid);

      case 'obtener_plato':
        return this.escandallos.findOne(args.id, rid);

      case 'crear_plato':
        this.requireRole(user.rol, [RolUsuario.COCINERO, RolUsuario.GERENTE, RolUsuario.ADMIN]);
        return this.escandallos.create({
          nombre: args.nombre,
          descripcion: args.descripcion,
          numRaciones: args.numRaciones,
          precioVenta: args.precioVenta,
          lineas: args.lineas,
        }, rid);

      case 'obtener_alertas':
        return this.alertas.findAll(rid, args.diasProximo ?? 7);

      case 'obtener_metricas':
        return this.alertas.metricas(rid);

      case 'generar_informe':
        this.requireRole(user.rol, [RolUsuario.GERENTE, RolUsuario.ADMIN]);
        if (args.tipo === 'movimientos') {
          return this.informes.movimientos(args.productoId, rid, args.desde, args.hasta);
        }
        if (args.tipo === 'escandallos') return this.informes.escandallos(rid);
        return this.informes.caducidades(rid, args.desde, args.hasta);

      default:
        return { error: `Herramienta desconocida: ${name}` };
    }
  }

  private requireRole(rol: RolUsuario, allowed: RolUsuario[]) {
    if (!allowed.includes(rol)) {
      throw new ForbiddenException(
        `Tu rol (${rol}) no tiene permisos para esta acción`,
      );
    }
  }
}