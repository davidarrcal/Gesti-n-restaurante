import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario } from '@prisma/client';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto, rol: RolUsuario = RolUsuario.COCINERO) {
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
      },
      select: { id: true, email: true, nombre: true, rol: true },
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
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
    });
  }

  private signToken(user: {
    id: string;
    email: string;
    nombre: string;
    rol: RolUsuario;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
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
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async updateRol(id: string, rol: RolUsuario) {
    return this.prisma.usuario.update({
      where: { id },
      data: { rol },
      select: { id: true, email: true, nombre: true, rol: true },
    });
  }

  async toggleActivo(id: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !user.activo },
      select: { id: true, email: true, nombre: true, rol: true, activo: true },
    });
  }
}