import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AsistenteService } from './asistente.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ia')
@UseGuards(AuthGuard('jwt'))
export class AsistenteController {
  constructor(private readonly service: AsistenteService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Request() req: any) {
    const user = req.user;
    try {
      return await this.service.chat(
        dto.message,
        dto.history ?? [],
        dto.contexto ?? '',
        { id: user.id, nombre: user.email, rol: user.rol, restauranteId: user.restauranteId },
      );
    } catch (err: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: err.message ?? 'Error en el asistente de IA',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}