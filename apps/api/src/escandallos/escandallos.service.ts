import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatoDto } from './dto/create-plato.dto';
import { UpdatePlatoDto } from './dto/update-plato.dto';
import { calcularEscandallo, EscandalloCalc } from './escandallo.calc';

@Injectable()
export class EscandallosService {
  constructor(private readonly prisma: PrismaService) {}

  private async cargarLineasConProducto(platoId: string) {
    return this.prisma.detalleEscandallo.findMany({
      where: { platoId },
      include: {
        producto: { select: { id: true, nombre: true, unidad: true, precioUnitario: true } },
      },
      orderBy: { producto: { nombre: 'asc' } },
    });
  }

  private async enriquecer(plato: any) {
    const detalles = await this.cargarLineasConProducto(plato.id);
    const calc = calcularEscandallo(
      detalles.map((d) => ({
        productoId: d.productoId,
        cantidad: Number(d.cantidad),
        mermaPorcentaje: Number(d.mermaPorcentaje),
        producto: {
          id: d.producto.id,
          nombre: d.producto.nombre,
          unidad: d.producto.unidad,
          precioUnitario: d.producto.precioUnitario,
        },
      })),
      plato.numRaciones,
      Number(plato.precioVenta),
    );
    return { ...plato, lineas: detalles, calc };
  }

  async create(dto: CreatePlatoDto) {
    // Validar productos existen
    const ids = dto.lineas.map((l) => l.productoId);
    if (ids.length > 0) {
      const count = await this.prisma.producto.count({
        where: { id: { in: ids } },
      });
      if (count !== ids.length) {
        throw new BadRequestException('Uno o más productos no existen');
      }
    }

    const plato = await this.prisma.$transaction(async (tx) => {
      const p = await tx.plato.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          numRaciones: dto.numRaciones,
          precioVenta: dto.precioVenta,
        },
      });
      if (dto.lineas.length > 0) {
        await tx.detalleEscandallo.createMany({
          data: dto.lineas.map((l) => ({
            platoId: p.id,
            productoId: l.productoId,
            cantidad: l.cantidad,
            mermaPorcentaje: l.mermaPorcentaje ?? 0,
          })),
        });
      }
      return p;
    });

    return this.enriquecer(plato);
  }

  async findAll() {
    const platos = await this.prisma.plato.findMany({
      orderBy: { nombre: 'asc' },
    });
    const enriquecidos = await Promise.all(platos.map((p) => this.enriquecer(p)));
    return enriquecidos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      numRaciones: p.numRaciones,
      precioVenta: p.precioVenta,
      numIngredientes: p.lineas.length,
      costePorRacion: p.calc.costePorRacion,
      margenBruto: p.calc.margenBruto,
      margenPorcentual: p.calc.margenPorcentual,
      foodCost: p.calc.foodCost,
    }));
  }

  async findOne(id: string) {
    const plato = await this.prisma.plato.findUnique({ where: { id } });
    if (!plato) throw new NotFoundException(`Plato ${id} no encontrado`);
    return this.enriquecer(plato);
  }

  async update(id: string, dto: UpdatePlatoDto) {
    await this.findOne(id);
    const data: Prisma.PlatoUpdateInput = {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      numRaciones: dto.numRaciones,
      precioVenta: dto.precioVenta,
    };
    const plato = await this.prisma.plato.update({
      where: { id },
      data,
    });
    return this.enriquecer(plato);
  }

  async updateLineas(
    id: string,
    lineas: { productoId: string; cantidad: number; mermaPorcentaje?: number }[],
  ) {
    await this.findOne(id);
    const ids = lineas.map((l) => l.productoId);
    if (ids.length > 0) {
      const count = await this.prisma.producto.count({
        where: { id: { in: ids } },
      });
      if (count !== ids.length) {
        throw new BadRequestException('Uno o más productos no existen');
      }
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.detalleEscandallo.deleteMany({ where: { platoId: id } });
      if (lineas.length > 0) {
        await tx.detalleEscandallo.createMany({
          data: lineas.map((l) => ({
            platoId: id,
            productoId: l.productoId,
            cantidad: l.cantidad,
            mermaPorcentaje: l.mermaPorcentaje ?? 0,
          })),
        });
      }
    });
    return this.findOne(id);
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const copia = await tx.plato.create({
        data: {
          nombre: `${original.nombre} (copia)`,
          descripcion: original.descripcion,
          numRaciones: original.numRaciones,
          precioVenta: original.precioVenta,
        },
      });
      if ((original as any).lineas?.length > 0) {
        await tx.detalleEscandallo.createMany({
          data: (original as any).lineas.map((l: any) => ({
            platoId: copia.id,
            productoId: l.productoId,
            cantidad: Number(l.cantidad),
            mermaPorcentaje: Number(l.mermaPorcentaje),
          })),
        });
      }
      return copia;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.plato.delete({ where: { id } });
  }
}