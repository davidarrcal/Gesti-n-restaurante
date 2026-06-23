import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { RolUsuario } from '@prisma/client';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN)
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto, RolUsuario.COCINERO);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req: any) {
    return this.service.me(req.user.id);
  }

  @Get('usuarios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  findAll() {
    return this.service.findAll();
  }

  @Patch('usuarios/:id/rol')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN)
  updateRol(@Param('id') id: string, @Body() body: { rol: RolUsuario }) {
    return this.service.updateRol(id, body.rol);
  }

  @Patch('usuarios/:id/activo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN)
  toggleActivo(@Param('id') id: string) {
    return this.service.toggleActivo(id);
  }
}