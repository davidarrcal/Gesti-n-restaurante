import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProveedorDto) {
    return this.prisma.proveedor.create({ data: dto });
  }

  findAll(q?: string) {
    const where = q
      ? {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    return this.prisma.proveedor.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const prov = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!prov) throw new NotFoundException(`Proveedor ${id} no encontrado`);
    return prov;
  }

  update(id: string, dto: UpdateProveedorDto) {
    return this.prisma.proveedor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.proveedor.delete({ where: { id } });
  }
}