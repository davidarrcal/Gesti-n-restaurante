import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(diasProximo = 7) {
    const [stockBajo, proximosCaducar, caducados] = await Promise.all([
      this.prisma.producto.findMany({
        where: { stockActual: { lte: this.prisma.producto.fields.stockMinimo } },
        include: { proveedor: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.producto.findMany({
        where: {
          fechaCaducidad: {
            gte: new Date(),
            lte: this.fechaFutura(diasProximo),
          },
        },
        include: { proveedor: true },
        orderBy: { fechaCaducidad: 'asc' },
      }),
      this.prisma.producto.findMany({
        where: { fechaCaducidad: { lt: new Date() } },
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

  async metricas() {
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
    valorInventario,
    ultimosMovimientos,
    alerta,
  ] = await Promise.all([
    this.prisma.producto.count(),
    this.prisma.proveedor.count(),
    this.prisma.plato.count(),
    this.prisma.entrada.count({ where: { fecha: { gte: hoy, lt: manana } } }),
    this.prisma.salida.count({ where: { fecha: { gte: hoy, lt: manana } } }),
    this.prisma.producto.aggregate({
      _sum: { stockActual: true, precioUnitario: true },
    }),
    this.prisma.movimiento.findMany({
      take: 8,
      orderBy: { fecha: 'desc' },
      include: { producto: { select: { nombre: true, unidad: true, precioUnitario: true } } },
    }),
    this.findAll(7),
  ]);

  // valor inventario: sum(stock * precio_unitario)
  // stock está en la unidad del producto (kg, L, g, mL, uds)
  // precio está por unidad de medida del producto
  let valorInventarioTotal = 0;
  const prods = await this.prisma.producto.findMany({
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