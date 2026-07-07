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
import { LoginDto, RegisterDto, CrearUsuarioDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('register')
  registrarRestaurante(@Body() dto: RegisterDto) {
    return this.service.registrarRestaurante(dto);
  }

  @Post('usuarios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN)
  crearUsuario(@Body() dto: CrearUsuarioDto, @Request() req: any) {
    return this.service.crearUsuario(dto, RolUsuario.COCINERO, req.user.restauranteId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req: any) {
    return this.service.me(req.user.id);
  }

  @Get('usuarios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  findAll(@Request() req: any) {
    return this.service.findAll(req.user.restauranteId);
  }

  @Patch('usuarios/:id/rol')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN)
  updateRol(
    @Param('id') id: string,
    @Body() body: { rol: RolUsuario },
    @Request() req: any,
  ) {
    return this.service.updateRol(id, body.rol, req.user.restauranteId);
  }

  @Patch('usuarios/:id/activo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolUsuario.ADMIN)
  toggleActivo(@Param('id') id: string, @Request() req: any) {
    return this.service.toggleActivo(id, req.user.restauranteId);
  }
}