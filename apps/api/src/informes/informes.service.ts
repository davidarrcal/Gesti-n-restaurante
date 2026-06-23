import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TipoInforme = 'movimientos' | 'escandallos' | 'caducidades';

@Injectable()
export class InformesService {
  constructor(private readonly prisma: PrismaService) {}

  async movimientos(productoId: string, desde?: string, hasta?: string) {
    const where: any = { productoId };
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) where.fecha.lte = new Date(hasta);
    }
    const [movs, producto] = await Promise.all([
      this.prisma.movimiento.findMany({
        where,
        orderBy: { fecha: 'desc' },
        take: 1000,
      }),
      this.prisma.producto.findUnique({
        where: { id: productoId },
        select: { nombre: true, unidad: true, precioUnitario: true },
      }),
    ]);

    const entradas = movs.filter((m) => m.tipo === 'ENTRADA');
    const salidas = movs.filter((m) => m.tipo === 'SALIDA');
    const totalEntradas = entradas.reduce(
      (a, m) => a + Number(m.cantidad),
      0,
    );
    const totalSalidas = salidas.reduce((a, m) => a + Number(m.cantidad), 0);
    const stockResultante =
      movs.length > 0 ? Number(movs[0].stockResultante) : 0;

    return {
      tipo: 'movimientos' as TipoInforme,
      producto: {
        id: productoId,
        nombre: producto?.nombre ?? '—',
        unidad: producto?.unidad,
        precioUnitario: Number(producto?.precioUnitario ?? 0),
      },
      filas: movs.map((m) => ({
        fecha: m.fecha,
        tipo: m.tipo,
        cantidad: Number(m.cantidad),
        stockResultante: Number(m.stockResultante),
        motivo: m.motivo,
        referencia: m.referencia,
      })),
      resumen: {
        totalEntradas,
        totalSalidas,
        balance: totalEntradas - totalSalidas,
        stockResultante,
        numMovimientos: movs.length,
      },
    };
  }

  async escandallos() {
    const platos = await this.prisma.plato.findMany({
      include: {
        detalles: {
          include: {
            producto: {
              select: { id: true, nombre: true, unidad: true, precioUnitario: true },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const filas = platos.map((plato) => {
      const costePorRacion = plato.detalles.reduce((acc, d) => {
        const cantidad = Number(d.cantidad);
        const bruta =
          Number(d.mermaPorcentaje) > 0
            ? cantidad / (1 - Number(d.mermaPorcentaje) / 100)
            : cantidad;
        const precio = Number(d.producto.precioUnitario);
        const enUnidad =
          d.producto.unidad === 'KG' || d.producto.unidad === 'L'
            ? bruta / 1000
            : bruta;
        return acc + enUnidad * precio;
      }, 0);
      const precioVenta = Number(plato.precioVenta);
      const margen = precioVenta - costePorRacion;
      const margenPct = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;
      const foodCost = precioVenta > 0 ? (costePorRacion / precioVenta) * 100 : 0;
      const costeTotal = costePorRacion * plato.numRaciones;

      return {
        id: plato.id,
        nombre: plato.nombre,
        numRaciones: plato.numRaciones,
        numIngredientes: plato.detalles.length,
        precioVenta,
        costePorRacion,
        costeTotalPlato: costeTotal,
        margenBruto: margen,
        margenPorcentual: margenPct,
        foodCost,
      };
    });

    const totalCoste = filas.reduce((a, f) => a + f.costePorRacion, 0);
    const totalVentas = filas.reduce((a, f) => a + f.precioVenta, 0);
    const margenMedio =
      filas.length > 0
        ? filas.reduce((a, f) => a + f.margenPorcentual, 0) / filas.length
        : 0;

    return {
      tipo: 'escandallos' as TipoInforme,
      filas,
      resumen: {
        numPlatos: filas.length,
        costeMedioRacion: filas.length > 0 ? totalCoste / filas.length : 0,
        margenMedioPorcentual: margenMedio,
      },
    };
  }

  async caducidades(desde?: string, hasta?: string) {
    const where: any = { fechaCaducidad: { not: null } };
    if (desde || hasta) {
      where.fechaCaducidad = {};
      if (desde) where.fechaCaducidad.gte = new Date(desde);
      if (hasta) where.fechaCaducidad.lte = new Date(hasta);
    }
    const productos = await this.prisma.producto.findMany({
      where,
      include: { proveedor: { select: { nombre: true } } },
      orderBy: { fechaCaducidad: 'asc' },
    });

    const ahora = new Date();
    const filas = productos.map((p) => {
      const fecha = p.fechaCaducidad!;
      const dias = Math.ceil((fecha.getTime() - ahora.getTime()) / 86400000);
      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        stockActual: Number(p.stockActual),
        unidad: p.unidad,
        fechaCaducidad: fecha,
        diasRestantes: dias,
        estado: dias < 0 ? 'CADUCADO' : dias <= 7 ? 'PROXIMO' : 'OK',
        proveedor: p.proveedor?.nombre ?? null,
      };
    });

    const caducados = filas.filter((f) => f.estado === 'CADUCADO').length;
    const proximos = filas.filter((f) => f.estado === 'PROXIMO').length;

    return {
      tipo: 'caducidades' as TipoInforme,
      filas,
      resumen: {
        totalProductos: filas.length,
        caducados,
        proximos,
        ok: filas.length - caducados - proximos,
      },
    };
  }
}