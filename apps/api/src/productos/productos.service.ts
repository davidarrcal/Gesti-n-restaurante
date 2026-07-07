import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltroProductoDto, FiltroCaducidad } from './dto/filtro-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductoDto, restauranteId: string) {
    const data: Prisma.ProductoCreateInput = {
      nombre: dto.nombre,
      categoria: dto.categoria,
      unidad: dto.unidad,
      pesoUnitario: dto.pesoUnitario,
      precioUnitario: dto.precioUnitario,
      stockMinimo: dto.stockMinimo ?? 0,
      stockActual: 0,
      fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
      proveedor: dto.proveedorId
        ? { connect: { id: dto.proveedorId } }
        : undefined,
      restaurante: { connect: { id: restauranteId } },
    };
    return this.prisma.producto.create({ data, include: { proveedor: true } });
  }

  async findAll(f: FiltroProductoDto = {}, restauranteId: string) {
    const diasProximo = 7;
    const ahora = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + diasProximo);

    const where: Prisma.ProductoWhereInput = { restauranteId };

    if (f.q) {
      where.OR = [
        { nombre: { contains: f.q, mode: 'insensitive' } },
        { categoria: { contains: f.q, mode: 'insensitive' } },
      ];
    }
    if (f.categoria) where.categoria = { equals: f.categoria };
    if (f.proveedorId) where.proveedorId = f.proveedorId;
    if (f.unidad) where.unidad = f.unidad;

    if (f.caducidad) {
      switch (f.caducidad) {
        case FiltroCaducidad.CADUCADOS:
          where.fechaCaducidad = { lt: ahora };
          break;
        case FiltroCaducidad.PROXIMOS:
          where.fechaCaducidad = { gte: ahora, lte: limite };
          break;
        case FiltroCaducidad.TODOS:
          break;
      }
    }

    const items = await this.prisma.producto.findMany({
      where,
      include: { proveedor: true },
      orderBy: { nombre: 'asc' },
    });

    return items.map((p) => ({
      ...p,
      stockBajoMinimo: Number(p.stockActual) <= Number(p.stockMinimo),
      caducado: p.fechaCaducidad ? p.fechaCaducidad < ahora : false,
    }));
  }

  async findOne(id: string, restauranteId: string) {
    const prod = await this.prisma.producto.findUnique({
      where: { id },
      include: { proveedor: true },
    });
    if (!prod || prod.restauranteId !== restauranteId)
      throw new NotFoundException(`Producto ${id} no encontrado`);
    return prod;
  }

  async historial(
    id: string,
    restauranteId: string,
    desde?: string,
    hasta?: string,
  ) {
    await this.findOne(id, restauranteId);
    const where: Prisma.MovimientoWhereInput = {
      productoId: id,
      restauranteId,
    };
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) where.fecha.lte = new Date(hasta);
    }
    return this.prisma.movimiento.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 200,
    });
  }

  update(id: string, dto: UpdateProductoDto, restauranteId: string) {
    const data: Prisma.ProductoUpdateInput = {
      nombre: dto.nombre,
      categoria: dto.categoria,
      unidad: dto.unidad,
      pesoUnitario: dto.pesoUnitario,
      precioUnitario: dto.precioUnitario,
      stockMinimo: dto.stockMinimo,
      fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
      proveedor: dto.proveedorId
        ? { connect: { id: dto.proveedorId } }
        : { disconnect: true },
    };
    return this.prisma.producto.update({
      where: { id },
      data,
      include: { proveedor: true },
    });
  }

  async remove(id: string, restauranteId: string) {
    await this.findOne(id, restauranteId);
    return this.prisma.producto.delete({ where: { id } });
  }
}