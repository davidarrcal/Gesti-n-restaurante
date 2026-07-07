import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProveedorDto, restauranteId: string) {
    return this.prisma.proveedor.create({
      data: { ...dto, restaurante: { connect: { id: restauranteId } } },
    });
  }

  findAll(q: string | undefined, restauranteId: string) {
    const where: any = { restauranteId };
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    return this.prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string, restauranteId: string) {
    const prov = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!prov || prov.restauranteId !== restauranteId)
      throw new NotFoundException(`Proveedor ${id} no encontrado`);
    return prov;
  }

  update(id: string, dto: UpdateProveedorDto, restauranteId: string) {
    return this.prisma.proveedor.update({ where: { id }, data: dto });
  }

  async remove(id: string, restauranteId: string) {
    await this.findOne(id, restauranteId);
    return this.prisma.proveedor.delete({ where: { id } });
  }
}