import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalidaDto } from './dto/create-salida.dto';

@Injectable()
export class SalidasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSalidaDto) {
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
      const prod = mapa.get(linea.productoId)!;
      if (Number(linea.cantidad) > Number(prod.stockActual)) {
        throw new BadRequestException(
          `Stock insuficiente de ${prod.nombre}: disponible ${prod.stockActual}, solicitado ${linea.cantidad}`,
        );
      }
    }

    if (dto.platoId) {
      const plato = await this.prisma.plato.findUnique({
        where: { id: dto.platoId },
      });
      if (!plato) throw new BadRequestException('Plato no encontrado');
    }

    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const salida = await tx.salida.create({
        data: {
          fecha,
          motivo: dto.motivo ?? 'ELABORACION',
          motivoTexto: dto.motivoTexto,
          plato: dto.platoId
            ? { connect: { id: dto.platoId } }
            : undefined,
        },
      });

      for (const linea of dto.lineas) {
        const prod = mapa.get(linea.productoId)!;
        const nuevoStock =
          Number(prod.stockActual) - Number(linea.cantidad);

        await tx.detalleSalida.create({
          data: {
            salidaId: salida.id,
            productoId: linea.productoId,
            cantidad: linea.cantidad,
          },
        });

        await tx.producto.update({
          where: { id: linea.productoId },
          data: { stockActual: nuevoStock },
        });

        await tx.movimiento.create({
          data: {
            productoId: linea.productoId,
            fecha,
            tipo: 'SALIDA',
            cantidad: Number(linea.cantidad),
            stockResultante: nuevoStock,
            referencia: salida.id,
            motivo: dto.motivo ?? 'ELABORACION',
          },
        });
      }

      return tx.salida.findUnique({
        where: { id: salida.id },
        include: {
          plato: true,
          detalles: { include: { producto: true } },
        },
      });
    });
  }

  async findAll(f?: {
    desde?: string;
    hasta?: string;
    platoId?: string;
  }) {
    const where: Prisma.SalidaWhereInput = {};
    if (f?.platoId) where.platoId = f.platoId;
    if (f?.desde || f?.hasta) {
      where.fecha = {};
      if (f.desde) where.fecha.gte = new Date(f.desde);
      if (f.hasta) where.fecha.lte = new Date(f.hasta);
    }
    return this.prisma.salida.findMany({
      where,
      include: {
        plato: true,
        detalles: { include: { producto: true } },
      },
      orderBy: { fecha: 'desc' },
      take: 200,
    });
  }

  async findOne(id: string) {
    const salida = await this.prisma.salida.findUnique({
      where: { id },
      include: {
        plato: true,
        detalles: { include: { producto: true } },
      },
    });
    if (!salida) throw new NotFoundException(`Salida ${id} no encontrada`);
    return salida;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const detalles = await tx.detalleSalida.findMany({
        where: { salidaId: id },
      });
      for (const d of detalles) {
        const prod = await tx.producto.findUnique({
          where: { id: d.productoId },
          select: { stockActual: true },
        });
        const nuevoStock = Number(prod?.stockActual ?? 0) + Number(d.cantidad);
        await tx.producto.update({
          where: { id: d.productoId },
          data: { stockActual: nuevoStock },
        });
        await tx.movimiento.deleteMany({
          where: { referencia: id, tipo: 'SALIDA' },
        });
      }
      return tx.salida.delete({ where: { id } });
    });
  }
}