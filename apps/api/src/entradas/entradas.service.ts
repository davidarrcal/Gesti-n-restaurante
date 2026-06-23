import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntradaDto } from './dto/create-entrada.dto';

@Injectable()
export class EntradasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEntradaDto) {
    // Validar que los productos existen y recopilar info
    const productoIds = dto.lineas.map((l) => l.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, stockActual: true, nombre: true },
    });
    const mapa = new Map(productos.map((p) => [p.id, p]));
    for (const linea of dto.lineas) {
      if (!mapa.has(linea.productoId)) {
        throw new BadRequestException(
          `Producto ${linea.productoId} no existe`,
        );
      }
    }

    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const entrada = await tx.entrada.create({
        data: {
          fecha,
          numeroFactura: dto.numeroFactura,
          proveedor: dto.proveedorId
            ? { connect: { id: dto.proveedorId } }
            : undefined,
        },
      });

      for (const linea of dto.lineas) {
        const prod = mapa.get(linea.productoId)!;
        const stockPrevio = Number(prod.stockActual);
        const nuevoStock = stockPrevio + Number(linea.cantidad);

        await tx.detalleEntrada.create({
          data: {
            entradaId: entrada.id,
            productoId: linea.productoId,
            cantidad: linea.cantidad,
            precioCompra: linea.precioCompra,
          },
        });

        await tx.producto.update({
          where: { id: linea.productoId },
          data: {
            stockActual: nuevoStock,
            // Actualiza el precio de referencia del producto
            precioUnitario: Number(linea.precioCompra),
          },
        });

        await tx.movimiento.create({
          data: {
            productoId: linea.productoId,
            fecha,
            tipo: 'ENTRADA',
            cantidad: Number(linea.cantidad),
            stockResultante: nuevoStock,
            referencia: entrada.id,
          },
        });
      }

      return tx.entrada.findUnique({
        where: { id: entrada.id },
        include: {
          proveedor: true,
          detalles: { include: { producto: true } },
        },
      });
    });
  }

  async findAll(f?: { desde?: string; hasta?: string; proveedorId?: string }) {
    const where: Prisma.EntradaWhereInput = {};
    if (f?.proveedorId) where.proveedorId = f.proveedorId;
    if (f?.desde || f?.hasta) {
      where.fecha = {};
      if (f.desde) where.fecha.gte = new Date(f.desde);
      if (f.hasta) where.fecha.lte = new Date(f.hasta);
    }
    return this.prisma.entrada.findMany({
      where,
      include: {
        proveedor: true,
        detalles: { include: { producto: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 200,
    });
  }

  async findOne(id: string) {
    const entrada = await this.prisma.entrada.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detalles: { include: { producto: true } },
      },
    });
    if (!entrada) throw new NotFoundException(`Entrada ${id} no encontrada`);
    return entrada;
  }

  async remove(id: string) {
    // Revertir stock y eliminar movimientos asociados
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const detalles = await tx.detalleEntrada.findMany({
        where: { entradaId: id },
      });
      for (const d of detalles) {
        const prod = await tx.producto.findUnique({
          where: { id: d.productoId },
          select: { stockActual: true },
        });
        const nuevoStock = Number(prod?.stockActual ?? 0) - Number(d.cantidad);
        await tx.producto.update({
          where: { id: d.productoId },
          data: { stockActual: Math.max(0, nuevoStock) },
        });
        await tx.movimiento.deleteMany({
          where: { referencia: id, tipo: 'ENTRADA' },
        });
      }
      return tx.entrada.delete({ where: { id } });
    });
  }
}