import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario } from '@prisma/client';
import { LoginDto, RegisterDto, CrearUsuarioDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async registrarRestaurante(dto: RegisterDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const restaurante = await this.prisma.restaurante.create({
      data: { nombre: dto.restauranteNombre || `Restaurante de ${dto.nombre}` },
    });

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        rol: RolUsuario.ADMIN,
        restauranteId: restaurante.id,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        restauranteId: true,
        restaurante: { select: { nombre: true } },
      },
    });

    return this.signToken(user);
  }

  async crearUsuario(
    dto: CrearUsuarioDto,
    rol: RolUsuario,
    restauranteId: string,
  ) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        rol,
        restauranteId,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        restauranteId: true,
      },
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { restaurante: { select: { nombre: true } } },
    });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.signToken({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      restauranteId: user.restauranteId,
      restaurante: user.restaurante,
    });
  }

  private signToken(user: {
    id: string;
    email: string;
    nombre: string;
    rol: RolUsuario;
    restauranteId: string;
    restaurante?: { nombre: string } | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      restauranteId: user.restauranteId,
    };

    const expiresIn = (this.config.get<string>('JWT_EXPIRES_IN') || '7d') as any;

    const token = this.jwt.sign(payload, { expiresIn });
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        restauranteId: user.restauranteId,
        restaurante: user.restaurante ?? null,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        restauranteId: true,
        restaurante: { select: { nombre: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findAll(restauranteId: string) {
    return this.prisma.usuario.findMany({
      where: { restauranteId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async updateRol(id: string, rol: RolUsuario, restauranteId: string) {
    const target = await this.prisma.usuario.findUnique({ where: { id } });
    if (!target || target.restauranteId !== restauranteId) {
      throw new NotFoundException('Usuario no encontrado en tu restaurante');
    }
    return this.prisma.usuario.update({
      where: { id },
      data: { rol },
      select: { id: true, email: true, nombre: true, rol: true },
    });
  }

  async toggleActivo(id: string, restauranteId: string) {
    const target = await this.prisma.usuario.findUnique({ where: { id } });
    if (!target || target.restauranteId !== restauranteId) {
      throw new NotFoundException('Usuario no encontrado en tu restaurante');
    }
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !target.activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
      },
    });
  }
}