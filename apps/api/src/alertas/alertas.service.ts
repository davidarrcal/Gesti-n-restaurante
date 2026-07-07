import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(restauranteId: string, diasProximo = 7) {
    const [stockBajo, proximosCaducar, caducados] = await Promise.all([
      this.prisma.producto.findMany({
        where: {
          restauranteId,
          stockActual: { lte: this.prisma.producto.fields.stockMinimo },
        },
        include: { proveedor: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.producto.findMany({
        where: {
          restauranteId,
          fechaCaducidad: {
            gte: new Date(),
            lte: this.fechaFutura(diasProximo),
          },
        },
        include: { proveedor: true },
        orderBy: { fechaCaducidad: 'asc' },
      }),
      this.prisma.producto.findMany({
        where: { restauranteId, fechaCaducidad: { lt: new Date() } },
        include: { proveedor: true },
        orderBy: { fechaCaducidad: 'asc' },
      }),
    ]);

    return {
      diasProximo,
      stockBajoMinimo: stockBajo.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        stockActual: Number(p.stockActual),
        stockMinimo: Number(p.stockMinimo),
        unidad: p.unidad,
        proveedor: p.proveedor?.nombre ?? null,
      })),
      proximosCaducar: proximosCaducar.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        fechaCaducidad: p.fechaCaducidad,
        diasRestantes: this.diasRestantes(p.fechaCaducidad!),
        proveedor: p.proveedor?.nombre ?? null,
      })),
      caducados: caducados.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        fechaCaducidad: p.fechaCaducidad,
        diasCaducado: this.diasRestantes(p.fechaCaducidad!) * -1,
        proveedor: p.proveedor?.nombre ?? null,
      })),
      resumen: {
        totalAlertas: stockBajo.length + proximosCaducar.length + caducados.length,
        stockBajo: stockBajo.length,
        proximos: proximosCaducar.length,
        caducados: caducados.length,
      },
    };
  }

  async metricas(restauranteId: string) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const [
      numProductos,
      numProveedores,
      numPlatos,
      entradasHoy,
      salidasHoy,
      ultimosMovimientos,
      alerta,
    ] = await Promise.all([
      this.prisma.producto.count({ where: { restauranteId } }),
      this.prisma.proveedor.count({ where: { restauranteId } }),
      this.prisma.plato.count({ where: { restauranteId } }),
      this.prisma.entrada.count({
        where: { restauranteId, fecha: { gte: hoy, lt: manana } },
      }),
      this.prisma.salida.count({
        where: { restauranteId, fecha: { gte: hoy, lt: manana } },
      }),
      this.prisma.movimiento.findMany({
        where: { restauranteId },
        take: 8,
        orderBy: { fecha: 'desc' },
        include: { producto: { select: { nombre: true, unidad: true, precioUnitario: true } } },
      }),
      this.findAll(restauranteId, 7),
    ]);

    let valorInventarioTotal = 0;
    const prods = await this.prisma.producto.findMany({
      where: { restauranteId },
      select: { stockActual: true, precioUnitario: true, unidad: true },
    });
    for (const p of prods) {
      valorInventarioTotal += Number(p.stockActual) * Number(p.precioUnitario);
    }

    return {
      contadores: {
        productos: numProductos,
        proveedores: numProveedores,
        platos: numPlatos,
        entradasHoy,
        salidasHoy,
      },
      valorInventario: valorInventarioTotal,
      alertas: alerta.resumen,
      ultimosMovimientos: ultimosMovimientos.map((m) => ({
        id: m.id,
        producto: m.producto?.nombre ?? '—',
        tipo: m.tipo,
        cantidad: Number(m.cantidad),
        stockResultante: Number(m.stockResultante),
        fecha: m.fecha,
        unidad: m.producto?.unidad,
      })),
    };
  }

  private fechaFutura(dias: number) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d;
  }

  private diasRestantes(fecha: Date) {
    return Math.ceil((fecha.getTime() - Date.now()) / 86400000);
  }
}